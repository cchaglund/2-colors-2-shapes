# Supabase Info - REMOTE ONLY
 
 This project uses the REMOTE Supabase database, NOT local.

- NEVER run `supabase start` - it downloads 690MB of Docker images unnecessarily
- NEVER use `--local` flag with supabase commands
- To understand schema: read `supabase/migrations/*.sql` files
- To run migrations: use `supabase db push` (pushes to remote)
- Edge functions: `supabase functions deploy` (deploys to remote)