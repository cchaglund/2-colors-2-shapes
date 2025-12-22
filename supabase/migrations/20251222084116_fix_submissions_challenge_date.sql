-- Fix submissions.challenge_date from DATE to TEXT
-- This is the root cause of the "operator does not exist: date = text" error

ALTER TABLE submissions
  ALTER COLUMN challenge_date TYPE TEXT USING challenge_date::TEXT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
