// Runs every db-tests/*.test.mjs in its own process (each builds a fresh in-memory database).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
let failed = 0;
for (const file of readdirSync(here).filter(f => f.endsWith('.test.mjs')).sort()) {
  console.log(`\n=== ${file}`);
  const result = spawnSync(process.execPath, [join(here, file)], { stdio: 'inherit' });
  if (result.status !== 0) failed++;
}
process.exit(failed ? 1 : 0);
