import { describe, expect, it, vi } from 'vitest';
import { isSubject, type StudentData } from '../types';
import { reconcileAllYears } from '../utils/initializeData';
import { createDataBackup } from '../utils/backup';
import { DATA_VERSION } from '../utils/dataVersion';
import { SELECTED_YEAR_KEY } from '../utils/storage';
import { createSyncEngine, type CloudSnapshot, type SaveResult, type SyncRemote } from './engine';
import { createMemoryStorage } from './memoryStorage';
import { createWebSyncStore } from './webStore';

// What the scenario table can't reach: races, where the remote's answers arrive when a test says so,
// and local states and cloud data no scenario step can produce. The rest belongs in
// sync-scenarios/scenarios.json.

const CODE = 'ABCDEFGHJKMNPQRS';

// The label is what makes two datasets really different: a grade, in a subject that reconciling keeps
function student(label: string, name: string | null = 'Local name'): StudentData {
  return {
    studentInfo: { ...(name && { name }), division: 'FMS' },
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
  createWebSyncStore(() => items).writeState({ code, version, unsynced, changedAt: null });
  return openTab(items);
}

/** One tab: it shares its browser's storage with any other tab, and has its own engine. */
function openTab(items: ReturnType<typeof createMemoryStorage>) {
  const store = createWebSyncStore(() => items);
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
  const localLabel = () => labelOf(store.readData());
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

  describe('a device connected before versions existed', () => {
    it('adopts the cloud version silently when the data matches, changing and sending nothing', async () => {
      const { engine, saves, loads, localLabel } = setup({ version: null, data: student('same') });
      const pulled = engine.sync();
      loads[0].resolve(snapshot(student('same', null), 5));
      await pulled;

      expect(localLabel()).toBe('same');
      expect(saves).toHaveLength(0);
      expect(engine.getSnapshot()).toMatchObject({ status: 'saved', failure: null, version: 5, unsynced: false, conflict: null });
    });

    it('asks when the data differs, and touches neither side', async () => {
      const { engine, saves, loads, localLabel } = setup({ version: null });
      const pulled = engine.sync();
      loads[0].resolve(snapshot(student('cloud'), 5));
      await pulled;

      expect(localLabel()).toBe('local');
      expect(saves).toHaveLength(0);
      expect(engine.getSnapshot()).toMatchObject({ status: 'error', failure: 'conflict', version: null });
      expect(engine.getSnapshot().conflict).toEqual({
        local: { gradeCount: 1, changedAt: null },
        cloud: { gradeCount: 1, changedAt: '2026-11-04T12:00:00Z' },
      });
    });

    it('compares an edit made before the first answer, rather than sending it blind', async () => {
      const { engine, edit, saves, loads } = setup({ version: null });
      edit('edited');
      const pushed = engine.sync();
      await settle();
      expect(saves).toHaveLength(0);
      loads[0].resolve(snapshot(student('cloud'), 5));
      await pushed;
      expect(engine.getSnapshot()).toMatchObject({ failure: 'conflict', unsynced: true, version: null });
      expect(saves).toHaveLength(0);
    });
  });

  describe('a conflict', () => {
    // An edit whose save the cloud refused, because it holds other data at a newer version
    async function inConflict(tab = setup(), cloud = student('cloud', null), version = 2) {
      tab.edit('edited');
      const running = tab.engine.sync();
      await settle();
      tab.saves.at(-1)!.answer.resolve(refused(version));
      await settle();
      tab.loads.at(-1)!.resolve(snapshot(cloud, version));
      await running;
      return tab;
    }
    const backupOf = (tab: ReturnType<typeof setup>) => createDataBackup(() => tab.items).read()?.data;

    it('shows each side\'s grade count and last change, with the local one from the edit', async () => {
      const tab = setup();
      const before = Date.now();
      const { engine } = await inConflict(tab);
      const { conflict, conflictPrompt } = engine.getSnapshot();
      expect(conflictPrompt).toBe('showing');
      expect(conflict?.local.gradeCount).toBe(1);
      expect(conflict?.cloud).toEqual({ gradeCount: 1, changedAt: '2026-11-04T12:00:00Z' });
      expect(Date.parse(conflict!.local.changedAt!)).toBeGreaterThanOrEqual(before);
    });

    it('remembers when the local data last changed across a restart', async () => {
      const tab = setup();
      tab.edit('edited');
      const { changedAt } = tab.engine.getSnapshot();
      expect(changedAt).not.toBeNull();
      expect(openTab(tab.items).engine.getSnapshot().changedAt).toBe(changedAt);
    });

    it('stays up when the cloud cannot be reached on a retry', async () => {
      const { engine, saves } = await inConflict();
      const retry = engine.sync();
      await settle();
      saves.at(-1)!.answer.reject(new Error('offline'));
      await retry;
      expect(engine.getSnapshot()).toMatchObject({ failure: 'unreachable', conflictPrompt: 'showing' });
      expect(engine.getSnapshot().conflict).not.toBeNull();
    });

    it('goes away when the cloud data is gone, since there is nothing to choose', async () => {
      const { engine, saves } = await inConflict();
      const retry = engine.sync();
      await settle();
      saves.at(-1)!.answer.resolve({ status: 'unknown_code' });
      await retry;
      expect(engine.getSnapshot()).toMatchObject({ failure: 'unknown_code', conflict: null, conflictPrompt: 'none' });
    });

    it('goes away when another tab has chosen, and shows that tab\'s state', async () => {
      const tab = await inConflict();
      tab.store.writeState({ code: CODE, version: 3, unsynced: false, changedAt: null });
      tab.engine.noteOtherTabChange();
      expect(tab.engine.getSnapshot()).toMatchObject({ status: 'saved', failure: null, version: 3, conflict: null });
    });

    it('goes away when another tab reset the data', async () => {
      const tab = await inConflict();
      tab.items.setItem('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));
      tab.engine.noteOtherTabChange();
      expect(tab.engine.getSnapshot()).toMatchObject({ status: 'idle', conflict: null });
    });

    it('counts again what another tab stored while it is up', async () => {
      const tab = await inConflict();
      const data = student('x');
      data.years[2].subjects = [{ id: 'a', name: 'A', grades: [{ id: 'y', value: 4, weight: 1 }] }];
      tab.items.setItem('student-data', JSON.stringify(data));
      tab.engine.noteOtherTabChange();
      expect(tab.engine.getSnapshot().conflict?.local.gradeCount).toBe(tab.store.gradeCountOf(data));
    });

    describe('keeping this device', () => {
      it('keeps the cloud version as the backup, on this device\'s name, and saves over it', async () => {
        const tab = await inConflict();
        const choosing = tab.engine.keepThisDevice();
        await settle();
        expect(tab.saves.at(-1)?.expectedVersion).toBe(2);
        expect(labelOf(tab.saves.at(-1)?.data)).toBe('edited');
        expect(tab.saves.at(-1)?.data.studentInfo?.name).toBeUndefined();
        tab.saves.at(-1)!.answer.resolve(saved(3));
        expect(await choosing).toBe(true);

        expect(labelOf(backupOf(tab))).toBe('cloud');
        expect(backupOf(tab)?.studentInfo?.name).toBe('Local name');
        expect(tab.localLabel()).toBe('edited');
        expect(tab.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 3, unsynced: false, conflict: null, conflictPrompt: 'none' });
      });

      it('closes the prompt at once and keeps the decision for the retry when the cloud cannot be reached', async () => {
        const tab = await inConflict();
        const choosing = tab.engine.keepThisDevice();
        await settle();
        expect(tab.engine.getSnapshot().conflict).toBeNull();
        tab.saves.at(-1)!.answer.reject(new Error('offline'));
        expect(await choosing).toBe(true);
        expect(tab.engine.getSnapshot()).toMatchObject({ failure: 'unreachable', version: 2, unsynced: true, conflict: null });

        const reopened = openTab(tab.items);
        const retry = reopened.engine.sync();
        await settle();
        expect(reopened.saves[0].expectedVersion).toBe(2);
        reopened.saves[0].answer.resolve(saved(3));
        await retry;
        expect(reopened.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 3, conflict: null });
      });

      it('asks again when the cloud moved on before the choice got there', async () => {
        const tab = await inConflict();
        const choosing = tab.engine.keepThisDevice();
        await settle();
        tab.saves.at(-1)!.answer.resolve(refused(3));
        await settle();
        tab.loads.at(-1)!.resolve(snapshot(student('newer', null), 3));
        await choosing;
        expect(tab.engine.getSnapshot()).toMatchObject({ failure: 'conflict', conflictPrompt: 'showing', unsynced: true });
        expect(tab.localLabel()).toBe('edited');
      });
    });

    describe('keeping the cloud', () => {
      it('keeps this device\'s version as the backup and takes the cloud\'s, without a save', async () => {
        const tab = await inConflict();
        const saveCount = tab.saves.length;
        const choosing = tab.engine.keepCloud();
        await settle();
        tab.loads.at(-1)!.resolve(snapshot(student('cloud', null), 2));
        expect(await choosing).toBe(true);

        expect(tab.localLabel()).toBe('cloud');
        expect(tab.localName()).toBe('Local name');
        expect(labelOf(backupOf(tab))).toBe('edited');
        expect(backupOf(tab)?.studentInfo?.name).toBe('Local name');
        expect(tab.saves).toHaveLength(saveCount);
        expect(tab.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false, conflict: null, conflictPrompt: 'none' });
      });

      it('does not count what it took as an edit', async () => {
        const tab = await inConflict();
        const choosing = tab.engine.keepCloud();
        await settle();
        tab.loads.at(-1)!.resolve(snapshot(student('cloud', null), 2));
        await choosing;
        expect(tab.engine.noteLocalChange()).toBe(false);
      });

      it('takes back nothing when the cloud data cannot be read, and leaves the prompt up', async () => {
        const unreadable = { ...student('cloud', null), years: null } as unknown as StudentData;
        const tab = await inConflict(setup(), unreadable);
        expect(await tab.engine.keepCloud()).toBe(false);
        expect(tab.localLabel()).toBe('edited');
        expect(tab.engine.getSnapshot()).toMatchObject({ unsynced: true, conflictPrompt: 'showing' });
      });
    });

    it.each(['keepThisDevice', 'keepCloud'] as const)('%s changes nothing when the backup cannot be kept', async (choice) => {
      const tab = await inConflict();
      const saveCount = tab.saves.length;
      const setItem = tab.items.setItem;
      tab.items.setItem = (key, value) => {
        if (key === 'data-backup') throw new Error('full');
        setItem(key, value);
      };
      expect(await tab.engine[choice]()).toBe(false);
      expect(tab.localLabel()).toBe('edited');
      expect(tab.saves).toHaveLength(saveCount);
      expect(tab.engine.getSnapshot()).toMatchObject({ version: 1, unsynced: true, conflictPrompt: 'showing' });
    });

    it.each(['keepThisDevice', 'keepCloud'] as const)('%s does nothing without a conflict', async (choice) => {
      const tab = setup();
      expect(await tab.engine[choice]()).toBe(false);
      expect(backupOf(tab)).toBeUndefined();
      expect(tab.localLabel()).toBe('local');
    });

    it('waits for a sync under way, so its late answer cannot bring the prompt back', async () => {
      const tab = await inConflict();
      const retry = tab.engine.sync();
      await settle();
      const choosing = tab.engine.keepCloud();
      await settle();
      tab.saves.at(-1)!.answer.resolve(refused(2));
      await settle();
      tab.loads.at(-1)!.resolve(snapshot(student('cloud', null), 2));
      await retry;
      await settle();
      tab.loads.at(-1)!.resolve(snapshot(student('cloud', null), 2));
      await choosing;
      expect(tab.engine.getSnapshot()).toMatchObject({ status: 'saved', conflict: null, unsynced: false });
      expect(tab.localLabel()).toBe('cloud');
    });

    it('does not ask when another tab chose while the answer to a refused save was on its way', async () => {
      const tab = setup();
      tab.edit('edited');
      const running = tab.engine.sync();
      await settle();
      tab.saves[0].answer.resolve(refused(2));
      await settle();
      // The other tab kept the cloud: the data here is the cloud's now, and nothing is unsynced
      tab.items.setItem('student-data', JSON.stringify(student('cloud')));
      tab.store.writeState({ code: CODE, version: 2, unsynced: false, changedAt: null });
      tab.loads[0].resolve(snapshot(student('cloud', null), 2));
      await settle();
      tab.loads[1].resolve(snapshot(student('cloud', null), 2));
      await running;
      expect(tab.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false, conflict: null });
    });

    it('does not ask when a reset removed the changes while the answer to a refused save was on its way', async () => {
      const tab = setup();
      tab.edit('edited');
      const running = tab.engine.sync();
      await settle();
      tab.saves[0].answer.resolve(refused(2));
      await settle();
      tab.items.setItem('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));
      tab.engine.noteLocalChange();
      tab.loads[0].resolve(snapshot(student('cloud', null), 2));
      await running;
      expect(tab.engine.getSnapshot()).toMatchObject({ unsynced: false, conflict: null, conflictPrompt: 'pending' });
    });

    it('does not ask a device from before versions when a reset happened during the first load', async () => {
      const tab = setup({ version: null });
      const running = tab.engine.sync();
      tab.items.setItem('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));
      tab.engine.noteLocalChange();
      tab.loads[0].resolve(snapshot(student('cloud', null), 2));
      await running;
      expect(tab.engine.getSnapshot()).toMatchObject({ version: null, conflict: null });
    });

    it('does not ask a device from before versions when another tab got past the first load meanwhile', async () => {
      const tab = setup({ version: null });
      const running = tab.engine.sync();
      tab.store.writeState({ code: CODE, version: 2, unsynced: false, changedAt: null });
      tab.loads[0].resolve(snapshot(student('cloud', null), 2));
      await settle();
      tab.loads[1].resolve(snapshot(student('local', null), 2));
      await running;
      expect(tab.engine.getSnapshot()).toMatchObject({ version: 2, conflict: null });
    });

    it('keeps everything through a lost answer followed by a new edit', async () => {
      const tab = setup();
      tab.edit('first');
      const failed = tab.engine.sync();
      await settle();
      tab.saves[0].answer.reject(new Error('answer lost'));
      await failed;
      await inConflict(tab, student('first', null), 2);
      expect(tab.engine.getSnapshot().conflictPrompt).toBe('showing');

      const choosing = tab.engine.keepCloud();
      await settle();
      tab.loads.at(-1)!.resolve(snapshot(student('first', null), 2));
      await choosing;
      expect(tab.localLabel()).toBe('first');
      expect(labelOf(backupOf(tab))).toBe('edited');
    });
  });

  describe('whether a conflict prompt may still come', () => {
    it('is none on a device that isn\'t connected', () => {
      expect(setup({ code: null, version: null }).engine.getSnapshot().conflictPrompt).toBe('none');
    });

    it('is pending on a connected device until it has checked, then none', async () => {
      const { engine, loads } = setup();
      expect(engine.getSnapshot().conflictPrompt).toBe('pending');
      const pulled = engine.sync();
      loads[0].resolve(snapshot(student('local'), 1));
      await pulled;
      expect(engine.getSnapshot().conflictPrompt).toBe('none');
    });

    it('stays pending while changes or a first comparison wait for the cloud', async () => {
      const edited = setup();
      edited.edit('edited');
      const failedSave = edited.engine.sync();
      await settle();
      edited.saves[0].answer.reject(new Error('offline'));
      await failedSave;
      expect(edited.engine.getSnapshot()).toMatchObject({ failure: 'unreachable', conflictPrompt: 'pending' });

      const first = setup({ version: null });
      const failedLoad = first.engine.sync();
      first.loads[0].reject(new Error('offline'));
      await failedLoad;
      expect(first.engine.getSnapshot()).toMatchObject({ failure: 'unreachable', conflictPrompt: 'pending' });
    });

    it('is none when nothing is unsynced and only the cloud cannot be reached', async () => {
      const { engine, loads } = setup();
      const pulled = engine.sync();
      loads[0].reject(new Error('offline'));
      await pulled;
      expect(engine.getSnapshot().conflictPrompt).toBe('none');
    });

    it('is none once the code is gone from the cloud, even with changes waiting', async () => {
      const { engine, edit, saves } = setup();
      edit('edited');
      const pushed = engine.sync();
      await settle();
      saves[0].answer.resolve({ status: 'unknown_code' });
      await pushed;
      expect(engine.getSnapshot().conflictPrompt).toBe('none');
    });
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

  it('does not mark or push a new profile after a reset during a save', async () => {
    const { engine, items, edit, saves, loads } = setup();
    edit('edited');
    const done = engine.sync();
    await settle();

    items.setItem('student-data', JSON.stringify({ ...student('x'), studentInfo: undefined }));
    engine.noteLocalChange();
    saves[0].answer.resolve(saved(2));
    await done;
    expect(engine.getSnapshot()).toMatchObject({ version: 2, unsynced: false });

    items.setItem('student-data', JSON.stringify(student('new profile')));
    expect(engine.noteLocalChange()).toBe(false);
    const after = engine.sync();
    await settle();
    expect(saves).toHaveLength(1);
    loads[0].resolve(snapshot(student('edited'), 2));
    await after;
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
    // These answer every load with the version the device has seen, unless a test says otherwise
    const inStep = <T extends ReturnType<typeof setup>>(tab: T, cloud = snapshot(student('local', null), 1)) => {
      tab.remote.load = async () => cloud;
      return tab;
    };

    it('disconnects and forgets unsynced changes, while the local data stays', async () => {
      const { engine, edit, remote, localLabel, localName } = inStep(setup());
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
      const { engine, edit, remote } = inStep(setup());
      edit('edited');
      remote.delete = async () => {
        throw new Error('offline');
      };
      expect(await engine.deleteCloudData()).toBe('unreachable');
      expect(engine.getSnapshot()).toMatchObject({ code: CODE, version: 1, unsynced: true });
    });

    it('counts a code that is already gone as deleted', async () => {
      const { engine, remote } = inStep(setup());
      remote.delete = async () => false;
      expect(await engine.deleteCloudData()).toBe('deleted');
      expect(engine.getSnapshot().code).toBeNull();
    });

    it('ignores the answer to a save that was on its way during the delete', async () => {
      const { engine, edit, remote, saves } = setup();
      edit('edited');
      const running = engine.sync();
      await settle();
      remote.load = async () => snapshot(student('local', null), 1);
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
      remote.load = async () => snapshot(student('local', null), 1);
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
      remote.load = async () => snapshot(student('local', null), 1);
      await engine.deleteCloudData();
      failLoad(new Error('offline'));
      await running;
      expect(engine.getSnapshot()).toMatchObject({ code: null, status: 'idle', failure: null });
    });

    it('tells another tab, which then neither restores the code nor pushes', async () => {
      const { engine, store, remote, edit, saves } = inStep(setup());
      const otherTab = createSyncEngine({ store, remote });
      otherTab.noteLocalChange();
      await engine.deleteCloudData();

      otherTab.noteOtherTabChange();
      expect(otherTab.getSnapshot()).toMatchObject({ code: null, status: 'idle' });
      edit('edited');
      expect(otherTab.noteLocalChange()).toBe(false);
      await otherTab.sync();
      expect(store.readState().code).toBeNull();
      expect(saves).toHaveLength(0);
    });

    it('does not sync after the delete, so a waiting save timer sends nothing', async () => {
      const { engine, edit, remote, saves, loads } = inStep(setup());
      edit('edited');
      remote.delete = async () => true;
      await engine.deleteCloudData();
      await engine.sync();
      expect(saves).toHaveLength(0);
      expect(loads).toHaveLength(0);
    });

    describe('when the cloud may hold what this device never received', () => {
      const countDeletes = (tab: ReturnType<typeof setup>) => {
        const deleted: string[] = [];
        tab.remote.delete = async (code) => {
          deleted.push(code);
          return true;
        };
        return deleted;
      };

      it('refuses, then takes the cloud data, after which deleting works', async () => {
        const tab = inStep(setup(), snapshot(student('newer', null), 2));
        const deleted = countDeletes(tab);
        expect(await tab.engine.deleteCloudData()).toBe('out_of_step');
        expect(deleted).toEqual([]);
        await tab.engine.sync();
        expect(tab.localLabel()).toBe('newer');
        expect(await tab.engine.deleteCloudData()).toBe('deleted');
        expect(deleted).toEqual([CODE]);
      });

      it('refuses with unsynced changes on an older version, and brings up the prompt', async () => {
        const tab = setup();
        const deleted = countDeletes(tab);
        tab.edit('edited');
        tab.remote.load = async () => snapshot(student('newer', null), 2);
        tab.remote.save = async () => refused(2);
        expect(await tab.engine.deleteCloudData()).toBe('out_of_step');
        await tab.engine.sync();
        expect(deleted).toEqual([]);
        expect(tab.engine.getSnapshot()).toMatchObject({ code: CODE, unsynced: true, conflictPrompt: 'showing' });
        expect(tab.localLabel()).toBe('edited');
      });

      it('refuses on a device from before versions whose data differs', async () => {
        const tab = inStep(setup({ version: null }), snapshot(student('newer', null), 2));
        const deleted = countDeletes(tab);
        expect(await tab.engine.deleteCloudData()).toBe('out_of_step');
        await tab.engine.sync();
        expect(deleted).toEqual([]);
        expect(tab.engine.getSnapshot()).toMatchObject({ code: CODE, conflictPrompt: 'showing' });
      });

      it('deletes nothing when it cannot check', async () => {
        const tab = setup();
        const deleted = countDeletes(tab);
        tab.remote.load = async () => {
          throw new Error('offline');
        };
        expect(await tab.engine.deleteCloudData()).toBe('unreachable');
        expect(deleted).toEqual([]);
        expect(tab.engine.getSnapshot().code).toBe(CODE);
      });

      it('deletes when a newer version holds the same data, as after a lost answer', async () => {
        const tab = setup();
        const deleted = countDeletes(tab);
        tab.edit('edited');
        tab.remote.load = async () => snapshot(student('edited', null), 2);
        expect(await tab.engine.deleteCloudData()).toBe('deleted');
        expect(deleted).toEqual([CODE]);
      });

      it('deletes when this device has seen the version, even with unsynced changes of its own', async () => {
        const tab = inStep(setup());
        const deleted = countDeletes(tab);
        tab.edit('edited');
        expect(await tab.engine.deleteCloudData()).toBe('deleted');
        expect(deleted).toEqual([CODE]);
        expect(tab.localLabel()).toBe('edited');
      });
    });
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
    const taken: [number, boolean][] = [];
    store.onCloudData((data, { keepSelectedYear }) => taken.push([data.currentYear, keepSelectedYear]));
    items.setItem(SELECTED_YEAR_KEY, '2');

    const done = engine.sync();
    loads[0].resolve(snapshot({ ...student('cloud'), currentYear: 3 }, 2));
    await done;

    expect(labelOf(store.readData())).toBe('cloud');
    expect(store.readData()?.currentYear).toBe(2);
    expect(taken).toEqual([[2, true]]);
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
    const taken: [number, boolean][] = [];
    store.onCloudData((data, { keepSelectedYear }) => taken.push([data.currentYear, keepSelectedYear]));
    items.setItem(SELECTED_YEAR_KEY, '1');
    const result = engine.connect(CODE);
    loads[0].resolve(snapshot({ ...student('cloud'), currentYear: 3 }, 1));
    await result;

    expect(store.readData()?.currentYear).toBe(3);
    expect(taken).toEqual([[3, false]]);
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

  it('does not take back another tab\'s save when an older answer to a pull arrives', async () => {
    const { first, second } = twoTabs();
    const done = first.engine.sync();
    await settle();

    second.edit('edited');
    const saving = second.engine.sync();
    await settle();
    second.saves[0].answer.resolve(saved(2));
    await saving;
    first.engine.noteOtherTabChange();

    first.loads[0].resolve(snapshot(student('local'), 1));
    await settle();
    expect(first.localLabel()).toBe('edited');
    expect(first.store.readState()).toMatchObject({ version: 2, unsynced: false });

    first.loads[1].resolve(snapshot(student('edited'), 2));
    await done;
    expect(first.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
  });

  it('does not take back another tab\'s save that it has not heard of yet', async () => {
    const { first, second } = twoTabs();
    const done = first.engine.sync();
    await settle();

    second.edit('edited');
    const saving = second.engine.sync();
    await settle();
    second.saves[0].answer.resolve(saved(2));
    await saving;

    first.loads[0].resolve(snapshot(student('local'), 1));
    await settle();
    expect(first.localLabel()).toBe('edited');

    first.loads[1].resolve(snapshot(student('edited'), 2));
    await done;
    expect(first.engine.getSnapshot()).toMatchObject({ status: 'saved', version: 2, unsynced: false });
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

    first.store.writeState({ code: CODE, version: 2, unsynced: false, changedAt: null });
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

describe('data in a newer format', () => {
  const newer = (label: string): StudentData => ({ ...student(label, null), dataVersion: DATA_VERSION + 1 });

  // Everything a device can write, as seen from outside it
  const countWrites = (items: ReturnType<typeof createMemoryStorage>) => {
    const setItem = vi.spyOn(items, 'setItem');
    const removeItem = vi.spyOn(items, 'removeItem');
    return () => setItem.mock.calls.length + removeItem.mock.calls.length;
  };

  const inReadOnly = async () => {
    const tab = setup({ unsynced: true });
    const opening = tab.engine.sync();
    await settle();
    tab.saves[0].answer.resolve(refused(2));
    await settle();
    tab.loads[0].resolve(snapshot(newer('cloud'), 2));
    await opening;
    return tab;
  };

  it('writes nothing to storage while it syncs, tries and fails', async () => {
    const { engine, items, loads, saves } = await inReadOnly();
    const writes = countWrites(items);

    const again = engine.sync();
    await settle();
    loads[1].resolve(snapshot(newer('cloud'), 3));
    await again;
    const failing = engine.sync();
    await settle();
    loads[2].reject(new Error('offline'));
    await failing;

    expect(writes()).toBe(0);
    expect(saves).toHaveLength(1);
    expect(engine.getSnapshot()).toMatchObject({ readOnly: 'cloud', version: 1, unsynced: true });
  });

  it('shows the newer data on the name this device keeps', async () => {
    const { engine } = await inReadOnly();
    const shown = engine.getSnapshot().newerCloudData;
    expect(labelOf(shown)).toBe('cloud');
    expect(shown?.studentInfo?.name).toBe('Local name');
  });

  it('refuses to make a code, connect, disconnect or delete, with nothing written', async () => {
    const { engine, items, remote } = await inReadOnly();
    const remove = vi.spyOn(remote, 'delete');
    const create = vi.spyOn(remote, 'createAccount');
    const writes = countWrites(items);

    await expect(engine.createAccount()).rejects.toThrow();
    expect(await engine.connect(CODE)).toBe('newer_data');
    engine.disconnect();
    expect(await engine.deleteCloudData()).toBe('newer_data');
    expect(engine.noteLocalChange()).toBe(false);

    expect(writes()).toBe(0);
    expect(remove).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(engine.getSnapshot().code).toBe(CODE);
  });

  it('refuses to delete when only the delete finds the newer data, and turns read-only', async () => {
    const { engine, loads, remote } = setup();
    const remove = vi.spyOn(remote, 'delete');
    const deleting = engine.deleteCloudData();
    await settle();
    loads[0].resolve(snapshot(newer('cloud'), 2));

    expect(await deleting).toBe('newer_data');
    expect(remove).not.toHaveBeenCalled();
    expect(engine.getSnapshot()).toMatchObject({ readOnly: 'cloud', code: CODE });
  });

  it('takes no cloud data that arrives after a newer file was opened', async () => {
    const { engine, loads, localLabel, items } = setup();
    const pulling = engine.sync();
    await settle();
    engine.setViewingNewerFile(true);
    const writes = countWrites(items);
    loads[0].resolve(snapshot(student('cloud'), 2));
    await pulling;

    expect(localLabel()).toBe('local');
    expect(writes()).toBe(0);
    expect(engine.getSnapshot()).toMatchObject({ readOnly: 'file', version: 1 });
  });

  it('asks again about a conflict that was hidden by a newer file', async () => {
    const { engine, edit, saves, loads } = setup();
    edit('edited');
    const pushing = engine.sync();
    await settle();
    saves[0].answer.resolve(refused(2));
    await settle();
    loads[0].resolve(snapshot(student('cloud'), 2));
    await pushing;
    expect(engine.getSnapshot().conflict).not.toBeNull();

    engine.setViewingNewerFile(true);
    expect(engine.getSnapshot()).toMatchObject({ conflict: null, conflictPrompt: 'none', readOnly: 'file' });
    expect(await engine.keepThisDevice()).toBe(false);
    expect(await engine.keepCloud()).toBe(false);

    engine.setViewingNewerFile(false);
    expect(engine.getSnapshot().conflict).not.toBeNull();
  });

  it('turns read-only when another tab stores newer data, and sends nothing', async () => {
    const { engine, items, loads, saves, edit } = setup();
    edit('edited');
    items.setItem('student-data', JSON.stringify({ ...newer('other tab'), studentInfo: { division: 'FMS' } }));
    engine.noteOtherTabChange();
    expect(engine.getSnapshot().readOnly).toBe('local');

    await engine.sync();
    expect(loads).toHaveLength(0);
    expect(saves).toHaveLength(0);
    expect(engine.getSnapshot().failure).toBe('newer_data');
  });

  it('takes no cloud data over newer data another tab stored during the load', async () => {
    const { engine, items, loads } = setup();
    const pulling = engine.sync();
    await settle();
    const stored = JSON.stringify(newer('other tab'));
    items.setItem('student-data', stored);
    loads[0].resolve(snapshot(student('cloud'), 2));
    await pulling;

    expect(items.getItem('student-data')).toBe(stored);
    expect(engine.getSnapshot()).toMatchObject({ readOnly: 'local', version: 1 });
  });

  it('counts cloud data that is empty as unreadable, not as a crash', async () => {
    const { engine, loads, localLabel } = setup();
    const pulling = engine.sync();
    await settle();
    loads[0].resolve({ data: null as unknown as StudentData, version: 2, updatedAt: '2026-11-04T12:00:00Z' });
    await pulling;

    expect(localLabel()).toBe('local');
    expect(engine.getSnapshot()).toMatchObject({ failure: 'unreachable', version: 1, readOnly: null });
  });

  it('leaves the read-only state when the code is gone', async () => {
    const { engine, loads } = await inReadOnly();
    const again = engine.sync();
    await settle();
    loads[1].resolve(null);
    await again;
    expect(engine.getSnapshot()).toMatchObject({ readOnly: null, failure: 'unknown_code', newerCloudData: null });
  });
});
