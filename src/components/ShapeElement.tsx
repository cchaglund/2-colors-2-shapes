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
  const { element, props } = getShapeSVGData(shape.type, shape.size);

  const center = shape.size / 2;
  const scaleX = shape.flipX ? -1 : 1;
  const scaleY = shape.flipY ? -1 : 1;

  // Build transform: translate to position, rotate around center, then flip around center
  // For flip to work correctly, we need to: translate to position, move to center, scale, move back, then rotate
  const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation}, ${center}, ${center}) translate(${center}, ${center}) scale(${scaleX}, ${scaleY}) translate(${-center}, ${-center})`;

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
