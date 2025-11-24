import type { StudentData, Year } from '../types';
import { defaultSubjects, year3Directions } from '../config/subjects';

export const initializeStudentData = (): StudentData => {
  return {
    currentYear: 1,
    years: {
      1: {
        subjects: defaultSubjects[1].map((s) => ({ ...s })),
      },
      2: {
        subjects: defaultSubjects[2].map((s) => ({ ...s })),
      },
      3: {
        subjects: [],
      },
    },
  };
};

export const getSubjectsForYear = (
  data: StudentData,
  year: Year
): StudentData['years'][Year]['subjects'] => {
  if (year === 3 && data.year3Direction) {
    const direction = year3Directions.find((d) => d.id === data.year3Direction);
    if (direction) {
      // If direction is selected, use those subjects (or merge with existing data)
      return direction.subjects.map((dirSubject) => {
        // Try to find existing subject data to preserve grades
        const existingSubject = data.years[3].subjects.find(
          (s) => s.id === dirSubject.id
        );
        return existingSubject || { ...dirSubject, grades: [] };
      });
    }
  }

  // For years 1 and 2, or year 3 without direction
  if (data.years[year].subjects.length > 0) {
    return data.years[year].subjects;
  }

  // Initialize with default subjects if empty
  const defaultSubs = year === 3 ? [] : defaultSubjects[year];
  return defaultSubs.map((s) => ({ ...s }));
};

