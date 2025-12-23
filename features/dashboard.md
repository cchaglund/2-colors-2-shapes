# Feature: dashboard

## Description

We need a dashboard feature that provides the admin with information such as total registered users, registered recently (last 7 days), total submissions, submissions per day (last 7 days), total votes per day (last 7 days). The dashboard should be accessible only to a specific user - me. Not sure if we can just hardcode an email, or if we need to add a role column in the users table (unless supabase already has support for such a thing)? If that user is logged in they can visit /dashboard to see see the dashboard. Visualizations such as charts or graphs should be used to represent submissions and votes over time. In order to access this data I get the sense that we will either need the admin api directly or create a new edge function? When you're done please provide a summary of the implementation changes made in this file, and update the readme.

---

## Implementation Summary

### Approach Chosen
- **Authorization**: Database role column (`is_admin` on profiles table)
- **Charts**: Recharts library for visualizations
- **Data Access**: Edge function with service role for secure admin data aggregation

### Files Created

1. **`supabase/migrations/20251223_add_admin_role.sql`**
   - Adds `is_admin` boolean column to profiles table (default: false)
   - Creates index for efficient admin lookups
   - Adds `set_admin_status(email, is_admin)` function for CLI admin management

2. **`supabase/functions/dashboard-stats/index.ts`**
   - Edge function that aggregates dashboard statistics
   - Requires admin authentication (checks `is_admin` in profiles)
   - Returns: totalUsers, recentUsers (7 days), totalSubmissions, submissionsPerDay, votesPerDay

3. **`src/hooks/useAdmin.ts`**
   - Hook for checking admin status and fetching dashboard stats
   - Exports: `isAdmin`, `loading`, `stats`, `statsLoading`, `statsError`, `fetchStats`

4. **`src/components/Dashboard.tsx`**
   - Full dashboard page with stat cards and charts
   - Shows submissions (bar chart) and votes (line chart) over last 7 days
   - Handles auth states: not logged in, not admin, loading, error

### Files Modified

1. **`src/App.tsx`**
   - Added Dashboard import
   - Added `isDashboardEnabled()` function to check for `?view=dashboard` URL param
   - Added route to render Dashboard component when enabled

2. **`README.md`**
   - Added dashboard feature to Current Features list
   - Added Admin Dashboard section under Developer Tools with access instructions
   - Documented SQL commands for granting admin access

### How to Access

1. **Run the migration** (via Supabase SQL Editor or CLI):
   ```sql
   -- The migration file adds the is_admin column and helper function
   ```

2. **Deploy the edge function**:
   ```bash
   supabase functions deploy dashboard-stats
   ```

3. **Grant yourself admin access**:
   ```sql
   SELECT set_admin_status('your-email@example.com', true);
   ```
   Or directly:
   ```sql
   UPDATE profiles SET is_admin = true WHERE id = (
     SELECT id FROM auth.users WHERE email = 'your-email@example.com'
   );
   ```

4. **Access the dashboard**:
   ```
   https://2-colors-2-shapes.netlify.app/?view=dashboard
   ```

### Dashboard Metrics

- **Total Users**: Count of all registered profiles
- **Recent Users**: Users who signed up in the last 7 days  
- **Total Submissions**: Count of all submissions
- **Submissions per Day**: Bar chart showing daily submissions (last 7 days)
- **Votes per Day**: Line chart showing daily vote activity (last 7 days)
