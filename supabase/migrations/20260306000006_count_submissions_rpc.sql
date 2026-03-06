-- Server-side aggregation for wall calendar submission counts.
-- Returns one row per date with the count, instead of one row per submission.

CREATE OR REPLACE FUNCTION count_submissions_by_date(
  p_start_date TEXT,
  p_end_date TEXT
)
RETURNS TABLE (challenge_date TEXT, submission_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT s.challenge_date, COUNT(*)::BIGINT
  FROM submissions s
  WHERE s.challenge_date >= p_start_date
    AND s.challenge_date <= p_end_date
    AND s.included_in_ranking = true
  GROUP BY s.challenge_date;
END;
$$ LANGUAGE plpgsql STABLE;
