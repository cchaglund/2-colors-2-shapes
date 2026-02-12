import { DAYS_OF_WEEK } from '../../utils/calendarUtils';

interface CalendarGridProps {
  loading: boolean;
  loadingMessage: string;
  children: React.ReactNode;
}

export function CalendarGrid({ loading, loadingMessage, children }: CalendarGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-(--color-text-secondary) h-full">
        {loadingMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1 mt-14">
      {/* Day headers */}
      {DAYS_OF_WEEK.map((day) => (
        <div
          key={day}
          className="text-center py-2 text-sm font-medium text-(--color-text-tertiary)"
        >
          {day}
        </div>
      ))}

      {/* Calendar days */}
      {children}
    </div>
  );
}
