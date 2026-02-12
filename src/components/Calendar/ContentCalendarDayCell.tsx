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
  return (
    <button
      onClick={onClick}
      disabled={isFuture || isCurrentDayLocked}
      className={`
        aspect-square rounded-md p-1.5 transition-all border border-(--color-border-light)
        ${isFuture || isCurrentDayLocked
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-(--color-accent) cursor-pointer'
        }
        ${isDayToday ? 'ring-2 ring-(--color-accent) ring-offset-1' : ''}
      `}
    >
      <div className="flex flex-col h-full">
        <span className={`
          text-[11px] font-medium tabular-nums text-left
          ${isDayToday ? 'text-(--color-accent)' : 'text-(--color-text-secondary)'}
        `}>
          {day}
        </span>
        <div className="flex-1 flex items-center justify-center">
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
      </div>
    </button>
  );
}
