import { useRef, useCallback, useState, useEffect } from 'react';
import type { Shape, DailyChallenge } from '../types';
import { ShapeElement } from './ShapeElement';
import {
  TransformInteractionLayer,
  TransformVisualLayer,
} from './TransformHandles';

interface CanvasProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  backgroundColor: string | null;
  challenge: DailyChallenge;
  onSelectShape: (id: string | null) => void;
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
  onDuplicateShape: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
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
}

const CANVAS_SIZE = 800;

export function Canvas({
  shapes,
  selectedShapeId,
  backgroundColor,
  challenge,
  onSelectShape,
  onUpdateShape,
  onDuplicateShape,
  onUndo,
  onRedo,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const selectedShape = shapes.find((s) => s.id === selectedShapeId);

  const getSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      return { x: svgP.x, y: svgP.y };
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

      onSelectShape(shapeId);

      const point = getSVGPoint(e.clientX, e.clientY);
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
      });
    },
    [shapes, getSVGPoint, onSelectShape]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.stopPropagation();
      if (!selectedShape) return;

      const point = getSVGPoint(e.clientX, e.clientY);
      setDragState({
        mode: 'resize',
        shapeId: selectedShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: selectedShape.x,
        startShapeY: selectedShape.y,
        startSize: selectedShape.size,
        startRotation: selectedShape.rotation,
        resizeCorner: corner,
      });
    },
    [selectedShape, getSVGPoint]
  );

  const handleRotateStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedShape) return;

      const point = getSVGPoint(e.clientX, e.clientY);
      setDragState({
        mode: 'rotate',
        shapeId: selectedShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: selectedShape.x,
        startShapeY: selectedShape.y,
        startSize: selectedShape.size,
        startRotation: selectedShape.rotation,
        resizeCorner: '',
      });
    },
    [selectedShape, getSVGPoint]
  );

  const handleMoveStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedShape) return;

      const point = getSVGPoint(e.clientX, e.clientY);
      setDragState({
        mode: 'move',
        shapeId: selectedShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: selectedShape.x,
        startShapeY: selectedShape.y,
        startSize: selectedShape.size,
        startRotation: selectedShape.rotation,
        resizeCorner: '',
      });
    },
    [selectedShape, getSVGPoint]
  );

  useEffect(() => {
    if (!dragState || dragState.mode === 'none') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const draggedShape = shapes.find((s) => s.id === dragState.shapeId);
      if (!draggedShape) return;

      const point = getSVGPoint(e.clientX, e.clientY);

      if (dragState.mode === 'move') {
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;
        onUpdateShape(dragState.shapeId, {
          x: dragState.startShapeX + dx,
          y: dragState.startShapeY + dy,
        });
      } else if (dragState.mode === 'resize') {
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        // Calculate new size based on drag distance
        let sizeDelta = 0;
        if (dragState.resizeCorner === 'se') {
          // Dragging right/down increases size
          sizeDelta = Math.max(dx, dy);
        } else if (dragState.resizeCorner === 'nw') {
          // Dragging left/up increases size
          sizeDelta = Math.max(-dx, -dy);
        } else if (dragState.resizeCorner === 'ne') {
          // Dragging right/up increases size
          sizeDelta = Math.max(dx, -dy);
        } else if (dragState.resizeCorner === 'sw') {
          // Dragging left/down increases size
          sizeDelta = Math.max(-dx, dy);
        }

        const newSize = Math.max(20, dragState.startSize + sizeDelta);

        // Adjust position for corners that should anchor
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
      } else if (dragState.mode === 'rotate') {
        // Calculate angle from shape center to mouse
        const centerX = draggedShape.x + draggedShape.size / 2;
        const centerY = draggedShape.y + draggedShape.size / 2;

        const startAngle = Math.atan2(
          dragState.startY - centerY,
          dragState.startX - centerX
        );
        const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

        const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;
        let newRotation = dragState.startRotation + angleDelta;

        // Snap to 15-degree increments if shift is held
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }

        onUpdateShape(dragState.shapeId, { rotation: newRotation });
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
  }, [dragState, shapes, getSVGPoint, onUpdateShape]);

  // Handle keyboard shortcuts (movement, rotation, undo/redo, duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
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

      // Duplicate (c) - only when shape is selected
      if (e.code === 'KeyC' || e.key.toLowerCase() === 'c') {
        if (selectedShape) {
          e.preventDefault();
          onDuplicateShape(selectedShape.id);
          return;
        }
      }

      // Movement and rotation shortcuts require a selected shape
      if (!selectedShape) return;

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
        onUpdateShape(selectedShape.id, {
          x: selectedShape.x + dx,
          y: selectedShape.y + dy,
        });
      }

      if (dRotation !== 0) {
        onUpdateShape(selectedShape.id, {
          rotation: selectedShape.rotation + dRotation,
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape, onUpdateShape, onUndo, onRedo, onDuplicateShape]);

  // Sort shapes by zIndex for rendering
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <svg
      ref={svgRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="border border-gray-300"
      style={{ backgroundColor: backgroundColor || '#ffffff' }}
      onMouseDown={handleCanvasMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Render shapes with invisible interaction layer inline */}
      {sortedShapes.map((shape) => (
        <g key={shape.id}>
          <g onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}>
            <ShapeElement
              shape={shape}
              color={challenge.colors[shape.colorIndex]}
              isSelected={shape.id === selectedShapeId}
              onSelect={onSelectShape}
            />
          </g>
          {/* Render invisible interaction layer inline for proper click ordering */}
          {shape.id === selectedShapeId && (
            <TransformInteractionLayer
              shape={shape}
              onMoveStart={handleMoveStart}
              onResizeStart={handleResizeStart}
              onRotateStart={handleRotateStart}
            />
          )}
        </g>
      ))}

      {/* Render visible transform UI on top of everything */}
      {selectedShape && <TransformVisualLayer shape={selectedShape} />}
    </svg>
  );
}
