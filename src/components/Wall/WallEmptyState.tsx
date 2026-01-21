type ViewType = 'grid' | 'calendar';

interface WallEmptyStateProps {
  showNavigation?: boolean;
  adjacentDates?: { prev: string | null; next: string | null };
  onDateChange?: (date: string) => void;
  formattedDate?: string;
  todayDate?: string;
  isToday?: boolean;
  viewType?: ViewType;
  onViewTypeChange?: (viewType: ViewType) => void;
}

export function WallEmptyState({
  showNavigation = false,
  adjacentDates,
  onDateChange,
  formattedDate,
  todayDate,
  isToday = true,
  viewType = 'grid',
  onViewTypeChange,
}: WallEmptyStateProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* View toggle */}
      {onViewTypeChange && (
        <div className="flex items-center justify-between">
          <div className="flex rounded-md p-0.5 border border-(--color-border) bg-(--color-bg-tertiary)">
            <button
              onClick={() => onViewTypeChange('grid')}
              className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
                viewType === 'grid'
                  ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
                  : 'bg-transparent text-(--color-text-secondary) border border-transparent'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => onViewTypeChange('calendar')}
              className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
                viewType === 'calendar'
                  ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
                  : 'bg-transparent text-(--color-text-secondary) border border-transparent'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {showNavigation && adjacentDates && onDateChange && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => adjacentDates.prev && onDateChange(adjacentDates.prev)}
            disabled={!adjacentDates.prev}
            className="text-[13px] text-(--color-accent) hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-(--color-text-primary)">
              {formattedDate}
            </span>
            {!isToday && todayDate && (
              <button
                onClick={() => onDateChange(todayDate)}
                className="px-2 py-1 text-[12px] font-medium bg-(--color-accent) text-white rounded hover:opacity-90"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={() => adjacentDates.next && onDateChange(adjacentDates.next)}
            disabled={!adjacentDates.next}
            className="text-[13px] text-(--color-accent) hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            Next →
          </button>
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-(--color-bg-tertiary) flex items-center justify-center mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-tertiary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="9" x2="15" y2="15" />
          <line x1="15" y1="9" x2="9" y2="15" />
        </svg>
      </div>
        <p className="text-[13px] text-(--color-text-secondary)">
          No public submissions for this day
        </p>
      </div>
    </div>
  );
}
