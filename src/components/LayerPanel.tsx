import { useState, useMemo, useEffect } from 'react';
import type { Shape, ShapeGroup, DailyChallenge } from '../types';

// Detect if user is on macOS for modifier key instructions
const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

// Hook to detect touch device
function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check for touch capability
    const hasTouchScreen =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE-specific
      navigator.msMaxTouchPoints > 0;

    setIsTouchDevice(hasTouchScreen);
  }, []);

  return isTouchDevice;
}

interface LayerPanelProps {
  shapes: Shape[];
  groups: ShapeGroup[];
  selectedShapeIds: Set<string>;
  challenge: DailyChallenge;
  onSelectShape: (id: string | null, options?: { toggle?: boolean; range?: boolean; orderedIds?: string[] }) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onReorderLayers: (draggedId: string, targetIndex: number) => void;
  onDeleteShape: (id: string) => void;
  onRenameShape: (id: string, name: string) => void;
  // Group handlers
  onCreateGroup: (shapeIds: string[], groupName?: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onUngroupShapes: (shapeIds: string[]) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onToggleGroupCollapsed: (groupId: string) => void;
  onSelectGroup: (groupId: string, options?: { toggle?: boolean }) => void;
  isOpen: boolean;
  width: number;
  onToggle: () => void;
  onStartResize: (e: React.MouseEvent) => void;
}

// Helper type for rendering grouped and ungrouped shapes
interface LayerItem {
  type: 'shape' | 'group-header';
  shape?: Shape;
  group?: ShapeGroup;
  shapesInGroup?: Shape[];
}

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
      if (shapesInGroup.length === 0) continue; // Skip empty groups

      items.push({
        type: 'group-header',
        group,
        shapesInGroup,
      });

      // Add shape IDs for range selection (group header acts as anchor for all its shapes)
      for (const shape of shapesInGroup) {
        ids.push(shape.id);
      }

