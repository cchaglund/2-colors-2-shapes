import { formatDate } from '../../utils/calendarUtils';
import { getDarkerLighterColors } from '../../utils/colorUtils';
import type { DailyChallenge } from '../../types';

interface ContentCalendarGridProps {
  calendarYear: number;
  calendarMonth: number;
  calendarDays: (number | null)[];
  todayStr: string;
  hasSubmittedToday: boolean;
  loading: boolean;
  counts: Record<string, number>;
  challengesMap: Map<string, DailyChallenge>;
  onDayClick: (day: number) => void;
}

export function ContentCalendarGrid({
  calendarYear,
  calendarMonth,
  calendarDays,
  todayStr,
  hasSubmittedToday,
  loading,
  counts,
  challengesMap,
  onDayClick,
}: ContentCalendarGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-(--color-border) border-t-(--color-accent) rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div
          key={day}
          className="text-center text-[11px] font-medium text-(--color-text-tertiary) py-2"
        >
          {day}
        </div>
      ))}

      {/* Day cells */}
      {calendarDays.map((day, index) => {
        if (day === null) {
          return <div key={`empty-${index}`} className="aspect-square" />;
        }

        const dateStr = formatDate(calendarYear, calendarMonth, day);
        const isDayToday = dateStr === todayStr;
        const isFuture = dateStr > todayStr;
        const count = counts[dateStr] || 0;
        const isCurrentDayLocked = dateStr === todayStr && !hasSubmittedToday;

        return (
          <button
            key={dateStr}
            onClick={() => !isFuture && !isCurrentDayLocked && onDayClick(day)}
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
                {/* Count badge - only show when colors loaded */}
                {count > 0 && !isFuture && !isCurrentDayLocked && (() => {
                  const dayChallenge = challengesMap.get(dateStr);
                  if (!dayChallenge) return null;
                  const { darker, lighter } = getDarkerLighterColors(dayChallenge.colors);
                  return (
                    <span
                      className="text-[21px] font-semibold rounded-full min-w-10 h-10 flex items-center justify-center"
                      style={{ backgroundColor: darker, color: lighter }}
                    >
                      {count}
                    </span>
                  );
                })()}

                {/* Lock icon for current day when not submitted */}
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
      })}
    </div>
  );
}
