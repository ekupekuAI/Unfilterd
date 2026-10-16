// Shared in-memory Supabase stand-in: PGlite + auth schema + every migration.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repo = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function setup(userNames = ['A', 'B', 'C']) {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;
  `);
  const dir = join(repo, 'supabase', 'migrations');
  for (const file of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    try {
      await db.exec(readFileSync(join(dir, file), 'utf8'));
    } catch (err) {
      throw new Error(`migration ${file} failed: ${err.message}`);
    }
  }
  await db.exec(`
    GRANT USAGE ON SCHEMA public TO authenticated, anon;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
  `);
  const users = {};
  for (const [i, name] of userNames.entries()) {
    const id = `00000000-0000-0000-0000-0000000000${(10 + i).toString(16).padStart(2, '0')}`;
    users[name] = id;
    await db.query(`INSERT INTO auth.users (id, email) VALUES ($1, $2)`, [id, `${name.toLowerCase()}@test.local`]);
    await db.query(`INSERT INTO public.profiles (id, username, avatar_seed) VALUES ($1, $2, $2) ON CONFLICT (id) DO NOTHING`,
      [id, `user_${name.toLowerCase()}`]);
  }

  async function as(user, sql, params = []) {
    await db.exec(`SET ROLE authenticated`);
    await db.query(`SELECT set_config('request.jwt.claim.sub', $1, false)`, [user]);
    try {
      return await db.query(sql, params);
    } finally {
      await db.exec(`RESET ROLE`);
      await db.query(`SELECT set_config('request.jwt.claim.sub', '', false)`);
    }
  }
  async function fails(user, sql, params = []) {
    try { await as(user, sql, params); return null; } catch (err) { return err.message; }
  }
  return { db, users, as, fails };
}

export function reporter() {
  let passed = 0;
  let failed = 0;
  return {
    check(name, ok, detail = '') {
      if (ok) { passed++; console.log(`  PASS ${name}`); } else { failed++; console.log(`  FAIL ${name} ${detail}`); }
    },
    finish() {
      console.log(`\n${passed} passed, ${failed} failed`);
      process.exit(failed ? 1 : 0);
    },
  };
}
