import { useCallback } from 'react';
import type { Shape, ShapeGroup, CanvasState, DailyChallenge } from '../../types';
import { generateId } from '../../utils/shapes';

type SetCanvasState = (
  updater: CanvasState | ((prev: CanvasState) => CanvasState),
  addToHistory?: boolean,
  label?: string
) => void;

/** Helper to ensure all shapes have unique, sequential zIndices. */
function normalizeZIndices(shapes: Shape[]): Shape[] {
  const sorted = [...shapes].sort(
    (a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id)
  );
  return shapes.map((shape) => ({
    ...shape,
    zIndex: sorted.findIndex((s) => s.id === shape.id),
  }));
}

/**
 * Hook that manages shape CRUD: add, remove, update, duplicate, reorder, mirror, groups.
 * Does NOT push history directly — the orchestrator controls history via setCanvasState.
 */
export function useShapeOperations(
  challenge: DailyChallenge | null,
  setCanvasState: SetCanvasState,
) {
  const addShape = useCallback(
    (shapeIndex: number, colorIndex: number) => {
      if (!challenge) return;

      setCanvasState((prev) => {
        const maxZIndex = Math.max(0, ...prev.shapes.map((s) => s.zIndex));

        const shapeLetter = shapeIndex === 0 ? 'A' : 'B';
        const totalCount = prev.shapes.length + 1;
        const defaultName = `${shapeLetter}${totalCount}`;

        const newShape: Shape = {
          id: generateId(),
          type: challenge.shapes[shapeIndex].type,
          name: defaultName,
          x: 350,
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
      }, true, 'Add shape');
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
        const shapeIndex = challenge ? challenge.shapes.findIndex(s => s.type === shape.type) : 0;
        const shapeLetter = shapeIndex === 0 ? 'A' : 'B';

        const newShape: Shape = {
          ...shape,
          id: generateId(),
          name: `${shapeLetter}${totalCount}`,
          x: shape.x + 20,
          y: shape.y + 20,
          zIndex: maxZIndex + 1,
        };

        return {
          ...prev,
          shapes: [...prev.shapes, newShape],
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
        const shapesToDuplicate = prev.shapes.filter((s) => ids.includes(s.id));
        if (shapesToDuplicate.length === 0) return prev;

        let maxZIndex = Math.max(0, ...prev.shapes.map((s) => s.zIndex));
        let currentCount = prev.shapes.length;
        const newShapes: Shape[] = [];
        const newSelectedIds: string[] = [];

        for (const shape of shapesToDuplicate) {
          currentCount++;
          maxZIndex++;
          const shapeIndex = challenge ? challenge.shapes.findIndex(s => s.type === shape.type) : 0;
          const shapeLetter = shapeIndex === 0 ? 'A' : 'B';

          const newShape: Shape = {
            ...shape,
            id: generateId(),
            name: `${shapeLetter}${currentCount}`,
            x: shape.x + 20,
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

  const selectShape = useCallback(
    (id: string | null, options?: { toggle?: boolean; range?: boolean; orderedIds?: string[] }) => {
      const { toggle = false, range = false, orderedIds = [] } = options || {};
      setCanvasState(
        (prev) => {
          if (id === null) {
            return { ...prev, selectedShapeIds: new Set<string>() };
          }

          if (toggle) {
            const newSelectedIds = new Set(prev.selectedShapeIds);
            if (newSelectedIds.has(id)) {
              newSelectedIds.delete(id);
            } else {
              newSelectedIds.add(id);
            }
            return { ...prev, selectedShapeIds: newSelectedIds };
          }

          if (range && orderedIds.length > 0) {
            const currentlySelected = Array.from(prev.selectedShapeIds);
            let anchorIndex = -1;

            for (let i = 0; i < orderedIds.length; i++) {
              if (currentlySelected.includes(orderedIds[i])) {
                anchorIndex = i;
                break;
              }
            }

            if (anchorIndex === -1) {
              return { ...prev, selectedShapeIds: new Set([id]) };
            }

            const targetIndex = orderedIds.indexOf(id);
            if (targetIndex === -1) return prev;

            const startIndex = Math.min(anchorIndex, targetIndex);
            const endIndex = Math.max(anchorIndex, targetIndex);
            const rangeIds = orderedIds.slice(startIndex, endIndex + 1);

            return { ...prev, selectedShapeIds: new Set(rangeIds) };
          }

          return { ...prev, selectedShapeIds: new Set([id]) };
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
          const maxZ = sortedByZ[sortedByZ.length - 1].zIndex;
          newShapes = prev.shapes.map((s) =>
            s.id === id ? { ...s, zIndex: maxZ + 1 } : s
          );
        } else if (direction === 'bottom' && currentIndex > 0) {
          const minZ = sortedByZ[0].zIndex;
          newShapes = prev.shapes.map((s) =>
            s.id === id ? { ...s, zIndex: minZ - 1 } : s
          );
        } else {
          return prev;
        }

        return { ...prev, shapes: newShapes };
      }, true, 'Reorder');
    },
    [setCanvasState]
  );

  const reorderLayers = useCallback(
    (draggedId: string, targetIndex: number, targetGroupId: string | null) => {
      setCanvasState((prev) => {
        const sortedByZDesc = [...prev.shapes].sort((a, b) => b.zIndex - a.zIndex);
        const draggedIndex = sortedByZDesc.findIndex((s) => s.id === draggedId);

        if (draggedIndex === -1 || draggedIndex === targetIndex) return prev;

        const draggedShape = sortedByZDesc[draggedIndex];
        const oldGroupId = draggedShape.groupId;

        const reordered = [...sortedByZDesc];
        const [removed] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, removed);

        const newShapes = prev.shapes.map((shape) => {
          const newPosition = reordered.findIndex((s) => s.id === shape.id);
          const newZIndex = reordered.length - 1 - newPosition;

          if (shape.id === draggedId) {
            return { ...shape, zIndex: newZIndex, groupId: targetGroupId || undefined };
          }
          return { ...shape, zIndex: newZIndex };
        });

        let newGroups = prev.groups;
        if (oldGroupId && oldGroupId !== targetGroupId) {
          const shapesStillInOldGroup = newShapes.filter((s) => s.groupId === oldGroupId);
          if (shapesStillInOldGroup.length === 0) {
            newGroups = prev.groups.filter((g) => g.id !== oldGroupId);
          }
        }

        return { ...prev, shapes: newShapes, groups: newGroups };
      }, true, 'Reorder');
    },
    [setCanvasState]
  );

  const moveGroup = useCallback(
    (groupId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
      setCanvasState((prev) => {
        const group = prev.groups.find((g) => g.id === groupId);
        if (!group) return prev;

        const shapesInGroup = prev.shapes.filter((s) => s.groupId === groupId);
        if (shapesInGroup.length === 0) return prev;

        const groupMaxZ = Math.max(...shapesInGroup.map((s) => s.zIndex));
        const groupMinZ = Math.min(...shapesInGroup.map((s) => s.zIndex));

        type TopLevelItem =
          | { type: 'group'; groupId: string; maxZIndex: number; minZIndex: number }
          | { type: 'ungrouped-shape'; shapeId: string; zIndex: number };

        const topLevelItems: TopLevelItem[] = [];

        for (const g of prev.groups) {
          const gShapes = prev.shapes.filter((s) => s.groupId === g.id);
          if (gShapes.length === 0) continue;
          const maxZ = Math.max(...gShapes.map((s) => s.zIndex));
          const minZ = Math.min(...gShapes.map((s) => s.zIndex));
          topLevelItems.push({ type: 'group', groupId: g.id, maxZIndex: maxZ, minZIndex: minZ });
        }

        for (const s of prev.shapes) {
          if (!s.groupId) {
            topLevelItems.push({ type: 'ungrouped-shape', shapeId: s.id, zIndex: s.zIndex });
          }
        }

        topLevelItems.sort((a, b) => {
          const aZ = a.type === 'group' ? a.maxZIndex : a.zIndex;
          const bZ = b.type === 'group' ? b.maxZIndex : b.zIndex;
          return bZ - aZ;
        });

        const currentIndex = topLevelItems.findIndex(
          (item) => item.type === 'group' && item.groupId === groupId
        );
        if (currentIndex === -1) return prev;

        let newShapes = prev.shapes;

        if (direction === 'up' && currentIndex > 0) {
          const itemAbove = topLevelItems[currentIndex - 1];
          if (itemAbove.type === 'group') {
            const aboveMaxZ = itemAbove.maxZIndex;
            const aboveMinZ = itemAbove.minZIndex;
            const groupRange = groupMaxZ - groupMinZ;
            const aboveRange = aboveMaxZ - aboveMinZ;

            newShapes = prev.shapes.map((s) => {
              if (s.groupId === groupId) {
                const offset = s.zIndex - groupMinZ;
                return { ...s, zIndex: aboveMaxZ - groupRange + offset + aboveRange + 1 };
              }
              if (s.groupId === itemAbove.groupId) {
                const offset = s.zIndex - aboveMinZ;
                return { ...s, zIndex: groupMinZ + offset };
              }
              return s;
            });
          } else {
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
          const itemBelow = topLevelItems[currentIndex + 1];
          if (itemBelow.type === 'group') {
            const belowMaxZ = itemBelow.maxZIndex;
            const belowMinZ = itemBelow.minZIndex;
            const groupRange = groupMaxZ - groupMinZ;
            const belowRange = belowMaxZ - belowMinZ;

            newShapes = prev.shapes.map((s) => {
              if (s.groupId === groupId) {
                const offset = s.zIndex - groupMinZ;
                return { ...s, zIndex: belowMinZ + offset };
              }
              if (s.groupId === itemBelow.groupId) {
                const offset = s.zIndex - belowMinZ;
                return { ...s, zIndex: groupMaxZ - belowRange + offset + groupRange + 1 };
              }
              return s;
            });
          } else {
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
          const groupShapes = prev.shapes
            .filter((s) => s.groupId === groupId)
            .sort((a, b) => a.zIndex - b.zIndex);
          const otherShapes = prev.shapes
            .filter((s) => s.groupId !== groupId)
            .sort((a, b) => a.zIndex - b.zIndex);
          const reordered = [...otherShapes, ...groupShapes];
          newShapes = prev.shapes.map((shape) => ({
            ...shape,
            zIndex: reordered.findIndex((s) => s.id === shape.id),
          }));
        } else if (direction === 'bottom' && currentIndex < topLevelItems.length - 1) {
          const groupShapes = prev.shapes
            .filter((s) => s.groupId === groupId)
            .sort((a, b) => a.zIndex - b.zIndex);
          const otherShapes = prev.shapes
            .filter((s) => s.groupId !== groupId)
            .sort((a, b) => a.zIndex - b.zIndex);
          const reordered = [...groupShapes, ...otherShapes];
          newShapes = prev.shapes.map((shape) => ({
            ...shape,
            zIndex: reordered.findIndex((s) => s.id === shape.id),
          }));
        } else {
          return prev;
        }

        newShapes = normalizeZIndices(newShapes);

        return { ...prev, shapes: newShapes };
      }, true, 'Reorder');
    },
    [setCanvasState]
  );

  const reorderGroup = useCallback(
    (draggedGroupId: string, targetTopLevelIndex: number) => {
      setCanvasState((prev) => {
        const group = prev.groups.find((g) => g.id === draggedGroupId);
        if (!group) return prev;

        const shapesInGroup = prev.shapes.filter((s) => s.groupId === draggedGroupId);
        if (shapesInGroup.length === 0) return prev;

        type TopLevelItem =
          | { type: 'group'; groupId: string; maxZIndex: number; minZIndex: number; shapeIds: string[] }
          | { type: 'ungrouped-shape'; shapeId: string; zIndex: number };

        const topLevelItems: TopLevelItem[] = [];

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

        for (const s of prev.shapes) {
          if (!s.groupId) {
            topLevelItems.push({ type: 'ungrouped-shape', shapeId: s.id, zIndex: s.zIndex });
          }
        }

        topLevelItems.sort((a, b) => {
          const aZ = a.type === 'group' ? a.maxZIndex : a.zIndex;
          const bZ = b.type === 'group' ? b.maxZIndex : b.zIndex;
          return bZ - aZ;
        });

        const currentIndex = topLevelItems.findIndex(
          (item) => item.type === 'group' && item.groupId === draggedGroupId
        );
        if (currentIndex === -1 || currentIndex === targetTopLevelIndex) return prev;

        const reordered = [...topLevelItems];
        const [removed] = reordered.splice(currentIndex, 1);
        reordered.splice(targetTopLevelIndex, 0, removed);

        let currentZ = reordered.length * 10;
        const newZIndexMap = new Map<string, number>();

        for (const item of reordered) {
          if (item.type === 'group') {
            const groupShapes = prev.shapes.filter((s) => s.groupId === item.groupId);
            const sortedGroupShapes = [...groupShapes].sort((a, b) => b.zIndex - a.zIndex);
            for (const shape of sortedGroupShapes) {
              newZIndexMap.set(shape.id, currentZ--);
            }
          } else {
            newZIndexMap.set(item.shapeId, currentZ--);
          }
        }

        const newShapes = prev.shapes.map((shape) => {
          const newZ = newZIndexMap.get(shape.id);
          if (newZ !== undefined && newZ !== shape.zIndex) {
            return { ...shape, zIndex: newZ };
          }
          return shape;
        });

        return { ...prev, shapes: newShapes };
      }, true, 'Reorder');
    },
    [setCanvasState]
  );

  const setBackgroundColor = useCallback(
    (colorIndex: number | null) => {
      setCanvasState((prev) => ({ ...prev, backgroundColorIndex: colorIndex }), true, 'Background');
    },
    [setCanvasState]
  );

  const mirrorHorizontal = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      setCanvasState((prev) => {
        const shapesToMirror = prev.shapes.filter((s) => ids.includes(s.id));
        if (shapesToMirror.length === 0) return prev;

        const updates = new Map<string, Partial<Shape>>();

        if (shapesToMirror.length === 1) {
          const shape = shapesToMirror[0];
          updates.set(shape.id, { flipX: !shape.flipX });
        } else {
          let minX = Infinity, maxX = -Infinity;
          for (const shape of shapesToMirror) {
            minX = Math.min(minX, shape.x);
            maxX = Math.max(maxX, shape.x + shape.size);
          }
          const centerX = (minX + maxX) / 2;

          for (const shape of shapesToMirror) {
            const shapeCenterX = shape.x + shape.size / 2;
            const newShapeCenterX = centerX + (centerX - shapeCenterX);
            const newX = newShapeCenterX - shape.size / 2;

            updates.set(shape.id, { x: newX, flipX: !shape.flipX });
          }
        }

        return {
          ...prev,
          shapes: prev.shapes.map((s) => {
            const shapeUpdates = updates.get(s.id);
            return shapeUpdates ? { ...s, ...shapeUpdates } : s;
          }),
        };
      }, true, 'Mirror');
    },
    [setCanvasState]
  );

  const mirrorVertical = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      setCanvasState((prev) => {
        const shapesToMirror = prev.shapes.filter((s) => ids.includes(s.id));
        if (shapesToMirror.length === 0) return prev;

        const updates = new Map<string, Partial<Shape>>();

        if (shapesToMirror.length === 1) {
          const shape = shapesToMirror[0];
          updates.set(shape.id, { flipY: !shape.flipY });
        } else {
          let minY = Infinity, maxY = -Infinity;
          for (const shape of shapesToMirror) {
            minY = Math.min(minY, shape.y);
            maxY = Math.max(maxY, shape.y + shape.size);
          }
          const centerY = (minY + maxY) / 2;

          for (const shape of shapesToMirror) {
            const shapeCenterY = shape.y + shape.size / 2;
            const newShapeCenterY = centerY + (centerY - shapeCenterY);
            const newY = newShapeCenterY - shape.size / 2;

            updates.set(shape.id, { y: newY, flipY: !shape.flipY });
          }
        }

        return {
          ...prev,
          shapes: prev.shapes.map((s) => {
            const shapeUpdates = updates.get(s.id);
            return shapeUpdates ? { ...s, ...shapeUpdates } : s;
          }),
        };
      }, true, 'Mirror');
    },
    [setCanvasState]
  );

  // Group management

  const createGroup = useCallback(
    (shapeIds: string[], groupName?: string) => {
      if (shapeIds.length === 0) return;

      setCanvasState((prev) => {
        const existingGroupNumbers = prev.groups
          .map((g) => {
            const match = g.name.match(/^Group (\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((n) => n > 0);
        const nextNumber = existingGroupNumbers.length > 0 ? Math.max(...existingGroupNumbers) + 1 : 1;
        const name = groupName || `Group ${nextNumber}`;

        const maxGroupZIndex = prev.groups.length > 0
          ? Math.max(...prev.groups.map((g) => g.zIndex))
          : 0;

        const newGroup: ShapeGroup = {
          id: generateId(),
          name,
          isCollapsed: false,
          zIndex: maxGroupZIndex + 1,
        };

        let newShapes = prev.shapes.map((s) =>
          shapeIds.includes(s.id) ? { ...s, groupId: newGroup.id } : s
        );

        const groupShapes = newShapes
          .filter((s) => s.groupId === newGroup.id)
          .sort((a, b) => a.zIndex - b.zIndex);
        const otherShapes = newShapes
          .filter((s) => s.groupId !== newGroup.id)
          .sort((a, b) => a.zIndex - b.zIndex);

        const maxSelectedZIndex = Math.max(...groupShapes.map((s) => s.zIndex));

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
      }, true, 'Group');
    },
    [setCanvasState]
  );

  const deleteGroup = useCallback(
    (groupId: string) => {
      setCanvasState((prev) => {
        const newShapes = prev.shapes.map((s) =>
          s.groupId === groupId ? { ...s, groupId: undefined } : s
        );
        const newGroups = prev.groups.filter((g) => g.id !== groupId);

        return { ...prev, shapes: newShapes, groups: newGroups };
      }, true, 'Ungroup');
    },
    [setCanvasState]
  );

  const ungroupShapes = useCallback(
    (shapeIds: string[]) => {
      setCanvasState((prev) => {
        const affectedGroupIds = new Set<string>();
        for (const shape of prev.shapes) {
          if (shapeIds.includes(shape.id) && shape.groupId) {
            affectedGroupIds.add(shape.groupId);
          }
        }

        let newShapes = prev.shapes.map((s) =>
          shapeIds.includes(s.id) ? { ...s, groupId: undefined } : s
        );

        const ungroupedShapeIds = new Set(shapeIds);
        const ungroupedShapes = newShapes
          .filter((s) => ungroupedShapeIds.has(s.id))
          .sort((a, b) => a.zIndex - b.zIndex);
        const otherShapes = newShapes
          .filter((s) => !ungroupedShapeIds.has(s.id))
          .sort((a, b) => a.zIndex - b.zIndex);

        const maxUngroupedZ = Math.max(...ungroupedShapes.map((s) => s.zIndex));
        const insertIndex = otherShapes.filter((s) => s.zIndex <= maxUngroupedZ).length;

        const reordered = [
          ...otherShapes.slice(0, insertIndex),
          ...ungroupedShapes,
          ...otherShapes.slice(insertIndex),
        ];
        newShapes = newShapes.map((shape) => ({
          ...shape,
          zIndex: reordered.findIndex((s) => s.id === shape.id),
        }));

        const groupsToRemove = new Set<string>();
        for (const gId of affectedGroupIds) {
          const remainingShapesInGroup = newShapes.filter((s) => s.groupId === gId);
          if (remainingShapesInGroup.length === 0) {
            groupsToRemove.add(gId);
          }
        }

        const newGroups = prev.groups.filter((g) => !groupsToRemove.has(g.id));

        return { ...prev, shapes: newShapes, groups: newGroups };
      }, true, 'Ungroup');
    },
    [setCanvasState]
  );

  const renameGroup = useCallback(
    (groupId: string, newName: string) => {
      setCanvasState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, name: newName } : g
        ),
      }), true, 'Rename group');
    },
    [setCanvasState]
  );

  const toggleGroupCollapsed = useCallback(
    (groupId: string) => {
      setCanvasState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
        ),
      }), false); // UI state only — no history
    },
    [setCanvasState]
  );

  const moveToGroup = useCallback(
    (shapeIds: string[], groupId: string | null) => {
      setCanvasState((prev) => {
        const newShapes = prev.shapes.map((s) =>
          shapeIds.includes(s.id) ? { ...s, groupId: groupId || undefined } : s
        );

        const groupsWithShapes = new Set<string>();
        for (const shape of newShapes) {
          if (shape.groupId) {
            groupsWithShapes.add(shape.groupId);
          }
        }

        const newGroups = prev.groups.filter((g) => groupsWithShapes.has(g.id));

        return { ...prev, shapes: newShapes, groups: newGroups };
      }, true, 'Move to group');
    },
    [setCanvasState]
  );

  const selectGroup = useCallback(
    (groupId: string, options?: { toggle?: boolean }) => {
      const { toggle = false } = options || {};
      setCanvasState((prev) => {
        const shapeIdsInGroup = prev.shapes
          .filter((s) => s.groupId === groupId)
          .map((s) => s.id);

        if (toggle) {
          const newSelectedIds = new Set(prev.selectedShapeIds);
          const allAlreadySelected = shapeIdsInGroup.every((id) => newSelectedIds.has(id));

          if (allAlreadySelected) {
            for (const id of shapeIdsInGroup) {
              newSelectedIds.delete(id);
            }
          } else {
            for (const id of shapeIdsInGroup) {
              newSelectedIds.add(id);
            }
          }

          return { ...prev, selectedShapeIds: newSelectedIds };
        }

        return { ...prev, selectedShapeIds: new Set(shapeIdsInGroup) };
      }, false); // Selection changes — no history
    },
    [setCanvasState]
  );

  return {
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
    mirrorHorizontal,
    mirrorVertical,
    createGroup,
    deleteGroup,
    ungroupShapes,
    renameGroup,
    toggleGroupCollapsed,
    moveToGroup,
    selectGroup,
  };
}
