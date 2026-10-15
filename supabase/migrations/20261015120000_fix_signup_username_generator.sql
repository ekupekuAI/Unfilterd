/*
  Fix: sign-up failed with "Database error saving new user".

  generate_anon_username() used gen_random_bytes() from the pgcrypto extension,
  which Supabase installs in the `extensions` schema. handle_new_user() runs with
  `SET search_path = public`, so inside the sign-up trigger the function could not
  be resolved and every registration failed.

  Rewritten with built-in md5(random()) so it works under any search_path.
  CREATE OR REPLACE keeps the function's identity, so the existing
  profiles.username and profiles.avatar_seed column defaults pick it up as-is.
*/

CREATE OR REPLACE FUNCTION public.generate_anon_username()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'anon_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8);
$$;
