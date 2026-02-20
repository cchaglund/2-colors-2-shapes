import { useRef, useCallback } from 'react';
import type { Shape, DailyChallenge, ViewportState } from '../../types';
import { CANVAS_SIZE } from '../../types/canvas';
import { getShapeDimensions } from '../../utils/shapes';
import { ShapeElement } from './ShapeElement';
import {
  TransformInteractionLayer,
  MultiSelectTransformLayer,
  MultiSelectInteractionLayer,
} from './TransformHandles';
import { type KeyMappings } from '../../constants/keyboardActions';
import { TouchContextMenu } from './TouchContextMenu';
import { CanvasGridLines } from './CanvasGridLines';

// Import extracted hooks
import { useCanvasCoordinates } from '../../hooks/canvas/useCanvasCoordinates';
import { useSelectionBounds } from '../../hooks/canvas/useSelectionBounds';
import { useCanvasKeyboardShortcuts } from '../../hooks/canvas/useCanvasKeyboardShortcuts';
import { useCanvasPanning } from '../../hooks/canvas/useCanvasPanning';
import { useWheelZoom } from '../../hooks/canvas/useWheelZoom';
import { useShapeDrag } from '../../hooks/canvas/useShapeDrag';
import { useCanvasTouchGestures } from '../../hooks/canvas/useCanvasTouchGestures';

interface CanvasProps {
  shapes: Shape[];
  selectedShapeIds: Set<string>;
  backgroundColor: string | null;
  challenge: DailyChallenge;
  viewport: ViewportState;
  keyMappings: KeyMappings;
  showGrid?: boolean;
  showOffCanvas?: boolean;
  onSelectShape: (id: string | null, options?: { toggle?: boolean; range?: boolean; orderedIds?: string[] }) => void;
  onUpdateShape: (id: string, updates: Partial<Shape>, addToHistory?: boolean) => void;
  onUpdateShapes: (updates: Map<string, Partial<Shape>>, addToHistory?: boolean, label?: string) => void;
  onCommitToHistory: (label?: string) => void;
  onDuplicateShapes: (ids: string[]) => void;
  onDeleteSelectedShapes: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onMirrorHorizontal: (ids: string[]) => void;
  onMirrorVertical: (ids: string[]) => void;
  onZoomAtPoint: (delta: number, pointX: number, pointY: number) => void;
  onSetZoomAtPoint: (startZoom: number, scale: number, centerX: number, centerY: number, startPanX: number, startPanY: number) => void;
  onPan: (panX: number, panY: number) => void;
  onMoveLayer?: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void;
  onToggleGrid?: () => void;
}

