import type { DailyChallenge } from '../types';
import { SHAPE_NAMES } from '../utils/shapeHelpers';
import './Toolbar.css';

interface ToolbarProps {
  challenge: DailyChallenge;
  backgroundColorIndex: 0 | 1 | null;
  onAddShape: (shapeIndex: 0 | 1, colorIndex: 0 | 1) => void;
  onSetBackground: (colorIndex: 0 | 1 | null) => void;
  onReset: () => void;
}

export function Toolbar({
  challenge,
  backgroundColorIndex,
  onAddShape,
  onSetBackground,
  onReset,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Today's Challenge</h3>
        <p className="date">{challenge.date}</p>
      </div>

      <div className="toolbar-section">
        <h4>Colors</h4>
        <div className="color-swatches">
          {challenge.colors.map((color, index) => (
            <div
              key={index}
              className="color-swatch"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h4>Add Shape</h4>
        <div className="shape-buttons">
          {challenge.shapes.map((shape, shapeIndex) => (
            <div key={shape} className="shape-row">
              <span className="shape-label">{SHAPE_NAMES[shape]}</span>
              <div className="color-buttons">
                {challenge.colors.map((color, colorIndex) => (
                  <button
                    key={colorIndex}
                    className="add-shape-btn"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      onAddShape(shapeIndex as 0 | 1, colorIndex as 0 | 1)
                    }
                    title={`Add ${SHAPE_NAMES[shape]} with ${color}`}
                  >
                    +
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h4>Background</h4>
        <div className="background-buttons">
          <button
            className={`bg-btn ${backgroundColorIndex === null ? 'active' : ''}`}
            onClick={() => onSetBackground(null)}
            style={{ backgroundColor: '#fff' }}
            title="White background"
          >
            ✓
          </button>
          {challenge.colors.map((color, index) => (
            <button
              key={index}
              className={`bg-btn ${backgroundColorIndex === index ? 'active' : ''}`}
              onClick={() => onSetBackground(index as 0 | 1)}
              style={{ backgroundColor: color }}
              title={`${color} background`}
            >
              {backgroundColorIndex === index ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <button className="reset-btn" onClick={onReset}>
          Reset Canvas
        </button>
      </div>

      <div className="toolbar-section help">
        <h4>Controls</h4>
        <ul>
          <li>Drag shape to move</li>
          <li>Drag corners to resize</li>
          <li>Drag circle to rotate</li>
          <li>Arrow keys to move</li>
          <li>Period/Comma to rotate</li>
          <li>Hold Shift for larger steps</li>
          <li>w to undo, Shift+w to redo</li>
          <li>c to duplicate selected</li>
        </ul>
      </div>
    </div>
  );
}
