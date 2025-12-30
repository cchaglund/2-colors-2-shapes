import { MONTHS } from '../../utils/calendarUtils';

interface CalendarNavigationProps {
  currentYear: number;
  currentMonth: number;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarNavigation({
  currentYear,
  currentMonth,
  canGoNext,
  onPrevious,
  onNext,
  onToday,
}: CalendarNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrevious}
        className="p-2 rounded-md cursor-pointer transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
        }}
        aria-label="Previous month"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="flex items-center gap-4">
        <span
          className="text-lg font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {MONTHS[currentMonth]} {currentYear}
        </span>
        <button
          onClick={onToday}
          className="px-3 py-1 rounded-md cursor-pointer text-sm transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Today
        </button>
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="p-2 rounded-md cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
        }}
        aria-label="Next month"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
