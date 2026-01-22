# Feature: Zoom and Pan

## Description

Implement a zoom feature that allows users to zoom in and out of the canvas using mouse wheel scrolling while holding the Ctrl key (Cmd on Mac). Zooming out makes the canvas and shapes appear smaller (allowing users to see shapes outside canvas bounds), while zooming in makes them appear larger. The zoom level is displayed as a percentage in the UI with a reset button to return to 100%. Zooming maintains cursor position for focused navigation. Holding spacebar while dragging enables canvas panning.

## Implementation Summary

### Files Created
- `src/hooks/useViewportState.ts` - New hook for zoom/pan state management
- `src/components/ZoomControls.tsx` - UI component for zoom percentage and controls

### Files Modified
- `src/types/index.ts` - Added `ViewportState` interface
- `src/components/Canvas.tsx` - Added zoom/pan transforms, wheel handler, spacebar panning
- `src/App.tsx` - Integrated viewport state and zoom controls
- `src/components/Toolbar.tsx` - Updated controls help text

### Features Implemented
1. **Zoom with mouse wheel**: Ctrl/Cmd + scroll to zoom in/out (10%-500% range)
2. **Zoom toward cursor**: Zoom maintains cursor position on canvas
3. **Pan with spacebar**: Hold spacebar + drag to pan the canvas
4. **Zoom controls UI**: Bottom-center overlay showing zoom percentage with +/- buttons
5. **Reset zoom button**: Click percentage to reset to 100%
6. **Visual feedback**: Cursor changes to grab/grabbing when in pan mode

### Technical Details
- Uses SVG viewBox for zoom/pan transforms
- Coordinate conversion updated to account for viewport transforms
- Interaction layers disabled during pan mode to prevent conflicts
- Zoom range: 10% (0.1) to 500% (5.0)
- Zoom step: 10% per wheel tick or button click
