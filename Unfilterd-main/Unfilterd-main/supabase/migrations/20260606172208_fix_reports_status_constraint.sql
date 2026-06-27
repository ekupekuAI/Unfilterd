/*
# UNFILTERD - Fix reports status constraint

1. Changes
   - Drop existing reports_status_check constraint
   - Add new constraint that includes 'dismissed' status
   
2. Important
   - The Admin page uses 'dismissed' status which was missing from the check constraint
   - Without this fix, dismissing a report would cause a database error
*/

ALTER TABLE reports DROP CONSTRAINT reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'resolved'::text, 'dismissed'::text]));
