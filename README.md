# Grade Tracker

A mobile-first Progressive Web App (PWA) for students to track their grades and monitor their promotion status at school.

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

## Data Storage

All student data is stored locally in the browser's `localStorage`. No data is sent to any server, ensuring complete privacy.

## License

Private project for school use.
