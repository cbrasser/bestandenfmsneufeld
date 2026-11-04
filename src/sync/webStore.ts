import type { StudentData } from '../types';
import { createDataBackup, type DataBackup } from '../utils/backup';
import { countGrades } from '../utils/countGrades';
import { reconcileAllYears, selectableYear } from '../utils/initializeData';
import { parseSelectedYear, SELECTED_YEAR_KEY, STORAGE_KEY, type KeyValueStorage } from '../utils/storage';
import type { PersistedSyncState, SyncStore } from './engine';

const CODE_KEY = 'cloud-code';
const VERSION_KEY = 'cloud-version';
const UNSYNCED_KEY = 'cloud-unsynced';
const CHANGED_AT_KEY = 'cloud-changed-at';

/** What tabs share: another tab writing any of these concerns this tab's sync. */
export const SHARED_SYNC_KEYS: readonly string[] = [STORAGE_KEY, CODE_KEY, VERSION_KEY, UNSYNCED_KEY, CHANGED_AT_KEY];

export type CloudDataListener = (data: StudentData, options: { keepSelectedYear: boolean }) => void;

export interface WebSyncStore extends SyncStore {
  /** Listens for cloud data replacing the local data, in the form readData then returns. */
  onCloudData(listener: CloudDataListener): () => void;
}

// Object keys in a fixed order: the database doesn't return them in the order they were sent
const sortKeys = (_key: string, value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1)))
    : value;

/** Keeps sync state and student data in localStorage, or anything shaped like it. */
export function createWebSyncStore(
  getStorage: () => KeyValueStorage,
  backup: DataBackup = createDataBackup(getStorage)
): WebSyncStore {
  const listeners = new Set<CloudDataListener>();

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

  // The data as it leaves this device, so it carries the year this device is on
  const readData = (): StudentData | null => {
    try {
      const data = JSON.parse(read(STORAGE_KEY) ?? 'null') as StudentData | null;
      const year = parseSelectedYear(read(SELECTED_YEAR_KEY));
      return data && year ? { ...data, currentYear: year } : data;
    } catch {
      return null;
    }
  };

  return {
    readData,

    applyCloudData(data, { keepSelectedYear }) {
      const reconciled = reconcileAllYears(data);
      const year = (keepSelectedYear && readData()?.currentYear) || reconciled.currentYear;
      const stored = { ...reconciled, currentYear: selectableYear(reconciled, year) };
      write(STORAGE_KEY, JSON.stringify(stored));
      write(SELECTED_YEAR_KEY, String(stored.currentYear));
      listeners.forEach((listener) => listener(stored, { keepSelectedYear }));
    },

    contentOf(data) {
      let reconciled = data;
      try {
        reconciled = reconcileAllYears(data);
      } catch {
        // Data this version can't reconcile is compared as it is
      }
      return JSON.stringify(
        {
          ...reconciled,
          currentYear: undefined,
          dataVersion: undefined,
          studentInfo: reconciled.studentInfo && { ...reconciled.studentInfo, name: undefined },
        },
        sortKeys
      );
    },

    keepBackup: backup.keep,

    gradeCountOf(data) {
      try {
        return countGrades(reconcileAllYears(data));
      } catch {
        // Data this version can't reconcile is counted as it is
        return countGrades(data);
      }
    },

    readState(): PersistedSyncState {
      const version = Number(read(VERSION_KEY));
      return {
        code: read(CODE_KEY),
        version: Number.isInteger(version) && version > 0 ? version : null,
        unsynced: read(UNSYNCED_KEY) === 'true',
        changedAt: read(CHANGED_AT_KEY),
      };
    },

    writeState({ code, version, unsynced, changedAt }) {
      write(CODE_KEY, code);
      write(VERSION_KEY, version === null ? null : String(version));
      write(UNSYNCED_KEY, unsynced ? 'true' : null);
      write(CHANGED_AT_KEY, changedAt);
    },

    onCloudData(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