      // If group is not collapsed, add individual shape items
      if (!group.isCollapsed) {
        for (const shape of shapesInGroup) {
          items.push({ type: 'shape', shape });
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

  // Handle layer click with modifier key support
  const handleLayerClick = (e: React.MouseEvent, shapeId: string) => {
    const isToggleModifier = isMac ? e.metaKey : e.ctrlKey;
    const isRangeModifier = e.shiftKey;

    // On touch devices in multi-select mode, always toggle
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

  // Handle group header click - select all shapes in group
  const handleGroupClick = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    const isToggleModifier = isMac ? e.metaKey : e.ctrlKey;
    // On touch devices in multi-select mode, always toggle
    const shouldToggle = (isTouchDevice && isMultiSelectMode) || isToggleModifier;
    onSelectGroup(groupId, { toggle: shouldToggle });
  };

  // Modifier key hint text (not shown on touch devices)
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

  const handleDragStart = (e: React.DragEvent, shapeId: string) => {
    setDraggedId(shapeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', shapeId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedShapeId = e.dataTransfer.getData('text/plain');
    if (draggedShapeId) {
      onReorderLayers(draggedShapeId, targetIndex);
    }
    setDraggedId(null);
    setDropTargetIndex(null);
  };

  // Check if we can create a group from current selection
  const canCreateGroup = selectedShapeIds.size >= 2;

  // Check if selected shapes are in a group (for ungroup action)
  const selectedShapesInGroup = useMemo(() => {
    const selectedShapes = shapes.filter((s) => selectedShapeIds.has(s.id));
    return selectedShapes.some((s) => s.groupId);
  }, [shapes, selectedShapeIds]);

  // Handle creating a group from selected shapes
  const handleCreateGroup = () => {
    if (canCreateGroup) {
      onCreateGroup(Array.from(selectedShapeIds));
    }
  };

  // Handle ungrouping selected shapes
  const handleUngroup = () => {
    if (selectedShapesInGroup) {
      onUngroupShapes(Array.from(selectedShapeIds));
    }
  };

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          className="absolute right-0 top-4 z-10 rounded-l-md px-1.5 py-3 cursor-pointer transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRightWidth: 0,
            borderColor: 'var(--color-border)',
          }}
          onClick={onToggle}
          title="Show Layers"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
        >
          <span style={{ color: 'var(--color-text-secondary)' }} className="text-sm">‹</span>
        </button>
      </div>
    );
  }

  // Render a shape layer item
  const renderShapeItem = (shape: Shape, index: number, isInGroup: boolean) => (
    <li
      key={shape.id}
      draggable={editingId !== shape.id}
      onDragStart={(e) => handleDragStart(e, shape.id)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      className={`group relative flex items-center gap-2 p-2 rounded cursor-grab transition-colors ${
        draggedId === shape.id ? 'opacity-50' : ''
      } ${
        dropTargetIndex === index && draggedId !== shape.id
          ? 'border-t-2 border-blue-500'
          : ''
      }`}
      style={{
        backgroundColor: selectedShapeIds.has(shape.id) ? 'var(--color-selected)' : undefined,
        paddingLeft: isInGroup ? '24px' : '8px', // Indent shapes in groups
      }}
      onClick={(e) => handleLayerClick(e, shape.id)}
      title={getLayerHint()}
      onMouseEnter={(e) => {
        if (!selectedShapeIds.has(shape.id)) {
          e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selectedShapeIds.has(shape.id)) {
          e.currentTarget.style.backgroundColor = '';
        }
      }}
    >
      <div
        className="w-5 h-5 rounded shrink-0"
        style={{
          backgroundColor: challenge.colors[shape.colorIndex],
          border: '1px solid var(--color-border-light)',
        }}
      />
      {editingId === shape.id ? (
        <input
          className="flex-1 text-sm py-0.5 px-1 border border-blue-600 rounded outline-none min-w-0"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          }}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap cursor-text"
          style={{ color: 'var(--color-text-primary)' }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing(shape);
          }}
        >
          {shape.name}
        </span>
      )}
      {/* Action buttons - always visible on touch, hover-only on desktop */}
      {isTouchDevice ? (
        // Touch devices: always show a simplified set of buttons
        <div
          className="flex gap-0.5 shrink-0 ml-auto"
        >
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Move up"
            disabled={isTopLayer(shape)}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'up');
            }}
          >
            ⬆
          </button>
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Move down"
            disabled={isBottomLayer(shape)}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'down');
            }}
          >
            ⬇
          </button>
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
            }}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteShape(shape.id);
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        // Desktop: show on hover with full set of buttons
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 shadow-sm"
          style={{ backgroundColor: 'var(--color-overlay)' }}
        >
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Bring to front"
            disabled={isTopLayer(shape)}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'top');
            }}
            onMouseEnter={(e) => {
              if (!isTopLayer(shape)) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
            }}
          >
            ⬆⬆
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Move up"
            disabled={isTopLayer(shape)}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'up');
            }}
            onMouseEnter={(e) => {
              if (!isTopLayer(shape)) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
            }}
          >
            ⬆
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Move down"
            disabled={isBottomLayer(shape)}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'down');
            }}
            onMouseEnter={(e) => {
              if (!isBottomLayer(shape)) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
            }}
          >
            ⬇
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Send to back"
            disabled={isBottomLayer(shape)}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'bottom');
            }}
            onMouseEnter={(e) => {
              if (!isBottomLayer(shape)) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
            }}
          >
            ⬇⬇
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 ml-1 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
            }}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteShape(shape.id);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </li>
  );

  // Render a group header
  const renderGroupHeader = (group: ShapeGroup, shapesInGroup: Shape[]) => {
    // Check if all shapes in group are selected
    const allSelected = shapesInGroup.every((s) => selectedShapeIds.has(s.id));
    const someSelected = shapesInGroup.some((s) => selectedShapeIds.has(s.id));

    return (
      <li
        key={`group-${group.id}`}
        className="group relative flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
        style={{
          backgroundColor: allSelected ? 'var(--color-selected)' : someSelected ? 'var(--color-selected-partial)' : undefined,
        }}
        onClick={(e) => handleGroupClick(e, group.id)}
        title={isTouchDevice
          ? (isMultiSelectMode ? 'Tap to toggle group selection' : 'Tap to select group')
          : `Click to select all shapes in group, ${modifierKeyHint}+click to add to selection`}
        onMouseEnter={(e) => {
          if (!allSelected) {
            e.currentTarget.style.backgroundColor = 'var(--color-hover)';
          }
        }}
        onMouseLeave={(e) => {
          if (!allSelected && !someSelected) {
            e.currentTarget.style.backgroundColor = '';
          } else if (someSelected && !allSelected) {
            e.currentTarget.style.backgroundColor = 'var(--color-selected-partial)';
          }
        }}
      >
        {/* Collapse/expand toggle */}
        <button
          className="w-5 h-5 flex items-center justify-center text-xs rounded hover:bg-opacity-20"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleGroupCollapsed(group.id);
          }}
          title={group.isCollapsed ? 'Expand group' : 'Collapse group'}
        >
          {group.isCollapsed ? '▶' : '▼'}
        </button>

        {/* Group icon */}
        <div
          className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-xs"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          G
        </div>

        {/* Group name */}
        {editingGroupId === group.id ? (
          <input
            className="flex-1 text-sm py-0.5 px-1 border border-blue-600 rounded outline-none min-w-0 font-medium"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span
            className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap cursor-text font-medium"
            style={{ color: 'var(--color-text-primary)' }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEditingGroup(group);
            }}
          >
            {group.name}
            <span className="ml-1 text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
              ({shapesInGroup.length})
            </span>
          </span>
        )}

        {/* Group actions - always visible on touch, hover-only on desktop */}
        {isTouchDevice ? (
          <div className="flex gap-0.5 shrink-0 ml-auto">
            <button
              className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
              }}
              title="Delete group (keeps shapes)"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGroup(group.id);
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 shadow-sm"
            style={{ backgroundColor: 'var(--color-overlay)' }}
          >
            <button
              className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 hover:bg-red-50"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
              }}
              title="Delete group (keeps shapes)"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteGroup(group.id);
              }}
            >
              ✕
            </button>
          </div>
        )}
      </li>
    );
  };

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
              return renderGroupHeader(item.group, item.shapesInGroup);
            } else if (item.type === 'shape' && item.shape) {
              const currentIndex = shapeIndex++;
              const isInGroup = !!item.shape.groupId;
              return renderShapeItem(item.shape, currentIndex, isInGroup);
            }
            return null;
          })}
        </ul>
      )}
    </div>
  );
}
