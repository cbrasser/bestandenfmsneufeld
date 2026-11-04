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
   * selected year and the name, which stay on the device, and whatever reconciling alone would change.
   */
  contentOf(data: StudentData): string;
  readState(): PersistedSyncState;
  writeState(state: PersistedSyncState): void;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * - `conflict`: the cloud has a newer version than the unsynced changes are based on
 * - `unknown_code`: the cloud has no data for the code
 * - `unreachable`: a call to the cloud failed, or what it returned can't be read
 * - `no_version`: connected before versions existed, so it can't yet be told which side is newer
 */
export type SyncFailure = 'conflict' | 'unknown_code' | 'unreachable' | 'no_version';

export interface SyncSnapshot extends PersistedSyncState {
  status: SyncStatus;
  failure: SyncFailure | null;
}

export type ConnectResult = 'connected' | 'unknown_code' | 'unreachable';

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
}

// Rows start at this version; the database's trigger raises it on every write
const FIRST_VERSION = 1;

/**
 * The sync rules, independent of the UI, the browser and the database.
 *
 *   Local               Cloud          Result
 *   No unsynced changes Same version   Nothing
 *   No unsynced changes Other version  Take the cloud data
 *   Unsynced changes    Same version   Save with the expected version
 *   Unsynced changes    Newer          Refused by the save: stays unsynced, status failed
 *
 * A refused save whose data the cloud already holds did go through: its answer got lost, or another
 * tab sent the same data at the same moment. That isn't a conflict.
 */
export function createSyncEngine({ store, remote }: { store: SyncStore; remote: SyncRemote }): SyncEngine {
  // The version is kept per engine, and only re-read together with the data it describes: a tab
  // that hasn't seen another tab's data must have its edits refused, not save over that data.
  let persisted = store.readState();
  let status: SyncStatus = 'idle';
  let failure: SyncFailure | null = null;
  let snapshot: SyncSnapshot = { ...persisted, status, failure };
  // The content of the local data as last seen, to tell real edits from data that came from elsewhere
  let baseline: string | null = null;
  let running: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const publish = () => {
    snapshot = { ...persisted, status, failure };
    listeners.forEach((listener) => listener());
  };

  const persist = (change: Partial<PersistedSyncState>) => {
    persisted = { ...persisted, ...change };
    store.writeState(persisted);
  };

  const setOutcome = (nextStatus: SyncStatus, nextFailure: SyncFailure | null = null) => {
    status = nextStatus;
    failure = nextFailure;
    publish();
  };

  const fail = (reason: SyncFailure) => {
    setOutcome('error', reason);
    return false;
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
      store.applyCloudData(cloud.data, options);
    } catch {
      return false;
    }
    baseline = storedContent();
    persist({ code, version: cloud.version, unsynced: false });
    return true;
  };

  // The cloud has what was sent, at this version. Returns true if there is more to send.
  const settleSaved = (version: number, sent: string): boolean => {
    const editedMeanwhile = storedContent() !== sent;
    persist({ version, unsynced: editedMeanwhile });
    if (editedMeanwhile) return true;
    setOutcome('saved');
    return false;
  };

  // Each step returns true if there is more to do
  const push = async (code: string, data: StudentData): Promise<boolean> => {
    const expectedVersion = persisted.version;
    if (expectedVersion === null) return fail('no_version');

    setOutcome('saving');
    const sent = store.contentOf(data);
    let result: SaveResult;
    try {
      result = await remote.save(code, data, expectedVersion);
    } catch {
      return fail('unreachable');
    }
    if (persisted.code !== code) return false;

    if (result.status === 'unknown_code') return fail('unknown_code');
    if (result.status === 'saved') return settleSaved(result.version, sent);

    let cloud: CloudSnapshot | null;
    try {
      cloud = await remote.load(code);
    } catch {
      return fail('unreachable');
    }
    if (persisted.code !== code) return false;

    if (!cloud) return fail('unknown_code');
    if (store.contentOf(cloud.data) !== sent) return fail('conflict');
    return settleSaved(cloud.version, sent);
  };

  const pull = async (code: string): Promise<boolean> => {
    let cloud: CloudSnapshot | null;
    try {
      cloud = await remote.load(code);
    } catch {
      return fail('unreachable');
    }
    if (persisted.code !== code) return false;

    if (!cloud) return fail('unknown_code');
    if (persisted.unsynced) return true; // edited during the load, so the cloud data must not replace it
    if (store.readState().unsynced) {
      // Another tab has an edit waiting for its save delay, or closed before it was over
      takeStoredState();
      return true;
    }
    if (persisted.version === null) return fail('no_version');

    if (cloud.version !== persisted.version && !takeCloudData(code, cloud, { keepSelectedYear: true })) {
      return fail('unreachable');
    }
    setOutcome('saved');
    return false;
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
      await remote.createAccount(code, data);
      baseline = store.contentOf(data);
      persist({ code, version: FIRST_VERSION, unsynced: false });
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

    disconnect() {
      persist({ code: null, version: null, unsynced: false });
      setOutcome('idle');
    },

    noteLocalChange() {
      const data = store.readData();
      if (!data?.studentInfo) {
        // A reset removed whatever was unsynced, and the new profile isn't an edit
        baseline = null;
        if (persisted.unsynced) {
          persist({ unsynced: false });
          setOutcome('idle');
        }
        return false;
      }
      const current = store.contentOf(data);
      const changed = baseline !== null && baseline !== current;
      baseline = current;
      if (!changed || !persisted.code) return false;
      persist({ unsynced: true });
      setOutcome('saving');
      return true;
    },

    noteOtherTabChange() {
      const before = persisted;
      takeStoredState();
      if (!persisted.code) setOutcome('idle');
      else if (persisted.code !== before.code || persisted.unsynced !== before.unsynced) {
        setOutcome(persisted.unsynced ? 'saving' : 'saved');
      } else publish();
    },

    // One run at a time: two parallel saves with one expected version would refuse each other.
    // A caller arriving during a run joins it, and the run picks up any edit made in the meantime.
    sync() {
      running ??= run().finally(() => {
        running = null;
      });
      return running;
    },
  };
}
