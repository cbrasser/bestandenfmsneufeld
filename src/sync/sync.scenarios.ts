// Runs sync-scenarios/scenarios.json against the real sync module and local Supabase.
// The steps are explained in sync-scenarios/README.md. Start with `npm run test:sync`.

import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import table from '../../sync-scenarios/scenarios.json';
import { isSubject, type StudentData } from '../types';
import { STORAGE_KEY } from '../utils/storage';
import { generateCode } from './code';
import { createSyncEngine, type SyncEngine, type SyncRemote } from './engine';
import { createMemoryStorage } from './memoryStorage';
import { createSupabaseRemote } from './supabaseRemote';
import { createWebSyncStore } from './webStore';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a step is whatever the table says
type Step = Record<string, any>;

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// These scenarios write to the database, so never let them near anything but this machine
if (!url || !anonKey || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname)) {
  throw new Error(`Scenarios only run against local Supabase, not ${url}. Use: npm run test:sync`);
}

const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const cloud = createSupabaseRemote(client);

// The subject that scenario grades go in; the fixtures name it
const GRADE_SUBJECT = 'deutsch';

function gradesOf(data: StudentData | null): number[] {
  const subject = data?.years[1].subjects.find((s) => s.id === GRADE_SUBJECT);
  return subject && isSubject(subject) ? subject.grades.map((g) => g.value) : [];
}

function withGrades(data: StudentData, values: number[]): StudentData {
  const next = structuredClone(data);
  const subject = next.years[1].subjects.find((s) => s.id === GRADE_SUBJECT);
  if (!subject || !isSubject(subject)) throw new Error(`Fixture has no subject ${GRADE_SUBJECT}`);
  subject.grades = values.map((value, i) => ({ id: `grade-${i}-${value}`, value, weight: 1 }));
  return next;
}

function withName(data: StudentData, name: string | undefined): StudentData {
  return name === undefined || !data.studentInfo
    ? data
    : { ...data, studentInfo: { ...data.studentInfo, name } };
}

/** One browser: its own storage and sync engine, with a switch to cut it off from the cloud. */
function createDevice() {
  const storage = createMemoryStorage();
  const store = createWebSyncStore(() => storage);
  const offlineGuard = <T>(call: () => Promise<T>) =>
    device.offline ? Promise.reject(new Error('offline')) : call();
  const remote: SyncRemote = {
    createAccount: (code, data) => offlineGuard(() => cloud.createAccount(code, data)),
    delete: (code) => offlineGuard(() => cloud.delete(code)),
    load: (code) => offlineGuard(() => cloud.load(code)),
    save: (code, data, version) => offlineGuard(() => cloud.save(code, data, version)),
  };
  const device = {
    store,
    offline: false,
    engine: null as SyncEngine | null,
    restart() {
      device.engine = createSyncEngine({ store, remote });
      device.engine.noteLocalChange();
      return device.engine;
    },
    setData(data: StudentData) {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
  };
  return device;
}

type Device = ReturnType<typeof createDevice>;

async function runScenario(steps: Step[]) {
  const devices = new Map<string, Device>();
  const deviceFor = (name: string) => {
    if (!devices.has(name)) devices.set(name, createDevice());
    return devices.get(name)!;
  };
  const engineOf = (name: string) => {
    const engine = deviceFor(name).engine;
    if (!engine) throw new Error(`Device ${name} isn't open yet`);
    return engine;
  };
  let code = generateCode();
  const fixture = (name: string) => (table.fixtures as unknown as Record<string, StudentData>)[name];
  // The data a direct call sends: the cloud's, or a fixture's when there's no row to base it on
  const baseData = async () => (await cloud.load(code))?.data ?? fixture('fms-student');

  for (const step of steps) {
    switch (step.action) {
      case 'open': {
        const device = deviceFor(step.device);
        if (step.fixture) device.setData(fixture(step.fixture));
        await device.restart().sync();
        break;
      }
      case 'createCode':
        code = await engineOf(step.device).createAccount();
        break;
      case 'connect': {
        const device = deviceFor(step.device);
        const engine = device.engine ?? device.restart();
        const result = await engine.connect(step.code ?? code);
        expect(result).toBe(step.result ?? 'connected');
        break;
      }
      case 'addGrade': {
        const device = deviceFor(step.device);
        const data = device.store.readData()!;
        device.setData(withGrades(data, [...gradesOf(data), step.value]));
        expect(engineOf(step.device).noteLocalChange()).toBe(true);
        break;
      }
      case 'enterName': {
        const device = deviceFor(step.device);
        device.setData(withName(device.store.readData()!, step.name));
        expect(engineOf(step.device).noteLocalChange()).toBe(false);
        break;
      }
      case 'deleteCloudData':
        expect(await engineOf(step.device).deleteCloudData()).toBe(step.result ?? 'deleted');
        break;
      case 'saveDelayElapsed':
      case 'focus':
        await engineOf(step.device).sync();
        break;
      case 'setOffline':
        deviceFor(step.device).offline = step.offline;
        break;
      case 'expectDevice': {
        const { code: connectedCode, status, failure, version, unsynced } = engineOf(step.device).getSnapshot();
        const data = deviceFor(step.device).store.readData();
        const actual: Step = {
          connected: connectedCode !== null,
          status,
          failure,
          version,
          unsynced,
          grades: gradesOf(data),
          name: data?.studentInfo?.name ?? null,
        };
        for (const key of Object.keys(actual)) {
          if (key in step) expect(actual[key], key).toEqual(step[key]);
        }
        break;
      }
      case 'expectCloud': {
        const row = await cloud.load(step.code ?? code);
        if (step.exists === false) {
          expect(row).toBeNull();
          break;
        }
        expect(row).not.toBeNull();
        if ('version' in step) expect(row!.version).toBe(step.version);
        if ('grades' in step) expect(gradesOf(row!.data)).toEqual(step.grades);
        if ('name' in step) expect(row!.data.studentInfo?.name ?? null).toBe(step.name);
        if ('division' in step) expect(row!.data.studentInfo?.division).toBe(step.division);
        break;
      }
      case 'createCall':
        await cloud.createAccount(code, fixture(step.fixture));
        break;
      case 'saveCall': {
        const data = withName(withGrades(await baseData(), step.grades), step.name);
        const result = await cloud.save(step.code ?? code, data, step.expectedVersion);
        expect(result).toMatchObject(step.result);
        break;
      }
      case 'deleteCall':
        expect(await cloud.delete(step.code ?? code)).toBe(step.result);
        break;
      case 'parallelSaveCalls': {
        const base = await baseData();
        const results = await Promise.all(
          (step.grades as number[][]).map((grades) => cloud.save(code, withGrades(base, grades), step.expectedVersion))
        );
        expect(results.map((r) => r.status).sort()).toEqual(step.statuses);
        break;
      }
      case 'legacySave': {
        const data = withName(withGrades(await baseData(), step.grades), step.name);
        const { data: ok, error } = await client.rpc('save_data', { p_code: step.code ?? code, p_data: data });
        expect(error).toBeNull();
        expect(ok).toBe(step.result);
        break;
      }
      case 'legacyLoad': {
        const { data, error } = await client.rpc('load_data', { p_code: step.code ?? code });
        expect(error).toBeNull();
        if (step.exists === false) expect(data).toBeNull();
        else expect(gradesOf(data as StudentData)).toEqual(step.grades);
        break;
      }
      default:
        throw new Error(`Unknown step: ${step.action}`);
    }
  }
}

describe('sync scenarios', () => {
  for (const scenario of table.scenarios) {
    it(scenario.name, () => runScenario(scenario.steps));
  }
});
