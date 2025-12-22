-- Verify all challenge_date columns are TEXT and force schema reload
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE column_name = 'challenge_date'
    ORDER BY table_name
  LOOP
    RAISE NOTICE '% .% = %', r.table_name, r.column_name, r.data_type;
  END LOOP;
END $$;

-- Force PostgREST to reload
NOTIFY pgrst, 'reload schema';
