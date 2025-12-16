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
          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors border ${
            mode === 'light'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent hover:opacity-80'
          }`}
          style={{
            backgroundColor: mode === 'light' ? 'var(--color-selected)' : 'var(--color-bg-tertiary)',
            color: mode === 'light' ? undefined : 'var(--color-text-secondary)',
          }}
          onClick={() => onSetMode('light')}
          title="Light theme"
        >
          Light
        </button>
        <button
          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors border ${
            mode === 'dark'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent hover:opacity-80'
          }`}
          style={{
            backgroundColor: mode === 'dark' ? 'var(--color-selected)' : 'var(--color-bg-tertiary)',
            color: mode === 'dark' ? undefined : 'var(--color-text-secondary)',
          }}
          onClick={() => onSetMode('dark')}
          title="Dark theme"
        >
          Dark
        </button>
        <button
          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors border ${
            mode === 'system'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent hover:opacity-80'
          }`}
          style={{
            backgroundColor: mode === 'system' ? 'var(--color-selected)' : 'var(--color-bg-tertiary)',
            color: mode === 'system' ? undefined : 'var(--color-text-secondary)',
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
