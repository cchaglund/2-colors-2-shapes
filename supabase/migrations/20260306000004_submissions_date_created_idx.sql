-- Index for sorting submissions by created_at within a day (newest/oldest sort modes)
CREATE INDEX IF NOT EXISTS idx_submissions_date_created ON submissions(challenge_date, created_at DESC);
