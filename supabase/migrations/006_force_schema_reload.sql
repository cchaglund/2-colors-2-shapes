-- Force PostgREST schema cache reload by notifying
NOTIFY pgrst, 'reload schema';

-- Also add a dummy column and remove it to force schema changes
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS _schema_refresh_temp TEXT;
ALTER TABLE submissions DROP COLUMN IF EXISTS _schema_refresh_temp;
