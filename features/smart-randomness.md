# Feature: smart-randomness

## Description

We have random colors and shapes selected for the daily challenge, but sometimes the randomness can produce the same combination multiple days in a row. To improve variety, implement "smart randomness" that avoids repeating the same color and shape combinations on consecutive days. This would entail that when generating the random selection for the day, we check the previous 3 days' selection and re-roll if it's the same.

## Implementation Summary

### Phase 1: Client-Side Smart Randomness (Initial Implementation)

Added smart randomness logic to `src/utils/dailyChallenge.ts` that checks previous 3 days' challenges.

### Phase 2: Server-Side Challenge Generation (Refactored)

Moved challenge generation from client-side to server-side for consistency across all devices.

#### Database Migration
**File:** `supabase/migrations/003_challenges.sql`
- Created `challenges` table with columns: `id`, `challenge_date` (unique), `color_1`, `color_2`, `shape_1`, `shape_2`, `created_at`
- Public read access, service role write via RLS policies

#### Edge Function
**File:** `supabase/functions/get-daily-challenge/index.ts`
- Accepts single `date` or batch `dates` array
- Returns existing challenge from DB if exists
- Otherwise generates with smart randomness (checking previous 3 days), saves to DB, returns
- Uses upsert to handle race conditions
- No authentication required (public data)

#### Client Hook
**File:** `src/hooks/useDailyChallenge.ts`
- `useDailyChallenge(date)` - React hook for fetching a single challenge
- `fetchChallengesBatch(dates)` - Batch fetch for Calendar (multiple dates)
- `getChallengeSync(date)` - Sync getter using cache or local fallback
- In-memory cache to avoid repeated API calls
- Fallback to local generation if API unavailable

#### Component Updates
| Component | Change |
|-----------|--------|
| `App.tsx` | Uses `useDailyChallenge(todayDate)` with loading spinner |
| `Calendar.tsx` | Uses `fetchChallengesBatch()` for all month dates |
| `VotingModal.tsx` | Uses `useDailyChallenge(challengeDate)` |
| `SubmissionDetailPage.tsx` | Uses `useDailyChallenge(challengeDate)` |
| `WinnerAnnouncementModal.tsx` | Uses `useDailyChallenge(challengeDate)` with loading state |

### Technical Details

- **Smart Randomness Algorithm:**
  - Shapes: Exact match (order-independent)
  - Colors: Perceptual distance < 40 in HSL space (order-independent)
  - Both shapes AND colors must be similar for a challenge to be rejected
  - Up to 50 re-roll attempts with prime multiplier seed modification

- **Caching Strategy:**
  - Server: Challenges stored permanently in PostgreSQL
  - Client: In-memory cache during session
  - Fallback: Local generation if API unavailable

- **Backwards Compatibility:**
  - Date utilities retained: `getTodayDate()`, `getYesterdayDate()`, `getTwoDaysAgoDate()`
  - `generateDailyChallenge()` kept for fallback

## Status

✅ **Implemented** - 2025-12-24
