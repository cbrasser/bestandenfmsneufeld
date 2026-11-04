# Rule cases

`rule-cases.json` is the contract between the website and the Android app. The website's real code generates it, the website's tests check it, and the app's Kotlin unit tests run a copy of it, so a difference in the rules fails a test.

## Regenerate

```bash
npm run rule-cases
```

Run this after any change to the rules, then read the diff: it shows exactly what changed for students. The output contains no dates or random values, so running it twice with no code change gives identical bytes. `npm test` fails if the file is out of date.

The app repository will hold a copy, and its release script will refuse to release on a mismatch (tickets #9 and #16). A change to the cases therefore needs an app release.

## Format

Plain JSON, with no dependency on TypeScript or the website.

```json
{
  "format": "bestanden-rule-cases",
  "formatVersion": 1,
  "regenerate": "how to regenerate the file",
  "conventions": ["rules for reading the cases"],
  "types": { "Grade": "the data shapes that the suites name" },
  "suites": [
    {
      "operation": "roundToHalf",
      "description": "what the rule does",
      "input": "shape of each case's input",
      "expected": "shape of each case's expected result",
      "cases": [
        { "name": "4.25", "input": { "value": 4.25 }, "expected": { "result": 4.5 } }
      ]
    }
  ]
}
```

`formatVersion` goes up only when this structure changes. New suites and cases don't raise it.

## Running the cases

For each suite, call the rule named by `operation` with each case's `input` and compare the result with `expected`. The `conventions` array in the file says how to compare; these are the traps for a port:

- Numbers match exactly, as doubles. Accumulate in array order, because a different order can change the last bits.
- Ties round towards positive infinity. In Kotlin, `roundToLong` does this; `kotlin.math.round` rounds ties to even and is wrong. `roundToLong` throws on NaN, so handle a Fach with no graded Teilfach before rounding.
- A missing key means the value is absent, and key order means nothing. `null` appears only as a grade or a `result`: for a grade it means the Fach has no graded Teilfach (NaN on the website).
- `uiTranslations` checks the interface text of whichever implementation runs it, over that implementation's own keys. Each side has text the other doesn't, so the file doesn't list keys. Its expected lists are empty on both sides.

A runner fails on an operation it doesn't know, so that a new suite can't be skipped by accident.

## Source files

| File | Purpose |
| --- | --- |
| `suites.ts` | The inputs of every case. Tables and rename lists are walked from the code. |
| `operations.ts` | Maps each operation name to the website's real code. |
| `build.ts`, `generate.mjs` | Run the operations on the inputs and write the JSON. |
| `rule-cases.test.ts` | The website passes every case, and the file is up to date. |
| `coverage.test.ts` | The cases reach both Bildungsgänge, all Berufsfelder and choices, renamed and split subjects, and all languages. |
| `official-rules.test.ts` | The rules against values worked out by hand from the official documents, because generated cases only record what the code does. |

`DATA_VERSION` in `src/utils/dataVersion.ts` is the data format this release supports, and the cases that use it follow it. Raising it needs an app release even if no other case changes, as the app must support the same version. A client that finds a higher value shows the data read-only and never writes it back.

When adding a rule, add its operation and suite here. If it's an official rule, also add a hand-worked test.
