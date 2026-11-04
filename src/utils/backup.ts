import { useSyncExternalStore } from 'react';
import type { StudentData } from '../types';
import { isNewerData } from './dataVersion';
import { reconcileAllYears, selectableYear } from './initializeData';
import { BACKUP_KEY, type KeyValueStorage } from './storage';

/** A version of the data this device replaced, and when. */
export interface KeptVersion {
  data: StudentData;
  keptAt: string;
}

/**
 * The single version a device can go back to. It stays on the device and is never synced. Whatever
 * replaces the student's data keeps the old version here first.
 */
export interface DataBackup {
  /** The kept version, or null if there is none. */
  read(): KeptVersion | null;
  /** Keeps this version instead of the one before. Throws if it can't, so the caller can stop. */
  keep(data: StudentData): void;
  /**
   * Keeps `current` in place of the kept version, and returns the kept version to replace it with,
   * ready to use, on this device's name and year. Returns null, changing nothing, if none is kept or
   * the kept version is in a newer format, which this version would damage by reconciling it.
   * Throws, changing nothing, if `current` can't be kept.
   */
  swapWith(current: StudentData): StudentData | null;
  /** Listens for a version being kept. */
  subscribe(listener: () => void): () => void;
}

export function createDataBackup(getStorage: () => KeyValueStorage): DataBackup {
  const listeners = new Set<() => void>();

  const read = (): KeptVersion | null => {
    try {
      const kept = JSON.parse(getStorage().getItem(BACKUP_KEY) ?? 'null') as KeptVersion | null;
      return kept?.data?.years ? kept : null;
    } catch {
      return null;
    }
  };

  const keep = (data: StudentData) => {
    getStorage().setItem(BACKUP_KEY, JSON.stringify({ data, keptAt: new Date().toISOString() }));
    listeners.forEach((listener) => listener());
  };

  return {
    read,
    keep,

    swapWith(current) {
      const kept = read();
      if (!kept || isNewerData(kept.data)) return null;
      const reconciled = reconcileAllYears(kept.data);
      keep(current);
      const name = current.studentInfo?.name ?? reconciled.studentInfo?.name;
      return {
        ...reconciled,
        studentInfo: reconciled.studentInfo && { ...reconciled.studentInfo, name },
        currentYear: selectableYear(reconciled, current.currentYear),
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** This browser's backup. */
export const dataBackup = createDataBackup(() => localStorage);

const subscribeToBackup = (listener: () => void) => {
  const stop = dataBackup.subscribe(listener);
  window.addEventListener('storage', listener);
  return () => {
    stop();
    window.removeEventListener('storage', listener);
  };
};

/** Whether this browser has a version to go back to, also when another tab kept it. */
export function useHasBackup(): boolean {
  return useSyncExternalStore(subscribeToBackup, () => dataBackup.read() !== null);
}
