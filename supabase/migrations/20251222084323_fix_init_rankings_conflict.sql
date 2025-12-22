-- Fix initialize_daily_rankings to handle conflicts gracefully
-- Use ON CONFLICT DO NOTHING instead of NOT EXISTS check (race condition safe)

CREATE OR REPLACE FUNCTION initialize_daily_rankings(p_challenge_date TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert rankings for all submissions, ignoring any that already exist
  INSERT INTO daily_rankings (challenge_date, submission_id, user_id, elo_score, vote_count)
  SELECT
    p_challenge_date,
    s.id,
    s.user_id,
    1000,
    0
  FROM submissions s
  WHERE s.challenge_date = p_challenge_date
  ON CONFLICT (challenge_date, submission_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
