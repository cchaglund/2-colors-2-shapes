import type { Shape, DailyChallenge } from '../types';
import { getShapeSVGData } from '../utils/shapeHelpers';

interface SubmissionThumbnailProps {
  shapes: Shape[];
  challenge: DailyChallenge;
  backgroundColorIndex: number | null;
  size?: number;
  showNickname?: boolean;
  nickname?: string;
  onClick?: () => void;
}

const CANVAS_SIZE = 800;

export function SubmissionThumbnail({
  shapes,
  challenge,
  backgroundColorIndex,
  size = 100,
  showNickname = false,
  nickname,
  onClick,
}: SubmissionThumbnailProps) {
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);
  const backgroundColor =
    backgroundColorIndex !== null
      ? challenge.colors[backgroundColorIndex]
      : '#ffffff';

  const svg = (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      className="rounded-sm"
    >
      <rect
        x={0}
        y={0}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        fill={backgroundColor}
      />
      {sortedShapes.map((shape) => {
        const { element, props, viewBox } = getShapeSVGData(shape.type, shape.size);
        const centerX = viewBox.width / 2;
        const centerY = viewBox.height / 2;
        const scaleX = shape.flipX ? -1 : 1;
        const scaleY = shape.flipY ? -1 : 1;
        const transform = `translate(${shape.x}, ${shape.y}) translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY}) rotate(${shape.rotation}, ${centerX}, ${centerY})`;
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

  if (!showNickname && !onClick) {
    return svg;
  }

  const content = (
    <div className="flex flex-col items-center gap-1">
      {svg}
      {showNickname && nickname && (
        <span className="text-xs text-gray-600 truncate max-w-full">
          {nickname}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
      >
        {content}
      </button>
    );
  }

  return content;
}
