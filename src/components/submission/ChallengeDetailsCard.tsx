import type { DailyChallenge } from '../../types';
import { getShapeSVGData } from '../../utils/shapeHelpers';

interface ChallengeDetailsCardProps {
  challenge: DailyChallenge;
}

export function ChallengeDetailsCard({ challenge }: ChallengeDetailsCardProps) {
  return (
    <div className="border rounded-xl p-4 bg-(--color-bg-secondary) border-(--color-border)">
      <h2 className="text-sm font-semibold mb-3 text-(--color-text-primary)">
        Challenge Details
      </h2>

      {/* Colors */}
      <div className="mb-4">
        <span className="text-xs text-(--color-text-tertiary)">Colors</span>
        <div className="flex gap-2 mt-1">
          {challenge.colors.map((color, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-md border border-(--color-border)"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Shapes */}
      <div>
        <span className="text-xs text-(--color-text-tertiary)">Shapes</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {challenge.shapes.map((shapeData, i) => {
            const { element, props } = getShapeSVGData(shapeData.type, 32);
            return (
              <div
                key={i}
                className="rounded-md p-1 flex items-center justify-center bg-(--color-bg-tertiary)"
                title={shapeData.name}
              >
                <svg width={40} height={40} viewBox="0 0 32 32">
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
