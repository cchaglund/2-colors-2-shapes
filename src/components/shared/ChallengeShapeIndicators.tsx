import type { ChallengeShapeData, ShapeType } from '../../types';
import { getShapeSVGData } from '../../utils/shapes';

interface ChallengeShapeIndicatorsProps {
  shapes: [ChallengeShapeData, ChallengeShapeData];
  size?: number;
  gap?: number;
  color?: string;
}

function ShapeIcon({ type, size, color }: { type: ShapeType; size: number; color: string }) {
  const { element, props } = getShapeSVGData(type, size);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {element === 'ellipse' && <ellipse {...props} fill={color} />}
      {element === 'rect' && <rect {...props} fill={color} />}
      {element === 'polygon' && <polygon {...props} fill={color} />}
      {element === 'path' && <path {...props} fill={color} />}
    </svg>
  );
}

export function ChallengeShapeIndicators({
  shapes,
  size = 12,
  gap = 2,
  color = 'currentColor',
}: ChallengeShapeIndicatorsProps) {
  return (
    <div className="flex items-center" style={{ gap }}>
      <ShapeIcon type={shapes[0].type} size={size} color={color} />
      <ShapeIcon type={shapes[1].type} size={size} color={color} />
    </div>
  );
}
