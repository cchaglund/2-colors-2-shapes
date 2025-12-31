import type { ViewMode } from './types';

interface CalendarViewToggleProps {
  effectiveViewMode: ViewMode;
  user: { id: string } | null;
  onSetViewMode: (mode: ViewMode) => void;
}

export function CalendarViewToggle({
  effectiveViewMode,
  user,
  onSetViewMode,
}: CalendarViewToggleProps) {
  return (
    <div className="flex rounded-lg p-1 mb-4 bg-(--color-bg-tertiary)">
      <button
        onClick={() => onSetViewMode('my-submissions')}
        disabled={!user}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          !user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          effectiveViewMode === 'my-submissions'
            ? 'bg-(--color-bg-primary) text-(--color-text-primary) shadow-sm'
            : 'bg-transparent text-(--color-text-secondary)'
        }`}
        title={!user ? 'Sign in to view your submissions' : undefined}
      >
        My Submissions
      </button>
      <button
        onClick={() => onSetViewMode('winners')}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
          effectiveViewMode === 'winners'
            ? 'bg-(--color-bg-primary) text-(--color-text-primary) shadow-sm'
            : 'bg-transparent text-(--color-text-secondary)'
        }`}
      >
        🏆 Winners
      </button>
    </div>
  );
}
