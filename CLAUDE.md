## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on the private `cbrasser/bestanden-android` repo, including those for this website. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Rule changes

Changing rounding, grade calculation, promotion criteria, subject tables, reconciliation or subject names needs `npm run rule-cases` and an app release. If it changes the subject lists or the data format, it also needs a `dataVersion` bump. See `rule-cases/README.md`.
