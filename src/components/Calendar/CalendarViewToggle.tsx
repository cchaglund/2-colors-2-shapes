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
    <div
      className="flex rounded-lg p-1 mb-4"
      style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
    >
      <button
        onClick={() => onSetViewMode('my-submissions')}
        disabled={!user}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          !user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          backgroundColor: effectiveViewMode === 'my-submissions' ? 'var(--color-bg-primary)' : 'transparent',
          color: effectiveViewMode === 'my-submissions' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          boxShadow: effectiveViewMode === 'my-submissions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }}
        title={!user ? 'Sign in to view your submissions' : undefined}
      >
        My Submissions
      </button>
      <button
        onClick={() => onSetViewMode('winners')}
        className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        style={{
          backgroundColor: effectiveViewMode === 'winners' ? 'var(--color-bg-primary)' : 'transparent',
          color: effectiveViewMode === 'winners' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          boxShadow: effectiveViewMode === 'winners' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        🏆 Winners
      </button>
    </div>
  );
}
