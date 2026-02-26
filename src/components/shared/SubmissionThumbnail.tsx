import type { Shape, ShapeGroup, DailyChallenge } from '../../types';
import { CANVAS_SIZE } from '../../types/canvas';
import { SVGShape } from './SVGShape';
import { getVisibleShapes } from '../../utils/visibility';

interface SubmissionThumbnailProps {
  shapes: Shape[];
  groups?: ShapeGroup[];
  challenge: DailyChallenge;
  backgroundColorIndex: number | null;
  size?: number;
  /** When true, SVG fills its container (100% width/height) instead of using fixed size */
  fill?: boolean;
  showNickname?: boolean;
  nickname?: string;
  onClick?: () => void;
  href?: string;
  likeCount?: number;
  showLikeCount?: boolean;
}

export function SubmissionThumbnail({
  shapes,
  groups = [],
  challenge,
  backgroundColorIndex,
  size = 100,
  fill = false,
  showNickname = false,
  nickname,
  onClick,
  href,
  likeCount,
  showLikeCount = false,
}: SubmissionThumbnailProps) {
  const sortedShapes = [...getVisibleShapes(shapes, groups)].sort((a, b) => a.zIndex - b.zIndex);
  const backgroundColor =
    backgroundColorIndex !== null
      ? challenge.colors[backgroundColorIndex]
      : '#ffffff';

  // Format like count for display
  const displayLikeCount = likeCount !== undefined && likeCount > 9999 ? '9999+' : likeCount;

  const svg = (
    <div className="relative">
      <svg
        data-testid="submission-thumbnail"
        width={fill ? '100%' : size}
        height={fill ? '100%' : size}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        className={fill ? '' : 'rounded-sm'}
      >
        <rect
          x={0}
          y={0}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          fill={backgroundColor}
        />
        {sortedShapes.map((shape) => (
          <SVGShape
            key={shape.id}
            type={shape.type}
            size={shape.size}
            x={shape.x}
            y={shape.y}
            rotation={shape.rotation}
            flipX={shape.flipX}
            flipY={shape.flipY}
            color={challenge.colors[shape.colorIndex]}
          />
        ))}
      </svg>
      {showLikeCount && likeCount !== undefined && likeCount > 0 && (
        <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/60 text-white text-[10px] font-medium rounded px-1 py-0.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{displayLikeCount}</span>
        </div>
      )}
    </div>
  );

  if (!showNickname && !onClick && !href) {
    return svg;
  }

  const content = (
    <div className="flex flex-col items-center gap-1">
      {svg}
      {showNickname && nickname && (
        <span className="text-xs text-(--color-text-secondary) truncate max-w-full">
          {nickname}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 rounded"
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 rounded"
      >
        {content}
      </button>
    );
  }

  return content;
}
