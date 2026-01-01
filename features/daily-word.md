# Daily Word Feature

## Summary

Each daily challenge now includes an optional "daily word" for creative inspiration. The word is selected deterministically based on the day of the year from a curated list of ~370 evocative words.

## Implementation Details

### Word Selection Logic
- Words are stored in `/words/words-1.json` with a pre-shuffled `order` array (365 indices)
- Word for any date is computed as: `words[order[(dayOfYear - 1) % 365]]`
- Same date always produces the same word (deterministic)

### Database
- Added `word TEXT NOT NULL` column to the `challenges` table
- Migration: `supabase/migrations/008_add_daily_word.sql`

### Backend (Edge Function)
- Updated `supabase/functions/get-daily-challenge/index.ts` to:
  - Embed word data directly (order array + words list)
  - Include `getWordForDate()` function
  - Store word in database when generating challenges
  - Return word in challenge response

### Frontend
- Updated `DailyChallenge` type to include `word: string`
- Updated `useDailyChallenge` hook (cache version bumped to 3)
- Updated `generateDailyChallenge` utility for local fallback

### UI Display Locations
- **Toolbar**: Shows word under "Inspiration" label in Today's Challenge card
- **ChallengeDetailsCard**: Displays word in submission detail view
- **WinnersDayPage**: Shows word in challenge details sidebar
- **CalendarDayCell**: Word shown in tooltip on hover
- **VotingPairView**: Shows word context + voting guidance text

### Onboarding
- **WelcomeModal**: Updated to explain daily word is optional inspiration

### Tests
- Added `src/utils/__tests__/dailyWord.test.ts` with tests for:
  - Deterministic word selection
  - Day boundary handling
  - Year wrap-around behavior
  - Edge cases

### Documentation
- Updated README.md with daily word feature description