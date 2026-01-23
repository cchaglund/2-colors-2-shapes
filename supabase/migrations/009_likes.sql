-- Likes Feature Migration
-- Implements likes system for submissions

-- =============================================================================
-- 1. LIKES TABLE - Stores individual likes on submissions
-- =============================================================================

CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only like a submission once
  UNIQUE(user_id, submission_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS likes_user_idx ON likes(user_id);
CREATE INDEX IF NOT EXISTS likes_submission_idx ON likes(submission_id);

-- RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes (public)
CREATE POLICY "Likes are public" ON likes FOR SELECT USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Users can like" ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY "Users can unlike" ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 2. ADD like_count COLUMN TO SUBMISSIONS TABLE
-- =============================================================================

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

-- =============================================================================
-- 3. TRIGGER FUNCTIONS FOR like_count
-- =============================================================================

-- Function to increment like_count on INSERT
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE submissions
  SET like_count = like_count + 1
  WHERE id = NEW.submission_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement like_count on DELETE
CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE submissions
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = OLD.submission_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS likes_increment_trigger ON likes;
CREATE TRIGGER likes_increment_trigger
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_like_count();

DROP TRIGGER IF EXISTS likes_decrement_trigger ON likes;
CREATE TRIGGER likes_decrement_trigger
  AFTER DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_like_count();

-- =============================================================================
-- 5. INDEX FOR WALL SORTING BY LIKES
-- =============================================================================

-- Composite index for efficient wall sorting: most likes first, then earliest submission
CREATE INDEX IF NOT EXISTS submissions_likes_sort_idx
  ON submissions(challenge_date, like_count DESC, created_at ASC);
