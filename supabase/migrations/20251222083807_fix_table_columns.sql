-- Check and fix table column types
-- The issue is that challenge_date columns are still DATE type but we're passing TEXT

-- Check current column types and convert if needed
DO $$
DECLARE
  comparisons_type text;
  daily_rankings_type text;
  user_voting_status_type text;
BEGIN
  -- Get current column types
  SELECT data_type INTO comparisons_type
  FROM information_schema.columns
  WHERE table_name = 'comparisons' AND column_name = 'challenge_date';

  SELECT data_type INTO daily_rankings_type
  FROM information_schema.columns
  WHERE table_name = 'daily_rankings' AND column_name = 'challenge_date';

  SELECT data_type INTO user_voting_status_type
  FROM information_schema.columns
  WHERE table_name = 'user_voting_status' AND column_name = 'challenge_date';

  -- Log current types
  RAISE NOTICE 'comparisons.challenge_date type: %', comparisons_type;
  RAISE NOTICE 'daily_rankings.challenge_date type: %', daily_rankings_type;
  RAISE NOTICE 'user_voting_status.challenge_date type: %', user_voting_status_type;

  -- Alter if still date type
  IF comparisons_type = 'date' THEN
    RAISE NOTICE 'Converting comparisons.challenge_date from DATE to TEXT';
    ALTER TABLE comparisons ALTER COLUMN challenge_date TYPE TEXT USING challenge_date::TEXT;
  END IF;

  IF daily_rankings_type = 'date' THEN
    RAISE NOTICE 'Converting daily_rankings.challenge_date from DATE to TEXT';
    ALTER TABLE daily_rankings ALTER COLUMN challenge_date TYPE TEXT USING challenge_date::TEXT;
  END IF;

  IF user_voting_status_type = 'date' THEN
    RAISE NOTICE 'Converting user_voting_status.challenge_date from DATE to TEXT';
    ALTER TABLE user_voting_status ALTER COLUMN challenge_date TYPE TEXT USING challenge_date::TEXT;
  END IF;
END $$;

-- Force notify PostgREST to reload
NOTIFY pgrst, 'reload schema';
