-- Ranking Feature Migration
-- Implements Elo-based daily ranking system for artwork comparisons

-- =============================================================================
-- 1. COMPARISONS TABLE - Stores individual votes on artwork pairs
-- =============================================================================

CREATE TABLE IF NOT EXISTS comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,  -- The date of the submissions being compared
  submission_a_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  submission_b_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES submissions(id) ON DELETE CASCADE,  -- NULL if skipped
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate votes on same pair by same user
  UNIQUE(voter_id, submission_a_id, submission_b_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS comparisons_voter_date_idx ON comparisons(voter_id, challenge_date);
CREATE INDEX IF NOT EXISTS comparisons_submission_a_idx ON comparisons(submission_a_id);
CREATE INDEX IF NOT EXISTS comparisons_submission_b_idx ON comparisons(submission_b_id);
CREATE INDEX IF NOT EXISTS comparisons_challenge_date_idx ON comparisons(challenge_date);

-- RLS
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all comparisons"
  ON comparisons FOR SELECT USING (true);

CREATE POLICY "Users can insert own comparisons"
  ON comparisons FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- =============================================================================
-- 2. DAILY_RANKINGS TABLE - Computed rankings for each day
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  elo_score INTEGER NOT NULL DEFAULT 1000,
  final_rank INTEGER,  -- Computed when ranking finalized
  vote_count INTEGER NOT NULL DEFAULT 0,  -- Total votes this submission received
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(challenge_date, submission_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS daily_rankings_date_idx ON daily_rankings(challenge_date);
CREATE INDEX IF NOT EXISTS daily_rankings_submission_idx ON daily_rankings(submission_id);
CREATE INDEX IF NOT EXISTS daily_rankings_date_rank_idx ON daily_rankings(challenge_date, final_rank);
CREATE INDEX IF NOT EXISTS daily_rankings_user_idx ON daily_rankings(user_id);

-- RLS - Everyone can read rankings
ALTER TABLE daily_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily rankings"
  ON daily_rankings FOR SELECT USING (true);

-- Service role can insert/update (used by Edge Function)
CREATE POLICY "Service role can manage daily rankings"
  ON daily_rankings FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================================
-- 3. USER_VOTING_STATUS TABLE - Tracks voting progress
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_voting_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,  -- The date being voted on
  vote_count INTEGER NOT NULL DEFAULT 0,  -- Actual votes (not skips)
  entered_ranking BOOLEAN NOT NULL DEFAULT FALSE,  -- True after 5 votes
  seen_winner_announcement BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, challenge_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS user_voting_status_user_date_idx ON user_voting_status(user_id, challenge_date);

-- RLS
ALTER TABLE user_voting_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own voting status"
  ON user_voting_status FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voting status"
  ON user_voting_status FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voting status"
  ON user_voting_status FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. MODIFY SUBMISSIONS TABLE
-- =============================================================================

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS included_in_ranking BOOLEAN NOT NULL DEFAULT FALSE;

-- =============================================================================
-- 5. AUTO-UPDATE TIMESTAMPS
-- =============================================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for daily_rankings
DROP TRIGGER IF EXISTS daily_rankings_updated_at_trigger ON daily_rankings;
CREATE TRIGGER daily_rankings_updated_at_trigger
  BEFORE UPDATE ON daily_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_voting_status
DROP TRIGGER IF EXISTS user_voting_status_updated_at_trigger ON user_voting_status;
CREATE TRIGGER user_voting_status_updated_at_trigger
  BEFORE UPDATE ON user_voting_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. SMART PAIR SELECTION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION get_next_pair(
  p_voter_id UUID,
  p_challenge_date DATE
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
  WHERE s.user_id = p_voter_id AND s.challenge_date = p_challenge_date::text;

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

-- =============================================================================
-- 7. HELPER FUNCTION: Count submissions for a date
-- =============================================================================

CREATE OR REPLACE FUNCTION get_submission_count_for_date(p_challenge_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM submissions
    WHERE challenge_date = p_challenge_date::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. HELPER FUNCTION: Initialize daily rankings for a date
-- =============================================================================

CREATE OR REPLACE FUNCTION initialize_daily_rankings(p_challenge_date DATE)
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
  WHERE s.challenge_date = p_challenge_date::text
    AND NOT EXISTS (
      SELECT 1 FROM daily_rankings dr
      WHERE dr.submission_id = s.id AND dr.challenge_date = p_challenge_date
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 9. HELPER FUNCTION: Compute final ranks for a date
-- =============================================================================

CREATE OR REPLACE FUNCTION compute_final_ranks(p_challenge_date DATE)
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
