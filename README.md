# Bestanden

A mobile-first Progressive Web App (PWA) for FMS and Gymnasium students at Gymnasium Neufeld to track their grades and see whether they will be promoted. A native Android app with the same features and data format is built in the private `cbrasser/bestanden-android` repo.

## Addresses

- `https://bestandenfms.cbradev.ch` is the primary address, used by the app and all guides.
- `https://bestandenfmsneufeld.vercel.app` stays live with no redirect, because its browser storage is separate and may hold a student's only copy of their grades.

## App guide

`/#app` is a shareable guide in all four languages, also linked from the menu. `/#app/android` and `/#app/iphone` open one section; `/#app` picks the section that fits the device.

- **Android:** the app comes from the public [`cbrasser/bestanden-releases`](https://github.com/cbrasser/bestanden-releases), through Obtainium or by hand. It is not in the Play Store.
- **iPhone:** there is no native app. The guide explains creating a code in Safari, adding the site to the home screen and logging in there, because home-screen apps don't share Safari's storage. Export and import is the fallback.

The guide's text is in `src/i18n/guide.ts`. The PNG icons are generated from `public/icon.svg` with `scripts/generate-icons.sh`.

## Features

- 📱 **Mobile-first design** - Optimized for mobile devices
- 🔄 **PWA Support** - Installable as a web app
- 📊 **Grade Tracking** - Track grades across multiple subjects with weighted averages
- 📅 **Year Management** - FMS years 1 to 3 and Gymnasium years 1 to 4, each with its own subjects
- 🎯 **Subject Choices** - FMS Berufsfeld in year 3; Gymnasium Schwerpunktfach, third language, Bildnerisches Gestalten or Musik, and Ergänzungsfach
- ✅ **Promotion Status** - Real-time calculation of promotion criteria
- 💾 **Local Storage** - All data stored locally in browser (privacy-first), with optional sync by code
- 🤖 **Android App** - Installed from the public release repo (see [App guide](#app-guide))

## Promotion Criteria

FMS ("Promotionsbestimmungen FMS ab 24"):

- No more than 3 grades below 4 (Teilfächer count individually)
- Average of the Fach grades above or equal to 4
- Total deficit (sum of how far Fach grades are below 4) not larger than 2

Gymnasium ("Auszug aus den Promotionsbestimmungen", Gymnasium Neufeld 2023):

- No more than 4 grades below 4
- Twice the sum of how far grades are below 4 not larger than the sum of how far grades are above 4
- The subjects per year follow Gymnasium Neufeld's Lektionentafel (Lehrplan 17, from 2022/23); see `src/config/gymnasium.ts`

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Tests

```bash
npm test
```

`rule-cases/` holds the rule test cases shared with the Android app. Regenerate them with `npm run rule-cases` after changing a rule; see `rule-cases/README.md`.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Configuration

### Subjects

Edit `src/config/subjects.ts` to customize:

- Subjects for Years 1 and 2
- Year 3 directions and their associated subjects

### Promotion Criteria

Edit `src/config/criteria.ts` to customize promotion criteria for each year.

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Vite PWA Plugin** - PWA support
- **Lucide React** - Icons
- **Vercel Analytics** - User analytics

## Analytics (Vercel)

The app uses Vercel Analytics for basic tracking. It automatically tracks:

- Number of visitors and page views
- Geographic location (country/region level)
- Device type and browser

No configuration needed - it works automatically when deployed to Vercel. If deployed elsewhere, it will still track but you'll need a Vercel account to view the analytics dashboard.

## Data Storage

All student data is stored locally in the browser's `localStorage` by default. No data is sent to any server unless the user opts in to Cloud Sync (see below). Analytics events (if enabled) are sent separately and do not include any grade data.

## Cloud Sync (optional, privacy-first)

Students can optionally create an **anonymous access code** to sync their data across
devices. No email and no name are stored: the name stays on each device, and the server
removes it from anything a client uploads. The data is pseudonymous.

How it works:

- The client generates a random 16-character code (~79 bits of entropy).
- Only the **SHA-256 hash** of the code is stored in the database, never the code itself.
- The code acts as both the identifier and the secret (capability/bearer-token pattern):
  whoever has the code can read the data, so students are told to keep it safe.
- The `students` table is locked down with Row Level Security and **no policies** — all
  access goes through `SECURITY DEFINER` RPC functions that validate the hashed code.
  The table itself is never directly readable with the public anon key.
- Every row has a `version`, raised by a database trigger on every write. The website
  saves with `save_student`, which refuses a save based on an out-of-date version, and
  pulls with `load_student` on open and on focus. `load_data` stays for old cached copies
  of the site. `save_data` raises an error, so an old copy shows "sync failed" and writes nothing.
- The student chooses when both sides really did change.
- Students can delete their cloud data themselves. Their local data stays.
- If the code is lost, the cloud data cannot be recovered (use Export as a backup).

### Setup

1. Create a Supabase project in an EU region for data residency. The production project runs in **EU West (Ireland, `eu-west-1`)**.
2. Open the SQL Editor and run the files in [`supabase/migrations`](./supabase/migrations), in order.
3. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` — Project Settings → API → Project URL
   - `VITE_SUPABASE_ANON_KEY` — Project Settings → API → anon public key
4. Restart `npm run dev`. The "Cloud-Sync" section appears in the menu automatically.
   Without these env vars the app stays fully local — the UI hides itself.

> GDPR: even though no name or email is stored, Supabase is a data processor — sign a DPA
> and keep the EU region. Consider adding simple rate limiting if abuse is a concern.

## Local Supabase

The schema lives in [`supabase/migrations`](./supabase/migrations). Docker and the Supabase CLI are required. Copy nothing from a production `.env`: local work only needs local values, see [`.env.local.example`](./.env.local.example).

```bash
npm run supabase:start   # start the stack, reset it to this checkout's migrations, print its values
npm run dev:local        # the same, then the website on http://localhost:5193 until you stop it
npm run test:sync        # the same, then the sync scenarios in sync-scenarios/
npm run supabase:stop    # stop the stack
```

All worktrees on a machine share one stack (project id `bestanden`, API on port 57421) and their migrations can differ. So each of these commands holds a machine-wide lock while it runs, at `~/.cache/bestanden-supabase.lock`, and resets the database first. To run anything else against the stack, wrap it the same way, and it gets `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `SUPABASE_DB_URL`:

```bash
node scripts/with-local-supabase.mjs <command...>
```

Don't rely on the database between commands, since another worktree may have reset it. A command that waits for the lock gives up after 15 minutes. If a process was killed outright and left the lock behind, the next command says so and how to remove it.

Keep additive database changes in separate migrations from anything that disables old behaviour, so they can reach production at different times.

## Launch

The launch migration, its rollback and the steps for applying them are in [`supabase/launch`](./supabase/launch/README.md), outside `supabase/migrations`, so that nothing applies them by accident. To rehearse them on local Supabase, from a database shaped like production and with made-up rows:

```bash
npm run rehearse:launch
```

## License

Private project for school use.
