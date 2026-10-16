// Regenerates the safety-pattern INSERT block inside the vibe-model migration from
// shared/safety_patterns.json, so the database applies exactly the same list as the
// model server and the app. Usage: node scripts/gen-pattern-sql.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const migration = join(repo, 'supabase', 'migrations', '20261016000000_add_vibe_model.sql');
const shared = JSON.parse(readFileSync(join(repo, 'shared', 'safety_patterns.json'), 'utf8'));

const quote = s => `'${s.replace(/'/g, "''")}'`;
const rows = [
  ...shared.crisis.map(r => ['crisis', r.pattern, r.lang]),
  ...shared.crisis_explicit.map(r => ['crisis_explicit', r.pattern, r.lang]),
  ...shared.toxicity.map(r => ['toxicity', r.pattern, r.flag]),
];
const block = [
  '-- BEGIN GENERATED PATTERNS (node scripts/gen-pattern-sql.mjs; do not edit by hand)',
  'DELETE FROM public.safety_patterns;',
  'INSERT INTO public.safety_patterns (kind, pattern, label) VALUES',
  rows.map(([kind, pattern, label]) => `  (${quote(kind)}, public.vibe_normalize(${quote(pattern)}), ${quote(label)})`).join(',\n') + ';',
  '-- END GENERATED PATTERNS',
].join('\n');

const sql = readFileSync(migration, 'utf8');
const next = sql.replace(/-- BEGIN GENERATED PATTERNS[\s\S]*?-- END GENERATED PATTERNS/, block);
if (next === sql && !sql.includes('-- BEGIN GENERATED PATTERNS')) {
  throw new Error('generated-pattern markers not found in migration');
}
writeFileSync(migration, next);
console.log(`wrote ${rows.length} patterns into ${migration}`);
