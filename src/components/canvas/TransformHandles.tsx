import type { Shape } from '../../types';
import { getShapeSVGData } from '../../utils/shapes';

interface TransformHandlesProps {
  shape: Shape;
  zoom?: number;
  onMoveStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, corner: string) => void;
  onRotateStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onHandleHover?: (handleId: string | null) => void;
}

interface MultiSelectTransformLayerProps {
  shapes: Shape[];
  bounds: { x: number; y: number; width: number; height: number };
  zoom?: number;
  showIndividualOutlines?: boolean;
  hoveredHandleId?: string | null;
}

interface MultiSelectInteractionLayerProps {
  bounds: { x: number; y: number; width: number; height: number };
  zoom?: number;
  onMoveStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, corner: string) => void;
  onRotateStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onHandleHover?: (handleId: string | null) => void;
}

// Base sizes at 100% zoom
const BASE_HANDLE_SIZE = 10;
const BASE_ROTATE_HANDLE_OFFSET = 30;
const BASE_ROTATE_HANDLE_RADIUS = 6;
const BASE_INTERACTION_RADIUS = 8;
const BASE_STROKE_WIDTH = 1;
const BASE_DASH_STROKE_WIDTH = 2;

/** 8 resize handles: 4 corners + 4 midpoints */
function getResizeHandles(width: number, height: number) {
  return [
    { id: 'nw', x: 0, y: 0 },
    { id: 'n', x: width / 2, y: 0 },
    { id: 'ne', x: width, y: 0 },
    { id: 'e', x: width, y: height / 2 },
    { id: 'se', x: width, y: height },
    { id: 's', x: width / 2, y: height },
    { id: 'sw', x: 0, y: height },
    { id: 'w', x: 0, y: height / 2 },
  ];
}

/** Single rotation handle at top center with stem line */
function getRotationHandle(width: number, _height: number, offset: number) {
  return {
    id: 'rotate',
    cx: width / 2,
    cy: -offset,
    x1: width / 2,
    y1: 0,
    x2: width / 2,
    y2: -offset,
  };
}

// Get the effective cursor for a resize handle, accounting for rotation and flip transforms
// The cursor should always point away from the center of the shape in screen space
function getEffectiveCursor(handleId: string, flipX: boolean, flipY: boolean, rotation: number): string {
  // Local handle offsets from center (before any transforms)
  const handleVectors: Record<string, { x: number; y: number }> = {
    nw: { x: -1, y: -1 },
    n: { x: 0, y: -1 },
    ne: { x: 1, y: -1 },
    e: { x: 1, y: 0 },
    se: { x: 1, y: 1 },
    s: { x: 0, y: 1 },
    sw: { x: -1, y: 1 },
    w: { x: -1, y: 0 },
  };

  const local = handleVectors[handleId] || { x: 1, y: 1 };

  // SVG transform order is right-to-left: rotate first, then flip
  // So we apply: rotation, then flip

  // Step 1: Apply rotation
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotatedX = local.x * cos - local.y * sin;
  const rotatedY = local.x * sin + local.y * cos;

  // Step 2: Apply flip
  const screenX = rotatedX * (flipX ? -1 : 1);
  const screenY = rotatedY * (flipY ? -1 : 1);

  // Convert to angle (0 = right/east, goes clockwise)
  let angle = Math.atan2(screenY, screenX) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  // Map the angle to the nearest cursor direction
  // Cursors are at 45° intervals: 0=e, 45=se, 90=s, 135=sw, 180=w, 225=nw, 270=n, 315=ne
  const cursorMap = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
  const index = Math.round(angle / 45) % 8;
  const cursor = cursorMap[index];

  // Convert cardinal directions to resize cursors
  // n/s use ns-resize, e/w use ew-resize, diagonals use their standard names
  if (cursor === 'n' || cursor === 's') return 'ns-resize';
  if (cursor === 'e' || cursor === 'w') return 'ew-resize';
  return `${cursor}-resize`;
}

