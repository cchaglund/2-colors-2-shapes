# Feature: drag-and-drop-reordering-of-layers

## Description

You should be able to drag and drop the layers in the layer panel to reorder them (right now you have to push the up/down buttons one at a time). This would make it much easier to manage the layer order, especially when dealing with many layers. The drag-and-drop interaction should be intuitive, with visual cues indicating where the layer will be placed upon dropping. This feature would significantly enhance the user experience by streamlining the layer management process.

## Implementation Summary

### Files Modified

- **[src/hooks/useCanvasState.ts](src/hooks/useCanvasState.ts)** - Added `reorderLayers(draggedId, targetIndex)` function that moves a layer to a specific position and reassigns zIndex values to maintain proper ordering

- **[src/components/LayerPanel.tsx](src/components/LayerPanel.tsx)** - Added drag-and-drop functionality with state management, event handlers, and visual feedback

- **[src/App.tsx](src/App.tsx)** - Wired up the new `reorderLayers` function to the LayerPanel component

### How It Works

1. Drag any layer item by clicking and holding
2. As you drag over other layers, a blue border appears showing where the layer will be inserted
3. Drop the layer to reorder it
4. The change is automatically added to undo/redo history

### Visual Feedback

- **Dragged item**: 50% opacity while being dragged
- **Drop target**: Blue top border indicating where the layer will be placed
- **Cursor**: Changed to `cursor-grab` to indicate draggability
