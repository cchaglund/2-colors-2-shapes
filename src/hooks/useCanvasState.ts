import { useState, useCallback } from 'react';
import type { Shape, ShapeGroup, CanvasState, DailyChallenge } from '../types';
import { useCanvasHistory } from './useCanvasHistory';
import { useCanvasStorage, getInitialCanvasState, initialCanvasState } from './useCanvasStorage';
import { useShapeOperations } from './useShapeOperations';

export function useCanvasState(challenge: DailyChallenge | null, userId: string | undefined) {
  const [canvasState, setCanvasStateInternal] = useState<CanvasState>(getInitialCanvasState);

  // Storage persistence (debounced save + immediate save helper)
  const { saveCanvasStateNow } = useCanvasStorage(canvasState, userId);

  // History management (extracted hook)
  const {
    pushHistory,
    commitToHistory: historyCommit,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
    resetHistory,
  } = useCanvasHistory(canvasState);

  // Wrapper that adds to history
  const setCanvasState = useCallback(
    (
      updater: CanvasState | ((prev: CanvasState) => CanvasState),
      addToHistory = true
    ) => {
      setCanvasStateInternal((prev) => {
        const newState =
          typeof updater === 'function' ? updater(prev) : updater;

        if (addToHistory) {
          pushHistory(newState);
        }

        return newState;
      });
    },
    [pushHistory]
  );

  const undo = useCallback(() => {
    historyUndo((restored) => setCanvasStateInternal(restored));
  }, [historyUndo]);

  const redo = useCallback(() => {
    historyRedo((restored) => setCanvasStateInternal(restored));
  }, [historyRedo]);

  // Shape CRUD, selection, layer ordering, mirror, and group operations
  const {
    addShape,
    duplicateShape,
    duplicateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    deleteSelectedShapes,
    selectShape,
    moveLayer,
    moveGroup,
    reorderLayers,
    reorderGroup,
    setBackgroundColor,
    mirrorHorizontal,
    mirrorVertical,
    createGroup,
    deleteGroup,
    ungroupShapes,
    renameGroup,
    toggleGroupCollapsed,
    moveToGroup,
    selectGroup,
  } = useShapeOperations(challenge, setCanvasState);

  // Commit current state to history (used after drag operations complete)
  const commitToHistory = useCallback(() => {
    historyCommit(canvasState);
  }, [canvasState, historyCommit]);

  const resetCanvas = useCallback(() => {
    setCanvasState(initialCanvasState);
  }, [setCanvasState]);

  // Get shapes in a group (helper for LayerPanel)
  const getShapesInGroup = useCallback(
    (groupId: string): Shape[] => {
      return canvasState.shapes.filter((s) => s.groupId === groupId);
    },
    [canvasState.shapes]
  );

  // Load canvas state from an external source (e.g., a submission from the server)
  const loadCanvasState = useCallback(
    (shapes: Shape[], groups: ShapeGroup[], backgroundColorIndex: 0 | 1 | null) => {
      const newState: CanvasState = {
        shapes,
        groups,
        backgroundColorIndex,
        selectedShapeIds: new Set<string>(),
      };

      resetHistory(newState);
      setCanvasStateInternal(newState);
      saveCanvasStateNow(shapes, groups, backgroundColorIndex);
    },
    [resetHistory, saveCanvasStateNow]
  );

  return {
    canvasState,
    addShape,
    duplicateShape,
    duplicateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    deleteSelectedShapes,
    selectShape,
    moveLayer,
    moveGroup,
    reorderLayers,
    reorderGroup,
    setBackgroundColor,
    resetCanvas,
    mirrorHorizontal,
    mirrorVertical,
    undo,
    redo,
    canUndo,
    canRedo,
    commitToHistory,
    // Group management
    createGroup,
    deleteGroup,
    ungroupShapes,
    renameGroup,
    toggleGroupCollapsed,
    moveToGroup,
    selectGroup,
    getShapesInGroup,
    // External loading
    loadCanvasState,
  };
}
