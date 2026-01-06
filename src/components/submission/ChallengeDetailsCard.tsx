import type { DailyChallenge } from '../../types';
import { getShapeSVGData } from '../../utils/shapeHelpers';

interface ChallengeDetailsCardProps {
  challenge: DailyChallenge;
}

export function ChallengeDetailsCard({ challenge }: ChallengeDetailsCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-(--color-bg-primary) border-(--color-border)">
      <h2 className="text-[13px] font-semibold mb-3 text-(--color-text-primary)">
        Challenge Details
      </h2>

      {/* Daily Word */}
      <div className="mb-4">
        <span className="text-[11px] text-(--color-text-tertiary) uppercase tracking-wide">Inspiration</span>
        <p className="mt-1 text-[14px] font-medium text-(--color-text-primary)">
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
            return (
              <div
                key={i}
                className="rounded-md p-1.5 flex items-center justify-center bg-(--color-bg-tertiary)"
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
