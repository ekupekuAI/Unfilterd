// Task 7: risk / toxicity / check-in / feedback schema. The database is the final
// authority on risk: a modified client cannot publish a crisis post as ordinary.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setup, reporter, repo } from './harness.mjs';

const { db, users: U, as, fails } = await setup(['A', 'B', 'ADMIN']);
const { check, finish } = reporter();
await db.query(`UPDATE public.profiles SET is_admin = true WHERE id = $1`, [U.ADMIN]);

async function post(user, content, fields = {}) {
  const cols = ['user_id', 'title', 'content', 'mood', ...Object.keys(fields)];
  const vals = [user, 'post', content, fields.mood ?? 'sad', ...Object.values(fields)];
  if (fields.mood) { cols.splice(cols.indexOf('mood', 4), 1); vals.splice(4 + Object.keys(fields).indexOf('mood'), 1); }
  const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
  const r = await as(user, `INSERT INTO public.posts (${cols.join(', ')}) VALUES (${ph}) RETURNING *`, vals);
  return r.rows[0];
}

// --- risk floor (server-side, all five styles) ---
const p1 = await post(U.A, 'exam fail ho gaya toh mar jaunga 😂', { risk_level: 'none', wants_match: true });
check('Hinglish crisis phrase floors risk to possible', p1.risk_level === 'possible', p1.risk_level);
check('flagged post is never matchable', p1.wants_match === false);
check('is_crisis stays in sync', p1.is_crisis === true);

const p2 = await post(U.A, 'ఈ రోజు చాలా బాధగా ఉంది and honestly mar jaunga', { risk_level: 'none' });
check('mixed-script post is floored', p2.risk_level === 'possible', p2.risk_level);

const p3 = await post(U.A, 'I am going to kill myself tonight', { risk_level: 'possible' });
check('explicit-intent phrase floors to high', p3.risk_level === 'high', p3.risk_level);
check('high-risk post gets the sensitive cover', p3.is_sensitive === true);

const p4 = await post(U.A, 'kal exam hai yaar, tension', { risk_level: 'none', is_sensitive: true });
check('client cannot set the sensitive cover on an ordinary post', p4.is_sensitive === false);
check('ordinary post stays none', p4.risk_level === 'none');

const p5 = await post(U.A, 'I feel so heavy lately', { risk_level: 'high' });
check('model-supplied high is kept (never lowered)', p5.risk_level === 'high' && p5.is_sensitive === true);

await as(U.A, `UPDATE public.posts SET risk_level = 'none', is_sensitive = false WHERE id = $1`, [p3.id]);
const p3b = (await db.query(`SELECT risk_level, is_sensitive FROM public.posts WHERE id = $1`, [p3.id])).rows[0];
check('editing cannot lower risk on a floored post', p3b.risk_level === 'high' && p3b.is_sensitive === true, JSON.stringify(p3b));

check('invalid risk value rejected', Boolean(await fails(U.A,
  `INSERT INTO public.posts (user_id, title, content, mood, risk_level) VALUES ($1, 't', 'c', 'sad', 'extreme')`, [U.A])));

// --- check-ins: created by the database, private to the author ---
const ci = await as(U.A, `SELECT post_id, risk, status FROM public.vibe_checkins WHERE post_id = $1`, [p1.id]);
check('check-in created automatically for a flagged post', ci.rows.length === 1 && ci.rows[0].status === 'pending');
const ciB = await as(U.B, `SELECT * FROM public.vibe_checkins WHERE post_id = $1`, [p1.id]);
check('another user cannot see the check-in', ciB.rows.length === 0);
const noCi = await as(U.A, `SELECT * FROM public.vibe_checkins WHERE post_id = $1`, [p4.id]);
check('no check-in for an ordinary post', noCi.rows.length === 0);
await as(U.A, `UPDATE public.vibe_checkins SET status = 'joking', answered_at = now() WHERE post_id = $1`, [p1.id]);
const after = (await db.query(`SELECT risk_level, wants_match FROM public.posts WHERE id = $1`, [p1.id])).rows[0];
check('answering "just joking" does not change the post', after.risk_level === 'possible' && after.wants_match === false);
await as(U.A, `UPDATE public.vibe_checkins SET lang_style = 'hinglish' WHERE post_id = $1`, [p1.id]);
check('author can set the check-in language', (await as(U.A,
  `SELECT lang_style FROM public.vibe_checkins WHERE post_id = $1`, [p1.id])).rows[0]?.lang_style === 'hinglish');
