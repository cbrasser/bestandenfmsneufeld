import type { StudentData } from '../types';

/**
 * The data format this version reads and writes. Raise it whenever the subject lists or the data format
 * change, because reconciling keeps only the subjects a version knows: an older version must not get
 * to reconcile newer data and write the loss back.
 */
export const DATA_VERSION = 1;

/**
 * Whether this version can't safely read the data, so it may only show it and must never write it.
 * A missing value means 1. A value that isn't a whole number from 1 up can't be from any version known
 * here, so it is treated the same way.
 */
export function isNewerData(data: Pick<StudentData, 'dataVersion'>): boolean {
  const version: unknown = data.dataVersion;
  if (version === undefined || version === null) return false;
  return !(Number.isInteger(version) && (version as number) >= 1 && (version as number) <= DATA_VERSION);
}
