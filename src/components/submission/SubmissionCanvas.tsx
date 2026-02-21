import type { RefObject } from 'react';
import type { DailyChallenge, Shape, ShapeGroup } from '../../types';
import { CANVAS_SIZE } from '../../types/canvas';
import { SVGShape } from '../shared/SVGShape';
import { getVisibleShapes } from '../../utils/visibility';

interface SubmissionCanvasProps {
  shapes: Shape[];
  groups?: ShapeGroup[];
  challenge: DailyChallenge;
  backgroundColorIndex: number | null;
  svgRef: RefObject<SVGSVGElement | null>;
}

export function SubmissionCanvas({
  shapes,
  groups = [],
  challenge,
  backgroundColorIndex,
  svgRef,
}: SubmissionCanvasProps) {
  const sortedShapes = [...getVisibleShapes(shapes, groups)].sort((a, b) => a.zIndex - b.zIndex);
  const backgroundColor =
    backgroundColorIndex !== null
      ? challenge.colors[backgroundColorIndex]
      : '#ffffff';

  return (
    <svg
      ref={svgRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      className="max-w-full h-auto"
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
  );
}
