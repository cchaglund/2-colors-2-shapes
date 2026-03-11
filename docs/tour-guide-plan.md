# Tour Guide & Onboarding — Feature Plan

## Problem

The existing welcome modal (WelcomeModal.tsx) is easily dismissed — a tester immediately clicked "close" without reading it, then had no idea what the app was about. He thought he should have more colors. Once the daily constraint concept was explained verbally ("3 new colors and 2 shapes every day"), he was excited and wanted to try again. The concept is strong, but the onboarding fails to communicate it.

Additionally, key features like the left toolbar, layers panel, gallery, and keyboard shortcuts go undiscovered by new users.

## Solution

Replace the welcome modal with a **spotlight tour** that walks users through the app step-by-step, plus a set of **contextual discovery hints** that surface features at the moment of relevance.

---

## Part 1: Header Redesign — "Today's Challenge"

### What changes

Replace the current `InspirationCenter` component (just shows the inspiration word) with a new `ChallengeDisplay` component in the TopBar center slot. This makes the daily constraint permanently visible.

### Current (InspirationCenter)

```tsx
// CanvasEditorPage.tsx line 35-42
function InspirationCenter({ word }: { word: string }) {
  return (
    <div className="flex flex-col items-center leading-tight min-w-0">
      <span className="hidden md:block text-xs uppercase tracking-widest text-(--color-accent)">
        Today's Inspiration
      </span>
      <span className="text-sm md:text-xl font-semibold text-(--color-text-primary) capitalize font-display truncate max-w-full">
        {word}
      </span>
    </div>
  );
}
```

### New (ChallengeDisplay)

Reuse the color circle + shape icon pattern from WelcomeModal (lines 23-35):

```tsx
function ChallengeDisplay({ challenge }: { challenge: DailyChallenge }) {
  return (
    <div className="flex items-center gap-3">
      {/* Color circles — same style as WelcomeModal */}
      {challenge.colors.map((color, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded-(--radius-pill) border border-(--color-border)"
          style={{ backgroundColor: color }}
        />
      ))}

      {/* Divider — same pattern as WelcomeModal */}
      <div className="w-px h-4 bg-(--color-border) mx-0.5" />

      {/* Shape icons — same as WelcomeModal using ShapeIcon */}
      {challenge.shapes.map((shape, i) => (
        <ShapeIcon
          key={i}
          type={shape.type}
          size={20}
          fill="var(--color-text-tertiary)"
          stroke="var(--color-border)"
          strokeWidth={1.5}
        />
      ))}

      {/* Divider */}
      <div className="w-px h-4 bg-(--color-border) mx-0.5" />

      {/* Inspiration word */}
      <span className="text-sm font-semibold text-(--color-text-primary) capitalize font-display truncate">
        "{challenge.word}"
      </span>
    </div>
  );
}
```

### Where it goes

In CanvasEditorPage.tsx, replace:
```tsx
centerContent={<InspirationCenter word={challenge.word} />}
```
with:
```tsx
centerContent={<ChallengeDisplay challenge={challenge} />}
```

The TopBar already handles `centerContent` as absolutely positioned center content, hidden on mobile. No TopBar changes needed.

---

## Part 2: Spotlight Tour

### Overview

A 5-step guided tour using a full-screen overlay with cutouts that highlight specific UI regions. Each step shows a tooltip bubble with explanatory text.

### Tour steps

| # | Target | Tooltip text | Interaction |
|---|--------|-------------|-------------|
| 1 | Header center (ChallengeDisplay) | "Each day brings new constraints — 3 colors, 2 shapes, and an inspiration word. Today's are shown here." | Click "Next" |
| 2 | Bottom toolbar ADD section | "Add a shape to the canvas" | Must click a shape button (interactive gate) |
| 3 | The newly added shape on canvas | "Drag a corner to resize, use the circle to rotate, drag to move. More tools like duplicate are in the left toolbar." | Click "Got it" |
| 4 | Bottom toolbar CHANGE + BACKGROUND sections (one cutout) | "Change a selected shape's color, or set the background color" | Click "Next" |
| 5 | Submit button in header | "When you're happy with your art, submit it!" | Click "Finish" |

