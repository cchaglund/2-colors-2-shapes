interface CalendarHeaderProps {
  onClose: () => void;
}

export function CalendarHeader({ onClose }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-(--color-text-primary)">
        Gallery
      </h2>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer transition-colors hover:bg-(--color-hover) bg-(--color-bg-tertiary) text-(--color-text-secondary)"
        aria-label="Close calendar"
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
