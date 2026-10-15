# Unfilterd Vibe v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Unfilterd's own multilingual emotion/mood/risk model (no API key needed) plus the app, serving and database changes that use it safely, within 7 days.

**Architecture:** One small multilingual transformer fine-tuned with six heads (mood, feelings, intensity, toxicity, risk, language), exported to int8 ONNX behind a tiny FastAPI endpoint on free hosting. A single safety-pattern JSON compiles into the server, the client fallback and the DB trigger, so the database stays the final authority on risk. The React app adds removable feeling chips, a private check-in card, a sensitive cover and an admin review queue.

**Tech Stack:** PyTorch + HF transformers (training, RTX 5050), ONNX Runtime (serving), FastAPI, Hugging Face Space or Vercel (free), Supabase (Postgres RLS/triggers), React + Vite + TS, vitest + PGlite (DB tests).

**Spec:** `docs/superpowers/specs/2026-10-15-unfilterd-vibe-v1-design.md`

## Global Constraints

- Launch: 2026-10-22 hard. GPU training runs happen at night (owner's laptop available then); everything else must not block on the GPU.
- Moods (9, exact): `happy sad angry lonely relationship career motivation confession random`. Tags: the 20 in `src/lib/vibe.ts` plus `placement-stress parental-pressure comparison homesickness` (24). Risk: `none|possible|high`. Toxicity: `none|low|medium|high`. Lang: `en|hinglish|telugu|tenglish|devanagari`.
- Intensity 0–100 (100 "can't cope", 50 "really bad day", 10 passing mood). Max 3 tags per post.
- Ship gates (spec §Evaluation): crisis recall ≥ 98 %, false check-ins ≤ 8 %, explicit-intent subset 100 % high, code-mix mood ≥ 70 % and > keyword baseline, feelings micro-F1 ≥ 0.55, injection flips = 0, warm p95 < 3 s, outage drill passes.
- Safety floor only ever raises risk. Check-in answers never change post state. No post text stored/logged server-side. No auto-punishment from a bare pattern match.
- Push to main only when `model/evaluate.py --gates` and `npm run test:db` and `npm run typecheck` pass. No AI-attribution lines in commits (owner's standing rule).
- Frozen test sets are never used in training; `build_dataset.py` must fail if any test-set text appears in training data.

## Review Focus

1. Empty, whitespace-only or emoji-only post → `/analyze` returns `mood:'random'`, `risk:'none'`, no 500. (test in Task 6)
2. 5 000-char post → tokenizer truncates for the model, but the pattern layer scans the **full raw text**; a crisis phrase at the end still floors risk. (test in Task 6)
3. Mixed-script post (Telugu sentence + Roman "mar jaunga") → pattern floor fires across scripts. (test in Task 1)
4. Endpoint down / malformed JSON / timeout → client falls back to local analysis with the five-language floor; posting never blocked. (tests in Task 8)
5. Author removes every chip → post saves with `vibe_tags={}`, feedback row written, `find_vibe_match` falls back to mood equality. (test in Task 7)

---

### Task 1: Shared taxonomy + safety pattern source of truth

**Files:**
- Create: `shared/safety_patterns.json`, `model/vibe_schema.py`, `model/test_schema.py`
- Modify: `src/lib/vibe.ts` (tags 20→24 + labels + keyword fallback entries for the 4 new tags)

**Interfaces:**
- Produces: `safety_patterns.json` = `{"crisis":[{"pattern":str,"lang":str}...], "crisis_explicit":[...same shape, first-person unambiguous only...], "toxicity":[{"pattern":str,"flag":str}...], "profanity_whitelist":[str...]}`. ≥ 15 crisis patterns **per language style** (75+ total), ≥ 8 explicit-intent, ≥ 20 toxicity. Patterns are lowercase; matching is case-insensitive substring.
- Produces: `vibe_schema.py` constants `MOODS, TAGS, RISK_LEVELS, TOX_LEVELS, LANG_STYLES` (exact lists above) and `floor_risk(text:str, model_risk:str) -> str` implementing: any crisis match → ≥ possible; explicit match → high; never lowers.
- Produces in `vibe.ts`: `VIBE_TAGS` (24), `applyRiskFloor(text: string, risk: Risk): Risk` reading the same JSON (vite JSON import).

- [ ] Write `model/test_schema.py`: JSON loads; no duplicate patterns; every `lang` ∈ LANG_STYLES; `floor_risk("kal exam hai yaar","none")=='none'`; `floor_risk("mar jaunga 😂","none")=='possible'`; `floor_risk(mixed Telugu-script sentence + " mar jaunga","none")=='possible'`; `floor_risk("I am going to kill myself tonight","none")=='high'`; `floor_risk(x,'high')=='high'` for all x.
- [ ] Run `python -m pytest model/test_schema.py -v` → FAIL (files missing).
- [ ] Author `shared/safety_patterns.json` (meet quotas; Telugu script + Tenglish + Devanagari included) and implement `model/vibe_schema.py`.
- [ ] Run again → PASS. Add the 4 tags/labels/keywords + `applyRiskFloor` to `vibe.ts`; `npm run typecheck` → clean.
- [ ] Commit `feat: shared vibe taxonomy and safety pattern source`.

### Task 2: Frozen test sets

**Files:**
- Create: `model/testsets/{crisis,codemix,sarcasm,injection,telugu}.jsonl`, `model/test_testsets.py`, `model/testsets/REVIEW.md`

**Interfaces:**
- Produces: JSONL row `{"text":str,"mood":str,"tags":[str],"intensity":int,"risk":str,"toxicity":str,"lang":str}` — the schema every later component consumes.
- Sizes (spec): crisis ~200 (≈ 1/3 genuine, 1/3 ambiguous, 1/3 dramatic-but-safe), codemix ~150, sarcasm ~100, injection ~50, telugu ~100.

- [ ] Write `model/test_testsets.py`: every row validates against `vibe_schema`; sizes met; crisis set contains ≥ 60 rows with `risk=='none'` (the false-alarm half of gate 1 needs them); injection rows all contain instruction-like text and none has `risk=='none'` lowered from what the text warrants.
- [ ] Run → FAIL. Author the five sets by hand (all language styles; no template reuse from Task 3's generator).
- [ ] Run → PASS. Write `REVIEW.md`: instructions for the owner's 15-minute Telugu/Tenglish label review + the check-in card copy (from Task 9) — hand this to the owner on day 3.
- [ ] Commit `feat: frozen evaluation sets for vibe model`.

### Task 3: Training corpus

**Files:**
- Create: `model/map_goemotions.py`, `model/gen_corpus.py`, `model/build_dataset.py`, `model/test_dataset.py`, `model/requirements.txt`

**Interfaces:**
- Produces: `model/data/train.jsonl`, `model/data/val.jsonl` (same row schema as Task 2), ≥ 8 000 synthetic + GoEmotions-mapped rows, val = 10 %.
- `map_goemotions.py` maps the 27 GoEmotions labels → our moods/tags (neutral→random; sadness→sad; anger→angry; etc. — builder writes the full map); rows get `lang:'en'`, heuristic intensity, `risk:'none'` unless pattern-floored, toxicity from GoEmotions' own flags where present.
- `gen_corpus.py` authors code-mix posts per style × mood × tag quota table (printed by the script); hard-case quotas: ≥ 400 exam-humor/ambiguous, ≥ 300 sarcasm/masked, ≥ 300 venting-not-toxic, ≥ 200 targeted-toxic, ≥ 100 injection-style, ≥ 500 neutral/random.

- [ ] Write `model/test_dataset.py`: output rows validate; quota table met; label balance (no mood > 30 %); **zero overlap** with any Task 2 test set (exact + lowercase-stripped match) — build fails otherwise; every row's `risk` is consistent with `floor_risk` (floor applied to labels too).
- [ ] Run → FAIL. Implement the three scripts; `pip install -r model/requirements.txt` (torch cu128 build for the RTX 5050, transformers, datasets, onnx, onnxruntime, pytest).
- [ ] Run `python model/build_dataset.py` then the tests → PASS.
- [ ] Commit `feat: vibe training corpus builder`.

### Task 4: Training script (checkpointed) + smoke run

**Files:**
- Create: `model/train.py`, `model/test_train_smoke.py`

**Interfaces:**
- Produces: `train.py --data model/data --out model/checkpoints [--resume] [--smoke]`; backbone `microsoft/Multilingual-MiniLM-L12-H384`; heads per spec (9/24/1/4/3/5); losses CE/BCE/SmoothL1/CE/CE(weighted recall-heavy for risk)/CE; checkpoint every 200 steps + `last.pt`; resume restores step/optimizer; saves `model/checkpoints/best/` (HF format + heads state) by val risk-recall then mood-acc.
- Consumes: Task 3 data; Task 1 schema.

- [ ] Write `model/test_train_smoke.py`: `--smoke` (200 rows, 30 steps, CPU-ok) finishes; loss at step 30 < loss at step 1; checkpoint file exists; `--resume` continues from saved step.
- [ ] Run → FAIL. Implement `train.py`.
- [ ] Run smoke test → PASS (CPU is fine for smoke).
- [ ] Verify GPU visible for tonight: `python -c "import torch;print(torch.cuda.is_available())"` → `True` (install the cu128 wheel if False).
- [ ] Commit `feat: vibe model training with checkpoint resume`.

### Task 5: Full training + evaluation gates  *(GPU, tonight)*

**Files:**
- Create: `model/evaluate.py`, `model/thresholds.json`
- Test: the frozen sets are the test.

**Interfaces:**
- Produces: `evaluate.py --ckpt model/checkpoints/best --gates` → prints a table per gate, writes tuned `thresholds.json` (`tag_threshold`, `risk_unsure_band`), exit 0 iff **all** spec gates pass. Later tasks load `thresholds.json`.

- [ ] Implement `evaluate.py` (runs all five frozen sets + keyword-baseline comparison).
- [ ] Night run: `python model/train.py --data model/data --out model/checkpoints` (1–2 h on the 5050; resume if interrupted).
- [ ] Run `python model/evaluate.py --ckpt model/checkpoints/best --gates`.
- [ ] If a gate fails: fix data/thresholds (not the frozen sets), retrain, re-evaluate. Repeat until exit 0.
- [ ] Commit `feat: Unfilterd Vibe v1 trained; all evaluation gates green` (scripts + thresholds.json; weights are not committed — they ship in the GitHub Release, Task 12).

### Task 6: ONNX export + inference server

**Files:**
- Create: `model/export_onnx.py`, `model/server/{app.py,infer.py,requirements.txt,Dockerfile}`, `model/server/test_server.py`

**Interfaces:**
- Produces: `model/artifacts/vibe-v1-int8.onnx` + tokenizer files; parity: ONNX vs PyTorch mood/risk agree on ≥ 99 % of val sample.
- Produces: `POST /analyze {"text":str}` → `{"mood","vibe_tags"(≤3),"intensity","risk","is_crisis"(risk≠none),"crisis_resources"(as in vibe.ts),"toxicity":{"isToxic","severity","flags"},"lang_style","source":"ai"}`; `GET /health` → `{"ok":true,"model":"vibe-v1"}`. CORS: `https://unfilterd.vercel.app` + localhost. Logs: status + latency only, never text. `infer.py` applies `floor_risk` **after** the model, on full raw text.

- [ ] Write `model/server/test_server.py` (FastAPI TestClient): contract shape; Review-Focus 1 (empty/emoji-only → random/none, 200); Review-Focus 2 (5 000-char with trailing crisis phrase → risk ≥ possible); injection sample does not lower risk/toxicity; a log-capture assert that request text never appears in logs.
- [ ] Run → FAIL. Implement export + server; run export.
- [ ] Run tests → PASS; measure local p95 latency over 50 calls < 1 s.
- [ ] Commit `feat: vibe inference server with safety floor`.

### Task 7: Database migration

**Files:**
- Create: `supabase/migrations/20261016000000_add_vibe_model.sql`, `scripts/gen-pattern-sql.mjs`, `db-tests/vibe_model.test.ts`
- Modify: `package.json` (devDeps `vitest`, `@electric-sql/pglite`; script `"test:db": "vitest run db-tests"`)

**Interfaces:**
- Produces (migration): `posts.risk_level text NOT NULL DEFAULT 'none' CHECK (risk_level IN ('none','possible','high'))`; `posts.is_sensitive bool`; `posts.toxicity_severity text DEFAULT 'none'`; `posts.is_hidden bool DEFAULT false`; backfill `risk_level` from `is_crisis`; table `safety_patterns(kind,pattern,lang)` populated by `gen-pattern-sql.mjs` from `shared/safety_patterns.json`; `posts_enforce_vibe` trigger rewritten: pattern floor (ILIKE against `safety_patterns`), `is_crisis := risk_level<>'none'`, `is_sensitive := risk_level='high'` (client values overridden), `wants_match := false` when risk ≠ none, tag whitelist extended to 24; `vibe_checkins(id,user_id,post_id,risk,status CHECK IN ('pending','joking','overwhelmed','not_okay','dismissed'),dismiss_count int DEFAULT 0,created_at,answered_at)` RLS owner-only; `vibe_feedback(id,predicted_tags text[],corrected_tags text[],lang_style,length_bucket,created_at)` insert-only authenticated, select admin-only, **no user_id column**; `find_vibe_match` updated to exclude `risk_level<>'none'`; `select_posts` policy rewritten: hidden posts visible only to author and admins.

- [ ] Write `db-tests/vibe_model.test.ts` (PGlite loads all migrations in order): insert post with crisis text + `risk_level='none'` → trigger floors to `possible`, `wants_match=false`; `risk_level='high'` → `is_sensitive=true`; checkin readable only by owner; feedback has no user link and non-admin select fails; hidden post invisible to another user; mixed-script floor (Review Focus 3 at DB level); all-chips-removed post matches by mood (Review Focus 5).
- [ ] Run `npm run test:db` → FAIL. Write generator + migration.
- [ ] Run → PASS (all previous PGlite assertions for the vibe matcher must still hold).
- [ ] Owner applies the migration via SQL Editor paste (same flow as before); verify live over REST: new columns + `safety_patterns` rows present.
- [ ] Commit `feat: risk, toxicity, check-in and feedback schema`.

### Task 8: Client integration (`vibe.ts`)

**Files:**
- Modify: `src/lib/vibe.ts`, `src/types/index.ts`, `.env.example` (`VITE_VIBE_API_URL=`)
- Create: `src/lib/vibe.test.ts` (vitest, jsdom not required)

**Interfaces:**
- Produces: `VibeAnalysis` gains `risk: 'none'|'possible'|'high'` and `lang_style: LangStyle`; `analyzeVibe(text)` → fetch `${VITE_VIBE_API_URL}/analyze`, 3 s AbortController timeout → on any failure `analyzeVibeLocally` (which now applies `applyRiskFloor` and `detectLangByScript(text)`: Telugu/Devanagari Unicode ranges, else `'en'`). `is_crisis` stays derived = `risk !== 'none'` so every existing caller keeps working.

- [ ] Write `src/lib/vibe.test.ts`: mocked fetch success maps contract → VibeAnalysis; fetch rejects / 500 / hangs past 3 s → local result with `source:'local'` (Review Focus 4); local Tenglish crisis text → `risk='possible'`; Telugu-script text → `lang_style='telugu'`.
- [ ] Add `"test": "vitest run"` to package.json; run → FAIL. Implement.
- [ ] Run `npm run test` + `npm run typecheck` → PASS.
- [ ] Commit `feat: model-backed vibe analysis with safe local fallback`.

### Task 9: UI — chips, check-in, cover, 18+, admin queue

**Files:**
- Create: `src/components/vibe/CheckInCard.tsx`, `src/components/vibe/SensitiveCover.tsx`, `src/components/vibe/checkInCopy.ts`
- Modify: `src/pages/CreatePost.tsx`, `src/components/PostCard.tsx`, `src/pages/Register.tsx`, `src/pages/Admin.tsx`, `src/App.tsx` or `Layout.tsx` (pending-check-in lookup on app open)

**Interfaces:**
- Consumes: Task 8 `VibeAnalysis`; Task 7 tables.
- Produces: `checkInCopy.ts` exports `getCheckInCopy(lang: 'en'|'hinglish'|'telugu')` → `{prompt, options:{joking,overwhelmed,not_okay}, responses:{...}}` — fixed strings, warm-friend voice, helplines exactly as `CRISIS_RESOURCES`; tenglish/devanagari map to hinglish/en sensibly.
- Behavior (spec): chips removable before posting (removal → `vibe_feedback` insert); post with `risk='possible'` → CheckInCard (private, after publish); pending check-in reappears on next app open; 2 dismissals close it; `risk='high'` → help card immediately, no question; PostCard blurs `is_sensitive` posts behind "Sensitive — tap to view"; Register gains required "I'm 18 or older" checkbox; Admin page gains "Held / flagged posts" list (is_hidden or toxicity_severity ≥ medium) with publish/delete actions.

- [ ] Implement all of the above (match the app's existing design system: ink #07060F, primary #9D7CFF, Fraunces display; respect reduced-motion).
- [ ] `npm run typecheck` + `npm run build` → clean.
- [ ] Verify in the built-in browser against the dev server: post a Hinglish ambiguous-crisis test line on a test account → chips show and are removable, check-in appears in Hinglish, feed shows the sensitive cover on a high-risk post, register blocks without the 18+ tick.
- [ ] Commit `feat: feeling chips, private check-in, sensitive cover, 18+ gate, admin queue`.

### Task 10: Deploy + outage drill + release

**Files:**
- Create: `model/server/README.md` (deploy steps), `docs/launch-checklist.md`
- Modify: `README.md` (GoEmotions credit, model section, privacy note), Vercel env (`VITE_VIBE_API_URL`)

- [ ] Deploy the server: try Vercel Python function; if bundle > limit or cold start > 10 s, deploy the Docker Space on Hugging Face (owner creates the free account/Space; identical contract). Record the choice in `model/server/README.md`.
- [ ] Live smoke: `/health` 200; 50-call warm p95 < 3 s (gate 7); one EN + one Tenglish crisis text → risk ≥ possible.
- [ ] Outage drill (gate 8): point a local build at a dead URL → posting works, `source:'local'`, five-language floor still fires (Review Focus 4 end-to-end).
- [ ] Owner's 15-minute review (from Task 2's REVIEW.md: Telugu labels + card copy) is complete and folded in.
- [ ] `model/evaluate.py --gates` + `npm run test` + `npm run test:db` + `npm run typecheck` all green → push to main; create GitHub Release `vibe-v1` with the ONNX artifact; tick through `docs/launch-checklist.md`.
- [ ] Commit `release: Unfilterd Vibe v1`.
