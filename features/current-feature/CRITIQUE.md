# PRD Critique: Codebase Refactoring

**Reviewer:** Senior Engineer (hostile)
**Verdict:** REJECT. Rewrite from scratch with an actual strategy.

---

## 1. This isn't a PRD, it's a todo list with delusions of grandeur

58 items. Fifty-eight. You want to touch every file in the codebase, rewrite the entire data layer, decompose the core state management hook, rename files, extract components, standardize return types, AND clean up console.logs — all in one "feature"? This isn't a refactor, this is a full rewrite cosplaying as incremental improvement.

No sane team ships this as one deliverable. Where's the phasing? Where are the milestones? Where's the "if we only get halfway, is the codebase better or worse?" analysis?

---

## 2. Zero business justification

Not one item explains what user-facing problem this solves. "useCanvasState is 1235 lines" — so? Is it causing bugs? Is it blocking features? Is it slow? "Supabase queries scattered in 31 files" — and they work. Users don't care about your import aesthetics.

Every refactoring PRD needs to answer: **"What can we build after this that we can't build now?"** This one doesn't even try.

---

## 3. The service layer migration (REFACTOR-043 through 047) is a guaranteed disaster

You want to move every Supabase call from 31+ hooks and components into a centralized `src/services/` layer. The verification for this is literally "All data fetching still works correctly." That's not a verification step — that's a hope.

Specific problems:
- Hooks currently construct queries with dynamic filters, RPC calls, realtime subscriptions, and pagination. A "service function" for each of these becomes either (a) a thin wrapper that adds nothing, or (b) a leaky abstraction that can't handle edge cases.
- Realtime subscriptions (`supabase.channel()`) have lifecycle tied to components. Moving them to a service layer breaks that coupling and you'll need to reinvent cleanup logic.
- You've listed 5 PRD items (043-047) but zero thought on how to handle queries that span domains (e.g., "fetch submission with author profile and ranking position"). Do services call other services? Do hooks combine multiple service calls? Neither option is clean.

---

## 4. Splitting useCanvasState is high-risk surgery with no design

"Extract useCanvasHistory, useCanvasStorage, useShapeOperations" — easy to say, terrifying to execute. This hook has 1235 lines because everything in it is interconnected:

- Shape operations need to push history entries
- History undo/redo needs to restore shapes AND selection state
- Storage needs to serialize the result of shape operations AND history position
- Group operations need to update shapes, selection, AND history atomically

The PRD says "thin orchestrator composing the three hooks." How? Through shared refs? Through callbacks? Through a shared state store? This is the entire architectural decision and it's hand-waved into nothing. "Target: under 300 lines" is a line count, not a design.

What happens when undo restores a state but the storage hook has already saved the new state? What happens when duplicating a grouped shape needs to atomically update shapes, groups, selection, and push one history entry? These are the hard problems. The PRD ignores all of them.

---

## 5. The Modal wrapper will become a god component within weeks

"Create shared `<Modal>` with backdrop, focus trap, escape-to-close, click-outside-to-close."

Sounds great. Now consider:
- **OnboardingModal**: multi-step wizard with forward/back navigation. Does Modal handle step state?
- **VotingModal**: custom width, swipe gestures, no click-outside-to-close during animation
- **ResetConfirmModal**: must NOT close on click-outside (destructive confirmation)
- **WinnerAnnouncementModal**: confetti animation needs to escape the modal bounds

You'll end up with `<Modal disableClickOutside disableEscape fullWidth noFocusTrap customBackdrop={...}>`. Congratulations, you've replaced 8 simple modals with 8 slightly less simple modals + one complex abstraction nobody wants to maintain.

Also: you've listed NINE separate PRD items (029-038) for migrating individual modals. That's 9 items of "change import, test manually." This is padding.

---

## 6. Naming renames are pure git blame destruction

REFACTOR-025 through 028: rename `ContentCalendarDayCell` to `SubmissionCalendarDayCell`, `ContentNavigation` to `CalendarMonthNav`, standardize prop names.

What you get: slightly more "correct" names.

What you lose:
- git blame on every renamed file — gone
- Every in-flight branch touching these files — merge conflict
- Every team member's mental model — invalidated

