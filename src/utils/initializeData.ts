import type { StudentData, Year, CombinedSubject, Subject } from '../types';
import { isSubject, isCombinedSubject } from '../types';
import { defaultSubjects, renamedSubjectIds, splitSubjectIds, year3Directions } from '../config/subjects';
import { GYM_YEARS, gymSubjectsForYear } from '../config/gymnasium';

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
      4: {
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
  // Data saved before the Gymnasium existed has no year 4
  const existing = (year: Year) => data.years[year]?.subjects ?? [];

  if (data.studentInfo?.division === 'Gymnasium') {
    const years = { ...data.years };
    GYM_YEARS.forEach((year) => {
      years[year] = { subjects: reconcileSubjectList(existing(year), gymSubjectsForYear(year, data.gymProfile)) };
    });
    return { ...data, years };
  }

  const direction = year3Directions.find((d) => d.id === data.year3Direction);

  return {
    ...data,
    // The FMS has no year 4
    currentYear: data.currentYear === 4 ? 3 : data.currentYear,
    // An unknown direction (e.g. a former placeholder) is cleared so the user picks a real one
    year3Direction: direction?.id,
    years: {
      1: { subjects: reconcileSubjectList(existing(1), defaultSubjects[1]) },
      2: { subjects: reconcileSubjectList(existing(2), defaultSubjects[2]) },
      3: {
        subjects: direction
          ? reconcileSubjectList(existing(3), direction.subjects)
          : existing(3),
      },
      4: { subjects: existing(4) },
    },
  };
};

// Subjects whose saved grades a profile change would drop
export const subjectsLosingGrades = (before: StudentData, after: StudentData): string[] =>
  GYM_YEARS.flatMap((year) => {
    const kept = new Set(after.years[year].subjects.map((s) => s.id));
    return (before.years[year]?.subjects ?? [])
      .filter((s) => !kept.has(s.id) && isSubject(s) && s.grades.length > 0)
      .map((s) => s.name);
  });

export const getSubjectsForYear = (
  data: StudentData,
  year: Year
): StudentData['years'][Year]['subjects'] => {
  // FMS year 3 subjects depend on the direction
  if (data.studentInfo?.division !== 'Gymnasium' && year === 3 && !data.year3Direction) return [];

  return data.years[year]?.subjects ?? [];
};