export function Canvas({
  shapes,
  selectedShapeIds,
  backgroundColor,
  challenge,
  viewport,
  keyMappings,
  showGrid,
  showOffCanvas,
  onSelectShape,
  onUpdateShape,
  onUpdateShapes,
  onCommitToHistory,
  onDuplicateShapes,
  onDeleteSelectedShapes,
  onUndo,
  onRedo,
  onMirrorHorizontal,
  onMirrorVertical,
  onZoomAtPoint,
  onSetZoomAtPoint,
  onPan,
  onMoveLayer,
  onToggleGrid,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Use extracted hooks
  const { getSVGPoint, getClientPoint } = useCanvasCoordinates(svgRef);

  const {
    selectedShapes,
    hasSelection,
    hasSingleSelection,
    singleSelectedShape,
    selectionBounds,
  } = useSelectionBounds(shapes, selectedShapeIds);

  const { isSpacePressed, cursorStyle } = useCanvasPanning(
    viewport,
    keyMappings,
    getClientPoint,
    onPan
  );

  useWheelZoom(svgRef, onZoomAtPoint);

  useCanvasKeyboardShortcuts({
    selectedShapes,
    hasSelection,
    keyMappings,
    onUpdateShapes,
    onUndo,
    onRedo,
    onDuplicateShapes,
    onDeleteSelectedShapes,
    onMirrorHorizontal,
    onMirrorVertical,
    onToggleGrid,
  });

  const { setDragState } = useShapeDrag({
    shapes,
    getSVGPoint,
    onUpdateShape,
    onUpdateShapes,
    onCommitToHistory,
  });

  const {
    contextMenu,
    setContextMenu,
    handleCanvasTouchStart,
    handleCanvasTouchMove,
    handleCanvasTouchEnd,
  } = useCanvasTouchGestures({
    shapes,
    selectedShapes,
    selectedShapeIds,
    viewport,
    svgRef,
    onSelectShape,
    onUpdateShape,
    onUpdateShapes,
    onPan,
    onSetZoomAtPoint,
    getSVGPoint,
    getClientPoint,
  });

  // Event handlers that need to set drag state
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      onSelectShape(null);
    }
  };

  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      e.stopPropagation();
      const shape = shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      const isShiftKey = e.shiftKey;
      const isAlreadySelected = selectedShapeIds.has(shapeId);

      // Handle selection logic
      if (isShiftKey) {
        onSelectShape(shapeId, { toggle: true });
        if (isAlreadySelected) {
          return;
        }
      } else if (!isAlreadySelected) {
        onSelectShape(shapeId);
      }

      // Start drag for move
      const point = getSVGPoint(e.clientX, e.clientY);

      let shapesToDrag: Shape[];
      if (isShiftKey) {
        shapesToDrag = [...selectedShapes, shape];
      } else if (isAlreadySelected) {
        shapesToDrag = selectedShapes;
      } else {
        shapesToDrag = [shape];
      }

      const startPositions = new Map<string, { x: number; y: number }>();
      shapesToDrag.forEach(s => {
        startPositions.set(s.id, { x: s.x, y: s.y });
      });

      setDragState({
        mode: 'move',
        shapeId: shape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: shape.x,
        startShapeY: shape.y,
        startSize: shape.size,
        startRotation: shape.rotation,
        resizeCorner: '',
        startPositions,
      });
    },
    [shapes, selectedShapeIds, selectedShapes, getSVGPoint, onSelectShape, setDragState]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, corner: string) => {
      e.stopPropagation();
      if (!singleSelectedShape) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);
      setDragState({
        mode: 'resize',
        shapeId: singleSelectedShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: singleSelectedShape.x,
        startShapeY: singleSelectedShape.y,
        startSize: singleSelectedShape.size,
        startRotation: singleSelectedShape.rotation,
        resizeCorner: corner,
        flipX: singleSelectedShape.flipX,
        flipY: singleSelectedShape.flipY,
      });
    },
    [singleSelectedShape, getSVGPoint, setDragState]
  );

  const handleRotateStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (!singleSelectedShape) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);
      setDragState({
        mode: 'rotate',
        shapeId: singleSelectedShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: singleSelectedShape.x,
        startShapeY: singleSelectedShape.y,
        startSize: singleSelectedShape.size,
        startRotation: singleSelectedShape.rotation,
        resizeCorner: '',
        flipX: singleSelectedShape.flipX,
        flipY: singleSelectedShape.flipY,
      });
    },
    [singleSelectedShape, getSVGPoint, setDragState]
  );

  const handleMoveStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (!hasSelection) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);

      const startPositions = new Map<string, { x: number; y: number }>();
      selectedShapes.forEach(s => {
        startPositions.set(s.id, { x: s.x, y: s.y });
      });

      const refShape = selectedShapes[0];

      setDragState({
        mode: 'move',
        shapeId: refShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: refShape.x,
        startShapeY: refShape.y,
        startSize: refShape.size,
        startRotation: refShape.rotation,
        resizeCorner: '',
        startPositions,
      });
    },
    [hasSelection, selectedShapes, getSVGPoint, setDragState]
  );

  const handleMultiResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, corner: string) => {
      e.stopPropagation();
      if (selectedShapes.length < 2 || !selectionBounds) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);

      const startShapeData = new Map<string, { x: number; y: number; size: number; rotation: number; width: number; height: number }>();
      selectedShapes.forEach(s => {
        const dims = getShapeDimensions(s.type, s.size);
        startShapeData.set(s.id, { x: s.x, y: s.y, size: s.size, rotation: s.rotation, width: dims.width, height: dims.height });
      });

      const refShape = selectedShapes[0];

      setDragState({
        mode: 'resize',
        shapeId: refShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: refShape.x,
        startShapeY: refShape.y,
        startSize: refShape.size,
        startRotation: refShape.rotation,
        resizeCorner: corner,
        startShapeData,
        startBounds: { ...selectionBounds },
      });
    },
    [selectedShapes, selectionBounds, getSVGPoint, setDragState]
  );

  const handleMultiRotateStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (selectedShapes.length < 2 || !selectionBounds) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);

      const startShapeData = new Map<string, { x: number; y: number; size: number; rotation: number; width: number; height: number }>();
      selectedShapes.forEach(s => {
        const dims = getShapeDimensions(s.type, s.size);
        startShapeData.set(s.id, { x: s.x, y: s.y, size: s.size, rotation: s.rotation, width: dims.width, height: dims.height });
      });

      const refShape = selectedShapes[0];

      setDragState({
        mode: 'rotate',
        shapeId: refShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: refShape.x,
        startShapeY: refShape.y,
        startSize: refShape.size,
        startRotation: refShape.rotation,
        resizeCorner: '',
        startShapeData,
        startBounds: { ...selectionBounds },
      });
    },
    [selectedShapes, selectionBounds, getSVGPoint, setDragState]
  );

  // Context menu handlers
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, x: 0, y: 0, shapeId: null });
  }, [setContextMenu]);

  const handleContextMenuDuplicate = useCallback(() => {
    if (selectedShapeIds.size > 0) {
      onDuplicateShapes(Array.from(selectedShapeIds));
    }
  }, [selectedShapeIds, onDuplicateShapes]);

  const handleContextMenuDelete = useCallback(() => {
    onDeleteSelectedShapes();
  }, [onDeleteSelectedShapes]);

  const handleContextMenuMirrorH = useCallback(() => {
    if (selectedShapeIds.size > 0) {
      onMirrorHorizontal(Array.from(selectedShapeIds));
    }
  }, [selectedShapeIds, onMirrorHorizontal]);

  const handleContextMenuMirrorV = useCallback(() => {
    if (selectedShapeIds.size > 0) {
      onMirrorVertical(Array.from(selectedShapeIds));
    }
  }, [selectedShapeIds, onMirrorVertical]);

  const handleContextMenuBringToFront = useCallback(() => {
    if (contextMenu.shapeId && onMoveLayer) {
      onMoveLayer(contextMenu.shapeId, 'front');
    }
  }, [contextMenu.shapeId, onMoveLayer]);

  const handleContextMenuSendToBack = useCallback(() => {
    if (contextMenu.shapeId && onMoveLayer) {
      onMoveLayer(contextMenu.shapeId, 'back');
    }
  }, [contextMenu.shapeId, onMoveLayer]);

  // Sort shapes by zIndex for rendering
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

  // Calculate viewBox based on zoom and pan
  const viewBoxSize = CANVAS_SIZE / viewport.zoom;
  const viewBoxX = -viewport.panX / viewport.zoom;
  const viewBoxY = -viewport.panY / viewport.zoom;

  return (
    <>
      <svg
        ref={svgRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxSize} ${viewBoxSize}`}
        className="border touch-none overflow-visible border-(--color-border)"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleCanvasTouchStart}
        onTouchMove={handleCanvasTouchMove}
        onTouchEnd={handleCanvasTouchEnd}
        onTouchCancel={handleCanvasTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clip rect for the canvas content (shapes) */}
        <defs>
          <clipPath id="canvas-clip">
            <rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} />
          </clipPath>
        </defs>

        {/* Canvas background rect (for when zoomed out) */}
        <rect
          x={0}
          y={0}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          fill={backgroundColor || '#ffffff'}
          onMouseDown={() => !isSpacePressed && onSelectShape(null)}
        />

        {/* Render shapes - optionally clipped to canvas bounds */}
        <g clipPath={showOffCanvas ? undefined : "url(#canvas-clip)"}>
          {sortedShapes.map((shape) => (
            <g key={shape.id}>
              <g onMouseDown={(e) => !isSpacePressed && handleShapeMouseDown(e, shape.id)}>
                <ShapeElement
                  shape={shape}
                  color={challenge.colors[shape.colorIndex]}
                  isSelected={selectedShapeIds.has(shape.id)}
                />
              </g>
            </g>
          ))}
        </g>

        {/* Grid lines - rendered on top of shapes but don't export/print */}
        {showGrid && <CanvasGridLines zoom={viewport.zoom} showOffCanvas={showOffCanvas} />}

        {/* Interaction layers - outside clip path for better hit detection */}
        {!isSpacePressed && sortedShapes.map((shape) => (
          <g key={`interaction-${shape.id}`}>
            {/* Render invisible interaction layer for single-selected shape */}
            {hasSingleSelection && selectedShapeIds.has(shape.id) && (
              <TransformInteractionLayer
                shape={shape}
                zoom={viewport.zoom}
                onMoveStart={handleMoveStart}
                onResizeStart={handleResizeStart}
                onRotateStart={handleRotateStart}
              />
            )}
          </g>
        ))}

        {/* Render visible transform UI on top of everything - outside clip path */}
        {hasSingleSelection && singleSelectedShape && (
          <MultiSelectTransformLayer
            shapes={[singleSelectedShape]}
            bounds={selectionBounds!}
            zoom={viewport.zoom}
            showIndividualOutlines={true}
          />
        )}

        {/* Multi-select: interaction layer + visual layer */}
        {selectedShapes.length > 1 && selectionBounds && (
          <>
            {!isSpacePressed && (
              <MultiSelectInteractionLayer
                bounds={selectionBounds}
                zoom={viewport.zoom}
                onResizeStart={handleMultiResizeStart}
                onRotateStart={handleMultiRotateStart}
              />
            )}
            <MultiSelectTransformLayer
              shapes={selectedShapes}
              bounds={selectionBounds}
              zoom={viewport.zoom}
              showIndividualOutlines={true}
            />
          </>
        )}
      </svg>

      {/* Touch context menu */}
      {contextMenu.isOpen && (
        <TouchContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onDuplicate={handleContextMenuDuplicate}
          onDelete={handleContextMenuDelete}
          onMirrorHorizontal={handleContextMenuMirrorH}
          onMirrorVertical={handleContextMenuMirrorV}
          onBringToFront={handleContextMenuBringToFront}
          onSendToBack={handleContextMenuSendToBack}
        />
      )}
    </>
  );
}
