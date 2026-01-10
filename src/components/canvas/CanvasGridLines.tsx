import { CANVAS_SIZE } from '../../types/canvas';

interface CanvasGridLinesProps {
  zoom: number;
  showOffCanvas?: boolean;
}

/**
 * Renders rule-of-thirds and center grid lines on the canvas.
 * When showOffCanvas is true, also renders canvas boundary lines.
 */
export function CanvasGridLines({ zoom, showOffCanvas }: CanvasGridLinesProps) {
  const strokeWidth = 1 / zoom;

  return (
    <g className="grid-lines" pointerEvents="none">
      {/* Rule of thirds lines - light gray (divides into 9 equal sections) */}
      <line
        x1={CANVAS_SIZE / 3}
        y1={0}
        x2={CANVAS_SIZE / 3}
        y2={CANVAS_SIZE}
        stroke="rgba(180, 180, 180, 0.5)"
        strokeWidth={strokeWidth}
      />
      <line
        x1={(CANVAS_SIZE * 2) / 3}
        y1={0}
        x2={(CANVAS_SIZE * 2) / 3}
        y2={CANVAS_SIZE}
        stroke="rgba(180, 180, 180, 0.5)"
        strokeWidth={strokeWidth}
      />
      <line
        x1={0}
        y1={CANVAS_SIZE / 3}
        x2={CANVAS_SIZE}
        y2={CANVAS_SIZE / 3}
        stroke="rgba(180, 180, 180, 0.5)"
        strokeWidth={strokeWidth}
      />
      <line
        x1={0}
        y1={(CANVAS_SIZE * 2) / 3}
        x2={CANVAS_SIZE}
        y2={(CANVAS_SIZE * 2) / 3}
        stroke="rgba(180, 180, 180, 0.5)"
        strokeWidth={strokeWidth}
      />
      {/* Center lines - darker gray (divides into 4 quadrants) */}
      <line
        x1={CANVAS_SIZE / 2}
        y1={0}
        x2={CANVAS_SIZE / 2}
        y2={CANVAS_SIZE}
        stroke="rgba(120, 120, 120, 0.6)"
        strokeWidth={strokeWidth}
      />
      <line
        x1={0}
        y1={CANVAS_SIZE / 2}
        x2={CANVAS_SIZE}
        y2={CANVAS_SIZE / 2}
        stroke="rgba(120, 120, 120, 0.6)"
        strokeWidth={strokeWidth}
      />
      {/* Canvas boundary lines - shown when off-canvas mode is enabled */}
      {showOffCanvas && (
        <rect
          x={0}
          y={0}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          fill="none"
          stroke="rgba(100, 100, 100, 0.7)"
          strokeWidth={strokeWidth * 1.5}
        />
      )}
    </g>
  );
}
