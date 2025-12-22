-- Check ALL challenge_date columns in ALL tables
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Checking all challenge_date columns in the database...';

  FOR r IN
    SELECT table_name, column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE column_name = 'challenge_date'
    ORDER BY table_name
  LOOP
    RAISE NOTICE 'Table: %, Column: %, Type: % (%)', r.table_name, r.column_name, r.data_type, r.udt_name;
  END LOOP;
END $$;
