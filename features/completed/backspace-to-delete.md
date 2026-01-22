When the user has one or more shapes selected, pressing the Backspace key should delete all selected shapes. This would provide a quick and intuitive way for users to remove unwanted shapes from their canvas without needing to use a mouse or trackpad to click a delete button.

## Implementation Summary

**Implemented:** 2025-12-17

### Changes Made

1. **useCanvasState.ts** - Added `deleteSelectedShapes` function that filters out all shapes whose IDs are in `selectedShapeIds` and clears the selection

2. **Canvas.tsx** - Added `onDeleteSelectedShapes` prop and keyboard handler for `Backspace` key that triggers deletion when shapes are selected

3. **App.tsx** - Wired up the new `deleteSelectedShapes` function from the hook to the Canvas component

4. **Toolbar.tsx** - Added "Backspace to delete selected" to the Controls section

### Behavior
- Only triggers when one or more shapes are selected
- Deletes all currently selected shapes in a single operation
- Clears selection after deletion
- Action is added to undo history (can be undone with `w`) 