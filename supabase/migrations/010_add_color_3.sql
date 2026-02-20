-- Add third color column to challenges table (nullable for backward compatibility)
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS color_3 TEXT;
