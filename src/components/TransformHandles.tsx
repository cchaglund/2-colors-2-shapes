import type { Shape } from '../types';

interface TransformHandlesProps {
  shape: Shape;
  onMoveStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
  onRotateStart: (e: React.MouseEvent) => void;
}

export function TransformHandles({
  shape,
  onMoveStart,
  onResizeStart,
  onRotateStart,
}: TransformHandlesProps) {
  const handleSize = 10;
  const rotateHandleOffset = 30;

  // Corner positions relative to shape
  const corners = [
    { id: 'nw', x: 0, y: 0 },
    { id: 'ne', x: shape.size, y: 0 },
    { id: 'sw', x: 0, y: shape.size },
    { id: 'se', x: shape.size, y: shape.size },
  ];

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
      {/* Bounding box */}
      <rect
        x={0}
        y={0}
        width={shape.size}
        height={shape.size}
        fill="none"
        stroke="#0066ff"
        strokeWidth={1}
        style={{ pointerEvents: 'none' }}
      />

      {/* Corner resize handles */}
      {corners.map((corner) => (
        <rect
          key={corner.id}
          x={corner.x - handleSize / 2}
          y={corner.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="white"
          stroke="#0066ff"
          strokeWidth={1}
          style={{ cursor: `${corner.id}-resize` }}
          onMouseDown={(e) => onResizeStart(e, corner.id)}
        />
      ))}

      {/* Rotation handle */}
      <line
        x1={shape.size / 2}
        y1={0}
        x2={shape.size / 2}
        y2={-rotateHandleOffset}
        stroke="#0066ff"
        strokeWidth={1}
      />
      <circle
        cx={shape.size / 2}
        cy={-rotateHandleOffset}
        r={6}
        fill="white"
        stroke="#0066ff"
        strokeWidth={1}
        style={{ cursor: 'grab' }}
        onMouseDown={onRotateStart}
      />
    </g>
  );
}
