import { useRef, useCallback, useState, useEffect } from 'react';
import type { Shape, DailyChallenge } from '../types';
import { ShapeElement } from './ShapeElement';
import { TransformHandles } from './TransformHandles';

interface CanvasProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  backgroundColor: string | null;
  challenge: DailyChallenge;
  onSelectShape: (id: string | null) => void;
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
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

  // Sort shapes by zIndex for rendering
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <svg
      ref={svgRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{
        border: '1px solid #ccc',
        backgroundColor: backgroundColor || '#ffffff',
      }}
      onMouseDown={handleCanvasMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Render shapes with transform handles inline (after selected shape) */}
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
          {/* Render transform handles right after the selected shape */}
          {shape.id === selectedShapeId && (
            <TransformHandles
              shape={shape}
              onMoveStart={handleMoveStart}
              onResizeStart={handleResizeStart}
              onRotateStart={handleRotateStart}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
