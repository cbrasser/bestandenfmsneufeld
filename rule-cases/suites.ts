// The inputs of every rule case. Expected results are never written here: build.ts
// gets them from the website's real code. Tables and rename lists are walked from
// the code, so a new subject or choice gets its cases without a change here.
import {
  artsOptions,
  ergaenzungsfaecher,
  GYM_YEARS,
  gymSubjectsForYear,
  schwerpunktfaecher,
  thirdLanguages,
} from '../src/config/gymnasium';
import { defaultSubjects, renamedSubjectIds, splitSubjectIds, year3Directions } from '../src/config/subjects';
import type { CombinedSubject, Division, Grade, GymProfile, StudentData, Subject, Year } from '../src/types';
import { isCombinedSubject } from '../src/types';
import { DATA_VERSION } from '../src/utils/dataVersion';
import { reconcileAllYears } from '../src/utils/initializeData';
import { LANGUAGES, type AnySubject, type OperationName } from './operations';

export type SuiteDefinition = {
  operation: OperationName;
  description: string;
  input: string;
  expected: string;
  cases: { name: string; input: unknown }[];
};

type GradeSpec = number | [value: number, weight: number];

const grades = (...specs: GradeSpec[]): Grade[] =>
  specs.map((spec, i) => {
    const [value, weight] = Array.isArray(spec) ? spec : [spec, 1];
    return { id: `g${i + 1}`, value, weight };
  });

const flat = (id: string, ...specs: GradeSpec[]): Subject => ({ id, name: id, grades: grades(...specs) });

const oral = (subject: Subject, oralGrade: number): Subject => ({ ...subject, oralGrade });

const fach = (id: string, ...subjects: Subject[]): CombinedSubject => ({ id, name: id, subjects });

// One graded subject per value, with ids that stay apart
const flats = (...values: number[]): Subject[] => values.map((value, i) => flat(`s${i + 1}`, value));

const BASE_PROFILE: GymProfile = {
  thirdLanguage: 'Englisch',
  arts: 'Musik',
  spf: 'biologie-chemie',
  ef: 'informatik',
};

const student = (
  division: Division | undefined,
  years: Partial<Record<Year, AnySubject[]>>,
  extra: Partial<StudentData> = {}
): StudentData => ({
  ...(division && { studentInfo: { name: 'Test', division } }),
  currentYear: 1,
  years: {
    1: { subjects: years[1] ?? [] },
    2: { subjects: years[2] ?? [] },
    3: { subjects: years[3] ?? [] },
    4: { subjects: years[4] ?? [] },
  },
  ...extra,
});

// Gives every Subject and Teilfach one grade, walking through the values in turn
const withGrades = (subjects: AnySubject[], values: number[]): AnySubject[] => {
  let next = 0;
  const graded = (subject: Subject): Subject => ({
    ...subject,
    grades: [{ id: `${subject.id}-g`, value: values[next++ % values.length], weight: 1 }],
  });
  return subjects.map((s) =>
    isCombinedSubject(s) ? { ...s, subjects: s.subjects.map(graded) } : graded(s as Subject)
  );
};

// Stored data with grades in every year of the student's subjects
const fmsStudent = (direction: string, values: number[]): StudentData => {
  const year3 = year3Directions.find((d) => d.id === direction)?.subjects ?? [];
  return student(
    'FMS',
    { 1: withGrades(defaultSubjects[1], values), 2: withGrades(defaultSubjects[2], values), 3: withGrades(year3, values) },
    { year3Direction: direction }
  );
};

const gymStudent = (profile: GymProfile, values: number[]): StudentData =>
  student(
    'Gymnasium',
    Object.fromEntries(GYM_YEARS.map((year) => [year, withGrades(gymSubjectsForYear(year, profile), values)])),
    { gymProfile: profile }
  );

const PASSING = [4.5, 5, 4, 5.5];
const FAILING = [3, 3.5, 2.5, 4];

const LANGUAGE_AND_ARTS_VARIANTS: { name: string; profile: GymProfile }[] = [
  ...thirdLanguages.map((thirdLanguage) => ({
    name: `third language ${thirdLanguage}`,
    profile: { ...BASE_PROFILE, thirdLanguage },
  })),
  ...artsOptions.map((arts) => ({ name: `arts ${arts}`, profile: { ...BASE_PROFILE, arts } })),
];

const CHOICE_VARIANTS = [
  ...LANGUAGE_AND_ARTS_VARIANTS,
  ...schwerpunktfaecher.map(({ id: spf }) => ({ name: `Schwerpunktfach ${spf}`, profile: { ...BASE_PROFILE, spf } })),
  ...ergaenzungsfaecher.map(({ id: ef }) => ({ name: `Ergänzungsfach ${ef}`, profile: { ...BASE_PROFILE, ef } })),
];

