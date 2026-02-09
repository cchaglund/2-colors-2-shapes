# PRD Critique: Congratulatory Modal for Top 3 Placement

## Verdict: Sloppy spec that will ship bugs on day one.

---

## 1. The `seen_winner_announcement` Flag Does NOT "Cover Both Modals"

The PRD confidently states: *"The existing `seen_winner_announcement` flag covers both modals — once dismissed through the full flow, neither reappears on refresh."*

Wrong. Here's the actual flow:

1. Congrats modal shows. User clicks "Yay!" → local React state `congratsDismissed = true`
2. Winner modal appears. User **refreshes the page before dismissing it.**
3. `seen_winner_announcement` was never set to `true` in the DB (that only happens in `dismiss()`)
4. Hook runs again. `shouldShow` is true. `userPlacement` is non-null.
5. **Congrats modal shows again.**

The "dismiss congrats" step is pure client state. It doesn't persist. Any interrupt between congrats dismiss and winner dismiss (refresh, tab close, navigation, app crash) means the user sees the congrats modal *again*. The PRD hand-waves this as handled when it absolutely isn't.

**Fix:** Either persist congrats dismissal separately, or set `seen_winner_announcement` when the *congrats* modal is dismissed (not the winner modal), accepting that some users skip the winner modal on refresh.

---

## 2. Wrong Type Name

The PRD specifies: `challenge: Challenge`

The type is `DailyChallenge`. There is no `Challenge` type in this codebase. This will fail at compile time. Did anyone actually read the types file before writing this spec?

---

## 3. "Use `SubmissionThumbnail` + `WinnerCard` or similar" — Pick One

These are two different components with different purposes:
- `SubmissionThumbnail`: Raw SVG render of shapes on background. Props include `shapes`, `challenge`, `backgroundColorIndex`, `size`.
- `WinnerCard`: Wraps `SubmissionThumbnail` with trophy badge, rank-specific gold/silver/bronze border, and nickname display. Props: `entry: RankingEntry`, `challenge: DailyChallenge`, `onView`, `size`.

"Or similar" is not a spec. If we use `WinnerCard`, the congrats modal gets a trophy badge, colored border, and nickname — possibly redundant with the heading text. If we use raw `SubmissionThumbnail`, we lose the visual flair. These produce meaningfully different UIs and the PRD doesn't decide.

---

## 4. Confetti Implementation Is Underspecified

> "Starts on modal mount, runs for 6 seconds then auto-stops"

`canvas-confetti` fires a single burst that naturally dissipates in ~2-3 seconds. To "run for 6 seconds" you need repeated bursts on an interval. The PRD doesn't specify:
- Single burst or continuous?
- What interval between bursts?
- What confetti configuration (particle count, spread, colors, gravity)?
- Should confetti colors match the challenge's 2 assigned colors? (Would be on-brand, but not mentioned)

Also: `canvas-confetti` injects a `<canvas>` element into the DOM. Cleanup requires calling `.reset()` to remove it. The PRD says "no confetti artifacts remain" but gives zero guidance on *how*. A naive `clearTimeout` won't remove the canvas element — you get a ghost canvas eating memory.

---

## 5. No Lazy Loading for a 6KB Library Used by <1% of Users

The PRD casually drops "~6KB gzipped" like that's free. Only top-3 users see this modal. That's 3 people per day out of however many users. Every single user downloads 6KB of confetti code they'll never execute.

`canvas-confetti` should be dynamically imported (`import('canvas-confetti')`) so it's only loaded when actually needed. The PRD doesn't mention code splitting at all.

---

## 6. Challenge Data: Who Fetches It?

The `WinnerAnnouncementModal` fetches its own challenge data internally via `useDailyChallenge(challengeDate)` and shows a loading spinner while it loads.

The PRD's `CongratulatoryModal` props include `challenge: DailyChallenge` — meaning the *parent* must provide it. But `App.tsx` doesn't have the challenge object. The hook returns `challengeDate` (a string), not a `DailyChallenge` object.

So either:
- App.tsx needs to call `useDailyChallenge(winnerChallengeDate)` itself and pass it down (new hook call, new loading state to manage)
- CongratulatoryModal fetches internally like WinnerAnnouncementModal does (but then the prop signature is wrong)

The PRD's prop interface doesn't match the available data flow.

---

## 7. Multiple Submissions Per User

Can a user have multiple submissions in a day? If so, can they appear in top 3 more than once (e.g., rank 1 and rank 3)? The `userPlacement` return is `RankingEntry | null` — singular. What if there are two matches? Do we show congrats for the highest rank? The PRD doesn't address this because it assumes one user = one entry in the rankings.

If this truly can't happen, fine — but say so explicitly and explain *why*.

---

## 8. Z-Index: Fine Today, Fragile Tomorrow

Every modal in this codebase is `z-50`. The congrats modal will also be `z-50`. This works because modals are conditionally rendered — only one shows at a time. But the PRD is *adding* a modal that intentionally appears in **sequence** with another `z-50` modal. If both accidentally render simultaneously due to a state bug, they'll visually overlap at the same z-layer with undefined stacking. The PRD relies on React render order to determine visual stacking, which is brittle.

---

## 9. No Mobile/Performance Consideration for Confetti

Fullscreen `<canvas>` confetti on a low-end Android phone running a React 19 app with an SVG canvas editor already loaded. No mention of:
- Particle count limits for mobile
- `requestAnimationFrame` performance impact
- Whether to skip confetti entirely on `prefers-reduced-motion`
- Canvas resolution on high-DPI screens (Retina = 4x pixels to fill)

The `prefers-reduced-motion` omission is both an accessibility gap and a potential a11y compliance issue.

---

## 10. Test Scenarios Are Incomplete

The PRD adds 3 test scenarios: `congrats-1st`, `congrats-2nd`, `congrats-3rd`. But the interesting cases aren't rank variants — they're:
- Congrats → Winner modal transition flow (does the sequencing work?)
- Congrats for a tied 1st place
- Confetti cleanup when rapidly toggling show/hide
- Modal with challenge still loading

Testing 1st/2nd/3rd in isolation proves the heading text changes. Congratulations, you've tested a ternary. The actual bugs will be in the *transitions* and *edge cases*, none of which have test scenarios.

---

## Summary

| Issue | Severity |
|-------|----------|
| `seen_winner_announcement` doesn't cover congrats dismiss | **Bug** |
| Wrong type name (`Challenge` vs `DailyChallenge`) | **Compile error** |
| Ambiguous component choice (Thumbnail vs WinnerCard) | **Underspecified** |
| Confetti implementation details missing | **Underspecified** |
| No lazy loading for confetti library | **Performance** |
| Challenge data fetching mismatch | **Architectural gap** |
| Multiple submissions per user unaddressed | **Edge case** |
| Z-index stacking relies on render order | **Fragile** |
| No `prefers-reduced-motion` support | **Accessibility** |
| Test scenarios miss the interesting cases | **Insufficient** |
