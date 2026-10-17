/*
  Safety fixes from the independent review (2026-10-17). Each one has a test in
  db-tests/safety_fixes.test.mjs.

  C2  users could grant themselves admin / clear their own suspension
  C1  much wider crisis pattern list (regenerated below)
  I8  normalisation now also collapses whitespace, punctuation and full-width text
  I1  editing a reviewed post sends it back to review
  I2  threat / doxxing / harassment patterns reach the review queue (medium)
  I3  check-ins on content edits, and escalation to high reopens the check-in
  I5  hidden posts no longer leak through post_media or comments
  M3  feedback rows are bounded to known tags
*/

-- C2. Role and suspension columns can only be changed by an admin
--     (or by the dashboard / service role, where auth.uid() is null).
CREATE OR REPLACE FUNCTION public.profiles_guard_privileged()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin) THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_suspended := OLD.is_suspended;
    NEW.suspension_reason := OLD.suspension_reason;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_guard_privileged ON public.profiles;
CREATE TRIGGER profiles_guard_privileged BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_privileged();

-- I8. Normalisation: NFKC, no zero-width characters, lowercase, punctuation to
--     spaces, whitespace collapsed. Kept identical to src/lib/vibe.ts and
--     model/vibe_schema.py.
CREATE OR REPLACE FUNCTION public.vibe_normalize(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(regexp_replace(
    translate(
      lower(regexp_replace(normalize(coalesce(t, ''), NFKC), '[​‌‍﻿]', '', 'g')),
      U&'!"#$%&''()*+,-./:;<=>?@[\005C]^_`{|}~\2019\2018\02BC\201C\201D\2026\2013\2014\0964\0965',
      '                                        '),
    '\s+', ' ', 'g'))
$$;

-- C1. Regenerated pattern list (also re-normalises every stored pattern)
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
  ('crisis', public.vibe_normalize('don''t want to live'), 'en'),
  ('crisis', public.vibe_normalize('dont want to live'), 'en'),
  ('crisis', public.vibe_normalize('do not want to live'), 'en'),
  ('crisis', public.vibe_normalize('don''t want to be alive'), 'en'),
  ('crisis', public.vibe_normalize('dont want to be alive'), 'en'),
  ('crisis', public.vibe_normalize('do not want to be alive'), 'en'),
  ('crisis', public.vibe_normalize('kms'), 'en'),
  ('crisis', public.vibe_normalize('unalive'), 'en'),
  ('crisis', public.vibe_normalize('kill my self'), 'en'),
  ('crisis', public.vibe_normalize('selfharm'), 'en'),
  ('crisis', public.vibe_normalize('self harming'), 'en'),
  ('crisis', public.vibe_normalize('cut myself'), 'en'),
  ('crisis', public.vibe_normalize('slit my wrist'), 'en'),
  ('crisis', public.vibe_normalize('end myself'), 'en'),
  ('crisis', public.vibe_normalize('want to end it'), 'en'),
  ('crisis', public.vibe_normalize('want it all to end'), 'en'),
  ('crisis', public.vibe_normalize('wish i could die'), 'en'),
  ('crisis', public.vibe_normalize('rather be dead'), 'en'),
  ('crisis', public.vibe_normalize('wish i was never born'), 'en'),
  ('crisis', public.vibe_normalize('no point living'), 'en'),
  ('crisis', public.vibe_normalize('no point in living'), 'en'),
  ('crisis', public.vibe_normalize('tired of living'), 'en'),
  ('crisis', public.vibe_normalize('tired of being alive'), 'en'),
  ('crisis', public.vibe_normalize('life isn''t worth'), 'en'),
  ('crisis', public.vibe_normalize('life is not worth'), 'en'),
  ('crisis', public.vibe_normalize('everyone would be better off'), 'en'),
  ('crisis', public.vibe_normalize('nobody would miss me'), 'en'),
  ('crisis', public.vibe_normalize('won''t be here tomorrow'), 'en'),
  ('crisis', public.vibe_normalize('wont be here tomorrow'), 'en'),
  ('crisis', public.vibe_normalize('sleep forever'), 'en'),
  ('crisis', public.vibe_normalize('never wake up'), 'en'),
  ('crisis', public.vibe_normalize('jump off a'), 'en'),
  ('crisis', public.vibe_normalize('thinking about dying'), 'en'),
  ('crisis', public.vibe_normalize('thoughts of dying'), 'en'),
  ('crisis', public.vibe_normalize('marna hai'), 'hinglish'),
  ('crisis', public.vibe_normalize('mar jaana hai'), 'hinglish'),
  ('crisis', public.vibe_normalize('mar jana hai'), 'hinglish'),
  ('crisis', public.vibe_normalize('mar jau'), 'hinglish'),
  ('crisis', public.vibe_normalize('mar jaun'), 'hinglish'),
  ('crisis', public.vibe_normalize('khudkushi'), 'hinglish'),
  ('crisis', public.vibe_normalize('khudkhushi'), 'hinglish'),
  ('crisis', public.vibe_normalize('jeena nahi hai'), 'hinglish'),
  ('crisis', public.vibe_normalize('apni jaan de'), 'hinglish'),
  ('crisis', public.vibe_normalize('jaan de dunga'), 'hinglish'),
  ('crisis', public.vibe_normalize('jaan de dungi'), 'hinglish'),
  ('crisis', public.vibe_normalize('phansi'), 'hinglish'),
  ('crisis', public.vibe_normalize('fansi laga'), 'hinglish'),
  ('crisis', public.vibe_normalize('neend ki goliyan'), 'hinglish'),
  ('crisis', public.vibe_normalize('goliyan kha'), 'hinglish'),
  ('crisis', public.vibe_normalize('kood jaunga'), 'hinglish'),
  ('crisis', public.vibe_normalize('kood jaungi'), 'hinglish'),
  ('crisis', public.vibe_normalize('marne ka mann'), 'hinglish'),
  ('crisis', public.vibe_normalize('marne ka khayal'), 'hinglish'),
  ('crisis', public.vibe_normalize('jeene ki wajah nahi'), 'hinglish'),
  ('crisis', public.vibe_normalize('मरना है'), 'devanagari'),
  ('crisis', public.vibe_normalize('मर जाऊं'), 'devanagari'),
  ('crisis', public.vibe_normalize('मर जाना है'), 'devanagari'),
  ('crisis', public.vibe_normalize('खुदकुशी'), 'devanagari'),
  ('crisis', public.vibe_normalize('जीना नहीं है'), 'devanagari'),
  ('crisis', public.vibe_normalize('जान दे दूंगा'), 'devanagari'),
  ('crisis', public.vibe_normalize('जान दे दूंगी'), 'devanagari'),
  ('crisis', public.vibe_normalize('फांसी'), 'devanagari'),
  ('crisis', public.vibe_normalize('नींद की गोलियां'), 'devanagari'),
  ('crisis', public.vibe_normalize('कूद जाऊंगा'), 'devanagari'),
  ('crisis', public.vibe_normalize('मरने का मन'), 'devanagari'),
  ('crisis', public.vibe_normalize('मरने का ख्याल'), 'devanagari'),
  ('crisis', public.vibe_normalize('जीने की वजह नहीं'), 'devanagari'),
  ('crisis', public.vibe_normalize('చచ్చిపోవాలి'), 'telugu'),
  ('crisis', public.vibe_normalize('చనిపోవాలి'), 'telugu'),
  ('crisis', public.vibe_normalize('చచ్చిపోదామని'), 'telugu'),
  ('crisis', public.vibe_normalize('ఉరి వేసుకుంటా'), 'telugu'),
  ('crisis', public.vibe_normalize('ఉరేసుకుంటా'), 'telugu'),
  ('crisis', public.vibe_normalize('మాత్రలు మింగుతా'), 'telugu'),
  ('crisis', public.vibe_normalize('నిద్ర మాత్రలు'), 'telugu'),
  ('crisis', public.vibe_normalize('ఈ లోకంలో ఉండను'), 'telugu'),
  ('crisis', public.vibe_normalize('బతకాలని అనిపించట్లేదు'), 'telugu'),
  ('crisis', public.vibe_normalize('uri vesukunta'), 'tenglish'),
  ('crisis', public.vibe_normalize('uri vesukuntanu'), 'tenglish'),
  ('crisis', public.vibe_normalize('pranam teesukunta'), 'tenglish'),
  ('crisis', public.vibe_normalize('pranam teesukovali'), 'tenglish'),
  ('crisis', public.vibe_normalize('mathralu mingutha'), 'tenglish'),
  ('crisis', public.vibe_normalize('ika undanu'), 'tenglish'),
  ('crisis', public.vibe_normalize('ee lokam lo undanu'), 'tenglish'),
  ('crisis', public.vibe_normalize('chachipovalani'), 'tenglish'),
  ('crisis', public.vibe_normalize('chanipovalani'), 'tenglish'),
  ('crisis', public.vibe_normalize('bathakalani anipinchatledu'), 'tenglish'),
  ('crisis', public.vibe_normalize('will kill myself'), 'en'),
  ('crisis', public.vibe_normalize('going to end my life'), 'en'),
  ('crisis', public.vibe_normalize('gonna kill myself'), 'en'),
  ('crisis', public.vibe_normalize('going to kill myself'), 'en'),
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
  ('crisis_explicit', public.vibe_normalize('hang myself'), 'en'),
  ('crisis_explicit', public.vibe_normalize('took all my pills'), 'en'),
  ('crisis_explicit', public.vibe_normalize('took all the pills'), 'en'),
  ('crisis_explicit', public.vibe_normalize('swallowed all the pills'), 'en'),
  ('crisis_explicit', public.vibe_normalize('goodbye everyone, this is the end'), 'en'),
  ('crisis_explicit', public.vibe_normalize('this is my last post'), 'en'),
  ('crisis_explicit', public.vibe_normalize('my last message before i go'), 'en'),
  ('crisis_explicit', public.vibe_normalize('tonight i will end it'), 'en'),
  ('crisis_explicit', public.vibe_normalize('ending it tonight'), 'en'),
  ('crisis_explicit', public.vibe_normalize('end it tonight'), 'en'),
  ('crisis_explicit', public.vibe_normalize('jumping tonight'), 'en'),
  ('crisis_explicit', public.vibe_normalize('aaj raat mar jaunga'), 'hinglish'),
  ('crisis_explicit', public.vibe_normalize('aaj raat mar jaungi'), 'hinglish'),
  ('crisis_explicit', public.vibe_normalize('phansi laga lunga'), 'hinglish'),
  ('crisis_explicit', public.vibe_normalize('phansi laga lungi'), 'hinglish'),
  ('crisis_explicit', public.vibe_normalize('goliyan kha li'), 'hinglish'),
  ('crisis_explicit', public.vibe_normalize('आज रात मर जाऊंगा'), 'devanagari'),
  ('crisis_explicit', public.vibe_normalize('फांसी लगा लूंगा'), 'devanagari'),
  ('crisis_explicit', public.vibe_normalize('गोलियां खा लीं'), 'devanagari'),
  ('crisis_explicit', public.vibe_normalize('ఈ రోజే చనిపోతా'), 'telugu'),
  ('crisis_explicit', public.vibe_normalize('ఉరి వేసుకుంటున్నా'), 'telugu'),
  ('crisis_explicit', public.vibe_normalize('ivala rathri chanipotha'), 'tenglish'),
  ('crisis_explicit', public.vibe_normalize('uri vesukuntunna'), 'tenglish'),
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
  ('toxicity', public.vibe_normalize('randi'), 'slur'),
  ('toxicity', public.vibe_normalize('kys'), 'harassment'),
  ('toxicity', public.vibe_normalize('kill yourself'), 'harassment');
-- END GENERATED PATTERNS

-- I1 / I2 / M4. Enforcement trigger
CREATE OR REPLACE FUNCTION public.posts_enforce_vibe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text := public.vibe_normalize(coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  floor_risk text := 'none';
  tox_floor text := 'none';
  reviewing boolean := coalesce(current_setting('vibe.reviewing', true), '') = 'on';
BEGIN
  IF EXISTS (SELECT 1 FROM public.safety_patterns WHERE kind = 'crisis_explicit' AND position(pattern IN norm) > 0) THEN
    floor_risk := 'high';
  ELSIF EXISTS (SELECT 1 FROM public.safety_patterns WHERE kind = 'crisis' AND position(pattern IN norm) > 0) THEN
    floor_risk := 'possible';
  END IF;

  NEW.risk_level := coalesce(NEW.risk_level, 'none');
  IF NEW.is_crisis AND NEW.risk_level = 'none' THEN
    NEW.risk_level := 'possible';  -- older app versions only send is_crisis
  END IF;
  IF TG_OP = 'UPDATE' AND public.vibe_risk_rank(OLD.risk_level) > public.vibe_risk_rank(NEW.risk_level) THEN
    NEW.risk_level := OLD.risk_level;  -- risk never goes down
  END IF;
  IF public.vibe_risk_rank(floor_risk) > public.vibe_risk_rank(NEW.risk_level) THEN
    NEW.risk_level := floor_risk;
  END IF;
  NEW.is_crisis := NEW.risk_level <> 'none';
  NEW.is_sensitive := NEW.risk_level = 'high';
  IF NEW.is_crisis THEN
    NEW.wants_match := false;
  END IF;

  -- toxicity: patterns route to review; threats and harassment at least medium
  SELECT CASE WHEN bool_or(label IN ('threat', 'doxxing', 'harassment', 'sexual_harassment')) THEN 'medium'
              WHEN count(*) > 0 THEN 'low' ELSE 'none' END
    INTO tox_floor
    FROM public.safety_patterns WHERE kind = 'toxicity' AND position(pattern IN norm) > 0;
  NEW.toxicity_severity := coalesce(NEW.toxicity_severity, 'none');
  IF TG_OP = 'UPDATE' AND public.vibe_tox_rank(OLD.toxicity_severity) > public.vibe_tox_rank(NEW.toxicity_severity) THEN
    NEW.toxicity_severity := OLD.toxicity_severity;
  END IF;
  IF public.vibe_tox_rank(tox_floor) > public.vibe_tox_rank(NEW.toxicity_severity) THEN
    NEW.toxicity_severity := tox_floor;
  END IF;

  -- only review_post() may mark a post reviewed; editing the text needs a fresh review
  IF TG_OP = 'INSERT' THEN
    NEW.reviewed_at := NULL;
  ELSIF NOT reviewing THEN
    IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
      NEW.reviewed_at := OLD.reviewed_at;
    END IF;
    IF NEW.title IS DISTINCT FROM OLD.title OR NEW.content IS DISTINCT FROM OLD.content THEN
      NEW.reviewed_at := NULL;
    END IF;
  END IF;

  IF NEW.reviewed_at IS NULL AND public.vibe_tox_rank(NEW.toxicity_severity) >= 2 THEN
    NEW.is_flagged := true;
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

-- I3. Check-ins: created whenever risk becomes non-none (insert or any update),
--     and reopened at the higher level on escalation.
CREATE OR REPLACE FUNCTION public.posts_create_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.risk_level <> 'none'
     AND (TG_OP = 'INSERT' OR public.vibe_risk_rank(NEW.risk_level) > public.vibe_risk_rank(OLD.risk_level)) THEN
    INSERT INTO public.vibe_checkins (user_id, post_id, risk)
    VALUES (NEW.user_id, NEW.id, NEW.risk_level)
    ON CONFLICT (post_id) DO UPDATE
      SET risk = EXCLUDED.risk, status = 'pending', dismiss_count = 0, answered_at = NULL
      WHERE public.vibe_risk_rank(EXCLUDED.risk) > public.vibe_risk_rank(public.vibe_checkins.risk);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS posts_create_checkin ON public.posts;
CREATE TRIGGER posts_create_checkin AFTER INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_create_checkin();

-- the owner-only update guard must allow the escalation above (runs as definer)
CREATE OR REPLACE FUNCTION public.vibe_checkins_answer_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.post_id := OLD.post_id;
    NEW.risk := OLD.risk;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

-- I5. Media and comments follow the parent post's visibility
DROP POLICY IF EXISTS "post media readable by authenticated users" ON public.post_media;
CREATE POLICY "post media readable by authenticated users" ON public.post_media
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_media.post_id));