check('B cannot answer A\'s check-in', (await as(U.B,
  `UPDATE public.vibe_checkins SET status = 'dismissed' WHERE post_id = $1 RETURNING id`, [p1.id])).rows.length === 0);

// --- toxicity: patterns route to review; high is held ---
const t1 = await post(U.B, 'i know where you live, watch out', { toxicity_severity: 'none' });
check('toxicity pattern raises severity to at least low', t1.toxicity_severity !== 'none', t1.toxicity_severity);
check('low/medium toxicity is not hidden', t1.is_hidden === false);
const t2 = await post(U.B, 'some targeted abuse', { toxicity_severity: 'high' });
check('high toxicity is held from the feed', t2.is_hidden === true);
const seenByA = await as(U.A, `SELECT id FROM public.posts WHERE id = $1`, [t2.id]);
check('held post invisible to other users', seenByA.rows.length === 0);
const seenByAuthor = await as(U.B, `SELECT id FROM public.posts WHERE id = $1`, [t2.id]);
check('held post still visible to its author', seenByAuthor.rows.length === 1);
const seenByAdmin = await as(U.ADMIN, `SELECT id FROM public.posts WHERE id = $1`, [t2.id]);
check('held post visible to admin for review', seenByAdmin.rows.length === 1);
check('author cannot un-hide their own held post', (await as(U.B,
  `UPDATE public.posts SET is_hidden = false WHERE id = $1 RETURNING is_hidden`, [t2.id])).rows[0]?.is_hidden !== false);
await as(U.ADMIN, `SELECT public.review_post($1, true)`, [t2.id]);
const approved = await as(U.A, `SELECT id FROM public.posts WHERE id = $1`, [t2.id]);
check('admin approval publishes a held post', approved.rows.length === 1);
check('non-admin cannot call review_post', Boolean(await fails(U.A, `SELECT public.review_post($1, true)`, [t2.id])));

// --- feedback: anonymous, admin-readable only ---
await as(U.A, `INSERT INTO public.vibe_feedback (predicted_tags, corrected_tags, lang_style, length_bucket)
               VALUES ('{loneliness,exam-stress}', '{loneliness}', 'hinglish', 'short')`);
const cols = (await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'vibe_feedback'`)).rows.map(r => r.column_name);
check('feedback table has no user link', !cols.some(c => /user|author|profile/.test(c)), cols.join(','));
check('feedback table has no post text', !cols.some(c => /text|content|post/.test(c)), cols.join(','));
check('a normal user cannot read feedback', (await as(U.B, `SELECT * FROM public.vibe_feedback`)).rows.length === 0);
check('admin can read feedback', (await as(U.ADMIN, `SELECT * FROM public.vibe_feedback`)).rows.length === 1);

// --- tags + matching ---
const t4 = await post(U.A, 'placement season stress', { vibe_tags: ['placement-stress', 'comparison', 'made-up-tag'] });
check('new tags accepted, unknown tags dropped', t4.vibe_tags.includes('placement-stress') && !t4.vibe_tags.includes('made-up-tag'));
const lonelyB = await post(U.B, 'hostel feels empty', { mood: 'lonely', vibe_tags: [] });
await as(U.B, `UPDATE public.posts SET wants_match = true WHERE id = $1`, [lonelyB.id]);
const noChips = await post(U.A, 'nobody to talk to tonight', { mood: 'lonely', vibe_tags: [], wants_match: true });
const m = await as(U.A, `SELECT * FROM public.find_vibe_match($1)`, [noChips.id]);
check('post with every chip removed still matches by mood', m.rows[0]?.matched_user_id === U.B, JSON.stringify(m.rows[0] ?? null));

// --- generated pattern list matches the shared JSON (no drift) ---
const shared = JSON.parse(readFileSync(join(repo, 'shared', 'safety_patterns.json'), 'utf8'));
const dbCount = (await db.query(`SELECT count(*)::int AS n FROM public.safety_patterns`)).rows[0].n;
const jsonCount = shared.crisis.length + shared.crisis_explicit.length + shared.toxicity.length;
check('safety_patterns table matches shared/safety_patterns.json', dbCount === jsonCount, `${dbCount} vs ${jsonCount}`);

finish();