/** Shared style for themed resize handles */
function getHandleStyle(isHovered: boolean): React.CSSProperties {
  return {
    fill: 'var(--sel-handle-fill)',
    stroke: 'var(--sel-handle-stroke)',
    rx: 'var(--sel-handle-radius)',
    ry: 'var(--sel-handle-radius)',
    transformBox: 'fill-box' as const,
    transformOrigin: 'center',
    transform: isHovered ? 'scale(1.3)' : undefined,
    transition: 'transform 0.15s ease',
  };
}

/** Shared style for rotation handle circle */
function getRotateHandleStyle(isHovered: boolean): React.CSSProperties {
  return {
    fill: 'var(--sel-handle-fill)',
    stroke: 'var(--sel-rotate-color)',
    transformBox: 'fill-box' as const,
    transformOrigin: 'center',
    transform: isHovered ? 'scale(1.3)' : undefined,
    transition: 'transform 0.15s ease',
  };
}

/** Build SVG transform string matching ShapeElement's flip + rotation order */
function buildShapeTransform(shape: Shape, centerX: number, centerY: number): string {
  const scaleX = shape.flipX ? -1 : 1;
  const scaleY = shape.flipY ? -1 : 1;
  return `translate(${shape.x}, ${shape.y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${shape.rotation}, ${centerX}, ${centerY})`;
}

