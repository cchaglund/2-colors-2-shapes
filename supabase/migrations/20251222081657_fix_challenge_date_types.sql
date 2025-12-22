-- Fix challenge_date column types from DATE to TEXT
-- This ensures consistency with submissions table and frontend string dates

-- =============================================================================
-- 1. DROP EXISTING FUNCTIONS (they have DATE parameters)
-- =============================================================================

DROP FUNCTION IF EXISTS get_next_pair(UUID, DATE);
DROP FUNCTION IF EXISTS get_next_pair(UUID, TEXT);
DROP FUNCTION IF EXISTS get_submission_count_for_date(DATE);
DROP FUNCTION IF EXISTS get_submission_count_for_date(TEXT);
DROP FUNCTION IF EXISTS initialize_daily_rankings(DATE);
DROP FUNCTION IF EXISTS initialize_daily_rankings(TEXT);
DROP FUNCTION IF EXISTS compute_final_ranks(DATE);
DROP FUNCTION IF EXISTS compute_final_ranks(TEXT);

-- =============================================================================
-- 2. ALTER TABLE COLUMNS FROM DATE TO TEXT
-- =============================================================================

-- comparisons table
ALTER TABLE comparisons
  ALTER COLUMN challenge_date TYPE TEXT USING challenge_date::TEXT;

-- daily_rankings table
ALTER TABLE daily_rankings
  ALTER COLUMN challenge_date TYPE TEXT USING challenge_date::TEXT;

-- user_voting_status table
ALTER TABLE user_voting_status
  ALTER COLUMN challenge_date TYPE TEXT USING challenge_date::TEXT;

-- =============================================================================
-- 3. RECREATE FUNCTIONS WITH TEXT PARAMETERS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_next_pair(
  p_voter_id UUID,
  p_challenge_date TEXT
) RETURNS TABLE (
  submission_a_id UUID,
  submission_b_id UUID,
  submission_a_user_id UUID,
  submission_b_user_id UUID
) AS $$
DECLARE
  v_user_submission_id UUID;
BEGIN
  -- Get voter's own submission for this date (to exclude)
  SELECT s.id INTO v_user_submission_id
  FROM submissions s
  WHERE s.user_id = p_voter_id AND s.challenge_date = p_challenge_date;

  RETURN QUERY
  WITH eligible_submissions AS (
    SELECT
      dr.submission_id,
      dr.user_id,
      dr.elo_score,
      dr.vote_count
    FROM daily_rankings dr
    WHERE dr.challenge_date = p_challenge_date
      AND dr.submission_id != COALESCE(v_user_submission_id, '00000000-0000-0000-0000-000000000000'::UUID)
  ),
  seen_pairs AS (
    SELECT c.submission_a_id AS sub_a, c.submission_b_id AS sub_b
    FROM comparisons c
    WHERE c.voter_id = p_voter_id AND c.challenge_date = p_challenge_date
  ),
  candidate_pairs AS (
    SELECT
      a.submission_id as sub_a,
      b.submission_id as sub_b,
      a.user_id as user_a,
      b.user_id as user_b,
      (a.vote_count + b.vote_count) as total_votes,
      ABS(a.elo_score - b.elo_score) as elo_diff
    FROM eligible_submissions a
    CROSS JOIN eligible_submissions b
    WHERE a.submission_id < b.submission_id  -- Avoid duplicates (A,B) and (B,A)
      AND NOT EXISTS (
        SELECT 1 FROM seen_pairs sp
        WHERE (sp.sub_a = a.submission_id AND sp.sub_b = b.submission_id)
           OR (sp.sub_a = b.submission_id AND sp.sub_b = a.submission_id)
      )
  )
  SELECT cp.sub_a, cp.sub_b, cp.user_a, cp.user_b
  FROM candidate_pairs cp
  ORDER BY cp.total_votes ASC, cp.elo_diff ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_submission_count_for_date(p_challenge_date TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM submissions
    WHERE challenge_date = p_challenge_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION initialize_daily_rankings(p_challenge_date TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert rankings for all submissions that don't have one yet
  INSERT INTO daily_rankings (challenge_date, submission_id, user_id, elo_score, vote_count)
  SELECT
    p_challenge_date,
    s.id,
    s.user_id,
    1000,
    0
  FROM submissions s
  WHERE s.challenge_date = p_challenge_date
    AND NOT EXISTS (
      SELECT 1 FROM daily_rankings dr
      WHERE dr.submission_id = s.id AND dr.challenge_date = p_challenge_date
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION compute_final_ranks(p_challenge_date TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE daily_rankings dr
  SET final_rank = ranked.rank
  FROM (
    SELECT
      id,
      RANK() OVER (ORDER BY elo_score DESC) as rank
    FROM daily_rankings
    WHERE challenge_date = p_challenge_date
  ) ranked
  WHERE dr.id = ranked.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
