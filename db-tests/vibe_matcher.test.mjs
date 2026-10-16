// Runs every Unfilterd migration on an in-memory Postgres (PGlite) with small
// stand-ins for Supabase's auth schema, then checks the vibe matcher's rules
// as different signed-in users. Run via: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = new PGlite({ extensions: { pgcrypto } });
let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${detail}`); }
}

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
    console.log(`migrated ${file}`);
  } catch (err) {
    console.log(`MIGRATION FAILED ${file}: ${err.message}`);
    process.exit(1);
  }
}

await db.exec(`
  GRANT USAGE ON SCHEMA public TO authenticated, anon;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
`);

const U = {
  A: '00000000-0000-0000-0000-00000000000a',
  B: '00000000-0000-0000-0000-00000000000b',
  C: '00000000-0000-0000-0000-00000000000c',
  D: '00000000-0000-0000-0000-00000000000d',
  E: '00000000-0000-0000-0000-00000000000e',
};

for (const [name, id] of Object.entries(U)) {
  await db.query(`INSERT INTO auth.users (id, email) VALUES ($1, $2)`, [id, `${name.toLowerCase()}@test.local`]);
  // the signup trigger may already have created the profile
  await db.query(`INSERT INTO public.profiles (id, username, avatar_seed) VALUES ($1, $2, $2) ON CONFLICT (id) DO NOTHING`, [id, `user_${name.toLowerCase()}`]);
}
await db.query(`UPDATE public.profiles SET open_to_matching = false WHERE id = $1`, [U.D]);

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

async function post(user, title, tags, extra = {}) {
  const r = await as(user,
    `INSERT INTO public.posts (user_id, title, content, mood, vibe_tags, vibe_intensity, is_crisis)
     VALUES ($1, $2, $2, $3, $4, $5, $6) RETURNING id`,
    [user, title, extra.mood ?? 'lonely', tags, extra.intensity ?? 50, extra.crisis ?? false]);
  return r.rows[0].id;
}

console.log('\nscenario');
const pA = await post(U.A, 'Nobody talks to me in college', ['loneliness', 'exam-stress']);
const pB = await post(U.B, 'Lonely every evening', ['loneliness']);
const pC = await post(U.C, 'Finally hit the gym', ['small-win', 'hope'], { mood: 'motivation' });
await post(U.D, 'So alone, exams soon', ['loneliness', 'exam-stress']);
const pE = await post(U.E, 'I want to end it all', ['loneliness', 'exam-stress'], { crisis: true });

const m1 = await as(U.A, `SELECT * FROM public.find_vibe_match($1)`, [pA]);
const match = m1.rows[0];
check('A is matched with someone', Boolean(match));
check('match goes to B (shared tag, open to matching, not in crisis)', match?.matched_user_id === U.B, `got ${match?.matched_user_id}`);
check('shared tags recorded', JSON.stringify(match?.shared_tags) === JSON.stringify(['loneliness']), JSON.stringify(match?.shared_tags));
check('D (matching off) never chosen', match?.matched_user_id !== U.D);
check('E (crisis post) never chosen', match?.matched_user_id !== U.E);

const again = await as(U.A, `SELECT * FROM public.find_vibe_match($1)`, [pA]);
check('asking again returns the same pending match', again.rows[0]?.id === match?.id);

const bNotes = await as(U.B, `SELECT type, link FROM public.notifications WHERE user_id = $1 AND type = 'match'`, [U.B]);
check('B gets an anonymous match notification', bNotes.rows.length === 1 && bNotes.rows[0].link === '/matches');

const cSees = await as(U.C, `SELECT count(*)::int AS n FROM public.vibe_matches`);
check('C cannot see the match', cSees.rows[0].n === 0);

check('A cannot accept on B\'s behalf', Boolean(await fails(U.A, `SELECT * FROM public.respond_vibe_match($1, true)`, [match.id])));
check('A cannot match using B\'s post', Boolean(await fails(U.A, `SELECT * FROM public.find_vibe_match($1)`, [pB])));
check('direct insert into vibe_matches is blocked', Boolean(await fails(U.A,
  `INSERT INTO public.vibe_matches (post_id, requester_id, matched_user_id) VALUES ($1, $2, $3)`, [pA, U.A, U.C])));

const sneaky = await post(U.C, 'honestly i want to die', ['loneliness', 'not-a-real-tag'], { crisis: false });
const sneakyRow = (await db.query(`SELECT is_crisis, wants_match, vibe_tags FROM public.posts WHERE id = $1`, [sneaky])).rows[0];
check('database flags crisis language even if the app says it isn\'t', sneakyRow.is_crisis === true);
check('unknown tags are dropped', JSON.stringify(sneakyRow.vibe_tags) === JSON.stringify(['loneliness']), JSON.stringify(sneakyRow.vibe_tags));
check('client cannot clear the crisis flag', Boolean(await fails(U.C, `UPDATE public.posts SET is_crisis = false WHERE id = $1 RETURNING is_crisis`, [sneaky]))
  || (await db.query(`SELECT is_crisis FROM public.posts WHERE id = $1`, [sneaky])).rows[0].is_crisis === true);
await db.query(`DELETE FROM public.posts WHERE id = $1`, [sneaky]);

const crisisErr = await fails(U.E, `SELECT * FROM public.find_vibe_match($1)`, [pE]);
check('crisis post cannot be matched', Boolean(crisisErr) && /support/i.test(crisisErr), crisisErr);

const acc = await as(U.B, `SELECT * FROM public.respond_vibe_match($1, true)`, [match.id]);
const convId = acc.rows[0]?.conversation_id;
check('B accepts and a conversation opens', Boolean(convId));
check('answering twice is rejected', Boolean(await fails(U.B, `SELECT * FROM public.respond_vibe_match($1, true)`, [match.id])));

const aNote = await as(U.A, `SELECT link FROM public.notifications WHERE user_id = $1 AND type = 'match'`, [U.A]);
check('A is told the chat is open', aNote.rows[0]?.link === `/chat/${convId}`);

await as(U.A, `INSERT INTO public.messages (conversation_id, sender_id, content) VALUES ($1, $2, 'hey, me too')`, [convId, U.A]);
const bMsgs = await as(U.B, `SELECT id, content FROM public.messages WHERE conversation_id = $1`, [convId]);
check('B reads A\'s message', bMsgs.rows[0]?.content === 'hey, me too');
const msgNote = await as(U.B, `SELECT count(*)::int AS n FROM public.notifications WHERE user_id = $1 AND type = 'message'`, [U.B]);
check('B gets one message notification', msgNote.rows[0].n === 1);
await as(U.A, `INSERT INTO public.messages (conversation_id, sender_id, content) VALUES ($1, $2, 'you there?')`, [convId, U.A]);
const msgNote2 = await as(U.B, `SELECT count(*)::int AS n FROM public.notifications WHERE user_id = $1 AND type = 'message'`, [U.B]);
check('no notification spam while one is unread', msgNote2.rows[0].n === 1);

const cRead = await as(U.C, `SELECT count(*)::int AS n FROM public.messages`);
check('C cannot read the chat', cRead.rows[0].n === 0);
check('C cannot post into the chat', Boolean(await fails(U.C,
  `INSERT INTO public.messages (conversation_id, sender_id, content) VALUES ($1, $2, 'hi')`, [convId, U.C])));
check('A cannot send as B', Boolean(await fails(U.A,
  `INSERT INTO public.messages (conversation_id, sender_id, content) VALUES ($1, $2, 'fake')`, [convId, U.B])));
check('empty message rejected', Boolean(await fails(U.A,
  `INSERT INTO public.messages (conversation_id, sender_id, content) VALUES ($1, $2, '   ')`, [convId, U.A])));

const msgId = bMsgs.rows[0].id;
check('B cannot rewrite A\'s message', Boolean(await fails(U.B, `UPDATE public.messages SET content = 'edited' WHERE id = $1`, [msgId])));
await as(U.B, `UPDATE public.messages SET read_at = now() WHERE id = $1`, [msgId]);
const readBack = await as(U.A, `SELECT read_at FROM public.messages WHERE id = $1`, [msgId]);
check('B can mark it seen', readBack.rows[0]?.read_at !== null);

const pA2 = await post(U.A, 'Still lonely', ['loneliness']);
const m2 = await as(U.A, `SELECT * FROM public.find_vibe_match($1)`, [pA2]);
check('A is not re-paired with B while their chat is open', m2.rows[0]?.matched_user_id !== U.B);

await as(U.B, `SELECT public.leave_conversation($1, true)`, [convId]);
check('after B leaves and blocks, A can no longer send', Boolean(await fails(U.A,
  `INSERT INTO public.messages (conversation_id, sender_id, content) VALUES ($1, $2, 'hello?')`, [convId, U.A])));
const blocked = await db.query(`SELECT count(*)::int AS n FROM public.blocks WHERE blocker_id = $1 AND blocked_id = $2`, [U.B, U.A]);
check('block recorded', blocked.rows[0].n === 1);

// daily limit: A already made one match today (m2 may be null); top up with fresh posts
let limitErr = null;
for (let i = 0; i < 8 && !limitErr; i++) {
  await db.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'x${i}@t')`);
  const other = (await db.query(`SELECT id FROM public.profiles ORDER BY created_at DESC LIMIT 1`)).rows[0].id;
  await as(other, `INSERT INTO public.posts (user_id, title, content, mood, vibe_tags) VALUES ($1, 'me too', 'me too', 'lonely', '{loneliness}')`, [other]).catch(() => {});
  const pn = await post(U.A, `post ${i}`, ['loneliness']);
  limitErr = await fails(U.A, `SELECT * FROM public.find_vibe_match($1)`, [pn]);
}
check('daily limit of 5 requests enforced', Boolean(limitErr) && /limit/i.test(limitErr), limitErr ?? 'never hit');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
