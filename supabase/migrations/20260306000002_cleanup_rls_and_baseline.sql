-- Cleanup duplicate RLS policies on submissions and redundant profile policy.
-- Also serves as baseline documentation for profiles and submissions tables
-- which were created outside of migrations.

-- =============================================================================
-- 1. DROP DUPLICATE SUBMISSIONS POLICIES
-- =============================================================================

-- Keep "Users can delete their own submissions", drop the duplicate
DROP POLICY IF EXISTS "Users can delete own submissions" ON submissions;

-- Keep "Users can insert their own submissions", drop the duplicate
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;

-- Keep "Users can update their own submissions" (has with_check), drop the incomplete one
DROP POLICY IF EXISTS "Users can update own submissions" ON submissions;

-- =============================================================================
-- 2. DROP REDUNDANT PROFILES POLICY
-- =============================================================================

-- "Anyone can read profiles" (qual=true) already covers all reads;
-- "Users can view own profile" is redundant
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- =============================================================================
-- 3. BASELINE DOCUMENTATION (tables already exist, commented for reference)
-- =============================================================================

-- PROFILES TABLE:
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
--   nickname TEXT NOT NULL UNIQUE
--   avatar_url TEXT
--   created_at TIMESTAMPTZ DEFAULT NOW()
--   onboarding_complete BOOLEAN DEFAULT FALSE
--   is_admin BOOLEAN NOT NULL DEFAULT FALSE
-- RLS: "Anyone can read profiles" (SELECT), "Users can update own profile" (UPDATE)
-- Indexes: profiles_pkey, profiles_nickname_key, profiles_is_admin_idx

-- SUBMISSIONS TABLE:
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid()
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
--   challenge_date TEXT NOT NULL
--   shapes JSONB NOT NULL
--   background_color_index SMALLINT
--   created_at TIMESTAMPTZ DEFAULT NOW()
--   updated_at TIMESTAMPTZ DEFAULT NOW()
--   included_in_ranking BOOLEAN NOT NULL DEFAULT FALSE
--   groups JSONB DEFAULT '[]'::jsonb
--   like_count INTEGER NOT NULL DEFAULT 0
--   UNIQUE(user_id, challenge_date)
-- RLS: "Authenticated users can read submissions" (SELECT),
--       "Users can insert their own submissions" (INSERT),
--       "Users can update their own submissions" (UPDATE),
--       "Users can delete their own submissions" (DELETE)
-- Indexes: submissions_pkey, submissions_date_idx, submissions_user_date_idx,
--          submissions_user_id_challenge_date_key, submissions_likes_sort_idx
