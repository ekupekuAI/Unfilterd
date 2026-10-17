// Final-review fix pass (2026-10-17): every finding here was reproduced first.
import { setup, reporter } from './harness.mjs';

const { db, users: U, as } = await setup(['A', 'B', 'ADMIN']);
const { check, finish } = reporter();
await db.query(`UPDATE public.profiles SET is_admin = true WHERE id = $1`, [U.ADMIN]);

async function post(user, content, fields = {}) {
  const cols = ['user_id', 'title', 'content', 'mood', ...Object.keys(fields)];
  const vals = [user, 'post', content, 'sad', ...Object.values(fields)];
  const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
  return (await as(user, `INSERT INTO public.posts (${cols.join(', ')}) VALUES (${ph}) RETURNING *`, vals)).rows[0];
}
const row = async (id) => (await db.query(`SELECT * FROM public.posts WHERE id = $1`, [id])).rows[0];

// --- C2: no self-promotion to admin, no self-unsuspend ---
await as(U.B, `UPDATE public.profiles SET is_admin = true WHERE id = $1`, [U.B]);
check('C2 user cannot make themselves admin', (await db.query(`SELECT is_admin FROM public.profiles WHERE id = $1`, [U.B])).rows[0].is_admin === false);
await db.query(`UPDATE public.profiles SET is_suspended = true, suspension_reason = 'test' WHERE id = $1`, [U.A]);
await as(U.A, `UPDATE public.profiles SET is_suspended = false, suspension_reason = '' WHERE id = $1`, [U.A]);
check('C2 suspended user cannot unsuspend themselves', (await db.query(`SELECT is_suspended FROM public.profiles WHERE id = $1`, [U.A])).rows[0].is_suspended === true);
await as(U.ADMIN, `UPDATE public.profiles SET is_suspended = false, suspension_reason = '' WHERE id = $1`, [U.A]);
check('C2 admin can still unsuspend a user', (await db.query(`SELECT is_suspended FROM public.profiles WHERE id = $1`, [U.A])).rows[0].is_suspended === false);
await as(U.B, `UPDATE public.profiles SET bio = 'hello' WHERE id = $1`, [U.B]);
check('C2 users can still edit their own profile', (await db.query(`SELECT bio FROM public.profiles WHERE id = $1`, [U.B])).rows[0].bio === 'hello');

// --- C1: widened crisis list (regression set from the review) ---
const possibleCases = [
  "I don't want to live anymore", 'i dont want to be alive', 'honestly kms', 'unalive myself', 'i want to kill my self',
  'selfharm again', 'mujhe marna hai', 'khudkushi kar lunga', 'मुझे मरना है', 'jeena nahi hai ab', 'నాకు చచ్చిపోవాలి అనిపిస్తుంది',
];
for (const text of possibleCases) {
  const p = await post(U.A, text, { risk_level: 'none' });
  check(`C1 floored: ${text}`, p.risk_level !== 'none', p.risk_level);
}
// Ambiguous without a time, method or plan: gentle check-in, not an emergency (owner's rule).
for (const text of ['I will kill myself', "I'm going to end my life", "if I fail again I'm literally going to kill myself lol"]) {
  const p = await post(U.A, text, { risk_level: 'none' });
  check(`C1 ambiguous -> possible (check-in): ${text}`, p.risk_level === 'possible', p.risk_level);
}
const highCases = ['I will kill myself tonight', 'i want to hang myself tonight', 'I took all my pills', 'goodbye everyone, this is the end'];
for (const text of highCases) {
  const p = await post(U.A, text, { risk_level: 'none' });
  check(`C1 explicit -> high: ${text}`, p.risk_level === 'high', p.risk_level);
}
const safe = await post(U.A, 'this assignment is killing me lol', { risk_level: 'none' });
check('C1 dramatic-but-safe stays none', safe.risk_level === 'none', safe.risk_level);

// --- I8: whitespace / punctuation / full-width normalisation ---
for (const text of ['i want to\ndie', 'i want  to   die', 'I WANT TO DIE!!!', 'ＫＩＬＬ ＭＹＳＥＬＦ']) {
  const p = await post(U.A, text, { risk_level: 'none' });
  check(`I8 normalised: ${JSON.stringify(text)}`, p.risk_level !== 'none', p.risk_level);
}