### Trigger logic

- **First visit:** `localStorage.getItem('tour-completed') !== 'true'`
- **Skip on mobile:** `window.innerWidth < 768` → don't show tour
- **On completion or skip:** `localStorage.setItem('tour-completed', 'true')`
- **Replays:** Always run the full tour (same steps, including "add a shape"). Even if shapes exist on canvas, adding one more is harmless.

### Replaces

- `WelcomeModal` — remove entirely
- `useWelcomeModal` hook — remove entirely
- The `welcome-modal-seen` localStorage key becomes unused

### Architecture

#### New files

```
src/components/tour/
  TourOverlay.tsx        — Full-screen overlay with cutout + tooltip
  TourProvider.tsx        — Context + state machine for tour steps
  useTour.ts             — Hook: trigger logic, step progression, localStorage
  tourSteps.ts           — Step definitions (target selectors, text, interaction type)
```

#### TourOverlay component

The overlay uses the existing `--color-modal-overlay` CSS variable (same purple overlay as modals). The cutout is achieved via CSS clip-path or SVG mask to "punch out" the highlighted region.

```tsx
// TourOverlay.tsx — conceptual structure
interface TourOverlayProps {
  targetRect: DOMRect | null;  // Bounding box of highlighted element
  tooltipText: string;
  buttonLabel: string;
  onNext: () => void;
  onSkip: () => void;
  tooltipPosition: 'above' | 'below';  // Adaptive positioning
}

export function TourOverlay({ targetRect, tooltipText, buttonLabel, onNext, onSkip, tooltipPosition }: TourOverlayProps) {
  // Full-screen overlay with cutout
  // Tooltip bubble positioned relative to cutout
  // Button pair: primary "Next" + link "Skip tour"
}
```

**Overlay implementation — SVG mask approach:**

```tsx
<div className="fixed inset-0 z-[100]">
  {/* SVG overlay with cutout */}
  <svg className="absolute inset-0 w-full h-full">
    <defs>
      <mask id="tour-mask">
        <rect width="100%" height="100%" fill="white" />
        {/* Cutout — black area becomes transparent */}
        <rect
          x={targetRect.x - padding}
          y={targetRect.y - padding}
          width={targetRect.width + padding * 2}
          height={targetRect.height + padding * 2}
          rx={borderRadius}
          fill="black"
        />
      </mask>
    </defs>
    <rect
      width="100%"
      height="100%"
      fill="var(--color-modal-overlay)"
      mask="url(#tour-mask)"
    />
  </svg>

  {/* Tooltip bubble — positioned adaptively */}
  <div style={{ position: 'absolute', ...tooltipPositionStyles }}>
    <TourTooltip ... />
  </div>
</div>
```

**Cutout border:** Add a visible border around the cutout to make it feel intentional:
```tsx
{/* Border ring around cutout */}
<rect
  x={targetRect.x - padding}
  y={targetRect.y - padding}
  width={targetRect.width + padding * 2}
  height={targetRect.height + padding * 2}
  rx={borderRadius}
  fill="none"
  stroke="var(--color-accent)"
  strokeWidth="2"
/>
```

#### Tooltip bubble styling

The tour tooltips use the **existing tooltip style** (dark bg, inverted colors) from InfoTooltip.tsx:

```tsx
// Dark purple bubble — matches existing tooltip component
<div
  className="px-4 py-3 text-sm max-w-xs"
  style={{
    background: 'var(--color-text-primary)',
    color: 'var(--color-bg-primary)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
  }}
>
  <p className="mb-3">{tooltipText}</p>

  {/* Button pair — stacked, matching ResetConfirmModal pattern */}
  <div className="flex flex-col items-center gap-2">
    <Button variant="primary" size="sm" fullWidth onClick={onNext}>
      {buttonLabel}
    </Button>
    <Button variant="link" size="sm" onClick={onSkip}>
      Skip tour
    </Button>
  </div>
</div>
```

