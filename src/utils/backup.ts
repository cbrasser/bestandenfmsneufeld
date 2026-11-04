import { isCombinedSubject, isSubject, type StudentData } from '../types';
import { reconcileAllYears, selectableYear } from './initializeData';
import { BACKUP_KEY } from './storage';

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
   * ready to use, on this device's name and year. Returns null, changing nothing, if none is kept.
   * Throws, changing nothing, if `current` can't be kept.
   */
  swapWith(current: StudentData): StudentData | null;
  /** Listens for a version being kept. */
  subscribe(listener: () => void): () => void;
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

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
      if (!kept) return null;
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

/** All grades in the data, in every year, including grades not yet assigned to a Teilfach. */
export function countGrades(data: StudentData): number {
  return Object.values(data.years ?? {}).reduce(
    (total, year) =>
      total +
      (year?.subjects ?? []).reduce((inYear, subject) => {
        if (isCombinedSubject(subject)) {
          const inParts = subject.subjects.reduce((sum, part) => sum + part.grades.length, 0);
          return inYear + inParts + (subject.unassignedGrades?.length ?? 0);
        }
        return inYear + (isSubject(subject) ? subject.grades.length : 0);
      }, 0),
    0
  );
}
