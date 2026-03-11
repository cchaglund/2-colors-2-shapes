import type { DailyChallenge } from '../../types';
import { ShapeIcon } from './ShapeIcon';

interface ChallengePreviewProps {
  challenge: DailyChallenge;
  variant?: 'default' | 'dark' | 'light';
  className?: string;
}

interface VariantStyle {
  outline: string;
  shapeFill: string;
  shapeStroke: string;
  labelClass: string;
  labelStyle?: React.CSSProperties;
  wordClass: string;
  wordStyle?: React.CSSProperties;
}

const styles: Record<string, VariantStyle> = {
  default: {
    outline: '1.5px solid var(--color-border)',
    shapeFill: 'var(--color-text-tertiary)',
    shapeStroke: 'var(--color-border)',
    labelClass: 'text-(--color-text-tertiary)',
    wordClass: 'text-(--color-text-primary)',
  },
  dark: {
    outline: '1.5px solid #FFFFFF',
    shapeFill: 'var(--color-text-tertiary)',
    shapeStroke: '#FFFFFF',
    labelClass: 'opacity-50',
    wordClass: '',
  },
  // Hardcoded light mode values for mode-inverted contexts (e.g. dark mode tooltip with white bg)
  light: {
    outline: '1.5px solid #2D1B69',
    shapeFill: '#8B7EC8',
    shapeStroke: '#2D1B69',
    labelClass: '',
    labelStyle: { color: '#8B7EC8' },
    wordClass: '',
    wordStyle: { color: '#2D1B69' },
  },
};

export function ChallengePreview({ challenge, variant = 'default', className = '' }: ChallengePreviewProps) {
  const s = styles[variant];
  return (
    <div className={`flex items-center justify-center gap-5 ${className}`}>
      {/* Colors */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="flex h-5 rounded-sm overflow-hidden"
          style={{ outline: s.outline }}
        >
          {challenge.colors.map((color, i) => (
            <div key={i} className="w-5" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className={`text-[0.5625rem] uppercase tracking-wider ${s.labelClass}`} style={s.labelStyle}>
          Colors
        </span>
      </div>
      {/* Shapes */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 h-5">
          {challenge.shapes.map((shape, i) => (
            <ShapeIcon
              key={i}
              type={shape.type}
              size={20}
              fill={s.shapeFill}
              stroke={s.shapeStroke}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className={`text-[0.5625rem] uppercase tracking-wider ${s.labelClass}`} style={s.labelStyle}>
          Shapes
        </span>
      </div>
      {/* Word */}
      <div className="flex flex-col items-center gap-1">
        <span className={`text-sm font-semibold capitalize font-display truncate leading-5 ${s.wordClass}`} style={s.wordStyle}>
          {'"'}{challenge.word}{'"'}
        </span>
        <span className={`text-[0.5625rem] uppercase tracking-wider ${s.labelClass}`} style={s.labelStyle}>
          Word
        </span>
      </div>
    </div>
  );
}
