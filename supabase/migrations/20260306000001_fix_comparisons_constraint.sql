-- Fix directional unique constraint on comparisons table.
-- Normalizes any existing out-of-order rows, then adds a CHECK constraint
-- to ensure submission_a_id < submission_b_id going forward.

-- Step 1: Normalize existing rows where a >= b
UPDATE comparisons
SET submission_a_id = LEAST(submission_a_id, submission_b_id),
    submission_b_id = GREATEST(submission_a_id, submission_b_id)
WHERE submission_a_id >= submission_b_id;

-- Step 2: Add CHECK constraint to prevent future violations
ALTER TABLE comparisons
  ADD CONSTRAINT ordered_pair CHECK (submission_a_id < submission_b_id);
