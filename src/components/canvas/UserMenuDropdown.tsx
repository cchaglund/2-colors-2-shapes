import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Profile } from '../../hooks/auth/useProfile';
import { FollowsProvider } from '../../contexts/FollowsContext';
import { useFollows } from '../../hooks/social/useFollows';
import { supabase } from '../../lib/supabase';

interface UserMenuDropdownProps {
  profile: Profile | null;
  loading: boolean;
  isLoggedIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function UserMenuDropdown({ profile, loading, isLoggedIn, onSignIn, onSignOut }: UserMenuDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  if (loading) {
    return <div className="h-8 px-3 flex items-center text-xs text-(--color-text-tertiary)">...</div>;
  }

  if (!isLoggedIn || !profile) {
    return (
      <button
        className="h-8 px-3 rounded-(--radius-pill) text-xs font-medium transition-colors cursor-pointer"
        style={{
          background: 'var(--color-text-primary)',
          color: 'var(--color-bg-primary)',
          border: 'var(--border-width, 2px) solid var(--color-border)',
          boxShadow: 'var(--shadow-btn)',
        }}
        onClick={onSignIn}
      >
        Log in
      </button>
    );
  }

  const initial = (profile.nickname || 'U')[0].toUpperCase();
  const displayName = profile.onboarding_complete ? profile.nickname : 'New user';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger: avatar + name + chevron */}
      <button
        className="h-8 px-3 rounded-(--radius-pill) text-xs font-medium transition-colors bg-(--color-card-bg) text-(--color-text-secondary) hover:bg-(--color-hover) flex items-center gap-2 cursor-pointer"
        style={{ border: 'var(--border-width, 2px) solid var(--color-border)', boxShadow: 'var(--shadow-btn)' }}
        onClick={() => setOpen(prev => !prev)}
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-(--color-accent) text-(--color-accent-text) flex items-center justify-center text-[10px] font-semibold leading-none">
            {initial}
          </div>
        )}
        <span className="max-w-20 truncate">{displayName}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
            className="absolute top-full right-0 mt-2 w-[280px] rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-(--modal-shadow) overflow-hidden z-50"
          >
            <FollowsProvider>
              <UserMenuContent
                profile={profile}
                onSignOut={() => { setOpen(false); onSignOut(); }}
                onClose={() => setOpen(false)}
              />
            </FollowsProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Dropdown content (requires FollowsProvider ancestor) ---

function UserMenuContent({
  profile,
  onSignOut,
  onClose,
}: {
  profile: Profile;
  onSignOut: () => void;
  onClose: () => void;
}) {
  const { following, followers, followingCount, followersCount, loading, follow } = useFollows();
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [addNickname, setAddNickname] = useState('');
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [addError, setAddError] = useState('');

  const friends = activeTab === 'following' ? following : followers;

  const handleNavigateToProfile = useCallback((userId: string) => {
    onClose();
    window.location.href = `?view=profile&user=${userId}`;
  }, [onClose]);

  const handleAddByNickname = useCallback(async () => {
    const nickname = addNickname.trim();
    if (!nickname) return;

    setAddStatus('loading');
    setAddError('');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname')
        .ilike('nickname', nickname)
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) {
        setAddStatus('error');
        setAddError('User not found');
        return;
      }

      const result = await follow(data[0].id);
      if (result.success) {
        setAddStatus('success');
        setAddNickname('');
        setTimeout(() => setAddStatus('idle'), 2000);
      } else {
        setAddStatus('error');
        setAddError(result.error || 'Failed to follow');
      }
    } catch {
      setAddStatus('error');
      setAddError('Something went wrong');
    }
  }, [addNickname, follow]);

  const initial = (profile.nickname || 'U')[0].toUpperCase();

  return (
    <div className="flex flex-col max-h-[420px]">
      {/* Header: large avatar + name + stats */}
      <div className="px-4 py-3 border-b border-(--color-border-light)">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-(--color-accent) text-(--color-accent-text) flex items-center justify-center text-base font-semibold shrink-0">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-(--color-text-primary) truncate">
              {profile.nickname || 'New user'}
            </div>
            <div className="text-[11px] text-(--color-text-secondary)">
              {loading ? '...' : `${followingCount} following · ${followersCount} followers`}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Following | Followers */}
      <div className="flex border-b border-(--color-border-light)">
        {(['following', 'followers'] as const).map(tab => (
          <button
            key={tab}
            className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors cursor-pointer relative ${
              activeTab === tab
                ? 'text-(--color-accent)'
                : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'following' ? `Following (${followingCount})` : `Followers (${followersCount})`}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-(--color-accent) rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Friend list (scrollable) */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-4 h-4 border-2 border-(--color-accent) border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-6 text-[11px] text-(--color-text-secondary)">
            {activeTab === 'following' ? 'Not following anyone yet' : 'No followers yet'}
          </div>
        ) : (
          friends.map(friend => (
            <button
              key={friend.id}
              className="w-full flex items-center gap-2 px-4 py-2 text-[12px] text-(--color-text-primary) hover:bg-(--color-hover) transition-colors cursor-pointer text-left"
              onClick={() => handleNavigateToProfile(friend.id)}
            >
              <div className="w-6 h-6 rounded-full bg-(--color-accent)/20 text-(--color-accent) flex items-center justify-center text-[10px] font-semibold shrink-0 leading-none">
                {(friend.nickname || 'U')[0].toUpperCase()}
              </div>
              <span className="truncate">@{friend.nickname}</span>
            </button>
          ))
        )}
      </div>

      {/* Add by nickname */}
      <div className="px-3 py-2 border-t border-(--color-border-light)">
        <div className="flex gap-2">
          <input
            type="text"
            value={addNickname}
            onChange={e => { setAddNickname(e.target.value); setAddStatus('idle'); }}
            onKeyDown={e => { if (e.key === 'Enter') handleAddByNickname(); }}
            placeholder="Add by nickname..."
            className="flex-1 min-w-0 px-2 py-1.5 text-[11px] bg-(--color-bg-secondary) border border-(--color-border) rounded-(--radius-sm) text-(--color-text-primary) placeholder:text-(--color-text-secondary) focus:outline-none focus:ring-1 focus:ring-(--color-accent)"
          />
          <button
            onClick={handleAddByNickname}
            disabled={!addNickname.trim() || addStatus === 'loading'}
            className="px-3 py-1.5 text-[11px] font-medium rounded-(--radius-sm) bg-(--color-accent) text-(--color-accent-text) hover:bg-(--color-accent-hover) disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {addStatus === 'loading' ? '...' : 'Add'}
          </button>
        </div>
        {addStatus === 'success' && (
          <div className="text-[10px] text-green-600 mt-1">Followed!</div>
        )}
        {addStatus === 'error' && (
          <div className="text-[10px] text-(--color-danger) mt-1">{addError}</div>
        )}
      </div>

      {/* Log out */}
      <div className="px-3 py-2 border-t border-(--color-border-light)">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-(--color-text-secondary) hover:text-(--color-danger) hover:bg-(--color-hover) rounded-(--radius-sm) transition-colors cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
}
