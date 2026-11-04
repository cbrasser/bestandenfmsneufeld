import { describe, expect, it } from 'vitest';
import { endsWithoutPromotion, getCriteria } from '../src/config/criteria';
import { gymSubjectsForYear } from '../src/config/gymnasium';
import { defaultSubjects, year3Directions } from '../src/config/subjects';
import { translations } from '../src/i18n/locales';
import { getTranslatedSubjectName, hasSubjectTranslation } from '../src/i18n/subjectNames';
import type { CombinedSubject, Division, Subject } from '../src/types';
import { reconcileAllYears } from '../src/utils/initializeData';
import { calculateFinalGrade, checkPromotionCriteria, promotionVerdict, roundToHalf } from '../src/utils/promotion';
import { buildRuleCases } from './build';

// Generated cases only record what the code does today. These tests check the
// same rules against values worked out by hand from the official documents, so
// a wrong rule can't pass just by being generated.
const subject = (grade: number): Subject => ({
  id: `s${grade}`,
  name: 'Fach',
  grades: [{ id: 'g', value: grade, weight: 1 }],
});

const fach = (...grades: number[]): CombinedSubject => ({ id: 'f', name: 'Fach', subjects: grades.map(subject) });

const status = (division: Division, grades: number[]) =>
  checkPromotionCriteria(grades.map(subject), getCriteria(division));

describe('grades', () => {
  it('rounds to the half with ties going up', () => {
    expect([3.74, 3.75, 4.24, 4.25, 4.75].map(roundToHalf)).toEqual([3.5, 4, 4, 4.5, 5]);
  });

  it('weights grades', () => {
    const grades = [{ id: 'a', value: 6, weight: 2 }, { id: 'b', value: 3, weight: 1 }];
    expect(calculateFinalGrade({ id: 's', name: 's', grades } as Subject)).toBe(5);
  });

  it('applies the oral adjustment before rounding', () => {
    const grades = [{ id: 'a', value: 4.2, weight: 1 }];
    expect(calculateFinalGrade({ id: 's', name: 's', grades } as Subject)).toBe(4);
    expect(calculateFinalGrade({ id: 's', name: 's', grades, oralGrade: 0.05 } as Subject)).toBe(4.5);
  });

  it('averages the rounded Teilfach grades, then rounds the Fach', () => {
    // 3.75 rounds to 4 and 4.25 to 4.5, so the Fach is 4.25, then 4.5, not 4
    expect(calculateFinalGrade(fach(3.75, 4.25))).toBe(4.5);
  });

  it('counts a Teilfach that has grades in its Fach even if it ends at 0', () => {
    const zero: Subject = { id: 'z', name: 'z', grades: [{ id: 'g', value: 5, weight: 0 }] };
    const result: CombinedSubject = { id: 'f', name: 'f', subjects: [zero, subject(4)] };
    expect(calculateFinalGrade(result)).toBe(2);
  });
});

describe('FMS promotion: at most 3 below 4 per Teilfach, average at least 4, deficit at most 2', () => {
  it('passes at exactly 3 grades below 4', () => {
    expect(status('FMS', [3.5, 3.5, 3.5, 5, 5, 5]).criteria.failures).toEqual({ passed: true, count: 3, max: 3 });
    expect(status('FMS', [3.5, 3.5, 3.5, 5, 5, 5]).isPassing).toBe(true);
  });

  it('fails at 4 grades below 4', () => {
    const result = status('FMS', [3.5, 3.5, 3.5, 3.5, 6, 6, 6, 6]);
    expect(result.criteria.failures.count).toBe(4);
    expect(result.isPassing).toBe(false);
  });

  it('fails on an average below 4', () => {
    const result = status('FMS', [3.5, 4, 4]);
    expect(result.criteria.average).toEqual({ passed: false, value: 3.83, min: 4 });
    expect(result.isPassing).toBe(false);
  });

  it('passes at a deficit of exactly 2 and fails above it', () => {
    expect(status('FMS', [2, 6, 6]).criteria.deficit).toEqual({ passed: true, value: 2, max: 2 });
    expect(status('FMS', [2, 6, 6]).isPassing).toBe(true);
    expect(status('FMS', [1.5, 6, 6]).criteria.deficit).toEqual({ passed: false, value: 2.5, max: 2 });
    expect(status('FMS', [1.5, 6, 6]).isPassing).toBe(false);
  });

  it('counts failures per Teilfach but the deficit per Fach', () => {
    const result = checkPromotionCriteria([fach(3.5, 3.5, 4.5, 4.5)], getCriteria('FMS'));
    expect(result.criteria.failures.count).toBe(2);
    expect(result.criteria.deficit?.value).toBe(0);
    expect(result.criteria.average?.value).toBe(4);
  });
});

