import { useCallback, useMemo } from 'react';
import type { Shape } from '../../types';
import type { SelectionBounds } from '../../types/canvas';
import { getShapeAABB } from '../../utils/shapeBounds';

/**
 * Hook for calculating selection bounds and managing selected shapes
 */
export function useSelectionBounds(shapes: Shape[], selectedShapeIds: Set<string>) {
  // Get all selected shapes
  const selectedShapes = useMemo(
    () => shapes.filter((s) => selectedShapeIds.has(s.id)),
    [shapes, selectedShapeIds]
  );

  const hasSelection = selectedShapes.length > 0;
  const hasSingleSelection = selectedShapes.length === 1;
  const singleSelectedShape = hasSingleSelection ? selectedShapes[0] : null;

  // Calculate bounding box for all selected shapes, accounting for rotation
  const getSelectionBounds = useCallback((): SelectionBounds | null => {
    if (selectedShapes.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const shape of selectedShapes) {
      const aabb = getShapeAABB(shape);
      minX = Math.min(minX, aabb.minX);
      minY = Math.min(minY, aabb.minY);
      maxX = Math.max(maxX, aabb.maxX);
      maxY = Math.max(maxY, aabb.maxY);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [selectedShapes]);

  const selectionBounds = useMemo(() => getSelectionBounds(), [getSelectionBounds]);

  return {
    selectedShapes,
    hasSelection,
    hasSingleSelection,
    singleSelectedShape,
    selectionBounds,
    getSelectionBounds,
  };
}
