import type { CSSProperties } from 'react';
import type { ShapeType } from '../../types';
import { getShapeSVGData } from '../../utils/shapes';

interface SVGShapeProps {
  type: ShapeType;
  size: number;
  x: number;
  y: number;
  rotation: number;
  flipX?: boolean;
  flipY?: boolean;
  color: string;
  style?: CSSProperties;
  dataShapeId?: string;
}

/**
 * Renders a single SVG shape element (ellipse/rect/polygon/path)
 * with position, rotation, and flip transforms applied via a <g> wrapper.
 */
export function SVGShape({
  type,
  size,
  x,
  y,
  rotation,
  flipX,
  flipY,
  color,
  style,
  dataShapeId,
}: SVGShapeProps) {
  const { element, props, viewBox } = getShapeSVGData(type, size);

  const centerX = viewBox.width / 2;
  const centerY = viewBox.height / 2;
  const scaleX = flipX ? -1 : 1;
  const scaleY = flipY ? -1 : 1;

  const transform = `translate(${x}, ${y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${rotation}, ${centerX}, ${centerY})`;

  const fillProps = { fill: color, style };

  return (
    <g transform={transform} data-shape-id={dataShapeId}>
      {element === 'ellipse' && <ellipse {...props} {...fillProps} />}
      {element === 'rect' && <rect {...props} {...fillProps} />}
      {element === 'polygon' && <polygon {...props} {...fillProps} />}
      {element === 'path' && <path {...props} {...fillProps} />}
    </g>
  );
}
