/*
# UNFILTERD - Add notification triggers

1. Changes
   - Add trigger function to create notifications when a post is liked
   - Add trigger function to create notifications when a comment is made
   - These triggers auto-create notifications for the post owner

2. Important
   - No self-notifications (won't notify yourself when liking/commenting on your own post)
   - Uses SECURITY DEFINER for cross-schema access
*/

-- Notify post owner on like
CREATE OR REPLACE FUNCTION notify_post_owner_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  post_owner uuid;
BEGIN
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id, message)
    VALUES (post_owner, NEW.user_id, 'like', NEW.post_id, 'Someone liked your post');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_like_created ON likes;
CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_post_owner_on_like();

-- Notify post owner on comment
CREATE OR REPLACE FUNCTION notify_post_owner_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  post_owner uuid;
BEGIN
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    IF NEW.parent_comment_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, message)
      VALUES (post_owner, NEW.user_id, 'reply', NEW.post_id, NEW.id, 'Someone replied to a comment on your post');
    ELSE
      INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, message)
      VALUES (post_owner, NEW.user_id, 'comment', NEW.post_id, NEW.id, 'Someone commented on your post');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_created ON comments;
CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_post_owner_on_comment();

-- Notify comment owner on reply
CREATE OR REPLACE FUNCTION notify_comment_owner_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  comment_owner uuid;
BEGIN
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT user_id INTO comment_owner FROM comments WHERE id = NEW.parent_comment_id;
    IF comment_owner IS NOT NULL AND comment_owner != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id, message)
      VALUES (comment_owner, NEW.user_id, 'reply', NEW.post_id, NEW.id, 'Someone replied to your comment');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_reply_created ON comments;
CREATE TRIGGER on_comment_reply_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_comment_owner_on_reply();

-- Update like_count and comment_count on posts when changes happen
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    UPDATE profiles SET likes_received_count = likes_received_count + 1
      WHERE id = (SELECT user_id FROM posts WHERE id = NEW.post_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = greatest(like_count - 1, 0) WHERE id = OLD.post_id;
    UPDATE profiles SET likes_received_count = greatest(likes_received_count - 1, 0)
      WHERE id = (SELECT user_id FROM posts WHERE id = OLD.post_id);
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_like_change ON likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = greatest(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_count_change ON comments;
CREATE TRIGGER on_comment_count_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Update saves_count on posts
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET saves_count = greatest(saves_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_saved_post_change ON saved_posts;
CREATE TRIGGER on_saved_post_change
  AFTER INSERT OR DELETE ON saved_posts
  FOR EACH ROW EXECUTE FUNCTION update_post_saves_count();

-- Update profile posts_count
CREATE OR REPLACE FUNCTION update_profile_posts_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET posts_count = greatest(posts_count - 1, 0) WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_post_count_change ON posts;
CREATE TRIGGER on_post_count_change
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_profile_posts_count();

-- Update comment like count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET like_count = greatest(like_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_like_change ON comment_likes;
CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();
