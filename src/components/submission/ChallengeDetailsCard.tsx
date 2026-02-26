import type { DailyChallenge, Shape } from '../../types';
import { getShapeSVGData } from '../../utils/shapes';

interface ChallengeDetailsCardProps {
  challenge: DailyChallenge;
  /** Submission shapes to count how many of each challenge shape the user placed */
  submissionShapes?: Shape[];
}

export function ChallengeDetailsCard({ challenge, submissionShapes }: ChallengeDetailsCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-(--color-bg-primary) border-(--color-border)">

      {/* Daily Word */}
      <div className="mb-4">
        <span className="text-[11px] text-(--color-text-tertiary) uppercase tracking-wide">Inspiration</span>
        <p className="mt-1 text-[14px] font-medium text-(--color-text-primary) capitalize">
          "{challenge.word}"
        </p>
      </div>

      {/* Colors */}
      <div className="mb-4">
        <span className="text-[11px] text-(--color-text-tertiary) uppercase tracking-wide">Colors</span>
        <div className="flex gap-2 mt-1.5">
          {challenge.colors.map((color, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-md border border-(--color-border-light)"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Shapes */}
      <div>
        <span className="text-[11px] text-(--color-text-tertiary) uppercase tracking-wide">Shapes</span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {challenge.shapes.map((shapeData, i) => {
            const { element, props } = getShapeSVGData(shapeData.type, 28);
            const count = submissionShapes
              ? submissionShapes.filter(s => s.type === shapeData.type).length
              : undefined;
            return (
              <div
                key={i}
                className="rounded-md p-1.5 flex items-center gap-1.5 bg-(--color-bg-tertiary)"
                title={shapeData.name}
              >
                <svg width={32} height={32} viewBox="0 0 28 28">
                  {element === 'ellipse' && (
                    <ellipse {...props} fill="var(--color-text-primary)" />
                  )}
                  {element === 'rect' && (
                    <rect {...props} fill="var(--color-text-primary)" />
                  )}
                  {element === 'polygon' && (
                    <polygon {...props} fill="var(--color-text-primary)" />
                  )}
                  {element === 'path' && (
                    <path {...props} fill="var(--color-text-primary)" />
                  )}
                </svg>
                {count !== undefined && (
                  <span className="text-xs font-medium text-(--color-text-secondary)">×{count}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
