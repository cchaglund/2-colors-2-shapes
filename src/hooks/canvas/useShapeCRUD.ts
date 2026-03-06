import { useCallback } from 'react';
import type { Shape, CanvasState, DailyChallenge, ShapeType } from '../../types';
import { generateId, SHAPE_NAMES } from '../../utils/shapes';

type SetCanvasState = (
  updater: CanvasState | ((prev: CanvasState) => CanvasState),
  addToHistory?: boolean,
  label?: string
) => void;

function shiftZIndicesAbove(shapes: Shape[], insertAfterZ: number, count: number): Shape[] {
  return shapes.map((s) => s.zIndex > insertAfterZ ? { ...s, zIndex: s.zIndex + count } : s);
}

function generateShapeName(type: ShapeType, existingShapes: Shape[]): string {
  const typeCount = existingShapes.filter(s => s.type === type).length + 1;
  return `${SHAPE_NAMES[type]} ${typeCount}`;
}

export function useShapeCRUD(
  challenge: DailyChallenge | null,
  setCanvasState: SetCanvasState,
) {
  const addShape = useCallback(
    (shapeIndex: number, colorIndex: number, options?: { x?: number; y?: number; size?: number }) => {
      if (!challenge) return;

      setCanvasState((prev) => {
        const maxZIndex = Math.max(0, ...prev.shapes.map((s) => s.zIndex));

        const shapeType = challenge.shapes[shapeIndex].type;
        const defaultName = generateShapeName(shapeType, prev.shapes);

        const size = options?.size ?? 100;
        const x = options?.x != null ? options.x - size / 2 : 350;
        const y = options?.y != null ? options.y - size / 2 : 350;

        const newShape: Shape = {
          id: generateId(),
          type: challenge.shapes[shapeIndex].type,
          name: defaultName,
          x,
          y,
          size,
          rotation: 0,
          colorIndex,
          zIndex: maxZIndex + 1,
        };

        return {
          ...prev,
          shapes: [...prev.shapes, newShape],
          selectedShapeIds: new Set([newShape.id]),
        };
      }, true, 'Add shape');
    },
    [challenge, setCanvasState]
  );

  const duplicateShape = useCallback(
    (id: string) => {
      setCanvasState((prev) => {
        const shape = prev.shapes.find((s) => s.id === id);
        if (!shape) return prev;

        const shiftedShapes = shiftZIndicesAbove(prev.shapes, shape.zIndex, 1);

        const newShape: Shape = {
          ...shape,
          id: generateId(),
          name: generateShapeName(shape.type, prev.shapes),
          x: shape.x + 20,
          y: shape.y + 20,
          zIndex: shape.zIndex + 1,
        };

        return {
          ...prev,
          shapes: [...shiftedShapes, newShape],
          selectedShapeIds: new Set([newShape.id]),
        };
      }, true, 'Duplicate');
    },
    [challenge, setCanvasState]
  );

  const duplicateShapes = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      if (ids.length === 1) {
        duplicateShape(ids[0]);
        return;
      }

      setCanvasState((prev) => {
        const shapesToDuplicate = prev.shapes
          .filter((s) => ids.includes(s.id))
          .sort((a, b) => a.zIndex - b.zIndex);
        if (shapesToDuplicate.length === 0) return prev;

        let currentShapes = prev.shapes;
        const newShapes: Shape[] = [];
        const newSelectedIds: string[] = [];
        let cumulativeShift = 0;

        for (const shape of shapesToDuplicate) {
          const effectiveOrigZ = shape.zIndex + cumulativeShift;

          currentShapes = shiftZIndicesAbove(currentShapes, effectiveOrigZ, 1);
          for (let i = 0; i < newShapes.length; i++) {
            if (newShapes[i].zIndex > effectiveOrigZ) {
              newShapes[i] = { ...newShapes[i], zIndex: newShapes[i].zIndex + 1 };
            }
          }

          const allShapes = [...currentShapes, ...newShapes];

          const newShape: Shape = {
            ...shape,
            id: generateId(),
            name: generateShapeName(shape.type, allShapes),
            x: shape.x + 20,
            y: shape.y + 20,
            zIndex: effectiveOrigZ + 1,
          };

          newShapes.push(newShape);
          newSelectedIds.push(newShape.id);
          cumulativeShift++;
        }

        return {
          ...prev,
          shapes: [...currentShapes, ...newShapes],
          selectedShapeIds: new Set(newSelectedIds),
        };
      }, true, 'Duplicate');
    },
    [challenge, duplicateShape, setCanvasState]
  );

  const updateShape = useCallback(
    (id: string, updates: Partial<Shape>, addToHistory = true, label?: string) => {
      setCanvasState((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }), addToHistory, label);
    },
    [setCanvasState]
  );

  const updateShapes = useCallback(
    (updates: Map<string, Partial<Shape>>, addToHistory = true, label?: string) => {
      setCanvasState((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) => {
          const shapeUpdates = updates.get(s.id);
          return shapeUpdates ? { ...s, ...shapeUpdates } : s;
        }),
      }), addToHistory, label);
    },
    [setCanvasState]
  );

  const deleteShape = useCallback(
    (id: string) => {
      setCanvasState((prev) => {
        const newSelectedIds = new Set(prev.selectedShapeIds);
        newSelectedIds.delete(id);
        return {
          ...prev,
          shapes: prev.shapes.filter((s) => s.id !== id),
          selectedShapeIds: newSelectedIds,
        };
      }, true, 'Delete');
    },
    [setCanvasState]
  );

  const deleteSelectedShapes = useCallback(() => {
    setCanvasState((prev) => {
      if (prev.selectedShapeIds.size === 0) return prev;
      return {
        ...prev,
        shapes: prev.shapes.filter((s) => !prev.selectedShapeIds.has(s.id)),
        selectedShapeIds: new Set<string>(),
      };
    }, true, 'Delete');
  }, [setCanvasState]);

  return {
    addShape,
    duplicateShape,
    duplicateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    deleteSelectedShapes,
  };
}
