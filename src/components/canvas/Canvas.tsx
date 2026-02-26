import { useRef, useState, useCallback, useMemo } from 'react';
import type { Shape, ShapeGroup, DailyChallenge, ViewportState } from '../../types';
import { CANVAS_SIZE } from '../../types/canvas';
import { getShapeDimensions } from '../../utils/shapes';
import { getVisibleShapes } from '../../utils/visibility';
import { ShapeElement } from './ShapeElement';
import { SVGShape } from '../shared/SVGShape';
import {
  TransformInteractionLayer,
  MultiSelectTransformLayer,
  MultiSelectInteractionLayer,
  HoverHighlightLayer,
} from './TransformHandles';
import { type KeyMappings } from '../../constants/keyboardActions';
import { type EditorTool } from './BottomToolbar';
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
import { useMarqueeSelection } from '../../hooks/canvas/useMarqueeSelection';
import { useStampMode } from '../../hooks/canvas/useStampMode';

interface CanvasProps {
  shapes: Shape[];
  groups: ShapeGroup[];
  selectedShapeIds: Set<string>;
  backgroundColor: string | null;
  challenge: DailyChallenge;
  viewport: ViewportState;
  keyMappings: KeyMappings;
  showGrid?: boolean;
  showOffCanvas?: boolean;
  onSelectShape: (id: string | null, options?: { toggle?: boolean; range?: boolean; orderedIds?: string[] }) => void;
  onSelectShapes: (ids: string[], options?: { additive?: boolean }) => void;
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
  hoveredShapeIds?: Set<string> | null;
  marqueeStartRef?: React.MutableRefObject<((clientX: number, clientY: number) => void) | null>;
  editorTool: EditorTool;
  selectedColorIndex: number;
  onAddShape: (shapeIndex: number, colorIndex: number, options?: { x?: number; y?: number; size?: number }) => void;
  onSetTool: (tool: EditorTool) => void;
}

