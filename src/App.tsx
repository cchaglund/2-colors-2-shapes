import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { LayerPanel } from './components/LayerPanel';
import { ZoomControls } from './components/ZoomControls';
import { useCanvasState } from './hooks/useCanvasState';
import { useViewportState } from './hooks/useViewportState';
import { useSidebarState } from './hooks/useSidebarState';
import { getTodayChallenge } from './utils/dailyChallenge';

const CANVAS_SIZE = 800;

function App() {
  const challenge = useMemo(() => getTodayChallenge(), []);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isBackgroundPanning, setIsBackgroundPanning] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const {
    canvasState,
    addShape,
    duplicateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    selectShape,
    moveLayer,
    reorderLayers,
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

  const {
    leftOpen,
    rightOpen,
    leftWidth,
    rightWidth,
    toggleLeft,
    toggleRight,
    startResizeLeft,
    startResizeRight,
  } = useSidebarState();

  const handleZoomIn = useCallback(() => {
    setZoom(viewport.zoom + 0.1);
  }, [viewport.zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(viewport.zoom - 0.1);
  }, [viewport.zoom, setZoom]);

  // Get client coordinates relative to the main element, normalized to canvas size
  const getClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!mainRef.current) return { x: 0, y: 0 };
      const canvasElement = mainRef.current.querySelector('svg');
      if (!canvasElement) return { x: 0, y: 0 };
      const rect = canvasElement.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
        y: ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
      };
    },
    []
  );

  // Handle background panning (clicking on checkerboard area)
  const handleBackgroundMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      // Only trigger if clicking directly on the main element (the checkerboard background)
      // or the wrapper div, not on the canvas itself
      if (e.target === mainRef.current || (e.target as HTMLElement).classList.contains('canvas-wrapper')) {
        e.preventDefault();
        setIsBackgroundPanning(true);
        const point = getClientPoint(e.clientX, e.clientY);
        panStartRef.current = {
          x: point.x,
          y: point.y,
          panX: viewport.panX,
          panY: viewport.panY,
        };
      }
    },
    [getClientPoint, viewport.panX, viewport.panY]
  );

  // Handle background panning mouse move and mouse up
  useEffect(() => {
    if (!isBackgroundPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isBackgroundPanning || !panStartRef.current) return;
      const point = getClientPoint(e.clientX, e.clientY);
      const dx = point.x - panStartRef.current.x;
      const dy = point.y - panStartRef.current.y;
      setPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
    };

    const handleMouseUp = () => {
      setIsBackgroundPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isBackgroundPanning, getClientPoint, setPan]);

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
        selectedShapeIds={canvasState.selectedShapeIds}
        onAddShape={addShape}
        onSetBackground={setBackgroundColor}
        onChangeShapeColor={(colorIndex) => {
          const updates = new Map<string, { colorIndex: 0 | 1 }>();
          canvasState.selectedShapeIds.forEach((id) => {
            updates.set(id, { colorIndex });
          });
          updateShapes(updates);
        }}
        onReset={handleReset}
        isOpen={leftOpen}
        width={leftWidth}
        onToggle={toggleLeft}
        onStartResize={startResizeLeft}
      />

      <main
        ref={mainRef}
        className="flex-1 flex items-center justify-center canvas-bg-checkered overflow-auto relative"
        style={{ cursor: isBackgroundPanning ? 'grabbing' : undefined }}
        onMouseDown={handleBackgroundMouseDown}
        onClick={() => selectShape(null)}
      >
        <div className="overflow-visible p-16 canvas-wrapper" style={{ cursor: isBackgroundPanning ? 'grabbing' : 'grab' }}>
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
        onReorderLayers={reorderLayers}
        onDeleteShape={deleteShape}
        onRenameShape={(id, name) => updateShape(id, { name })}
        isOpen={rightOpen}
        width={rightWidth}
        onToggle={toggleRight}
        onStartResize={startResizeRight}
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
