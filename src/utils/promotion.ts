import type { PromotionCriteria, PromotionStatus, CombinedSubject, PromotionEntity } from '../types';
import { isCombinedSubject, isSubject } from '../types';

/**
 * Rounds a number to the nearest multiple of 0.5
 */
export const roundToHalf = (value: number): number => {
  return Math.round(value * 2) / 2;
};

/**
 * Rounds a number to at most 2 decimal places
 */
export const roundToTwoDecimals = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export const calculateFinalGrade = (subject: PromotionEntity): number => {
  if (isCombinedSubject(subject)) {
    return calculateFinalGradeCombined(subject);
  }

  if (isSubject(subject)) {
    if (subject.grades.length === 0) return 0;

    let totalWeightedSum = 0;
    let totalWeight = 0;

    subject.grades.forEach((grade) => {
      totalWeightedSum += grade.value * grade.weight;
      totalWeight += grade.weight;
    });

    const average = totalWeight > 0 ? totalWeightedSum / totalWeight : 0;
    // Round to nearest 0.5
    return roundToHalf(average);
  }

  return 0;
};

export const calculateFinalGradeCombined = (subject: CombinedSubject): number => {
  let sum = 0;
  let numGrades = 0;
  subject.subjects.forEach((sub) => {
    if (sub.grades.length > 0) {
      let grade = calculateFinalGrade(sub);
      sum += grade;
      numGrades += 1;
    }
  });
  const average = sum / numGrades;
  return roundToHalf(average);
};

export const combinedSubjectHasGrades = (subject: CombinedSubject): boolean => {
  return subject.subjects.some((sub) => sub.grades.length > 0);
}

export const checkPromotionCriteria = (
  subjects: PromotionEntity[],
  criteria: PromotionCriteria
): PromotionStatus => {
  const finalGrades = subjects.map((subject) => calculateFinalGrade(subject));
  const validGrades = finalGrades.filter((grade) => grade > 0);
  const hasGrades = validGrades.length > 0;

  // Calculate failures (grades below 4)
  const failures = validGrades.filter((grade) => grade < 4);

  // Calculate average (use rounded grades)
  const average =
    validGrades.length > 0
      ? validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length
      : 0;
  const roundedAverage = roundToHalf(average);

  // Calculate total deficit (sum of how much each grade is below 4)
  // Use rounded values for deficit calculation
  const deficit = failures.reduce(
    (sum, grade) => sum + Math.max(0, 4 - grade),
    0
  );
  const roundedDeficit = roundToTwoDecimals(deficit);

  const failuresPassed = failures.length <= criteria.maxFailures;
  const averagePassed = roundedAverage >= criteria.minAverage;
  const deficitPassed = roundedDeficit <= criteria.maxDeficit;

  return {
    isPassing: failuresPassed && averagePassed && deficitPassed,
    hasGrades,
    criteria: {
      failures: {
        passed: failuresPassed,
        count: failures.length,
        max: criteria.maxFailures,
      },
      average: {
        passed: averagePassed,
        value: roundedAverage,
        min: criteria.minAverage,
      },
      deficit: {
        passed: deficitPassed,
        value: roundedDeficit,
        max: criteria.maxDeficit,
      },
    },
  };
};

