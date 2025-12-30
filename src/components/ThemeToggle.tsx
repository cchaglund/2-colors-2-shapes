import type { ThemeMode } from '../hooks/useThemeState';

interface ThemeToggleProps {
  mode: ThemeMode;
  onSetMode: (mode: ThemeMode) => void;
}

export function ThemeToggle({ mode, onSetMode }: ThemeToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="m-0 mb-1 text-xs uppercase" style={{ color: 'var(--color-text-tertiary)' }}>
        Theme
      </h4>
      <div className="flex gap-1">
        <button
          className="flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: mode === 'light' ? 'var(--color-selected)' : 'var(--color-bg-tertiary)',
            color: mode === 'light' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            border: mode === 'light' ? '1px solid var(--color-accent)' : '1px solid transparent',
          }}
          onClick={() => onSetMode('light')}
          title="Light theme"
        >
          Light
        </button>
        <button
          className="flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: mode === 'dark' ? 'var(--color-selected)' : 'var(--color-bg-tertiary)',
            color: mode === 'dark' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            border: mode === 'dark' ? '1px solid var(--color-accent)' : '1px solid transparent',
          }}
          onClick={() => onSetMode('dark')}
          title="Dark theme"
        >
          Dark
        </button>
        <button
          className="flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors"
          style={{
            backgroundColor: mode === 'system' ? 'var(--color-selected)' : 'var(--color-bg-tertiary)',
            color: mode === 'system' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            border: mode === 'system' ? '1px solid var(--color-accent)' : '1px solid transparent',
          }}
          onClick={() => onSetMode('system')}
          title="Follow system theme"
        >
          Auto
        </button>
      </div>
    </div>
  );
}
