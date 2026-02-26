import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Profile } from '../../hooks/auth/useProfile';
import { FollowsProvider } from '../../contexts/FollowsContext';
import { useFollows } from '../../hooks/social/useFollows';
import { supabase } from '../../lib/supabase';

// --- Avatar circle with user initial fallback ---

function AvatarCircle({ profile, size = 'sm' }: { profile: Profile; size?: 'sm' | 'lg' }) {
  const sizeClasses = size === 'lg' ? 'w-10 h-10 text-base' : 'w-5 h-5 text-[10px]';

  if (profile.avatar_url) {
    return <img src={profile.avatar_url} alt="" className={`${sizeClasses} rounded-full`} />;
  }

  const initial = (profile.nickname || 'U').charAt(0).toUpperCase();
  return (
    <div className={`${sizeClasses} rounded-full bg-(--color-accent) text-(--color-accent-text) flex items-center justify-center font-semibold`}>
      {initial}
    </div>
  );
}

// --- Dropdown trigger + panel ---

interface UserMenuDropdownProps {
  profile: Profile;
  onSignOut: () => void;
}

export function UserMenuDropdown({ profile, onSignOut }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const displayName = profile.onboarding_complete ? profile.nickname : 'New user';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger: avatar + name + chevron */}
      <button
        className="h-8 px-3 rounded-(--radius-pill) border border-(--color-border) text-xs font-medium transition-colors bg-transparent text-(--color-text-secondary) hover:bg-(--color-hover) flex items-center gap-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <AvatarCircle profile={profile} size="sm" />
        <span className="max-w-20 truncate">{displayName}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            exit={{ opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.15 } }}
            className="absolute right-0 top-full mt-2 w-72 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-lg overflow-hidden z-50"
          >
            <FollowsProvider>
              <UserMenuContent
                profile={profile}
                onSignOut={() => { setIsOpen(false); onSignOut(); }}
                onClose={() => setIsOpen(false)}
              />
            </FollowsProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Dropdown content (rendered inside FollowsProvider) ---

type MenuTab = 'following' | 'followers';

function UserMenuContent({
  profile,
  onSignOut,
  onClose,
}: {
  profile: Profile;
  onSignOut: () => void;
  onClose: () => void;
}) {
  const { following, followers, followingCount, followersCount, follow, loading } = useFollows();
  const [activeTab, setActiveTab] = useState<MenuTab>('following');
  const [nickname, setNickname] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const displayName = profile.onboarding_complete ? profile.nickname : 'New user';
  const friendsList = activeTab === 'following' ? following : followers;

  const handleAdd = useCallback(async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    setAddError('');
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('nickname', trimmed)
        .limit(1)
        .single();

      if (error || !data) {
        setAddError('User not found');
        return;
      }

      const result = await follow(data.id);
      if (result.success) {
        setNickname('');
      } else {
        setAddError(result.error || 'Failed to add');
      }
    } catch {
      setAddError('User not found');
    } finally {
      setAdding(false);
    }
  }, [nickname, follow]);

  const handleNavigate = useCallback((userId: string) => {
    onClose();
    window.location.href = `?view=profile&user=${userId}`;
  }, [onClose]);

  return (
    <div className="flex flex-col max-h-96">
      {/* Header: large avatar + name + stats */}
      <div className="p-4 border-b border-(--color-border)">
        <div className="flex items-center gap-3">
          <AvatarCircle profile={profile} size="lg" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-(--color-text-primary) truncate">{displayName}</div>
            <div className="text-xs text-(--color-text-secondary)">
              {followingCount} following &middot; {followersCount} followers
            </div>
          </div>
        </div>
      </div>

      {/* Following / Followers tabs */}
      <div className="flex border-b border-(--color-border)">
        {(['following', 'followers'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === tab
                ? 'text-(--color-accent) border-b-2 border-(--color-accent)'
                : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
            }`}
          >
            {tab === 'following' ? `Following (${followingCount})` : `Followers (${followersCount})`}
          </button>
        ))}
      </div>

      {/* Scrollable friends list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-4 h-4 border-2 border-(--color-accent) border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friendsList.length === 0 ? (
          <div className="text-center py-6 text-xs text-(--color-text-secondary)">
            {activeTab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
          </div>
        ) : (
          <div className="py-1">
            {friendsList.map(user => (
              <button
                key={user.id}
                onClick={() => handleNavigate(user.id)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-xs transition-colors hover:bg-(--color-hover) cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-(--color-accent)/20 text-(--color-accent) flex items-center justify-center text-[10px] font-semibold shrink-0">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>
                <span className="text-(--color-text-primary) truncate">{user.nickname}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add by nickname */}
      <div className="p-3 border-t border-(--color-border)">
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setAddError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Add by nickname..."
            className="flex-1 h-7 px-2 text-xs bg-(--color-bg-secondary) border border-(--color-border) rounded-(--radius-sm) text-(--color-text-primary) placeholder:text-(--color-text-secondary) focus:outline-none focus:ring-1 focus:ring-(--color-accent)"
          />
          <button
            onClick={handleAdd}
            disabled={!nickname.trim() || adding}
            className="h-7 px-3 text-xs font-medium rounded-(--radius-sm) bg-(--color-accent) text-(--color-accent-text) hover:bg-(--color-accent-hover) disabled:opacity-50 transition-colors cursor-pointer"
          >
            {adding ? '...' : 'Add'}
          </button>
        </div>
        {addError && <div className="text-[10px] text-(--color-danger) mt-1">{addError}</div>}
      </div>

      {/* Log out */}
      <div className="p-3 border-t border-(--color-border)">
        <button
          onClick={onSignOut}
          className="w-full h-8 text-xs font-medium rounded-(--radius-sm) border border-(--color-border) text-(--color-text-secondary) hover:text-(--color-danger) hover:border-(--color-danger) transition-colors cursor-pointer"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
