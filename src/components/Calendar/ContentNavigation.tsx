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
    <div className="flex items-center justify-between">
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="p-2 rounded-md cursor-pointer transition-colors bg-(--color-bg-tertiary) text-(--color-text-primary) disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Previous"
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

      <div className="flex items-center gap-3">
        <span className="text-[15px] font-medium text-(--color-text-primary)">
          {label}
        </span>
        {showToday && (
          <button
            onClick={onToday}
            className="px-3 py-1 rounded-md cursor-pointer text-[12px] transition-colors bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:text-(--color-text-primary)"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="p-2 rounded-md cursor-pointer transition-colors bg-(--color-bg-tertiary) text-(--color-text-primary) disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next"
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
