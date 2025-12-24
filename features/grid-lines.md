Button in toolbar to toggle grid lines on/off
- Grid lines appear as light gray lines, splitting the canvas into 9 equal sections (like rule of thirds)
- Grid lines in another gray than the above should be in the center of the canvas, both vertically and horizontally (i.e. dividing the canvas into 4 equal quadrants)
- Grid lines do not print/export, only visible in the editor for alignment help
- Grid lines state (on/off) is saved in local storage with other canvas state
- Should be a toolbar button with an icon representing grid lines, as well as a keyboard shortcut (e.g. G) to toggle quickly (update the controls instructions in the UI and readme accordingly)

---

## Implementation Summary

### Files Created
- `src/hooks/useGridState.ts` - New hook for managing grid visibility state with localStorage persistence (key: `grid-state`)

### Files Modified

**src/constants/keyboardActions.ts**
- Added `toggleGrid` to `KeyboardActionId` type union
- Added new `view` category to action categories
- Added new keyboard action for toggle grid with default binding `KeyG`

**src/components/Toolbar.tsx**
- Added `showGrid` and `onToggleGrid` props
- Added new "View" section with grid toggle button featuring a grid icon
- Updated Controls section to include grid shortcut instruction

**src/components/Canvas.tsx**
- Added `showGrid` and `onToggleGrid` props
- Added keyboard handler for toggle grid shortcut
- Added SVG grid lines rendering:
  - 4 rule-of-thirds lines (light gray, rgba(180, 180, 180, 0.5)) at 1/3 and 2/3 positions
  - 2 center lines (darker gray, rgba(120, 120, 120, 0.6)) at 1/2 position
  - Lines use `pointerEvents="none"` to not interfere with shape interactions
  - Line stroke width scales with zoom (1/viewport.zoom) for consistent appearance

**src/App.tsx**
- Imported and used `useGridState` hook
- Passed `showGrid` and `toggleGrid` to Toolbar and Canvas components

**README.md**
- Added Grid lines feature to features list with description
- Added `useGridState.ts` to project structure

### Technical Details
- Grid lines render on top of shapes but below transform handles
- Lines automatically scale with viewport zoom to maintain 1px visual width
- State persists across browser sessions via localStorage
- Shortcut works globally (not just when canvas focused) but respects input fields