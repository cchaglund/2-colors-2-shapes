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
  selectedShapeIds: new Set<string>(),
};

export function useCanvasState(challenge: DailyChallenge) {
  const [canvasState, setCanvasStateInternal] = useState<CanvasState>(() => {
    const stored = loadFromStorage();
    // Only restore if it's the same day
    if (stored && stored.date === getTodayDate()) {
      // Handle migration from old selectedShapeId format
      const canvas = stored.canvas;
      const selectedShapeIds = new Set<string>();
      // Support old format with selectedShapeId
      if ('selectedShapeId' in canvas && (canvas as { selectedShapeId?: string | null }).selectedShapeId) {
        selectedShapeIds.add((canvas as { selectedShapeId: string }).selectedShapeId);
      }
      return {
        shapes: canvas.shapes,
        backgroundColorIndex: canvas.backgroundColorIndex,
        selectedShapeIds: new Set<string>(), // Clear selection on load
      };
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
          selectedShapeIds: new Set([newShape.id]),
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
          selectedShapeIds: new Set([newShape.id]),
        };
      });
    },
    [challenge.shapes, setCanvasState]
  );

  const duplicateShapes = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      // For single shape, use the existing duplicateShape function behavior
      if (ids.length === 1) {
        duplicateShape(ids[0]);
        return;
      }

      setCanvasState((prev) => {
        const shapesToDuplicate = prev.shapes.filter((s) => ids.includes(s.id));
        if (shapesToDuplicate.length === 0) return prev;

        let maxZIndex = Math.max(0, ...prev.shapes.map((s) => s.zIndex));
        let currentCount = prev.shapes.length;
        const newShapes: Shape[] = [];
        const newSelectedIds: string[] = [];

        for (const shape of shapesToDuplicate) {
          currentCount++;
          maxZIndex++;
          const shapeIndex = challenge.shapes.indexOf(shape.type) as 0 | 1;
          const shapeLetter = shapeIndex === 0 ? 'A' : 'B';

          const newShape: Shape = {
            ...shape,
            id: generateId(),
            name: `${shapeLetter}${currentCount}`,
            x: shape.x + 20, // Offset slightly, same as single shape duplication
            y: shape.y + 20,
            zIndex: maxZIndex,
          };

          newShapes.push(newShape);
          newSelectedIds.push(newShape.id);
        }

        return {
          ...prev,
          shapes: [...prev.shapes, ...newShapes],
          selectedShapeIds: new Set(newSelectedIds),
        };
      });
    },
    [challenge.shapes, duplicateShape, setCanvasState]
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

  // Update multiple shapes at once (for group transformations)
  const updateShapes = useCallback(
    (updates: Map<string, Partial<Shape>>) => {
      setCanvasState((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) => {
          const shapeUpdates = updates.get(s.id);
          return shapeUpdates ? { ...s, ...shapeUpdates } : s;
        }),
      }));
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
      });
    },
    [setCanvasState]
  );

  const selectShape = useCallback(
    (id: string | null, options?: { toggle?: boolean; range?: boolean; orderedIds?: string[] }) => {
      const { toggle = false, range = false, orderedIds = [] } = options || {};
      // Selection changes don't go into history
      setCanvasState(
        (prev) => {
          if (id === null) {
            // Clear all selections
            return {
              ...prev,
              selectedShapeIds: new Set<string>(),
            };
          }

          if (toggle) {
            // Toggle the shape in the selection (cmd/ctrl+click behavior)
            const newSelectedIds = new Set(prev.selectedShapeIds);
            if (newSelectedIds.has(id)) {
              newSelectedIds.delete(id);
            } else {
              newSelectedIds.add(id);
            }
            return {
              ...prev,
              selectedShapeIds: newSelectedIds,
            };
          }

          if (range && orderedIds.length > 0) {
            // Range selection (shift+click behavior)
            // Find the anchor point (last clicked item that's still selected)
            const currentlySelected = Array.from(prev.selectedShapeIds);
            let anchorIndex = -1;

            // Find the first selected item in order as anchor
            for (let i = 0; i < orderedIds.length; i++) {
              if (currentlySelected.includes(orderedIds[i])) {
                anchorIndex = i;
                break;
              }
            }

            if (anchorIndex === -1) {
              // No anchor, just select the clicked item
              return {
                ...prev,
                selectedShapeIds: new Set([id]),
              };
            }

            const targetIndex = orderedIds.indexOf(id);
            if (targetIndex === -1) {
              return prev;
            }

            // Select all items between anchor and target (inclusive)
            const startIndex = Math.min(anchorIndex, targetIndex);
            const endIndex = Math.max(anchorIndex, targetIndex);
            const rangeIds = orderedIds.slice(startIndex, endIndex + 1);

            return {
              ...prev,
              selectedShapeIds: new Set(rangeIds),
            };
          }

          // Replace selection with just this shape
          return {
            ...prev,
            selectedShapeIds: new Set([id]),
          };
        },
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

  const reorderLayers = useCallback(
    (draggedId: string, targetIndex: number) => {
      setCanvasState((prev) => {
        // Sort by zIndex descending (same as LayerPanel display)
        const sortedByZDesc = [...prev.shapes].sort((a, b) => b.zIndex - a.zIndex);
        const draggedIndex = sortedByZDesc.findIndex((s) => s.id === draggedId);

        if (draggedIndex === -1 || draggedIndex === targetIndex) return prev;

        // Remove dragged item and insert at target position
        const reordered = [...sortedByZDesc];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, removed);

        // Reassign zIndex values based on new order (descending order in array = higher zIndex)
        const newShapes = prev.shapes.map((shape) => {
          const newPosition = reordered.findIndex((s) => s.id === shape.id);
          // First item in array (index 0) should have highest zIndex
          const newZIndex = reordered.length - 1 - newPosition;
          return { ...shape, zIndex: newZIndex };
        });

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
    duplicateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    selectShape,
    moveLayer,
    reorderLayers,
    setBackgroundColor,
    resetCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
