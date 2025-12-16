import { useState, useMemo } from 'react';
import type { Shape, DailyChallenge } from '../types';

// Detect if user is on macOS for modifier key instructions
const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');

interface LayerPanelProps {
  shapes: Shape[];
  selectedShapeIds: Set<string>;
  challenge: DailyChallenge;
  onSelectShape: (id: string | null, options?: { toggle?: boolean; range?: boolean; orderedIds?: string[] }) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onReorderLayers: (draggedId: string, targetIndex: number) => void;
  onDeleteShape: (id: string) => void;
  onRenameShape: (id: string, name: string) => void;
  isOpen: boolean;
  width: number;
  onToggle: () => void;
  onStartResize: (e: React.MouseEvent) => void;
}

export function LayerPanel({
  shapes,
  selectedShapeIds,
  challenge,
  onSelectShape,
  onMoveLayer,
  onReorderLayers,
  onDeleteShape,
  onRenameShape,
  isOpen,
  width,
  onToggle,
  onStartResize,
}: LayerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  // Sort by zIndex descending (top layer first in list)
  const sortedShapes = useMemo(() => [...shapes].sort((a, b) => b.zIndex - a.zIndex), [shapes]);

  // Get ordered IDs for range selection
  const orderedIds = useMemo(() => sortedShapes.map(s => s.id), [sortedShapes]);

  // Handle layer click with modifier key support
  const handleLayerClick = (e: React.MouseEvent, shapeId: string) => {
    // On Mac: Cmd for toggle, Shift for range
    // On Windows/Linux: Ctrl for toggle, Shift for range
    const isToggleModifier = isMac ? e.metaKey : e.ctrlKey;
    const isRangeModifier = e.shiftKey;

    if (isRangeModifier) {
      onSelectShape(shapeId, { range: true, orderedIds });
    } else if (isToggleModifier) {
      onSelectShape(shapeId, { toggle: true });
    } else {
      onSelectShape(shapeId);
    }
  };

  // Modifier key hint text
  const modifierKeyHint = isMac ? '⌘' : 'Ctrl';

  const isTopLayer = (shape: Shape) =>
    shape.zIndex === Math.max(...shapes.map((s) => s.zIndex));
  const isBottomLayer = (shape: Shape) =>
    shape.zIndex === Math.min(...shapes.map((s) => s.zIndex));

  const startEditing = (shape: Shape) => {
    setEditingId(shape.id);
    setEditValue(shape.name);
  };

  const finishEditing = () => {
    if (editingId && editValue.trim()) {
      onRenameShape(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingId(null);
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

      <h3 className="m-0 mb-4 text-sm uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Layers</h3>
      {sortedShapes.length === 0 ? (
        <p className="text-sm text-center py-5" style={{ color: 'var(--color-text-tertiary)' }}>No shapes yet. Add one!</p>
      ) : (
        <ul className="list-none p-0 m-0">
          {sortedShapes.map((shape, index) => (
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
              }}
              onClick={(e) => handleLayerClick(e, shape.id)}
              title={`Click to select, ${modifierKeyHint}+click to toggle, Shift+click to select range`}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
