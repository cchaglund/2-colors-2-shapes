import type { ShapeType } from '../../types';
import { getShapeSVGData } from '../../utils/shapes';

interface ShapeIconProps {
  type: ShapeType;
  size?: number;
}

/**
 * Renders a small shape preview SVG with fill="currentColor".
 * Used for toolbar icons, modal previews, and other non-canvas shape displays.
 */
export function ShapeIcon({ type, size = 24 }: ShapeIconProps) {
  const { element, props, viewBox } = getShapeSVGData(type, size);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}>
      {element === 'ellipse' && <ellipse {...props} fill="currentColor" />}
      {element === 'rect' && <rect {...props} fill="currentColor" />}
      {element === 'polygon' && <polygon {...props} fill="currentColor" />}
      {element === 'path' && <path {...props} fill="currentColor" />}
    </svg>
  );
}