DROP POLICY IF EXISTS "select_comments" ON public.comments;
CREATE POLICY "select_comments" ON public.comments
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id));

DROP POLICY IF EXISTS "insert_own_comment" ON public.comments;
CREATE POLICY "insert_own_comment" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id));

-- M3. Feedback limited to the known tag list
ALTER TABLE public.vibe_feedback DROP CONSTRAINT IF EXISTS vibe_feedback_tags_known;
ALTER TABLE public.vibe_feedback ADD CONSTRAINT vibe_feedback_tags_known CHECK (
  cardinality(predicted_tags) <= 5 AND cardinality(corrected_tags) <= 5
  AND predicted_tags <@ ARRAY['loneliness', 'anxiety', 'heartbreak', 'family', 'friendship', 'exam-stress', 'work-stress',
    'burnout', 'self-doubt', 'body-image', 'grief', 'money', 'health', 'identity', 'overthinking', 'hope', 'gratitude',
    'small-win', 'venting', 'need-advice', 'placement-stress', 'parental-pressure', 'comparison', 'homesickness']
  AND corrected_tags <@ ARRAY['loneliness', 'anxiety', 'heartbreak', 'family', 'friendship', 'exam-stress', 'work-stress',
    'burnout', 'self-doubt', 'body-image', 'grief', 'money', 'health', 'identity', 'overthinking', 'hope', 'gratitude',
    'small-win', 'venting', 'need-advice', 'placement-stress', 'parental-pressure', 'comparison', 'homesickness']
);
