-- Reusable rate limit trigger function.
-- Checks: "has this user inserted into this table more than N times in the last M seconds?"
-- Arguments: max_requests, window_seconds, user_column_name

CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  max_requests INTEGER;
  window_seconds INTEGER;
  user_column TEXT;
  recent_count INTEGER;
  user_id_value UUID;
BEGIN
  max_requests := TG_ARGV[0]::INTEGER;
  window_seconds := TG_ARGV[1]::INTEGER;
  user_column := TG_ARGV[2];

  EXECUTE format('SELECT ($1).%I', user_column) INTO user_id_value USING NEW;

  EXECUTE format(
    'SELECT COUNT(*) FROM %I.%I WHERE %I = $1 AND created_at > NOW() - INTERVAL ''%s seconds''',
    TG_TABLE_SCHEMA, TG_TABLE_NAME, user_column, window_seconds
  ) INTO recent_count USING user_id_value;

  IF recent_count >= max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum % requests per % seconds.',
      max_requests, window_seconds
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Max 20 likes per 60 seconds per user
CREATE TRIGGER rate_limit_likes
  BEFORE INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION check_rate_limit('20', '60', 'user_id');

-- Max 10 follows per 60 seconds per user
CREATE TRIGGER rate_limit_follows
  BEFORE INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION check_rate_limit('10', '60', 'follower_id');
