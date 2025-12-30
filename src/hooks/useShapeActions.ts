import { useCallback, useMemo } from 'react';
import type { Shape } from '../types';

interface UseShapeActionsOptions {
  shapes: Shape[];
  selectedShapeIds: Set<string>;
  updateShapes: (updates: Map<string, Partial<Shape>>) => void;
  duplicateShapes: (ids: string[]) => void;
  mirrorHorizontal: (ids: string[]) => void;
  mirrorVertical: (ids: string[]) => void;
}

/**
 * Hook for shape movement, rotation, resize, and mirror actions
 */
export function useShapeActions({
  shapes,
  selectedShapeIds,
  updateShapes,
  duplicateShapes,
  mirrorHorizontal,
  mirrorVertical,
}: UseShapeActionsOptions) {
  const selectedShapes = useMemo(
    () => shapes.filter((s) => selectedShapeIds.has(s.id)),
    [shapes, selectedShapeIds]
  );

  const handleMoveShapes = useCallback(
    (dx: number, dy: number) => {
      if (selectedShapes.length === 0) return;
      const updates = new Map<string, { x: number; y: number }>();
      selectedShapes.forEach((shape) => {
        updates.set(shape.id, { x: shape.x + dx, y: shape.y + dy });
      });
      updateShapes(updates);
    },
    [selectedShapes, updateShapes]
  );

  const handleRotateShapes = useCallback(
    (dRotation: number) => {
      if (selectedShapes.length === 0) return;
      const updates = new Map<string, { rotation: number }>();
      selectedShapes.forEach((shape) => {
        updates.set(shape.id, { rotation: shape.rotation + dRotation });
      });
      updateShapes(updates);
    },
    [selectedShapes, updateShapes]
  );

  const handleDuplicate = useCallback(() => {
    if (selectedShapeIds.size === 0) return;
    duplicateShapes(Array.from(selectedShapeIds));
  }, [selectedShapeIds, duplicateShapes]);

  const handleMirrorHorizontal = useCallback(() => {
    if (selectedShapeIds.size === 0) return;
    mirrorHorizontal(Array.from(selectedShapeIds));
  }, [selectedShapeIds, mirrorHorizontal]);

  const handleMirrorVertical = useCallback(() => {
    if (selectedShapeIds.size === 0) return;
    mirrorVertical(Array.from(selectedShapeIds));
  }, [selectedShapeIds, mirrorVertical]);

  // Resize from center - adjust position to keep center fixed
  const handleResizeShapes = useCallback(
    (delta: number) => {
      if (selectedShapes.length === 0) return;
      const updates = new Map<string, { size: number; x: number; y: number }>();
      selectedShapes.forEach((shape) => {
        const newSize = Math.max(10, shape.size + delta); // Minimum size of 10
        const sizeDiff = newSize - shape.size;
        // Adjust position to keep center fixed (shape position is top-left corner)
        updates.set(shape.id, {
          size: newSize,
          x: shape.x - sizeDiff / 2,
          y: shape.y - sizeDiff / 2,
        });
      });
      updateShapes(updates);
    },
    [selectedShapes, updateShapes]
  );

  return {
    selectedShapes,
    handleMoveShapes,
    handleRotateShapes,
    handleDuplicate,
    handleMirrorHorizontal,
    handleMirrorVertical,
    handleResizeShapes,
  };
}
