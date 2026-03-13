import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ThemeMode, ThemeName } from '../../hooks/ui/useThemeState';
import { THEME_META, MODE_CYCLE, MODE_TITLE } from '../../constants/themes';
import { useClickOutside } from '../../hooks/ui/useClickOutside';

// --- Icons ---

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

// --- Shared props ---

interface ThemePillProps {
  mode: ThemeMode;
  onSetMode: (mode: ThemeMode) => void;
  theme: ThemeName;
  onSetTheme: (theme: ThemeName) => void;
}

// --- Full expanded ThemePill ---

export function ThemePill({ mode, onSetMode, theme, onSetTheme }: ThemePillProps) {
  const cycleMode = () => onSetMode(MODE_CYCLE[mode]);
  const modeIcon = mode === 'light' ? <SunIcon /> : mode === 'dark' ? <MoonIcon /> : <MonitorIcon />;

  return (
    <div className="flex items-center gap-0 rounded-(--radius-pill) h-8 bg-(--color-card-bg)" style={{ border: 'var(--border-width, 2px) solid var(--color-border)', boxShadow: 'var(--shadow-btn)' }}>
      {/* Dark mode toggle */}
      <button
        className="flex items-center justify-center w-8 h-full rounded-l-(--radius-pill) transition-colors cursor-pointer text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)"
        onClick={cycleMode}
        title={MODE_TITLE[mode]}
      >
        {modeIcon}
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-(--color-border) mx-0.5" />

      {/* Theme buttons */}
      {THEME_META.map(({ key, label, accent }, i) => {
        const isActive = theme === key;
        const isLast = i === THEME_META.length - 1;
        return (
          <button
            key={key}
            className={`flex items-center justify-center gap-1.5 h-full px-2 text-[0.6875rem] font-bold tracking-wide transition-colors cursor-pointer ${
              isActive
                ? 'text-(--color-text-primary)'
                : 'text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-hover)'
            } ${isLast ? 'rounded-r-(--radius-pill)' : ''}`}
            onClick={() => onSetTheme(key)}
            title={`${label} theme`}
          >
            <span
              className="shrink-0 rounded-full transition-all duration-150"
              style={{
                width: isActive ? '0.625rem' : '0.5rem',
                height: isActive ? '0.625rem' : '0.5rem',
                backgroundColor: accent,
                boxShadow: isActive ? `0 0 0 2px var(--color-card-bg), 0 0 0 3.5px ${accent}` : 'none',
              }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// --- Collapsed ThemePill (dot trigger + dropdown) ---

export function CollapsedThemePill({ mode, onSetMode, theme, onSetTheme }: ThemePillProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, open, () => setOpen(false));

  const activeTheme = THEME_META.find(t => t.key === theme);
  const accent = activeTheme?.accent ?? '#888';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        className="flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-(--radius-pill) transition-colors cursor-pointer text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover) bg-(--color-card-bg)"
        style={{ border: 'var(--border-width, 2px) solid var(--color-border)', boxShadow: 'var(--shadow-btn)' }}
        onClick={() => setOpen(prev => !prev)}
        title="Theme & mode"
      >
        <span
          className="shrink-0 rounded-full"
          style={{
            width: '0.625rem',
            height: '0.625rem',
            backgroundColor: accent,
            boxShadow: `0 0 0 2px var(--color-card-bg), 0 0 0 3.5px ${accent}`,
          }}
        />
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-full left-0 mt-2 rounded-(--radius-md) z-50"
            style={{
              background: 'var(--color-card-bg)',
              border: 'var(--border-width, 2px) solid var(--color-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <ThemePillDropdownContent mode={mode} onSetMode={onSetMode} theme={theme} onSetTheme={onSetTheme} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Flat dropdown content (no nested pill container) ---

function ThemePillDropdownContent({ mode, onSetMode, theme, onSetTheme }: ThemePillProps) {
  const cycleMode = () => onSetMode(MODE_CYCLE[mode]);
  const modeIcon = mode === 'light' ? <SunIcon /> : mode === 'dark' ? <MoonIcon /> : <MonitorIcon />;

  return (
    <div className="flex items-center gap-0 h-8">
      {/* Dark mode toggle */}
      <button
        className="flex items-center justify-center w-8 h-full rounded-l-(--radius-md) transition-colors cursor-pointer text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)"
        onClick={cycleMode}
        title={MODE_TITLE[mode]}
      >
        {modeIcon}
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-(--color-border) mx-0.5" />

      {/* Theme buttons */}
      {THEME_META.map(({ key, label, accent }, i) => {
        const isActive = theme === key;
        const isLast = i === THEME_META.length - 1;
        return (
          <button
            key={key}
            className={`flex items-center justify-center gap-1.5 h-full px-2 text-[0.6875rem] font-bold tracking-wide transition-colors cursor-pointer ${
              isActive
                ? 'text-(--color-text-primary)'
                : 'text-(--color-text-tertiary) hover:text-(--color-text-primary) hover:bg-(--color-hover)'
            } ${isLast ? 'rounded-r-(--radius-md)' : ''}`}
            onClick={() => onSetTheme(key)}
            title={`${label} theme`}
          >
            <span
              className="shrink-0 rounded-full transition-all duration-150"
              style={{
                width: isActive ? '0.625rem' : '0.5rem',
                height: isActive ? '0.625rem' : '0.5rem',
                backgroundColor: accent,
                boxShadow: isActive ? `0 0 0 2px var(--color-card-bg), 0 0 0 3.5px ${accent}` : 'none',
              }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
