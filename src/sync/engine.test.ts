import { describe, expect, it } from 'vitest';
import { isSubject, type StudentData } from '../types';
import { reconcileAllYears } from '../utils/initializeData';
import { createSyncEngine, type CloudSnapshot, type SaveResult, type SyncRemote } from './engine';
import { SELECTED_YEAR_KEY } from '../utils/storage';
import { createMemoryStorage } from './memoryStorage';
import { createWebSyncStore } from './webStore';

// What the scenario table can't reach: races, where the remote's answers arrive when a test says so,
// and local states and cloud data no scenario step can produce. The rest belongs in
// sync-scenarios/scenarios.json.

const CODE = 'ABCDEFGHJKMNPQRS';

// The label is what makes two datasets really different: a grade, in a subject that reconciling keeps
function student(label: string): StudentData {
  return {
    studentInfo: { name: 'Test', division: 'FMS' },
    currentYear: 1,
    years: {
      1: { subjects: [{ id: 'deutsch', name: 'Deutsch', grades: [{ id: label, value: 4, weight: 1 }] }] },
      2: { subjects: [] },
      3: { subjects: [] },
      4: { subjects: [] },
    },
  };
}

function labelOf(data: StudentData | null | undefined) {
  const subject = data?.years[1].subjects.find((s) => s.id === 'deutsch');
  return subject && isSubject(subject) ? subject.grades[0]?.id : undefined;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const refused = (version: number): SaveResult => ({ status: 'conflict', version, updatedAt: '2026-11-04T12:00:00Z' });
const saved = (version: number): SaveResult => ({ status: 'saved', version, updatedAt: '2026-11-04T12:00:00Z' });
const snapshot = (data: StudentData, version: number): CloudSnapshot => ({ data, version, updatedAt: '2026-11-04T12:00:00Z' });

function setup({ version = 1 as number | null, unsynced = false, code = CODE as string | null, data = student('local') } = {}) {
  const items = createMemoryStorage();
  items.setItem('student-data', JSON.stringify(data));
  createWebSyncStore(() => items).writeState({ code, version, unsynced });
  return openTab(items);
}

/** One tab: it shares its browser's storage with any other tab, and has its own engine. */
function openTab(items: ReturnType<typeof createMemoryStorage>) {
  const store = createWebSyncStore(() => items);
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
    items.setItem('student-data', JSON.stringify(student(label)));
    return engine.noteLocalChange();
  };
  const localLabel = () => labelOf(store.readData());
  return { engine, store, items, saves, loads, edit, localLabel };
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
    expect(labelOf(saves[1].data)).toBe('second');

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
    saves[0].answer.resolve(refused(2));
    await settle();
    loads[1].resolve(snapshot(student('cloud'), 2));
    await done;
    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'conflict', unsynced: true });
  });

  it('takes a refused save as saved when the cloud already holds that data, as after a lost answer', async () => {
    const { engine, edit, saves, loads } = setup();
    edit('edited');
    const done = engine.sync();
    await settle();

    saves[0].answer.resolve(refused(2));
    await settle();
    loads[0].resolve(snapshot(student('edited'), 2));
    await done;

    expect(engine.getSnapshot()).toMatchObject({ status: 'saved', failure: null, version: 2, unsynced: false });
  });

  it('keeps data unsynced when it cannot check a refused save', async () => {
    const { engine, edit, saves, loads } = setup();
    edit('edited');
    const done = engine.sync();
    await settle();

    saves[0].answer.resolve(refused(2));
    await settle();
    loads[0].reject(new Error('offline'));
    await done;

    expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'unreachable', version: 1, unsynced: true });
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

    const restarted = createSyncEngine({ store, remote: { createAccount: async () => {}, load: async () => null, save: async () => saved(2) } });
    expect(restarted.getSnapshot()).toMatchObject({ code: CODE, version: 1, unsynced: true });
    await restarted.sync();
    expect(restarted.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
  });
});

