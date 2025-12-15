import { useState } from 'react';
import type { Shape, DailyChallenge } from '../types';

interface LayerPanelProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  challenge: DailyChallenge;
  onSelectShape: (id: string | null) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onDeleteShape: (id: string) => void;
  onRenameShape: (id: string, name: string) => void;
}

export function LayerPanel({
  shapes,
  selectedShapeId,
  challenge,
  onSelectShape,
  onMoveLayer,
  onDeleteShape,
  onRenameShape,
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

  return (
    <div className="w-75 bg-neutral-100 border-l border-gray-300 p-4 overflow-y-auto">
      <h3 className="m-0 mb-4 text-sm uppercase text-gray-500">Layers</h3>
      {sortedShapes.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-5">No shapes yet. Add one!</p>
      ) : (
        <ul className="list-none p-0 m-0">
          {sortedShapes.map((shape) => (
            <li
              key={shape.id}
              className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                shape.id === selectedShapeId ? 'bg-blue-100' : 'hover:bg-gray-200'
              }`}
              onClick={() => onSelectShape(shape.id)}
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
