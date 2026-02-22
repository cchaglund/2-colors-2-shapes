import type { Shape } from '../../types';
import { getShapeSVGData } from '../../utils/shapes';

interface TransformHandlesProps {
  shape: Shape;
  zoom?: number;
  onMoveStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, corner: string) => void;
  onRotateStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

interface MultiSelectTransformLayerProps {
  shapes: Shape[];
  bounds: { x: number; y: number; width: number; height: number };
  zoom?: number;
  showIndividualOutlines?: boolean;
}

interface MultiSelectInteractionLayerProps {
  bounds: { x: number; y: number; width: number; height: number };
  zoom?: number;
  onMoveStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onResizeStart: (e: React.MouseEvent | React.TouchEvent, corner: string) => void;
  onRotateStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

// Base sizes at 100% zoom
const BASE_HANDLE_SIZE = 10;
const BASE_ROTATE_HANDLE_OFFSET = 30;
const BASE_ROTATE_HANDLE_RADIUS = 6;
const BASE_INTERACTION_RADIUS = 8;
const BASE_STROKE_WIDTH = 1;
const BASE_DASH_STROKE_WIDTH = 2;

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

// Get the effective cursor for a corner, accounting for rotation and flip transforms
// The cursor should always point away from the center of the shape in screen space
function getEffectiveCursor(cornerId: string, flipX: boolean, flipY: boolean, rotation: number): string {
  // Local corner offsets from center (before any transforms)
  const cornerVectors: Record<string, { x: number; y: number }> = {
    nw: { x: -1, y: -1 },
    ne: { x: 1, y: -1 },
    sw: { x: -1, y: 1 },
    se: { x: 1, y: 1 },
  };

  const local = cornerVectors[cornerId] || { x: 1, y: 1 };

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

// Invisible interaction layer - rendered inline with shapes for proper click ordering
export function TransformInteractionLayer({
  shape,
  zoom = 1,
  onMoveStart,
  onResizeStart,
  onRotateStart,
}: TransformHandlesProps) {
  // Scale handle sizes inversely with zoom to maintain constant visual size
  const scale = 1 / zoom;
  const handleSize = BASE_HANDLE_SIZE * scale;
  const rotateOffset = BASE_ROTATE_HANDLE_OFFSET * scale;
  const interactionRadius = BASE_INTERACTION_RADIUS * scale;

  const { viewBox } = getShapeSVGData(shape.type, shape.size);
  const corners = getCorners(viewBox.width, viewBox.height);
  const rotationHandles = getRotationHandles(viewBox.width, viewBox.height, rotateOffset);
  const centerX = viewBox.width / 2;
  const centerY = viewBox.height / 2;
  const scaleX = shape.flipX ? -1 : 1;
  const scaleY = shape.flipY ? -1 : 1;
  // Match the transform order from ShapeElement: flip applied after rotation visually
  const transform = `translate(${shape.x}, ${shape.y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${shape.rotation}, ${centerX}, ${centerY})`;

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

      {/* Invisible corner resize handles */}
      {corners.map((corner) => (
        <rect
          key={corner.id}
          x={corner.x - handleSize / 2}
          y={corner.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="transparent"
          style={{ cursor: getEffectiveCursor(corner.id, shape.flipX ?? false, shape.flipY ?? false, shape.rotation), touchAction: 'none' }}
          onMouseDown={(e) => onResizeStart(e, corner.id)}
          onTouchStart={(e) => onResizeStart(e, corner.id)}
        />
      ))}

      {/* Invisible rotation handles on all sides */}
      {rotationHandles.map((handle) => (
        <circle
          key={handle.id}
          cx={handle.cx}
          cy={handle.cy}
          r={interactionRadius}
          fill="transparent"
          style={{ cursor: 'grab', touchAction: 'none' }}
          onMouseDown={onRotateStart}
          onTouchStart={onRotateStart}
        />
      ))}
    </g>
  );
}

// Visible UI layer - rendered on top of everything
export function TransformVisualLayer({ shape, zoom = 1 }: { shape: Shape; zoom?: number }) {
  // Scale sizes inversely with zoom
  const scale = 1 / zoom;
  const handleSize = BASE_HANDLE_SIZE * scale;
  const rotateOffset = BASE_ROTATE_HANDLE_OFFSET * scale;
  const rotateRadius = BASE_ROTATE_HANDLE_RADIUS * scale;
  const strokeWidth = BASE_STROKE_WIDTH * scale;
  const dashStrokeWidth = BASE_DASH_STROKE_WIDTH * scale;

  const { element, props, viewBox, outlineD } = getShapeSVGData(shape.type, shape.size);
  const corners = getCorners(viewBox.width, viewBox.height);
  const rotationHandles = getRotationHandles(viewBox.width, viewBox.height, rotateOffset);
  const centerX = viewBox.width / 2;
  const centerY = viewBox.height / 2;
  const scaleX = shape.flipX ? -1 : 1;
  const scaleY = shape.flipY ? -1 : 1;
  // Match the transform order from ShapeElement: flip applied after rotation visually
  const transform = `translate(${shape.x}, ${shape.y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${shape.rotation}, ${centerX}, ${centerY})`;

  // Common props for the shape outline
  const outlineProps = {
    ...props,
    ...(outlineD && { d: outlineD }),
    fill: 'none',
    stroke: '#000',
    strokeWidth: dashStrokeWidth,
    strokeDasharray: `${5 * scale},${5 * scale}`,
  };

  return (
    <g transform={transform} style={{ pointerEvents: 'none' }}>
      {/* Shape outline (black dashed) */}
      {element === 'ellipse' && <ellipse {...outlineProps} />}
      {element === 'rect' && <rect {...outlineProps} />}
      {element === 'polygon' && <polygon {...outlineProps} />}
      {element === 'path' && <path {...outlineProps} />}

      {/* Bounding box (blue solid) */}
      <rect
        x={0}
        y={0}
        width={viewBox.width}
        height={viewBox.height}
        fill="none"
        stroke="#0066ff"
        strokeWidth={strokeWidth}
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
          strokeWidth={strokeWidth}
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
            strokeWidth={strokeWidth}
          />
          <circle
            cx={handle.cx}
            cy={handle.cy}
            r={rotateRadius}
            fill="white"
            stroke="#0066ff"
            strokeWidth={strokeWidth}
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
  zoom = 1,
  showIndividualOutlines = true,
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
    const corners = getCorners(viewBox.width, viewBox.height);
    const rotationHandles = getRotationHandles(viewBox.width, viewBox.height, rotateOffset);
    const centerX = viewBox.width / 2;
    const centerY = viewBox.height / 2;
    const scaleX = shape.flipX ? -1 : 1;
    const scaleY = shape.flipY ? -1 : 1;
    // Match the transform order from ShapeElement: flip applied after rotation visually
    const transform = `translate(${shape.x}, ${shape.y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${shape.rotation}, ${centerX}, ${centerY})`;

    const outlineProps = {
      ...props,
      ...(outlineD && { d: outlineD }),
      fill: 'none',
      stroke: '#000',
      strokeWidth: dashStrokeWidth,
      strokeDasharray: `${5 * scale},${5 * scale}`,
    };

    return (
      <g transform={transform} style={{ pointerEvents: 'none' }}>
        {/* Shape outline (black dashed) */}
        {element === 'ellipse' && <ellipse {...outlineProps} />}
        {element === 'rect' && <rect {...outlineProps} />}
        {element === 'polygon' && <polygon {...outlineProps} />}
        {element === 'path' && <path {...outlineProps} />}

        {/* Bounding box (blue solid) */}
        <rect
          x={0}
          y={0}
          width={viewBox.width}
          height={viewBox.height}
          fill="none"
          stroke="#0066ff"
          strokeWidth={strokeWidth}
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
            strokeWidth={strokeWidth}
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
              strokeWidth={strokeWidth}
            />
            <circle
              cx={handle.cx}
              cy={handle.cy}
              r={rotateRadius}
              fill="white"
              stroke="#0066ff"
              strokeWidth={strokeWidth}
            />
          </g>
        ))}
      </g>
    );
  }

  // For multiple shapes, show combined bounding box and individual outlines
  const corners = getCorners(bounds.width, bounds.height);
  const rotationHandles = getRotationHandles(bounds.width, bounds.height, rotateOffset);

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Individual shape outlines (black dashed) */}
      {showIndividualOutlines &&
        shapes.map((shape) => {
          const { element, props, viewBox, outlineD } = getShapeSVGData(shape.type, shape.size);
          const centerX = viewBox.width / 2;
          const centerY = viewBox.height / 2;
          const scaleX = shape.flipX ? -1 : 1;
          const scaleY = shape.flipY ? -1 : 1;
          // Match the transform order from ShapeElement: flip applied after rotation visually
          const transform = `translate(${shape.x}, ${shape.y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${shape.rotation}, ${centerX}, ${centerY})`;

          const outlineProps = {
            ...props,
            ...(outlineD && { d: outlineD }),
            fill: 'none',
            stroke: '#000',
            strokeWidth: dashStrokeWidth,
            strokeDasharray: `${5 * scale},${5 * scale}`,
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

      {/* Combined bounding box (blue solid - same as single selection) */}
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="none"
        stroke="#0066ff"
        strokeWidth={strokeWidth}
      />

      {/* Corner resize handles */}
      {corners.map((corner) => (
        <rect
          key={corner.id}
          x={bounds.x + corner.x - handleSize / 2}
          y={bounds.y + corner.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="white"
          stroke="#0066ff"
          strokeWidth={strokeWidth}
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
            strokeWidth={strokeWidth}
          />
          <circle
            cx={bounds.x + handle.cx}
            cy={bounds.y + handle.cy}
            r={rotateRadius}
            fill="white"
            stroke="#0066ff"
            strokeWidth={strokeWidth}
          />
        </g>
      ))}
    </g>
  );
}

// Hover highlight layer - shows orange dashed outline for shapes hovered in the layer panel
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
        const scaleX = shape.flipX ? -1 : 1;
        const scaleY = shape.flipY ? -1 : 1;
        const transform = `translate(${shape.x}, ${shape.y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${shape.rotation}, ${centerX}, ${centerY})`;

        return (
          <g key={shape.id} transform={transform}>
            <rect
              x={0}
              y={0}
              width={viewBox.width}
              height={viewBox.height}
              fill="none"
              stroke="#ff9500"
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
}: Omit<MultiSelectInteractionLayerProps, 'onMoveStart'>) {
  // Scale sizes inversely with zoom
  const scale = 1 / zoom;
  const handleSize = BASE_HANDLE_SIZE * scale;
  const rotateOffset = BASE_ROTATE_HANDLE_OFFSET * scale;
  const interactionRadius = BASE_INTERACTION_RADIUS * scale;

  const corners = getCorners(bounds.width, bounds.height);
  const rotationHandles = getRotationHandles(bounds.width, bounds.height, rotateOffset);

  return (
    <g style={{ pointerEvents: 'all' }}>
      {/* Invisible corner resize handles */}
      {corners.map((corner) => (
        <rect
          key={corner.id}
          x={bounds.x + corner.x - handleSize / 2}
          y={bounds.y + corner.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="transparent"
          style={{ cursor: `${corner.id}-resize`, touchAction: 'none' }}
          onMouseDown={(e) => onResizeStart(e, corner.id)}
          onTouchStart={(e) => onResizeStart(e, corner.id)}
        />
      ))}

      {/* Invisible rotation handles on all sides */}
      {rotationHandles.map((handle) => (
        <circle
          key={handle.id}
          cx={bounds.x + handle.cx}
          cy={bounds.y + handle.cy}
          r={interactionRadius}
          fill="transparent"
          style={{ cursor: 'grab', touchAction: 'none' }}
          onMouseDown={onRotateStart}
          onTouchStart={onRotateStart}
        />
      ))}
    </g>
  );
}
