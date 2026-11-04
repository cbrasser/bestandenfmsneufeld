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
  readData(): StudentData | null;
  /** Replaces the local data with cloud data. readData may then return a reconciled form of it. */
  applyCloudData(data: StudentData): void;
  readState(): PersistedSyncState;
  writeState(state: PersistedSyncState): void;
}

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * - `conflict`: the cloud has a newer version than the unsynced changes are based on
 * - `unknown_code`: the cloud has no data for the code
 * - `unreachable`: a call to the cloud failed
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
 */
export function createSyncEngine({ store, remote }: { store: SyncStore; remote: SyncRemote }): SyncEngine {
  // The version is kept per engine, not re-read from the store: a second tab shares the store but
  // may not have taken the data that its version number describes.
  let persisted = store.readState();
  let status: SyncStatus = 'idle';
  let failure: SyncFailure | null = null;
  let snapshot: SyncSnapshot = { ...persisted, status, failure };
  // The local data as last seen, to tell real changes from data that came from the cloud
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

  const takeCloudData = (cloud: CloudSnapshot) => {
    store.applyCloudData(cloud.data);
    baseline = JSON.stringify(store.readData());
    persist({ version: cloud.version, unsynced: false });
  };

  // Each step returns true if there is more to do
  const push = async (code: string, data: StudentData): Promise<boolean> => {
    const expectedVersion = persisted.version;
    if (expectedVersion === null) return fail('no_version');

    setOutcome('saving');
    const sent = JSON.stringify(data);
    let result: SaveResult;
    try {
      result = await remote.save(code, data, expectedVersion);
    } catch {
      return fail('unreachable');
    }
    if (persisted.code !== code) return false;

    if (result.status === 'conflict') return fail('conflict');
    if (result.status === 'unknown_code') return fail('unknown_code');

    const editedMeanwhile = JSON.stringify(store.readData()) !== sent;
    persist({ version: result.version, unsynced: editedMeanwhile });
    if (editedMeanwhile) return true;
    setOutcome('saved');
    return false;
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
    if (persisted.version === null) return fail('no_version');

    if (cloud.version !== persisted.version) takeCloudData(cloud);
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
      baseline = JSON.stringify(data);
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
      persist({ code });
      takeCloudData(cloud);
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
        baseline = null;
        return false;
      }
      const current = JSON.stringify(data);
      const changed = baseline !== null && baseline !== current;
      baseline = current;
      if (!changed || !persisted.code) return false;
      persist({ unsynced: true });
      setOutcome('saving');
      return true;
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
