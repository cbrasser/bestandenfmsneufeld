// Rehearses the launch on local Supabase, from a database shaped like production: the historical
// schema.sql and admin.sql with made-up rows, and no migration history. Start with
// `npm run rehearse:launch`. It leaves the local database in that shape; the next command resets it.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { afterAll, describe, expect, it } from 'vitest';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

// This replaces the whole public schema, so never let it near anything but this machine
const isLocal = (address: string | undefined) =>
  !!address && ['127.0.0.1', 'localhost'].includes(new URL(address).hostname);
if (!anonKey || !isLocal(url) || !isLocal(dbUrl)) {
  throw new Error(`The rehearsal only runs against local Supabase, not ${url} and ${dbUrl}. Use: npm run rehearse:launch`);
}

const client = createClient(url!, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const SUPABASE_DIR = path.resolve(import.meta.dirname, '..');
const DB_CONTAINER = 'supabase_db_bestanden'; // from project_id in config.toml

const sqlFile = (relativePath: string) => readFileSync(path.join(SUPABASE_DIR, relativePath), 'utf8');

/**
 * Sends a whole script as one string, which is what the Supabase SQL Editor does and so how the owner
 * will run these files. The container's psql is on the local stack by construction.
 */
function psql(script: string): string {
  return execFileSync(
    'docker',
    ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-At', '-v', 'ON_ERROR_STOP=1', '-c', script],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

function rowsOf<T>(query: string): T[] {
  return JSON.parse(psql(`select coalesce(json_agg(t), '[]') from (${query}) t`)) as T[];
}

/** PostgREST caches the schema, so a script that changes functions needs it refreshed. */
async function reloadApi(expectedFunction: string) {
  psql(`notify pgrst, 'reload schema'`);
  for (let tries = 0; tries < 60; tries += 1) {
    const { error } = await client.rpc(expectedFunction, { p_code: UNKNOWN_CODE });
    if (error?.code !== 'PGRST202') return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The API never saw ${expectedFunction}.`);
}

const SAVE_DATA_DEFINITION = `
  select pg_get_functiondef(oid) as definition, proacl::text as grants
  from pg_proc where oid = 'public.save_data(text,jsonb)'::regprocedure`;

/** What check.sql reports, as an object. */
const check = () =>
  Object.fromEntries(
    rowsOf<{ fact: string; value: string }>(sqlFile('launch/check.sql').trim().replace(/;$/, '')).map((r) => [r.fact, r.value])
  );

const ADMIN_KEY = 'made-up-admin-key';

async function adminStats() {
  const { data, error } = await client.rpc('admin_stats', { p_key: ADMIN_KEY });
  expect(error).toBeNull();
  const stats = { ...(data as Record<string, unknown>) };
  delete stats.generatedAt; // differs on every call
  return stats;
}

const RECENT = { createdAt: `now() - interval '10 days'`, updatedAt: `now() - interval '5 days'` };
const LONG_AGO = { createdAt: `now() - interval '200 days'`, updatedAt: `now() - interval '90 days'` };

/** All made up. `afterLaunch` is what must be left of `data`, written out rather than worked out. */
const ROWS: { code: string; when: typeof RECENT; data: string; afterLaunch: string }[] = [
  {
    code: 'ORDINARYFMS00001',
    when: RECENT,
    data: `{"studentInfo":{"name":"Made Up Student","division":"FMS","berufsfeld":"gesundheit"},"currentYear":1,"years":{"1":{"subjects":[{"id":"deutsch","name":"Deutsch","grades":[{"id":"g1","value":4.5,"weight":1,"label":"Aufsatz"},{"id":"g2","value":5,"weight":1}]},{"id":"nw","name":"Naturwissenschaften","subjects":[{"id":"bio","name":"Biologie","grades":[{"id":"g3","value":3.5,"weight":2}]}],"unassignedGrades":[{"id":"g4","value":6,"weight":1}]}]}}}`,
    afterLaunch: `{"studentInfo":{"division":"FMS","berufsfeld":"gesundheit"},"currentYear":1,"years":{"1":{"subjects":[{"id":"deutsch","name":"Deutsch","grades":[{"id":"g1","value":4.5,"weight":1,"label":"Aufsatz"},{"id":"g2","value":5,"weight":1}]},{"id":"nw","name":"Naturwissenschaften","subjects":[{"id":"bio","name":"Biologie","grades":[{"id":"g3","value":3.5,"weight":2}]}],"unassignedGrades":[{"id":"g4","value":6,"weight":1}]}]}}}`,
  },
  {
    code: 'INACTIVEGYM00001',
    when: LONG_AGO,
    data: `{"studentInfo":{"name":"Long Gone","division":"Gymnasium"},"years":{"2":{"subjects":[{"id":"mathe","name":"Mathematik","grades":[{"id":"g1","value":4.25,"weight":1}]}]}}}`,
    afterLaunch: `{"studentInfo":{"division":"Gymnasium"},"years":{"2":{"subjects":[{"id":"mathe","name":"Mathematik","grades":[{"id":"g1","value":4.25,"weight":1}]}]}}}`,
  },
  {
    code: 'LONGDECIMAL00001',
    when: RECENT,
    data: `{"studentInfo":{"name":"Many Digits","division":"FMS"},"years":{"1":{"subjects":[{"name":"Chemie","grades":[{"value":4.123456789012345678901234}]}]}}}`,
    afterLaunch: `{"studentInfo":{"division":"FMS"},"years":{"1":{"subjects":[{"name":"Chemie","grades":[{"value":4.123456789012345678901234}]}]}}}`,
  },
  {
    code: 'BROKENGRADES0001',
    when: RECENT,
    data: `{"studentInfo":{"name":"Broken Grades"},"years":{"1":{"subjects":[{"name":"Kaputt","grades":[{"value":"5"},{"value":7},{"value":null},"x"]},"kein Fach",{"name":"Ohne Noten"}]},"2":"kein Jahr","9":{"subjects":[{"name":"Jahr neun","grades":[{"value":4}]}]}}}`,
    afterLaunch: `{"studentInfo":{},"years":{"1":{"subjects":[{"name":"Kaputt","grades":[{"value":"5"},{"value":7},{"value":null},"x"]},"kein Fach",{"name":"Ohne Noten"}]},"2":"kein Jahr","9":{"subjects":[{"name":"Jahr neun","grades":[{"value":4}]}]}}}`,
  },
  // A name that is there but odd is still removed
  { code: 'NAMEISNULL000001', when: RECENT, data: `{"studentInfo":{"name":null,"division":"FMS"}}`, afterLaunch: `{"studentInfo":{"division":"FMS"}}` },
  { code: 'NAMEISEMPTY00001', when: RECENT, data: `{"studentInfo":{"name":""}}`, afterLaunch: `{"studentInfo":{}}` },
  { code: 'NAMEISOBJECT0001', when: RECENT, data: `{"studentInfo":{"name":{"first":"Odd"}}}`, afterLaunch: `{"studentInfo":{}}` },
  // Nothing to remove, or data of a shape where trying to would make Postgres raise an error
  { code: 'NONAME0000000001', when: RECENT, data: `{"studentInfo":{"division":"FMS"},"years":{}}`, afterLaunch: `{"studentInfo":{"division":"FMS"},"years":{}}` },
  { code: 'NOSTUDENTINFO001', when: RECENT, data: `{"years":{}}`, afterLaunch: `{"years":{}}` },
  { code: 'INFOISNULL000001', when: RECENT, data: `{"studentInfo":null}`, afterLaunch: `{"studentInfo":null}` },
  { code: 'INFOISSTRING0001', when: RECENT, data: `{"studentInfo":"name"}`, afterLaunch: `{"studentInfo":"name"}` },
  { code: 'INFOISARRAY00001', when: RECENT, data: `{"studentInfo":["name"]}`, afterLaunch: `{"studentInfo":["name"]}` },
  { code: 'INFOISNUMBER0001', when: RECENT, data: `{"studentInfo":5}`, afterLaunch: `{"studentInfo":5}` },
  { code: 'EMPTYOBJECT00001', when: RECENT, data: `{}`, afterLaunch: `{}` },
  { code: 'ROOTISARRAY00001', when: RECENT, data: `[{"studentInfo":{"name":"In An Array"}}]`, afterLaunch: `[{"studentInfo":{"name":"In An Array"}}]` },
  { code: 'ROOTISSTRING0001', when: RECENT, data: `"name"`, afterLaunch: `"name"` },
  { code: 'ROOTISNUMBER0001', when: RECENT, data: `5`, afterLaunch: `5` },
  { code: 'ROOTISNULL000001', when: RECENT, data: `null`, afterLaunch: `null` },
  // Only studentInfo.name is the student's name
  { code: 'NAMEELSEWHERE001', when: RECENT, data: `{"name":"Not The Student"}`, afterLaunch: `{"name":"Not The Student"}` },
  // For the steps that write: an old cached website copy, and a device that knows its version
  { code: 'STALETAB00000001', when: RECENT, data: `{"studentInfo":{"name":"Stale Tab"},"years":{}}`, afterLaunch: `{"studentInfo":{},"years":{}}` },
];

const STALE_TAB = 'STALETAB00000001';
const UNKNOWN_CODE = 'NOSUCHCODE000000';
const OLD_COPY_SAVE = { studentInfo: { name: 'Stale Tab' }, years: { 1: { subjects: [] } } };

type Row = { code_hash: string; data: unknown; data_text: string; version: number; created_at: string; updated_at: string };

const rowsNow = () =>
  rowsOf<Row>(`select code_hash, data, data::text as data_text, version, created_at, updated_at from public.students order by code_hash`);

const hashOf = (code: string) => psql(`select public.hash_code('${code}')`).trim();

const rowOf = (code: string, rows = rowsNow()) => rows.find((r) => r.code_hash === hashOf(code))!;

/** What must be left of a made-up row after the launch. */
const afterLaunchOf = (code: string) => JSON.parse(ROWS.find((row) => row.code === code)!.afterLaunch);

/** Where the additive scripts have run, every row knows its version; the launch must not move these. */
let beforeLaunch: Row[];
let statsBeforeLaunch: Record<string, unknown>;
let checkBeforeLaunch: Record<string, string>;
let originalSaveData: unknown[];

const backupDir = mkdtempSync(path.join(tmpdir(), 'bestanden-rehearsal-'));
afterAll(() => rmSync(backupDir, { recursive: true, force: true }));

/** Runs a command the way README.md gives it to the owner. The text is repeated here, not read from there. */
const sh = (command: string) =>
  execFileSync('sh', ['-c', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DB_URL: dbUrl, BACKUP_DIR: backupDir, RESTORE_FROM: backupDir },
  });

describe('a database shaped like production', () => {
  it('starts from the historical schema, with no migration history and no version column', async () => {
    psql(`
      do $$
      declare r record;
      begin
        for r in select oid::regclass as t from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' loop
          execute format('drop table %s cascade', r.t);
        end loop;
        for r in select oid::regprocedure as f from pg_proc where pronamespace = 'public'::regnamespace loop
          execute format('drop function %s cascade', r.f);
        end loop;
      end $$;
      delete from supabase_migrations.schema_migrations;
    `);
    psql(sqlFile('schema.sql'));
    psql(sqlFile('admin.sql'));
    await reloadApi('load_data');

    expect(rowsOf(`select column_name from information_schema.columns where table_schema = 'public' and table_name = 'students' and column_name = 'version'`)).toEqual([]);
    originalSaveData = rowsOf(SAVE_DATA_DEFINITION);
    expect(originalSaveData).toHaveLength(1);
  });

  it('holds made-up rows, of every shape a client could have sent', () => {
    const values = ROWS.map(
      ({ code, when, data }) =>
        `(public.hash_code('${code}'), $json$${data}$json$::jsonb, ${when.createdAt}, ${when.updatedAt})`
    ).join(',\n');
    psql(`insert into public.students (code_hash, data, created_at, updated_at) values ${values}`);
    psql(`insert into public.admin_keys (key_hash) values (public.hash_code('${ADMIN_KEY}'))`);

    expect(rowsOf(`select id from public.students`)).toHaveLength(ROWS.length);
  });
});

describe('the additive migrations', () => {
  it('apply to it, leave every row as it was, and put it at version 1', async () => {
    const before = rowsOf<Omit<Row, 'version'>>(`select code_hash, data, data::text as data_text, created_at, updated_at from public.students order by code_hash`);

    psql(sqlFile('migrations/20261104120000_students_version.sql'));
    psql(sqlFile('migrations/20261104130000_names_off_the_cloud.sql'));
    await reloadApi('load_student');

    const after = rowsNow();
    const withoutVersion = after.map((row) => {
      const copy: Partial<Row> = { ...row };
      delete copy.version;
      return copy;
    });
    expect(withoutVersion).toEqual(before);
    expect(after.every((row) => row.version === 1)).toBe(true);
  });

  it('leave the live site working: save_data writes, and raises the version', async () => {
    const { data, error } = await client.rpc('save_data', {
      p_code: STALE_TAB,
      p_data: JSON.parse(ROWS.find((row) => row.code === STALE_TAB)!.data),
    });
    expect(error).toBeNull();
    expect(data).toBe(true);

    expect(rowOf(STALE_TAB).version).toBe(2);
  });

  it('are confirmed by check.sql, which also says save_data is as the rollback will restore it', () => {
    expect(check()).toMatchObject({
      students: '20',
      students_with_name: '8',
      version_total: '21',
      save_data: 'original',
      version_trigger: 'enabled',
    });
  });

  it('keep admin_stats working, with numbers worked out by hand from the made-up rows', async () => {
    statsBeforeLaunch = await adminStats();
    expect(statsBeforeLaunch).toMatchObject({
      users: {
        total: 20,
        withGrades: 3,
        active30d: 19,
        new30d: 19,
        byDivision: { FMS: 4, Gymnasium: 1, Unbekannt: 15 },
      },
      grades: { total: 6, avg: 4.56, below4: 1 },
    });
  });
});

describe('the backup', () => {
  it('is taken with the commands in README.md, and holds every row and the names', () => {
    sh(`supabase db dump --db-url "$DB_URL" --data-only --schema public -f "$BACKUP_DIR/data.sql"`);
    sh(`supabase db dump --db-url "$DB_URL" --schema public -f "$BACKUP_DIR/schema.sql"`);

    const rowCount = sh(`awk '/^INSERT INTO "public"."students"/{f=1;next} /^$/{f=0} f' "$BACKUP_DIR/data.sql" | wc -l`).trim();
    expect(rowCount).toBe('20');
    expect(readFileSync(path.join(backupDir, 'data.sql'), 'utf8')).toContain('Made Up Student');
    expect(readFileSync(path.join(backupDir, 'schema.sql'), 'utf8')).toContain('"save_data"');

    beforeLaunch = rowsNow();
    checkBeforeLaunch = check();
  });
});

describe('the launch migration', () => {
  it('removes names and changes nothing else in the data', () => {
    psql(sqlFile('launch/launch.sql'));

    const after = rowsNow();
    expect(after).toHaveLength(ROWS.length);
    for (const { code, afterLaunch } of ROWS) {
      const row = rowOf(code, after);
      // Compared as database text, because numbers lose digits in JavaScript
      const expected = psql(`select $json$${afterLaunch}$json$::jsonb::text`).trim();
      expect(row?.data_text, code).toBe(expected);
    }
  });

  it('leaves version and last-changed time alone', () => {
    const facts = (rows: Row[]) => rows.map(({ code_hash, version, created_at, updated_at }) => ({ code_hash, version, created_at, updated_at }));
    expect(facts(rowsNow())).toEqual(facts(beforeLaunch));
  });

  it('is confirmed by check.sql: no names, disabled save_data, and nothing else moved', () => {
    expect(check()).toEqual({ ...checkBeforeLaunch, students_with_name: '0', save_data: 'disabled' });
  });

  it('can run again without changing anything', () => {
    const before = rowsNow();
    psql(sqlFile('launch/launch.sql'));
    expect(rowsNow()).toEqual(before);
  });

  it('gives an old website copy an error from save_data, which it shows as "sync failed", and writes nothing', async () => {
    const before = rowsNow();
    for (const code of [STALE_TAB, UNKNOWN_CODE]) {
      const { error } = await client.rpc('save_data', { p_code: code, p_data: OLD_COPY_SAVE });
      expect(error, code).not.toBeNull();
    }
    expect(rowsNow()).toEqual(before);
  });

  it('keeps load_data working for old copies, without the name', async () => {
    const code = 'INACTIVEGYM00001';
    const { data, error } = await client.rpc('load_data', { p_code: code });
    expect(error).toBeNull();
    expect(data).toEqual(afterLaunchOf(code));

    const unknown = await client.rpc('load_data', { p_code: UNKNOWN_CODE });
    expect(unknown.error).toBeNull();
    expect(unknown.data).toBeNull();
  });

  it('keeps admin_stats giving the same numbers, including who counts as active', async () => {
    expect(await adminStats()).toEqual(statsBeforeLaunch);
  });

  it('causes no false conflict: a device that saw the version before the launch can still save', async () => {
    const code = 'NONAME0000000001';
    const { version } = rowOf(code, beforeLaunch);

    const loaded = await client.rpc('load_student', { p_code: code });
    expect(loaded.error).toBeNull();
    expect(loaded.data.version).toBe(version);

    const { data, error } = await client.rpc('save_student', {
      p_code: code,
      p_data: { studentInfo: { name: 'New Upload', division: 'FMS' }, years: {} },
      p_expected_version: version,
    });
    expect(error).toBeNull();
    expect(data.status).toBe('saved');
    // The trigger is back on, and the server still keeps names out
    expect(data.version).toBe(version + 1);
    expect(rowOf(code).data).toEqual({ studentInfo: { division: 'FMS' }, years: {} });
  });

  it('gives new clients the same grades through load_student', async () => {
    const code = 'ORDINARYFMS00001';
    const { data } = await client.rpc('load_student', { p_code: code });
    expect(data.data).toEqual(afterLaunchOf(code));
  });
});

describe('the rollback', () => {
  it('restores save_data exactly, down to its grants', () => {
    expect(rowsOf(SAVE_DATA_DEFINITION)).not.toEqual(originalSaveData);

    psql(sqlFile('launch/rollback.sql'));

    expect(rowsOf(SAVE_DATA_DEFINITION)).toEqual(originalSaveData);
    expect(check().save_data).toBe('original');
  });

  it('does not bring the names back: only the backup holds them', () => {
    expect(check().students_with_name).toBe('0');
  });

  it('lets an old website copy save again', async () => {
    const before = rowOf(STALE_TAB);
    const { data, error } = await client.rpc('save_data', { p_code: STALE_TAB, p_data: OLD_COPY_SAVE });
    expect(error).toBeNull();
    expect(data).toBe(true);

    const after = rowOf(STALE_TAB);
    expect(after.version).toBe(before.version + 1);
    expect(after.data).toEqual(OLD_COPY_SAVE);
  });

  it('keeps load_data, admin_stats and the new calls working', async () => {
    expect((await client.rpc('load_data', { p_code: STALE_TAB })).error).toBeNull();
    expect((await client.rpc('load_student', { p_code: STALE_TAB })).error).toBeNull();
    expect(await adminStats()).toMatchObject({ users: { total: 20 } });
  });

  it('can be followed by the launch again, which removes the names uploaded in between', () => {
    expect(check().students_with_name).toBe('1');
    psql(sqlFile('launch/launch.sql'));
    expect(check()).toMatchObject({ students_with_name: '0', save_data: 'disabled' });
    psql(sqlFile('launch/rollback.sql'));
    expect(check().save_data).toBe('original');
  });
});

describe('check.sql', () => {
  it('warns when save_data is not what the rollback would restore', () => {
    psql(`
      create or replace function public.save_data(p_code text, p_data jsonb)
      returns boolean language plpgsql security definer set search_path = public, extensions
      as $$ begin return true; end; $$;
    `);
    expect(check().save_data).toBe('changed');
    psql(sqlFile('launch/rollback.sql'));
    expect(check().save_data).toBe('original');
  });
});

describe('restoring the backup, the last resort in README.md', () => {
  it('brings back every row as it was at backup time, names included', () => {
    // README.md starts psql with docker run, against production. Here the stack's own psql does it.
    sh(
      `(echo 'begin; truncate public.students, public.admin_keys;'; cat "$RESTORE_FROM/data.sql"; echo 'commit;') | ` +
        `docker exec -i ${DB_CONTAINER} psql -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 -f -`
    );

    expect(rowsNow()).toEqual(beforeLaunch);
    expect(check()).toMatchObject({ students_with_name: '8', version_trigger: 'enabled' });
  });
});
