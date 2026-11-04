import { describe, expect, it } from 'vitest';
import type { StudentData } from '../types';
import { createSyncEngine, type CloudSnapshot, type SaveResult, type SyncRemote } from './engine';
import { createMemoryStorage } from './memoryStorage';
import { createWebSyncStore } from './webStore';

// What the scenario table can't reach: races, where the remote's answers arrive when a test says so,
// and local states and cloud data no scenario step can produce. The rest belongs in
// sync-scenarios/scenarios.json.

const CODE = 'ABCDEFGHJKMNPQRS';

// The label tells versions of the data apart. It can't be the name, which is no edit.
function student(label: string, name: string | null = 'Local name'): StudentData {
  return {
    studentInfo: { ...(name && { name }), division: 'FMS' },
    gymProfile: { spf: label },
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
  const items = createMemoryStorage();
  items.setItem('student-data', JSON.stringify(data));
  const store = createWebSyncStore(() => items);
  store.writeState({ code, version, unsynced });

  const saves: { data: StudentData; expectedVersion: number; answer: ReturnType<typeof deferred<SaveResult>> }[] = [];
  const loads: ReturnType<typeof deferred<CloudSnapshot | null>>[] = [];
  const remote: SyncRemote = {
    createAccount: async () => {},
    delete: async () => true,
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
    items.setItem('student-data', JSON.stringify(student(label)));
    return engine.noteLocalChange();
  };
  const localLabel = () => store.readData()?.gymProfile?.spf;
  const localName = () => store.readData()?.studentInfo?.name;
  return { engine, store, items, remote, saves, loads, edit, localLabel, localName };
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
    expect(saves[1].data.gymProfile?.spf).toBe('second');

    saves[1].answer.resolve(saved(3));
    await done;
    expect(engine.getSnapshot()).toMatchObject({ status: 'saved', version: 3, unsynced: false });
  });

  it('keeps an edit made during a pull instead of replacing it with the cloud data', async () => {
    const { engine, edit, saves, loads, localLabel } = setup();
    const done = engine.sync();
    await settle();

    edit('edited');
    loads[0].resolve(snapshot(student('cloud'), 2));
    await settle();

    expect(localLabel()).toBe('edited');
    expect(saves).toHaveLength(1);
    saves[0].answer.resolve({ status: 'conflict', version: 2, updatedAt: '2026-11-04T12:00:00Z' });
    await done;
    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'conflict', unsynced: true });
  });

  it('does not count cloud data as a local edit, so it is never pushed back', async () => {
    const { engine, loads, localLabel } = setup();
    const done = engine.sync();
    loads[0].resolve(snapshot(student('cloud'), 2));
    await done;

    expect(localLabel()).toBe('cloud');
    expect(engine.noteLocalChange()).toBe(false);
    expect(engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
  });

  it('ignores the answer to a save when the device disconnected meanwhile', async () => {
    const { engine, edit, saves, localLabel } = setup();
    edit('edited');
    const done = engine.sync();
    await settle();

    engine.disconnect();
    saves[0].answer.resolve(saved(2));
    await done;

    expect(engine.getSnapshot()).toMatchObject({ code: null, version: null, unsynced: false, status: 'idle' });
    expect(localLabel()).toBe('edited');
  });

  it('never syncs a device without a profile, such as one in onboarding after a reset', async () => {
    const { engine, items, saves, loads } = setup({ unsynced: true });
    items.setItem('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));

    expect(engine.noteLocalChange()).toBe(false);
    await engine.sync();

    expect(saves).toHaveLength(0);
    expect(loads).toHaveLength(0);
  });

  it('does not treat a new profile after a reset as an edit', () => {
    const { engine, items, edit } = setup();
    items.setItem('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));
    engine.noteLocalChange();

    expect(edit('new profile')).toBe(false);
    expect(edit('real edit')).toBe(true);
  });

  it('touches nothing on a device connected before versions existed, whichever side is newer', async () => {
    const { engine, edit, saves, loads, localLabel } = setup({ version: null });
    const pulled = engine.sync();
    loads[0].resolve(snapshot(student('cloud'), 5));
    await pulled;

    expect(localLabel()).toBe('local');
    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'no_version', version: null });

    edit('edited');
    await engine.sync();
    expect(saves).toHaveLength(0);
    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'no_version', unsynced: true });
  });

  it('drops unsynced changes that a reset removed, so the new profile is not pushed by itself', async () => {
    const { engine, items, edit, saves, loads } = setup();
    edit('edited');
    items.setItem('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));
    engine.noteLocalChange();
    expect(engine.getSnapshot().unsynced).toBe(false);

    items.setItem('student-data', JSON.stringify(student('new profile')));
    engine.noteLocalChange();
    const done = engine.sync();
    await settle();

    expect(saves).toHaveLength(0);
    loads[0].resolve(snapshot(student('new profile'), 1));
    await done;
  });

  it('reports cloud data it cannot read on connect, and stays disconnected', async () => {
    const { engine, loads, localLabel } = setup({ code: null, version: null });
    const result = engine.connect(CODE);
    loads[0].resolve(snapshot({} as StudentData, 1));

    await expect(result).resolves.toBe('unreachable');
    expect(engine.getSnapshot()).toMatchObject({ code: null, version: null });
    expect(localLabel()).toBe('local');
  });

  it('shows a failed status for cloud data it cannot read on a pull, and keeps local data', async () => {
    const { engine, loads, localLabel } = setup();
    const done = engine.sync();
    loads[0].resolve(snapshot({} as StudentData, 2));
    await done;

    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'unreachable', version: 1 });
    expect(localLabel()).toBe('local');
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

    const restarted = createSyncEngine({ store, remote: { createAccount: async () => {}, delete: async () => true, load: async () => null, save: async () => saved(2) } });
    expect(restarted.getSnapshot()).toMatchObject({ code: CODE, version: 1, unsynced: true });
    await restarted.sync();
    expect(restarted.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
  });

  describe('the name stays on the device', () => {
    it('leaves the name out of what a save sends', async () => {
      const { engine, edit, saves } = setup();
      edit('edited');
      void engine.sync();
      await settle();
      expect(JSON.stringify(saves[0].data)).not.toContain('Local name');
      expect(saves[0].data.studentInfo?.division).toBe('FMS');
    });

    it('leaves the name out of what a new account sends', async () => {
      const { engine, store, remote } = setup({ code: null, version: null });
      let sent = '';
      remote.createAccount = async (_code, data) => {
        sent = JSON.stringify(data);
      };
      await engine.createAccount();
      expect(sent).not.toContain('Local name');
      expect(store.readData()?.studentInfo?.name).toBe('Local name');
    });

    it('keeps the local name when it takes cloud data without one', async () => {
      const { engine, loads, localLabel, localName } = setup();
      void engine.sync();
      await settle();
      loads[0].resolve(snapshot(student('cloud', null), 2));
      await settle();
      expect(localLabel()).toBe('cloud');
      expect(localName()).toBe('Local name');
    });

    it('never takes a name from the cloud, so an old upload can neither replace nor supply one', async () => {
      const existing = setup();
      void existing.engine.sync();
      await settle();
      existing.loads[0].resolve(snapshot(student('cloud', 'Uploaded name'), 2));
      await settle();
      expect(existing.localName()).toBe('Local name');

      const { engine, items, remote, localName } = setup({ code: null, version: null });
      items.removeItem('student-data');
      remote.load = async () => snapshot(student('cloud', 'Uploaded name'), 2);
      expect(await engine.connect(CODE)).toBe('connected');
      expect(localName()).toBeUndefined();
    });

    it('does not count entering a name as an edit, so the cloud is not written for it', () => {
      const { engine, items } = setup({ data: student('same', null) });
      items.setItem('student-data', JSON.stringify(student('same', 'Entered name')));
      expect(engine.noteLocalChange()).toBe(false);
      expect(engine.getSnapshot().unsynced).toBe(false);
    });

    it('does not see a name entered during a save as an edit made meanwhile', async () => {
      const { engine, edit, items, saves } = setup({ data: student('old', null) });
      edit('edited');
      const done = engine.sync();
      await settle();
      items.setItem('student-data', JSON.stringify(student('edited', 'Entered name')));
      engine.noteLocalChange();
      saves[0].answer.resolve(saved(2));
      await done;
      expect(saves).toHaveLength(1);
      expect(engine.getSnapshot()).toMatchObject({ status: 'saved', unsynced: false });
    });
  });

  describe('deleting cloud data', () => {
    it('disconnects and forgets unsynced changes, while the local data stays', async () => {
      const { engine, edit, remote, localLabel, localName } = setup();
      edit('edited');
      const deleted: string[] = [];
      remote.delete = async (code) => {
        deleted.push(code);
        return true;
      };
      expect(await engine.deleteCloudData()).toBe('deleted');
      expect(deleted).toEqual([CODE]);
      expect(engine.getSnapshot()).toMatchObject({ code: null, version: null, unsynced: false, status: 'idle', failure: null });
      expect(localLabel()).toBe('edited');
      expect(localName()).toBe('Local name');
    });

    it('stays connected, with unsynced changes kept, when the cloud cannot be reached', async () => {
      const { engine, edit, remote } = setup();
      edit('edited');
      remote.delete = async () => {
        throw new Error('offline');
      };
      expect(await engine.deleteCloudData()).toBe('unreachable');
      expect(engine.getSnapshot()).toMatchObject({ code: CODE, version: 1, unsynced: true });
    });

    it('counts a code that is already gone as deleted', async () => {
      const { engine, remote } = setup();
      remote.delete = async () => false;
      expect(await engine.deleteCloudData()).toBe('deleted');
      expect(engine.getSnapshot().code).toBeNull();
    });

    it('ignores the answer to a save that was on its way during the delete', async () => {
      const { engine, edit, remote, saves } = setup();
      edit('edited');
      const running = engine.sync();
      await settle();
      remote.delete = async () => true;
      await engine.deleteCloudData();
      saves[0].answer.resolve({ status: 'unknown_code' });
      await running;
      expect(engine.getSnapshot()).toMatchObject({ code: null, status: 'idle', failure: null, unsynced: false });
    });

    it('ignores a save that fails after the delete, so a disconnected device shows no error', async () => {
      const { engine, edit, remote } = setup();
      edit('edited');
      let failSave!: (reason: Error) => void;
      remote.save = () => new Promise((_resolve, reject) => {
        failSave = reject;
      });
      const running = engine.sync();
      await settle();
      await engine.deleteCloudData();
      failSave(new Error('offline'));
      await running;
      expect(engine.getSnapshot()).toMatchObject({ code: null, status: 'idle', failure: null });
    });

    it('ignores a load that fails after the delete', async () => {
      const { engine, remote } = setup();
      let failLoad!: (reason: Error) => void;
      remote.load = () => new Promise((_resolve, reject) => {
        failLoad = reject;
      });
      const running = engine.sync();
      await settle();
      await engine.deleteCloudData();
      failLoad(new Error('offline'));
      await running;
      expect(engine.getSnapshot()).toMatchObject({ code: null, status: 'idle', failure: null });
    });

    it('does not sync after the delete, so a waiting save timer sends nothing', async () => {
      const { engine, edit, remote, saves, loads } = setup();
      edit('edited');
      remote.delete = async () => true;
      await engine.deleteCloudData();
      await engine.sync();
      expect(saves).toHaveLength(0);
      expect(loads).toHaveLength(0);
    });
  });
});
