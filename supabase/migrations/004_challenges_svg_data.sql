-- =============================================================================
-- ADD SVG DATA TO CHALLENGES TABLE
-- Stores complete shape rendering data for future-proofing
-- =============================================================================

-- Add columns for shape SVG data and display names
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS shape_1_svg TEXT,
  ADD COLUMN IF NOT EXISTS shape_2_svg TEXT,
  ADD COLUMN IF NOT EXISTS shape_1_name TEXT,
  ADD COLUMN IF NOT EXISTS shape_2_name TEXT;

-- Note: Existing rows will have NULL for these new columns
-- The edge function will populate them for new challenges
-- Old challenges can be backfilled if needed