describe('selected year', () => {
  it('does not count a changed year as an edit, in the year key or in the stored data', () => {
    const { engine, items } = setup();
    items.setItem(SELECTED_YEAR_KEY, '2');
    expect(engine.noteLocalChange()).toBe(false);

    items.setItem('student-data', JSON.stringify({ ...student('local'), currentYear: 3 }));
    expect(engine.noteLocalChange()).toBe(false);
    expect(engine.getSnapshot()).toMatchObject({ unsynced: false });
  });

  it('sends this device its own year with a save, and does not resend when only the year changed meanwhile', async () => {
    const { engine, items, edit, saves } = setup();
    items.setItem(SELECTED_YEAR_KEY, '2');
    edit('edited');
    const done = engine.sync();
    await settle();
    expect(saves[0].data.currentYear).toBe(2);

    items.setItem(SELECTED_YEAR_KEY, '3');
    saves[0].answer.resolve(saved(2));
    await done;

    expect(saves).toHaveLength(1);
    expect(engine.getSnapshot()).toMatchObject({ status: 'saved', unsynced: false });
  });

  it('keeps its own year when it takes cloud data on a pull', async () => {
    const { engine, store, items, loads } = setup();
    const taken: number[] = [];
    store.onCloudData((data) => taken.push(data.currentYear));
    items.setItem(SELECTED_YEAR_KEY, '2');

    const done = engine.sync();
    loads[0].resolve(snapshot({ ...student('cloud'), currentYear: 3 }, 2));
    await done;

    expect(labelOf(store.readData())).toBe('cloud');
    expect(store.readData()?.currentYear).toBe(2);
    expect(taken).toEqual([2]);
    expect(items.getItem(SELECTED_YEAR_KEY)).toBe('2');
  });

  it('keeps the year in the stored data on a device that never had a year key, as right after launch', async () => {
    const { engine, store, loads } = setup({ data: { ...student('local'), currentYear: 2 } });
    const done = engine.sync();
    loads[0].resolve(snapshot({ ...student('cloud'), currentYear: 3 }, 2));
    await done;

    expect(store.readData()?.currentYear).toBe(2);
  });

  it('moves a year the new data does not have, as an FMS student has no year 4', async () => {
    const { engine, store, items, loads } = setup();
    items.setItem(SELECTED_YEAR_KEY, '4');
    const done = engine.sync();
    loads[0].resolve(snapshot(student('cloud'), 2));
    await done;

    expect(store.readData()?.currentYear).toBe(3);
  });

  it('starts on the cloud year when connecting, replacing whatever it was on', async () => {
    const { engine, store, items, loads } = setup({ code: null, version: null });
    items.setItem(SELECTED_YEAR_KEY, '1');
    const result = engine.connect(CODE);
    loads[0].resolve(snapshot({ ...student('cloud'), currentYear: 3 }, 1));
    await result;

    expect(store.readData()?.currentYear).toBe(3);
    expect(items.getItem(SELECTED_YEAR_KEY)).toBe('3');
  });
});

describe('what counts as an edit', () => {
  it('does not count a reconciliation-only difference', async () => {
    const { engine, items, saves, loads } = setup();
    items.setItem('student-data', JSON.stringify(reconcileAllYears(student('local'))));

    expect(engine.noteLocalChange()).toBe(false);
    expect(engine.getSnapshot().unsynced).toBe(false);

    const done = engine.sync();
    loads[0].resolve(snapshot(student('local'), 1));
    await done;
    expect(saves).toHaveLength(0);
  });

  it('does not count a different order of fields, as the database returns them', () => {
    const { engine, items } = setup();
    const { years, currentYear, studentInfo } = student('local');
    items.setItem('student-data', JSON.stringify({ years, studentInfo, currentYear }));
    expect(engine.noteLocalChange()).toBe(false);
  });

  it('does not count the name, which stays on the device', () => {
    const { engine, items } = setup();
    items.setItem('student-data', JSON.stringify({ ...student('local'), studentInfo: { name: 'Other', division: 'FMS' } }));
    expect(engine.noteLocalChange()).toBe(false);
  });

  it('still counts a new grade after a reconciliation-only difference', () => {
    const { engine, items, edit } = setup();
    items.setItem('student-data', JSON.stringify(reconcileAllYears(student('local'))));
    engine.noteLocalChange();
    expect(edit('edited')).toBe(true);
  });
});

