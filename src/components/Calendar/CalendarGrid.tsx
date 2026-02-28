import { DAYS_OF_WEEK, DAYS_OF_WEEK_SHORT } from '../../utils/calendarUtils';
import { useIsDesktop } from '../../hooks/ui/useBreakpoint';

interface CalendarGridProps {
  children: React.ReactNode;
  emptySlotCount?: number;
  className?: string;
}

export function CalendarGrid({ children, emptySlotCount = 0, className }: CalendarGridProps) {
  const isDesktop = useIsDesktop();
  const dayLabels = isDesktop ? DAYS_OF_WEEK : DAYS_OF_WEEK_SHORT;

  return (
    <div className={`border border-(--color-border) rounded-(--radius-lg) overflow-hidden bg-(--color-bg-primary) ${className ?? ''}`}>
      <div className="grid grid-cols-7 border-b border-(--color-border)">
        {dayLabels.map((day, i) => (
          <div
            key={i}
            className="p-1 md:p-2 text-center text-xs font-medium text-(--color-text-secondary) bg-(--color-bg-secondary)"
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
