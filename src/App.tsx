import { useState, useMemo } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { LayerPanel } from './components/LayerPanel';
import { useCanvasState } from './hooks/useCanvasState';
import { getTodayChallenge } from './utils/dailyChallenge';
import './App.css';

function App() {
  const challenge = useMemo(() => getTodayChallenge(), []);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    canvasState,
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    moveLayer,
    setBackgroundColor,
    resetCanvas,
  } = useCanvasState(challenge);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetCanvas();
    setShowResetConfirm(false);
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  const backgroundColor =
    canvasState.backgroundColorIndex !== null
      ? challenge.colors[canvasState.backgroundColorIndex]
      : null;

  return (
    <div className="app">
      <Toolbar
        challenge={challenge}
        backgroundColorIndex={canvasState.backgroundColorIndex}
        onAddShape={addShape}
        onSetBackground={setBackgroundColor}
        onReset={handleReset}
      />

      <main className="canvas-container" onClick={() => selectShape(null)}>
        <Canvas
          shapes={canvasState.shapes}
          selectedShapeId={canvasState.selectedShapeId}
          backgroundColor={backgroundColor}
          challenge={challenge}
          onSelectShape={selectShape}
          onUpdateShape={updateShape}
        />
      </main>

      <LayerPanel
        shapes={canvasState.shapes}
        selectedShapeId={canvasState.selectedShapeId}
        challenge={challenge}
        onSelectShape={selectShape}
        onMoveLayer={moveLayer}
        onDeleteShape={deleteShape}
      />

      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reset Canvas?</h3>
            <p>This will delete all shapes and cannot be undone.</p>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={cancelReset}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={confirmReset}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
