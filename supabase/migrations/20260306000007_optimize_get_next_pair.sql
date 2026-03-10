-- Optimize get_next_pair() with two-phase sampling.
-- Phase 1: Sample ~20 submissions biased toward low vote counts (O(n) scan).
-- Phase 2: CROSS JOIN only those 20 (max 190 pairs) instead of all eligible (O(n^2)).
-- This bounds the CROSS JOIN to 190 pairs regardless of total submissions.

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
  sampled AS (
    SELECT * FROM eligible_submissions
    ORDER BY vote_count ASC, RANDOM()
    LIMIT 20
  ),
  candidate_pairs AS (
    SELECT
      a.submission_id as sub_a,
      b.submission_id as sub_b,
      a.user_id as user_a,
      b.user_id as user_b,
      (a.vote_count + b.vote_count) as total_votes,
      ABS(a.elo_score - b.elo_score) as elo_diff
    FROM sampled a
    CROSS JOIN sampled b
    WHERE a.submission_id < b.submission_id
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