describe('Gymnasium promotion: at most 4 below 4, twice the deficit at most the surplus', () => {
  it('passes at exactly 4 grades below 4 when compensated', () => {
    const result = status('Gymnasium', [3.5, 3.5, 3.5, 3.5, 6, 6]);
    expect(result.criteria.failures).toEqual({ passed: true, count: 4, max: 4 });
    expect(result.criteria.compensation).toEqual({ passed: true, surplus: 4, deficit: 4, factor: 2 });
    expect(result.isPassing).toBe(true);
  });

  it('fails at 5 grades below 4 however large the surplus', () => {
    const result = status('Gymnasium', [3.5, 3.5, 3.5, 3.5, 3.5, 6, 6, 6]);
    expect(result.criteria.failures.passed).toBe(false);
    expect(result.criteria.compensation?.passed).toBe(true);
    expect(result.isPassing).toBe(false);
  });

  it('fails when twice the deficit is more than the surplus', () => {
    const result = status('Gymnasium', [3.5, 4.5]);
    expect(result.criteria.compensation).toEqual({ passed: false, surplus: 0.5, deficit: 1, factor: 2 });
    expect(result.isPassing).toBe(false);
  });
});

describe('the verdict', () => {
  it('says nothing about passing before there are grades, although the Gymnasium conditions hold', () => {
    expect(status('Gymnasium', []).isPassing).toBe(true);
    expect(promotionVerdict(status('Gymnasium', []))).toBe('noGrades');
    expect(promotionVerdict(status('FMS', []))).toBe('noGrades');
  });

  it('follows the conditions once there are grades', () => {
    expect(promotionVerdict(status('FMS', [4, 5]))).toBe('passing');
    expect(promotionVerdict(status('FMS', [3, 3]))).toBe('notPassing');
  });

  it('has no promotion after the last Gymnasium year only', () => {
    expect(endsWithoutPromotion('Gymnasium', 4)).toBe(true);
    expect(endsWithoutPromotion('Gymnasium', 3)).toBe(false);
    expect(endsWithoutPromotion('FMS', 3)).toBe(false);
  });
});

