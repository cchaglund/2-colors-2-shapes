import { useCallback, useMemo, type RefObject } from 'react';
import type { Shape } from '../../types';

interface UseShapeActionsOptions {
  shapes: Shape[];
  selectedShapeIds: Set<string>;
  updateShapes: (updates: Map<string, Partial<Shape>>, addToHistory?: boolean, label?: string) => void;
  duplicateShapes: (ids: string[]) => void;
  lastDuplicatedIdsRef: RefObject<string[]>;
  mirrorHorizontal: (ids: string[]) => void;
  mirrorVertical: (ids: string[]) => void;
}

/**
 * Hook for shape movement, resize, and mirror actions
 */
export function useShapeActions({
  shapes,
  selectedShapeIds,
  updateShapes,
  duplicateShapes,
  lastDuplicatedIdsRef,
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
      updateShapes(updates, true, 'Move');
    },
    [selectedShapes, updateShapes]
  );

  const handleDuplicate = useCallback(() => {
    if (selectedShapeIds.size > 0) {
      duplicateShapes(Array.from(selectedShapeIds));
    } else if (lastDuplicatedIdsRef.current.length > 0) {
      // Re-duplicate the shapes created by the last duplication
      const stillExist = lastDuplicatedIdsRef.current.filter(id =>
        shapes.some(s => s.id === id)
      );
      if (stillExist.length > 0) {
        duplicateShapes(stillExist);
      }
    }
  }, [selectedShapeIds, shapes, duplicateShapes, lastDuplicatedIdsRef]);

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
      updateShapes(updates, true, 'Resize');
    },
    [selectedShapes, updateShapes]
  );

  return {
    selectedShapes,
    handleMoveShapes,
    handleDuplicate,
    handleMirrorHorizontal,
    handleMirrorVertical,
    handleResizeShapes,
  };
}
