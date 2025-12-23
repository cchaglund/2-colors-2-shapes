-- Admin Role Migration
-- Adds is_admin column to profiles table for dashboard access control

-- =============================================================================
-- 1. ADD IS_ADMIN COLUMN TO PROFILES
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for quick admin lookups
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin) WHERE is_admin = TRUE;

-- =============================================================================
-- 2. NOTE ON ADMIN STATUS SECURITY
-- =============================================================================
-- The is_admin column can only be changed via the service role (edge functions)
-- or directly in the Supabase SQL Editor. Regular users cannot update this field
-- because the set_admin_status function uses SECURITY DEFINER and is only
-- granted to service_role.

-- =============================================================================
-- 3. HELPER FUNCTION: Set admin status (for CLI use)
-- =============================================================================

CREATE OR REPLACE FUNCTION set_admin_status(
  p_user_email TEXT,
  p_is_admin BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_row_count INTEGER;
BEGIN
  -- Look up user by email from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_user_email;
  END IF;

  -- Update the profile
  UPDATE profiles
  SET is_admin = p_is_admin
  WHERE id = v_user_id;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (function checks permissions internally via service role)
GRANT EXECUTE ON FUNCTION set_admin_status TO service_role;
