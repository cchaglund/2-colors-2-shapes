import { useState, useEffect, useCallback, useRef } from 'react';
import type { Shape, ShapeGroup, CanvasState, DailyChallenge } from '../types';
import { generateId } from '../utils/shapeHelpers';
import { getTodayDateUTC } from '../utils/dailyChallenge';
import { useCanvasHistory } from './useCanvasHistory';

const STORAGE_KEY = '2colors2shapes_canvas';

interface StoredData {
  date: string;
  userId?: string; // Track which user owns this localStorage data
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
  groups: [],
  backgroundColorIndex: null,
  selectedShapeIds: new Set<string>(),
};

export function useCanvasState(challenge: DailyChallenge | null, userId: string | undefined) {
  // Track the current userId in a ref so we can use it in the save effect
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const [canvasState, setCanvasStateInternal] = useState<CanvasState>(() => {
    const stored = loadFromStorage();
    // Only restore if it's the same day (user check happens in App.tsx sync effect)
    if (stored && stored.date === getTodayDateUTC()) {
      // Handle migration from old selectedShapeId format
      const canvas = stored.canvas;
      // Support old format with selectedShapeId
      if ('selectedShapeId' in canvas && (canvas as { selectedShapeId?: string | null }).selectedShapeId) {
        // Old format migration - not used anymore but kept for compatibility
      }
      return {
        shapes: canvas.shapes,
        groups: canvas.groups || [], // Support migration from old format without groups
        backgroundColorIndex: canvas.backgroundColorIndex,
        selectedShapeIds: new Set<string>(), // Clear selection on load
      };
    }
    // Clear stale localStorage data from previous days
    if (stored) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return initialCanvasState;
  });

  // History management (extracted hook)
  const {
    pushHistory,
    commitToHistory: historyCommit,
    undo: historyUndo,
    redo: historyRedo,
    canUndo,
    canRedo,
    resetHistory,
  } = useCanvasHistory(canvasState);

  // Wrapper that adds to history
  const setCanvasState = useCallback(
    (
      updater: CanvasState | ((prev: CanvasState) => CanvasState),
      addToHistory = true
    ) => {
      setCanvasStateInternal((prev) => {
        const newState =
          typeof updater === 'function' ? updater(prev) : updater;

        if (addToHistory) {
          pushHistory(newState);
        }

        return newState;
      });
    },
    [pushHistory]
  );

  // Persist to localStorage on changes
  useEffect(() => {
    saveToStorage({
      date: getTodayDateUTC(),
      userId: userIdRef.current,
      canvas: canvasState,
    });
  }, [canvasState]);

  const undo = useCallback(() => {
    const restored = historyUndo();
    if (restored) {
      setCanvasStateInternal(restored);
    }
  }, [historyUndo]);

  const redo = useCallback(() => {
    const restored = historyRedo();
    if (restored) {
      setCanvasStateInternal(restored);
    }
  }, [historyRedo]);

  const addShape = useCallback(
    (shapeIndex: 0 | 1, colorIndex: 0 | 1) => {
      if (!challenge) return; // Can't add shapes without a challenge

      setCanvasState((prev) => {
        const maxZIndex = Math.max(0, ...prev.shapes.map((s) => s.zIndex));

        // Generate name like A1, A2, B1, B2 (A = first shape type, B = second)
        const shapeLetter = shapeIndex === 0 ? 'A' : 'B';
        const totalCount = prev.shapes.length + 1;
        const defaultName = `${shapeLetter}${totalCount}`;

        const newShape: Shape = {
          id: generateId(),
          type: challenge.shapes[shapeIndex].type,
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
    [challenge, setCanvasState]
  );

  const duplicateShape = useCallback(
    (id: string) => {
      setCanvasState((prev) => {
        const shape = prev.shapes.find((s) => s.id === id);
        if (!shape) return prev;

        const maxZIndex = Math.max(0, ...prev.shapes.map((s) => s.zIndex));
        const totalCount = prev.shapes.length + 1;
        const shapeIndex = challenge ? (challenge.shapes.findIndex(s => s.type === shape.type) as 0 | 1) : 0;
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
    [challenge, setCanvasState]
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
          const shapeIndex = challenge ? (challenge.shapes.findIndex(s => s.type === shape.type) as 0 | 1) : 0;
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
    [challenge, duplicateShape, setCanvasState]
  );

  const updateShape = useCallback(
    (id: string, updates: Partial<Shape>, addToHistory = true) => {
      setCanvasState((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }), addToHistory);
    },
    [setCanvasState]
  );

  // Update multiple shapes at once (for group transformations)
  const updateShapes = useCallback(
    (updates: Map<string, Partial<Shape>>, addToHistory = true) => {
      setCanvasState((prev) => ({
        ...prev,
        shapes: prev.shapes.map((s) => {
          const shapeUpdates = updates.get(s.id);
          return shapeUpdates ? { ...s, ...shapeUpdates } : s;
        }),
      }), addToHistory);
    },
    [setCanvasState]
  );

  // Commit current state to history (used after drag operations complete)
  const commitToHistory = useCallback(() => {
    historyCommit(canvasState);
  }, [canvasState, historyCommit]);

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

  const deleteSelectedShapes = useCallback(() => {
    setCanvasState((prev) => {
      if (prev.selectedShapeIds.size === 0) return prev;
      return {
        ...prev,
        shapes: prev.shapes.filter((s) => !prev.selectedShapeIds.has(s.id)),
        selectedShapeIds: new Set<string>(),
      };
    });
  }, [setCanvasState]);

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

  // Helper to ensure all shapes have unique, sequential zIndices
  // This prevents bugs from duplicate zIndices after group operations
  const normalizeZIndices = (shapes: Shape[]): Shape[] => {
    // Sort by zIndex, then by id for stable ordering of duplicates
    const sorted = [...shapes].sort(
      (a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id)
    );
    return shapes.map((shape) => ({
      ...shape,
      zIndex: sorted.findIndex((s) => s.id === shape.id),
    }));
  };

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
    (draggedId: string, targetIndex: number, targetGroupId: string | null) => {
      setCanvasState((prev) => {
        // Sort by zIndex descending (same as LayerPanel display)
        const sortedByZDesc = [...prev.shapes].sort((a, b) => b.zIndex - a.zIndex);
        const draggedIndex = sortedByZDesc.findIndex((s) => s.id === draggedId);

        if (draggedIndex === -1 || draggedIndex === targetIndex) return prev;

        // Get the old groupId of the dragged shape to check if we need to clean up
        const draggedShape = sortedByZDesc[draggedIndex];
        const oldGroupId = draggedShape.groupId;

        // Remove dragged item and insert at target position
        const reordered = [...sortedByZDesc];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, removed);

        // Reassign zIndex values based on new order (descending order in array = higher zIndex)
        // Also update groupId for the dragged shape
        const newShapes = prev.shapes.map((shape) => {
          const newPosition = reordered.findIndex((s) => s.id === shape.id);
          // First item in array (index 0) should have highest zIndex
          const newZIndex = reordered.length - 1 - newPosition;

          if (shape.id === draggedId) {
            // Update both zIndex and groupId for the dragged shape
            return { ...shape, zIndex: newZIndex, groupId: targetGroupId || undefined };
          }
          return { ...shape, zIndex: newZIndex };
        });

        // Clean up empty groups if the dragged shape left its old group
        let newGroups = prev.groups;
        if (oldGroupId && oldGroupId !== targetGroupId) {
          // Check if old group is now empty
          const shapesStillInOldGroup = newShapes.filter((s) => s.groupId === oldGroupId);
          if (shapesStillInOldGroup.length === 0) {
            newGroups = prev.groups.filter((g) => g.id !== oldGroupId);
          }
        }

        return { ...prev, shapes: newShapes, groups: newGroups };
      });
    },
    [setCanvasState]
  );

  const moveGroup = useCallback(
    (groupId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      setCanvasState((prev) => {
        const group = prev.groups.find((g) => g.id === groupId);
        if (!group) return prev;

        // Get shapes in this group
        const shapesInGroup = prev.shapes.filter((s) => s.groupId === groupId);
        if (shapesInGroup.length === 0) return prev;

        // Calculate group's effective zIndex (max of its shapes)
        const groupMaxZ = Math.max(...shapesInGroup.map((s) => s.zIndex));
        const groupMinZ = Math.min(...shapesInGroup.map((s) => s.zIndex));

        // Build a unified list of "top-level items" for ordering
        type TopLevelItem =
          | { type: 'group'; groupId: string; maxZIndex: number; minZIndex: number }
          | { type: 'ungrouped-shape'; shapeId: string; zIndex: number };

        const topLevelItems: TopLevelItem[] = [];

        // Add all groups
        for (const g of prev.groups) {
          const gShapes = prev.shapes.filter((s) => s.groupId === g.id);
          if (gShapes.length === 0) continue;
          const maxZ = Math.max(...gShapes.map((s) => s.zIndex));
          const minZ = Math.min(...gShapes.map((s) => s.zIndex));
          topLevelItems.push({ type: 'group', groupId: g.id, maxZIndex: maxZ, minZIndex: minZ });
        }

        // Add ungrouped shapes
        for (const s of prev.shapes) {
          if (!s.groupId) {
            topLevelItems.push({ type: 'ungrouped-shape', shapeId: s.id, zIndex: s.zIndex });
          }
        }

        // Sort by zIndex descending (highest first)
        topLevelItems.sort((a, b) => {
          const aZ = a.type === 'group' ? a.maxZIndex : a.zIndex;
          const bZ = b.type === 'group' ? b.maxZIndex : b.zIndex;
          return bZ - aZ;
        });

        // Find current group's position
        const currentIndex = topLevelItems.findIndex(
          (item) => item.type === 'group' && item.groupId === groupId
        );
        if (currentIndex === -1) return prev;

        let newShapes = prev.shapes;

        if (direction === 'up' && currentIndex > 0) {
          // Move group above the item at currentIndex - 1
          const itemAbove = topLevelItems[currentIndex - 1];
          if (itemAbove.type === 'group') {
            // Swap with another group: swap all their zIndex ranges
            const aboveMaxZ = itemAbove.maxZIndex;
            const aboveMinZ = itemAbove.minZIndex;
            const groupRange = groupMaxZ - groupMinZ;
            const aboveRange = aboveMaxZ - aboveMinZ;

            // Move our group to above's position, and above group to our position
            newShapes = prev.shapes.map((s) => {
              if (s.groupId === groupId) {
                // Shift to take above's position (higher zIndex)
                const offset = s.zIndex - groupMinZ;
                return { ...s, zIndex: aboveMaxZ - groupRange + offset + aboveRange + 1 };
              }
              if (s.groupId === itemAbove.groupId) {
                // Shift down to our old position
                const offset = s.zIndex - aboveMinZ;
                return { ...s, zIndex: groupMinZ + offset };
              }
              return s;
            });
          } else {
            // Swap with ungrouped shape: give group higher zIndex
            const shapeAboveZ = itemAbove.zIndex;
            const zDiff = shapeAboveZ - groupMaxZ;
            newShapes = prev.shapes.map((s) => {
              if (s.groupId === groupId) {
                return { ...s, zIndex: s.zIndex + zDiff + 1 };
              }
              if (s.id === itemAbove.shapeId) {
                return { ...s, zIndex: groupMinZ - 1 };
              }
              return s;
            });
          }
        } else if (direction === 'down' && currentIndex < topLevelItems.length - 1) {
          // Move group below the item at currentIndex + 1
          const itemBelow = topLevelItems[currentIndex + 1];
          if (itemBelow.type === 'group') {
            // Swap with another group
            const belowMaxZ = itemBelow.maxZIndex;
            const belowMinZ = itemBelow.minZIndex;
            const groupRange = groupMaxZ - groupMinZ;
            const belowRange = belowMaxZ - belowMinZ;

            newShapes = prev.shapes.map((s) => {
              if (s.groupId === groupId) {
                // Shift down to below's position
                const offset = s.zIndex - groupMinZ;
                return { ...s, zIndex: belowMinZ + offset };
              }
              if (s.groupId === itemBelow.groupId) {
                // Shift up to our old position
                const offset = s.zIndex - belowMinZ;
                return { ...s, zIndex: groupMaxZ - belowRange + offset + groupRange + 1 };
              }
              return s;
            });
          } else {
            // Swap with ungrouped shape
            const shapeBelowZ = itemBelow.zIndex;
            const zDiff = groupMinZ - shapeBelowZ;
            newShapes = prev.shapes.map((s) => {
              if (s.groupId === groupId) {
                return { ...s, zIndex: s.zIndex - zDiff - 1 };
              }
              if (s.id === itemBelow.shapeId) {
                return { ...s, zIndex: groupMaxZ + 1 };
              }
              return s;
            });
          }
        } else if (direction === 'top' && currentIndex > 0) {
          // Move to very top: reorder so group shapes have highest zIndices
          const groupShapes = prev.shapes
            .filter((s) => s.groupId === groupId)
            .sort((a, b) => a.zIndex - b.zIndex);
          const otherShapes = prev.shapes
            .filter((s) => s.groupId !== groupId)
            .sort((a, b) => a.zIndex - b.zIndex);
          // Reassign zIndices: others get 0..n-1, group gets n..n+m-1
          const reordered = [...otherShapes, ...groupShapes];
          newShapes = prev.shapes.map((shape) => ({
            ...shape,
            zIndex: reordered.findIndex((s) => s.id === shape.id),
          }));
        } else if (direction === 'bottom' && currentIndex < topLevelItems.length - 1) {
          // Move to very bottom: reorder so group shapes have lowest zIndices
          const groupShapes = prev.shapes
            .filter((s) => s.groupId === groupId)
            .sort((a, b) => a.zIndex - b.zIndex);
          const otherShapes = prev.shapes
            .filter((s) => s.groupId !== groupId)
            .sort((a, b) => a.zIndex - b.zIndex);
          // Reassign zIndices: group gets 0..m-1, others get m..m+n-1
          const reordered = [...groupShapes, ...otherShapes];
          newShapes = prev.shapes.map((shape) => ({
            ...shape,
            zIndex: reordered.findIndex((s) => s.id === shape.id),
          }));
        } else {
          return prev;
        }

        // Normalize to ensure unique, sequential zIndices
        newShapes = normalizeZIndices(newShapes);

        return { ...prev, shapes: newShapes };
      });
    },
    [setCanvasState]
  );

  const reorderGroup = useCallback(
    (draggedGroupId: string, targetTopLevelIndex: number) => {
      setCanvasState((prev) => {
        const group = prev.groups.find((g) => g.id === draggedGroupId);
        if (!group) return prev;

        // Get shapes in the dragged group
        const shapesInGroup = prev.shapes.filter((s) => s.groupId === draggedGroupId);
        if (shapesInGroup.length === 0) return prev;

        // Build a unified list of "top-level items" for ordering (same logic as LayerPanel)
        type TopLevelItem =
          | { type: 'group'; groupId: string; maxZIndex: number; minZIndex: number; shapeIds: string[] }
          | { type: 'ungrouped-shape'; shapeId: string; zIndex: number };

        const topLevelItems: TopLevelItem[] = [];

        // Add all groups
        for (const g of prev.groups) {
          const gShapes = prev.shapes.filter((s) => s.groupId === g.id);
          if (gShapes.length === 0) continue;
          const maxZ = Math.max(...gShapes.map((s) => s.zIndex));
          const minZ = Math.min(...gShapes.map((s) => s.zIndex));
          topLevelItems.push({
            type: 'group',
            groupId: g.id,
            maxZIndex: maxZ,
            minZIndex: minZ,
            shapeIds: gShapes.map((s) => s.id),
          });
        }

        // Add ungrouped shapes
        for (const s of prev.shapes) {
          if (!s.groupId) {
            topLevelItems.push({ type: 'ungrouped-shape', shapeId: s.id, zIndex: s.zIndex });
          }
        }

        // Sort by zIndex descending (highest first)
        topLevelItems.sort((a, b) => {
          const aZ = a.type === 'group' ? a.maxZIndex : a.zIndex;
          const bZ = b.type === 'group' ? b.maxZIndex : b.zIndex;
          return bZ - aZ;
        });

        // Find the dragged group's current position
        const currentIndex = topLevelItems.findIndex(
          (item) => item.type === 'group' && item.groupId === draggedGroupId
        );
        if (currentIndex === -1 || currentIndex === targetTopLevelIndex) return prev;

        // Remove dragged group and insert at target position
        const reordered = [...topLevelItems];
        const [removed] = reordered.splice(currentIndex, 1);
        reordered.splice(targetTopLevelIndex, 0, removed);

        // Reassign zIndex values based on new order
        // Each top-level item gets a range of zIndex values
        let currentZ = reordered.length * 10; // Start high and go down
        const newZIndexMap = new Map<string, number>();

        for (const item of reordered) {
          if (item.type === 'group') {
            // Assign consecutive zIndex values to shapes in the group
            const groupShapes = prev.shapes.filter((s) => s.groupId === item.groupId);
            // Preserve relative order within group
            const sortedGroupShapes = [...groupShapes].sort((a, b) => b.zIndex - a.zIndex);
            for (const shape of sortedGroupShapes) {
              newZIndexMap.set(shape.id, currentZ--);
            }
          } else {
            newZIndexMap.set(item.shapeId, currentZ--);
          }
        }

        // Apply new zIndex values
        const newShapes = prev.shapes.map((shape) => {
          const newZ = newZIndexMap.get(shape.id);
          if (newZ !== undefined && newZ !== shape.zIndex) {
            return { ...shape, zIndex: newZ };
          }
          return shape;
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

  // Mirror shapes horizontally (flip left/right)
  const mirrorHorizontal = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      setCanvasState((prev) => {
        const shapesToMirror = prev.shapes.filter((s) => ids.includes(s.id));
        if (shapesToMirror.length === 0) return prev;

        const updates = new Map<string, Partial<Shape>>();

        if (shapesToMirror.length === 1) {
          // Single shape: just toggle flipX
          const shape = shapesToMirror[0];
          updates.set(shape.id, { flipX: !shape.flipX });
        } else {
          // Multiple shapes: mirror positions around group center and toggle flipX
          // Calculate bounding box of all selected shapes
          let minX = Infinity, maxX = -Infinity;
          for (const shape of shapesToMirror) {
            minX = Math.min(minX, shape.x);
            maxX = Math.max(maxX, shape.x + shape.size);
          }
          const centerX = (minX + maxX) / 2;

          // Mirror each shape's position around the center X axis
          for (const shape of shapesToMirror) {
            const shapeCenterX = shape.x + shape.size / 2;
            const newShapeCenterX = centerX + (centerX - shapeCenterX);
            const newX = newShapeCenterX - shape.size / 2;

            updates.set(shape.id, {
              x: newX,
              flipX: !shape.flipX,
            });
          }
        }

        return {
          ...prev,
          shapes: prev.shapes.map((s) => {
            const shapeUpdates = updates.get(s.id);
            return shapeUpdates ? { ...s, ...shapeUpdates } : s;
          }),
        };
      });
    },
    [setCanvasState]
  );

  // Mirror shapes vertically (flip up/down)
  const mirrorVertical = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      setCanvasState((prev) => {
        const shapesToMirror = prev.shapes.filter((s) => ids.includes(s.id));
        if (shapesToMirror.length === 0) return prev;

        const updates = new Map<string, Partial<Shape>>();

        if (shapesToMirror.length === 1) {
          // Single shape: just toggle flipY
          const shape = shapesToMirror[0];
          updates.set(shape.id, { flipY: !shape.flipY });
        } else {
          // Multiple shapes: mirror positions around group center and toggle flipY
          // Calculate bounding box of all selected shapes
          let minY = Infinity, maxY = -Infinity;
          for (const shape of shapesToMirror) {
            minY = Math.min(minY, shape.y);
            maxY = Math.max(maxY, shape.y + shape.size);
          }
          const centerY = (minY + maxY) / 2;

          // Mirror each shape's position around the center Y axis
          for (const shape of shapesToMirror) {
            const shapeCenterY = shape.y + shape.size / 2;
            const newShapeCenterY = centerY + (centerY - shapeCenterY);
            const newY = newShapeCenterY - shape.size / 2;

            updates.set(shape.id, {
              y: newY,
              flipY: !shape.flipY,
            });
          }
        }

        return {
          ...prev,
          shapes: prev.shapes.map((s) => {
            const shapeUpdates = updates.get(s.id);
            return shapeUpdates ? { ...s, ...shapeUpdates } : s;
          }),
        };
      });
    },
    [setCanvasState]
  );

  // Group management functions

  // Create a new group from selected shapes
  const createGroup = useCallback(
    (shapeIds: string[], groupName?: string) => {
      if (shapeIds.length === 0) return;

      setCanvasState((prev) => {
        // Generate group name if not provided
        const existingGroupNumbers = prev.groups
          .map((g) => {
            const match = g.name.match(/^Group (\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((n) => n > 0);
        const nextNumber = existingGroupNumbers.length > 0 ? Math.max(...existingGroupNumbers) + 1 : 1;
        const name = groupName || `Group ${nextNumber}`;

        // Get max group zIndex for ordering
        const maxGroupZIndex = prev.groups.length > 0
          ? Math.max(...prev.groups.map((g) => g.zIndex))
          : 0;

        const newGroup: ShapeGroup = {
          id: generateId(),
          name,
          isCollapsed: false,
          zIndex: maxGroupZIndex + 1,
        };

        // Update shapes to belong to this group
        let newShapes = prev.shapes.map((s) =>
          shapeIds.includes(s.id) ? { ...s, groupId: newGroup.id } : s
        );

        // Consolidate group's zIndices at the topmost selected position
        const groupShapes = newShapes
          .filter((s) => s.groupId === newGroup.id)
          .sort((a, b) => a.zIndex - b.zIndex);
        const otherShapes = newShapes
          .filter((s) => s.groupId !== newGroup.id)
          .sort((a, b) => a.zIndex - b.zIndex);

        // Find the max zIndex among selected shapes (topmost selected)
        const maxSelectedZIndex = Math.max(...groupShapes.map((s) => s.zIndex));

        // Reorder: shapes below topmost selected, then group, then shapes above
        const shapesBelow = otherShapes.filter((s) => s.zIndex < maxSelectedZIndex);
        const shapesAbove = otherShapes.filter((s) => s.zIndex > maxSelectedZIndex);

        const reordered = [...shapesBelow, ...groupShapes, ...shapesAbove];
        newShapes = newShapes.map((shape) => ({
          ...shape,
          zIndex: reordered.findIndex((s) => s.id === shape.id),
        }));

        return {
          ...prev,
          shapes: newShapes,
          groups: [...prev.groups, newGroup],
        };
      });
    },
    [setCanvasState]
  );

  // Delete a group (shapes remain but become ungrouped)
  const deleteGroup = useCallback(
    (groupId: string) => {
      setCanvasState((prev) => {
        // Remove group membership from shapes
        const newShapes = prev.shapes.map((s) =>
          s.groupId === groupId ? { ...s, groupId: undefined } : s
        );

        // Remove the group
        const newGroups = prev.groups.filter((g) => g.id !== groupId);

        return {
          ...prev,
          shapes: newShapes,
          groups: newGroups,
        };
      });
    },
    [setCanvasState]
  );

  // Ungroup shapes (remove from group without deleting the group if other shapes remain)
  const ungroupShapes = useCallback(
    (shapeIds: string[]) => {
      setCanvasState((prev) => {
        // Find groups that will become empty
        const affectedGroupIds = new Set<string>();
        for (const shape of prev.shapes) {
          if (shapeIds.includes(shape.id) && shape.groupId) {
            affectedGroupIds.add(shape.groupId);
          }
        }

        // Remove group membership from specified shapes
        let newShapes = prev.shapes.map((s) =>
          shapeIds.includes(s.id) ? { ...s, groupId: undefined } : s
        );

        // Consolidate ungrouped shapes' zIndices so they stay together at the group's position
        const ungroupedShapeIds = new Set(shapeIds);
        const ungroupedShapes = newShapes
          .filter((s) => ungroupedShapeIds.has(s.id))
          .sort((a, b) => a.zIndex - b.zIndex);
        const otherShapes = newShapes
          .filter((s) => !ungroupedShapeIds.has(s.id))
          .sort((a, b) => a.zIndex - b.zIndex);

        // Find where ungrouped shapes should be inserted (at their max zIndex position)
        const maxUngroupedZ = Math.max(...ungroupedShapes.map((s) => s.zIndex));
        const insertIndex = otherShapes.filter((s) => s.zIndex <= maxUngroupedZ).length;

        // Rebuild array: shapes below, ungrouped shapes, shapes above
        const reordered = [
          ...otherShapes.slice(0, insertIndex),
          ...ungroupedShapes,
          ...otherShapes.slice(insertIndex),
        ];
        newShapes = newShapes.map((shape) => ({
          ...shape,
          zIndex: reordered.findIndex((s) => s.id === shape.id),
        }));

        // Check which groups would be empty after ungrouping
        const groupsToRemove = new Set<string>();
        for (const groupId of affectedGroupIds) {
          const remainingShapesInGroup = newShapes.filter((s) => s.groupId === groupId);
          if (remainingShapesInGroup.length === 0) {
            groupsToRemove.add(groupId);
          }
        }

        // Remove empty groups
        const newGroups = prev.groups.filter((g) => !groupsToRemove.has(g.id));

        return {
          ...prev,
          shapes: newShapes,
          groups: newGroups,
        };
      });
    },
    [setCanvasState]
  );

  // Rename a group
  const renameGroup = useCallback(
    (groupId: string, newName: string) => {
      setCanvasState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, name: newName } : g
        ),
      }));
    },
    [setCanvasState]
  );

  // Toggle group collapsed state
  const toggleGroupCollapsed = useCallback(
    (groupId: string) => {
      setCanvasState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
        ),
      }), false); // Don't add to history - UI state only
    },
    [setCanvasState]
  );

  // Move shapes to a group
  const moveToGroup = useCallback(
    (shapeIds: string[], groupId: string | null) => {
      setCanvasState((prev) => {
        // Update shapes with new group
        const newShapes = prev.shapes.map((s) =>
          shapeIds.includes(s.id) ? { ...s, groupId: groupId || undefined } : s
        );

        // Check for empty groups to remove
        const groupsWithShapes = new Set<string>();
        for (const shape of newShapes) {
          if (shape.groupId) {
            groupsWithShapes.add(shape.groupId);
          }
        }

        // Remove empty groups
        const newGroups = prev.groups.filter((g) => groupsWithShapes.has(g.id));

        return {
          ...prev,
          shapes: newShapes,
          groups: newGroups,
        };
      });
    },
    [setCanvasState]
  );

  // Select all shapes in a group
  const selectGroup = useCallback(
    (groupId: string, options?: { toggle?: boolean }) => {
      const { toggle = false } = options || {};
      setCanvasState((prev) => {
        const shapeIdsInGroup = prev.shapes
          .filter((s) => s.groupId === groupId)
          .map((s) => s.id);

        if (toggle) {
          // Add group's shapes to current selection (or remove if all already selected)
          const newSelectedIds = new Set(prev.selectedShapeIds);
          const allAlreadySelected = shapeIdsInGroup.every((id) => newSelectedIds.has(id));

          if (allAlreadySelected) {
            // Remove all shapes in group from selection
            for (const id of shapeIdsInGroup) {
              newSelectedIds.delete(id);
            }
          } else {
            // Add all shapes in group to selection
            for (const id of shapeIdsInGroup) {
              newSelectedIds.add(id);
            }
          }

          return {
            ...prev,
            selectedShapeIds: newSelectedIds,
          };
        }

        // Default: replace selection with group's shapes
        return {
          ...prev,
          selectedShapeIds: new Set(shapeIdsInGroup),
        };
      }, false); // Selection changes don't go into history
    },
    [setCanvasState]
  );

  // Get shapes in a group (helper for LayerPanel)
  const getShapesInGroup = useCallback(
    (groupId: string): Shape[] => {
      return canvasState.shapes.filter((s) => s.groupId === groupId);
    },
    [canvasState.shapes]
  );

  // Load canvas state from an external source (e.g., a submission from the server)
  // This is used to sync artwork across devices when logging in
  const loadCanvasState = useCallback(
    (shapes: Shape[], groups: ShapeGroup[], backgroundColorIndex: 0 | 1 | null) => {
      const newState: CanvasState = {
        shapes,
        groups,
        backgroundColorIndex,
        selectedShapeIds: new Set<string>(),
      };

      // Reset history when loading external state
      resetHistory(newState);

      setCanvasStateInternal(newState);

      // Also save to localStorage immediately
      saveToStorage({
        date: getTodayDateUTC(),
        userId: userIdRef.current,
        canvas: newState,
      });
    },
    [resetHistory]
  );

  return {
    canvasState,
    addShape,
    duplicateShape,
    duplicateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    deleteSelectedShapes,
    selectShape,
    moveLayer,
    moveGroup,
    reorderLayers,
    reorderGroup,
    setBackgroundColor,
    resetCanvas,
    mirrorHorizontal,
    mirrorVertical,
    undo,
    redo,
    canUndo,
    canRedo,
    commitToHistory,
    // Group management
    createGroup,
    deleteGroup,
    ungroupShapes,
    renameGroup,
    toggleGroupCollapsed,
    moveToGroup,
    selectGroup,
    getShapesInGroup,
    // External loading
    loadCanvasState,
  };
}
