import { useState } from 'react';
import type { Shape, DailyChallenge } from '../types';
import './LayerPanel.css';

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
    <div className="layer-panel">
      <h3>Layers</h3>
      {sortedShapes.length === 0 ? (
        <p className="empty-message">No shapes yet. Add one!</p>
      ) : (
        <ul className="layer-list">
          {sortedShapes.map((shape) => (
            <li
              key={shape.id}
              className={`layer-item ${shape.id === selectedShapeId ? 'selected' : ''}`}
              onClick={() => onSelectShape(shape.id)}
            >
              <div
                className="layer-color-preview"
                style={{ backgroundColor: challenge.colors[shape.colorIndex] }}
              />
              {editingId === shape.id ? (
                <input
                  className="layer-name-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span
                  className="layer-name"
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditing(shape);
                  }}
                >
                  {shape.name}
                </span>
              )}
              <div className="layer-actions">
                <button
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
                  className="delete-btn"
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
