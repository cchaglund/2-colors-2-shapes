import { useRef, useCallback, useState, useEffect } from 'react';
import type { Shape, DailyChallenge, ViewportState } from '../types';
import { ShapeElement } from './ShapeElement';
import {
  TransformInteractionLayer,
  MultiSelectTransformLayer,
  MultiSelectInteractionLayer,
} from './TransformHandles';

interface CanvasProps {
  shapes: Shape[];
  selectedShapeIds: Set<string>;
  backgroundColor: string | null;
  challenge: DailyChallenge;
  viewport: ViewportState;
  onSelectShape: (id: string | null, addToSelection?: boolean) => void;
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
  onUpdateShapes: (updates: Map<string, Partial<Shape>>) => void;
  onDuplicateShapes: (ids: string[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomAtPoint: (delta: number, pointX: number, pointY: number) => void;
  onPan: (panX: number, panY: number) => void;
}

type DragMode = 'none' | 'move' | 'resize' | 'rotate';

interface DragState {
  mode: DragMode;
  shapeId: string;
  startX: number;
  startY: number;
  startShapeX: number;
  startShapeY: number;
  startSize: number;
  startRotation: number;
  resizeCorner: string;
  // For multi-select: store start positions and sizes of all selected shapes
  startPositions?: Map<string, { x: number; y: number }>;
  startShapeData?: Map<string, { x: number; y: number; size: number; rotation: number }>;
  // For multi-select resize/rotate: store the initial bounds
  startBounds?: { x: number; y: number; width: number; height: number };
}

const CANVAS_SIZE = 800;

export function Canvas({
  shapes,
  selectedShapeIds,
  backgroundColor,
  challenge,
  viewport,
  onSelectShape,
  onUpdateShape,
  onUpdateShapes,
  onDuplicateShapes,
  onUndo,
  onRedo,
  onZoomAtPoint,
  onPan,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Get all selected shapes
  const selectedShapes = shapes.filter((s) => selectedShapeIds.has(s.id));
  const hasSelection = selectedShapes.length > 0;
  const hasSingleSelection = selectedShapes.length === 1;
  const singleSelectedShape = hasSingleSelection ? selectedShapes[0] : null;

  // Calculate bounding box for all selected shapes, accounting for rotation
  const getSelectionBounds = useCallback(() => {
    if (selectedShapes.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const shape of selectedShapes) {
      // Get the four corners of the shape's bounding box
      const corners = [
        { x: 0, y: 0 },
        { x: shape.size, y: 0 },
        { x: shape.size, y: shape.size },
        { x: 0, y: shape.size },
      ];

      // Rotation center is at the center of the shape
      const cx = shape.size / 2;
      const cy = shape.size / 2;
      const angleRad = (shape.rotation * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      // Rotate each corner around the center and translate to shape position
      for (const corner of corners) {
        const relX = corner.x - cx;
        const relY = corner.y - cy;
        const rotatedX = relX * cos - relY * sin;
        const rotatedY = relX * sin + relY * cos;
        const finalX = shape.x + cx + rotatedX;
        const finalY = shape.y + cy + rotatedY;

        minX = Math.min(minX, finalX);
        minY = Math.min(minY, finalY);
        maxX = Math.max(maxX, finalX);
        maxY = Math.max(maxY, finalY);
      }
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [selectedShapes]);

  const selectionBounds = getSelectionBounds();

  // Convert client coordinates to SVG/canvas coordinates
  // When using viewBox, getScreenCTM already accounts for the viewBox transform
  const getSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      // The viewBox transform is already applied by getScreenCTM
      return { x: svgP.x, y: svgP.y };
    },
    []
  );

  // Get client coordinates relative to the SVG element (for zoom center calculation)
  const getClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      // Return position relative to SVG element, normalized to 0-CANVAS_SIZE range
      return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
        y: ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
      };
    },
    []
  );

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
        // Shift+click: toggle selection
        onSelectShape(shapeId, true);

        // If we're removing from selection, don't start a drag
        if (isAlreadySelected) {
          return;
        }
      } else if (!isAlreadySelected) {
        // Click on unselected shape without shift: select only this shape
        onSelectShape(shapeId, false);
      }
      // If already selected without shift, don't change selection (allows dragging multiple)

