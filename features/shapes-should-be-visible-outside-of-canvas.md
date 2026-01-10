# Show Off-Canvas Shapes Feature

## Summary
Allow shapes that are positioned outside the 800x800 canvas boundaries to be visible during editing. This enables users to build "components" off-canvas and bring them in when needed.

## Requirements
1. ✅ Shapes outside the canvas should be visible in the editor
2. ✅ Off-canvas shapes won't be saved/exported (only what's in the canvas)
3. ✅ Feature should be toggleable via a button
4. ✅ Button should be placed under the "Grid Lines" button in the VIEW section
5. ✅ Named "Off-Canvas" with tooltip "Show shapes outside canvas bounds"

## Implementation

### Files Modified
- **src/hooks/useOffCanvasState.ts** (new) - State management hook for off-canvas toggle, persists to localStorage
- **src/components/Canvas.tsx** - Added `showOffCanvas` prop, conditionally applies clipPath to shapes group
- **src/components/Toolbar.tsx** - Added "Off-Canvas" toggle button in the View section
- **src/App.tsx** - Wired up the state and passed props to Canvas and Toolbar

### How It Works
- The canvas uses an SVG `clipPath` to hide shapes outside the 800x800 boundary
- When `showOffCanvas` is true, the clipPath is removed (`clipPath={undefined}`)
- When `showOffCanvas` is false, the clipPath is applied (`clipPath="url(#canvas-clip)"`)
- The setting is persisted to localStorage under key `off-canvas-state`
- Export/save functionality is unaffected - only shapes within the canvas bounds are included

### UI
- Toggle button placed in the "View" section of the Toolbar, below "Grid Lines"
- Icon shows a square (canvas) with dots on either side (representing off-canvas shapes)
- Button shows "On" indicator when active
- Tooltip explains: "Show shapes outside canvas bounds"

## Status
✅ **Complete** - Feature implemented and tested