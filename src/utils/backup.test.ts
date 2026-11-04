import { describe, expect, it } from 'vitest';
import { createMemoryStorage } from '../sync/memoryStorage';
import type { StudentData } from '../types';
import { createDataBackup } from './backup';
import { countGrades } from './countGrades';

function student(label: string, { name = 'Name' as string | undefined, division = 'FMS' as 'FMS' | 'Gymnasium', year = 1 as StudentData['currentYear'] } = {}): StudentData {
  return {
    studentInfo: { name, division },
    currentYear: year,
    years: {
      1: { subjects: [{ id: 'deutsch', name: 'Deutsch', grades: [{ id: label, value: 4, weight: 1 }] }] },
      2: { subjects: [] },
      3: { subjects: [] },
      4: { subjects: [] },
    },
  };
}

const labelOf = (data: StudentData | null | undefined) => {
  const subject = data?.years[1].subjects.find((s) => s.id === 'deutsch');
  return subject && 'grades' in subject ? subject.grades[0]?.id : undefined;
};

const setup = () => {
  const items = createMemoryStorage();
  return { items, backup: createDataBackup(() => items) };
};

describe('the device backup', () => {
  it('holds nothing until something is kept', () => {
    expect(setup().backup.read()).toBeNull();
  });

  it('keeps one version, with when it was kept, replacing the one before', () => {
    const { backup } = setup();
    backup.keep(student('first'));
    backup.keep(student('second'));
    const kept = backup.read();
    expect(labelOf(kept?.data)).toBe('second');
    expect(Number.isNaN(Date.parse(kept?.keptAt ?? ''))).toBe(false);
  });

  it('throws when it cannot keep the data, so the caller can stop before discarding anything', () => {
    const { backup, items } = setup();
    items.setItem = () => {
      throw new Error('full');
    };
    expect(() => backup.keep(student('first'))).toThrow();
  });

  it('reads damaged storage as no backup', () => {
    const { backup, items } = setup();
    items.setItem('data-backup', 'not json');
    expect(backup.read()).toBeNull();
    items.setItem('data-backup', '{"keptAt":"2026-11-04T12:00:00Z","data":{"currentYear":1}}');
    expect(backup.read()).toBeNull();
  });

  it('tells listeners when a version is kept, and stops when asked', () => {
    const { backup } = setup();
    let heard = 0;
    const stop = backup.subscribe(() => heard++);
    backup.keep(student('first'));
    expect(heard).toBe(1);
    stop();
    backup.keep(student('second'));
    expect(heard).toBe(1);
  });

  describe('swapping', () => {
    it('gives back the kept version and keeps the current one in its place', () => {
      const { backup } = setup();
      backup.keep(student('kept'));
      const restored = backup.swapWith(student('current'));
      expect(labelOf(restored)).toBe('kept');
      expect(labelOf(backup.read()?.data)).toBe('current');
      expect(labelOf(backup.swapWith(student('kept')))).toBe('current');
    });

    it('gives nothing back, and changes nothing, when there is no backup', () => {
      const { backup } = setup();
      expect(backup.swapWith(student('current'))).toBeNull();
      expect(backup.read()).toBeNull();
    });

    it('brings the kept version in line with the subject lists', () => {
      const { backup } = setup();
      backup.keep(student('kept'));
      const subjects = backup.swapWith(student('current'))!.years[2].subjects;
      expect(subjects.length).toBeGreaterThan(0);
    });

    it('stays on the name and year of this device', () => {
      const { backup } = setup();
      backup.keep(student('kept', { name: undefined, year: 1 }));
      const restored = backup.swapWith(student('current', { name: 'Here', year: 2 }));
      expect(restored?.studentInfo?.name).toBe('Here');
      expect(restored?.currentYear).toBe(2);
    });

    it('moves off a year the kept version does not have', () => {
      const { backup } = setup();
      backup.keep(student('kept', { division: 'FMS' }));
      const restored = backup.swapWith(student('current', { division: 'Gymnasium', year: 4 }));
      expect(restored?.currentYear).not.toBe(4);
    });

    it('changes nothing when the current version cannot be kept', () => {
      const { backup, items } = setup();
      backup.keep(student('kept'));
      items.setItem = () => {
        throw new Error('full');
      };
      expect(() => backup.swapWith(student('current'))).toThrow();
      expect(labelOf(backup.read()?.data)).toBe('kept');
    });
  });
});

describe('counting grades', () => {
  it('counts every year, Teilfächer and grades not yet assigned to one', () => {
    const grade = (id: string) => ({ id, value: 4, weight: 1 });
    const data = student('one');
    data.years[2].subjects = [
      { id: 'a', name: 'A', grades: [grade('two'), grade('three')] },
      {
        id: 'b',
        name: 'B',
        subjects: [{ id: 'c', name: 'C', grades: [grade('four')] }],
        unassignedGrades: [grade('five')],
      },
    ];
    expect(countGrades(data)).toBe(5);
  });

  it('counts data with parts missing as far as it can', () => {
    expect(countGrades({ currentYear: 1 } as StudentData)).toBe(0);
  });
});
