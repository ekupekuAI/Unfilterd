/*
  Vibe Matcher.

  Posts carry vibe tags from the AI analysis. A person can ask to be matched with
  someone feeling the same thing; the matched person accepts or declines, and on
  accept both get a private, anonymous one-to-one chat.

  Safety rules enforced here, not only in the UI:
  - Posts flagged as crisis are never matched (the author sees help resources instead).
  - People who turned matching off, blocked each other, or are suspended are never paired.
  - Each person can start at most 5 match requests per 24 hours.
  - Only the two participants can read or write a conversation.
*/

-- 0. Blocks. schema.sql defines this table but no earlier migration created it,
--    so databases built from migrations were missing it.

CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocks_unique_pair UNIQUE (blocker_id, blocked_id),
  CONSTRAINT blocks_no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON public.blocks(blocked_id);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Only the blocker sees a block; the blocked person is never told.
DROP POLICY IF EXISTS "select_own_blocks" ON public.blocks;
CREATE POLICY "select_own_blocks" ON public.blocks
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "insert_own_blocks" ON public.blocks;
CREATE POLICY "insert_own_blocks" ON public.blocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "delete_own_blocks" ON public.blocks;
CREATE POLICY "delete_own_blocks" ON public.blocks
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- 1. Vibe data on posts and the matching preference on profiles

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS vibe_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vibe_intensity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_crisis boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_match boolean NOT NULL DEFAULT false;

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_vibe_intensity_range;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_vibe_intensity_range CHECK (vibe_intensity BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_posts_vibe_tags ON public.posts USING gin (vibe_tags);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS open_to_matching boolean NOT NULL DEFAULT true;

-- The app sends vibe data, but the database has the final say: crisis language
-- always sets is_crisis (it can't be cleared by a client), and tags are limited
-- to the known list.
CREATE OR REPLACE FUNCTION public.posts_enforce_vibe()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF lower(coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, '')) ~
     '(end my life|end it all|want to die|kill myself|suicid|self[ -]?harm|hurt myself|no reason to live|can.?t go on|want to disappear|better off dead|not worth living|cutting myself)' THEN
    NEW.is_crisis := true;
  END IF;

  IF NEW.is_crisis THEN
    NEW.wants_match := false;
  END IF;

  NEW.vibe_tags := ARRAY(
    SELECT DISTINCT t FROM unnest(coalesce(NEW.vibe_tags, '{}')) AS t
    WHERE t = ANY (ARRAY[
      'loneliness', 'anxiety', 'heartbreak', 'family', 'friendship', 'exam-stress', 'work-stress',
      'burnout', 'self-doubt', 'body-image', 'grief', 'money', 'health', 'identity', 'overthinking',
      'hope', 'gratitude', 'small-win', 'venting', 'need-advice'
    ])
    LIMIT 5
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_enforce_vibe ON public.posts;
CREATE TRIGGER posts_enforce_vibe
  BEFORE INSERT OR UPDATE OF title, content, vibe_tags, is_crisis, wants_match ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.posts_enforce_vibe();

-- 2. Notifications: new types and an in-app link

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link text NOT NULL DEFAULT '';

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type = ANY (ARRAY['like', 'comment', 'reply', 'system', 'match', 'message']::text[])
  );

-- 3. Matches, conversations, messages

CREATE TABLE IF NOT EXISTS public.vibe_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matched_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  matched_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  shared_tags text[] NOT NULL DEFAULT '{}',
  conversation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT vibe_matches_status_check CHECK (status = ANY (ARRAY['pending', 'accepted', 'declined', 'expired']::text[])),
  CONSTRAINT vibe_matches_not_self CHECK (requester_id <> matched_user_id)
);

CREATE INDEX IF NOT EXISTS idx_vibe_matches_requester ON public.vibe_matches(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vibe_matches_matched_user ON public.vibe_matches(matched_user_id, status);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.vibe_matches(id) ON DELETE SET NULL,
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  closed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_not_self CHECK (user_a <> user_b)
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON public.conversations(user_a, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON public.conversations(user_b, last_message_at DESC);

ALTER TABLE public.vibe_matches DROP CONSTRAINT IF EXISTS vibe_matches_conversation_fk;
ALTER TABLE public.vibe_matches
  ADD CONSTRAINT vibe_matches_conversation_fk FOREIGN KEY (conversation_id)
  REFERENCES public.conversations(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT messages_content_length CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- 4. Helpers

CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND auth.uid() IN (c.user_a, c.user_b)
  );
$$;

CREATE OR REPLACE FUNCTION public.users_blocked(p_a uuid, p_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = p_a AND b.blocked_id = p_b)
       OR (b.blocker_id = p_b AND b.blocked_id = p_a)
  );
$$;

-- 5. Row level security

ALTER TABLE public.vibe_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Matches are created and answered only through the RPCs below.
DROP POLICY IF EXISTS "vibe matches readable by participants" ON public.vibe_matches;
CREATE POLICY "vibe matches readable by participants"
  ON public.vibe_matches FOR SELECT TO authenticated
  USING (auth.uid() IN (requester_id, matched_user_id));

DROP POLICY IF EXISTS "conversations readable by participants" ON public.conversations;
CREATE POLICY "conversations readable by participants"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() IN (user_a, user_b));

