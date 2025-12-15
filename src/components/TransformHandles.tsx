import type { Shape } from '../types';
import { getShapeSVGData } from '../utils/shapeHelpers';

interface TransformHandlesProps {
  shape: Shape;
  onMoveStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
  onRotateStart: (e: React.MouseEvent) => void;
}

const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 30;

function getCorners(size: number) {
  return [
    { id: 'nw', x: 0, y: 0 },
    { id: 'ne', x: size, y: 0 },
    { id: 'sw', x: 0, y: size },
    { id: 'se', x: size, y: size },
  ];
}

function getRotationHandles(size: number, offset: number) {
  return [
    { id: 'top', cx: size / 2, cy: -offset, x1: size / 2, y1: 0, x2: size / 2, y2: -offset },
    { id: 'bottom', cx: size / 2, cy: size + offset, x1: size / 2, y1: size, x2: size / 2, y2: size + offset },
    { id: 'left', cx: -offset, cy: size / 2, x1: 0, y1: size / 2, x2: -offset, y2: size / 2 },
    { id: 'right', cx: size + offset, cy: size / 2, x1: size, y1: size / 2, x2: size + offset, y2: size / 2 },
  ];
}

// Invisible interaction layer - rendered inline with shapes for proper click ordering
export function TransformInteractionLayer({
  shape,
  onMoveStart,
  onResizeStart,
  onRotateStart,
}: TransformHandlesProps) {
  const corners = getCorners(shape.size);
  const rotationHandles = getRotationHandles(shape.size, ROTATE_HANDLE_OFFSET);
  const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation}, ${shape.size / 2}, ${shape.size / 2})`;

  return (
    <g transform={transform} style={{ pointerEvents: 'all' }}>
      {/* Invisible fill rect for dragging */}
      <rect
        x={0}
        y={0}
        width={shape.size}
        height={shape.size}
        fill="transparent"
        style={{ cursor: 'move' }}
        onMouseDown={onMoveStart}
      />

      {/* Invisible corner resize handles */}
      {corners.map((corner) => (
        <rect
          key={corner.id}
          x={corner.x - HANDLE_SIZE / 2}
          y={corner.y - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="transparent"
          style={{ cursor: `${corner.id}-resize` }}
          onMouseDown={(e) => onResizeStart(e, corner.id)}
        />
      ))}

      {/* Invisible rotation handles on all sides */}
      {rotationHandles.map((handle) => (
        <circle
          key={handle.id}
          cx={handle.cx}
          cy={handle.cy}
          r={8}
          fill="transparent"
          style={{ cursor: 'grab' }}
          onMouseDown={onRotateStart}
        />
      ))}
    </g>
  );
}

// Visible UI layer - rendered on top of everything
export function TransformVisualLayer({ shape }: { shape: Shape }) {
  const corners = getCorners(shape.size);
  const rotationHandles = getRotationHandles(shape.size, ROTATE_HANDLE_OFFSET);
  const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation}, ${shape.size / 2}, ${shape.size / 2})`;
  const { element, props } = getShapeSVGData(shape.type, shape.size);

  // Common props for the shape outline
  const outlineProps = {
    ...props,
    fill: 'none',
    stroke: '#000',
    strokeWidth: 2,
    strokeDasharray: '5,5',
  };

  return (
    <g transform={transform} style={{ pointerEvents: 'none' }}>
      {/* Shape outline (black dashed) */}
      {element === 'ellipse' && <ellipse {...outlineProps} />}
      {element === 'rect' && <rect {...outlineProps} />}
      {element === 'polygon' && <polygon {...outlineProps} />}

      {/* Bounding box (blue solid) */}
      <rect
        x={0}
        y={0}
        width={shape.size}
        height={shape.size}
        fill="none"
        stroke="#0066ff"
        strokeWidth={1}
      />

      {/* Corner resize handles */}
      {corners.map((corner) => (
        <rect
          key={corner.id}
          x={corner.x - HANDLE_SIZE / 2}
          y={corner.y - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="white"
          stroke="#0066ff"
          strokeWidth={1}
        />
      ))}

      {/* Rotation handles on all sides */}
      {rotationHandles.map((handle) => (
        <g key={handle.id}>
          <line
            x1={handle.x1}
            y1={handle.y1}
            x2={handle.x2}
            y2={handle.y2}
            stroke="#0066ff"
            strokeWidth={1}
          />
          <circle
            cx={handle.cx}
            cy={handle.cy}
            r={6}
            fill="white"
            stroke="#0066ff"
            strokeWidth={1}
          />
        </g>
      ))}
    </g>
  );
}
