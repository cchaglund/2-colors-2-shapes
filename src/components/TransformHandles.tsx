import type { Shape } from '../types';
import { getShapeSVGData } from '../utils/shapeHelpers';

interface TransformHandlesProps {
  shape: Shape;
  onMoveStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
  onRotateStart: (e: React.MouseEvent) => void;
}

interface MultiSelectTransformLayerProps {
  shapes: Shape[];
  bounds: { x: number; y: number; width: number; height: number };
  showIndividualOutlines?: boolean;
}

interface MultiSelectInteractionLayerProps {
  bounds: { x: number; y: number; width: number; height: number };
  onMoveStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
  onRotateStart: (e: React.MouseEvent) => void;
}

const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 30;

function getCorners(width: number, height: number) {
  return [
    { id: 'nw', x: 0, y: 0 },
    { id: 'ne', x: width, y: 0 },
    { id: 'sw', x: 0, y: height },
    { id: 'se', x: width, y: height },
  ];
}

function getRotationHandles(width: number, height: number, offset: number) {
  return [
    { id: 'top', cx: width / 2, cy: -offset, x1: width / 2, y1: 0, x2: width / 2, y2: -offset },
    { id: 'bottom', cx: width / 2, cy: height + offset, x1: width / 2, y1: height, x2: width / 2, y2: height + offset },
    { id: 'left', cx: -offset, cy: height / 2, x1: 0, y1: height / 2, x2: -offset, y2: height / 2 },
    { id: 'right', cx: width + offset, cy: height / 2, x1: width, y1: height / 2, x2: width + offset, y2: height / 2 },
  ];
}

// Invisible interaction layer - rendered inline with shapes for proper click ordering
export function TransformInteractionLayer({
  shape,
  onMoveStart,
  onResizeStart,
  onRotateStart,
}: TransformHandlesProps) {
  const corners = getCorners(shape.size, shape.size);
  const rotationHandles = getRotationHandles(shape.size, shape.size, ROTATE_HANDLE_OFFSET);
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
  const corners = getCorners(shape.size, shape.size);
  const rotationHandles = getRotationHandles(shape.size, shape.size, ROTATE_HANDLE_OFFSET);
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

// Multi-select transform layer - shows bounding box for multiple shapes
export function MultiSelectTransformLayer({
  shapes,
  bounds,
  showIndividualOutlines = true,
}: MultiSelectTransformLayerProps) {
  const isSingleShape = shapes.length === 1;

  // For single shape, use the existing visual layer behavior
  if (isSingleShape) {
    const shape = shapes[0];
    const corners = getCorners(shape.size, shape.size);
    const rotationHandles = getRotationHandles(shape.size, shape.size, ROTATE_HANDLE_OFFSET);
    const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation}, ${shape.size / 2}, ${shape.size / 2})`;
    const { element, props } = getShapeSVGData(shape.type, shape.size);

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

  // For multiple shapes, show combined bounding box and individual outlines
  const corners = getCorners(bounds.width, bounds.height);
  const rotationHandles = getRotationHandles(bounds.width, bounds.height, ROTATE_HANDLE_OFFSET);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Individual shape outlines (black dashed) */}
      {showIndividualOutlines &&
        shapes.map((shape) => {
          const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation}, ${shape.size / 2}, ${shape.size / 2})`;
          const { element, props } = getShapeSVGData(shape.type, shape.size);

          const outlineProps = {
            ...props,
            fill: 'none',
            stroke: '#000',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          };

          return (
            <g key={shape.id} transform={transform}>
              {element === 'ellipse' && <ellipse {...outlineProps} />}
              {element === 'rect' && <rect {...outlineProps} />}
              {element === 'polygon' && <polygon {...outlineProps} />}
            </g>
          );
        })}

      {/* Combined bounding box (blue solid - same as single selection) */}
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="#0066ff"
        strokeWidth={1}
      />

      {/* Corner resize handles */}
      {corners.map((corner) => (
        <rect
          key={corner.id}
          x={bounds.x + corner.x - HANDLE_SIZE / 2}
          y={bounds.y + corner.y - HANDLE_SIZE / 2}
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
            x1={bounds.x + handle.x1}
            y1={bounds.y + handle.y1}
            x2={bounds.x + handle.x2}
            y2={bounds.y + handle.y2}
            stroke="#0066ff"
            strokeWidth={1}
          />
          <circle
            cx={bounds.x + handle.cx}
            cy={bounds.y + handle.cy}
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

// Invisible interaction layer for multi-select bounding box
export function MultiSelectInteractionLayer({
  bounds,
  onMoveStart,
  onResizeStart,
  onRotateStart,
}: MultiSelectInteractionLayerProps) {
  const corners = getCorners(bounds.width, bounds.height);
  const rotationHandles = getRotationHandles(bounds.width, bounds.height, ROTATE_HANDLE_OFFSET);

  return (
    <g style={{ pointerEvents: 'all' }}>
      {/* Invisible fill rect for dragging the group */}
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="transparent"
        style={{ cursor: 'move' }}
        onMouseDown={onMoveStart}
      />

      {/* Invisible corner resize handles */}
      {corners.map((corner) => (
        <rect
          key={corner.id}
          x={bounds.x + corner.x - HANDLE_SIZE / 2}
          y={bounds.y + corner.y - HANDLE_SIZE / 2}
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
          cx={bounds.x + handle.cx}
          cy={bounds.y + handle.cy}
          r={8}
          fill="transparent"
          style={{ cursor: 'grab' }}
          onMouseDown={onRotateStart}
        />
      ))}
    </g>
  );
}
