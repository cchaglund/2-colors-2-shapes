-- Add harmony_rule column to challenges table
-- Stores which color harmony rule was used (triadic, complementary, split-complementary, analogous)
-- so the next day's generation can avoid repeating the same rule.
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS harmony_rule TEXT;
