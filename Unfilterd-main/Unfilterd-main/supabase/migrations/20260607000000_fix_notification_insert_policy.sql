/*
# UNFILTERD - Fix notification insert policy

1. Changes
   - Allow notification inserts when the authenticated user is the actor
   - Preserve self-insert behavior for user-owned notifications

2. Important
   - Like/comment/reply notifications target another user
   - This policy keeps notification creation compatible with engagement-driven flows
*/

DROP POLICY IF EXISTS "insert_own_notification" ON notifications;
CREATE POLICY "insert_own_notification" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = actor_id);
