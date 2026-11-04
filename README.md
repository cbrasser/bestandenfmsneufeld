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
  access goes through `SECURITY DEFINER` RPC functions that validate the hashed code. The
  table itself is never directly readable with the public anon key.
- Saves are version-checked: a save from an out-of-date device is refused rather than
  overwriting newer data, and the student chooses when both sides really did change.
- Students can delete their cloud data themselves. Their local data stays.
- If the code is lost, the cloud data cannot be recovered (use Export as a backup).

### Setup

1. Create a Supabase project in an EU region for data residency. The production project runs in **EU West (Ireland, `eu-west-1`)**.
2. Open the SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` — Project Settings → API → Project URL
   - `VITE_SUPABASE_ANON_KEY` — Project Settings → API → anon public key
4. Restart `npm run dev`. The "Cloud-Sync" section appears in the menu automatically.
   Without these env vars the app stays fully local — the UI hides itself.

> GDPR: even though no name or email is stored, Supabase is a data processor — sign a DPA
> and keep the EU region. Consider adding simple rate limiting if abuse is a concern.

## License

Private project for school use.