export function Canvas({
  shapes,
  groups,
  selectedShapeIds,
  backgroundColor,
  challenge,
  viewport,
  keyMappings,
  showGrid,
  showOffCanvas,
  onSelectShape,
  onSelectShapes,
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
  hoveredShapeIds,
  marqueeStartRef,
  editorTool,
  selectedColorIndex,
  onAddShape,
  onSetTool,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter to only visible shapes
  const visibleShapes = useMemo(() => getVisibleShapes(shapes, groups), [shapes, groups]);

  // Exclude hidden shapes from effective selection (don't show transform handles for hidden shapes)
  const effectiveSelectedShapeIds = useMemo(() => {
    const visibleIds = new Set(visibleShapes.map(s => s.id));
    const filtered = new Set<string>();
    selectedShapeIds.forEach(id => { if (visibleIds.has(id)) filtered.add(id); });
    return filtered;
  }, [visibleShapes, selectedShapeIds]);

  // Use extracted hooks
  const { getSVGPoint, getClientPoint } = useCanvasCoordinates(svgRef);

  const {
    selectedShapes,
    hasSelection,
    hasSingleSelection,
    singleSelectedShape,
    selectionBounds,
  } = useSelectionBounds(visibleShapes, effectiveSelectedShapeIds);

  const { isSpacePressed, cursorStyle } = useCanvasPanning(
    viewport,
    keyMappings,
    getClientPoint,
    onPan
  );

  const { marqueeState, startMarqueeAt } = useMarqueeSelection({
    shapes: visibleShapes,
    groups,
    getSVGPoint,
    isSpacePressed,
    onSelectShapes,
    onSelectShape,
  });

  // Expose startMarqueeAt to parent so marquee can start from outside the SVG
  if (marqueeStartRef) {
    marqueeStartRef.current = startMarqueeAt;
  }

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
    groups,
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

  // Stamp mode
  const {
    isStampMode,
    shapeIndex: stampShapeIndex,
    ghost: stampGhost,
    handleMouseMove: handleStampMouseMove,
    handleMouseLeave: handleStampMouseLeave,
    handleMouseDown: handleStampMouseDown,
  } = useStampMode({
    editorTool,
    selectedColorIndex,
    getSVGPoint,
    onAddShape,
    onSetTool,
  });

  // Track which transform handle is hovered for visual feedback (1.3x scale)
  const [hoveredHandleId, setHoveredHandleId] = useState<string | null>(null);

  // Event handlers that need to set drag state
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isStampMode) {
      handleStampMouseDown(e);
      return;
    }
    if (e.target === svgRef.current) {
      startMarqueeAt(e.clientX, e.clientY);
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

  // Sort visible shapes by zIndex for rendering
  const sortedShapes = useMemo(() => [...visibleShapes].sort((a, b) => a.zIndex - b.zIndex), [visibleShapes]);

  // Compute shapes to highlight on hover (excluding already-selected and hidden shapes)
  const hoveredShapes = useMemo(() => {
    if (!hoveredShapeIds || hoveredShapeIds.size === 0) return [];
    return visibleShapes.filter(s => hoveredShapeIds.has(s.id) && !effectiveSelectedShapeIds.has(s.id));
  }, [visibleShapes, hoveredShapeIds, effectiveSelectedShapeIds]);

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
        style={{ cursor: isStampMode ? 'crosshair' : marqueeState ? 'crosshair' : cursorStyle }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={isStampMode ? handleStampMouseMove : undefined}
        onMouseLeave={isStampMode ? handleStampMouseLeave : undefined}
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
          fill={backgroundColor || 'var(--color-bg-elevated)'}
          onMouseDown={(e) => {
            if (isStampMode) {
              handleStampMouseDown(e);
              return;
            }
            if (!isSpacePressed) startMarqueeAt(e.clientX, e.clientY);
          }}
        />

        {/* Render shapes - optionally clipped to canvas bounds */}
        <g clipPath={showOffCanvas ? undefined : "url(#canvas-clip)"}>
          {sortedShapes.map((shape) => (
            <g key={shape.id}>
              <g onMouseDown={(e) => {
                if (isStampMode) {
                  handleStampMouseDown(e);
                  return;
                }
                if (!isSpacePressed) handleShapeMouseDown(e, shape.id);
              }}>
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

        {/* Hover highlight from layer panel */}
        {hoveredShapes.length > 0 && (
          <HoverHighlightLayer shapes={hoveredShapes} zoom={viewport.zoom} />
        )}

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
                onHandleHover={setHoveredHandleId}
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
            hoveredHandleId={hoveredHandleId}
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
                onHandleHover={setHoveredHandleId}
              />
            )}
            <MultiSelectTransformLayer
              shapes={selectedShapes}
              bounds={selectionBounds}
              zoom={viewport.zoom}
              showIndividualOutlines={true}
              hoveredHandleId={hoveredHandleId}
            />
          </>
        )}

        {/* Ghost cursor for stamp mode */}
        {isStampMode && stampGhost && challenge && (
          <g style={{ opacity: 0.35 }} pointerEvents="none">
            <SVGShape
              type={challenge.shapes[stampShapeIndex].type}
              size={60}
              x={stampGhost.x - 30}
              y={stampGhost.y - 30}
              rotation={0}
              color={challenge.colors[selectedColorIndex]}
            />
          </g>
        )}

        {/* Marquee selection rectangle */}
        {marqueeState && (
          <rect
            x={Math.min(marqueeState.startX, marqueeState.currentX)}
            y={Math.min(marqueeState.startY, marqueeState.currentY)}
            width={Math.abs(marqueeState.currentX - marqueeState.startX)}
            height={Math.abs(marqueeState.currentY - marqueeState.startY)}
            style={{ fill: 'var(--sel-hover-fill)', stroke: 'var(--sel-border)' }}
            strokeWidth={1 / viewport.zoom}
            strokeDasharray={`${4 / viewport.zoom} ${2 / viewport.zoom}`}
            pointerEvents="none"
          />
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
