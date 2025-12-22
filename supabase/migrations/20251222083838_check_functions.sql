-- Check what function signatures exist
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Checking existing function signatures...';

  FOR r IN
    SELECT p.proname, pg_get_function_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('initialize_daily_rankings', 'get_next_pair', 'get_submission_count_for_date', 'compute_final_ranks')
  LOOP
    RAISE NOTICE 'Function: %(%), ', r.proname, r.args;
  END LOOP;
END $$;
