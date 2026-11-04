import { describe, expect, it } from 'vitest';
import type { StudentData } from '../types';
import { DATA_VERSION, isNewerData } from './dataVersion';
import { initializeStudentData, reconcileAllYears } from './initializeData';

const student = (dataVersion?: unknown): StudentData =>
  ({
    ...(dataVersion !== undefined && { dataVersion }),
    studentInfo: { name: 'Test', division: 'FMS' },
    currentYear: 1,
    years: { 1: { subjects: [] }, 2: { subjects: [] }, 3: { subjects: [] }, 4: { subjects: [] } },
  }) as StudentData;

describe('dataVersion', () => {
  it('means 1 when it is missing', () => {
    expect(isNewerData(student())).toBe(false);
    expect(isNewerData(student(null))).toBe(false);
    expect(isNewerData(student(1))).toBe(false);
  });

  it('is newer above what this version supports', () => {
    expect(isNewerData(student(DATA_VERSION))).toBe(false);
    expect(isNewerData(student(DATA_VERSION + 1))).toBe(true);
  });

  it.each([[1.5], ['1'], [0], [-1], [true]])('counts %j as a value this version cannot read', (value) => {
    expect(isNewerData(student(value))).toBe(true);
  });

  it('is on new data and on anything reconciled, without counting that as a change of format', () => {
    expect(initializeStudentData().dataVersion).toBe(DATA_VERSION);
    expect(reconcileAllYears(student()).dataVersion).toBe(DATA_VERSION);
  });

  it('never goes down', () => {
    expect(reconcileAllYears(student(DATA_VERSION + 1)).dataVersion).toBe(DATA_VERSION + 1);
    expect(reconcileAllYears({ ...student(DATA_VERSION + 1), gymProfile: {}, studentInfo: { division: 'Gymnasium' } }).dataVersion).toBe(
      DATA_VERSION + 1
    );
  });
});
