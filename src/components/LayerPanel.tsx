import type { Shape, DailyChallenge } from '../types';
import { SHAPE_NAMES } from '../utils/shapeHelpers';
import './LayerPanel.css';

interface LayerPanelProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  challenge: DailyChallenge;
  onSelectShape: (id: string | null) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onDeleteShape: (id: string) => void;
}

export function LayerPanel({
  shapes,
  selectedShapeId,
  challenge,
  onSelectShape,
  onMoveLayer,
  onDeleteShape,
}: LayerPanelProps) {
  // Sort by zIndex descending (top layer first in list)
  const sortedShapes = [...shapes].sort((a, b) => b.zIndex - a.zIndex);

  const isTopLayer = (shape: Shape) =>
    shape.zIndex === Math.max(...shapes.map((s) => s.zIndex));
  const isBottomLayer = (shape: Shape) =>
    shape.zIndex === Math.min(...shapes.map((s) => s.zIndex));

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
              <span className="layer-name">{SHAPE_NAMES[shape.type]}</span>
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
