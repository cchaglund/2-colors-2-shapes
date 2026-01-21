-- Follows Feature Migration
-- Implements one-way follow system (like Twitter)

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are public" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Helper function for calendar badge
CREATE OR REPLACE FUNCTION count_friends_submissions_by_date(
  p_user_id UUID, p_start_date TEXT, p_end_date TEXT
) RETURNS TABLE (challenge_date TEXT, friend_count BIGINT) AS $$
  SELECT s.challenge_date, COUNT(DISTINCT s.user_id)
  FROM submissions s
  INNER JOIN follows f ON f.following_id = s.user_id AND f.follower_id = p_user_id
  WHERE s.challenge_date BETWEEN p_start_date AND p_end_date
    AND s.included_in_ranking = true
  GROUP BY s.challenge_date;
$$ LANGUAGE sql SECURITY DEFINER;
