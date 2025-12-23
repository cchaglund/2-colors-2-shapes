# Feature: touchscreen-support

## Description

Let's make the app work for mobile and tablet (touchscreen) devices. Currently the app is designed for mouse and keyboard input, so we need to add support for touch events and gestures. Here's what I'm able to do today: press and move finger pans the canvas, tap selects shapes (and tapping on empty space deselects), pinch to zoom, and that's about it. I can use the toolbar buttons to manipulate shapes, but it's not very intuitive on touch devices. E.g. I would expect to be able to tap on a shape and drag to move it, or use two fingers to rotate or scale a shape. Please implement the following touch interactions:
- Tap and drag to move shapes
- Pinch to scale selected shapes
- Two-finger rotate to rotate selected shapes
- Long press on a shape to bring up a context menu with options like delete, duplicate,

Basically make it intuitive to use on touch devices, so it should be similar to how drawing apps on iPad work.

Finish up by summarizing the implementation changes made in this file, and update the readme to mention touchscreen support as a feature and how it works.

---

## Implementation Summary

### Touch Gestures Implemented

The following touch interactions have been implemented to provide intuitive touchscreen support similar to professional drawing apps:

#### 1. Tap to Select
- **Single tap on a shape**: Selects the shape
- **Single tap on empty canvas**: Deselects all shapes

#### 2. Tap and Drag to Move
- Touch a shape and drag to move it
- If the shape is part of a multi-selection, all selected shapes move together
- Touch on empty canvas and drag to pan the viewport

#### 3. Two-Finger Pinch to Scale/Zoom
- **With shapes selected**: Pinch in/out to scale all selected shapes proportionally around the pinch center
- **Without shapes selected**: Pinch in/out to zoom the canvas viewport around the pinch center
- Works with single or multiple selected shapes

#### 4. Two-Finger Rotate
- Place two fingers on the canvas while shapes are selected
- Rotate your fingers to rotate all selected shapes
- Rotation happens around the center point between your two fingers
- Combined with pinch for simultaneous scale and rotate

#### 5. Long Press Context Menu
- Long press (hold for 500ms) on any shape to open a context menu
- Includes haptic feedback (vibration) when menu opens
- Menu options:
  - **Duplicate**: Create a copy of the selected shape(s)
  - **Flip Horizontal**: Mirror the shape horizontally
  - **Flip Vertical**: Mirror the shape vertically
  - **Bring to Front**: Move shape to the top layer
  - **Send to Back**: Move shape to the bottom layer
  - **Delete**: Remove the selected shape(s)

### Files Modified

1. **`src/components/Canvas.tsx`**
   - Added `TouchState` interface for tracking touch gesture state
   - Added `ContextMenuState` interface for context menu positioning
   - Implemented touch event handlers: `handleCanvasTouchStart`, `handleCanvasTouchMove`, `handleCanvasTouchEnd`
   - Added helper functions for touch gestures: `getTouchSVGPoint`, `getTouchDistance`, `getTouchAngle`, `getTouchCenter`
   - Added `findShapeAtPoint` to detect which shape was touched
   - Added context menu action handlers
   - Updated the drag useEffect to support touch events alongside mouse events
   - Updated handler signatures to accept both `React.MouseEvent` and `React.TouchEvent`
   - Added canvas pinch-to-zoom when no shapes are selected (uses `onSetZoomAtPoint` prop)

2. **`src/components/TransformHandles.tsx`**
   - Updated interface types to accept touch events
   - Added `onTouchStart` handlers to resize and rotate handles
   - Added `touchAction: 'none'` style to prevent browser touch defaults

3. **`src/components/TouchContextMenu.tsx`** (new file)
   - Created a touch-friendly context menu component
   - Styled for touch targets (larger tap areas)
   - Includes icons for each action
   - Positioned relative to touch point
   - Closes when tapping outside

4. **`src/hooks/useViewportState.ts`**
   - Added `setZoomAtPoint` function for pinch-to-zoom with absolute scale factor
   - Zooms around pinch center point for natural feel

5. **`src/App.tsx`**
   - Added `setZoomAtPoint` to viewport state destructuring
   - Passed `onSetZoomAtPoint` prop to Canvas component

### Technical Notes

- Touch events use the same coordinate transformation system as mouse events (`getSVGPoint`)
- Multi-touch gestures (pinch/rotate) store initial shape data to calculate deltas
- The `touch-none` CSS class on the SVG prevents browser default gestures (like page zoom)
- Long press timer is cleared when movement is detected to prevent accidental triggers
- Touch events properly handle shape flipping for rotation calculations
