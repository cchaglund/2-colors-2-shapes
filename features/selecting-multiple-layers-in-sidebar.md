# Feature: selecting-multiple-layers-in-sidebar

## Description

Select multiple layers in the layer panel - today you can do it one by one, so you select one and then click another whilst holding shift to select that one. But if there are e.g. 10 layers and I want to select all of them, I would like to be able to click the first one, then hold shift and click the last one to select all in between. But then how would I select just the first and last one, skipping the ones in between? Maybe cmd/ctrl+click to add individual layers to the selection, and shift+click to select a range? On PC it should be ctrl and on Mac cmd - this needs to be OS-aware and the control instructions in the UI should reflect that.

---

## Implementation Summary

### How it works

The layer panel now supports two modifier-key selection modes:

1. **Toggle individual selection** (Cmd+click on Mac, Ctrl+click on Windows/Linux)
   - Adds or removes a single layer from the current selection without affecting other selected layers
   - Useful for selecting non-contiguous layers (e.g., first and last, skipping middle ones)

2. **Range selection** (Shift+click on all platforms)
   - Selects all layers between the first currently selected layer and the clicked layer
   - The anchor point is the first selected item in the layer order
   - Replaces current selection with the range

3. **Single selection** (plain click)
   - Replaces the entire selection with just the clicked layer

### UI Feedback

- Each layer item has a tooltip showing the available keyboard shortcuts
- The tooltip is OS-aware: shows "Cmd" on Mac, "Ctrl" on Windows/Linux

### Files Modified

- **src/hooks/useCanvasState.ts**: Updated `selectShape` function to accept an options object with `toggle`, `range`, and `orderedIds` parameters instead of a simple boolean
- **src/components/LayerPanel.tsx**: Added OS detection, modifier key handling (`handleLayerClick`), and tooltip hints
- **src/components/Canvas.tsx**: Updated to use the new `selectShape` signature (canvas uses toggle mode with shift+click for shape interactions)
