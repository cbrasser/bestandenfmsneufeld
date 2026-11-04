import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage } from '../sync/memoryStorage';
import type { StudentData } from '../types';
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
