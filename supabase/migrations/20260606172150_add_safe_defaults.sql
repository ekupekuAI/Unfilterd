/*
# UNFILTERD - Add safe defaults for NOT NULL columns

1. Changes
   - Add default value for profiles.display_name ('Anonymous Soul')
   - Add default value for profiles.username (dynamic via function)
   
2. Important
   - These provide safety in case the trigger doesn't fire
   - username uses a function to generate 'anon_' + random hex
*/

-- Add default for display_name
ALTER TABLE profiles ALTER COLUMN display_name SET DEFAULT 'Anonymous Soul';

-- Add default for username using a function
CREATE OR REPLACE FUNCTION public.generate_anon_username()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'anon_' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);
END;
$$;

ALTER TABLE profiles ALTER COLUMN username SET DEFAULT public.generate_anon_username();
