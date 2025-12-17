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

  const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation}, ${shape.size / 2}, ${shape.size / 2})`;

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
