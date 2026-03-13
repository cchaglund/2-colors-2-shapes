import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  width: '2rem',
  height: '2rem',
  background: 'var(--color-card-bg)',
  border: 'var(--border-width, 2px) solid var(--color-border-light)',
  borderRadius: 'var(--radius-md)',
};

const todayBtnStyle: React.CSSProperties = {
  background: 'var(--color-selected)',
  border: 'var(--border-width, 2px) solid var(--color-border-light)',
  borderRadius: 'var(--radius-pill)',
  padding: '0.25rem 0.75rem',
  fontSize: '0.6875rem',
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
          <ChevronLeft size={16} />
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
          <ChevronRight size={16} />
        </button>
      </div>

  );
}
