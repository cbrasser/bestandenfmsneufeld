import { describe, expect, it } from 'vitest';
import type { StudentData } from '../types';
import { createSyncEngine, type CloudSnapshot, type SaveResult, type SyncRemote } from './engine';
import { createWebSyncStore } from './webStore';

// Timing the scenario table can't hold still: the remote's answers arrive when a test says so.
// Everything without a race in it belongs in sync-scenarios/scenarios.json.

const CODE = 'ABCDEFGHJKMNPQRS';

function student(label: string): StudentData {
  return {
    studentInfo: { name: label, division: 'FMS' },
    currentYear: 1,
    years: { 1: { subjects: [] }, 2: { subjects: [] }, 3: { subjects: [] }, 4: { subjects: [] } },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const saved = (version: number): SaveResult => ({ status: 'saved', version, updatedAt: '2026-11-04T12:00:00Z' });
const snapshot = (data: StudentData, version: number): CloudSnapshot => ({ data, version, updatedAt: '2026-11-04T12:00:00Z' });

function setup({ version = 1 as number | null, unsynced = false, code = CODE as string | null, data = student('local') } = {}) {
  const items = new Map<string, string>([['student-data', JSON.stringify(data)]]);
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
  const store = createWebSyncStore(() => storage);
  store.writeState({ code, version, unsynced });

  const saves: { data: StudentData; expectedVersion: number; answer: ReturnType<typeof deferred<SaveResult>> }[] = [];
  const loads: ReturnType<typeof deferred<CloudSnapshot | null>>[] = [];
  const remote: SyncRemote = {
    createAccount: async () => {},
    load: () => {
      const answer = deferred<CloudSnapshot | null>();
      loads.push(answer);
      return answer.promise;
    },
    save: (_code, sent, expectedVersion) => {
      const answer = deferred<SaveResult>();
      saves.push({ data: sent, expectedVersion, answer });
      return answer.promise;
    },
  };

  const engine = createSyncEngine({ store, remote });
  engine.noteLocalChange();
  const edit = (label: string) => {
    items.set('student-data', JSON.stringify(student(label)));
    return engine.noteLocalChange();
  };
  const localName = () => store.readData()?.studentInfo?.name;
  return { engine, store, items, saves, loads, edit, localName };
}

// Lets a run get past the awaits it can already get past
const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('sync engine', () => {
  it('sends one save for overlapping sync calls, so a device never conflicts with itself', async () => {
    const { engine, edit, saves } = setup();
    edit('edited');

    const first = engine.sync();
    const second = engine.sync();
    await settle();
    expect(saves).toHaveLength(1);

    saves[0].answer.resolve(saved(2));
    await Promise.all([first, second]);
    expect(saves).toHaveLength(1);
    expect(engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
  });

  it('saves again, at the new version, when an edit arrives during a save', async () => {
    const { engine, edit, saves } = setup();
    edit('first');
    const done = engine.sync();
    await settle();

    edit('second');
    saves[0].answer.resolve(saved(2));
    await settle();

    expect(saves).toHaveLength(2);
    expect(saves[1].expectedVersion).toBe(2);
    expect(saves[1].data.studentInfo?.name).toBe('second');

    saves[1].answer.resolve(saved(3));
    await done;
    expect(engine.getSnapshot()).toMatchObject({ status: 'saved', version: 3, unsynced: false });
  });

  it('keeps an edit made during a pull instead of replacing it with the cloud data', async () => {
    const { engine, edit, saves, loads, localName } = setup();
    const done = engine.sync();
    await settle();

    edit('edited');
    loads[0].resolve(snapshot(student('cloud'), 2));
    await settle();

    expect(localName()).toBe('edited');
    expect(saves).toHaveLength(1);
    saves[0].answer.resolve({ status: 'conflict', version: 2, updatedAt: '2026-11-04T12:00:00Z' });
    await done;
    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'conflict', unsynced: true });
  });

  it('does not count cloud data as a local edit, so it is never pushed back', async () => {
    const { engine, loads, localName } = setup();
    const done = engine.sync();
    loads[0].resolve(snapshot(student('cloud'), 2));
    await done;

    expect(localName()).toBe('cloud');
    expect(engine.noteLocalChange()).toBe(false);
    expect(engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
  });

  it('ignores the answer to a save when the device disconnected meanwhile', async () => {
    const { engine, edit, saves, localName } = setup();
    edit('edited');
    const done = engine.sync();
    await settle();

    engine.disconnect();
    saves[0].answer.resolve(saved(2));
    await done;

    expect(engine.getSnapshot()).toMatchObject({ code: null, version: null, unsynced: false, status: 'idle' });
    expect(localName()).toBe('edited');
  });

  it('never syncs a device without a profile, such as one in onboarding after a reset', async () => {
    const { engine, items, saves, loads } = setup({ unsynced: true });
    items.set('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));

    expect(engine.noteLocalChange()).toBe(false);
    await engine.sync();

    expect(saves).toHaveLength(0);
    expect(loads).toHaveLength(0);
  });

  it('does not treat a new profile after a reset as an edit', () => {
    const { engine, items, edit } = setup();
    items.set('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));
    engine.noteLocalChange();

    expect(edit('new profile')).toBe(false);
    expect(edit('real edit')).toBe(true);
  });

  it('touches nothing on a device connected before versions existed, whichever side is newer', async () => {
    const { engine, edit, saves, loads, localName } = setup({ version: null });
    const pulled = engine.sync();
    loads[0].resolve(snapshot(student('cloud'), 5));
    await pulled;

    expect(localName()).toBe('local');
    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'no_version', version: null });

    edit('edited');
    await engine.sync();
    expect(saves).toHaveLength(0);
    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'no_version', unsynced: true });
  });

  it('only marks data unsynced while connected', () => {
    const { engine, edit } = setup({ code: null, version: null });
    expect(edit('edited')).toBe(false);
    expect(engine.getSnapshot().unsynced).toBe(false);
  });

  it('remembers the code, version and unsynced changes across a restart', async () => {
    const { engine, store, edit } = setup();
    edit('edited');
    expect(engine.getSnapshot().unsynced).toBe(true);

    const restarted = createSyncEngine({ store, remote: { createAccount: async () => {}, load: async () => null, save: async () => saved(2) } });
    expect(restarted.getSnapshot()).toMatchObject({ code: CODE, version: 1, unsynced: true });
    await restarted.sync();
    expect(restarted.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
  });
});