// Invisible interaction layer - rendered inline with shapes for proper click ordering
export function TransformInteractionLayer({
  shape,
  zoom = 1,
  onMoveStart,
  onResizeStart,
  onRotateStart,
  onHandleHover,
}: TransformHandlesProps) {
  // Scale handle sizes inversely with zoom to maintain constant visual size
  const scale = 1 / zoom;
  const handleSize = BASE_HANDLE_SIZE * scale;
  const rotateOffset = BASE_ROTATE_HANDLE_OFFSET * scale;
  const interactionRadius = BASE_INTERACTION_RADIUS * scale;

  const { viewBox } = getShapeSVGData(shape.type, shape.size);
  const resizeHandles = getResizeHandles(viewBox.width, viewBox.height);
  const rotationHandle = getRotationHandle(viewBox.width, viewBox.height, rotateOffset);
  const centerX = viewBox.width / 2;
  const centerY = viewBox.height / 2;
  const transform = buildShapeTransform(shape, centerX, centerY);

  return (
    <g transform={transform} style={{ pointerEvents: 'all' }}>
      {/* Invisible fill rect for dragging */}
      <rect
        x={0}
        y={0}
        width={viewBox.width}
        height={viewBox.height}
        fill="transparent"
        style={{ cursor: 'move', touchAction: 'none' }}
        onMouseDown={onMoveStart}
        onTouchStart={onMoveStart}
      />

      {/* Invisible resize handles (8: corners + midpoints) */}
      {resizeHandles.map((handle) => (
        <rect
          key={handle.id}
          x={handle.x - handleSize / 2}
          y={handle.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="transparent"
          style={{ cursor: getEffectiveCursor(handle.id, shape.flipX ?? false, shape.flipY ?? false, shape.rotation), touchAction: 'none' }}
          onMouseDown={(e) => onResizeStart(e, handle.id)}
          onTouchStart={(e) => onResizeStart(e, handle.id)}
          onMouseEnter={() => onHandleHover?.(handle.id)}
          onMouseLeave={() => onHandleHover?.(null)}
        />
      ))}

      {/* Invisible rotation handle (top center only) */}
      <circle
        cx={rotationHandle.cx}
        cy={rotationHandle.cy}
        r={interactionRadius}
        fill="transparent"
        style={{ cursor: 'grab', touchAction: 'none' }}
        onMouseDown={onRotateStart}
        onTouchStart={onRotateStart}
        onMouseEnter={() => onHandleHover?.('rotate')}
        onMouseLeave={() => onHandleHover?.(null)}
      />
    </g>
  );
}

// Visible UI layer - rendered on top of everything
export function TransformVisualLayer({
  shape,
  zoom = 1,
  hoveredHandleId,
}: {
  shape: Shape;
  zoom?: number;
  hoveredHandleId?: string | null;
}) {
  // Scale sizes inversely with zoom
  const scale = 1 / zoom;
  const handleSize = BASE_HANDLE_SIZE * scale;
  const rotateOffset = BASE_ROTATE_HANDLE_OFFSET * scale;
  const rotateRadius = BASE_ROTATE_HANDLE_RADIUS * scale;
  const strokeWidth = BASE_STROKE_WIDTH * scale;
  const dashStrokeWidth = BASE_DASH_STROKE_WIDTH * scale;

  const { element, props, viewBox, outlineD } = getShapeSVGData(shape.type, shape.size);
  const resizeHandles = getResizeHandles(viewBox.width, viewBox.height);
  const rotationHandle = getRotationHandle(viewBox.width, viewBox.height, rotateOffset);
  const centerX = viewBox.width / 2;
  const centerY = viewBox.height / 2;
  const transform = buildShapeTransform(shape, centerX, centerY);

  // Common props for the shape outline
  const outlineProps = {
    ...props,
    ...(outlineD && { d: outlineD }),
    fill: 'none',
    stroke: 'var(--color-text-primary)',
    strokeWidth: dashStrokeWidth,
    strokeDasharray: `${5 * scale},${5 * scale}`,
  };

  return (
    <g transform={transform} style={{ pointerEvents: 'none' }}>
      {/* Bounding box — solid or dashed per theme (--sel-dash) */}
      <rect
        x={0}
        y={0}
        width={viewBox.width}
        height={viewBox.height}
        fill="none"
        style={{ stroke: 'var(--sel-border)', strokeDasharray: 'var(--sel-dash)' }}
        strokeWidth={strokeWidth}
      />

      {/* Shape outline (dashed) — rendered after bounding box so it's visible on rect shapes */}
      {element === 'ellipse' && <ellipse {...outlineProps} />}
      {element === 'rect' && <rect {...outlineProps} />}
      {element === 'polygon' && <polygon {...outlineProps} />}
      {element === 'path' && <path {...outlineProps} />}

      {/* Resize handles (8: corners + midpoints) */}
      {resizeHandles.map((handle) => (
        <rect
          key={handle.id}
          x={handle.x - handleSize / 2}
          y={handle.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          style={getHandleStyle(hoveredHandleId === handle.id)}
          strokeWidth={strokeWidth}
        />
      ))}

      {/* Rotation handle — top center with stem line */}
      <line
        x1={rotationHandle.x1}
        y1={rotationHandle.y1}
        x2={rotationHandle.x2}
        y2={rotationHandle.y2}
        style={{ stroke: 'var(--sel-rotate-color)' }}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={rotationHandle.cx}
        cy={rotationHandle.cy}
        r={rotateRadius}
        style={getRotateHandleStyle(hoveredHandleId === 'rotate')}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

// Multi-select transform layer - shows bounding box for multiple shapes
export function MultiSelectTransformLayer({
  shapes,
  bounds,
  zoom = 1,
  showIndividualOutlines = true,
  hoveredHandleId,
}: MultiSelectTransformLayerProps) {
  // Scale sizes inversely with zoom
  const scale = 1 / zoom;
  const handleSize = BASE_HANDLE_SIZE * scale;
  const rotateOffset = BASE_ROTATE_HANDLE_OFFSET * scale;
  const rotateRadius = BASE_ROTATE_HANDLE_RADIUS * scale;
  const strokeWidth = BASE_STROKE_WIDTH * scale;
  const dashStrokeWidth = BASE_DASH_STROKE_WIDTH * scale;

  const isSingleShape = shapes.length === 1;

  // For single shape, use the existing visual layer behavior
  if (isSingleShape) {
    const shape = shapes[0];
    const { element, props, viewBox, outlineD } = getShapeSVGData(shape.type, shape.size);
    const resizeHandles = getResizeHandles(viewBox.width, viewBox.height);
    const rotationHandle = getRotationHandle(viewBox.width, viewBox.height, rotateOffset);
    const centerX = viewBox.width / 2;
    const centerY = viewBox.height / 2;
    const transform = buildShapeTransform(shape, centerX, centerY);

    const outlineProps = {
      ...props,
      ...(outlineD && { d: outlineD }),
      fill: 'none',
      stroke: 'var(--color-text-primary)',
      strokeWidth: dashStrokeWidth,
      strokeDasharray: `${5 * scale},${5 * scale}`,
    };

    return (
      <g transform={transform} style={{ pointerEvents: 'none' }}>
        {/* Bounding box — solid or dashed per theme (--sel-dash) */}
        <rect
          x={0}
          y={0}
          width={viewBox.width}
          height={viewBox.height}
          fill="none"
          style={{ stroke: 'var(--sel-border)', strokeDasharray: 'var(--sel-dash)' }}
          strokeWidth={strokeWidth}
        />

        {/* Shape outline (dashed) — rendered after bounding box so it's visible on rect shapes */}
        {element === 'ellipse' && <ellipse {...outlineProps} />}
        {element === 'rect' && <rect {...outlineProps} />}
        {element === 'polygon' && <polygon {...outlineProps} />}
        {element === 'path' && <path {...outlineProps} />}

        {/* Resize handles (8: corners + midpoints) */}
        {resizeHandles.map((handle) => (
          <rect
            key={handle.id}
            x={handle.x - handleSize / 2}
            y={handle.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            style={getHandleStyle(hoveredHandleId === handle.id)}
            strokeWidth={strokeWidth}
          />
        ))}

        {/* Rotation handle — top center with stem line */}
        <line
          x1={rotationHandle.x1}
          y1={rotationHandle.y1}
          x2={rotationHandle.x2}
          y2={rotationHandle.y2}
          style={{ stroke: 'var(--sel-rotate-color)' }}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={rotationHandle.cx}
          cy={rotationHandle.cy}
          r={rotateRadius}
          style={getRotateHandleStyle(hoveredHandleId === 'rotate')}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  }

  // For multiple shapes, show combined bounding box and individual dashed outlines
  const resizeHandles = getResizeHandles(bounds.width, bounds.height);
  const rotationHandle = getRotationHandle(bounds.width, bounds.height, rotateOffset);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Individual shape outlines — shape-specific dashed outlines per-shape */}
      {showIndividualOutlines &&
        shapes.map((shape) => {
          const { element, props, viewBox, outlineD } = getShapeSVGData(shape.type, shape.size);
          const centerX = viewBox.width / 2;
          const centerY = viewBox.height / 2;
          const transform = buildShapeTransform(shape, centerX, centerY);

          const outlineProps = {
            ...props,
            ...(outlineD && { d: outlineD }),
            fill: 'none',
            stroke: 'var(--color-text-primary)',
            strokeWidth: dashStrokeWidth,
            strokeDasharray: `${5 * scale},${5 * scale}`,
            opacity: 0.8,
          };

          return (
            <g key={shape.id} transform={transform}>
              {element === 'ellipse' && <ellipse {...outlineProps} />}
              {element === 'rect' && <rect {...outlineProps} />}
              {element === 'polygon' && <polygon {...outlineProps} />}
              {element === 'path' && <path {...outlineProps} />}
            </g>
          );
        })}

      {/* Combined bounding box — solid or dashed per theme (--sel-dash) */}
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        style={{ stroke: 'var(--sel-border)', strokeDasharray: 'var(--sel-dash)' }}
        strokeWidth={strokeWidth}
      />

      {/* Resize handles (8: corners + midpoints) */}
      {resizeHandles.map((handle) => (
        <rect
          key={handle.id}
          x={bounds.x + handle.x - handleSize / 2}
          y={bounds.y + handle.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          style={getHandleStyle(hoveredHandleId === handle.id)}
          strokeWidth={strokeWidth}
        />
      ))}

      {/* Rotation handle — top center with stem line */}
      <line
        x1={bounds.x + rotationHandle.x1}
        y1={bounds.y + rotationHandle.y1}
        x2={bounds.x + rotationHandle.x2}
        y2={bounds.y + rotationHandle.y2}
        style={{ stroke: 'var(--sel-rotate-color)' }}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={bounds.x + rotationHandle.cx}
        cy={bounds.y + rotationHandle.cy}
        r={rotateRadius}
        style={getRotateHandleStyle(hoveredHandleId === 'rotate')}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

// Hover highlight layer - shows dashed outline for shapes hovered in the layer panel
export function HoverHighlightLayer({ shapes, zoom = 1 }: { shapes: Shape[]; zoom?: number }) {
  const scale = 1 / zoom;
  const strokeWidth = 2 * scale;
  const dashLength = 6 * scale;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {shapes.map((shape) => {
        const { viewBox } = getShapeSVGData(shape.type, shape.size);
        const centerX = viewBox.width / 2;
        const centerY = viewBox.height / 2;
        const transform = buildShapeTransform(shape, centerX, centerY);

        return (
          <g key={shape.id} transform={transform}>
            <rect
              x={0}
              y={0}
              width={viewBox.width}
              height={viewBox.height}
              fill="none"
              style={{ stroke: 'var(--color-accent)' }}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength},${dashLength}`}
            />
          </g>
        );
      })}
    </g>
  );
}

// Invisible interaction layer for multi-select bounding box
// Note: No fill rect here - moving is handled by clicking on actual shapes
export function MultiSelectInteractionLayer({
  bounds,
  zoom = 1,
  onResizeStart,
  onRotateStart,
  onHandleHover,
}: Omit<MultiSelectInteractionLayerProps, 'onMoveStart'>) {
  // Scale sizes inversely with zoom
  const scale = 1 / zoom;
  const handleSize = BASE_HANDLE_SIZE * scale;
  const rotateOffset = BASE_ROTATE_HANDLE_OFFSET * scale;
  const interactionRadius = BASE_INTERACTION_RADIUS * scale;

  const resizeHandles = getResizeHandles(bounds.width, bounds.height);
  const rotationHandle = getRotationHandle(bounds.width, bounds.height, rotateOffset);

  return (
    <g style={{ pointerEvents: 'all' }}>
      {/* Invisible resize handles (8: corners + midpoints) */}
      {resizeHandles.map((handle) => (
        <rect
          key={handle.id}
          x={bounds.x + handle.x - handleSize / 2}
          y={bounds.y + handle.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="transparent"
          style={{ cursor: `${handle.id}-resize`, touchAction: 'none' }}
          onMouseDown={(e) => onResizeStart(e, handle.id)}
          onTouchStart={(e) => onResizeStart(e, handle.id)}
          onMouseEnter={() => onHandleHover?.(handle.id)}
          onMouseLeave={() => onHandleHover?.(null)}
        />
      ))}

      {/* Invisible rotation handle (top center only) */}
      <circle
        cx={bounds.x + rotationHandle.cx}
        cy={bounds.y + rotationHandle.cy}
        r={interactionRadius}
        fill="transparent"
        style={{ cursor: 'grab', touchAction: 'none' }}
        onMouseDown={onRotateStart}
        onTouchStart={onRotateStart}
        onMouseEnter={() => onHandleHover?.('rotate')}
        onMouseLeave={() => onHandleHover?.(null)}
      />
    </g>
  );
}
