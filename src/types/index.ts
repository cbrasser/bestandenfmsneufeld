export type Grade = {
  id: string;
  value: number; // 1-6
  weight: number; // e.g., 1, 2, 0.5
  label?: string; // optional description
};

export type PromotionEntity = {
  id: string;
  name: string;
}

export interface Subject extends PromotionEntity {
  grades: Grade[];
};

export interface CombinedSubject extends PromotionEntity {
  subjects: Subject[];
};

// Type guard functions
export function isSubject(entity: PromotionEntity): entity is Subject {
  return 'grades' in entity;
}

export function isCombinedSubject(entity: PromotionEntity): entity is CombinedSubject {
  return 'subjects' in entity;
}

export type Year = 1 | 2 | 3;

export type Direction = {
  id: string;
  name: string;
  subjects: Subject[];
};

export type Division = 'FMS' | 'Gymnasium';

export type StudentInfo = {
  name: string;
  division: Division;
};

export type StudentData = {
  studentInfo?: StudentInfo;
  currentYear: Year;
  year3Direction?: string; // direction ID for year 3
  years: {
    [key in Year]: {
      subjects: (Subject | CombinedSubject)[];
    };
  };
};

export type PromotionCriteria = {
  maxFailures: number; // max number of final grades below 4
  minAverage: number; // minimum average (typically 4)
  maxDeficit: number; // max total sum of grades below 4 (typically 2)
};

export type PromotionStatus = {
  isPassing: boolean;
  hasGrades: boolean; // Whether there are any grades entered yet
  criteria: {
    failures: {
      passed: boolean;
      count: number;
      max: number;
    };
    average: {
      passed: boolean;
      value: number;
      min: number;
    };
    deficit: {
      passed: boolean;
      value: number;
      max: number;
    };
  };
};