      // Start drag for move
      const point = getSVGPoint(e.clientX, e.clientY);

      // Calculate which shapes to drag based on the new selection state
      let shapesToDrag: Shape[];
      if (isShiftKey) {
        // Shift+click on unselected: drag all currently selected shapes plus this one
        shapesToDrag = [...selectedShapes, shape];
      } else if (isAlreadySelected) {
        // Clicking on already selected shape: drag all selected
        shapesToDrag = selectedShapes;
      } else {
        // Clicking on unselected shape: drag just this one
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
    [shapes, selectedShapeIds, selectedShapes, getSVGPoint, onSelectShape]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.stopPropagation();
      if (!singleSelectedShape) return;

      const point = getSVGPoint(e.clientX, e.clientY);
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
      });
    },
    [singleSelectedShape, getSVGPoint]
  );

  const handleRotateStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!singleSelectedShape) return;

      const point = getSVGPoint(e.clientX, e.clientY);
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
      });
    },
    [singleSelectedShape, getSVGPoint]
  );

  const handleMoveStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasSelection) return;

      const point = getSVGPoint(e.clientX, e.clientY);

      // Store start positions for all selected shapes
      const startPositions = new Map<string, { x: number; y: number }>();
      selectedShapes.forEach(s => {
        startPositions.set(s.id, { x: s.x, y: s.y });
      });

      // Use the first selected shape as reference
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
    [hasSelection, selectedShapes, getSVGPoint]
  );

  // Multi-select resize handler
  const handleMultiResizeStart = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.stopPropagation();
      if (selectedShapes.length < 2 || !selectionBounds) return;

      const point = getSVGPoint(e.clientX, e.clientY);

      // Store start data for all selected shapes
      const startShapeData = new Map<string, { x: number; y: number; size: number; rotation: number }>();
      selectedShapes.forEach(s => {
        startShapeData.set(s.id, { x: s.x, y: s.y, size: s.size, rotation: s.rotation });
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
    [selectedShapes, selectionBounds, getSVGPoint]
  );

  // Multi-select rotate handler
  const handleMultiRotateStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (selectedShapes.length < 2 || !selectionBounds) return;

      const point = getSVGPoint(e.clientX, e.clientY);

      // Store start data for all selected shapes
      const startShapeData = new Map<string, { x: number; y: number; size: number; rotation: number }>();
      selectedShapes.forEach(s => {
        startShapeData.set(s.id, { x: s.x, y: s.y, size: s.size, rotation: s.rotation });
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
    [selectedShapes, selectionBounds, getSVGPoint]
  );

  useEffect(() => {
    if (!dragState || dragState.mode === 'none') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const point = getSVGPoint(e.clientX, e.clientY);

      if (dragState.mode === 'move') {
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        // Move all shapes in startPositions
        if (dragState.startPositions && dragState.startPositions.size > 1) {
          const updates = new Map<string, Partial<Shape>>();
          dragState.startPositions.forEach((startPos, id) => {
            updates.set(id, {
              x: startPos.x + dx,
              y: startPos.y + dy,
            });
          });
          onUpdateShapes(updates);
        } else {
          // Single shape move
          onUpdateShape(dragState.shapeId, {
            x: dragState.startShapeX + dx,
            y: dragState.startShapeY + dy,
          });
        }
      } else if (dragState.mode === 'resize') {
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        // Multi-select resize
        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;

          // Calculate scale factor based on drag
          let scaleDelta = 0;
          if (dragState.resizeCorner === 'se') {
            scaleDelta = Math.max(dx, dy);
          } else if (dragState.resizeCorner === 'nw') {
            scaleDelta = Math.max(-dx, -dy);
          } else if (dragState.resizeCorner === 'ne') {
            scaleDelta = Math.max(dx, -dy);
          } else if (dragState.resizeCorner === 'sw') {
            scaleDelta = Math.max(-dx, dy);
          }

          const maxDimension = Math.max(bounds.width, bounds.height);
          const scale = Math.max(0.1, (maxDimension + scaleDelta) / maxDimension);

          // Calculate anchor point based on corner
          let anchorX = bounds.x;
          let anchorY = bounds.y;
          if (dragState.resizeCorner === 'nw') {
            anchorX = bounds.x + bounds.width;
            anchorY = bounds.y + bounds.height;
          } else if (dragState.resizeCorner === 'ne') {
            anchorX = bounds.x;
            anchorY = bounds.y + bounds.height;
          } else if (dragState.resizeCorner === 'sw') {
            anchorX = bounds.x + bounds.width;
            anchorY = bounds.y;
          }

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            // Scale position relative to anchor
            const relX = startData.x - anchorX;
            const relY = startData.y - anchorY;
            const newX = anchorX + relX * scale;
            const newY = anchorY + relY * scale;
            const newSize = Math.max(20, startData.size * scale);

            updates.set(id, { x: newX, y: newY, size: newSize });
          });
          onUpdateShapes(updates);
        } else {
          // Single shape resize
          let sizeDelta = 0;
          if (dragState.resizeCorner === 'se') {
            sizeDelta = Math.max(dx, dy);
          } else if (dragState.resizeCorner === 'nw') {
            sizeDelta = Math.max(-dx, -dy);
          } else if (dragState.resizeCorner === 'ne') {
            sizeDelta = Math.max(dx, -dy);
          } else if (dragState.resizeCorner === 'sw') {
            sizeDelta = Math.max(-dx, dy);
          }

          const newSize = Math.max(20, dragState.startSize + sizeDelta);

          let newX = dragState.startShapeX;
          let newY = dragState.startShapeY;

          if (dragState.resizeCorner === 'nw') {
            newX = dragState.startShapeX + (dragState.startSize - newSize);
            newY = dragState.startShapeY + (dragState.startSize - newSize);
          } else if (dragState.resizeCorner === 'ne') {
            newY = dragState.startShapeY + (dragState.startSize - newSize);
          } else if (dragState.resizeCorner === 'sw') {
            newX = dragState.startShapeX + (dragState.startSize - newSize);
          }

          onUpdateShape(dragState.shapeId, {
            size: newSize,
            x: newX,
            y: newY,
          });
        }
      } else if (dragState.mode === 'rotate') {
        // Multi-select rotate
        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;

          const startAngle = Math.atan2(
            dragState.startY - centerY,
            dragState.startX - centerX
          );
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

          let angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;

          if (e.shiftKey) {
            angleDelta = Math.round(angleDelta / 15) * 15;
          }

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            // Rotate position around the center of the bounding box
            const shapeCenter = {
              x: startData.x + startData.size / 2,
              y: startData.y + startData.size / 2,
            };
            const relX = shapeCenter.x - centerX;
            const relY = shapeCenter.y - centerY;
            const angleRad = (angleDelta * Math.PI) / 180;
            const rotatedX = relX * Math.cos(angleRad) - relY * Math.sin(angleRad);
            const rotatedY = relX * Math.sin(angleRad) + relY * Math.cos(angleRad);
            const newCenterX = centerX + rotatedX;
            const newCenterY = centerY + rotatedY;

            updates.set(id, {
              x: newCenterX - startData.size / 2,
              y: newCenterY - startData.size / 2,
              rotation: startData.rotation + angleDelta,
            });
          });
          onUpdateShapes(updates);
        } else {
          // Single shape rotate
          const draggedShape = shapes.find((s) => s.id === dragState.shapeId);
          if (!draggedShape) return;

          const centerX = draggedShape.x + draggedShape.size / 2;
          const centerY = draggedShape.y + draggedShape.size / 2;

          const startAngle = Math.atan2(
            dragState.startY - centerY,
            dragState.startX - centerX
          );
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

          const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;
          let newRotation = dragState.startRotation + angleDelta;

          if (e.shiftKey) {
            newRotation = Math.round(newRotation / 15) * 15;
          }

          onUpdateShape(dragState.shapeId, { rotation: newRotation });
        }
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, shapes, getSVGPoint, onUpdateShape, onUpdateShapes]);

  // Handle keyboard shortcuts (movement, rotation, undo/redo, duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Undo/Redo (w / Shift+w)
      if (e.code === 'KeyW' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }

      // Duplicate (c) - only when shapes are selected
      if (e.code === 'KeyC' || e.key.toLowerCase() === 'c') {
        if (selectedShapes.length > 0) {
          e.preventDefault();
          // Duplicate all selected shapes
          onDuplicateShapes(selectedShapes.map(s => s.id));
          return;
        }
      }

      // Movement and rotation shortcuts require selected shapes
      if (!hasSelection) return;

      const SMALL_MOVE = 1;
      const LARGE_MOVE = 10;
      const SMALL_ROTATE = 1;
      const LARGE_ROTATE = 15;

      const moveStep = e.shiftKey ? LARGE_MOVE : SMALL_MOVE;
      const rotateStep = e.shiftKey ? LARGE_ROTATE : SMALL_ROTATE;

      let dx = 0;
      let dy = 0;
      let dRotation = 0;

      switch (e.code) {
        case 'ArrowUp':
          dy = -moveStep;
          break;
        case 'ArrowDown':
          dy = moveStep;
          break;
        case 'ArrowLeft':
          dx = -moveStep;
          break;
        case 'ArrowRight':
          dx = moveStep;
          break;
        case 'Period':
          dRotation = rotateStep;
          break;
        case 'Comma':
          dRotation = -rotateStep;
          break;
        default:
          return;
      }

      e.preventDefault();

      if (dx !== 0 || dy !== 0) {
        // Move all selected shapes
        const updates = new Map<string, Partial<Shape>>();
        selectedShapes.forEach(shape => {
          updates.set(shape.id, {
            x: shape.x + dx,
            y: shape.y + dy,
          });
        });
        onUpdateShapes(updates);
      }

      if (dRotation !== 0) {
        // Rotate all selected shapes
        const updates = new Map<string, Partial<Shape>>();
        selectedShapes.forEach(shape => {
          updates.set(shape.id, {
            rotation: shape.rotation + dRotation,
          });
        });
        onUpdateShapes(updates);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapes, hasSelection, onUpdateShapes, onUndo, onRedo, onDuplicateShapes]);

  // Handle spacebar for panning mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle panning when space is pressed
  useEffect(() => {
    if (!isSpacePressed) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!isSpacePressed) return;
      e.preventDefault();
      setIsPanning(true);
      const point = getClientPoint(e.clientX, e.clientY);
      panStartRef.current = {
        x: point.x,
        y: point.y,
        panX: viewport.panX,
        panY: viewport.panY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !panStartRef.current) return;
      const point = getClientPoint(e.clientX, e.clientY);
      const dx = point.x - panStartRef.current.x;
      const dy = point.y - panStartRef.current.y;
      onPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSpacePressed, isPanning, viewport.panX, viewport.panY, getClientPoint, onPan]);

  // Handle wheel zoom (Ctrl/Cmd + scroll)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Check for Ctrl (Windows/Linux) or Meta/Cmd (Mac)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const point = getClientPoint(e.clientX, e.clientY);
        // Normalize wheel delta (different browsers have different values)
        const delta = -Math.sign(e.deltaY);
        onZoomAtPoint(delta, point.x, point.y);
      }
    },
    [getClientPoint, onZoomAtPoint]
  );

  // Sort shapes by zIndex for rendering
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

  // Calculate viewBox based on zoom and pan
  const viewBoxSize = CANVAS_SIZE / viewport.zoom;
  const viewBoxX = -viewport.panX / viewport.zoom;
  const viewBoxY = -viewport.panY / viewport.zoom;

  // Cursor style based on panning state
  const cursorStyle = isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default';

  return (
    <svg
      ref={svgRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxSize} ${viewBoxSize}`}
      className="border border-gray-300"
      style={{
        overflow: 'visible',
        cursor: cursorStyle,
      }}
      onMouseDown={handleCanvasMouseDown}
      onClick={(e) => e.stopPropagation()}
      onWheel={handleWheel}
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

      {/* Render shapes clipped to canvas bounds */}
      <g clipPath="url(#canvas-clip)">
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
  );
}
