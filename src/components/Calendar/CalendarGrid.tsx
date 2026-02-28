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
    <div className={className ?? ''}>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {dayLabels.map((day, i) => (
          <div
            key={i}
            className="p-1 text-center text-xs font-medium text-(--color-text-secondary) uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: emptySlotCount }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {children}
      </div>
    </div>
  );
}
