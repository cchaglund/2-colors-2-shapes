import { getDarkerLighterColors } from '../../utils/colorUtils';
import type { DailyChallenge } from '../../types';

interface ContentCalendarDayCellProps {
  day: number;
  isDayToday: boolean;
  isFuture: boolean;
  isCurrentDayLocked: boolean;
  count: number;
  challenge: DailyChallenge | undefined;
  onClick: () => void;
}

export function ContentCalendarDayCell({
  day,
  isDayToday,
  isFuture,
  isCurrentDayLocked,
  count,
  challenge,
  onClick,
}: ContentCalendarDayCellProps) {
  const disabled = isFuture || isCurrentDayLocked;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        aspect-square border-b border-r border-(--color-border) p-1 relative transition-all overflow-hidden
        ${disabled
          ? 'opacity-50 cursor-not-allowed bg-(--color-bg-secondary)'
          : 'hover:ring-1 hover:ring-inset hover:ring-(--color-accent) cursor-pointer'
        }
        ${isDayToday ? 'ring-2 ring-inset ring-(--color-accent)' : ''}
      `}
    >
      <div
        className={`absolute top-1 left-1 text-[10px] font-medium tabular-nums ${
          isDayToday ? 'text-(--color-accent)' : 'text-(--color-text-secondary)'
        }`}
      >
        {day}
      </div>
      <div className="w-full h-full flex items-center justify-center pt-3">
        {count > 0 && !isFuture && !isCurrentDayLocked && (() => {
          if (!challenge) return null;
          const { darker, lighter } = getDarkerLighterColors(challenge.colors);
          return (
            <span
              className="text-[21px] font-semibold rounded-full min-w-10 h-10 flex items-center justify-center"
              style={{ backgroundColor: darker, color: lighter }}
            >
              {count}
            </span>
          );
        })()}

        {isCurrentDayLocked && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-tertiary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </div>
    </button>
  );
}
