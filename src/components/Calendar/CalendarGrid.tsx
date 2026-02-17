import { DAYS_OF_WEEK } from '../../utils/calendarUtils';

interface CalendarGridProps {
  children: React.ReactNode;
  emptySlotCount?: number;
  className?: string;
}

export function CalendarGrid({ children, emptySlotCount = 0, className }: CalendarGridProps) {
  return (
    <div className={`border border-(--color-border) rounded-lg overflow-hidden bg-(--color-bg-primary) ${className ?? ''}`}>
      <div className="grid grid-cols-7 border-b border-(--color-border)">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-(--color-text-secondary) bg-(--color-bg-secondary)"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0">
        {Array.from({ length: emptySlotCount }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square border-b border-r border-(--color-border)" />
        ))}
        {children}
      </div>
    </div>
  );
}
