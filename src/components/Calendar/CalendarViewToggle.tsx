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
    <div className="flex rounded-md p-0.5 mb-4 border border-(--color-border) bg-(--color-bg-tertiary)">
      <button
        onClick={() => onSetViewMode('my-submissions')}
        disabled={!user}
        className={`flex-1 px-4 py-1.5 rounded text-[13px] font-medium transition-colors ${
          !user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          effectiveViewMode === 'my-submissions'
            ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
            : 'bg-transparent text-(--color-text-secondary) border border-transparent'
        }`}
        title={!user ? 'Sign in to view your submissions' : undefined}
      >
        My Submissions
      </button>
      <button
        onClick={() => onSetViewMode('winners')}
        className={`flex-1 px-4 py-1.5 rounded text-[13px] font-medium transition-colors cursor-pointer ${
          effectiveViewMode === 'winners'
            ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
            : 'bg-transparent text-(--color-text-secondary) border border-transparent'
        }`}
      >
        Winners
      </button>
      <button
        onClick={() => onSetViewMode('wall')}
        className={`flex-1 px-4 py-1.5 rounded text-[13px] font-medium transition-colors cursor-pointer ${
          effectiveViewMode === 'wall'
            ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
            : 'bg-transparent text-(--color-text-secondary) border border-transparent'
        }`}
      >
        Wall
      </button>
      <button
        onClick={() => onSetViewMode('friends')}
        disabled={!user}
        className={`flex-1 px-4 py-1.5 rounded text-[13px] font-medium transition-colors ${
          !user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          effectiveViewMode === 'friends'
            ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
            : 'bg-transparent text-(--color-text-secondary) border border-transparent'
        }`}
        title={!user ? 'Sign in to see friends\' submissions' : undefined}
      >
        Friends
      </button>
    </div>
  );
}
