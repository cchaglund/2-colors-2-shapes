interface ContentNavigationProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  canGoPrev?: boolean;
  canGoNext: boolean;
  showToday?: boolean;
}

export function ContentNavigation({
  label,
  onPrev,
  onNext,
  onToday,
  canGoPrev = true,
  canGoNext,
  showToday = true,
}: ContentNavigationProps) {
  return (
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="p-2 rounded-md cursor-pointer transition-colors hover:bg-(--color-bg-secondary) text-(--color-text-primary) disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous"
        >
          <svg
            width="16"
            height="16"
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

        <div className='relative'>
          <span className="text-lg font-semibold min-w-40 text-center text-(--color-text-primary)">
            {label}
          </span>
          {showToday && (
            <button
              onClick={onToday}
              className="absolute -right-19 -top-0.5 px-3 py-1 text-sm rounded-md cursor-pointer border border-(--color-border) transition-colors hover:bg-(--color-bg-secondary) text-(--color-text-secondary)"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="p-2 rounded-md cursor-pointer transition-colors hover:bg-(--color-bg-secondary) text-(--color-text-primary) disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next"
        >
          <svg
            width="16"
            height="16"
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
