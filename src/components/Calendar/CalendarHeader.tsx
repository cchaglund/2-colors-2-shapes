interface CalendarHeaderProps {
  onClose: () => void;
}

export function CalendarHeader({ onClose }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2
        className="text-xl font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Calendar
      </h2>
      <button
        onClick={onClose}
        className="p-2 rounded-md cursor-pointer transition-colors hover:bg-opacity-80"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
        }}
        aria-label="Close calendar"
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
