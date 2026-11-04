## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on the private `cbrasser/bestanden-android` repo, including those for this website. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Rule changes

Changing rounding, grade calculation, promotion criteria, subject tables, reconciliation or subject names needs `npm run rule-cases` and an app release. See `rule-cases/README.md`.

Changing the subject lists or the data format also needs a `dataVersion` bump: raise `DATA_VERSION` in `src/utils/dataVersion.ts`, run `npm run rule-cases`, and release the app. Without the bump, an older client reconciles the new data, drops what it doesn't know, and pushes the loss to the cloud.
