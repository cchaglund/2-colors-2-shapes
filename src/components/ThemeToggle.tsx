import type { ThemeMode } from '../hooks/useThemeState';

interface ThemeToggleProps {
  mode: ThemeMode;
  onSetMode: (mode: ThemeMode) => void;
}

export function ThemeToggle({ mode, onSetMode }: ThemeToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="m-0 mb-1 text-xs uppercase text-(--color-text-tertiary)">
        Theme
      </h4>
      <div className="flex gap-1">
        <button
          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
            mode === 'light'
              ? 'bg-(--color-selected) text-(--color-accent) border border-(--color-accent)'
              : 'bg-(--color-bg-tertiary) text-(--color-text-secondary) border border-transparent'
          }`}
          onClick={() => onSetMode('light')}
          title="Light theme"
        >
          Light
        </button>
        <button
          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
            mode === 'dark'
              ? 'bg-(--color-selected) text-(--color-accent) border border-(--color-accent)'
              : 'bg-(--color-bg-tertiary) text-(--color-text-secondary) border border-transparent'
          }`}
          onClick={() => onSetMode('dark')}
          title="Dark theme"
        >
          Dark
        </button>
        <button
          className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
            mode === 'system'
              ? 'bg-(--color-selected) text-(--color-accent) border border-(--color-accent)'
              : 'bg-(--color-bg-tertiary) text-(--color-text-secondary) border border-transparent'
          }`}
          onClick={() => onSetMode('system')}
          title="Follow system theme"
        >
          Auto
        </button>
      </div>
    </div>
  );
}
