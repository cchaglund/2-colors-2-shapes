-- Add FK from likes.user_id to public.profiles so PostgREST can resolve the join.
-- (The existing likes_user_id_fkey points to auth.users, which PostgREST can't see.)
DO $$ BEGIN
  ALTER TABLE likes
    ADD CONSTRAINT likes_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
