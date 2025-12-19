import type { Shape, DailyChallenge } from '../types';
import { getShapeSVGData } from '../utils/shapeHelpers';

interface SubmissionThumbnailProps {
  shapes: Shape[];
  challenge: DailyChallenge;
  backgroundColorIndex: number | null;
  size?: number;
}

const CANVAS_SIZE = 800;

export function SubmissionThumbnail({
  shapes,
  challenge,
  backgroundColorIndex,
  size = 100,
}: SubmissionThumbnailProps) {
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);
  const backgroundColor =
    backgroundColorIndex !== null
      ? challenge.colors[backgroundColorIndex]
      : '#ffffff';

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      style={{ borderRadius: 4 }}
    >
      <rect
        x={0}
        y={0}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        fill={backgroundColor}
      />
      {sortedShapes.map((shape) => {
        const { element, props } = getShapeSVGData(shape.type, shape.size);
        const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation}, ${shape.size / 2}, ${shape.size / 2})`;
        const color = challenge.colors[shape.colorIndex];

        return (
          <g key={shape.id} transform={transform}>
            {element === 'ellipse' && <ellipse {...props} fill={color} />}
            {element === 'rect' && <rect {...props} fill={color} />}
            {element === 'polygon' && <polygon {...props} fill={color} />}
            {element === 'path' && <path {...props} fill={color} />}
          </g>
        );
      })}
    </svg>
  );
}
