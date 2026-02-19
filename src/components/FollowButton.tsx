import { useState } from 'react';
import { useFollows } from '../hooks/social/useFollows';
import { useAuth } from '../hooks/auth/useAuth';

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
    ? 'px-2 py-1 text-[11px]'
    : 'px-3 py-1.5 text-[13px]';

  // Not logged in: disabled state
  if (!user) {
    return (
      <button
        disabled
        title="Sign in to follow"
        className={`${sizeClasses} font-medium rounded-md cursor-not-allowed bg-(--color-bg-tertiary) text-(--color-text-tertiary) opacity-60`}
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
        className={`${sizeClasses} font-medium rounded-md cursor-not-allowed bg-(--color-bg-tertiary) text-(--color-text-secondary) flex items-center gap-1`}
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
        className={`${sizeClasses} font-medium rounded-md cursor-pointer transition-colors ${
          isHovered
            ? 'bg-red-500/10 text-red-500 border border-red-500/30'
            : 'bg-(--color-bg-tertiary) text-(--color-text-secondary) border border-(--color-border)'
        }`}
      >
        {isHovered ? 'Unfollow' : 'Following'}
      </button>
    );
  }

  // Not following: show "Follow" button with accent color
  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses} font-medium rounded-md cursor-pointer transition-colors bg-(--color-accent) hover:bg-(--color-accent-hover) text-white`}
    >
      Follow
    </button>
  );
}
