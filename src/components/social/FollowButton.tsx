import { useState } from 'react';
import { useFollows } from '../../hooks/social/useFollows';
import { useAuth } from '../../hooks/auth/useAuth';

interface FollowButtonProps {
  targetUserId: string;
  size?: 'sm' | 'md';
}

export function FollowButton({ targetUserId, size = 'md' }: FollowButtonProps) {
  const { user } = useAuth();
  const { isFollowing, follow, unfollow, actionLoading } = useFollows();
  const [isHovered, setIsHovered] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  const following = isFollowing(targetUserId);
  const loading = actionLoading || localLoading;

  // Don't show button for own profile
  if (user && user.id === targetUserId) {
    return null;
  }

  const handleClick = async () => {
    if (!user || loading) return;

    setLocalLoading(true);
    try {
      if (following) {
        await unfollow(targetUserId);
      } else {
        await follow(targetUserId);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1 text-(--text-xs)'
    : 'px-3 py-1.5 text-(--text-sm)';

  const pillStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-pill)',
  };

  // Not logged in: disabled state
  if (!user) {
    return (
      <button
        disabled
        title="Sign in to follow"
        className={`${sizeClasses} font-semibold cursor-not-allowed bg-(--color-bg-tertiary) text-(--color-text-tertiary) opacity-60`}
        style={{ ...pillStyle, border: 'var(--border-width, 2px) solid var(--color-border-light)' }}
      >
        Follow
      </button>
    );
  }

  // Loading state
  if (loading) {
    return (
      <button
        disabled
        className={`${sizeClasses} font-semibold cursor-not-allowed bg-(--color-bg-tertiary) text-(--color-text-secondary) flex items-center gap-1`}
        style={{ ...pillStyle, border: 'var(--border-width, 2px) solid var(--color-border-light)' }}
      >
        <svg
          className="animate-spin h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {following ? 'Following' : 'Follow'}
      </button>
    );
  }

  // Following state: show "Following", on hover show "Unfollow" with red styling
  if (following) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${sizeClasses} font-semibold cursor-pointer transition-colors ${
          isHovered
            ? 'bg-(--color-danger)/10 text-(--color-danger)'
            : 'bg-(--color-bg-tertiary) text-(--color-text-secondary)'
        }`}
        style={{
          ...pillStyle,
          border: isHovered
            ? 'var(--border-width, 2px) solid var(--color-danger)'
            : 'var(--border-width, 2px) solid var(--color-border-light)',
        }}
      >
        {isHovered ? 'Unfollow' : 'Following'}
      </button>
    );
  }

  // Not following: show "Follow" button with accent color
  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses} font-semibold cursor-pointer transition-colors bg-(--color-accent) hover:bg-(--color-accent-hover) text-(--color-accent-text)`}
      style={{ ...pillStyle, border: 'var(--border-width, 2px) solid var(--color-border)' }}
    >
      Follow
    </button>
  );
}
