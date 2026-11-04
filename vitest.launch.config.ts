import { defineConfig } from 'vitest/config'

// Rehearses the launch against local Supabase. Start it with `npm run rehearse:launch`, which holds
// the lock and resets the database first: this file on its own doesn't.
export default defineConfig({
  test: {
    include: ['supabase/launch/rehearsal.ts'],
    testTimeout: 120_000,
    // Each step builds on the one before, so the first failure is the one worth reading
    bail: 1,
  },
})