The button layout follows the same pattern as `ResetConfirmModal.tsx` (lines 30-37): stacked `flex-col` with primary full-width on top, link variant below.

**Adaptive positioning:** The tooltip appears below the cutout by default. If the cutout is in the bottom half of the screen (e.g., bottom toolbar), the tooltip appears above the cutout instead.

```tsx
const tooltipPosition = targetRect.y + targetRect.height / 2 > window.innerHeight / 2
  ? 'above'
  : 'below';
```

#### Step state machine (useTour hook)

```tsx
// useTour.ts
type TourStep = 'challenge' | 'add-shape' | 'manipulate' | 'colors' | 'submit';
type TourState = { active: boolean; step: TourStep; };

const STEP_ORDER: TourStep[] = ['challenge', 'add-shape', 'manipulate', 'colors', 'submit'];

export function useTour() {
  const [state, setState] = useState<TourState>(() => ({
    active: shouldShowTour(),
    step: 'challenge',
  }));

  const next = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.step);
    if (currentIndex === STEP_ORDER.length - 1) {
      // Tour complete
      completeTour();
      setState({ active: false, step: 'challenge' });
    } else {
      setState(prev => ({ ...prev, step: STEP_ORDER[currentIndex + 1] }));
    }
  }, [state.step]);

  const skip = useCallback(() => {
    completeTour();
    setState({ active: false, step: 'challenge' });
  }, []);

  const replay = useCallback(() => {
    setState({ active: true, step: 'challenge' });
  }, []);

  return { ...state, next, skip, replay };
}

function shouldShowTour(): boolean {
  if (window.innerWidth < 768) return false;
  try {
    return localStorage.getItem('tour-completed') !== 'true';
  } catch {
    return false;
  }
}

function completeTour(): void {
  try {
    localStorage.setItem('tour-completed', 'true');
  } catch {}
}
```

#### Target element references

Each step needs to know the bounding rect of the element to highlight. Use `data-tour` attributes on target elements:

```tsx
// In ChallengeDisplay:
<div data-tour="challenge" className="flex items-center gap-3">

// In BottomToolbar, around the ADD section:
<div data-tour="add-shapes" className="flex items-center gap-1">

// In BottomToolbar, around CHANGE + BACKGROUND:
<div data-tour="colors" className="flex items-center ...">

// In TopBar, around the submit button:
<div data-tour="submit" className="flex items-center gap-1.5 md:gap-2 shrink-0">
```

The TourOverlay queries `document.querySelector('[data-tour="..."]')` and uses `getBoundingClientRect()` to position the cutout. Recalculate on window resize.

#### Step 2 — interactive gate ("add a shape")

When the tour is on the `add-shape` step:
1. The cutout highlights the ADD section of BottomToolbar
2. The tooltip says "Add a shape to the canvas"
3. The tour listens for a shape being added (e.g., via a callback or by watching `canvasState.shapes.length`)
4. When a shape is added, the tour auto-advances to step 3 ("manipulate")

This requires the tour to communicate with CanvasEditorPage. The `TourProvider` context can expose an `onShapeAdded` callback that the `addShape` function calls.

### Integration in CanvasEditorPage

```tsx
// Replace WelcomeModal with TourOverlay
// Before:
{showWelcome && <WelcomeModal onDismiss={dismissWelcome} challenge={challenge} />}

// After:
<TourProvider challenge={challenge} onShapeAdded={/* from addShape */}>
  <TourOverlay />
</TourProvider>
```

The tour overlay renders at z-[100] (above everything else including z-50 modals). During the tour, pointer events on non-highlighted areas are blocked by the overlay.

---

## Part 3: Replay Button

### Location

Inside the `KeyboardShortcutsPopover` footer, alongside the existing "Customize shortcuts" button.

### Implementation

Add a second footer button in KeyboardShortcutsPopover.tsx:

