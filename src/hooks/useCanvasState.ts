import { useState, useEffect, useCallback } from 'react';
import type { Shape, CanvasState, DailyChallenge } from '../types';
import { generateId } from '../utils/shapeHelpers';
import { getTodayDate } from '../utils/dailyChallenge';

const STORAGE_KEY = '2colors2shapes_canvas';

interface StoredData {
  date: string;
  canvas: CanvasState;
}

function loadFromStorage(): StoredData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}

function saveToStorage(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

const initialCanvasState: CanvasState = {
  shapes: [],
  backgroundColorIndex: null,
  selectedShapeId: null,
};

export function useCanvasState(challenge: DailyChallenge) {
  const [canvasState, setCanvasState] = useState<CanvasState>(() => {
    const stored = loadFromStorage();
    // Only restore if it's the same day
    if (stored && stored.date === getTodayDate()) {
      return { ...stored.canvas, selectedShapeId: null };
    }
    return initialCanvasState;
  });

  // Persist to localStorage on changes
  useEffect(() => {
    saveToStorage({
      date: getTodayDate(),
      canvas: canvasState,
    });
  }, [canvasState]);

  const addShape = useCallback(
    (shapeIndex: 0 | 1, colorIndex: 0 | 1) => {
      const shapeType = challenge.shapes[shapeIndex];
      const maxZIndex = Math.max(0, ...canvasState.shapes.map((s) => s.zIndex));

      const newShape: Shape = {
        id: generateId(),
        type: shapeType,
        x: 350, // Center of 800x800 canvas
        y: 350,
        size: 100,
        rotation: 0,
        colorIndex,
        zIndex: maxZIndex + 1,
      };

      setCanvasState((prev) => ({
        ...prev,
        shapes: [...prev.shapes, newShape],
        selectedShapeId: newShape.id,
      }));
    },
    [challenge.shapes, canvasState.shapes]
  );

  const updateShape = useCallback((id: string, updates: Partial<Shape>) => {
    setCanvasState((prev) => ({
      ...prev,
      shapes: prev.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }, []);

  const deleteShape = useCallback((id: string) => {
    setCanvasState((prev) => ({
      ...prev,
      shapes: prev.shapes.filter((s) => s.id !== id),
      selectedShapeId: prev.selectedShapeId === id ? null : prev.selectedShapeId,
    }));
  }, []);

  const selectShape = useCallback((id: string | null) => {
    setCanvasState((prev) => ({
      ...prev,
      selectedShapeId: id,
    }));
  }, []);

  const moveLayer = useCallback(
    (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      setCanvasState((prev) => {
        const sortedByZ = [...prev.shapes].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedByZ.findIndex((s) => s.id === id);
        if (currentIndex === -1) return prev;

        let newShapes: Shape[];

        if (direction === 'up' && currentIndex < sortedByZ.length - 1) {
          // Swap with the shape above
          newShapes = prev.shapes.map((s) => {
            if (s.id === id) {
              return { ...s, zIndex: sortedByZ[currentIndex + 1].zIndex };
            }
            if (s.id === sortedByZ[currentIndex + 1].id) {
              return { ...s, zIndex: sortedByZ[currentIndex].zIndex };
            }
            return s;
          });
        } else if (direction === 'down' && currentIndex > 0) {
          // Swap with the shape below
          newShapes = prev.shapes.map((s) => {
            if (s.id === id) {
              return { ...s, zIndex: sortedByZ[currentIndex - 1].zIndex };
            }
            if (s.id === sortedByZ[currentIndex - 1].id) {
              return { ...s, zIndex: sortedByZ[currentIndex].zIndex };
            }
            return s;
          });
        } else if (direction === 'top' && currentIndex < sortedByZ.length - 1) {
          // Move to top: give it a zIndex higher than the current max
          const maxZ = sortedByZ[sortedByZ.length - 1].zIndex;
          newShapes = prev.shapes.map((s) =>
            s.id === id ? { ...s, zIndex: maxZ + 1 } : s
          );
        } else if (direction === 'bottom' && currentIndex > 0) {
          // Move to bottom: give it a zIndex lower than the current min
          const minZ = sortedByZ[0].zIndex;
          newShapes = prev.shapes.map((s) =>
            s.id === id ? { ...s, zIndex: minZ - 1 } : s
          );
        } else {
          return prev;
        }

        return { ...prev, shapes: newShapes };
      });
    },
    []
  );

  const setBackgroundColor = useCallback((colorIndex: 0 | 1 | null) => {
    setCanvasState((prev) => ({
      ...prev,
      backgroundColorIndex: colorIndex,
    }));
  }, []);

  const resetCanvas = useCallback(() => {
    setCanvasState(initialCanvasState);
  }, []);

  return {
    canvasState,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    moveLayer,
    setBackgroundColor,
    resetCanvas,
  };
}