describe('two tabs of one browser', () => {
  function twoTabs() {
    const first = setup();
    return { first, second: openTab(first.items) };
  }

  it('does not let a pull in one tab overwrite an edit waiting for its save delay in the other', async () => {
    const { first, second } = twoTabs();
    const done = second.engine.sync();
    await settle();

    first.edit('edited');
    second.loads[0].resolve(snapshot(student('cloud'), 2));
    await settle();

    expect(first.localLabel()).toBe('edited');
    expect(first.store.readState().unsynced).toBe(true);
    expect(second.saves).toHaveLength(1);

    // The cloud really is newer, so that is what the refused save reports
    second.saves[0].answer.resolve(refused(2));
    await settle();
    second.loads[1].resolve(snapshot(student('cloud'), 2));
    await done;
    expect(first.localLabel()).toBe('edited');
    expect(second.engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'conflict', unsynced: true });
  });

  it('saves another tab\'s waiting edit once, without a conflict in either tab', async () => {
    const { first, second } = twoTabs();
    first.edit('edited');

    const pulled = second.engine.sync();
    second.loads[0].resolve(snapshot(student('local'), 1));
    await settle();
    expect(labelOf(second.saves[0].data)).toBe('edited');
    second.saves[0].answer.resolve(saved(2));
    await pulled;
    expect(second.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });

    first.engine.noteOtherTabChange();
    const delayOver = first.engine.sync();
    first.loads[0].resolve(snapshot(student('edited'), 2));
    await delayOver;

    expect(first.saves).toHaveLength(0);
    expect(first.engine.getSnapshot()).toMatchObject({ status: 'saved', failure: null, version: 2, unsynced: false });
  });

  it('shows no conflict when two tabs send the same edit at once', async () => {
    const { first, second } = twoTabs();
    first.edit('edited');
    second.engine.noteOtherTabChange();

    const one = first.engine.sync();
    const two = second.engine.sync();
    await settle();
    first.saves[0].answer.resolve(saved(2));
    second.saves[0].answer.resolve(refused(2));
    await one;
    await settle();
    second.loads[0].resolve(snapshot(student('edited'), 2));
    await two;

    expect(first.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
    expect(second.engine.getSnapshot()).toMatchObject({ status: 'saved', failure: null, version: 2, unsynced: false });
    expect(first.store.readState()).toMatchObject({ version: 2, unsynced: false });
  });

  it('does not count what another tab stored as an edit of its own', () => {
    const { first, second } = twoTabs();
    first.edit('edited');

    second.engine.noteOtherTabChange();

    expect(second.engine.noteLocalChange()).toBe(false);
    expect(second.edit('own edit')).toBe(true);
  });

  it('takes on the version another tab reached, so its next edit is not refused', async () => {
    const { first, second } = twoTabs();
    first.edit('edited');
    const done = first.engine.sync();
    await settle();
    first.saves[0].answer.resolve(saved(2));
    await done;

    second.engine.noteOtherTabChange();
    second.edit('own edit');
    void second.engine.sync();
    await settle();

    expect(second.saves[0].expectedVersion).toBe(2);
  });

  it('shows a waiting edit as saving, and saved once another tab has saved it', () => {
    const { first, second } = twoTabs();
    first.edit('edited');
    second.engine.noteOtherTabChange();
    expect(second.engine.getSnapshot()).toMatchObject({ status: 'saving', unsynced: true });

    first.store.writeState({ code: CODE, version: 2, unsynced: false });
    second.engine.noteOtherTabChange();
    expect(second.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
  });

  it('follows another tab disconnecting, and sends nothing afterwards', async () => {
    const { first, second } = twoTabs();
    first.engine.disconnect();

    second.engine.noteOtherTabChange();
    expect(second.engine.getSnapshot()).toMatchObject({ code: null, version: null, status: 'idle' });

    await second.engine.sync();
    expect(second.loads).toHaveLength(0);
    expect(second.saves).toHaveLength(0);
  });

  it('keeps a failure while nothing about the sync state changed', async () => {
    const { first, second } = twoTabs();
    const done = second.engine.sync();
    second.loads[0].reject(new Error('offline'));
    await done;

    first.items.setItem(SELECTED_YEAR_KEY, '2');
    second.engine.noteOtherTabChange();

    expect(second.engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'unreachable' });
  });
});
