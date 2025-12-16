import { useState, useMemo, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { LayerPanel } from './components/LayerPanel';
import { ZoomControls } from './components/ZoomControls';
import { useCanvasState } from './hooks/useCanvasState';
import { useViewportState } from './hooks/useViewportState';
import { getTodayChallenge } from './utils/dailyChallenge';

function App() {
  const challenge = useMemo(() => getTodayChallenge(), []);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    canvasState,
    addShape,
    duplicateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    selectShape,
    moveLayer,
    setBackgroundColor,
    resetCanvas,
    undo,
    redo,
  } = useCanvasState(challenge);

  const {
    viewport,
    setZoom,
    setPan,
    zoomAtPoint,
    resetViewport,
    minZoom,
    maxZoom,
  } = useViewportState();

  const handleZoomIn = useCallback(() => {
    setZoom(viewport.zoom + 0.1);
  }, [viewport.zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(viewport.zoom - 0.1);
  }, [viewport.zoom, setZoom]);

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
    <div className="flex h-screen">
      <Toolbar
        challenge={challenge}
        backgroundColorIndex={canvasState.backgroundColorIndex}
        onAddShape={addShape}
        onSetBackground={setBackgroundColor}
        onReset={handleReset}
      />

      <main
        className="flex-1 flex items-center justify-center canvas-bg-checkered overflow-auto relative"
        onClick={() => selectShape(null)}
      >
        <div className="overflow-visible p-16">
          <Canvas
            shapes={canvasState.shapes}
            selectedShapeIds={canvasState.selectedShapeIds}
            backgroundColor={backgroundColor}
            challenge={challenge}
            viewport={viewport}
            onSelectShape={selectShape}
            onUpdateShape={updateShape}
            onUpdateShapes={updateShapes}
            onDuplicateShapes={duplicateShapes}
            onUndo={undo}
            onRedo={redo}
            onZoomAtPoint={zoomAtPoint}
            onPan={setPan}
          />
        </div>

        {/* Zoom controls overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <ZoomControls
            zoom={viewport.zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={resetViewport}
            minZoom={minZoom}
            maxZoom={maxZoom}
          />
        </div>
      </main>

      <LayerPanel
        shapes={canvasState.shapes}
        selectedShapeIds={canvasState.selectedShapeIds}
        challenge={challenge}
        onSelectShape={selectShape}
        onMoveLayer={moveLayer}
        onDeleteShape={deleteShape}
        onRenameShape={(id, name) => updateShape(id, { name })}
      />

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-1000">
          <div className="bg-white p-6 rounded-xl max-w-100 text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <h3 className="m-0 mb-3 text-xl">Reset Canvas?</h3>
            <p className="m-0 mb-5 text-gray-500">This will delete all shapes and cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-2.5 rounded-md border-none cursor-pointer text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={cancelReset}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2.5 rounded-md border-none cursor-pointer text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600"
                onClick={confirmReset}
              >
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
