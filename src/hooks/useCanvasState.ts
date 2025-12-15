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
        const shapes = [...prev.shapes];
        const shape = shapes.find((s) => s.id === id);
        if (!shape) return prev;

        const sortedByZ = [...shapes].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedByZ.findIndex((s) => s.id === id);

        let targetIndex: number;
        switch (direction) {
          case 'up':
            targetIndex = Math.min(currentIndex + 1, sortedByZ.length - 1);
            break;
          case 'down':
            targetIndex = Math.max(currentIndex - 1, 0);
            break;
          case 'top':
            targetIndex = sortedByZ.length - 1;
            break;
          case 'bottom':
            targetIndex = 0;
            break;
        }

        if (targetIndex === currentIndex) return prev;

        // Swap zIndex values
        const targetShape = sortedByZ[targetIndex];
        const tempZ = shape.zIndex;
        shape.zIndex = targetShape.zIndex;
        targetShape.zIndex = tempZ;

        return { ...prev, shapes };
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