describe('subject tables', () => {
  const ids = (list: { id: string }[]) => list.map((s) => s.id);
  const common = ['deutsch', 'französisch', 'englisch', 'mathematik', 'biologie', 'sport'];

  it('gives each Berufsfeld its own year 3', () => {
    const table = (id: string) => ids(year3Directions.find((d) => d.id === id)!.subjects);
    expect(table('gesundheit')).toEqual([...common, 'humanbiologie', 'chemie-und-physik', 'mensch-und-gesellschaft']);
    expect(table('soziale-arbeit')).toEqual([...common, 'soziologie', 'gesellschaft-und-wirtschaft', 'mensch-und-gesellschaft']);
    expect(table('paedagogik')).toEqual([...common, 'psychologie', 'musik-und-bildnerisches-gestalten', 'naturwissenschaften-und-geografie']);
  });

  it('starts a language Schwerpunktfach in year 3, with that language as Grundlagenfach before', () => {
    const profile = { thirdLanguage: 'Englisch', arts: 'Musik', spf: 'latein' };
    expect(ids(gymSubjectsForYear(2, profile))).toContain('latein');
    expect(ids(gymSubjectsForYear(2, profile))).not.toContain('spf-latein');
    expect(ids(gymSubjectsForYear(2, profile))).not.toContain('englisch');
    expect(ids(gymSubjectsForYear(3, profile))).toContain('spf-latein');
    expect(ids(gymSubjectsForYear(3, profile))).not.toContain('latein');
  });

  it('starts the Ergänzungsfach in year 3', () => {
    expect(ids(gymSubjectsForYear(2, { ef: 'informatik' }))).not.toContain('ef-informatik');
    expect(ids(gymSubjectsForYear(3, { ef: 'informatik' }))).toContain('ef-informatik');
  });

  it('drops Einführung in Wirtschaft und Recht for the Schwerpunktfach of that name', () => {
    expect(ids(gymSubjectsForYear(2, {}))).toContain('einführung-in-wirtschaft-und-recht');
    expect(ids(gymSubjectsForYear(2, { spf: 'wirtschaft-und-recht' }))).not.toContain('einführung-in-wirtschaft-und-recht');
  });
});

describe('reconciling renamed and split subjects', () => {
  const grade = { id: 'g', value: 5, weight: 1 };
  const student = (year1: unknown[], year2: unknown[]) =>
    reconcileAllYears({
      studentInfo: { name: 'Test', division: 'FMS' },
      currentYear: 1,
      years: { 1: { subjects: year1 }, 2: { subjects: year2 }, 3: { subjects: [] }, 4: { subjects: [] } },
    } as never);

  it('keeps the grades of a renamed subject', () => {
    const result = student([{ id: 'maths', name: 'Maths', grades: [grade] }], []);
    const mathematik = result.years[1].subjects.find((s) => s.id === 'mathematik') as Subject;
    expect(mathematik.name).toBe('Mathematik');
    expect(mathematik.grades).toEqual([grade]);
  });

  it('keeps the grades of a split subject as unassigned', () => {
    const result = student([], [{ id: 'berufseinblicke', name: 'Berufseinblicke', grades: [grade] }]);
    const fachOfSplit = result.years[2].subjects.find((s) => s.id === 'berufsfeldeinblicke') as CombinedSubject;
    expect(fachOfSplit.unassignedGrades).toEqual([grade]);
    expect(calculateFinalGrade(fachOfSplit)).toBeNaN();
  });
});

describe('translations are complete', () => {
  const suite = (operation: string) => buildRuleCases().suites.find((s) => s.operation === operation)!;

  it.each(['de', 'fr', 'en', 'it'] as const)('every interface text exists in %s, without ß', (language) => {
    const result = suite('uiTranslations').cases.find((c) => (c.input as { language: string }).language === language);
    expect(result?.expected).toEqual({ missingKeys: [], keysWithEszett: [] });
    expect(Object.keys(translations[language]).sort()).toEqual(Object.keys(translations.de).sort());
  });

  it('every subject in every table has a name in all four languages, without ß', () => {
    const names = suite('subjectName').cases
      .map((c) => (c.input as { name: string }).name)
      .filter((name) => name !== 'Unbekanntes Fach');
    // Spot checks that the walk over the tables really reaches each table
    expect(names).toEqual(expect.arrayContaining([
      defaultSubjects[1][0].name,
      'Berufsfeldeinblicke',
      'Naturwissenschaften (Chemie/Physik)',
      'Gesundheit',
      'Einführung in Wirtschaft und Recht',
      'Physik und Anwendungen der Mathematik',
      'Religionslehre',
      'Latein',
    ]));
    for (const name of names) {
      expect(hasSubjectTranslation(name), name).toBe(true);
      for (const language of ['de', 'fr', 'en', 'it'] as const) {
        const translated = getTranslatedSubjectName(name, language);
        expect(translated.trim(), `${name} in ${language}`).not.toBe('');
        expect(translated, `${name} in ${language}`).not.toContain('ß');
      }
    }
  });
});
