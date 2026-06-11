# Grade Tracker

A mobile-first Progressive Web App (PWA) for students to track their grades and monitor their promotion status at school.

## TODO

- [ ] Semsters -> Add a hint to a grade that displays the semester
- [ ] Oral grades -> Add the option to add oral grades (e.g. 0.1 bonus)

## Features

- 📱 **Mobile-first design** - Optimized for mobile devices
- 🔄 **PWA Support** - Installable as a web app
- 📊 **Grade Tracking** - Track grades across multiple subjects with weighted averages
- 📅 **Year Management** - Support for 3 years with different subjects
- 🎯 **Direction Selection** - Year 3 students can choose from 3 different study directions
- ✅ **Promotion Status** - Real-time calculation of promotion criteria
- 💾 **Local Storage** - All data stored locally in browser (privacy-first)

## Promotion Criteria (Year 1)

- No more than 4 final grades below 4
- Average grade above or equal to 4
- Total deficit (sum of grades below 4) not larger than 2

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
devices. No email and no name are used for the login — the data is fully pseudonymous.

How it works:

- The client generates a random 16-character code (~79 bits of entropy).
- Only the **SHA-256 hash** of the code is stored in the database, never the code itself.
- The code acts as both the identifier and the secret (capability/bearer-token pattern):
  whoever has the code can read the data, so students are told to keep it safe.
- The `students` table is locked down with Row Level Security and **no policies** — all
  access goes through three `SECURITY DEFINER` RPC functions (`create_account`,
  `load_data`, `save_data`) that validate the hashed code. The table itself is never
  directly readable with the public anon key.
- If the code is lost, the cloud data cannot be recovered (use Export as a backup).

### Setup

1. Create a Supabase project — choose region **EU (Frankfurt)** for data residency.
2. Open the SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL` — Project Settings → API → Project URL
   - `VITE_SUPABASE_ANON_KEY` — Project Settings → API → anon public key
4. Restart `npm run dev`. The "Cloud-Sync" section appears in the menu automatically.
   Without these env vars the app stays fully local — the UI hides itself.

> GDPR: even though no direct PII is stored, Supabase is a data processor — sign a DPA
> and keep the EU region. Consider adding simple rate limiting if abuse is a concern.

## License

Private project for school use.
