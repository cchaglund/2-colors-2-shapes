import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import type { ThemeMode, ThemeName } from '../../hooks/ui/useThemeState';
import { THEME_META, MODE_CYCLE, MODE_TITLE } from '../../constants/themes';
import { useClickOutside } from '../../hooks/ui/useClickOutside';

// --- Mode icon helper ---

function ModeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === 'light') return <Sun size={16} />;
  if (mode === 'dark') return <Moon size={16} />;
  return <Monitor size={16} />;
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

  return (
    <div className="flex items-center gap-0 rounded-(--radius-pill) h-8 bg-(--color-card-bg)" style={{ border: 'var(--border-width, 2px) solid var(--color-border)', boxShadow: 'var(--shadow-btn)' }}>
      {/* Dark mode toggle */}
      <button
        className="flex items-center justify-center w-8 h-full rounded-l-(--radius-pill) transition-colors cursor-pointer text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)"
        onClick={cycleMode}
        title={MODE_TITLE[mode]}
      >
        <ModeIcon mode={mode} />
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
        <ChevronDown
          size={10}
          strokeWidth={2.5}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
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

  return (
    <div className="flex items-center gap-0 h-8">
      {/* Dark mode toggle */}
      <button
        className="flex items-center justify-center w-8 h-full rounded-l-(--radius-md) transition-colors cursor-pointer text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)"
        onClick={cycleMode}
        title={MODE_TITLE[mode]}
      >
        <ModeIcon mode={mode} />
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
