import type { RefObject } from 'react';
import type { DailyChallenge, Shape } from '../../types';
import { getShapeSVGData } from '../../utils/shapeHelpers';

const CANVAS_SIZE = 800;

interface SubmissionCanvasProps {
  shapes: Shape[];
  challenge: DailyChallenge;
  backgroundColorIndex: number | null;
  svgRef: RefObject<SVGSVGElement | null>;
}

export function SubmissionCanvas({
  shapes,
  challenge,
  backgroundColorIndex,
  svgRef,
}: SubmissionCanvasProps) {
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);
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
      style={{ maxWidth: '100%', height: 'auto' }}
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
        const center = shape.size / 2;
        const scaleX = shape.flipX ? -1 : 1;
        const scaleY = shape.flipY ? -1 : 1;
        const transform = `translate(${shape.x}, ${shape.y}) translate(${center}, ${center}) scale(${scaleX}, ${scaleY}) translate(${-center}, ${-center}) rotate(${shape.rotation}, ${center}, ${center})`;
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