// Whole students per kind of choice. The subject tables cover every single value.
const STUDENT_VARIANTS = [
  ...LANGUAGE_AND_ARTS_VARIANTS,
  { name: 'language Schwerpunktfach', profile: { ...BASE_PROFILE, spf: 'latein' } },
  { name: 'Schwerpunktfach Spanisch', profile: { ...BASE_PROFILE, spf: 'spanisch' } },
  { name: 'Schwerpunktfach Wirtschaft und Recht', profile: { ...BASE_PROFILE, spf: 'wirtschaft-und-recht' } },
  { name: 'other Ergänzungsfach', profile: { ...BASE_PROFILE, ef: 'sport' } },
  { name: 'choices not made yet', profile: {} },
];

const valueCases = (list: number[]) => list.map((value) => ({ name: String(value), input: { value } }));

const renamedCases = () =>
  Object.entries(renamedSubjectIds).flatMap(([oldId, newId]) => [
    {
      name: `renamed ${oldId} to ${newId}, as a Subject`,
      input: {
        existing: [oral({ ...flat(oldId, 5), name: 'old name' }, 0.25)],
        defaults: [{ id: newId, name: 'current name', grades: [] }],
      },
    },
    {
      name: `renamed ${oldId} to ${newId}, as a Teilfach`,
      input: {
        existing: [fach('fach', oral(flat(oldId, 5), 0.25))],
        defaults: [fach('fach', { id: newId, name: 'current name', grades: [] })],
      },
    },
  ]);

const splitCases = () =>
  Object.entries(splitSubjectIds).flatMap(([oldId, newId]) => {
    const defaults = [fach(newId, flat('teilfach-a'), flat('teilfach-b'))];
    return [
      {
        name: `split ${oldId}: its grades wait as unassigned`,
        input: { existing: [flat(oldId, 5, 4)], defaults },
      },
      {
        name: `split ${oldId} without grades: no unassigned list appears`,
        input: { existing: [flat(oldId)], defaults },
      },
      {
        name: `split ${oldId}: its oral adjustment is dropped`,
        input: { existing: [oral(flat(oldId, 5), 0.25)], defaults },
      },
      {
        name: `split ${oldId}: new grades join the ones already unassigned, after them`,
        input: {
          existing: [
            { ...fach(newId, flat('teilfach-a', 6), flat('teilfach-b')), unassignedGrades: grades(2) },
            flat(oldId, 5),
          ],
          defaults,
        },
      },
    ];
  });

const directionSwitchCases = () =>
  year3Directions.flatMap((from) =>
    year3Directions
      .filter((to) => to.id !== from.id)
      .map((to) => ({
        name: `changing Berufsfeld from ${from.id} to ${to.id}`,
        input: { existing: withGrades(from.subjects, PASSING), defaults: to.subjects },
      }))
  );

const allSubjectNames = (): string[] => {
  const names = (subjects: AnySubject[]): string[] =>
    subjects.flatMap((s) => [s.name, ...(isCombinedSubject(s) ? s.subjects.map((sub) => sub.name) : [])]);
  const profiles: GymProfile[] = CHOICE_VARIANTS.map((v) => v.profile);
  return [
    ...new Set([
      ...names(defaultSubjects[1]),
      ...names(defaultSubjects[2]),
      ...year3Directions.flatMap((d) => [d.name, ...names(d.subjects)]),
      ...GYM_YEARS.flatMap((year) => profiles.flatMap((profile) => names(gymSubjectsForYear(year, profile)))),
      ...schwerpunktfaecher.map((s) => s.name),
      ...ergaenzungsfaecher.map((e) => e.name),
      ...thirdLanguages,
      ...artsOptions,
    ]),
  ].sort();
};

