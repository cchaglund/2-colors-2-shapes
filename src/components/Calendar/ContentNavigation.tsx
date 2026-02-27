interface ContentNavigationProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  canGoPrev?: boolean;
  canGoNext: boolean;
  showToday?: boolean;
}

const navBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  background: 'var(--color-card-bg)',
  border: 'var(--border-width, 2px) solid var(--color-border-light)',
  borderRadius: 'var(--radius-md)',
};

const todayBtnStyle: React.CSSProperties = {
  background: 'var(--color-selected)',
  border: 'var(--border-width, 2px) solid var(--color-border-light)',
  borderRadius: 'var(--radius-pill)',
  padding: '4px 12px',
  fontSize: 11,
  fontWeight: 600,
};

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
          className="flex items-center justify-center cursor-pointer transition-all text-(--color-text-primary) disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
          style={navBtnStyle}
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
          <span className="text-lg font-bold min-w-40 text-center text-(--color-text-primary) font-display">
            {label}
          </span>
          {showToday && (
            <button
              onClick={onToday}
              className="absolute -right-19 -top-0.5 cursor-pointer transition-all text-(--color-text-primary) hover:opacity-80"
              style={todayBtnStyle}
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="flex items-center justify-center cursor-pointer transition-all text-(--color-text-primary) disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
          style={navBtnStyle}
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
