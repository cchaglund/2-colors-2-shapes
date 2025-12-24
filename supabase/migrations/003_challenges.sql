-- =============================================================================
-- CHALLENGES TABLE - Stores daily challenge configurations
-- =============================================================================

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date TEXT NOT NULL UNIQUE,       -- YYYY-MM-DD format
  color_1 TEXT NOT NULL,                     -- HSL color string
  color_2 TEXT NOT NULL,                     -- HSL color string
  shape_1 TEXT NOT NULL,                     -- ShapeType
  shape_2 TEXT NOT NULL,                     -- ShapeType
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS challenges_date_idx ON challenges(challenge_date);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read challenges (public game data)
CREATE POLICY "Anyone can read challenges"
  ON challenges FOR SELECT USING (true);

-- Policy: Only service role can insert/update challenges (via edge functions)
CREATE POLICY "Service role can manage challenges"
  ON challenges FOR ALL
  USING (auth.role() = 'service_role');
