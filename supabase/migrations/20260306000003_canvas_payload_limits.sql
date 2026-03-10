-- Limit canvas payload size to prevent abuse.
-- Maximum 200 shapes per submission.

ALTER TABLE submissions
  ADD CONSTRAINT max_shapes CHECK (jsonb_array_length(shapes) <= 200);
