import { formatDate } from '../../utils/calendarUtils';
import type { DailyChallenge } from '../../types';
import { CalendarGrid } from './CalendarGrid';
import { ContentCalendarDayCell } from './ContentCalendarDayCell';

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

  const emptySlotCount = calendarDays.findIndex((d) => d !== null);

  return (
    <CalendarGrid emptySlotCount={emptySlotCount < 0 ? 0 : emptySlotCount}>
      {calendarDays
        .filter((day): day is number => day !== null)
        .map((day) => {
          const dateStr = formatDate(calendarYear, calendarMonth, day);
          const isDayToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const count = counts[dateStr] || 0;
          const isCurrentDayLocked = dateStr === todayStr && !hasSubmittedToday;

          return (
            <ContentCalendarDayCell
              key={dateStr}
              day={day}
              isDayToday={isDayToday}
              isFuture={isFuture}
              isCurrentDayLocked={isCurrentDayLocked}
              count={count}
              challenge={challengesMap.get(dateStr)}
              onClick={() => !isFuture && !isCurrentDayLocked && onDayClick(day)}
            />
          );
        })}
    </CalendarGrid>
  );
}
