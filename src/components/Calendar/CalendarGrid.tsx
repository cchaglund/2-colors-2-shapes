import { DAYS_OF_WEEK } from '../../utils/calendarUtils';

interface CalendarGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CalendarGrid({ children, className }: CalendarGridProps) {
  return (
    <div className={`grid grid-cols-7 gap-1 ${className ?? ''}`}>
      {DAYS_OF_WEEK.map((day) => (
        <div
          key={day}
          className="text-center py-2 text-[11px] font-medium text-(--color-text-tertiary)"
        >
          {day}
        </div>
      ))}
      {children}
    </div>
  );
}