// --- I2: a threat pattern reaches review (medium+, flagged) ---
const threat = await post(U.B, 'i know where you live', { toxicity_severity: 'none' });
check('I2 threat pattern is flagged for review', threat.is_flagged === true && threat.toxicity_severity !== 'low', `${threat.toxicity_severity} flagged=${threat.is_flagged}`);

// --- I1: editing an approved post sends it back to review ---
const held = await post(U.B, 'some targeted abuse', { toxicity_severity: 'high' });
await as(U.ADMIN, `SELECT public.review_post($1, true)`, [held.id]);
check('I1 setup: approved post is visible', (await row(held.id)).is_hidden === false);
await as(U.B, `UPDATE public.posts SET content = 'i will kill you, i know where you live', toxicity_severity = 'high' WHERE id = $1`, [held.id]);
const edited = await row(held.id);
check('I1 edited approved post is re-held', edited.is_hidden === true && edited.reviewed_at === null, JSON.stringify({ h: edited.is_hidden, r: edited.reviewed_at }));

// --- I3: check-ins on content edits and on escalation ---
const calm = await post(U.A, 'just a normal day at college', { risk_level: 'none' });
await as(U.A, `UPDATE public.posts SET content = 'honestly i want to die' WHERE id = $1`, [calm.id]);
const ci1 = await as(U.A, `SELECT risk, status FROM public.vibe_checkins WHERE post_id = $1`, [calm.id]);
check('I3 content edit that raises risk creates a check-in', ci1.rows.length === 1, JSON.stringify(ci1.rows));
await as(U.A, `UPDATE public.vibe_checkins SET status = 'joking' WHERE post_id = $1`, [calm.id]);
await as(U.A, `UPDATE public.posts SET content = 'i am going to kill myself tonight' WHERE id = $1`, [calm.id]);
const ci2 = (await as(U.A, `SELECT risk, status, dismiss_count FROM public.vibe_checkins WHERE post_id = $1`, [calm.id])).rows[0];
check('I3 escalation to high reopens the check-in at high', ci2?.risk === 'high' && ci2?.status === 'pending' && ci2?.dismiss_count === 0, JSON.stringify(ci2));

// --- I5: hidden posts don't leak through media or comments ---
await db.query(`INSERT INTO public.post_media (post_id, user_id, media_type, media_url, sort_order) VALUES ($1, $2, 'image', 'https://x/doxx.png', 0)`, [edited.id, U.B]);
check('I5 media of a hidden post is invisible to others', (await as(U.A, `SELECT * FROM public.post_media WHERE post_id = $1`, [edited.id])).rows.length === 0);
check('I5 author still sees own media', (await as(U.B, `SELECT * FROM public.post_media WHERE post_id = $1`, [edited.id])).rows.length === 1);
let commentErr = null;
try { await as(U.A, `INSERT INTO public.comments (post_id, user_id, content) VALUES ($1, $2, 'hi')`, [edited.id, U.A]); } catch (e) { commentErr = e.message; }
check('I5 cannot comment on a hidden post', Boolean(commentErr));

// --- I8: database normalisation matches the app and the model ---
const { readFileSync } = await import('node:fs');
const { join } = await import('node:path');
const { repo } = await import('./harness.mjs');
for (const [raw, expected] of JSON.parse(readFileSync(join(repo, 'shared', 'normalize_cases.json'), 'utf8'))) {
  const got = (await db.query(`SELECT public.vibe_normalize($1) AS n`, [raw])).rows[0].n;
  check(`I8 parity: ${JSON.stringify(raw)}`, got === expected, JSON.stringify(got));
}

// --- M3: feedback rows are bounded ---
let fbErr = null;
try { await as(U.A, `INSERT INTO public.vibe_feedback (predicted_tags, corrected_tags, lang_style, length_bucket) VALUES (ARRAY[repeat('x', 9000)], '{}', 'en', 'short')`); } catch (e) { fbErr = e.message; }
check('M3 feedback rejects unknown/oversized tags', Boolean(fbErr));

finish();
