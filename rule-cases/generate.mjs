// Writes rule-cases.json from the website's real code: npm run rule-cases
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const { module } = await runnerImport(fileURLToPath(new URL('./build.ts', import.meta.url)), {
  configFile: false,
  logLevel: 'error',
});

writeFileSync(new URL('./rule-cases.json', import.meta.url), module.serializeRuleCases(module.buildRuleCases()));
