import type { PromotionCriteria } from '../types';

// Promotion criteria for year 1 (as specified)
export const year1Criteria: PromotionCriteria = {
  maxFailures: 4, // no more than 4 final grades below 4
  minAverage: 4, // average above or equal to 4
  maxDeficit: 2, // total sum of grades below 4 is not larger than 2
};

// Default criteria for other years (can be customized)
export const year2Criteria: PromotionCriteria = {
  maxFailures: 4,
  minAverage: 4,
  maxDeficit: 2,
};

export const year3Criteria: PromotionCriteria = {
  maxFailures: 4,
  minAverage: 4,
  maxDeficit: 2,
};

export const getCriteriaForYear = (year: 1 | 2 | 3): PromotionCriteria => {
  switch (year) {
    case 1:
      return year1Criteria;
    case 2:
      return year2Criteria;
    case 3:
      return year3Criteria;
  }
};