export const suites = (): SuiteDefinition[] => [
  {
    operation: 'roundToHalf',
    description: 'Rounds to the nearest 0.5, used for every Fach and Teilfach grade. Ties go towards positive infinity.',
    input: '{ value: number }',
    expected: '{ result: number }',
    cases: valueCases([
      0, 1, 3.74, 3.75, 3.76, 4, 4.24, 4.25, 4.26, 4.5, 4.75, 5.25, 5.75, 6,
      // the doubles just below a tie
      0.24999999999999997, 2.2499999999999996,
      // ties below zero show the difference to rounding away from zero
      -0.2, -0.25, -0.75,
    ]),
  },
  {
    operation: 'roundToTwoDecimals',
    description: 'Rounds to two decimals, used for the average, deficit and surplus. Grade values and weights are rounded this way on entry. Works on the double as stored, so 1.005 lands below its tie.',
    input: '{ value: number }',
    expected: '{ result: number }',
    cases: valueCases([0, 1.005, 1.015, 2.675, 4.125, 3.8333333333333335, 4.166666666666667, -0.125, -1.005]),
  },
  {
    operation: 'finalGrade',
    description: `The rounded grade of a Subject or CombinedSubject. The oral adjustment is added before rounding; a Fach averages its rounded Teilfach grades.`,
    input: '{ subject: Subject | CombinedSubject }',
    expected: '{ grade: number | null }',
    cases: [
      { name: 'no grades', input: { subject: flat('s') } },
      { name: 'one grade', input: { subject: flat('s', 4.5) } },
      { name: 'equal weights', input: { subject: flat('s', 4, 5, 6) } },
      { name: 'different weights', input: { subject: flat('s', [6, 2], [3, 1]) } },
      { name: 'half weight', input: { subject: flat('s', [6, 0.5], [4, 1]) } },
      { name: 'decimal weights and values', input: { subject: flat('s', [4.1, 0.3], [4.7, 0.7], [5.3, 0.1]) } },
      { name: 'average on a tie rounds up', input: { subject: flat('s', 4, 4.5) } },
      { name: 'average just below a tie rounds down', input: { subject: flat('s', 4, 4.49) } },
      { name: 'oral adjustment lifts over a tie', input: { subject: oral(flat('s', 4.2), 0.05) } },
      { name: 'small oral adjustment stays below a tie', input: { subject: oral(flat('s', 4.2), 0.03) } },
      { name: 'negative oral adjustment drops below a tie', input: { subject: oral(flat('s', 4.25), -0.25) } },
      { name: 'oral adjustment landing exactly on a tie', input: { subject: oral(flat('s', 4), 0.25) } },
      { name: 'oral adjustment alone is no grade', input: { subject: oral(flat('s'), 0.5) } },
      { name: 'only zero weights', input: { subject: flat('s', [5, 0]) } },
      { name: 'only zero weights, with an oral adjustment', input: { subject: oral(flat('s', [5, 0]), 0.5) } },
      { name: 'Fach with no grades has no grade', input: { subject: fach('f', flat('a'), flat('b')) } },
      { name: 'Fach with no Teilfächer has no grade', input: { subject: fach('f') } },
      { name: 'Fach counts only Teilfächer with grades', input: { subject: fach('f', flat('a', 5), flat('b')) } },
      { name: 'Fach of three Teilfächer', input: { subject: fach('f', flat('a', 5), flat('b', 4), flat('c', 3.5)) } },
      { name: 'Fach average on a tie rounds up', input: { subject: fach('f', flat('a', 3.5), flat('b', 4)) } },
      { name: 'Fach averages rounded grades, not raw ones', input: { subject: fach('f', flat('a', 3.75), flat('b', 4.25)) } },
      { name: 'Teilfach oral adjustment counts', input: { subject: fach('f', oral(flat('a', 4.2), 0.05), flat('b', 4)) } },
      { name: 'oral adjustment on an empty Teilfach does not count', input: { subject: fach('f', oral(flat('a'), 0.5), flat('b', 4)) } },
      { name: 'unassigned grades do not count', input: { subject: { ...fach('f', flat('a', 4)), unassignedGrades: grades(6) } } },
      { name: 'a Teilfach with only zero weights counts as 0 in its Fach', input: { subject: fach('f', flat('a', [5, 0]), flat('b', 4)) } },
      { name: 'a Teilfach brought to 0 by an oral adjustment counts as 0 in its Fach', input: { subject: fach('f', oral(flat('a', 4), -4), flat('b', 4)) } },
      { name: 'a Teilfach below 0 lowers its Fach further', input: { subject: fach('f', oral(flat('a', 4), -5), flat('b', 4)) } },
      { name: 'only unassigned grades gives no grade', input: { subject: { ...fach('f', flat('a')), unassignedGrades: grades(6) } } },
    ],
  },
  {
    operation: 'combinedSubjectHasGrades',
    description: 'Whether any Teilfach of a Fach has grades. Unassigned grades do not count.',
    input: '{ subject: CombinedSubject }',
    expected: '{ result: boolean }',
    cases: [
      { name: 'none', input: { subject: fach('f', flat('a'), flat('b')) } },
      { name: 'one Teilfach', input: { subject: fach('f', flat('a'), flat('b', 5)) } },
      { name: 'only unassigned', input: { subject: { ...fach('f', flat('a')), unassignedGrades: grades(5) } } },
    ],
  },
  {
    operation: 'promotionCriteria',
    description: 'The official limits of a Bildungsgang. They are the same in every year.',
    input: '{ division: "FMS" | "Gymnasium" }',
    expected: '{ criteria: { kind: "fms", maxFailures, minAverage, maxDeficit } | { kind: "gym", maxFailures, deficitFactor } }',
    cases: [
      { name: 'FMS', input: { division: 'FMS' } },
      { name: 'Gymnasium', input: { division: 'Gymnasium' } },
    ],
  },
  {
    operation: 'checkPromotion',
    description: 'The verdict and each condition for one year. Subjects without a grade are left out. FMS counts failures per Teilfach, and the average and deficit per Fach. The Gymnasium counts every Fach grade once.',
    input: '{ division: "FMS" | "Gymnasium", subjects: (Subject | CombinedSubject)[] }',
    expected: '{ verdict: PromotionVerdict, status: PromotionStatus }',
    cases: [
      ...(['FMS', 'Gymnasium'] as const).flatMap((division) => [
        { name: `${division}: no subjects`, input: { division, subjects: [] } },
        { name: `${division}: subjects without grades`, input: { division, subjects: [flat('a'), fach('f', flat('b'))] } },
      ]),
      { name: 'FMS: all at 4', input: { division: 'FMS', subjects: flats(4, 4, 4) } },
      { name: 'FMS: exactly 3 failures', input: { division: 'FMS', subjects: flats(3.5, 3.5, 3.5, 5, 5, 5) } },
      { name: 'FMS: 4 failures', input: { division: 'FMS', subjects: flats(3.5, 3.5, 3.5, 3.5, 6, 6, 6, 6) } },
      { name: 'FMS: average below 4', input: { division: 'FMS', subjects: flats(3.5, 4, 4) } },
      { name: 'FMS: average rounded to two decimals', input: { division: 'FMS', subjects: flats(4, 4.5, 5) } },
      { name: 'FMS: deficit exactly 2', input: { division: 'FMS', subjects: flats(2, 6, 6) } },
      { name: 'FMS: deficit above 2', input: { division: 'FMS', subjects: flats(1.5, 6, 6) } },
      { name: 'FMS: every condition fails', input: { division: 'FMS', subjects: flats(2, 2, 2, 2) } },
      { name: 'FMS: failures per Teilfach, deficit per Fach', input: { division: 'FMS', subjects: [fach('f', flat('a', 3.5), flat('b', 3.5), flat('c', 4.5), flat('d', 4.5))] } },
      { name: 'FMS: 4 failing Teilfächer fail even with a good Fach grade', input: { division: 'FMS', subjects: [fach('f', flat('a', 3.5), flat('b', 3.5), flat('c', 3.5), flat('d', 3.5), flat('e', 6), flat('g', 6), flat('h', 6), flat('i', 6))] } },
      { name: 'FMS: a Fach with no grades is left out', input: { division: 'FMS', subjects: [fach('f', flat('a')), flat('b', 4)] } },
      { name: 'FMS: an empty Teilfach is left out', input: { division: 'FMS', subjects: [fach('f', flat('a'), flat('b', 3.5))] } },
      { name: 'FMS: a final grade at or below 0 is left out', input: { division: 'FMS', subjects: [oral(flat('a', 1), -2), flat('b', 4)] } },
      { name: 'FMS: a Teilfach at 0 is no failure, but lowers its Fach', input: { division: 'FMS', subjects: [fach('f', flat('a', [5, 0]), flat('b', 4))] } },
      { name: 'Gymnasium: all at 4', input: { division: 'Gymnasium', subjects: flats(4, 4, 4) } },
      { name: 'Gymnasium: exactly 4 failures, compensated', input: { division: 'Gymnasium', subjects: flats(3.5, 3.5, 3.5, 3.5, 6, 6) } },
      { name: 'Gymnasium: 5 failures, compensated', input: { division: 'Gymnasium', subjects: flats(3.5, 3.5, 3.5, 3.5, 3.5, 6, 6, 6) } },
      { name: 'Gymnasium: doubled deficit equals surplus', input: { division: 'Gymnasium', subjects: flats(3.5, 5) } },
      { name: 'Gymnasium: doubled deficit above surplus', input: { division: 'Gymnasium', subjects: flats(3.5, 4.5) } },
      { name: 'Gymnasium: no surplus', input: { division: 'Gymnasium', subjects: flats(3.5, 4) } },
      { name: 'Gymnasium: a Fach counts once, by its own grade', input: { division: 'Gymnasium', subjects: [fach('f', flat('a', 3.5), flat('b', 4.5))] } },
    ],
  },
  {
    operation: 'fmsSubjectTable',
    description: 'The official FMS subjects. Years 1 and 2 are the same for everyone; year 3 follows the Berufsfeld (called direction in the data).',
    input: '{ year: 1 | 2 | 3 | 4, direction?: string }',
    expected: '{ subjects: (Subject | CombinedSubject)[] }, all without grades and in display order',
    cases: [
      { name: 'year 1', input: { year: 1 } },
      { name: 'year 2', input: { year: 2 } },
      ...year3Directions.map((d) => ({ name: `year 3, ${d.id}`, input: { year: 3, direction: d.id } })),
      { name: 'year 3 with no Berufsfeld yet', input: { year: 3 } },
      { name: 'year 3 with an unknown Berufsfeld', input: { year: 3, direction: 'unknown' } },
      { name: 'year 4 does not exist', input: { year: 4 } },
    ],
  },
  {
    operation: 'gymSubjectTable',
    description: 'The Gymnasium subjects of one year, following the choices made. A choice not made yet is left out.',
    input: '{ year: 1 | 2 | 3 | 4, profile?: GymProfile }',
    expected: '{ subjects: Subject[] }, all without grades and in display order',
    cases: GYM_YEARS.flatMap((year) => [
      { name: `year ${year}, no profile`, input: { year } },
      { name: `year ${year}, no choices`, input: { year, profile: {} } },
      { name: `year ${year}, base profile`, input: { year, profile: BASE_PROFILE } },
      { name: `year ${year}, unknown Schwerpunktfach and Ergänzungsfach`, input: { year, profile: { spf: 'unknown', ef: 'unknown' } } },
      ...CHOICE_VARIANTS.map(({ name, profile }) => ({ name: `year ${year}, ${name}`, input: { year, profile } })),
    ]),
  },
  {
    operation: 'subjectChoices',
    description: 'Everything a student can choose: the Berufsfelder and the Gymnasium options, in display order.',
    input: '{}',
    expected: '{ berufsfelder, thirdLanguages, artsOptions, schwerpunktfaecher, ergaenzungsfaecher }',
    cases: [{ name: 'all choices', input: {} }],
  },
  {
    operation: 'effectiveThirdLanguage',
    description: 'The third language after the choices: a language Schwerpunktfach decides it.',
    input: '{ profile: GymProfile }',
    expected: '{ result: string | null }',
    cases: [
      { name: 'nothing chosen', input: { profile: {} } },
      { name: 'chosen', input: { profile: { thirdLanguage: 'Italienisch' } } },
      { name: 'non-language Schwerpunktfach keeps the choice', input: { profile: { thirdLanguage: 'Italienisch', spf: 'musik' } } },
      { name: 'Spanisch is no third language', input: { profile: { thirdLanguage: 'Italienisch', spf: 'spanisch' } } },
      { name: 'language Schwerpunktfach with nothing chosen', input: { profile: { spf: 'latein' } } },
      ...schwerpunktfaecher.map(({ id: spf }) => ({
        name: `Schwerpunktfach ${spf} over the choice of Italienisch`,
        input: { profile: { thirdLanguage: 'Italienisch', spf } },
      })),
    ],
  },
  {
    operation: 'isGymProfileComplete',
    description: 'Whether a student has made every choice needed in this year. The Ergänzungsfach is only needed from year 3.',
    input: '{ year: 1 | 2 | 3 | 4, profile?: GymProfile }',
    expected: '{ result: boolean }',
    cases: GYM_YEARS.flatMap((year) => [
      { name: `year ${year}, no profile`, input: { year } },
      { name: `year ${year}, everything chosen`, input: { year, profile: BASE_PROFILE } },
      { name: `year ${year}, no third language`, input: { year, profile: { ...BASE_PROFILE, thirdLanguage: undefined } } },
      { name: `year ${year}, no third language but a language Schwerpunktfach`, input: { year, profile: { ...BASE_PROFILE, thirdLanguage: undefined, spf: 'latein' } } },
      { name: `year ${year}, no arts`, input: { year, profile: { ...BASE_PROFILE, arts: undefined } } },
      { name: `year ${year}, no Schwerpunktfach`, input: { year, profile: { ...BASE_PROFILE, spf: undefined } } },
      { name: `year ${year}, no Ergänzungsfach`, input: { year, profile: { ...BASE_PROFILE, ef: undefined } } },
    ]),
  },
  {
    operation: 'initialData',
    description: 'The data of a new student, before any choice of Bildungsgang.',
    input: '{}',
    expected: '{ data: StudentData }',
    cases: [{ name: 'new student', input: {} }],
  },
  {
    operation: 'dataVersionIsNewer',
    description: 'Whether data can only be shown read-only, and never written back, because this version may not know all of it. A missing value means 1. A value that is not a whole number from 1 up counts as newer. Checked before reconciling, which keeps only the subjects a version knows.',
    input: '{ dataVersion?: any JSON value }',
    expected: '{ result: boolean }',
    cases: [
      { name: 'missing means 1', input: {} },
      { name: 'null means 1', input: { dataVersion: null } },
      { name: '1', input: { dataVersion: 1 } },
      { name: 'the version this release supports', input: { dataVersion: DATA_VERSION } },
      { name: 'one above the version this release supports', input: { dataVersion: DATA_VERSION + 1 } },
      { name: 'far above', input: { dataVersion: 999 } },
      { name: 'not a whole number', input: { dataVersion: 1.5 } },
      { name: 'a string', input: { dataVersion: '1' } },
      { name: 'zero', input: { dataVersion: 0 } },
      { name: 'negative', input: { dataVersion: -1 } },
    ],
  },
  {
    operation: 'reconcileSubjectList',
    description: `Builds a subject list from the current table, carrying over saved grades. Used on load and when the Berufsfeld changes. Follows renamed subjects, and keeps a split subject's grades as unassigned.`,
    input: '{ existing: (Subject | CombinedSubject)[], defaults: (Subject | CombinedSubject)[] }',
    expected: '{ subjects: (Subject | CombinedSubject)[] }',
    cases: [
      { name: 'nothing saved gives the empty table', input: { existing: [], defaults: [flat('a'), fach('f', flat('b'))] } },
      { name: 'grades and oral adjustment are carried', input: { existing: [oral(flat('a', 5), 0.25)], defaults: [flat('a')] } },
      { name: 'order follows the table', input: { existing: [flat('b', 5), flat('a', 4)], defaults: [flat('a'), flat('b')] } },
      { name: 'a subject not in the table is dropped', input: { existing: [flat('gone', 5), flat('a', 4)], defaults: [flat('a')] } },
      { name: 'name and kind come from the table', input: { existing: [{ ...flat('a', 5), name: 'old', kind: 'ef' }], defaults: [{ ...flat('a'), name: 'current', kind: 'spf' }] } },
      { name: 'unknown fields on a subject are dropped', input: { existing: [{ ...flat('a', 5), futureField: 1 }], defaults: [flat('a')] } },
      {
        name: 'all fields of a grade are kept, known or not',
        input: {
          existing: [{ ...flat('a'), grades: [{ id: 'g', value: 5, weight: 2, label: 'Test', semester: 'Herbstsemester', date: '2025-03-14', futureField: 'x' }] }],
          defaults: [flat('a')],
        },
      },
      { name: 'Teilfächer are carried', input: { existing: [fach('f', flat('a', 5), oral(flat('b', 4), -0.25))], defaults: [fach('f', flat('b'), flat('a'), flat('new'))] } },
      { name: 'a Teilfach under another Fach is not carried', input: { existing: [fach('other', flat('a', 5))], defaults: [fach('f', flat('a'))] } },
      { name: 'a flat subject with the id of a Fach is not converted', input: { existing: [flat('f', 5)], defaults: [fach('f', flat('a'))] } },
      { name: 'a Fach with the id of a flat subject is not converted', input: { existing: [fach('a', flat('b', 5))], defaults: [flat('a')] } },
      { name: 'unassigned grades stay', input: { existing: [{ ...fach('f', flat('a', 5)), unassignedGrades: grades(4) }], defaults: [fach('f', flat('a'))] } },
      { name: 'old and current id both saved: the first one saved wins, old first', input: { existing: [flat('maths', 5), flat('mathematik', 4)], defaults: [flat('mathematik')] } },
      { name: 'old and current id both saved: the first one saved wins, current first', input: { existing: [flat('mathematik', 4), flat('maths', 5)], defaults: [flat('mathematik')] } },
      ...renamedCases(),
      ...splitCases(),
      ...directionSwitchCases(),
    ],
  },
  {
    operation: 'reconcileAllYears',
    description: 'Brings stored data up to the current tables, for every year. Runs on every load and import. Fields it does not use at the top level stay. Data without studentInfo counts as FMS.',
    input: '{ data: StudentData }. Stored data can be old, so years may be missing.',
    expected: '{ data: StudentData }',
    cases: [
      { name: 'FMS with no grades and no Berufsfeld', input: { data: student('FMS', {}) } },
      { name: 'no studentInfo counts as FMS', input: { data: student(undefined, { 1: [flat('deutsch', 5)] }) } },
      ...year3Directions.map((d) => ({ name: `FMS, ${d.id}, grades everywhere`, input: { data: fmsStudent(d.id, PASSING) } })),
      { name: 'FMS with no Berufsfeld keeps year 3 as stored', input: { data: student('FMS', { 3: [flat('placeholder', 5)] }) } },
      { name: 'FMS clears an unknown Berufsfeld and keeps year 3 as stored', input: { data: student('FMS', { 3: [flat('placeholder', 5)] }, { year3Direction: 'direction-a' }) } },
      { name: 'FMS moves a selected year 4 to year 3', input: { data: student('FMS', {}, { currentYear: 4 }) } },
      { name: 'FMS keeps year 4 as stored', input: { data: student('FMS', { 4: [flat('stray', 5)] }) } },
      {
        name: 'FMS stored before year 4 existed',
        input: { data: { studentInfo: { name: 'Test', division: 'FMS' }, currentYear: 2, years: { 1: { subjects: [] }, 2: { subjects: [] }, 3: { subjects: [] } } } },
      },
      { name: 'a missing dataVersion becomes the current one', input: { data: student('FMS', {}) } },
      { name: 'data in a newer format says so, should it ever be reconciled', input: { data: { ...student('FMS', {}), dataVersion: 999 } } },
      { name: 'unknown top-level fields, name and selected year stay', input: { data: { ...student('FMS', {}, { currentYear: 2 }), futureField: { kept: true } } } },
      {
        name: 'FMS with renamed subjects in years 1 and 3',
        input: {
          data: student(
            'FMS',
            {
              1: [flat('maths', 5), fach('geisteswissenschaften', flat('geschichte-&-politik', 4.5))],
              3: [flat('french', 4), flat('english', 4.5), flat('math', 5), flat('biology', 5.5)],
            },
            { year3Direction: 'gesundheit' }
          ),
        },
      },
      { name: 'FMS with the split subject in year 2', input: { data: student('FMS', { 2: [flat('berufseinblicke', 5, 3.5)] }) } },
      { name: 'Gymnasium with no profile', input: { data: student('Gymnasium', {}) } },
      { name: 'Gymnasium stored before year 4 existed', input: { data: { studentInfo: { name: 'Test', division: 'Gymnasium' }, currentYear: 1, years: { 1: { subjects: [] }, 2: { subjects: [] }, 3: { subjects: [] } } } } },
      { name: 'Gymnasium keeps a selected year 4 and ignores a Berufsfeld', input: { data: student('Gymnasium', {}, { currentYear: 4, year3Direction: 'gesundheit', gymProfile: BASE_PROFILE }) } },
      { name: 'Gymnasium, grades everywhere', input: { data: gymStudent(BASE_PROFILE, PASSING) } },
      { name: 'Gymnasium drops grades of subjects no longer chosen', input: { data: { ...gymStudent(BASE_PROFILE, PASSING), gymProfile: { ...BASE_PROFILE, arts: 'Bildnerisches Gestalten', spf: 'spanisch' } } } },
      { name: 'Gymnasium from FMS data', input: { data: { ...fmsStudent('gesundheit', PASSING), studentInfo: { name: 'Test', division: 'Gymnasium' }, gymProfile: BASE_PROFILE } } },
    ],
  },
  {
    operation: 'subjectsForYear',
    description: 'The subjects a year shows. FMS year 3 shows none until a Berufsfeld is chosen.',
    input: '{ data: StudentData, year: 1 | 2 | 3 | 4 }',
    expected: '{ subjects: (Subject | CombinedSubject)[] }',
    cases: [
      { name: 'FMS year 1', input: { data: student('FMS', { 1: [flat('a', 5)] }), year: 1 } },
      { name: 'FMS year 3 with no Berufsfeld, even with subjects stored', input: { data: student('FMS', { 3: [flat('a', 5)] }), year: 3 } },
      { name: 'FMS year 3 with a Berufsfeld', input: { data: student('FMS', { 3: [flat('a', 5)] }, { year3Direction: 'gesundheit' }), year: 3 } },
      { name: 'no studentInfo year 3 with no Berufsfeld', input: { data: student(undefined, { 3: [flat('a', 5)] }), year: 3 } },
      { name: 'Gymnasium year 3 needs no Berufsfeld', input: { data: student('Gymnasium', { 3: [flat('a', 5)] }), year: 3 } },
      { name: 'a year missing from stored data', input: { data: { currentYear: 1, years: {} }, year: 4 } },
    ],
  },
  {
    operation: 'subjectsLosingGrades',
    description: 'The subjects whose grades a change of Gymnasium choices would drop, for the warning before saving. newProfile replaces gymProfile and the data is reconciled, then this compares both. A subject lost in several years is listed once per year here; the website shows each name once.',
    input: '{ data: StudentData, newProfile: GymProfile }',
    expected: '{ names: string[] }',
    cases: [
      { name: 'same profile', input: { data: gymStudent(BASE_PROFILE, PASSING), newProfile: BASE_PROFILE } },
      { name: 'changed arts, in all four years', input: { data: gymStudent(BASE_PROFILE, PASSING), newProfile: { ...BASE_PROFILE, arts: 'Bildnerisches Gestalten' } } },
      { name: 'changed third language', input: { data: gymStudent(BASE_PROFILE, PASSING), newProfile: { ...BASE_PROFILE, thirdLanguage: 'Latein' } } },
      { name: 'changed Schwerpunktfach', input: { data: gymStudent(BASE_PROFILE, PASSING), newProfile: { ...BASE_PROFILE, spf: 'spanisch' } } },
      { name: 'changed Ergänzungsfach, in years 3 and 4 only', input: { data: gymStudent(BASE_PROFILE, PASSING), newProfile: { ...BASE_PROFILE, ef: 'sport' } } },
      { name: 'language Schwerpunktfach takes over the third language', input: { data: gymStudent(BASE_PROFILE, PASSING), newProfile: { ...BASE_PROFILE, spf: 'latein' } } },
      { name: 'Schwerpunktfach Wirtschaft und Recht removes the introduction', input: { data: gymStudent(BASE_PROFILE, PASSING), newProfile: { ...BASE_PROFILE, spf: 'wirtschaft-und-recht' } } },
      { name: 'subjects without grades are not listed', input: { data: reconcileAllYears(student('Gymnasium', {}, { gymProfile: BASE_PROFILE })), newProfile: { ...BASE_PROFILE, arts: 'Bildnerisches Gestalten' } } },
    ],
  },
  {
    operation: 'subjectsLostByDirection',
    description: 'The subjects and Teilfächer whose grades a change of FMS Berufsfeld would drop, for the warning before saving. A Teilfach belongs to its Fach: the same name under another Fach starts empty.',
    input: '{ data: StudentData, newDirection: string }, with newDirection the id of a Berufsfeld',
    expected: '{ names: string[] }',
    cases: [
      { name: 'same Berufsfeld', input: { data: fmsStudent('gesundheit', PASSING), newDirection: 'gesundheit' } },
      ...year3Directions.slice(1).map((d) => ({
        name: `from gesundheit to ${d.id}`,
        input: { data: fmsStudent('gesundheit', PASSING), newDirection: d.id },
      })),
      { name: 'first choice, nothing stored', input: { data: student('FMS', {}), newDirection: 'gesundheit' } },
      { name: 'first choice, a subject with grades stored for year 3', input: { data: student('FMS', { 3: [flat('a', 5)] }), newDirection: 'gesundheit' } },
      { name: 'subjects without grades are not listed', input: { data: reconcileAllYears(student('FMS', {}, { year3Direction: 'gesundheit' })), newDirection: 'soziale-arbeit' } },
    ],
  },
  {
    operation: 'studentResult',
    description: 'The whole rules seam: stored data in; the reconciled data, every grade and the verdict of every year out. Years are 1 to 3 for FMS and 1 to 4 for the Gymnasium. An FMS year 3 with no Berufsfeld has no subjects. endsWithoutPromotion marks the year whose result leads to no promotion, which the website notes under the conditions.',
    input: '{ data: StudentData }, with studentInfo.division saying the Bildungsgang',
    expected: '{ data: StudentData, years: { year, subjects: { id, name, grade: number | null, teilfaecher?: { id, name, grade }[] }[], verdict: PromotionVerdict, endsWithoutPromotion: boolean, promotion: PromotionStatus }[] }',
    cases: [
      { name: 'FMS with no grades', input: { data: student('FMS', {}) } },
      { name: 'Gymnasium with no grades', input: { data: student('Gymnasium', {}) } },
      ...year3Directions.flatMap((d) => [
        { name: `FMS, ${d.id}, passing`, input: { data: fmsStudent(d.id, PASSING) } },
        { name: `FMS, ${d.id}, failing`, input: { data: fmsStudent(d.id, FAILING) } },
      ]),
      { name: 'FMS with renamed subjects and the split subject', input: { data: student('FMS', { 1: [flat('maths', 5), fach('geisteswissenschaften', flat('geschichte-&-politik', 3.5))], 2: [flat('berufseinblicke', 6), flat('sport', 4)] }) } },
      { name: 'Gymnasium, base profile, passing', input: { data: gymStudent(BASE_PROFILE, PASSING) } },
      { name: 'Gymnasium, base profile, failing', input: { data: gymStudent(BASE_PROFILE, FAILING) } },
      ...STUDENT_VARIANTS.map(({ name, profile }) => ({ name: `Gymnasium, ${name}`, input: { data: gymStudent(profile, PASSING) } })),
    ],
  },
  {
    operation: 'subjectName',
    description: 'A subject or Berufsfeld name in each language, for every name in every table. A name with no translation stays as it is.',
    input: '{ name: string }, the German name as stored',
    expected: '{ names: { de, fr, en, it } }',
    cases: [
      ...allSubjectNames().map((name) => ({ name, input: { name } })),
      { name: 'Unbekanntes Fach', input: { name: 'Unbekanntes Fach' } },
    ],
  },
  {
    operation: 'uiTranslations',
    description: 'Completeness of the interface text in one language, over the keys that implementation has in any language, leaving out keys it never shows. The app checks its own keys, since each side has text the other lacks. The key lists must be empty.',
    input: '{ language: "de" | "fr" | "en" | "it" }',
    expected: '{ missingKeys: string[], keysWithEszett: string[] }. Missing means absent or blank. German is Swiss style, without ß.',
    cases: LANGUAGES.map((language) => ({ name: language, input: { language } })),
  },
];
