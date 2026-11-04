import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage } from '../sync/memoryStorage';
import type { StudentData } from '../types';
import { DATA_VERSION } from './dataVersion';
import { reconcileAllYears } from './initializeData';
import { BACKUP_KEY, SELECTED_YEAR_KEY, STORAGE_KEY, storageService } from './storage';

const student = (currentYear: StudentData['currentYear']): StudentData => ({
  studentInfo: { name: 'Test', division: 'Gymnasium' },
  currentYear,
  years: { 1: { subjects: [] }, 2: { subjects: [] }, 3: { subjects: [] }, 4: { subjects: [] } },
});

describe('selected year', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  it('puts the selected year in export files, in the field they always had it in', () => {
    storageService.saveData(student(1));
    storageService.saveSelectedYear(3);

    const file = JSON.parse(storageService.exportText());
    expect(file.currentYear).toBe(3);
    expect(reconcileAllYears(file).currentYear).toBe(3);
  });

  it('exports the stored year on a device that has never switched year', () => {
    storageService.saveData(student(2));
    expect(JSON.parse(storageService.exportText()).currentYear).toBe(2);
  });

  it('has no selected year until one is saved, and ignores a value that is no year', () => {
    expect(storageService.getSelectedYear()).toBeNull();
    localStorage.setItem(SELECTED_YEAR_KEY, '7');
    expect(storageService.getSelectedYear()).toBeNull();
    storageService.saveSelectedYear(4);
    expect(storageService.getSelectedYear()).toBe(4);
  });

  it('forgets the selected year with the data on a reset', () => {
    storageService.saveData(student(2));
    storageService.saveSelectedYear(3);
    storageService.clearData();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(storageService.getSelectedYear()).toBeNull();
  });
});

describe('resetting', () => {
  it('removes the backup too, so that nothing of the old data stays on the device', () => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    localStorage.setItem(BACKUP_KEY, 'kept');
    storageService.clearData();
    expect(localStorage.getItem(BACKUP_KEY)).toBeNull();
  });
});

describe('data in a newer format', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  const newer = { ...student(1), dataVersion: DATA_VERSION + 1 };

  it('is never stored', () => {
    storageService.saveData(student(1));
    storageService.saveData(newer);
    expect(storageService.getData()?.dataVersion).toBeUndefined();
  });

  it('is never overwritten', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newer));
    storageService.saveData(student(2));
    expect(storageService.getData()).toEqual(newer);
  });
});

describe('reading an import file', () => {
  it('reads a file of a newer format without asking for anything else, as it may have changed shape', () => {
    expect(storageService.parseImport('{"dataVersion":999,"school":{}}')).toEqual({ dataVersion: 999, school: {} });
  });

  it('still wants a file this version can read to have years', () => {
    expect(() => storageService.parseImport('{"dataVersion":1}')).toThrow('missing years');
    expect(() => storageService.parseImport('{}')).toThrow('missing years');
  });

  it.each([['null'], ['3'], ['not json']])('refuses %s', (text) => {
    expect(() => storageService.parseImport(text)).toThrow();
  });
});
