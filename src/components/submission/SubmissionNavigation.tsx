interface SubmissionNavigationProps {
  adjacentDates: { prev: string | null; next: string | null };
}

export function SubmissionNavigation({ adjacentDates }: SubmissionNavigationProps) {
  const navigateTo = (date: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('date', date);
    window.location.href = url.toString();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => adjacentDates.prev && navigateTo(adjacentDates.prev)}
        disabled={!adjacentDates.prev}
        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Previous
      </button>
      <button
        onClick={() => adjacentDates.next && navigateTo(adjacentDates.next)}
        disabled={!adjacentDates.next}
        className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
        }}
      >
        Next
        <svg
          width="14"
          height="14"
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
