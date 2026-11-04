import { isCombinedSubject, isSubject, type StudentData } from '../types';

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
