import { useState, useMemo } from 'react';
import type { Shape, ShapeGroup } from '../../types';
import { useIsTouchDevice } from '../../hooks/ui/useIsTouchDevice';
import type { LayerPanelProps, LayerItem } from './types';
import { LayerItem as LayerItemComponent } from './LayerItem';
import { GroupHeader } from './GroupHeader';
import { LayerPanelCollapsed } from './LayerPanelCollapsed';

// Detect if user is on macOS for modifier key instructions
const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

export function LayerPanel({
  shapes,
  groups,
  selectedShapeIds,
  challenge,
  onSelectShape,
  onMoveLayer,
  onMoveGroup,
  onReorderLayers,
  onReorderGroup,
  onDeleteShape,
  onRenameShape,
  onCreateGroup,
  onDeleteGroup,
  onUngroupShapes,
  onRenameGroup,
  onToggleGroupCollapsed,
  onToggleShapeVisibility,
  onToggleGroupVisibility,
  onSelectGroup,
  isOpen,
  width,
  onToggle,
  onStartResize,
  onHoverShape,
}: LayerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_dropTargetGroupId, setDropTargetGroupId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dropTargetTopLevelIndex, setDropTargetTopLevelIndex] = useState<number | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const isTouchDevice = useIsTouchDevice();

  // Sort shapes by zIndex descending (top layer first in list)
  const sortedShapes = useMemo(() => [...shapes].sort((a, b) => b.zIndex - a.zIndex), [shapes]);

  // Organize shapes into groups and ungrouped, then build a unified ordered list
  const { layerItems, orderedIds } = useMemo(() => {
    const groupedShapes = new Map<string, Shape[]>();
    const ungroupedShapes: Shape[] = [];

    // Sort shapes into groups
    for (const shape of sortedShapes) {
      if (shape.groupId) {
        const existing = groupedShapes.get(shape.groupId) || [];
        existing.push(shape);
        groupedShapes.set(shape.groupId, existing);
      } else {
        ungroupedShapes.push(shape);
      }
    }

    // Build unified list of "top-level items" (groups or ungrouped shapes)
    // Each item has a representative zIndex for sorting
    type TopLevelItem =
      | { type: 'group'; group: ShapeGroup; shapesInGroup: Shape[]; maxZIndex: number }
      | { type: 'ungrouped-shape'; shape: Shape };

    const topLevelItems: TopLevelItem[] = [];

    // Add groups with their max zIndex
    for (const group of groups) {
      const shapesInGroup = groupedShapes.get(group.id) || [];
      if (shapesInGroup.length === 0) continue;
      const maxZIndex = Math.max(...shapesInGroup.map(s => s.zIndex));
      topLevelItems.push({ type: 'group', group, shapesInGroup, maxZIndex });
    }

    // Add ungrouped shapes
    for (const shape of ungroupedShapes) {
      topLevelItems.push({ type: 'ungrouped-shape', shape });
    }

    // Sort by zIndex descending (highest first = top of layer panel)
    topLevelItems.sort((a, b) => {
      const aZ = a.type === 'group' ? a.maxZIndex : a.shape.zIndex;
      const bZ = b.type === 'group' ? b.maxZIndex : b.shape.zIndex;
      return bZ - aZ;
    });

    // Build final layer items list
    const items: LayerItem[] = [];
    const ids: string[] = [];

    for (let i = 0; i < topLevelItems.length; i++) {
      const topItem = topLevelItems[i];
      const isTopItem = i === 0;
      const isBottomItem = i === topLevelItems.length - 1;

      if (topItem.type === 'group') {
        const { group, shapesInGroup } = topItem;
        items.push({
          type: 'group-header',
          group,
          shapesInGroup,
          belongsToGroupId: group.id,
          isTopItem,
          isBottomItem,
          topLevelIndex: i,
        });

        for (const shape of shapesInGroup) {
          ids.push(shape.id);
        }

        if (!group.isCollapsed) {
          for (const shape of shapesInGroup) {
            items.push({ type: 'shape', shape, belongsToGroupId: group.id });
          }
        }
      } else {
        items.push({ type: 'shape', shape: topItem.shape });
        ids.push(topItem.shape.id);
      }
    }

    return { layerItems: items, orderedIds: ids };
  }, [sortedShapes, groups]);

  // Modifier key hint text
  const modifierKeyHint = isMac ? '⌘' : 'Ctrl';

  // Hint text varies by device type and multi-select mode
  const getLayerHint = () => {
    if (isTouchDevice) {
      return isMultiSelectMode ? 'Tap to toggle selection' : 'Tap to select';
    }
    return `Click to select, ${modifierKeyHint}+click to toggle, Shift+click to select range`;
  };

  const isTopLayer = (shape: Shape) =>
    shape.zIndex === Math.max(...shapes.map((s) => s.zIndex));
  const isBottomLayer = (shape: Shape) =>
    shape.zIndex === Math.min(...shapes.map((s) => s.zIndex));

  // Handle layer click with modifier key support
  const handleLayerClick = (e: React.MouseEvent, shapeId: string) => {
    const isToggleModifier = isMac ? e.metaKey : e.ctrlKey;
    const isRangeModifier = e.shiftKey;

    if (isTouchDevice && isMultiSelectMode) {
      onSelectShape(shapeId, { toggle: true });
    } else if (isRangeModifier) {
      onSelectShape(shapeId, { range: true, orderedIds });
    } else if (isToggleModifier) {
      onSelectShape(shapeId, { toggle: true });
    } else {
      onSelectShape(shapeId);
    }
  };

  // Handle group header click
  const handleGroupClick = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    const isToggleModifier = isMac ? e.metaKey : e.ctrlKey;
    const shouldToggle = (isTouchDevice && isMultiSelectMode) || isToggleModifier;
    onSelectGroup(groupId, { toggle: shouldToggle });
  };

  // Editing handlers
  const startEditing = (shape: Shape) => {
    setEditingId(shape.id);
    setEditingGroupId(null);
    setEditValue(shape.name);
  };

  const startEditingGroup = (group: ShapeGroup) => {
    setEditingGroupId(group.id);
    setEditingId(null);
    setEditValue(group.name);
  };

  const finishEditing = () => {
    if (editingId && editValue.trim()) {
      onRenameShape(editingId, editValue.trim());
    }
    if (editingGroupId && editValue.trim()) {
      onRenameGroup(editingGroupId, editValue.trim());
    }
    setEditingId(null);
    setEditingGroupId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingGroupId(null);
      setEditValue('');
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, shapeId: string) => {
    setDraggedId(shapeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', shapeId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetIndex(null);
    setDropTargetGroupId(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number, groupId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
    setDropTargetGroupId(groupId);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number, targetGroupId: string | null) => {
    e.preventDefault();
    const draggedShapeId = e.dataTransfer.getData('text/plain');
    if (draggedShapeId) {
      onReorderLayers(draggedShapeId, targetIndex, targetGroupId);
    }
    setDraggedId(null);
    setDropTargetIndex(null);
    setDropTargetGroupId(null);
  };

  // Group drag handlers
  const handleGroupDragStart = (e: React.DragEvent, groupId: string) => {
    setDraggedGroupId(groupId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `group:${groupId}`);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroupId(null);
    setDropTargetTopLevelIndex(null);
  };

  const handleGroupDragOver = (e: React.DragEvent, topLevelIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetTopLevelIndex(topLevelIndex);
  };

  const handleGroupDrop = (e: React.DragEvent, targetTopLevelIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('group:')) {
      const groupId = data.replace('group:', '');
      onReorderGroup(groupId, targetTopLevelIndex);
    }
    setDraggedGroupId(null);
    setDropTargetTopLevelIndex(null);
  };

  // Group action handlers
  const canCreateGroup = selectedShapeIds.size >= 2;

  const selectedShapesInGroup = useMemo(() => {
    const selectedShapes = shapes.filter((s) => selectedShapeIds.has(s.id));
    return selectedShapes.some((s) => s.groupId);
  }, [shapes, selectedShapeIds]);

  const handleCreateGroup = () => {
    if (canCreateGroup) {
      onCreateGroup(Array.from(selectedShapeIds));
    }
  };

  const handleUngroup = () => {
    if (selectedShapesInGroup) {
      onUngroupShapes(Array.from(selectedShapeIds));
    }
  };

  // Collapsed view
  if (!isOpen) {
    return <LayerPanelCollapsed onToggle={onToggle} />;
  }

  // Track shape indices for drag and drop
  let shapeIndex = 0;

  return (
    <div
      className="overflow-y-auto shrink-0 relative flex flex-col z-10 bg-(--color-bg-primary) border-l border-(--color-border)"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-(--color-accent) transition-colors"
        onMouseDown={onStartResize}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Header with collapse */}
        <div className="flex items-center justify-between py-3 border-b border-(--color-border-light)">
          <span className="text-[13px] font-medium text-(--color-text-primary)">Layers</span>
          <button
            className="w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer rounded transition-colors text-(--color-text-tertiary) hover:text-(--color-text-secondary) hover:bg-(--color-hover)"
            onClick={onToggle}
            title="Hide Layers"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="4 2 8 6 4 10" />
            </svg>
          </button>
        </div>

        {/* Group/Ungroup buttons */}
        <div className="flex gap-1 py-3 border-b border-(--color-border-light)">
          <button
            className="flex-1 px-2 py-1.5 text-[11px] rounded-md cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-transparent border border-(--color-border) text-(--color-text-secondary) hover:enabled:bg-(--color-hover) hover:enabled:text-(--color-text-primary)"
            disabled={!canCreateGroup}
            onClick={handleCreateGroup}
            title={canCreateGroup ? 'Group selected shapes' : 'Select 2+ shapes to group'}
          >
            Group
          </button>
          <button
            className="flex-1 px-2 py-1.5 text-[11px] rounded-md cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-transparent border border-(--color-border) text-(--color-text-secondary) hover:enabled:bg-(--color-hover) hover:enabled:text-(--color-text-primary)"
            disabled={!selectedShapesInGroup}
            onClick={handleUngroup}
            title={selectedShapesInGroup ? 'Ungroup selected shapes' : 'Select grouped shapes to ungroup'}
          >
            Ungroup
          </button>
        </div>

        {/* Multi-select toggle for touch devices */}
        {isTouchDevice && (
          <button
            className={`w-full px-2 py-2 text-[11px] rounded-md cursor-pointer transition-colors my-3 border ${
              isMultiSelectMode
                ? 'bg-(--color-accent) text-white border-(--color-accent)'
                : 'bg-transparent text-(--color-text-secondary) border-(--color-border)'
            }`}
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
          >
            {isMultiSelectMode ? 'Done Selecting' : 'Select Multiple'}
          </button>
        )}

        {/* Layer list */}
        <div className="py-3">
          {sortedShapes.length === 0 ? (
            <p className="text-[13px] text-center py-4 text-(--color-text-tertiary)">No shapes yet. Add one!</p>
          ) : (
        <ul className="list-none p-0 m-0">
          {layerItems.map((item) => {
            if (item.type === 'group-header' && item.group && item.shapesInGroup) {
              return (
                <GroupHeader
                  key={`group-${item.group.id}`}
                  group={item.group}
                  shapesInGroup={item.shapesInGroup}
                  selectedShapeIds={selectedShapeIds}
                  editingGroupId={editingGroupId}
                  editValue={editValue}
                  isTouchDevice={isTouchDevice}
                  isMultiSelectMode={isMultiSelectMode}
                  modifierKeyHint={modifierKeyHint}
                  isTop={item.isTopItem ?? false}
                  isBottom={item.isBottomItem ?? false}
                  topLevelIndex={item.topLevelIndex ?? 0}
                  draggedGroupId={draggedGroupId}
                  dropTargetTopLevelIndex={dropTargetTopLevelIndex}
                  onGroupClick={handleGroupClick}
                  onStartEditingGroup={startEditingGroup}
                  onEditValueChange={setEditValue}
                  onFinishEditing={finishEditing}
                  onKeyDown={handleKeyDown}
                  onToggleGroupCollapsed={onToggleGroupCollapsed}
                  onToggleGroupVisibility={onToggleGroupVisibility}
                  onDeleteGroup={onDeleteGroup}
                  onMoveGroup={onMoveGroup}
                  onGroupDragStart={handleGroupDragStart}
                  onGroupDragEnd={handleGroupDragEnd}
                  onGroupDragOver={handleGroupDragOver}
                  onGroupDrop={handleGroupDrop}
                  onHoverShape={onHoverShape}
                />
              );
            } else if (item.type === 'shape' && item.shape) {
              const currentIndex = shapeIndex++;
              const isInGroup = !!item.shape.groupId;
              const groupId = item.belongsToGroupId || null;
              return (
                <LayerItemComponent
                  key={item.shape.id}
                  shape={item.shape}
                  index={currentIndex}
                  isInGroup={isInGroup}
                  groupId={groupId}
                  challenge={challenge}
                  selectedShapeIds={selectedShapeIds}
                  editingId={editingId}
                  editValue={editValue}
                  draggedId={draggedId}
                  dropTargetIndex={dropTargetIndex}
                  isTouchDevice={isTouchDevice}
                  isTopLayer={isTopLayer(item.shape)}
                  isBottomLayer={isBottomLayer(item.shape)}
                  layerHint={getLayerHint()}
                  onLayerClick={handleLayerClick}
                  onStartEditing={startEditing}
                  onEditValueChange={setEditValue}
                  onFinishEditing={finishEditing}
                  onKeyDown={handleKeyDown}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onMoveLayer={onMoveLayer}
                  onDeleteShape={onDeleteShape}
                  onToggleVisibility={onToggleShapeVisibility}
                  onHoverShape={onHoverShape}
                  groupVisible={item.shape.groupId
                    ? groups.find(g => g.id === item.shape!.groupId)?.visible !== false
                    : true}
                />
              );
            }
            return null;
          })}
        </ul>
          )}
        </div>
      </div>
    </div>
  );
}
