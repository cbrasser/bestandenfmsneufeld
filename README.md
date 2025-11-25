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
- **Heap Analytics** - User analytics (optional)

## Analytics Setup (Heap)

The app includes basic Heap Analytics for tracking site usage. Heap automatically tracks:
- Number of users and sessions
- Geographic location (country/region level)
- Device type and browser
- Screen size

To enable it:

1. Get your Heap App ID from [Heap.io](https://heap.io)
2. Create a `.env` file in the root directory:
   ```
   VITE_HEAP_APP_ID=your-heap-app-id-here
   ```
3. The app will automatically initialize Heap when it loads

If no Heap App ID is provided, the app will run normally without analytics.

### Deployment

**Important:** Environment variables are embedded at build time. You need to set them before running `npm run build`.

#### On Your Server/Build Environment:

1. **Create `.env` file on the server:**
   ```bash
   echo "VITE_HEAP_APP_ID=your-heap-app-id-here" > .env
   ```

2. **Or set as environment variable before build:**
   ```bash
   export VITE_HEAP_APP_ID=your-heap-app-id-here
   npm run build
   ```

3. **Common hosting platforms:**
   - **Vercel/Netlify**: Set in their dashboard under Environment Variables
   - **GitHub Actions**: Add as repository secret
   - **Docker**: Set via `ENV` in Dockerfile or docker-compose.yml

See `DEPLOYMENT.md` for detailed platform-specific instructions.

## Data Storage

All student data is stored locally in the browser's `localStorage`. No data is sent to any server, ensuring complete privacy. Analytics events (if enabled) are sent separately and do not include any grade data.

## License

Private project for school use.
