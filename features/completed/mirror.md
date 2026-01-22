# Mirror Feature

Allow the mirroring of the shapes on the canvas, both horizontally and vertically. This adds more versatility to the shapes and allows users to create more complex designs while still adhering to the 2 colors and 2 shapes constraint.

## Implementation Summary

### Features Implemented

1. **Mirror Horizontal (H key)** - Flips selected shapes left/right (like looking in a mirror)
2. **Mirror Vertical (V key)** - Flips selected shapes up/down (like a reflection in water)

### Changes Made

#### `src/types/index.ts`
- Added `flipX?: boolean` and `flipY?: boolean` optional properties to the `Shape` interface
- These properties track whether a shape is flipped horizontally or vertically

#### `src/constants/keyboardActions.ts`
- Added `mirrorHorizontal` and `mirrorVertical` to the `KeyboardActionId` type
- Added keyboard action definitions with default bindings (H and V keys)
- Both actions are remappable through the keyboard settings

#### `src/hooks/useCanvasState.ts`
- Added `mirrorHorizontal(ids: string[])` function - toggles `flipX` for each selected shape
- Added `mirrorVertical(ids: string[])` function - toggles `flipY` for each selected shape

#### `src/components/ShapeElement.tsx`
- Updated transform to include flip using SVG `scale(-1, 1)` for horizontal flip and `scale(1, -1)` for vertical flip
- Flips are applied around the center of the shape to maintain position

#### `src/components/ActionToolbar.tsx`
- Added `MirrorHorizontalIcon` and `MirrorVerticalIcon` SVG components
- Added `onMirrorHorizontal` and `onMirrorVertical` props
- Added two new toolbar buttons with tooltips showing keyboard shortcuts

#### `src/components/Canvas.tsx`
- Added `onMirrorHorizontal` and `onMirrorVertical` props
- Added keyboard event handlers for mirror bindings

#### `src/components/Toolbar.tsx`
- Updated controls instructions to include mirror shortcuts (H/V to mirror)

#### `src/App.tsx`
- Wired up `mirrorHorizontal` and `mirrorVertical` from `useCanvasState`
- Created `handleMirrorHorizontal` and `handleMirrorVertical` callbacks
- Passed handlers to both `Canvas` and `ActionToolbar` components

### How It Works

- Select one or more shapes on the canvas
- Press **H** to mirror horizontally (flip left/right) - the shape's geometry is reflected
- Press **V** to mirror vertically (flip up/down) - the shape's geometry is reflected
- Or use the mirror buttons in the top action toolbar
- Works with single shapes and multi-select
- Pressing the same mirror key again will flip the shape back to its original orientation (toggle behavior)
- Fully integrated with undo/redo history

### Keyboard Shortcuts
- **H** - Mirror Horizontal (customizable)
- **V** - Mirror Vertical (customizable)

Both shortcuts can be remapped through the "Customize" keyboard settings.