```tsx
// KeyboardShortcutsPopover.tsx — updated footer (lines 91-109)
<div className="px-4 pb-3.5 pt-2.5 border-t border-(--color-border-light) flex flex-col gap-2">
  <button
    onClick={() => { setOpen(false); onOpenSettings(); }}
    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold cursor-pointer transition-colors text-(--color-text-tertiary) hover:bg-(--color-hover) hover:text-(--color-text-primary)"
    style={{
      border: 'var(--border-width, 2px) solid var(--color-border-light)',
      borderRadius: 'var(--radius-sm)',
    }}
  >
    <svg>...</svg>
    Customize shortcuts
  </button>

  <button
    onClick={() => { setOpen(false); onReplayTour(); }}
    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold cursor-pointer transition-colors text-(--color-text-tertiary) hover:bg-(--color-hover) hover:text-(--color-text-primary)"
    style={{
      border: 'var(--border-width, 2px) solid var(--color-border-light)',
      borderRadius: 'var(--radius-sm)',
    }}
  >
    <!-- play/replay icon -->
    Replay tour
  </button>
</div>
```

New prop: `onReplayTour: () => void` — passed down from CanvasEditorPage, calls `tour.replay()`.

---

## Part 4: Contextual Discovery Hints

### Overview

Lightweight, one-time tooltips that appear at moments of relevance. Visually lighter than tour tooltips (not the inverted dark style) to avoid confusion with the tour.

### Hint styling

Use a **light card style** — distinct from the dark tour tooltips:

```tsx
<div
  className="px-3 py-2.5 text-xs max-w-[240px]"
  style={{
    background: 'var(--color-card-bg)',
    color: 'var(--color-text-primary)',
    border: 'var(--border-width, 2px) solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
  }}
>
  <p className="mb-2 font-medium">{text}</p>
  <button
    className="text-xs font-semibold text-(--color-accent) hover:underline cursor-pointer"
    onClick={dismiss}
  >
    Got it
  </button>
</div>
```

### Hint definitions

| Hint ID | Target | Text | Trigger | localStorage key |
|---------|--------|------|---------|-----------------|
| `left-toolbar` | Left toolbar panel (or its collapsed toggle) | "Duplicate, mirror, and reorder shapes here" | First time user selects 2+ shapes | `hint-seen-left-toolbar` |
| `gallery` | Gallery button in header | "Explore past submissions and see what others created!" | A few seconds into the user's second visit | `hint-seen-gallery` |
| `keyboard-shortcuts` | `?` button (KeyboardShortcutsPopover trigger) | "Customize your keyboard shortcuts here" | First time user clicks a left toolbar button | `hint-seen-keyboard` |
| `layers-panel` | Layers panel toggle button | "Manage shape layers and ordering here" | First time user has 3+ shapes on canvas | `hint-seen-layers` |

### Hint rules

- Each hint shows **once**, tracked in localStorage
- **Auto-dismiss** after 8 seconds if not interacted with
- Dismissable by clicking "Got it"
- **Never show more than one hint at a time** — queue them, show the next one after the current is dismissed
- **Never show during the tour** — check `tour.active` before triggering
- Small delay (300-500ms) after trigger condition is met before appearing

### Architecture

```
src/hooks/ui/useDiscoveryHints.ts  — Central hook managing all hint state + triggers
src/components/shared/DiscoveryHint.tsx — The hint tooltip component (floating-ui positioned)
```

#### useDiscoveryHints hook

```tsx
type HintId = 'left-toolbar' | 'gallery' | 'keyboard-shortcuts' | 'layers-panel';

interface DiscoveryHintsResult {
  activeHint: HintId | null;
  dismissHint: () => void;
  // Trigger callbacks — called from relevant places in the app
  onShapeSelectionChange: (count: number) => void;
  onToolbarButtonClick: () => void;
  onShapeCountChange: (count: number) => void;
}
```

#### Gallery hint — second visit detection

```tsx
// On mount:
const visitCount = parseInt(localStorage.getItem('visit-count') || '0', 10) + 1;
localStorage.setItem('visit-count', String(visitCount));

if (visitCount === 2 && !hasSeenHint('gallery')) {
  // Schedule gallery hint after a few seconds
  setTimeout(() => showHint('gallery'), 5000);
}
```

