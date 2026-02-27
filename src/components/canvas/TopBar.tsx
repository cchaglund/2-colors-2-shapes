import logoSvg from '../../assets/logo.svg';
import type { ThemeMode, ThemeName } from '../../hooks/ui/useThemeState';
import type { Profile } from '../../hooks/auth/useProfile';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserMenuDropdown } from './UserMenuDropdown';
import { PillButton } from '../shared/PillButton';

// --- Theme Pill (dark mode toggle + divider + A/B/C/D) ---

const THEMES: ThemeName[] = ['a', 'b', 'c', 'd'];

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

function ThemePill({
  mode,
  onSetMode,
  theme,
  onSetTheme,
}: {
  mode: ThemeMode;
  onSetMode: (mode: ThemeMode) => void;
  theme: ThemeName;
  onSetTheme: (theme: ThemeName) => void;
}) {
  // Resolve effective mode for icon display
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleDarkMode = () => {
    if (isDark) {
      onSetMode('light');
    } else {
      onSetMode('dark');
    }
  };

  return (
    <div className="flex items-center gap-0 rounded-(--radius-pill) h-8 bg-(--color-card-bg)" style={{ border: 'var(--border-width, 2px) solid var(--color-border)', boxShadow: 'var(--shadow-btn)' }}>
      {/* Dark mode toggle */}
      <button
        className="flex items-center justify-center w-8 h-full rounded-l-(--radius-pill) transition-colors text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)"
        onClick={toggleDarkMode}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-(--color-border)" />

      {/* Theme buttons A/B/C/D */}
      {THEMES.map((t) => (
        <button
          key={t}
          className={`flex items-center justify-center w-7 h-full text-xs font-bold uppercase transition-colors ${
            theme === t
              ? 'bg-(--color-accent) text-(--color-accent-text)'
              : 'text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)'
          } ${t === 'd' ? 'rounded-r-(--radius-pill)' : ''}`}
          onClick={() => onSetTheme(t)}
          title={`Theme ${t.toUpperCase()}`}
        >
          {t.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// --- Top Bar ---

interface TopBarProps {
  // Theme
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
  themeName: ThemeName;
  onSetThemeName: (name: ThemeName) => void;
  // Center content
  centerContent?: React.ReactNode;
  // Right content (overrides default buttons)
  rightContent?: React.ReactNode;
  // Default right-side buttons (canvas editor mode)
  onReset?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saved' | 'error';
  hasSubmittedToday?: boolean;
  isLoggedIn?: boolean;
  profile?: Profile | null;
  profileLoading?: boolean;
}

export function TopBar({
  themeMode,
  onSetThemeMode,
  themeName,
  onSetThemeName,
  centerContent,
  rightContent,
  onReset,
  onSave,
  isSaving,
  saveStatus,
  hasSubmittedToday,
  isLoggedIn,
  profile,
  profileLoading,
}: TopBarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-(--color-card-bg) shrink-0 z-30 relative" style={{ borderBottom: 'var(--border-width, 2px) solid var(--color-border)' }}>
      {/* Left group: logo + theme pill */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 no-underline text-(--color-text-primary)">
          <img src={logoSvg} alt="" width="24" height="24" />
          <span className="text-sm font-semibold">2colors</span>
        </a>

        <ThemePill
          mode={themeMode}
          onSetMode={onSetThemeMode}
          theme={themeName}
          onSetTheme={onSetThemeName}
        />
      </div>

      {/* Center group */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {centerContent}
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2">
        {rightContent ?? (
          <DefaultRightContent
            onReset={onReset}
            onSave={onSave}
            isSaving={isSaving}
            saveStatus={saveStatus}
            hasSubmittedToday={hasSubmittedToday}
            isLoggedIn={isLoggedIn}
            profile={profile}
            profileLoading={profileLoading}
          />
        )}
      </div>
    </header>
  );
}

// --- Default right-side content for canvas editor ---

function DefaultRightContent({
  onReset,
  onSave,
  isSaving,
  saveStatus,
  hasSubmittedToday,
  isLoggedIn,
  profile,
  profileLoading,
}: {
  onReset?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saved' | 'error';
  hasSubmittedToday?: boolean;
  isLoggedIn?: boolean;
  profile?: Profile | null;
  profileLoading?: boolean;
}) {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  const saveLabel = isSaving
    ? 'Saving...'
    : saveStatus === 'saved'
      ? 'Saved'
      : hasSubmittedToday
        ? 'Submitted'
        : 'Submit!';

  return (
    <>
      {/* Reset */}
      {onReset && (
        <PillButton
          variant="secondary"
          className="hover:text-(--color-danger)"
          onClick={onReset}
          title="Reset canvas"
        >
          Reset
        </PillButton>
      )}

      {/* Submit */}
      {onSave && isLoggedIn ? (
        <PillButton
          variant="primary"
          className="px-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onSave}
          disabled={isSaving || hasSubmittedToday}
          title={hasSubmittedToday ? 'Already submitted today' : 'Submit your creation'}
        >
          {saveLabel}
        </PillButton>
      ) : onSave ? (
        <PillButton
          variant="primary"
          className="px-4 font-bold"
          onClick={onSave}
          title="Sign in to submit"
        >
          Submit!
        </PillButton>
      ) : null}

      {/* Divider */}
      <div className="w-px h-5 bg-(--color-border) mx-1" />

      {/* Gallery */}
      <PillButton as="a" variant="ghost" href="/?view=gallery">
        Gallery
      </PillButton>

      {/* Login / User menu */}
      <UserMenuDropdown
        profile={profile ?? null}
        loading={!!(authLoading || profileLoading)}
        isLoggedIn={!!user}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />
    </>
  );
}

// --- Center content for canvas editor ---

export function InspirationCenter({ word }: { word: string }) {
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-[10px] uppercase tracking-widest text-(--color-accent)">Today&apos;s Inspiration</span>
      <span className="text-[20px] font-semibold text-(--color-text-primary) capitalize font-display">{word}</span>
    </div>
  );
}
