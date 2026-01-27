import { useState, useEffect } from 'react';
import type { Shape } from '../types';
import type { DragState } from '../types/canvas';

interface UseShapeDragOptions {
  shapes: Shape[];
  getSVGPoint: (clientX: number, clientY: number) => { x: number; y: number };
  onUpdateShape: (id: string, updates: Partial<Shape>, addToHistory?: boolean) => void;
  onUpdateShapes: (updates: Map<string, Partial<Shape>>, addToHistory?: boolean) => void;
  onCommitToHistory: () => void;
}

/**
 * Hook for handling mouse/touch drag state for move/resize/rotate operations
 */
export function useShapeDrag({
  shapes,
  getSVGPoint,
  onUpdateShape,
  onUpdateShapes,
  onCommitToHistory,
}: UseShapeDragOptions) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (!dragState || dragState.mode === 'none') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const point = getSVGPoint(e.clientX, e.clientY);

      if (dragState.mode === 'move') {
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        // Move all shapes in startPositions
        if (dragState.startPositions && dragState.startPositions.size > 1) {
          const updates = new Map<string, Partial<Shape>>();
          dragState.startPositions.forEach((startPos, id) => {
            updates.set(id, {
              x: startPos.x + dx,
              y: startPos.y + dy,
            });
          });
          onUpdateShapes(updates, false);
        } else {
          // Single shape move
          onUpdateShape(dragState.shapeId, {
            x: dragState.startShapeX + dx,
            y: dragState.startShapeY + dy,
          }, false);
        }
      } else if (dragState.mode === 'resize') {
        // Pure screen-space resize logic
        // We completely ignore rotation/flip - just use where the mouse actually is

        // Shape center in screen space
        const centerX = dragState.startShapeX + dragState.startSize / 2;
        const centerY = dragState.startShapeY + dragState.startSize / 2;

        // Where the drag started (the grabbed corner's screen position)
        const grabX = dragState.startX;
        const grabY = dragState.startY;

        // Direction from center to grabbed point (this is the "outward" direction)
        const outDirX = grabX - centerX;
        const outDirY = grabY - centerY;
        const outLen = Math.sqrt(outDirX * outDirX + outDirY * outDirY);

        if (outLen < 1) {
          // Grabbed too close to center, skip
          return;
        }

        // Normalize the outward direction
        const unitOutX = outDirX / outLen;
        const unitOutY = outDirY / outLen;

        // Mouse movement since drag start
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        // Project mouse movement onto the outward direction
        // Positive = moving away from center = enlarge
        // Negative = moving toward center = shrink
        const projection = dx * unitOutX + dy * unitOutY;

        // The anchor is the point opposite the grabbed corner (through center)
        const anchorX = centerX - outDirX;
        const anchorY = centerY - outDirY;

        // Size change: scale by sqrt(2) because corners are on the diagonal
        const sizeDelta = projection * Math.SQRT2;

        // Multi-select resize
        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const maxDimension = Math.max(bounds.width, bounds.height);
          const scale = Math.max(0.1, (maxDimension + sizeDelta) / maxDimension);

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            const relX = startData.x - anchorX;
            const relY = startData.y - anchorY;
            const newX = anchorX + relX * scale;
            const newY = anchorY + relY * scale;
            const newSize = Math.max(20, startData.size * scale);

            updates.set(id, { x: newX, y: newY, size: newSize });
          });
          onUpdateShapes(updates, false);
        } else {
          // Single shape resize
          const newSize = Math.max(20, dragState.startSize + sizeDelta);

          // Keep anchor fixed, scale the center position relative to anchor
          const ratio = newSize / dragState.startSize;
          const newCenterX = anchorX + (centerX - anchorX) * ratio;
          const newCenterY = anchorY + (centerY - anchorY) * ratio;

          // Convert center to top-left position
          const newX = newCenterX - newSize / 2;
          const newY = newCenterY - newSize / 2;

          onUpdateShape(dragState.shapeId, {
            size: newSize,
            x: newX,
            y: newY,
          }, false);
        }
      } else if (dragState.mode === 'rotate') {
        // Multi-select rotate
        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;

          const startAngle = Math.atan2(
            dragState.startY - centerY,
            dragState.startX - centerX
          );
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

          // For group rotation, use raw angle delta for position changes
          let angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;

          if (e.shiftKey) {
            angleDelta = Math.round(angleDelta / 15) * 15;
          }

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            // Find the actual shape to check its flip state
            const shape = shapes.find(s => s.id === id);
            const shapeFlipX = shape?.flipX ?? false;
            const shapeFlipY = shape?.flipY ?? false;

            // Rotate position around the center of the bounding box (same for all shapes)
            const shapeCenter = {
              x: startData.x + startData.size / 2,
              y: startData.y + startData.size / 2,
            };
            const relX = shapeCenter.x - centerX;
            const relY = shapeCenter.y - centerY;
            const angleRad = (angleDelta * Math.PI) / 180;
            const rotatedX = relX * Math.cos(angleRad) - relY * Math.sin(angleRad);
            const rotatedY = relX * Math.sin(angleRad) + relY * Math.cos(angleRad);
            const newCenterX = centerX + rotatedX;
            const newCenterY = centerY + rotatedY;

            // For the shape's own rotation value, mirrored shapes need inverted delta
            // to visually rotate the same direction as non-mirrored shapes
            const shapeFlipInverts = (shapeFlipX ? 1 : 0) ^ (shapeFlipY ? 1 : 0);
            const shapeRotationDelta = shapeFlipInverts ? -angleDelta : angleDelta;

            updates.set(id, {
              x: newCenterX - startData.size / 2,
              y: newCenterY - startData.size / 2,
              rotation: startData.rotation + shapeRotationDelta,
            });
          });
          onUpdateShapes(updates, false);
        } else {
          // Single shape rotate
          const draggedShape = shapes.find((s) => s.id === dragState.shapeId);
          if (!draggedShape) return;

          const centerX = draggedShape.x + draggedShape.size / 2;
          const centerY = draggedShape.y + draggedShape.size / 2;

          const startAngle = Math.atan2(
            dragState.startY - centerY,
            dragState.startX - centerX
          );
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

          // For single shape, mirrored shapes need inverted rotation to match visual drag direction
          const flipInvertsRotation = (dragState.flipX ? 1 : 0) ^ (dragState.flipY ? 1 : 0);
          const rotationMult = flipInvertsRotation ? -1 : 1;

          const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI * rotationMult;
          let newRotation = dragState.startRotation + angleDelta;

          if (e.shiftKey) {
            newRotation = Math.round(newRotation / 15) * 15;
          }

          onUpdateShape(dragState.shapeId, { rotation: newRotation }, false);
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        onCommitToHistory();
      }
      setDragState(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragState || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const point = getSVGPoint(touch.clientX, touch.clientY);

      if (dragState.mode === 'move') {
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        if (dragState.startPositions && dragState.startPositions.size > 1) {
          const updates = new Map<string, Partial<Shape>>();
          dragState.startPositions.forEach((startPos, id) => {
            updates.set(id, {
              x: startPos.x + dx,
              y: startPos.y + dy,
            });
          });
          onUpdateShapes(updates, false);
        } else {
          onUpdateShape(dragState.shapeId, {
            x: dragState.startShapeX + dx,
            y: dragState.startShapeY + dy,
          }, false);
        }
      } else if (dragState.mode === 'resize') {
        const centerX = dragState.startShapeX + dragState.startSize / 2;
        const centerY = dragState.startShapeY + dragState.startSize / 2;
        const grabX = dragState.startX;
        const grabY = dragState.startY;
        const outDirX = grabX - centerX;
        const outDirY = grabY - centerY;
        const outLen = Math.sqrt(outDirX * outDirX + outDirY * outDirY);

        if (outLen < 1) return;

        const unitOutX = outDirX / outLen;
        const unitOutY = outDirY / outLen;
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;
        const projection = dx * unitOutX + dy * unitOutY;
        const anchorX = centerX - outDirX;
        const anchorY = centerY - outDirY;
        const sizeDelta = projection * Math.SQRT2;

        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const maxDimension = Math.max(bounds.width, bounds.height);
          const scale = Math.max(0.1, (maxDimension + sizeDelta) / maxDimension);

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            const relX = startData.x - anchorX;
            const relY = startData.y - anchorY;
            const newX = anchorX + relX * scale;
            const newY = anchorY + relY * scale;
            const newSize = Math.max(20, startData.size * scale);
            updates.set(id, { x: newX, y: newY, size: newSize });
          });
          onUpdateShapes(updates, false);
        } else {
          const newSize = Math.max(20, dragState.startSize + sizeDelta);
          const ratio = newSize / dragState.startSize;
          const newCenterX = anchorX + (centerX - anchorX) * ratio;
          const newCenterY = anchorY + (centerY - anchorY) * ratio;
          const newX = newCenterX - newSize / 2;
          const newY = newCenterY - newSize / 2;
          onUpdateShape(dragState.shapeId, { size: newSize, x: newX, y: newY }, false);
        }
      } else if (dragState.mode === 'rotate') {
        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;

          const startAngle = Math.atan2(dragState.startY - centerY, dragState.startX - centerX);
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);
          const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            const shape = shapes.find(s => s.id === id);
            const shapeFlipX = shape?.flipX ?? false;
            const shapeFlipY = shape?.flipY ?? false;

            const shapeCenter = {
              x: startData.x + startData.size / 2,
              y: startData.y + startData.size / 2,
            };
            const relX = shapeCenter.x - centerX;
            const relY = shapeCenter.y - centerY;
            const angleRad = (angleDelta * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const rotatedX = relX * cos - relY * sin;
            const rotatedY = relX * sin + relY * cos;
            const newCenterX = centerX + rotatedX;
            const newCenterY = centerY + rotatedY;

            const shapeFlipInverts = (shapeFlipX ? 1 : 0) ^ (shapeFlipY ? 1 : 0);
            const shapeRotationDelta = shapeFlipInverts ? -angleDelta : angleDelta;

            updates.set(id, {
              x: newCenterX - startData.size / 2,
              y: newCenterY - startData.size / 2,
              rotation: startData.rotation + shapeRotationDelta,
            });
          });
          onUpdateShapes(updates, false);
        } else {
          const draggedShape = shapes.find((s) => s.id === dragState.shapeId);
          if (!draggedShape) return;

          const centerX = draggedShape.x + draggedShape.size / 2;
          const centerY = draggedShape.y + draggedShape.size / 2;

          const startAngle = Math.atan2(dragState.startY - centerY, dragState.startX - centerX);
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

          const flipInvertsRotation = (dragState.flipX ? 1 : 0) ^ (dragState.flipY ? 1 : 0);
          const rotationMult = flipInvertsRotation ? -1 : 1;

          const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI * rotationMult;
          const newRotation = dragState.startRotation + angleDelta;

          onUpdateShape(dragState.shapeId, { rotation: newRotation }, false);
        }
      }
    };

    const handleTouchEnd = () => {
      if (dragState) {
        onCommitToHistory();
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [dragState, shapes, getSVGPoint, onUpdateShape, onUpdateShapes, onCommitToHistory]);

  return { dragState, setDragState };
}
