# Feature: Congratulatory Modal for Top 3 Placement

## Problem
When users place 1st-3rd in a daily competition, it's easy to miss among the generic winners modal. We want a dedicated celebratory modal shown *before* the winners modal.

## User Flow
1. User opens app / logs in
2. `useWinnerAnnouncement` hook runs (as today), fetches top 3 for the completed challenge
3. **NEW:** If logged-in user's ID matches any of the top 3 entries → show `CongratulatoryModal` first, with fullscreen confetti
4. User clicks "Yay!" → congrats modal closes, confetti stops, `seen_winner_announcement` persisted to DB → regular `WinnerAnnouncementModal` appears as normal
5. If user is NOT in top 3 → skip straight to winners modal (unchanged)

## Congratulatory Modal Spec

### Content (varies by placement)
| Rank | Heading | Subtext |
|------|---------|---------|
| 1st | "You won!" | "1st place — Congratulations!" |
| 2nd | "2nd Place!" | "Congratulations!" |
| 3rd | "3rd Place!" | "Congratulations!" |

- Show the user's winning submission using the existing `WinnerCard` component (includes trophy badge and rank-specific gold/silver/bronze styling)
- Dismiss button text: **"Yay!"**

### Confetti
- Use `canvas-confetti` library (~6KB gzipped) for fullscreen confetti
- Continuous bursts on ~300ms interval, runs for **6 seconds** then auto-stops
- Also stops immediately when user dismisses modal ("Yay!")
- Call `.reset()` on the confetti instance during cleanup to remove the injected canvas element
- Skip confetti entirely when `prefers-reduced-motion: reduce` is active

### Styling & Accessibility
- Match existing modal patterns: same overlay (`fixed inset-0 bg-(--color-modal-overlay)`), card styling, CSS variable theming, `z-50`
- Focus trap + Escape key dismiss (same as `WinnerAnnouncementModal`)
- `role="dialog"` + `aria-modal="true"`

## Key Code Touchpoints

### `src/hooks/useWinnerAnnouncement.ts`
- After building the `entries` array (line ~124-133), check if `userId` is in the top 3
- Expose new return values:
  - `userPlacement: RankingEntry | null` (the user's entry if they placed, else null)
  - `persistSeen: () => Promise<void>` — persists `seen_winner_announcement` to DB **without** changing `shouldShow` state (used by congrats modal dismiss so the winner modal can still render)

### `src/App.tsx` (lines ~92-98, ~462-471)
- Destructure new `userPlacement` and `persistSeen` from the hook
- Add local state: `congratsDismissed`, `winnerDismissed`
- Render logic:
  ```
  if (shouldShow && !loading) {
    if (userPlacement && !congratsDismissed) → show CongratulatoryModal
    else if (!winnerDismissed) → show WinnerAnnouncementModal
  }
  ```
- Congrats `onDismiss`: call `persistSeen()` + set `congratsDismissed = true`
- Winner `onDismiss`: call `dismiss()` as before

### New file: `src/components/modals/CongratulatoryModal.tsx`
- Props: `userEntry: RankingEntry`, `challengeDate: string`, `onDismiss: () => void`
- Fetches `DailyChallenge` internally via `useDailyChallenge(challengeDate)` (same pattern as `WinnerAnnouncementModal`)
- Shows loading spinner while challenge data loads
- Renders heading/subtext based on `userEntry.rank`
- Renders submission using `WinnerCard`
- Fires confetti on mount, cleans up on unmount/dismiss
- **Same component** used in both the real app and the test view (DRY)

### `src/test/VotingTestPage.tsx` — Add test scenarios
Add new scenarios to the `?test=voting` view, following existing patterns:
- `congrats-1st` — Congratulatory modal for 1st place
- `congrats-2nd` — Congratulatory modal for 2nd place
- `congrats-3rd` — Congratulatory modal for 3rd place

Each scenario renders the **same `CongratulatoryModal` component** with mock data from `mockData.ts`. Use existing `MOCK_TOP_THREE` entries, picking the appropriate rank entry as the `userEntry` prop. Add a show/hide button toggle matching the pattern used for the winner modal scenarios.

### `src/test/mockData.ts`
No new mock data needed — reuse existing `MOCK_TOP_THREE` entries (rank 1, 2, 3 already exist).

## Edge Cases
- **Tie for 1st:** User could be one of multiple 1st-place winners. Still show congrats with "You won!" heading.
- **Already seen:** Congrats dismiss persists `seen_winner_announcement` to DB immediately. On refresh, the hook sees `seen_winner_announcement = true` and sets `shouldShow = false` — neither modal reappears. This means a refresh between congrats and winner dismiss skips the winner modal, which is acceptable.
- **No placement:** If user isn't in top 3, completely unchanged behavior.
- **Single submission:** DB enforces one submission per user per day via `upsert` with `onConflict: 'user_id,challenge_date'`, so a user can only appear once in the top 3.
