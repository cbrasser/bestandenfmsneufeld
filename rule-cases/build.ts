import { runOperation, type OperationName } from './operations';
import { suites } from './suites';

export type RuleCase = { name: string; input: unknown; expected: unknown };

export type RuleSuite = {
  operation: OperationName;
  description: string;
  input: string;
  expected: string;
  cases: RuleCase[];
};

export type RuleCasesFile = {
  format: 'bestanden-rule-cases';
  formatVersion: number;
  regenerate: string;
  conventions: string[];
  types: Record<string, string>;
  suites: RuleSuite[];
};

// What JSON keeps of a value: no undefined, no -0, and NaN becomes null
export const asJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value) ?? 'null');

export const buildRuleCases = (): RuleCasesFile => ({
  format: 'bestanden-rule-cases',
  formatVersion: 1,
  regenerate: 'npm run rule-cases, in the website repository. Do not edit by hand.',
  conventions: [
    'A runner calls the rule named by a suite\'s "operation" with each case\'s "input" and compares the result with "expected". See rule-cases/README.md in the website repository.',
    'Numbers are IEEE 754 doubles and must match exactly, with no tolerance.',
    'Rounding sends ties towards positive infinity: 4.25 to the half is 4.5, and -0.25 to the half is 0. Half-even rounding is wrong.',
    'A missing object key means the value is absent. Key order means nothing; array order does.',
    'A null grade means the Fach has no Teilfach with grades, so it has no grade at all. The website computes NaN here.',
    'A grade of 0 means a Subject with no grades or only zero weights.',
    'Promotion leaves out null and every grade at or below 0. A Fach average leaves out only Teilfächer with no grades, so a Teilfach with grades that ends at 0 still counts.',
  ],
  types: {
    Grade: '{ id, value, weight, label?, semester?: "Herbstsemester" | "Frühlingssemester", date? }. On entry, value is 1 to 6 and weight is above 0, both rounded to two decimals; date is an ISO date.',
    Subject: '{ id, name, grades: Grade[], kind?: "spf" | "ef", oralGrade? }. Told apart by its grades key.',
    CombinedSubject: 'A Fach of Teilfächer: { id, name, subjects: Subject[], unassignedGrades?: Grade[] }. Told apart by its subjects key.',
    GymProfile: '{ thirdLanguage?, arts?, spf?, ef? }: names for the first two, ids from subjectChoices for the others.',
    StudentData: '{ studentInfo?: { name, division: "FMS" | "Gymnasium" }, currentYear: the selected year, 1 to 4, year3Direction?: a Berufsfeld id, gymProfile?: GymProfile, years: { "1" to "4": { subjects: (Subject | CombinedSubject)[] } } }',
    PromotionStatus: '{ isPassing, hasGrades, criteria: { failures: { passed, count, max }, average?: { passed, value, min }, deficit?: { passed, value, max }, compensation?: { passed, surplus, deficit, factor } } }. FMS has average and deficit, the Gymnasium has compensation.',
    PromotionVerdict: '"noGrades" | "passing" | "notPassing". What the student sees. Decide from this, because isPassing can be true with no grades.',
  },
  suites: suites().map(({ cases, ...suite }) => ({
    ...suite,
    cases: cases.map(({ name, input }) => {
      const jsonInput = asJson(input);
      return { name, input: jsonInput, expected: asJson(runOperation(suite.operation, jsonInput)) };
    }),
  })),
});

const MAX_LINE = 120;

// Plain JSON with short values kept on one line, so that the file stays readable and diffs stay small
const format = (value: unknown, indent = ''): string => {
  const line = JSON.stringify(value);
  if (value === null || typeof value !== 'object' || indent.length + line.length <= MAX_LINE) return line;
  const inner = `${indent}  `;
  const items = Array.isArray(value)
    ? value.map((item) => inner + format(item, inner))
    : Object.entries(value).map(([key, item]) => `${inner}${JSON.stringify(key)}: ${format(item, inner)}`);
  const [open, close] = Array.isArray(value) ? '[]' : '{}';
  return `${open}\n${items.join(',\n')}\n${indent}${close}`;
};

export const serializeRuleCases = (file: RuleCasesFile): string => `${format(file)}\n`;
