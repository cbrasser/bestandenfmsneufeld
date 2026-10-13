import type { StudentData, Year, CombinedSubject, Subject } from '../types';
import { isSubject, isCombinedSubject } from '../types';
import { defaultSubjects, renamedSubjectIds, splitSubjectIds, year3Directions } from '../config/subjects';

export const initializeStudentData = (): StudentData => {
  return {
    currentYear: 1,
    years: {
      1: {
        subjects: reconcileSubjectList([], defaultSubjects[1]),
      },
      2: {
        subjects: reconcileSubjectList([], defaultSubjects[2]),
      },
      3: {
        subjects: [],
      },
    },
  };
};

// Builds the subject list from defaults (as fresh copies), carrying over saved grades
export function reconcileSubjectList(
  existing: (Subject | CombinedSubject)[],
  defaults: (Subject | CombinedSubject)[]
): (Subject | CombinedSubject)[] {
  const currentId = (s: Subject | CombinedSubject) => renamedSubjectIds[s.id] ?? s.id;

  return defaults.map((defaultSubject) => {
    const existingMatch = existing.find(s => currentId(s) === defaultSubject.id);

    if (isCombinedSubject(defaultSubject)) {
      if (existingMatch && !isCombinedSubject(existingMatch)) return existingMatch;

      const mergedSubjects = defaultSubject.subjects.map((sub) => {
        const existingSub = existingMatch?.subjects.find(s => currentId(s) === sub.id);
        return { ...sub, grades: existingSub?.grades ?? [], oralGrade: existingSub?.oralGrade };
      });
      // Grades of a former flat subject wait here until the user assigns them to a Teilfach
      const unassignedGrades = [
        ...(existingMatch?.unassignedGrades ?? []),
        ...existing
          .filter(isSubject)
          .filter(s => splitSubjectIds[s.id] === defaultSubject.id)
          .flatMap(s => s.grades),
      ];
      return {
        ...defaultSubject,
        subjects: mergedSubjects,
        ...(unassignedGrades.length > 0 && { unassignedGrades }),
      };
    }

    if (existingMatch && !isSubject(existingMatch)) return existingMatch;

    return { ...defaultSubject, grades: existingMatch?.grades ?? [], oralGrade: existingMatch?.oralGrade };
  });
}

export const reconcileAllYears = (data: StudentData): StudentData => {
  const direction = year3Directions.find((d) => d.id === data.year3Direction);

  return {
    ...data,
    // An unknown direction (e.g. a former placeholder) is cleared so the user picks a real one
    year3Direction: direction?.id,
    years: {
      1: { subjects: reconcileSubjectList(data.years[1].subjects, defaultSubjects[1]) },
      2: { subjects: reconcileSubjectList(data.years[2].subjects, defaultSubjects[2]) },
      3: {
        subjects: direction
          ? reconcileSubjectList(data.years[3].subjects, direction.subjects)
          : data.years[3].subjects,
      },
    },
  };
};

export const getSubjectsForYear = (
  data: StudentData,
  year: Year
): StudentData['years'][Year]['subjects'] => {
  // Year 3 subjects depend on the direction
  if (year === 3 && !data.year3Direction) return [];

  return data.years[year].subjects;
};
