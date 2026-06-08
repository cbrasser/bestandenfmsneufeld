import type { StudentData, Year, CombinedSubject, Subject } from '../types';
import { isSubject, isCombinedSubject } from '../types';
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

function reconcileSubjectList(
  existing: (Subject | CombinedSubject)[],
  defaults: (Subject | CombinedSubject)[]
): (Subject | CombinedSubject)[] {
  return defaults.map((defaultSubject) => {
    const existingMatch = existing.find(s => s.id === defaultSubject.id);
    if (!existingMatch) return { ...defaultSubject };

    if (isSubject(existingMatch) && isSubject(defaultSubject)) {
      return { ...defaultSubject, grades: existingMatch.grades, oralGrade: existingMatch.oralGrade };
    }

    if (isCombinedSubject(existingMatch) && isCombinedSubject(defaultSubject)) {
      const mergedSubjects = defaultSubject.subjects.map((sub) => {
        const existingSub = existingMatch.subjects.find(s => s.id === sub.id);
        if (existingSub) {
          return { ...sub, grades: existingSub.grades, oralGrade: existingSub.oralGrade };
        }
        return sub;
      });
      return { ...defaultSubject, subjects: mergedSubjects };
    }

    return existingMatch;
  });
}

export const reconcileAllYears = (data: StudentData): StudentData => {
  return {
    ...data,
    years: {
      1: { subjects: reconcileSubjectList(data.years[1].subjects, defaultSubjects[1]) },
      2: { subjects: reconcileSubjectList(data.years[2].subjects, defaultSubjects[2]) },
      3: { subjects: data.years[3].subjects },
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
      return direction.subjects.map((dirSubject) => {
        const existingSubject = data.years[3].subjects.find(
          (s) => s.id === dirSubject.id
        );
        return existingSubject || { ...dirSubject, grades: [] };
      });
    }
  }

  return data.years[year].subjects;
};
