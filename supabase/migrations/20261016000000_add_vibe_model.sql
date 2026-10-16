/*
  Unfilterd Vibe v1: risk levels, sensitive cover, toxicity review queue,
  private check-ins and anonymous chip-correction feedback.

  The database is the final authority on risk. The app writes the model's labels,
  but this trigger re-applies the shared five-language safety-pattern floor,
  never lets risk go down, derives the sensitive cover and keeps flagged posts out
  of matching. A modified client cannot publish a crisis post as ordinary.
*/

-- 0. Normalisation shared by the pattern table and the trigger
--    (NFC, curly apostrophes folded, zero-width characters removed, lowercase)
CREATE OR REPLACE FUNCTION public.vibe_normalize(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(translate(
    regexp_replace(normalize(coalesce(t, ''), NFC), '[​‌‍﻿]', '', 'g'),
    U&'\2019\2018\02BC', ''''''''))
$$;

CREATE OR REPLACE FUNCTION public.vibe_risk_rank(r text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$ SELECT CASE r WHEN 'high' THEN 2 WHEN 'possible' THEN 1 ELSE 0 END $$;

CREATE OR REPLACE FUNCTION public.vibe_tox_rank(t text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$ SELECT CASE t WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END $$;

-- 1. Safety patterns (generated from shared/safety_patterns.json)
CREATE TABLE IF NOT EXISTS public.safety_patterns (
  id bigserial PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('crisis', 'crisis_explicit', 'toxicity')),
  pattern text NOT NULL,
  label text NOT NULL DEFAULT ''
);
ALTER TABLE public.safety_patterns ENABLE ROW LEVEL SECURITY;  -- no policies: only definer functions read it

-- BEGIN GENERATED PATTERNS (node scripts/gen-pattern-sql.mjs; do not edit by hand)
DELETE FROM public.safety_patterns;
INSERT INTO public.safety_patterns (kind, pattern, label) VALUES
  ('crisis', public.vibe_normalize('want to die'), 'en'),
  ('crisis', public.vibe_normalize('wanna die'), 'en'),
  ('crisis', public.vibe_normalize('end my life'), 'en'),
  ('crisis', public.vibe_normalize('end it all'), 'en'),
  ('crisis', public.vibe_normalize('kill myself'), 'en'),
  ('crisis', public.vibe_normalize('killing myself'), 'en'),
  ('crisis', public.vibe_normalize('suicide'), 'en'),
  ('crisis', public.vibe_normalize('suicidal'), 'en'),
  ('crisis', public.vibe_normalize('self harm'), 'en'),
  ('crisis', public.vibe_normalize('self-harm'), 'en'),
  ('crisis', public.vibe_normalize('hurt myself'), 'en'),
  ('crisis', public.vibe_normalize('cutting myself'), 'en'),
  ('crisis', public.vibe_normalize('no reason to live'), 'en'),
  ('crisis', public.vibe_normalize('can''t go on'), 'en'),
  ('crisis', public.vibe_normalize('cant go on'), 'en'),
  ('crisis', public.vibe_normalize('better off dead'), 'en'),
  ('crisis', public.vibe_normalize('better off without me'), 'en'),
  ('crisis', public.vibe_normalize('not worth living'), 'en'),
  ('crisis', public.vibe_normalize('want to disappear'), 'en'),
  ('crisis', public.vibe_normalize('don''t want to wake up'), 'en'),
  ('crisis', public.vibe_normalize('dont want to wake up'), 'en'),
  ('crisis', public.vibe_normalize('wish i was dead'), 'en'),
  ('crisis', public.vibe_normalize('wish i were dead'), 'en'),
  ('crisis', public.vibe_normalize('take my own life'), 'en'),
  ('crisis', public.vibe_normalize('overdose'), 'en'),
  ('crisis', public.vibe_normalize('mar jaunga'), 'hinglish'),
  ('crisis', public.vibe_normalize('mar jaungi'), 'hinglish'),
  ('crisis', public.vibe_normalize('mar jaana chahta'), 'hinglish'),
  ('crisis', public.vibe_normalize('mar jaana chahti'), 'hinglish'),
  ('crisis', public.vibe_normalize('marna chahta'), 'hinglish'),
  ('crisis', public.vibe_normalize('marna chahti'), 'hinglish'),
  ('crisis', public.vibe_normalize('khud ko maar'), 'hinglish'),
  ('crisis', public.vibe_normalize('suicide kar'), 'hinglish'),
  ('crisis', public.vibe_normalize('jeena nahi chahta'), 'hinglish'),
  ('crisis', public.vibe_normalize('jeena nahi chahti'), 'hinglish'),
  ('crisis', public.vibe_normalize('jeene ka mann nahi'), 'hinglish'),
  ('crisis', public.vibe_normalize('zinda nahi rehna'), 'hinglish'),
  ('crisis', public.vibe_normalize('sab khatam kar du'), 'hinglish'),
  ('crisis', public.vibe_normalize('khud ko hurt'), 'hinglish'),
  ('crisis', public.vibe_normalize('nas kaat'), 'hinglish'),
  ('crisis', public.vibe_normalize('zindagi khatam'), 'hinglish'),
  ('crisis', public.vibe_normalize('jee ke kya fayda'), 'hinglish'),
  ('crisis', public.vibe_normalize('duniya chhod'), 'hinglish'),
  ('crisis', public.vibe_normalize('చచ్చిపోవాలని'), 'telugu'),
  ('crisis', public.vibe_normalize('చచ్చిపోతా'), 'telugu'),
  ('crisis', public.vibe_normalize('చనిపోవాలని'), 'telugu'),
  ('crisis', public.vibe_normalize('చనిపోతాను'), 'telugu'),
  ('crisis', public.vibe_normalize('చావాలని'), 'telugu'),
  ('crisis', public.vibe_normalize('ఆత్మహత్య'), 'telugu'),
  ('crisis', public.vibe_normalize('బ్రతకాలని లేదు'), 'telugu'),
  ('crisis', public.vibe_normalize('బతకాలని లేదు'), 'telugu'),
  ('crisis', public.vibe_normalize('బ్రతకడం ఇష్టం లేదు'), 'telugu'),
  ('crisis', public.vibe_normalize('నన్ను నేను చంపుకుంటా'), 'telugu'),
  ('crisis', public.vibe_normalize('చంపుకోవాలని'), 'telugu'),
  ('crisis', public.vibe_normalize('జీవితం ముగించాలని'), 'telugu'),
  ('crisis', public.vibe_normalize('ఇక బతకలేను'), 'telugu'),
  ('crisis', public.vibe_normalize('ఇక బ్రతకలేను'), 'telugu'),
  ('crisis', public.vibe_normalize('నా జీవితాన్ని ముగిస్తా'), 'telugu'),
  ('crisis', public.vibe_normalize('చచ్చిపోవడమే మంచిది'), 'telugu'),
  ('crisis', public.vibe_normalize('chachipovali'), 'tenglish'),
  ('crisis', public.vibe_normalize('chachipotha'), 'tenglish'),
  ('crisis', public.vibe_normalize('chanipovali'), 'tenglish'),
  ('crisis', public.vibe_normalize('chanipotha'), 'tenglish'),
  ('crisis', public.vibe_normalize('chavalani undi'), 'tenglish'),
  ('crisis', public.vibe_normalize('chavali anipistundi'), 'tenglish'),
  ('crisis', public.vibe_normalize('bratakalani ledu'), 'tenglish'),
  ('crisis', public.vibe_normalize('bathakalani ledu'), 'tenglish'),
  ('crisis', public.vibe_normalize('brathakalani ledu'), 'tenglish'),
  ('crisis', public.vibe_normalize('bathakadam istam ledu'), 'tenglish'),
  ('crisis', public.vibe_normalize('suicide chesukunta'), 'tenglish'),
  ('crisis', public.vibe_normalize('suicide chesukovali'), 'tenglish'),
  ('crisis', public.vibe_normalize('aathmahatya'), 'tenglish'),
  ('crisis', public.vibe_normalize('atmahatya'), 'tenglish'),
  ('crisis', public.vibe_normalize('nannu nenu champukunta'), 'tenglish'),
  ('crisis', public.vibe_normalize('champukovali'), 'tenglish'),
  ('crisis', public.vibe_normalize('ika bathakalenu'), 'tenglish'),
  ('crisis', public.vibe_normalize('मर जाऊंगा'), 'devanagari'),
  ('crisis', public.vibe_normalize('मर जाऊँगा'), 'devanagari'),
  ('crisis', public.vibe_normalize('मर जाऊंगी'), 'devanagari'),
  ('crisis', public.vibe_normalize('मर जाना चाहता'), 'devanagari'),
  ('crisis', public.vibe_normalize('मर जाना चाहती'), 'devanagari'),
  ('crisis', public.vibe_normalize('मरना चाहता'), 'devanagari'),
  ('crisis', public.vibe_normalize('मरना चाहती'), 'devanagari'),
  ('crisis', public.vibe_normalize('आत्महत्या'), 'devanagari'),
  ('crisis', public.vibe_normalize('खुद को मार'), 'devanagari'),
  ('crisis', public.vibe_normalize('जीना नहीं चाहता'), 'devanagari'),
  ('crisis', public.vibe_normalize('जीना नहीं चाहती'), 'devanagari'),
  ('crisis', public.vibe_normalize('जीने का मन नहीं'), 'devanagari'),
  ('crisis', public.vibe_normalize('ज़िंदा नहीं रहना'), 'devanagari'),
  ('crisis', public.vibe_normalize('जिंदा नहीं रहना'), 'devanagari'),
  ('crisis', public.vibe_normalize('सब खत्म कर दूं'), 'devanagari'),
  ('crisis', public.vibe_normalize('खुद को चोट'), 'devanagari'),
  ('crisis', public.vibe_normalize('ज़िंदगी खत्म'), 'devanagari'),
  ('crisis', public.vibe_normalize('जिंदगी खत्म'), 'devanagari'),
  ('crisis_explicit', public.vibe_normalize('i am going to kill myself'), 'en'),
  ('crisis_explicit', public.vibe_normalize('i''m going to kill myself'), 'en'),
  ('crisis_explicit', public.vibe_normalize('im going to kill myself'), 'en'),
  ('crisis_explicit', public.vibe_normalize('i will kill myself tonight'), 'en'),
  ('crisis_explicit', public.vibe_normalize('going to end my life tonight'), 'en'),
  ('crisis_explicit', public.vibe_normalize('i have decided to end my life'), 'en'),
  ('crisis_explicit', public.vibe_normalize('this is my suicide note'), 'en'),
  ('crisis_explicit', public.vibe_normalize('i''m going to end it tonight'), 'en'),
  ('crisis_explicit', public.vibe_normalize('aaj raat khud ko maar dunga'), 'hinglish'),
  ('crisis_explicit', public.vibe_normalize('main suicide karne wala hu'), 'hinglish'),
  ('crisis_explicit', public.vibe_normalize('ivala rathri chachipothanu'), 'tenglish'),
  ('crisis_explicit', public.vibe_normalize('ఈ రోజు రాత్రి చనిపోతాను'), 'telugu'),
  ('crisis_explicit', public.vibe_normalize('आज रात आत्महत्या कर लूंगा'), 'devanagari'),
  ('toxicity', public.vibe_normalize('i will kill you'), 'threat'),
  ('toxicity', public.vibe_normalize('i''ll kill you'), 'threat'),
  ('toxicity', public.vibe_normalize('ill kill you'), 'threat'),
  ('toxicity', public.vibe_normalize('tujhe maar dunga'), 'threat'),
  ('toxicity', public.vibe_normalize('tujhe jaan se maar'), 'threat'),
  ('toxicity', public.vibe_normalize('ninnu champesta'), 'threat'),
  ('toxicity', public.vibe_normalize('నిన్ను చంపేస్తా'), 'threat'),
  ('toxicity', public.vibe_normalize('तुझे मार दूंगा'), 'threat'),
  ('toxicity', public.vibe_normalize('i know where you live'), 'threat'),
  ('toxicity', public.vibe_normalize('i will leak your'), 'doxxing'),
  ('toxicity', public.vibe_normalize('go kill yourself'), 'harassment'),
  ('toxicity', public.vibe_normalize('you deserve to die'), 'harassment'),
  ('toxicity', public.vibe_normalize('nobody would miss you'), 'harassment'),
  ('toxicity', public.vibe_normalize('tu mar ja'), 'harassment'),
  ('toxicity', public.vibe_normalize('nuvvu chachipo'), 'harassment'),
  ('toxicity', public.vibe_normalize('तू मर जा'), 'harassment'),
  ('toxicity', public.vibe_normalize('send nudes'), 'sexual_harassment'),
  ('toxicity', public.vibe_normalize('send me nudes'), 'sexual_harassment'),
  ('toxicity', public.vibe_normalize('nudes bhej'), 'sexual_harassment'),
  ('toxicity', public.vibe_normalize('rape you'), 'sexual_harassment'),
  ('toxicity', public.vibe_normalize('teri maa ki'), 'abuse'),
  ('toxicity', public.vibe_normalize('tu chutiya hai'), 'abuse'),
  ('toxicity', public.vibe_normalize('randi'), 'slur');
-- END GENERATED PATTERNS

-- 2. New columns on posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS risk_level text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS is_sensitive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS toxicity_severity text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_risk_level_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_risk_level_check CHECK (risk_level IN ('none', 'possible', 'high'));
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_toxicity_severity_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_toxicity_severity_check
  CHECK (toxicity_severity IN ('none', 'low', 'medium', 'high'));

CREATE INDEX IF NOT EXISTS idx_posts_hidden ON public.posts(is_hidden) WHERE is_hidden;

-- 3. The enforcement trigger (replaces the English-only version)
CREATE OR REPLACE FUNCTION public.posts_enforce_vibe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text := public.vibe_normalize(coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  floor_risk text := 'none';
BEGIN
  IF EXISTS (SELECT 1 FROM public.safety_patterns WHERE kind = 'crisis_explicit' AND position(pattern IN norm) > 0) THEN
    floor_risk := 'high';
  ELSIF EXISTS (SELECT 1 FROM public.safety_patterns WHERE kind = 'crisis' AND position(pattern IN norm) > 0) THEN
    floor_risk := 'possible';
  END IF;

  NEW.risk_level := coalesce(NEW.risk_level, 'none');
  -- older app versions only send is_crisis
  IF TG_OP = 'INSERT' AND NEW.is_crisis AND NEW.risk_level = 'none' THEN
    NEW.risk_level := 'possible';
  END IF;
  -- risk never goes down
  IF TG_OP = 'UPDATE' AND public.vibe_risk_rank(OLD.risk_level) > public.vibe_risk_rank(NEW.risk_level) THEN
    NEW.risk_level := OLD.risk_level;
  END IF;
  IF public.vibe_risk_rank(floor_risk) > public.vibe_risk_rank(NEW.risk_level) THEN
    NEW.risk_level := floor_risk;
  END IF;

  NEW.is_crisis := NEW.risk_level <> 'none';
  NEW.is_sensitive := NEW.risk_level = 'high';
  IF NEW.is_crisis THEN
    NEW.wants_match := false;
  END IF;

  -- toxicity: a pattern match routes the post to review; it never punishes on its own
  NEW.toxicity_severity := coalesce(NEW.toxicity_severity, 'none');
  IF TG_OP = 'UPDATE' AND public.vibe_tox_rank(OLD.toxicity_severity) > public.vibe_tox_rank(NEW.toxicity_severity) THEN
    NEW.toxicity_severity := OLD.toxicity_severity;
  END IF;
  IF NEW.toxicity_severity = 'none'
     AND EXISTS (SELECT 1 FROM public.safety_patterns WHERE kind = 'toxicity' AND position(pattern IN norm) > 0) THEN
    NEW.toxicity_severity := 'low';
  END IF;

  -- only review_post() may mark a post reviewed
  IF TG_OP = 'INSERT' THEN
    NEW.reviewed_at := NULL;
  ELSIF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
        AND coalesce(current_setting('vibe.reviewing', true), '') <> 'on' THEN
    NEW.reviewed_at := OLD.reviewed_at;
  END IF;

  IF NEW.reviewed_at IS NULL AND public.vibe_tox_rank(NEW.toxicity_severity) >= 2 THEN
    NEW.is_flagged := true;  -- the existing admin review flag; also keeps it out of matching
  END IF;
  NEW.is_hidden := NEW.toxicity_severity = 'high' AND NEW.reviewed_at IS NULL;

  NEW.vibe_tags := ARRAY(
    SELECT DISTINCT t FROM unnest(coalesce(NEW.vibe_tags, '{}')) AS t
    WHERE t = ANY (ARRAY[
      'loneliness', 'anxiety', 'heartbreak', 'family', 'friendship', 'exam-stress', 'work-stress',
      'burnout', 'self-doubt', 'body-image', 'grief', 'money', 'health', 'identity', 'overthinking',
      'hope', 'gratitude', 'small-win', 'venting', 'need-advice',
      'placement-stress', 'parental-pressure', 'comparison', 'homesickness'
    ])
    LIMIT 5
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_enforce_vibe ON public.posts;
CREATE TRIGGER posts_enforce_vibe
  BEFORE INSERT OR UPDATE OF title, content, vibe_tags, is_crisis, wants_match, risk_level, is_sensitive,
    toxicity_severity, is_hidden, reviewed_at, is_flagged ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_enforce_vibe();

-- backfill existing rows
UPDATE public.posts SET risk_level = 'possible' WHERE is_crisis AND risk_level = 'none';

-- 4. Hidden posts: visible only to their author and admins
DROP POLICY IF EXISTS "select_posts" ON public.posts;
CREATE POLICY "select_posts" ON public.posts FOR SELECT TO authenticated USING (
  NOT is_hidden
  OR user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin)
);

-- 5. Admin review: approve (publish) or remove a held post
CREATE OR REPLACE FUNCTION public.review_post(p_post_id uuid, p_approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin) THEN
    RAISE EXCEPTION 'only admins can review posts';
  END IF;
  IF p_approve THEN
    PERFORM set_config('vibe.reviewing', 'on', true);
    UPDATE public.posts SET reviewed_at = now(), is_flagged = false WHERE id = p_post_id;
    PERFORM set_config('vibe.reviewing', '', true);
  ELSE
    DELETE FROM public.posts WHERE id = p_post_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.review_post(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_post(uuid, boolean) TO authenticated;

-- 6. Private check-ins (one per flagged post, created by the database)
CREATE TABLE IF NOT EXISTS public.vibe_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  risk text NOT NULL CHECK (risk IN ('possible', 'high')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'joking', 'overwhelmed', 'not_okay', 'dismissed')),
  dismiss_count integer NOT NULL DEFAULT 0 CHECK (dismiss_count >= 0),
  -- set by the app after posting so the card can reply in the post's language
  lang_style text NOT NULL DEFAULT 'en' CHECK (lang_style IN ('en', 'hinglish', 'telugu', 'tenglish', 'devanagari')),
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_vibe_checkins_user_pending ON public.vibe_checkins(user_id) WHERE status = 'pending';
ALTER TABLE public.vibe_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkins readable by owner" ON public.vibe_checkins;
CREATE POLICY "checkins readable by owner" ON public.vibe_checkins
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "checkins answerable by owner" ON public.vibe_checkins;
CREATE POLICY "checkins answerable by owner" ON public.vibe_checkins
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- owners may only change the answer fields
CREATE OR REPLACE FUNCTION public.vibe_checkins_answer_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.id := OLD.id;
  NEW.user_id := OLD.user_id;
  NEW.post_id := OLD.post_id;
  NEW.risk := OLD.risk;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS vibe_checkins_answer_only ON public.vibe_checkins;
CREATE TRIGGER vibe_checkins_answer_only BEFORE UPDATE ON public.vibe_checkins
  FOR EACH ROW EXECUTE FUNCTION public.vibe_checkins_answer_only();

CREATE OR REPLACE FUNCTION public.posts_create_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.risk_level <> 'none' THEN
    INSERT INTO public.vibe_checkins (user_id, post_id, risk)
    VALUES (NEW.user_id, NEW.id, NEW.risk_level)
    ON CONFLICT (post_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS posts_create_checkin ON public.posts;
CREATE TRIGGER posts_create_checkin AFTER INSERT OR UPDATE OF risk_level ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_create_checkin();

-- 7. Anonymous chip-correction feedback: no user id, no post text
CREATE TABLE IF NOT EXISTS public.vibe_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  predicted_tags text[] NOT NULL DEFAULT '{}',
  corrected_tags text[] NOT NULL DEFAULT '{}',
  lang_style text NOT NULL CHECK (lang_style IN ('en', 'hinglish', 'telugu', 'tenglish', 'devanagari')),
  length_bucket text NOT NULL CHECK (length_bucket IN ('short', 'medium', 'long')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vibe_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback insert by users" ON public.vibe_feedback;
CREATE POLICY "feedback insert by users" ON public.vibe_feedback
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "feedback readable by admins" ON public.vibe_feedback;
CREATE POLICY "feedback readable by admins" ON public.vibe_feedback
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin));
