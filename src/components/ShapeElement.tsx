import type { Shape } from '../types';
import { getShapeSVGData } from '../utils/shapeHelpers';

interface ShapeElementProps {
  shape: Shape;
  color: string;
  isSelected: boolean;
}

export function ShapeElement({
  shape,
  color,
}: ShapeElementProps) {
  const { element, props, viewBox } = getShapeSVGData(shape.type, shape.size);

  // Calculate center based on actual viewBox dimensions for proper rotation/flip
  const centerX = viewBox.width / 2;
  const centerY = viewBox.height / 2;
  const scaleX = shape.flipX ? -1 : 1;
  const scaleY = shape.flipY ? -1 : 1;

  // Build transform: translate to position, flip around center, then rotate around center
  // SVG transforms are applied right-to-left, so order is: rotate first, then flip, then translate
  // This makes flip affect the rotated appearance (flipping a rotated shape mirrors its rotation)
  const transform = `translate(${shape.x}, ${shape.y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${shape.rotation}, ${centerX}, ${centerY})`;

  const commonProps = {
    fill: color,
    style: { cursor: 'move' },
  };

  return (
    <g transform={transform} data-shape-id={shape.id}>
      {element === 'ellipse' && <ellipse {...props} {...commonProps} />}
      {element === 'rect' && <rect {...props} {...commonProps} />}
      {element === 'polygon' && <polygon {...props} {...commonProps} />}
      {element === 'path' && <path {...props} {...commonProps} />}
    </g>
  );
}
