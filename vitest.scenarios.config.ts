import { defineConfig } from 'vitest/config'

// Runs the sync scenarios against local Supabase. Start it with `npm run test:sync`, which holds the
// lock and resets the database: this file on its own doesn't.
export default defineConfig({
  test: {
    include: ['src/sync/sync.scenarios.ts'],
    testTimeout: 30_000,
  },
})
