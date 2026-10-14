export type Semester = 'Herbstsemester' | 'Frühlingssemester';

export type Grade = {
  id: string;
  value: number; // 1-6
  weight: number; // e.g., 1, 2, 0.5
  label?: string; // optional description
  semester?: Semester; // optional semester
  date?: string; // ISO date string, e.g. "2025-03-14" (optional)
};

export type PromotionEntity = {
  id: string;
  name: string;
}

export interface Subject extends PromotionEntity {
  grades: Grade[];
  kind?: 'spf' | 'ef'; // Gymnasium: Schwerpunktfach or Ergänzungsfach
  oralGrade?: number; // optional oral grade adjustment (e.g., +0.03, -0.25)
};

export interface CombinedSubject extends PromotionEntity {
  subjects: Subject[];
  unassignedGrades?: Grade[]; // grades from a former flat subject, not yet assigned to a Teilfach
};

// Type guard functions
export function isSubject(entity: PromotionEntity): entity is Subject {
  return 'grades' in entity;
}

export function isCombinedSubject(entity: PromotionEntity): entity is CombinedSubject {
  return 'subjects' in entity;
}

// FMS has years 1 to 3, the Gymnasium 1 to 4
export type Year = 1 | 2 | 3 | 4;

export type Direction = {
  id: string;
  name: string;
  subjects: (Subject | CombinedSubject)[];
};

export type Division = 'FMS' | 'Gymnasium';

export type StudentInfo = {
  name: string;
  division: Division;
};

// The Gymnasium subjects a student chooses; the rest follow from the Lektionentafel
export type GymProfile = {
  thirdLanguage?: string; // Englisch, Italienisch or Latein
  arts?: string; // Bildnerisches Gestalten or Musik
  spf?: string; // Schwerpunktfach id
  ef?: string; // Ergänzungsfach id, taught in years 3 and 4
};

export type StudentData = {
  studentInfo?: StudentInfo;
  currentYear: Year;
  year3Direction?: string; // direction ID for year 3
  gymProfile?: GymProfile;
  years: {
    [key in Year]: {
      subjects: (Subject | CombinedSubject)[];
    };
  };
};

export type PromotionCriteria =
  | {
      kind: 'fms';
      maxFailures: number; // max number of grades below 4, counted per Teilfach
      minAverage: number; // minimum average of the Fach grades
      maxDeficit: number; // max sum of how far Fach grades are below 4
    }
  | {
      kind: 'gym';
      maxFailures: number; // max number of grades below 4
      deficitFactor: number; // the deficit, times this, may not exceed the surplus
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
    // FMS
    average?: {
      passed: boolean;
      value: number;
      min: number;
    };
    deficit?: {
      passed: boolean;
      value: number;
      max: number;
    };
    // Gymnasium: the doubled deficit is weighed against the surplus
    compensation?: {
      passed: boolean;
      surplus: number; // sum of how far grades are above 4
      deficit: number; // sum of how far grades are below 4, times the factor
      factor: number;
    };
  };
};
