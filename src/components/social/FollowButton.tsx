import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
    ? 'px-2.5 py-1 text-xs'
    : 'px-3 py-1.5 text-sm';

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
        <Loader2 size={12} className="animate-spin" />
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
