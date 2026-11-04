// Each operation names one rule and calls the website's real code for it. A
// Kotlin runner implements the same names against its own port, see README.md.
import { getCriteria } from '../src/config/criteria';
import {
  artsOptions,
  effectiveThirdLanguage,
  ergaenzungsfaecher,
  GYM_YEARS,
  gymSubjectsForYear,
  isGymProfileComplete,
  schwerpunktfaecher,
  thirdLanguages,
} from '../src/config/gymnasium';
import { defaultSubjects, year3Directions } from '../src/config/subjects';
import { translations, type Language } from '../src/i18n/locales';
import { getTranslatedSubjectName } from '../src/i18n/subjectNames';
import type { CombinedSubject, Division, GymProfile, PromotionEntity, StudentData, Subject, Year } from '../src/types';
import { isCombinedSubject } from '../src/types';
import {
  getSubjectsForYear,
  initializeStudentData,
  reconcileAllYears,
  reconcileSubjectList,
  subjectsLosingGrades,
} from '../src/utils/initializeData';
import {
  calculateFinalGrade,
  checkPromotionCriteria,
  combinedSubjectHasGrades,
  roundToHalf,
  roundToTwoDecimals,
} from '../src/utils/promotion';

export const LANGUAGES: Language[] = ['de', 'fr', 'en', 'it'];

type AnySubject = Subject | CombinedSubject;

const FMS_YEARS: Year[] = [1, 2, 3];

const fmsSubjects = (year: Year, direction?: string): AnySubject[] =>
  year === 3 ? (year3Directions.find((d) => d.id === direction)?.subjects ?? []) : defaultSubjects[year];

const gradeOf = (subject: AnySubject) => ({
  id: subject.id,
  name: subject.name,
  grade: calculateFinalGrade(subject),
  ...(isCombinedSubject(subject) && {
    teilfaecher: subject.subjects.map((sub) => ({
      id: sub.id,
      name: sub.name,
      grade: calculateFinalGrade(sub),
    })),
  }),
});

// Blank in every language and never shown
const UNUSED_KEYS = ['swipeHint'];

const uiKeys = () =>
  [...new Set(LANGUAGES.flatMap((language) => Object.keys(translations[language])))]
    .filter((key) => !UNUSED_KEYS.includes(key))
    .sort();

export const operations = {
  roundToHalf: ({ value }: { value: number }) => ({ result: roundToHalf(value) }),

  roundToTwoDecimals: ({ value }: { value: number }) => ({ result: roundToTwoDecimals(value) }),

  finalGrade: ({ subject }: { subject: PromotionEntity }) => ({ grade: calculateFinalGrade(subject) }),

  combinedSubjectHasGrades: ({ subject }: { subject: CombinedSubject }) => ({
    result: combinedSubjectHasGrades(subject),
  }),

  promotionCriteria: ({ division }: { division: Division }) => ({ criteria: getCriteria(division) }),

  checkPromotion: ({ division, subjects }: { division: Division; subjects: PromotionEntity[] }) => ({
    status: checkPromotionCriteria(subjects, getCriteria(division)),
  }),

  fmsSubjectTable: ({ year, direction }: { year: Year; direction?: string }) => ({
    subjects: fmsSubjects(year, direction),
  }),

  gymSubjectTable: ({ year, profile }: { year: Year; profile?: GymProfile }) => ({
    subjects: gymSubjectsForYear(year, profile),
  }),

  subjectChoices: () => ({
    berufsfelder: year3Directions.map(({ id, name }) => ({ id, name })),
    thirdLanguages,
    artsOptions,
    schwerpunktfaecher,
    ergaenzungsfaecher,
  }),

  effectiveThirdLanguage: ({ profile }: { profile: GymProfile }) => ({
    result: effectiveThirdLanguage(profile) ?? null,
  }),

  isGymProfileComplete: ({ year, profile }: { year: Year; profile?: GymProfile }) => ({
    result: isGymProfileComplete(year, profile),
  }),

  initialData: () => ({ data: initializeStudentData() }),

  reconcileSubjectList: ({ existing, defaults }: { existing: AnySubject[]; defaults: AnySubject[] }) => ({
    subjects: reconcileSubjectList(existing, defaults),
  }),

  reconcileAllYears: ({ data }: { data: StudentData }) => ({ data: reconcileAllYears(data) }),

  subjectsForYear: ({ data, year }: { data: StudentData; year: Year }) => ({
    subjects: getSubjectsForYear(data, year),
  }),

  // What changing the Gymnasium choices would cost, as the website asks before saving
  subjectsLosingGrades: ({ data, newProfile }: { data: StudentData; newProfile: GymProfile }) => ({
    names: subjectsLosingGrades(data, reconcileAllYears({ ...data, gymProfile: newProfile })),
  }),

  // The whole seam: stored data in, the reconciled data, every grade and every verdict out
  studentResult: ({ data }: { data: StudentData }) => {
    const reconciled = reconcileAllYears(data);
    const division = reconciled.studentInfo?.division ?? 'FMS';
    const years = division === 'Gymnasium' ? GYM_YEARS : FMS_YEARS;
    return {
      data: reconciled,
      years: years.map((year) => {
        const subjects = getSubjectsForYear(reconciled, year);
        return {
          year,
          subjects: subjects.map(gradeOf),
          promotion: checkPromotionCriteria(subjects, getCriteria(division)),
        };
      }),
    };
  },

  subjectName: ({ name }: { name: string }) => ({
    names: Object.fromEntries(LANGUAGES.map((language) => [language, getTranslatedSubjectName(name, language)])),
  }),

  uiTranslations: ({ language }: { language: Language }) => {
    const text = translations[language] as unknown as Record<string, string | undefined>;
    return {
      missingKeys: uiKeys().filter((key) => !text[key]?.trim()),
      keysWithEszett: uiKeys().filter((key) => text[key]?.includes('ß')),
    };
  },
};

export type OperationName = keyof typeof operations;
