import type { Division, PromotionCriteria } from '../types';

// FMS: "Promotionsbestimmungen FMS ab 24"
export const fmsCriteria: PromotionCriteria = {
  kind: 'fms',
  maxFailures: 3, // no more than 3 grades below 4, counted per Teilfach
  minAverage: 4, // average of the Fach grades at least 4
  maxDeficit: 2, // sum of how far Fach grades are below 4 at most 2
};

// Gymnasium: "Auszug aus den Promotionsbestimmungen" (Gymnasium Neufeld, 2023)
export const gymCriteria: PromotionCriteria = {
  kind: 'gym',
  maxFailures: 4, // no more than 4 grades below 4
  deficitFactor: 2, // twice the deficit may not exceed the surplus
};

// The rules are the same in every year of a Bildungsgang
export const getCriteria = (division: Division): PromotionCriteria =>
  division === 'Gymnasium' ? gymCriteria : fmsCriteria;