DROP POLICY IF EXISTS "messages readable by participants" ON public.messages;
CREATE POLICY "messages readable by participants"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "messages insert by open participant" ON public.messages;
CREATE POLICY "messages insert by open participant"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.user_a, c.user_b)
        AND c.closed_at IS NULL
        AND NOT public.users_blocked(c.user_a, c.user_b)
    )
  );

-- Recipients mark messages read; nothing else on a message can change.
DROP POLICY IF EXISTS "messages mark read by recipient" ON public.messages;
CREATE POLICY "messages mark read by recipient"
  ON public.messages FOR UPDATE TO authenticated
  USING (sender_id <> auth.uid() AND public.is_conversation_member(conversation_id))
  WITH CHECK (sender_id <> auth.uid() AND public.is_conversation_member(conversation_id));

CREATE OR REPLACE FUNCTION public.messages_only_read_at_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only read_at can be updated on a message';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_only_read_at_changes ON public.messages;
CREATE TRIGGER messages_only_read_at_changes
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.messages_only_read_at_changes();

-- 6. Find a match for one of my posts

CREATE OR REPLACE FUNCTION public.find_vibe_match(p_post_id uuid)
RETURNS SETOF public.vibe_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_post public.posts%ROWTYPE;
  v_candidate record;
  v_match public.vibe_matches%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT * INTO v_post FROM public.posts WHERE id = p_post_id;
  IF NOT FOUND OR v_post.user_id <> v_uid THEN
    RAISE EXCEPTION 'You can only find matches for your own posts';
  END IF;

  IF v_post.is_crisis THEN
    RAISE EXCEPTION 'This post was not matched. Please reach out to one of the support lines shown on it.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND is_suspended) THEN
    RAISE EXCEPTION 'Suspended accounts cannot use matching';
  END IF;

  IF (SELECT count(*) FROM public.vibe_matches
      WHERE requester_id = v_uid AND created_at > now() - interval '24 hours') >= 5 THEN
    RAISE EXCEPTION 'You have reached today''s limit of 5 match requests. Try again tomorrow.';
  END IF;

  -- Already looking for this post: return the existing pending match.
  RETURN QUERY
    SELECT * FROM public.vibe_matches
    WHERE post_id = p_post_id AND status = 'pending'
    LIMIT 1;
  IF FOUND THEN
    RETURN;
  END IF;

  UPDATE public.posts SET wants_match = true WHERE id = p_post_id;

  SELECT
    p.user_id,
    p.id AS post_id,
    ARRAY(SELECT unnest(p.vibe_tags) INTERSECT SELECT unnest(v_post.vibe_tags)) AS shared
  INTO v_candidate
  FROM public.posts p
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.user_id <> v_uid
    AND p.created_at > now() - interval '30 days'
    AND NOT p.is_crisis
    AND NOT p.is_flagged
    AND pr.open_to_matching
    AND NOT pr.is_suspended
    AND NOT public.users_blocked(v_uid, p.user_id)
    AND (p.vibe_tags && v_post.vibe_tags OR (cardinality(v_post.vibe_tags) = 0 AND p.mood = v_post.mood))
    -- never re-pair two people who already have a pending or open match
    AND NOT EXISTS (
      SELECT 1 FROM public.vibe_matches m
      WHERE m.status IN ('pending', 'accepted')
        AND ((m.requester_id = v_uid AND m.matched_user_id = p.user_id)
          OR (m.requester_id = p.user_id AND m.matched_user_id = v_uid))
    )
    -- someone who just declined this person is not asked again for a week
    AND NOT EXISTS (
      SELECT 1 FROM public.vibe_matches m
      WHERE m.status = 'declined'
        AND m.requester_id = v_uid AND m.matched_user_id = p.user_id
        AND m.responded_at > now() - interval '7 days'
    )
    -- don't flood one person with requests
    AND (SELECT count(*) FROM public.vibe_matches m
         WHERE m.matched_user_id = p.user_id AND m.status = 'pending') < 3
  ORDER BY
    cardinality(ARRAY(SELECT unnest(p.vibe_tags) INTERSECT SELECT unnest(v_post.vibe_tags))) DESC,
    p.wants_match DESC,
    p.mood = v_post.mood DESC,
    abs(p.vibe_intensity - v_post.vibe_intensity) ASC,
    p.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO public.vibe_matches (post_id, requester_id, matched_user_id, matched_post_id, shared_tags)
  VALUES (p_post_id, v_uid, v_candidate.user_id, v_candidate.post_id, coalesce(v_candidate.shared, '{}'))
  RETURNING * INTO v_match;

  INSERT INTO public.notifications (user_id, type, actor_id, post_id, message, link)
  VALUES (
    v_candidate.user_id,
    'match',
    NULL,
    p_post_id,
    'Someone is feeling what you felt. Want to talk anonymously?',
    '/matches'
  );

  RETURN NEXT v_match;
