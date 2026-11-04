import type { StudentData } from '../types';
import { reconcileAllYears } from '../utils/initializeData';
import { STORAGE_KEY } from '../utils/storage';
import type { PersistedSyncState, SyncStore } from './engine';

const CODE_KEY = 'cloud-code';
const VERSION_KEY = 'cloud-version';
const UNSYNCED_KEY = 'cloud-unsynced';

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface WebSyncStore extends SyncStore {
  /** Listens for cloud data replacing the local data, in the reconciled form that was stored. */
  onCloudData(listener: (data: StudentData) => void): () => void;
}

/** Keeps sync state and student data in localStorage, or anything shaped like it. */
export function createWebSyncStore(getStorage: () => KeyValueStorage): WebSyncStore {
  const listeners = new Set<(data: StudentData) => void>();

  // Storage can be unavailable, for example with site data blocked
  const read = (key: string): string | null => {
    try {
      return getStorage().getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key: string, value: string | null) => {
    try {
      if (value === null) getStorage().removeItem(key);
      else getStorage().setItem(key, value);
    } catch {
      /* ignore */
    }
  };

  return {
    readData() {
      try {
        return JSON.parse(read(STORAGE_KEY) ?? 'null') as StudentData | null;
      } catch {
        return null;
      }
    },

    applyCloudData(data) {
      const reconciled = reconcileAllYears(data);
      write(STORAGE_KEY, JSON.stringify(reconciled));
      listeners.forEach((listener) => listener(reconciled));
    },

    readState(): PersistedSyncState {
      const version = Number(read(VERSION_KEY));
      return {
        code: read(CODE_KEY),
        version: Number.isInteger(version) && version > 0 ? version : null,
        unsynced: read(UNSYNCED_KEY) === 'true',
      };
    },

    writeState({ code, version, unsynced }) {
      write(CODE_KEY, code);
      write(VERSION_KEY, version === null ? null : String(version));
      write(UNSYNCED_KEY, unsynced ? 'true' : null);
    },

    onCloudData(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
