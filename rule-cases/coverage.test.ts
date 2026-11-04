import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { RuleCasesFile } from './build';

// The lists are written out here on purpose: they say what the cases must cover,
// so they don't shrink along with the code. A new choice in the code that isn't
// listed here still gets its generated cases.
const file = JSON.parse(readFileSync(new URL('./rule-cases.json', import.meta.url), 'utf8')) as RuleCasesFile;

const suite = (operation: string) => {
  const found = file.suites.find((s) => s.operation === operation);
  if (!found) throw new Error(`No suite for ${operation}`);
  return found;
};

const inputs = <T>(operation: string) => suite(operation).cases.map((c) => c.input as T);

type TableInput = {
  year: number;
  direction?: string;
  profile?: { thirdLanguage?: string; arts?: string; spf?: string; ef?: string };
};
type DataInput = {
  data: {
    studentInfo?: { division: string };
    year3Direction?: string;
    gymProfile?: TableInput['profile'];
    years: Record<string, { subjects: { id: string; subjects?: { id: string }[] }[] }>;
  };
};

const BERUFSFELDER = ['gesundheit', 'soziale-arbeit', 'paedagogik'];
const THIRD_LANGUAGES = ['Englisch', 'Italienisch', 'Latein'];
const ARTS = ['Bildnerisches Gestalten', 'Musik'];
const SPF = [
  'bildnerisches-gestalten', 'biologie-chemie', 'englisch', 'italienisch', 'latein', 'musik',
  'philosophie-paedagogik-psychologie', 'physik-anwendungen-der-mathematik', 'spanisch', 'wirtschaft-und-recht',
];
const EF = [
  'anwendungen-der-mathematik', 'bildnerisches-gestalten', 'biologie', 'chemie', 'geografie', 'geschichte',
  'informatik', 'musik', 'pädagogik-psychologie', 'philosophie', 'physik', 'religionslehre', 'sport',
  'wirtschaft-und-recht',
];
const RENAMED = ['maths', 'geschichte-&-politik', 'french', 'english', 'math', 'biology'];
const SPLIT = ['berufseinblicke'];

describe('subject tables', () => {
  it('cover FMS years 1 and 2 and all three Berufsfelder in year 3', () => {
    const tables = inputs<TableInput>('fmsSubjectTable');
    expect(tables.map((t) => t.year)).toEqual(expect.arrayContaining([1, 2]));
    expect(tables.filter((t) => t.year === 3).map((t) => t.direction)).toEqual(expect.arrayContaining(BERUFSFELDER));
  });

  it.each([1, 2, 3, 4])('cover every Gymnasium choice type in year %i', (year) => {
    const profiles = inputs<TableInput>('gymSubjectTable').filter((t) => t.year === year).map((t) => t.profile);
    expect(profiles.map((p) => p?.thirdLanguage)).toEqual(expect.arrayContaining(THIRD_LANGUAGES));
    expect(profiles.map((p) => p?.arts)).toEqual(expect.arrayContaining(ARTS));
    expect(profiles.map((p) => p?.spf)).toEqual(expect.arrayContaining(SPF));
    expect(profiles.map((p) => p?.ef)).toEqual(expect.arrayContaining(EF));
  });
});

describe('whole students', () => {
  const students = inputs<DataInput>('studentResult').map((i) => i.data);
  const gym = students.filter((s) => s.studentInfo?.division === 'Gymnasium');
  const fms = students.filter((s) => s.studentInfo?.division === 'FMS');

  it('cover all three Berufsfelder', () => {
    expect(fms.map((s) => s.year3Direction)).toEqual(expect.arrayContaining(BERUFSFELDER));
  });

  it('cover every Gymnasium choice type', () => {
    expect(gym.map((s) => s.gymProfile?.thirdLanguage)).toEqual(expect.arrayContaining(THIRD_LANGUAGES));
    expect(gym.map((s) => s.gymProfile?.arts)).toEqual(expect.arrayContaining(ARTS));
    expect(gym.map((s) => s.gymProfile?.spf)).toEqual(expect.arrayContaining(['biologie-chemie', 'latein', 'spanisch', 'wirtschaft-und-recht']));
    expect(new Set(gym.map((s) => s.gymProfile?.ef)).size).toBeGreaterThan(1);
  });

  it('reach both a passing and a failing verdict in each Bildungsgang', () => {
    const verdicts = (division: string) =>
      suite('studentResult').cases
        .filter((c) => (c.input as DataInput).data.studentInfo?.division === division)
        .flatMap((c) => (c.expected as { years: { promotion: { hasGrades: boolean; isPassing: boolean } }[] }).years)
        .filter((y) => y.promotion.hasGrades)
        .map((y) => y.promotion.isPassing);
    for (const division of ['FMS', 'Gymnasium']) {
      expect(verdicts(division)).toEqual(expect.arrayContaining([true, false]));
    }
  });
});

describe('reconciliation', () => {
  const lists = inputs<{ existing: { id: string; subjects?: { id: string }[] }[] }>('reconcileSubjectList');
  const flatIds = lists.flatMap((l) => l.existing.map((s) => s.id));
  const teilfachIds = lists.flatMap((l) => l.existing.flatMap((s) => s.subjects?.map((sub) => sub.id) ?? []));

  it.each(RENAMED)('carries the renamed subject %s as a subject and as a Teilfach', (id) => {
    expect(flatIds).toContain(id);
    expect(teilfachIds).toContain(id);
  });

  it.each(SPLIT)('sends the grades of the split subject %s to unassigned', (id) => {
    expect(flatIds).toContain(id);
    const outcome = suite('reconcileSubjectList').cases
      .filter((c) => (c.input as { existing: { id: string }[] }).existing.some((s) => s.id === id))
      .flatMap((c) => (c.expected as { subjects: { unassignedGrades?: unknown[] }[] }).subjects);
    expect(outcome.some((s) => (s.unassignedGrades?.length ?? 0) > 0)).toBe(true);
  });

  it('runs on stored students with renamed and split subjects', () => {
    const ids = inputs<DataInput>('reconcileAllYears').flatMap((i) =>
      Object.values(i.data.years).flatMap((y) =>
        y.subjects.flatMap((s) => [s.id, ...(s.subjects?.map((sub) => sub.id) ?? [])])
      )
    );
    expect(ids).toEqual(expect.arrayContaining([...RENAMED, ...SPLIT]));
  });
});

describe('translations', () => {
  it('check the interface text in all four languages', () => {
    expect(inputs<{ language: string }>('uiTranslations').map((i) => i.language).sort()).toEqual(['de', 'en', 'fr', 'it']);
  });

  it('name every language for every subject', () => {
    for (const c of suite('subjectName').cases) {
      expect(Object.keys((c.expected as { names: object }).names).sort()).toEqual(['de', 'en', 'fr', 'it']);
    }
  });
});

it('every suite describes itself and has cases with unique names', () => {
  expect(new Set(file.suites.map((s) => s.operation)).size).toBe(file.suites.length);
  for (const s of file.suites) {
    expect(s.description).not.toBe('');
    expect(s.cases.length).toBeGreaterThan(0);
    expect(new Set(s.cases.map((c) => c.name)).size).toBe(s.cases.length);
  }
});