END;
$$;

-- 7. Accept or decline a match

CREATE OR REPLACE FUNCTION public.respond_vibe_match(p_match_id uuid, p_accept boolean)
RETURNS TABLE (conversation_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_match public.vibe_matches%ROWTYPE;
  v_conversation_id uuid;
BEGIN
  SELECT * INTO v_match FROM public.vibe_matches WHERE id = p_match_id FOR UPDATE;
  IF NOT FOUND OR v_match.matched_user_id <> v_uid THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  IF v_match.status <> 'pending' THEN
    RAISE EXCEPTION 'This match was already answered';
  END IF;

  IF NOT p_accept THEN
    UPDATE public.vibe_matches SET status = 'declined', responded_at = now() WHERE id = p_match_id;
    conversation_id := NULL;
    RETURN NEXT;
    RETURN;
  END IF;

  IF public.users_blocked(v_match.requester_id, v_uid) THEN
    UPDATE public.vibe_matches SET status = 'expired', responded_at = now() WHERE id = p_match_id;
    RAISE EXCEPTION 'This match is no longer available';
  END IF;

  INSERT INTO public.conversations (match_id, user_a, user_b)
  VALUES (p_match_id, v_match.requester_id, v_uid)
  RETURNING id INTO v_conversation_id;

  UPDATE public.vibe_matches
  SET status = 'accepted', responded_at = now(), conversation_id = v_conversation_id
  WHERE id = p_match_id;

  INSERT INTO public.notifications (user_id, type, actor_id, post_id, message, link)
  VALUES (
    v_match.requester_id,
    'match',
    NULL,
    v_match.post_id,
    'Someone who feels the same way said yes. Your private chat is open.',
    '/chat/' || v_conversation_id
  );

  conversation_id := v_conversation_id;
  RETURN NEXT;
END;
$$;

-- 8. Leave a chat (closes it for both people; optional block)

CREATE OR REPLACE FUNCTION public.leave_conversation(p_conversation_id uuid, p_block boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conv public.conversations%ROWTYPE;
  v_other uuid;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = p_conversation_id;
  IF NOT FOUND OR v_uid NOT IN (v_conv.user_a, v_conv.user_b) THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  v_other := CASE WHEN v_conv.user_a = v_uid THEN v_conv.user_b ELSE v_conv.user_a END;

  UPDATE public.conversations
  SET closed_at = coalesce(closed_at, now()), closed_by = coalesce(closed_by, v_uid)
  WHERE id = p_conversation_id;

  IF p_block THEN
    INSERT INTO public.blocks (blocker_id, blocked_id)
    VALUES (v_uid, v_other)
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  END IF;
END;
$$;

-- 9. New message: bump the conversation and notify the other person
--    (one unread "message" notification per conversation at a time).

CREATE OR REPLACE FUNCTION public.on_message_inserted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversations%ROWTYPE;
  v_recipient uuid;
  v_link text;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id
  RETURNING * INTO v_conv;

  v_recipient := CASE WHEN v_conv.user_a = NEW.sender_id THEN v_conv.user_b ELSE v_conv.user_a END;
  v_link := '/chat/' || NEW.conversation_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = v_recipient AND type = 'message' AND link = v_link AND NOT read
  ) THEN
    INSERT INTO public.notifications (user_id, type, actor_id, message, link)
    VALUES (v_recipient, 'message', NULL, 'You have a new message in your anonymous chat.', v_link);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.on_message_inserted();

-- 10. Permissions and realtime

REVOKE ALL ON FUNCTION public.find_vibe_match(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_vibe_match(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_conversation(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_vibe_match(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_vibe_match(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_conversation(uuid, boolean) TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END;
$$;
