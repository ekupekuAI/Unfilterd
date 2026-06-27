/*
  Phase 4-6 additive migration.
  Adds lightweight community tables and post media support.
*/

CREATE TABLE IF NOT EXISTS public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type text NOT NULL,
  media_url text NOT NULL,
  thumbnail_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_media_type_check CHECK (media_type = ANY (ARRAY['image'::text, 'gif'::text, 'video'::text, 'voice'::text]))
);

CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  banner_url text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_count integer NOT NULL DEFAULT 0,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_memberships_unique UNIQUE (community_id, user_id),
  CONSTRAINT community_memberships_role_check CHECK (role = ANY (ARRAY['member'::text, 'moderator'::text, 'owner'::text]))
);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  pinned boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_posts_unique UNIQUE (community_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON public.post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_creator_id ON public.communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_community_id ON public.community_memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_user_id ON public.community_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id ON public.community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_post_id ON public.community_posts(post_id);

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post media readable by authenticated users" ON public.post_media;
CREATE POLICY "post media readable by authenticated users"
  ON public.post_media FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "post media insert own" ON public.post_media;
CREATE POLICY "post media insert own"
  ON public.post_media FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post media delete own" ON public.post_media;
CREATE POLICY "post media delete own"
  ON public.post_media FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "communities readable by authenticated users" ON public.communities;
CREATE POLICY "communities readable by authenticated users"
  ON public.communities FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "communities insert own" ON public.communities;
CREATE POLICY "communities insert own"
  ON public.communities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "communities update owner" ON public.communities;
CREATE POLICY "communities update owner"
  ON public.communities FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "community memberships readable" ON public.community_memberships;
CREATE POLICY "community memberships readable"
  ON public.community_memberships FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "community memberships insert own" ON public.community_memberships;
CREATE POLICY "community memberships insert own"
  ON public.community_memberships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community memberships delete own" ON public.community_memberships;
CREATE POLICY "community memberships delete own"
  ON public.community_memberships FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community posts readable" ON public.community_posts;
CREATE POLICY "community posts readable"
  ON public.community_posts FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "community posts manage own" ON public.community_posts;
CREATE POLICY "community posts manage own"
  ON public.community_posts FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_id AND c.creator_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.communities c
    WHERE c.id = community_id AND c.creator_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.update_community_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_community_membership_change ON public.community_memberships;
CREATE TRIGGER on_community_membership_change
  AFTER INSERT OR DELETE ON public.community_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_community_member_count();

-- Supabase Storage buckets should be created manually or via SQL in the dashboard:
-- post-media, community-assets