Prop name standardization (`isDayToday` -> `isToday`) is even worse. It's a cosmetic change with nonzero regression risk. `isDayToday` is perfectly readable.

---

## 7. data-testid without tests is cargo culting

REFACTOR-039 through 042 add `data-testid` to components. Great. Where are the tests that use them? There are zero test items in this PRD. You're adding DOM noise for a testing infrastructure that doesn't exist. Add the test IDs when you write the tests, not before.

---

## 8. Console.log cleanup is an ESLint rule, not three PRD items

REFACTOR-048 through 050 dedicate three items to removing `console.log` statements. Add `no-console` to your ESLint config. Autofix. Done. This doesn't need to be in a PRD, and it definitely doesn't need three separate work items with separate verification steps.

---

## 9. The hook return convention (REFACTOR-052 through 056) is premature standardization

"All data-fetching hooks return `{ data, loading, error, ...actions }`"

- `useKeyboardSettings` manages local preferences. It doesn't have a loading state.
- `useCanvasState` returns dozens of methods and state values. Cramming them into `{ data, loading, error }` makes no sense.
- `useSaveSubmission` is an action hook, not a query hook. Its "data" IS the action.

Forcing every hook into one shape will create awkward `data.data` nesting, meaningless `loading: false` states on hooks that never load, and `error: null` on hooks that can't fail. You're trading real diversity for fake consistency.

---

## 10. shapeHelpers.ts split doesn't reduce complexity

"Create `src/utils/shapes/` with `polygon.ts`, `paths.ts`, etc."

You're taking 35 functions in one file and splitting them into 4+ files with a barrel re-export. The total code is identical. The call sites are identical (they'll import from `shapes/index.ts` instead of `shapeHelpers.ts`). You've added import indirection with zero benefit.

If the argument is "717 lines is too long" — it's a file of pure functions with no shared state. Long pure-function files are the LEAST problematic kind of long file. This is cosmetic.

---

## 11. No rollback plan, no incremental value

What happens when you're on REFACTOR-015 (useCanvasState orchestrator) and discover the decomposition creates subtle race conditions? You've already modified 3 new hooks and the orchestrator. Do you revert all 4 files? Do you ship the broken decomposition?

The PRD has no checkpoints where you can stop and still have improved the codebase. If you complete items 1-11 (component extractions and constants) but abandon items 12-58, you're in good shape. But the PRD doesn't acknowledge this — it presents all 58 items as one atomic unit.

---

## 12. Verification steps are "it still works" repeated 58 times

Nearly every item's verification is "X renders correctly" or "X still works." That's not verification — that's the absence of catastrophe. Where are:
- Render count assertions before/after (the stated motivation for splitting App.tsx is re-renders)
- Bundle size comparison
- Performance benchmarks for the canvas editor
- Grep confirmation that old patterns are truly gone (e.g., "no file imports supabase directly")

---

## What I'd actually approve

1. **Phase 1 (low risk, high value):** Items 1-11 only. Extract `<SVGShape>`, `<ShapeIcon>`, `RANK_COLORS`, `CANVAS_SIZE`. These are isolated, mechanical, and genuinely DRY improvements. Ship, verify, move on.

2. **Phase 2 (medium risk):** The `<Modal>` wrapper — but design it FIRST. Audit all 9 modals, document their actual requirements, and design a wrapper that handles 80% of cases without a prop explosion. Accept that 1-2 modals may not fit.

3. **Phase 3 (high risk, needs design doc):** useCanvasState decomposition. Write an actual architecture document explaining state flow between sub-hooks. Prototype. Test. Then write the PRD items.

4. **Defer indefinitely:** Service layer, hook conventions, naming renames. These are "nice to have" that carry real risk and solve no user problem.

5. **Automate, don't PRD:** Console.log cleanup, data-testid additions. ESLint rules and a grep script.

---

## Unresolved questions

- Is this refactor blocking any actual feature work? What's the urgency?
- Has anyone profiled the re-render problem in App.tsx, or is "6 useState + 15 hooks" just vibes?
- Are there any in-flight branches that would conflict with the naming renames?
- Does the team have any integration tests, or is "manually verify" the actual test strategy?
