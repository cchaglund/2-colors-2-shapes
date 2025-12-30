import { useCallback, useMemo } from 'react';
import type { Shape } from '../types';
import type { SelectionBounds } from '../types/canvas';

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
      // Get the four corners of the shape's bounding box
      const corners = [
        { x: 0, y: 0 },
        { x: shape.size, y: 0 },
        { x: shape.size, y: shape.size },
        { x: 0, y: shape.size },
      ];

      // Rotation center is at the center of the shape
      const cx = shape.size / 2;
      const cy = shape.size / 2;
      const angleRad = (shape.rotation * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      // Rotate each corner around the center and translate to shape position
      for (const corner of corners) {
        const relX = corner.x - cx;
        const relY = corner.y - cy;
        const rotatedX = relX * cos - relY * sin;
        const rotatedY = relX * sin + relY * cos;
        const finalX = shape.x + cx + rotatedX;
        const finalY = shape.y + cy + rotatedY;

        minX = Math.min(minX, finalX);
        minY = Math.min(minY, finalY);
        maxX = Math.max(maxX, finalX);
        maxY = Math.max(maxY, finalY);
      }
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
