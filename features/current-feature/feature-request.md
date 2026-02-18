# Codebase Review: Refactoring Recommendations

> **Type:** Opportunistic cleanup (not blocking feature work)
> **Approach:** Phased — each phase is independently shippable
>
> **Deferred to separate efforts:**
> - Naming renames (#7) — git blame churn not worth it right now
> - Service layer migration (#10) — high risk with realtime subscriptions, needs its own design
> - Hook return convention (#13) — premature; not all hooks are data-fetching hooks

## 1. CRITICAL: Duplicated Shape Rendering (3 files)

Identical SVG shape-rendering logic copy-pasted across:
- `src/components/ShapeElement.tsx` (lines 14-38)
- `src/components/SubmissionThumbnail.tsx` (lines 58-74)
- `src/components/submission/SubmissionCanvas.tsx` (lines 41-57)

All three compute the same transform string, call `getShapeSVGData()`, and render the same 4-way element conditional (`ellipse`/`rect`/`polygon`/`path`).

**Fix:** Extract a shared `<SVGShape shape={shape} color={color} />` component that all three import.

---

## 2. CRITICAL: Duplicated ShapeIcon Component (2 files)

Near-identical mini shape preview components:
- `src/components/Toolbar.tsx:14-24` — `ShapePreviewIcon`
- `src/components/modals/WelcomeModal.tsx:10-20` — `ShapeIcon`

Both call `getShapeSVGData()` and render the same 4-way conditional with `fill="currentColor"`.

**Fix:** Create one shared `<ShapeIcon>` component (e.g. `src/components/ShapeIcon.tsx`).

---

## 3. HIGH: Trophy/Rank Colors Hardcoded in 3 Places

Gold/Silver/Bronze hex values (`#FFD700`, `#D1D5DC`, `#CE8946`) duplicated in:
- `src/components/TrophyBadge.tsx:14`
- `src/components/WinnerCard.tsx:24-30`
- `src/components/Calendar/CalendarCell.tsx:21-25`

**Fix:** Create `src/constants/rankColors.ts` exporting a single `RANK_COLORS` map; import everywhere.

---

## 4. HIGH: `useCanvasState.ts` is 1235 Lines

This single hook manages canvas shapes, groups, undo/redo history, localStorage persistence, selection, z-index, and more. It's the largest file in the codebase by far.

**Fix:** Split into focused hooks:
- `useCanvasHistory.ts` — undo/redo stack
- `useCanvasStorage.ts` — localStorage load/save/user-tracking
- `useShapeOperations.ts` — add/remove/update/duplicate/reorder shapes
- `useCanvasState.ts` — orchestrator that composes the above

---

## 5. HIGH: `shapeHelpers.ts` is 717 Lines

~35 shape-generation functions in one flat file.

**Fix:** Create `src/utils/shapes/` directory with files grouped by category (e.g. `polygon.ts`, `bezier.ts`, `abstract.ts`) and a barrel `index.ts`.

---

## 6. HIGH: `App.tsx` is a God Component (506 lines, 6 useState + 15+ custom hooks)

Mixes routing, modal state, canvas state orchestration, sidebar state, auth, submissions, and more. Uses 6 useState hooks and 15+ custom hooks. Any state change risks re-rendering everything.

**Fix:**
- Extract modal state into `useAppModals()` hook
- Extract route/view resolution into `useAppRouting()` hook
- Consider grouping related state (canvas, viewport, sidebar) into compound hooks

---

## 7. ~~MEDIUM: Naming Inconsistencies~~ → DEFERRED

*Moved to separate feature: `deferred-naming-renames`. Git blame churn and merge conflict risk outweigh cosmetic benefit for now.*

---

## 8. MEDIUM: No Shared Modal Wrapper

Multiple modals (`OnboardingModal`, `WelcomeModal`, `FriendsModal`, `KeyboardSettingsModal`, `ResetConfirmModal`, `VotingModal`, etc.) each independently implement:
- `fixed inset-0 bg-black/50 flex items-center justify-center z-50` backdrop
- `bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6` inner box
- Focus trapping, escape-to-close, click-outside-to-close

**Fix:** Create a shared `<Modal>` wrapper with header/body/footer slots. Individual modals become just the content.

---

## 9. MEDIUM: Components Missing DOM Identifiers

Many components lack meaningful `id` or `className` attributes for DevTools/testing. Specifically:
- `SubmissionThumbnail` — no id or class on the SVG
- `FriendRow` — no data-testid
- Calendar cells — no test identifiers
- Modal containers — inconsistent id usage

**Fix:** Add `className="[component-name]"` or `id` to root elements of unique components. Use `data-testid` for key interactive elements.

---

## 10. ~~MEDIUM: Supabase Queries Scattered in Hooks~~ → DEFERRED

*Moved to separate feature: `deferred-service-layer`. Realtime subscriptions, cross-domain queries, and complex dynamic filters make this high-risk. Needs its own design doc.*

---

## 11. LOW: 67 `console.log/error/warn` Statements

Many are debug leftovers. In production, these add noise.

**Fix:** Add ESLint `no-console` rule (warn level, allow `console.error`). Autofix existing violations. One pass, not manual file-by-file audit.

---

## 12. LOW: Duplicated `CANVAS_SIZE = 800` Constant

Defined in both:
- `src/components/SubmissionThumbnail.tsx:19`
- `src/components/submission/SubmissionCanvas.tsx:5`

**Fix:** Export from a single constant file or from the canvas types.

---

## 13. ~~LOW: Inconsistent Hook Return Patterns~~ → DROPPED

*Not all hooks are data-fetching hooks. Forcing a uniform return shape on action hooks, state hooks, and data hooks creates awkward wrappers. Dropped from scope.*

---

## Summary

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | CRITICAL | Shape rendering duplicated in 3 files | Phase 1 |
| 2 | CRITICAL | ShapeIcon duplicated in 2 files | Phase 1 |
| 3 | HIGH | Trophy colors hardcoded in 3 places | Phase 1 |
| 4 | HIGH | useCanvasState.ts — 1235 lines, needs split | Phase 3 |
| 5 | HIGH | shapeHelpers.ts — 717 lines, needs modularization | Phase 3 |
| 6 | HIGH | App.tsx — god component, 6 useState + 15+ hooks | Phase 3 |
| 7 | MEDIUM | Naming inconsistencies | **Deferred** |
| 8 | MEDIUM | No shared Modal wrapper | Phase 2 |
| 9 | MEDIUM | Components missing DOM identifiers | Phase 4 |
| 10 | MEDIUM | Supabase queries scattered, no service layer | **Deferred** |
| 11 | LOW | 67 console statements | Phase 4 |
| 12 | LOW | CANVAS_SIZE constant duplicated | Phase 1 |
| 13 | LOW | Inconsistent hook return patterns | **Dropped** |
