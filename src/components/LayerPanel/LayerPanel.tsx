import { useState, useMemo } from 'react';
import type { Shape, ShapeGroup } from '../../types';
import { useIsTouchDevice } from '../../hooks/ui/useIsTouchDevice';
import type { LayerPanelProps, LayerItem } from './types';
import { LayerItem as LayerItemComponent } from './LayerItem';
import { GroupHeader } from './GroupHeader';


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
  onToggle,
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

  const handleCreateGroup = () => {
    if (canCreateGroup) {
      onCreateGroup(Array.from(selectedShapeIds));
    }
  };

  // Track shape indices for drag and drop
  let shapeIndex = 0;

  return (
    <div
      className="w-full flex flex-col bg-(--color-card-bg)"
      style={{
        border: 'var(--border-width, 2px) solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        maxHeight: 'calc(100vh - 140px)',
      }}
    >
      {/* Header: layers icon + 'Layers' + count badge + group icon button + close button */}
      <div className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ borderBottom: 'var(--border-width, 2px) solid var(--color-selected)' }}>
        {/* Layers icon */}
        <svg className="shrink-0 text-(--color-text-secondary)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span className="text-[13px] font-medium text-(--color-text-primary)">Layers</span>
        {/* Count badge */}
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-(--color-bg-tertiary) text-(--color-text-secondary) leading-none">
          {shapes.length}
        </span>

        <div className="flex-1" />

        {/* Group icon button */}
        <button
          className="w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer rounded transition-colors text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-hover) disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={!canCreateGroup}
          onClick={handleCreateGroup}
          title={canCreateGroup ? 'Group selected shapes' : 'Select 2+ shapes to group'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="8" height="8" rx="1" />
            <rect x="14" y="2" width="8" height="8" rx="1" />
            <rect x="2" y="14" width="8" height="8" rx="1" />
            <rect x="14" y="14" width="8" height="8" rx="1" />
          </svg>
        </button>

        {/* Close button */}
        <button
          className="w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer rounded transition-colors text-(--color-text-tertiary) hover:text-(--color-text-secondary) hover:bg-(--color-hover)"
          onClick={onToggle}
          title="Hide Layers"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="2" x2="10" y2="10" />
            <line x1="10" y1="2" x2="2" y2="10" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3">
        {/* Multi-select toggle for touch devices */}
        {isTouchDevice && (
          <button
            className={`w-full px-2 py-2 text-[11px] rounded-md cursor-pointer transition-colors my-2 border ${
              isMultiSelectMode
                ? 'bg-(--color-accent) text-(--color-accent-text) border-(--color-accent)'
                : 'bg-transparent text-(--color-text-secondary) border-(--color-border)'
            }`}
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
          >
            {isMultiSelectMode ? 'Done Selecting' : 'Select Multiple'}
          </button>
        )}

        {/* Layer list */}
        <div className="py-2">
          {sortedShapes.length === 0 ? (
            <p className="text-[12px] text-center py-4 text-(--color-text-tertiary)">No shapes yet</p>
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
                  onUngroupShapes={onUngroupShapes}
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
