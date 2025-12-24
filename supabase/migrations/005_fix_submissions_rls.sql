-- =============================================================================
-- FIX SUBMISSIONS TABLE RLS POLICIES
-- Ensures proper RLS policies exist after data clear
-- =============================================================================

-- Make sure RLS is enabled
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate cleanly)
DROP POLICY IF EXISTS "Users can view their own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON submissions;
DROP POLICY IF EXISTS "Anyone can read submissions" ON submissions;
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON submissions;

-- Policy: All authenticated users can read all submissions (needed for voting)
CREATE POLICY "Authenticated users can read submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can insert their own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own submissions
CREATE POLICY "Users can update their own submissions"
  ON submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own submissions
CREATE POLICY "Users can delete their own submissions"
  ON submissions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Refresh the schema cache by adding a comment
COMMENT ON TABLE submissions IS 'User artwork submissions for daily challenges';
