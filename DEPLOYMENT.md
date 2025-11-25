# Deployment Guide

## Environment Variables

The app uses environment variables that are embedded at **build time** (not runtime). You need to set them before running `npm run build`.

### Setting Environment Variables

#### Option 1: Create `.env` file (Local Build)

Create a `.env` file in the project root:

```env
VITE_HEAP_APP_ID=your-heap-app-id-here
```

Then build:
```bash
npm run build
```

#### Option 2: Platform-Specific Environment Variables

### Vercel

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add: `VITE_HEAP_APP_ID` = `your-heap-app-id`
4. Redeploy your app

Vercel will automatically use these variables during the build.

### Netlify

1. Go to **Site settings** → **Environment variables**
2. Add: `VITE_HEAP_APP_ID` = `your-heap-app-id`
3. Trigger a new deploy

### GitHub Pages / GitHub Actions

In your workflow file (`.github/workflows/deploy.yml`), add:

```yaml
env:
  VITE_HEAP_APP_ID: ${{ secrets.VITE_HEAP_APP_ID }}
```

Then add `VITE_HEAP_APP_ID` as a secret in GitHub repository settings.

### Docker

In your `Dockerfile` or `docker-compose.yml`:

```dockerfile
# Dockerfile
ENV VITE_HEAP_APP_ID=your-heap-app-id-here
```

Or in `docker-compose.yml`:
```yaml
environment:
  - VITE_HEAP_APP_ID=your-heap-app-id-here
```

### Traditional Server (SSH)

1. SSH into your server
2. Create `.env` file in the project directory:
   ```bash
   echo "VITE_HEAP_APP_APP_ID=your-heap-app-id-here" > .env
   ```
3. Build on the server:
   ```bash
   npm run build
   ```

### Important Notes

- ⚠️ **Environment variables are embedded at build time** - they become part of the JavaScript bundle
- 🔒 The `.env` file is gitignored, so you need to set it on each server/environment separately
- 📦 After building, the environment variables are in the built files - you don't need `.env` at runtime
- 🔄 If you change environment variables, you must rebuild the app