#### Integration

The discovery hints hook lives in CanvasEditorPage. Trigger callbacks are wired to the relevant state changes:

```tsx
const hints = useDiscoveryHints({ tourActive: tour.active });

// Wire triggers:
useEffect(() => {
  hints.onShapeSelectionChange(canvasState.selectedShapeIds.size);
}, [canvasState.selectedShapeIds.size]);

useEffect(() => {
  hints.onShapeCountChange(canvasState.shapes.length);
}, [canvasState.shapes.length]);

// Pass onToolbarButtonClick to ToolsPanel as a prop
```

---

## Decisions & Reasoning

### What we decided

| Decision | Reasoning |
|----------|-----------|
| **Replace welcome modal with spotlight tour** | The modal was too easily dismissed. A spotlight tour forces attention step-by-step. |
| **5 steps (not 8)** | Fewer steps = higher completion rate. Merged CHANGE + BACKGROUND into one step. Cut gallery (handled by discovery hint instead). Cut left toolbar as a full step (mentioned in step 3 text + discovery hint). |
| **Interactive "add a shape" gate** | "Learn by doing" is more effective than passive reading. The user must click to proceed. |
| **"Try it yourself" for shape manipulation (not animated demo)** | An animated demo with simulated cursor was considered but rejected: very complex to build (fake cursor, coordinated animations, timing logic), and watching doesn't build muscle memory. Letting the user try it themselves is more effective and dramatically simpler. |
| **Header shows "Today's challenge"** | Makes the daily constraint permanently visible. Helps both new and returning users understand the concept. Not redundant with bottom toolbar — header communicates the concept, bottom bar is for interaction. |
| **Contextual hints for feature discovery** | Some features (left toolbar, gallery, layers, shortcuts) are better taught at the moment of relevance rather than during initial tour. Prevents tour from being too long. |
| **Left toolbar hint + mention in step 3** | The left toolbar is easy to miss (tester didn't discover copy/paste). Dual approach: brief mention during tour + contextual hint when selecting multiple shapes. |
| **Keyboard shortcut hint on first toolbar button click** | Teaches two things at once: shortcuts exist AND they're customizable. Better trigger than "any keypress" since it's specifically relevant. |
| **Gallery hint on second visit** | First visit = focused on creating. Second visit = they've made something, now curious about others. |
| **Single tour (no simplified replay variant)** | One code path. Even on replay, "add a shape" still works — adding one more shape is harmless. |
| **Skip on mobile** | Mobile isn't fully implemented. A bad mobile tour is worse than no tour. |
| **localStorage tracking only** | Simple. Worst case: switching devices re-shows the tour, which is fine since it's short. |
| **Lighter style for discovery hints** | Visually distinct from tour tooltips so users don't confuse post-tour hints with a continuing tour. |
| **"Skip tour" as link below primary button** | Follows ResetConfirmModal pattern (primary full-width + link dismiss). Visible but not prominent. Users see both options and make a conscious choice. |
| **Replay via `?` popover** | Natural home — the `?` already suggests "help". No new UI surface needed. |

### What we discarded

| Idea | Why discarded |
|------|--------------|
| **Animated shape demo with simulated cursor** | Too complex (fake cursor, coordinated animations, timing, mid-loop confirm button). Less effective than hands-on practice. Would account for ~30% of implementation effort. |
| **8-step tour** | Too long. Gallery, left toolbar, and background color were cut or merged. |
| **Separate left toolbar tour step** | Vague ("more actions here") — not memorable. Better served by brief mention in step 3 + contextual hint at moment of relevance. |
| **Gallery as a tour step** | By the tour's end, users want to create, not browse. Better as a second-visit discovery hint. |
| **Profile flag for tour completion** | Added complexity for minimal gain. localStorage is sufficient. |
| **Separate simplified replay tour** | Two code paths = more complexity. Single tour works for both first-time and replay. |
| **Tour on mobile** | Mobile support is incomplete. Better to skip than deliver a broken experience. |
| **Keeping the welcome modal** | It failed its purpose — easily dismissed, didn't communicate the core concept. |
| **Dark style for discovery hints** | Would look like the tour continuing, causing confusion. Light card style is visually distinct. |

---

## File changes summary

### New files
- `src/components/tour/TourOverlay.tsx` — Overlay with SVG mask cutout + tooltip
- `src/components/tour/TourProvider.tsx` — Context provider for tour state
- `src/components/tour/tourSteps.ts` — Step definitions
- `src/hooks/ui/useTour.ts` — Tour state machine + localStorage
- `src/hooks/ui/useDiscoveryHints.ts` — Discovery hints state + triggers
- `src/components/shared/DiscoveryHint.tsx` — Light hint tooltip component

### Modified files
- `src/pages/CanvasEditorPage.tsx` — Replace InspirationCenter + WelcomeModal with ChallengeDisplay + TourProvider, wire discovery hints
- `src/components/canvas/TopBar.tsx` — No changes needed (centerContent slot already flexible)
- `src/components/canvas/BottomToolbar.tsx` — Add `data-tour` attributes to ADD and CHANGE+BACKGROUND sections
- `src/components/canvas/KeyboardShortcutsPopover.tsx` — Add "Replay tour" button in footer, new `onReplayTour` prop
- `src/components/canvas/ToolsPanel.tsx` — Add `onToolButtonClick` prop for discovery hint trigger

### Removed files
- `src/components/modals/WelcomeModal.tsx` — Replaced by tour
- `src/hooks/ui/useWelcomeModal.ts` — No longer needed

### Data attributes needed on existing elements
- `data-tour="challenge"` on ChallengeDisplay root
- `data-tour="add-shapes"` on BottomToolbar ADD section wrapper
- `data-tour="colors"` on BottomToolbar CHANGE + BACKGROUND wrapper
- `data-tour="submit"` on submit button area in DefaultRightContent

---

## Implementation TODO

### Phase 1: Header Redesign

This phase is independent and can be shipped on its own. It improves the app for all users regardless of the tour.

- [x] **1.1** Create `ChallengeDisplay` component in `CanvasEditorPage.tsx` (replacing `InspirationCenter`)
- [x] **1.2** Replace `InspirationCenter` usage
- [x] **1.3** Delete the `InspirationCenter` function from `CanvasEditorPage.tsx`
- [ ] **1.4** Visually verify header looks correct across all 3 themes (Pop/Swiss/Cloud) × light/dark

### Phase 2: Tour Infrastructure

Core hooks and state management. No UI yet — just the engine.

- [x] **2.1** Create `src/hooks/ui/useTour.ts`
- [x] **2.2** Create `src/components/tour/tourSteps.ts`
- [x] **2.3** Tour state managed via `useTour` hook (no separate Provider needed — hook is sufficient)

### Phase 3: Tour Overlay UI

The visual spotlight overlay and tooltip bubble.

- [x] **3.1** Create `src/components/tour/TourOverlay.tsx` — SVG mask overlay with cutout, accent border ring, resize listener
- [x] **3.2** Tooltip bubble with dark inverted style, adaptive positioning, Button pair (primary + link skip)
- [x] **3.3** Pointer events: overlay blocks non-cutout clicks, cutout passthrough for interactive steps, blocked for non-interactive
- [x] **3.4** Entrance/exit animations using `motion` (fade overlay, slide+fade tooltip between steps)

### Phase 4: Data Attributes & Step 2 Wiring

Add `data-tour` attributes to existing components and wire the interactive gate.

- [x] **4.1** Add `data-tour="add-shapes"` to ADD section wrapper in `BottomToolbar.tsx`
- [x] **4.2** Add `data-tour="colors"` wrapper around CHANGE + BACKGROUND in `BottomToolbar.tsx`
- [x] **4.3** Add `data-tour="submit"` wrapper around submit button in `TopBar.tsx`
- [x] **4.4** Wire step 2 interactive gate: `handleAddShape` calls `tour.next()` when on `add-shape` step
- [x] **4.5** Step 3 targets selected shape via `[data-shape-id]` selector (existing attribute on SVGShape)

### Phase 5: Integration in CanvasEditorPage

Wire everything together.

- [x] **5.1** Remove `WelcomeModal` import and usage from `CanvasEditorPage.tsx`
- [x] **5.2** Delete removed files (`WelcomeModal.tsx`, `useWelcomeModal.ts`, barrel export)
- [x] **5.3** Add tour to `CanvasEditorPage.tsx` (useTour hook, TourOverlay render, replay prop threaded)
- [x] **5.4** Tour guarded: `!showOnboarding` prevents overlap with nickname modal

### Phase 6: Replay Button

- [x] **6.1** Add `onReplayTour` prop to `KeyboardShortcutsPopover`
- [x] **6.2** Add "Replay tour" button in popover footer (play icon, same styling as "Customize shortcuts")
- [x] **6.3** Thread `onReplayTour` from `CanvasEditorPage` → `KeyboardShortcutsPopover`

### Phase 7: Discovery Hints

Can be done independently of the tour (only dependency: needs `tourActive` flag to suppress hints during tour).

- [x] **7.1** Create `src/components/shared/DiscoveryHint.tsx` — light card style, auto-positioning, auto-dismiss, motion animation
- [x] **7.2** Create `src/hooks/ui/useDiscoveryHints.ts` — localStorage tracking, queue system, suppression during tour
- [x] **7.3** Left-toolbar hint: `data-hint` on collapsed toggle + open panel, triggered on 2+ selections
- [x] **7.4** Gallery hint: `data-hint` on Gallery button, triggered on second visit after 5s
- [x] **7.5** Keyboard-shortcuts hint: `data-hint` on `?` button, `onToolButtonClick` prop on ToolsPanel
- [x] **7.6** Layers-panel hint: `data-hint` on layers toggle, triggered on 3+ shapes
- [x] **7.7** Wired `useDiscoveryHints` into `CanvasEditorPage.tsx` with all triggers + `DiscoveryHint` rendering

### Phase 8: Cleanup & Testing

- [x] **8.1** Search codebase for any remaining references to `WelcomeModal` or `useWelcomeModal` and remove them
- [x] **8.2** Search for `welcome-modal-seen` localStorage key references — remove if any exist outside the deleted files
- [x] **8.3** Test full tour flow end-to-end
  - First visit: tour starts automatically
  - Step 1: highlight header, "Next" advances
  - Step 2: highlight ADD, must click shape button to advance
  - Step 3: highlight shape on canvas, "Got it" advances
  - Step 4: highlight CHANGE+BACKGROUND, "Next" advances
  - Step 5: highlight Submit, "Finish" completes tour
  - localStorage `tour-completed` is set to `'true'`
  - Refreshing page: tour does not appear again
- [x] **8.4** Test skip flow
  - Click "Skip tour" at any step → tour dismisses, localStorage set
- [x] **8.5** Test replay flow
  - Open `?` popover → click "Replay tour" → full tour runs again
- [x] **8.6** Test discovery hints
  - Select 2+ shapes → left-toolbar hint appears (once)
  - Second visit, after 5s → gallery hint appears (once)
  - Click a tool button → keyboard-shortcuts hint appears (once)
  - Add 3+ shapes → layers-panel hint appears (once)
  - Hints don't appear during active tour
  - Hints don't stack — only one at a time
  - Hints auto-dismiss after 8 seconds
- [x] **8.7** Test across themes
  - Tour overlay + tooltips look correct in Pop, Swiss, Cloud × light, dark (6 combos)
  - Discovery hints look correct in all themes
- [x] **8.8** Test edge cases
  - Window resize during tour → cutout repositions correctly
  - Tour + other modal conflict → tour waits / doesn't render
  - Mobile viewport → tour doesn't trigger
  - Replay with existing shapes on canvas → still works
- [x] **8.9** Remove any dev/debug code, console.logs, etc.

---

## Open questions

None — all questions have been resolved through discussion.
