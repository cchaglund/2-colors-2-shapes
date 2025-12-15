import { useState, useEffect, useCallback, useRef } from 'react';
import type { Shape, CanvasState, DailyChallenge } from '../types';
import { generateId } from '../utils/shapeHelpers';
import { getTodayDate } from '../utils/dailyChallenge';

const STORAGE_KEY = '2colors2shapes_canvas';
const MAX_HISTORY = 50;

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
  const [canvasState, setCanvasStateInternal] = useState<CanvasState>(() => {
    const stored = loadFromStorage();
    // Only restore if it's the same day
    if (stored && stored.date === getTodayDate()) {
      return { ...stored.canvas, selectedShapeId: null };
    }
    return initialCanvasState;
  });

  // History for undo/redo
  // Use ref for the history array (not needed for rendering) and state for indices (needed for canUndo/canRedo)
  const historyRef = useRef<CanvasState[]>([canvasState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);
  const isUndoRedoRef = useRef(false);
  const lastHistoryTimeRef = useRef(0);
  const COALESCE_MS = 300; // Coalesce changes within this time window

  // Wrapper that adds to history
  const setCanvasState = useCallback(
    (
      updater: CanvasState | ((prev: CanvasState) => CanvasState),
      addToHistory = true
    ) => {
      setCanvasStateInternal((prev) => {
        const newState =
          typeof updater === 'function' ? updater(prev) : updater;

        if (addToHistory && !isUndoRedoRef.current) {
          const now = Date.now();
          const shouldCoalesce = now - lastHistoryTimeRef.current < COALESCE_MS;
          lastHistoryTimeRef.current = now;

          setHistoryIndex((currentIndex) => {
            if (shouldCoalesce && currentIndex > 0) {
              // Replace the last history entry instead of adding new one
              historyRef.current[currentIndex] = newState;
              return currentIndex;
            }

            // Remove any future history if we're not at the end
            historyRef.current = historyRef.current.slice(0, currentIndex + 1);
            // Add new state
            historyRef.current.push(newState);
            // Limit history size
            if (historyRef.current.length > MAX_HISTORY) {
              historyRef.current = historyRef.current.slice(1);
              setHistoryLength(historyRef.current.length);
              return currentIndex; // Index stays same when we trim from start
            } else {
              setHistoryLength(historyRef.current.length);
              return currentIndex + 1;
            }
          });
        }

        return newState;
      });
    },
    []
  );

  // Persist to localStorage on changes
  useEffect(() => {
    saveToStorage({
      date: getTodayDate(),
      canvas: canvasState,
    });
  }, [canvasState]);

  const undo = useCallback(() => {
    setHistoryIndex((currentIndex) => {
      if (currentIndex > 0) {
        isUndoRedoRef.current = true;
        const newIndex = currentIndex - 1;
        setCanvasStateInternal(historyRef.current[newIndex]);
        setTimeout(() => {
          isUndoRedoRef.current = false;
        }, 0);
        return newIndex;
      }
      return currentIndex;
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((currentIndex) => {
      if (currentIndex < historyRef.current.length - 1) {
        isUndoRedoRef.current = true;
        const newIndex = currentIndex + 1;
        setCanvasStateInternal(historyRef.current[newIndex]);
        setTimeout(() => {
          isUndoRedoRef.current = false;
        }, 0);
        return newIndex;
      }
      return currentIndex;
    });
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  const addShape = useCallback(
    (shapeIndex: 0 | 1, colorIndex: 0 | 1) => {
      const shapeType = challenge.shapes[shapeIndex];

      setCanvasState((prev) => {
        const maxZIndex = Math.max(0, ...prev.shapes.map((s) => s.zIndex));

        // Generate name like A1, A2, B1, B2 (A = first shape type, B = second)
        const shapeLetter = shapeIndex === 0 ? 'A' : 'B';
        const totalCount = prev.shapes.length + 1;
        const defaultName = `${shapeLetter}${totalCount}`;

        const newShape: Shape = {
          id: generateId(),
          type: shapeType,
          name: defaultName,
          x: 350, // Center of 800x800 canvas
          y: 350,
          size: 100,
          rotation: 0,
          colorIndex,
          zIndex: maxZIndex + 1,
        };

        return {
          ...prev,
          shapes: [...prev.shapes, newShape],
          selectedShapeId: newShape.id,
        };
      });
    },
    [challenge.shapes, setCanvasState]
  );

  const duplicateShape = useCallback(
    (id: string) => {
      setCanvasState((prev) => {
        const shape = prev.shapes.find((s) => s.id === id);
        if (!shape) return prev;

        const maxZIndex = Math.max(0, ...prev.shapes.map((s) => s.zIndex));
        const totalCount = prev.shapes.length + 1;
        const shapeIndex = challenge.shapes.indexOf(shape.type) as 0 | 1;
        const shapeLetter = shapeIndex === 0 ? 'A' : 'B';

        const newShape: Shape = {
          ...shape,
          id: generateId(),
          name: `${shapeLetter}${totalCount}`,
          x: shape.x + 20, // Offset slightly
          y: shape.y + 20,
          zIndex: maxZIndex + 1,
        };

        return {
          ...prev,
          shapes: [...prev.shapes, newShape],
          selectedShapeId: newShape.id,
        };
      });
    },
    [challenge.shapes, setCanvasState]
  );

  const updateShape = useCallback(
    (id: string, updates: Partial<Shape>) => {
      setCanvasState((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
    },
    [setCanvasState]
  );

  const deleteShape = useCallback(
    (id: string) => {
      setCanvasState((prev) => ({
        ...prev,
        shapes: prev.shapes.filter((s) => s.id !== id),
        selectedShapeId: prev.selectedShapeId === id ? null : prev.selectedShapeId,
      }));
    },
    [setCanvasState]
  );

  const selectShape = useCallback(
    (id: string | null) => {
      // Selection changes don't go into history
      setCanvasState(
        (prev) => ({
          ...prev,
          selectedShapeId: id,
        }),
        false
      );
    },
    [setCanvasState]
  );

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
    [setCanvasState]
  );

  const setBackgroundColor = useCallback(
    (colorIndex: 0 | 1 | null) => {
      setCanvasState((prev) => ({
        ...prev,
        backgroundColorIndex: colorIndex,
      }));
    },
    [setCanvasState]
  );

  const resetCanvas = useCallback(() => {
    setCanvasState(initialCanvasState);
  }, [setCanvasState]);

  return {
    canvasState,
    addShape,
    duplicateShape,
    updateShape,
    deleteShape,
    selectShape,
    moveLayer,
    setBackgroundColor,
    resetCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
