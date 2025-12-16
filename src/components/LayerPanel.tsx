import { useState } from 'react';
import type { Shape, DailyChallenge } from '../types';

interface LayerPanelProps {
  shapes: Shape[];
  selectedShapeIds: Set<string>;
  challenge: DailyChallenge;
  onSelectShape: (id: string | null, addToSelection?: boolean) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
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
  onDeleteShape,
  onRenameShape,
  isOpen,
  width,
  onToggle,
  onStartResize,
}: LayerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  // Sort by zIndex descending (top layer first in list)
  const sortedShapes = [...shapes].sort((a, b) => b.zIndex - a.zIndex);

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

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          className="absolute right-0 top-4 z-10 bg-neutral-100 border border-r-0 border-gray-300 rounded-l-md px-1.5 py-3 cursor-pointer hover:bg-neutral-200 transition-colors"
          onClick={onToggle}
          title="Show Layers"
        >
          <span className="text-gray-600 text-sm">‹</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-neutral-100 border-l border-gray-300 p-4 overflow-y-auto shrink-0 relative"
      style={{ width }}
    >
      {/* Collapse button */}
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
        onClick={onToggle}
        title="Hide Layers"
      >
        ›
      </button>

      {/* Resize handle */}
      <div
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors"
        onMouseDown={onStartResize}
      />

      <h3 className="m-0 mb-4 text-sm uppercase text-gray-500">Layers</h3>
      {sortedShapes.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-5">No shapes yet. Add one!</p>
      ) : (
        <ul className="list-none p-0 m-0">
          {sortedShapes.map((shape) => (
            <li
              key={shape.id}
              className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                selectedShapeIds.has(shape.id) ? 'bg-blue-100' : 'hover:bg-gray-200'
              }`}
              onClick={(e) => onSelectShape(shape.id, e.shiftKey)}
            >
              <div
                className="w-5 h-5 rounded border border-black/20 shrink-0"
                style={{ backgroundColor: challenge.colors[shape.colorIndex] }}
              />
              {editingId === shape.id ? (
                <input
                  className="flex-1 text-sm py-0.5 px-1 border border-blue-600 rounded outline-none min-w-0"
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
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditing(shape);
                  }}
                >
                  {shape.name}
                </span>
              )}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="w-6 h-6 p-0 border border-gray-300 bg-white rounded cursor-pointer text-[10px] flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Bring to front"
                  disabled={isTopLayer(shape)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayer(shape.id, 'top');
                  }}
                >
                  ⬆⬆
                </button>
                <button
                  className="w-6 h-6 p-0 border border-gray-300 bg-white rounded cursor-pointer text-[10px] flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
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
                  className="w-6 h-6 p-0 border border-gray-300 bg-white rounded cursor-pointer text-[10px] flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
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
                  className="w-6 h-6 p-0 border border-gray-300 bg-white rounded cursor-pointer text-[10px] flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Send to back"
                  disabled={isBottomLayer(shape)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayer(shape.id, 'bottom');
                  }}
                >
                  ⬇⬇
                </button>
                <button
                  className="w-6 h-6 p-0 border border-gray-300 bg-white rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 ml-1 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
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
