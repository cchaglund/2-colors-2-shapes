import { getDarkerLighterColors } from '../../utils/colorUtils';
import type { DailyChallenge } from '../../types';
import { CalendarCell } from './CalendarCell';

interface ContentCalendarDayCellProps {
  day: number;
  dateStr: string;
  isDayToday: boolean;
  isFuture: boolean;
  isCurrentDayLocked: boolean;
  count: number;
  challenge: DailyChallenge | undefined;
  onClick: () => void;
}

export function ContentCalendarDayCell({
  day,
  dateStr,
  isDayToday,
  isFuture,
  isCurrentDayLocked,
  count,
  challenge,
  onClick,
}: ContentCalendarDayCellProps) {
  return (
    <CalendarCell
      day={day}
      isToday={isDayToday}
      isFuture={isFuture}
      disabled={isFuture || isCurrentDayLocked}
      onClick={onClick}
      data-testid="content-calendar-day-cell"
      data-date={dateStr}
    >
      {count > 0 && !isFuture && !isCurrentDayLocked && (() => {
        if (!challenge) return null;
        const { darker, lighter } = getDarkerLighterColors(challenge.colors);
        return (
          <span
            className="text-(--text-2xl) font-semibold rounded-(--radius-pill) min-w-10 h-10 flex items-center justify-center"
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
    </CalendarCell>
  );
}
