import type { ViewMode } from './types';

interface CalendarViewToggleProps {
  effectiveViewMode: ViewMode;
  user: { id: string } | null;
  onSetViewMode: (mode: ViewMode) => void;
}

const tabStyle = {
  active: {
    background: 'var(--color-card-bg)',
    border: 'var(--border-width, 2px) solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-btn)',
  } as React.CSSProperties,
  inactive: {
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'none',
  } as React.CSSProperties,
};

export function CalendarViewToggle({
  effectiveViewMode,
  user,
  onSetViewMode,
}: CalendarViewToggleProps) {
  const tabs: { mode: ViewMode; label: string; requiresAuth: boolean }[] = [
    { mode: 'my-submissions', label: 'My Submissions', requiresAuth: true },
    { mode: 'winners', label: 'Winners', requiresAuth: false },
    { mode: 'wall', label: 'Wall', requiresAuth: false },
    { mode: 'friends', label: 'Friends', requiresAuth: true },
  ];

  return (
    <div
      className="flex mb-7"
      style={{
        background: 'var(--color-selected)',
        border: 'var(--border-width, 2px) solid var(--color-border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: 3,
      }}
    >
      {tabs.map(({ mode, label, requiresAuth }) => {
        const isActive = effectiveViewMode === mode;
        const isDisabled = requiresAuth && !user;

        return (
          <button
            key={mode}
            onClick={() => onSetViewMode(mode)}
            disabled={isDisabled}
            className={`flex-1 px-4 py-2 text-[13px] transition-all ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              isActive
                ? 'text-(--color-text-primary) font-bold'
                : 'text-(--color-text-secondary) font-semibold'
            }`}
            style={isActive ? tabStyle.active : tabStyle.inactive}
            title={isDisabled ? `Sign in to view ${label.toLowerCase()}` : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
