import type { ThemeMode, ThemeName } from '../../hooks/ui/useThemeState';

interface ThemeToggleProps {
  mode: ThemeMode;
  onSetMode: (mode: ThemeMode) => void;
  theme: ThemeName;
  onSetTheme: (theme: ThemeName) => void;
}

/** Theme metadata — accent colors hardcoded so previews work regardless of active theme */
const THEME_META: { key: ThemeName; label: string; accent: string }[] = [
  { key: 'a', label: 'Pop', accent: '#FF3366' },
  { key: 'b', label: 'Swiss', accent: '#E63322' },
  { key: 'c', label: 'Cloud', accent: '#E07A5F' },
];

export function ThemeToggle({ mode, onSetMode, theme, onSetTheme }: ThemeToggleProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Dark mode toggle */}
      <div>
        <h4 className="m-0 mb-1 text-xsuppercase text-(--color-text-tertiary)">Mode</h4>
        <div className="flex gap-1">
          {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
            <button
              key={m}
              className={`flex-1 py-1.5 px-2 rounded-(--radius-sm) text-xsfont-medium transition-colors ${
                mode === m
                  ? 'bg-(--color-selected) text-(--color-accent) border border-(--color-accent)'
                  : 'bg-(--color-bg-tertiary) text-(--color-text-secondary) border border-transparent hover:bg-(--color-hover)'
              }`}
              onClick={() => onSetMode(m)}
              title={`${m.charAt(0).toUpperCase() + m.slice(1)} mode`}
            >
              {m === 'light' ? 'Light' : m === 'dark' ? 'Dark' : 'Auto'}
            </button>
          ))}
        </div>
      </div>

      {/* Theme selection */}
      <div>
        <h4 className="m-0 mb-1 text-xsuppercase text-(--color-text-tertiary)">Theme</h4>
        <div className="flex gap-1">
          {THEME_META.map(({ key, label, accent }) => (
            <button
              key={key}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-(--radius-sm) text-xs font-semibold transition-colors ${
                theme === key
                  ? 'bg-(--color-selected) text-(--color-accent) border border-(--color-accent)'
                  : 'bg-(--color-bg-tertiary) text-(--color-text-secondary) border border-transparent hover:bg-(--color-hover)'
              }`}
              onClick={() => onSetTheme(key)}
              title={`${label} theme`}
            >
              <span
                className="shrink-0 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: accent,
                }}
              />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
