import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { StudentData } from '../src/types';
import { buildRuleCases, serializeRuleCases, type RuleCasesFile } from './build';
import { operations } from './operations';

const casesPath = new URL('./rule-cases.json', import.meta.url);
const committedText = readFileSync(casesPath, 'utf8');
const committed = JSON.parse(committedText) as RuleCasesFile;

// JSON has no undefined, -0 or NaN, so results are compared as they would be written
const asJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('the committed rule cases', () => {
  it('match what the website generates, byte for byte (run `npm run rule-cases` if not)', () => {
    expect(committedText).toBe(serializeRuleCases(buildRuleCases()));
  });

  it('come out identical when generated twice', () => {
    expect(serializeRuleCases(buildRuleCases())).toBe(serializeRuleCases(buildRuleCases()));
  });
});

describe('reconciliation', () => {
  it('changes nothing on data it has already reconciled', () => {
    const results = committed.suites
      .filter((s) => s.operation === 'reconcileAllYears')
      .flatMap((s) => s.cases.map((c) => (c.expected as { data: StudentData }).data));
    expect(results.length).toBeGreaterThan(0);
    for (const data of results) {
      expect(asJson(operations.reconcileAllYears({ data }).data)).toEqual(data);
    }
  });
});

describe('the website passes every rule case', () => {
  for (const suite of committed.suites) {
    describe(suite.operation, () => {
      it.each(suite.cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
        const run = operations[suite.operation as keyof typeof operations] as (input: never) => unknown;
        expect(asJson(run(c.input as never))).toEqual(c.expected);
      });
    });
  }
});
