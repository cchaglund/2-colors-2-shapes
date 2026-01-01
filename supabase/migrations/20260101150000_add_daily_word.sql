-- =============================================================================
-- ADD DAILY WORD COLUMN - Stores daily word for creative inspiration
-- =============================================================================

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS word TEXT NOT NULL;
