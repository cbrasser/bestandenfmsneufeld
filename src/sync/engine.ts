import type { StudentData } from '../types';
import { generateCode, normalizeCode } from './code';

/** What the cloud holds for a code. */
export interface CloudSnapshot {
  data: StudentData;
  version: number;
  updatedAt: string;
}

export type SaveResult =
  | { status: 'saved'; version: number; updatedAt: string }
  | { status: 'conflict'; version: number; updatedAt: string }
  | { status: 'unknown_code' };

/** The database calls. Rejecting means the cloud couldn't be reached. */
export interface SyncRemote {
  createAccount(code: string, data: StudentData): Promise<void>;
  /** Removes the code and its data. Resolves to false if the code didn't exist. */
  delete(code: string): Promise<boolean>;
  load(code: string): Promise<CloudSnapshot | null>;
  save(code: string, data: StudentData, expectedVersion: number): Promise<SaveResult>;
}

/** What a device remembers about sync across restarts. */
export interface PersistedSyncState {
  code: string | null;
  /** The last cloud version this device has seen; null until it has seen one. */
  version: number | null;
  /** The device has changes the cloud doesn't have. */
  unsynced: boolean;
  /** When the student last edited on this device while connected; null if that isn't known. */
  changedAt: string | null;
}

export interface SyncStore {
  /** The local data, with this device's selected year. */
  readData(): StudentData | null;
  /**
   * Replaces the local data with cloud data. readData may then return a reconciled form of it.
   * `keepSelectedYear` leaves this device on its year, unless the new data doesn't have that year.
   * Throws, leaving the local data as it was, if the cloud data can't be read.
   */
  applyCloudData(data: StudentData, options: { keepSelectedYear: boolean }): void;
  /**
   * A form of the data that differs only when the student's data really does: it leaves out the
   * selected year and the name, which stay on the device, the data format's version, and whatever
   * reconciling alone would change.
   */
  contentOf(data: StudentData): string;
  /** Keeps a version the student's choice discards. Throws if it can't, so nothing is discarded. */
  keepBackup(data: StudentData): void;
  /** How many grades the data holds, once reconciled: what the student would see of it. */
  gradeCountOf(data: StudentData): number;
  readState(): PersistedSyncState;
  writeState(state: PersistedSyncState): void;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * - `conflict`: the cloud has a newer version than the unsynced changes are based on
 * - `unknown_code`: the cloud has no data for the code
 * - `unreachable`: a call to the cloud failed, or what it returned can't be read
 */
export type SyncFailure = 'conflict' | 'unknown_code' | 'unreachable';

/** What the student sees of one version when choosing between two. */
export interface ConflictSide {
  gradeCount: number;
  /** When it last changed; null if that isn't known, as on a device from before versions. */
  changedAt: string | null;
}

/** Both sides really changed, and only the student can choose which one to keep. */
export interface SyncConflict {
  local: ConflictSide;
  cloud: ConflictSide;
}

/**
 * Whether the student is being asked to choose, for anything that must not appear alongside that:
 * - `showing`: `conflict` is set, so the prompt is up
 * - `pending`: it can't be ruled out yet, because this device hasn't checked with the cloud since it
 *   opened, or still has changes or a first comparison the cloud hasn't answered
 * - `none`: there is nothing to choose
 */
export type ConflictPromptState = 'none' | 'pending' | 'showing';

export interface SyncSnapshot extends PersistedSyncState {
  status: SyncStatus;
  failure: SyncFailure | null;
  conflict: SyncConflict | null;
  conflictPrompt: ConflictPromptState;
}

export type ConnectResult = 'connected' | 'unknown_code' | 'unreachable';

/** `out_of_step`: the cloud holds data this device never received, so nothing was deleted. */
export type DeleteResult = 'deleted' | 'unreachable' | 'out_of_step';

export interface SyncEngine {
  getSnapshot(): SyncSnapshot;
  subscribe(listener: () => void): () => void;
  /** Creates a new code holding the current local data and connects this device to it. */
  createAccount(): Promise<string>;
  /** Connects to an existing code, replacing the local data with the cloud's. */
  connect(code: string): Promise<ConnectResult>;
  /** Disconnects this device. Local and cloud data both stay. */
  disconnect(): void;
  /**
   * Removes this code and its cloud data, then disconnects. Local data stays. Refuses if the cloud
   * holds data this device never received, and syncs instead: that takes the data or asks the student.
   */
  deleteCloudData(): Promise<DeleteResult>;
  /**
   * Call after the local data may have changed. Returns true if this was a real change that the
   * cloud needs, so the caller should call sync() after the save delay.
   */
  noteLocalChange(): boolean;
  /**
   * Call when another tab may have written to the shared storage, together with showing what is
   * stored now. This tab then counts as having seen it, so it won't take it for an edit of its own.
   */
  noteOtherTabChange(): void;
  /** Brings this device and the cloud in step, as far as is safe. Call on open and on focus. */
  sync(): Promise<void>;
  /**
   * The student's choice in a conflict: the local data goes to the cloud, which the cloud's version
   * makes way for, as this device's backup. The choice holds even if the cloud can't be reached yet.
   * Resolves to false, with the data and the prompt as they were, if there is no conflict or no backup
   * could be kept.
   */
  keepThisDevice(): Promise<boolean>;
  /**
   * The student's choice in a conflict: the cloud's data replaces the local data, which becomes this
   * device's backup. Resolves to false, with the data and the prompt as they were, if there is no
   * conflict, no backup could be kept, or the cloud's data can't be read.
   */
  keepCloud(): Promise<boolean>;
}

// Rows start at this version; the database's trigger raises it on every write
const FIRST_VERSION = 1;

// A student's name stays on the device: it is never sent, and cloud data never brings one. Checked
// because cloud data can be anything.
function withName(data: StudentData, name?: string): StudentData {
  return data?.studentInfo ? { ...data, studentInfo: { ...data.studentInfo, name } } : data;
}

/**
 * The sync rules, independent of the UI, the browser and the database.
 *
 *   Local               Cloud          Result
 *   No unsynced changes Same version   Nothing
 *   No unsynced changes Other version  Take the cloud data
 *   Unsynced changes    Same version   Save with the expected version
 *   Unsynced changes    Newer          Refused by the save: the student chooses
 *
 * A refused save whose data the cloud already holds did go through: its answer got lost, or another
 * tab sent the same data at the same moment. That isn't a conflict.
 *
 * A device connected before versions has no version to go on, so it compares: the same data means it
 * adopts the cloud's version, and different data means the student chooses.
 */
export function createSyncEngine({ store, remote }: { store: SyncStore; remote: SyncRemote }): SyncEngine {
  // The version is kept per engine, and only re-read together with the data it describes: a tab
  // that hasn't seen another tab's data must have its edits refused, not save over that data.
  let persisted = store.readState();
  let status: SyncStatus = 'idle';
  let failure: SyncFailure | null = null;
  // The cloud version the student is being asked about
  let conflictingCloud: CloudSnapshot | null = null;
  let snapshot: SyncSnapshot;
  // The content of the local data as last seen, to tell real edits from data that came from elsewhere
  let baseline: string | null = null;
  let running: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const describeConflict = (): SyncConflict | null => {
    if (!conflictingCloud) return null;
    const local = store.readData();
    return (
      local && {
        local: { gradeCount: store.gradeCountOf(local), changedAt: persisted.changedAt },
        cloud: { gradeCount: store.gradeCountOf(conflictingCloud.data), changedAt: conflictingCloud.updatedAt },
      }
    );
  };

  const promptState = (conflict: SyncConflict | null): ConflictPromptState => {
    if (conflict) return 'showing';
    if (!persisted.code || failure === 'unknown_code') return 'none';
    return status === 'idle' || persisted.unsynced || persisted.version === null ? 'pending' : 'none';
  };

  const takeSnapshot = () => {
    const conflict = describeConflict();
    snapshot = { ...persisted, status, failure, conflict, conflictPrompt: promptState(conflict) };
  };
  takeSnapshot();

  const publish = () => {
    takeSnapshot();
    listeners.forEach((listener) => listener());
  };

  const persist = (change: Partial<PersistedSyncState>) => {
    persisted = { ...persisted, ...change };
    store.writeState(persisted);
  };

  const setOutcome = (nextStatus: SyncStatus, nextFailure: SyncFailure | null = null) => {
    // Being unable to reach the cloud, or trying again, doesn't settle what the student is asked
    if (nextStatus === 'saved' || nextStatus === 'idle' || nextFailure === 'unknown_code') conflictingCloud = null;
    status = nextStatus;
    failure = nextFailure;
    publish();
  };

  const fail = (reason: SyncFailure) => {
    setOutcome('error', reason);
    return false;
  };

  const askStudent = (cloud: CloudSnapshot) => {
    conflictingCloud = cloud;
    return fail('conflict');
  };

  const storedContent = () => {
    const data = store.readData();
    return data?.studentInfo ? store.contentOf(data) : null;
  };

  const takeStoredState = () => {
    persisted = store.readState();
    baseline = storedContent();
  };

  // Returns false, with nothing changed, if the cloud data can't be read
  const takeCloudData = (code: string, cloud: CloudSnapshot, options: { keepSelectedYear: boolean }): boolean => {
    try {
      store.applyCloudData(withName(cloud.data, store.readData()?.studentInfo?.name), options);
    } catch {
      return false;
    }
    baseline = storedContent();
    persist({ code, version: cloud.version, unsynced: false, changedAt: null });
    return true;
  };

  // Returns null, with the outcome set, if there is no cloud data to go on
  const load = async (code: string): Promise<CloudSnapshot | null> => {
    let cloud: CloudSnapshot | null;
    try {
      cloud = await remote.load(code);
    } catch {
      if (persisted.code === code) fail('unreachable');
      return null;
    }
    if (persisted.code !== code) return null;
    if (!cloud) fail('unknown_code');
    return cloud;
  };

  // A device connected before versions meets the cloud for the first time
  const compareFirstTime = (cloud: CloudSnapshot) => {
    if (storedContent() !== store.contentOf(cloud.data)) return askStudent(cloud);
    persist({ version: cloud.version, unsynced: false });
    setOutcome('saved');
    return false;
  };

  // The cloud has what was sent, at this version. Returns true if there is more to send.
  const settleSaved = (version: number, sent: string): boolean => {
    const content = storedContent();
    // No content means a reset removed what was sent: that, and the new profile after it, isn't an edit
    const editedMeanwhile = content !== null && content !== sent;
    persist({ version, unsynced: editedMeanwhile });
    if (editedMeanwhile) return true;
    setOutcome('saved');
    return false;
  };

  // Each step returns true if there is more to do
  const push = async (code: string, data: StudentData): Promise<boolean> => {
    const expectedVersion = persisted.version;
    if (expectedVersion === null) {
      const cloud = await load(code);
      return cloud ? (persisted.version === null ? compareFirstTime(cloud) : true) : false;
    }

    setOutcome('saving');
    const sent = store.contentOf(data);
    let result: SaveResult;
    try {
      result = await remote.save(code, withName(data), expectedVersion);
    } catch {
      return persisted.code === code && fail('unreachable');
    }
    if (persisted.code !== code) return false;

    if (result.status === 'unknown_code') return fail('unknown_code');
    if (result.status === 'saved') return settleSaved(result.version, sent);

    const cloud = await load(code);
    if (!cloud) return false;
    if (store.contentOf(cloud.data) !== sent) return askStudent(cloud);
    return settleSaved(cloud.version, sent);
  };

  const pull = async (code: string): Promise<boolean> => {
    const versionAsked = persisted.version;
    const cloud = await load(code);
    if (!cloud) return false;

    if (persisted.unsynced) return true; // edited during the load, so the cloud data must not replace it
    const shared = store.readState();
    if (shared.unsynced || shared.version !== versionAsked) {
      // Another tab has an edit waiting for its save delay, or closed before it was over. Or it saved
      // during the load, so this answer may be older than what is stored and must not replace it.
      takeStoredState();
      return true;
    }
    if (persisted.version === null) return compareFirstTime(cloud);

    if (cloud.version !== persisted.version && !takeCloudData(code, cloud, { keepSelectedYear: true })) {
      return fail('unreachable');
    }
    setOutcome('saved');
    return false;
  };

  const sync = () => {
    running ??= run().finally(() => {
      running = null;
    });
    return running;
  };

  // Applies the student's choice, once any sync under way has finished: its late answer would
  // otherwise bring the prompt back. Throwing means nothing was changed.
  const choose = async (apply: (code: string, cloud: CloudSnapshot, local: StudentData) => void) => {
    while (running) await running;
    const code = persisted.code;
    const cloud = conflictingCloud;
    const local = store.readData();
    if (!code || !cloud || !local) return false;
    try {
      apply(code, cloud, local);
    } catch {
      return false;
    }
    conflictingCloud = null;
    setOutcome('saving');
    await sync();
    return true;
  };

  const forgetCode = () => {
    persist({ code: null, version: null, unsynced: false, changedAt: null });
    setOutcome('idle');
  };

  const run = async () => {
    for (;;) {
      const code = persisted.code;
      const data = store.readData();
      // A device without a profile is in onboarding, for example after a reset: its empty data
      // must never reach the cloud, and cloud data must not interrupt the student.
      if (!code || !data?.studentInfo) return;
      const more = persisted.unsynced ? await push(code, data) : await pull(code);
      if (!more) return;
    }
  };

  return {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async createAccount() {
      const data = store.readData();
      if (!data) throw new Error('No local data to create an account from');
      const code = generateCode();
      await remote.createAccount(code, withName(data));
      baseline = store.contentOf(data);
      persist({ code, version: FIRST_VERSION, unsynced: false, changedAt: null });
      setOutcome('saved');
      return code;
    },

    async connect(input) {
      const code = normalizeCode(input);
      let cloud: CloudSnapshot | null;
      try {
        cloud = await remote.load(code);
      } catch {
        return 'unreachable';
      }
      if (!cloud) return 'unknown_code';
      // A device joining starts where the student last was; from then on it keeps its own year
      if (!takeCloudData(code, cloud, { keepSelectedYear: false })) return 'unreachable';
      setOutcome('saved');
      return 'connected';
    },

    disconnect: forgetCode,

    async deleteCloudData() {
      const code = persisted.code;
      if (!code) return 'deleted';
      try {
        const cloud = await remote.load(code);
        const unseen =
          cloud &&
          persisted.code === code &&
          cloud.version !== persisted.version &&
          store.contentOf(cloud.data) !== storedContent();
        if (unseen) {
          void sync();
          return 'out_of_step';
        }
        await remote.delete(code);
      } catch {
        return 'unreachable';
      }
      // Whether this call removed the row or it was already gone, the code no longer exists
      if (persisted.code === code) forgetCode();
      return 'deleted';
    },

    noteLocalChange() {
      const data = store.readData();
      if (!data?.studentInfo) {
        // A reset removed whatever was unsynced, and the new profile isn't an edit
        baseline = null;
        if (persisted.unsynced || conflictingCloud) {
          persist({ unsynced: false });
          setOutcome('idle');
        }
        return false;
      }
      const current = store.contentOf(data);
      const changed = baseline !== null && baseline !== current;
      baseline = current;
      if (!changed || !persisted.code) return false;
      persist({ unsynced: true, changedAt: new Date().toISOString() });
      setOutcome('saving');
      return true;
    },

    noteOtherTabChange() {
      const before = persisted;
      takeStoredState();
      const versionMoved = persisted.version !== before.version;
      // The other tab chose, or got past the conflict some other way
      if (versionMoved) conflictingCloud = null;
      if (!persisted.code || (conflictingCloud && baseline === null)) setOutcome('idle');
      else if (persisted.code !== before.code || persisted.unsynced !== before.unsynced || versionMoved) {
        setOutcome(persisted.unsynced ? 'saving' : 'saved');
      } else publish();
    },

    // One run at a time: two parallel saves with one expected version would refuse each other.
    // A caller arriving during a run joins it, and the run picks up any edit made in the meantime.
    sync,

    keepThisDevice: () =>
      choose((_code, cloud, local) => {
        store.keepBackup(withName(cloud.data, local.studentInfo?.name));
        // Now the unsynced changes are based on what the cloud holds, so the save goes through. This
        // is stored first, so that the choice survives a closed tab and a failed save.
        persist({ version: cloud.version, unsynced: true });
      }),

    keepCloud: () =>
      choose((code, cloud, local) => {
        store.keepBackup(local);
        if (!takeCloudData(code, cloud, { keepSelectedYear: true })) throw new Error('Unreadable cloud data');
      }),
  };
}
