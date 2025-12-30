import { useState, useMemo } from 'react';
import type { Shape, ShapeGroup } from '../../types';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
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
  onReorderLayers,
  onDeleteShape,
  onRenameShape,
  onCreateGroup,
  onDeleteGroup,
  onUngroupShapes,
  onRenameGroup,
  onToggleGroupCollapsed,
  onSelectGroup,
  isOpen,
  width,
  onToggle,
  onStartResize,
}: LayerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_dropTargetGroupId, setDropTargetGroupId] = useState<string | null>(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const isTouchDevice = useIsTouchDevice();

  // Sort shapes by zIndex descending (top layer first in list)
  const sortedShapes = useMemo(() => [...shapes].sort((a, b) => b.zIndex - a.zIndex), [shapes]);

  // Organize shapes into groups and ungrouped
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

    // Build layer items list with groups at top, ungrouped at bottom
    const items: LayerItem[] = [];
    const ids: string[] = [];

    // Sort groups by zIndex descending
    const sortedGroups = [...groups].sort((a, b) => b.zIndex - a.zIndex);

    // Add groups and their shapes
    for (const group of sortedGroups) {
      const shapesInGroup = groupedShapes.get(group.id) || [];
      if (shapesInGroup.length === 0) continue;

      items.push({
        type: 'group-header',
        group,
        shapesInGroup,
        belongsToGroupId: group.id,
      });

      for (const shape of shapesInGroup) {
        ids.push(shape.id);
      }

      if (!group.isCollapsed) {
        for (const shape of shapesInGroup) {
          items.push({ type: 'shape', shape, belongsToGroupId: group.id });
        }
      }
    }

    // Add ungrouped shapes
    for (const shape of ungroupedShapes) {
      items.push({ type: 'shape', shape });
      ids.push(shape.id);
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
      className="p-4 overflow-y-auto shrink-0 relative"
      style={{
        width,
        backgroundColor: 'var(--color-bg-secondary)',
        borderLeft: '1px solid var(--color-border)',
      }}
    >
      {/* Collapse button */}
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer rounded transition-colors"
        style={{ color: 'var(--color-text-tertiary)' }}
        onClick={onToggle}
        title="Hide Layers"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-tertiary)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ›
      </button>

      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors"
        onMouseDown={onStartResize}
      />

      <h3 className="m-0 mb-2 text-sm uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Layers</h3>

      {/* Group/Ungroup buttons */}
      <div className="flex gap-1 mb-3">
        <button
          className="flex-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          disabled={!canCreateGroup}
          onClick={handleCreateGroup}
          title={canCreateGroup ? 'Group selected shapes' : 'Select 2+ shapes to group'}
          onMouseEnter={(e) => {
            if (canCreateGroup) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
          }}
        >
          Group
        </button>
        <button
          className="flex-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          disabled={!selectedShapesInGroup}
          onClick={handleUngroup}
          title={selectedShapesInGroup ? 'Ungroup selected shapes' : 'Select grouped shapes to ungroup'}
          onMouseEnter={(e) => {
            if (selectedShapesInGroup) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
          }}
        >
          Ungroup
        </button>
      </div>

      {/* Multi-select toggle for touch devices */}
      {isTouchDevice && (
        <button
          className="w-full px-2 py-2 text-xs rounded cursor-pointer transition-colors mb-3"
          style={{
            backgroundColor: isMultiSelectMode ? 'var(--color-accent)' : 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: isMultiSelectMode ? 'white' : 'var(--color-text-primary)',
          }}
          onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
        >
          {isMultiSelectMode ? '✓ Done Selecting' : 'Select Multiple'}
        </button>
      )}

      {sortedShapes.length === 0 ? (
        <p className="text-sm text-center py-5" style={{ color: 'var(--color-text-tertiary)' }}>No shapes yet. Add one!</p>
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
                  onGroupClick={handleGroupClick}
                  onStartEditingGroup={startEditingGroup}
                  onEditValueChange={setEditValue}
                  onFinishEditing={finishEditing}
                  onKeyDown={handleKeyDown}
                  onToggleGroupCollapsed={onToggleGroupCollapsed}
                  onDeleteGroup={onDeleteGroup}
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
                />
              );
            }
            return null;
          })}
        </ul>
      )}
    </div>
  );
}
