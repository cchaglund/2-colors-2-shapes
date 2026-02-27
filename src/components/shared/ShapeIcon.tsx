import type { ShapeType } from '../../types';
import { getShapeSVGData } from '../../utils/shapes';

interface ShapeIconProps {
  type: ShapeType;
  size?: number;
  /** Override fill color (defaults to currentColor) */
  fill?: string;
  /** Add a stroke/border to the shape */
  stroke?: string;
  strokeWidth?: number;
}

/**
 * Renders a small shape preview SVG with fill="currentColor".
 * Used for toolbar icons, modal previews, and other non-canvas shape displays.
 */
export function ShapeIcon({ type, size = 24, fill = 'currentColor', stroke, strokeWidth }: ShapeIconProps) {
  const { element, props, viewBox } = getShapeSVGData(type, size);
  const extraProps = { fill, ...(stroke ? { stroke, strokeWidth } : {}) };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}>
      {element === 'ellipse' && <ellipse {...props} {...extraProps} />}
      {element === 'rect' && <rect {...props} {...extraProps} />}
      {element === 'polygon' && <polygon {...props} {...extraProps} />}
      {element === 'path' && <path {...props} {...extraProps} />}
    </svg>
  );
}
