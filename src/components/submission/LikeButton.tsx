import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../hooks/auth/useAuth';
import { useLikes } from '../../hooks/social/useLikes';
import { LoginPromptModal } from '../social/LoginPromptModal';

interface LikeButtonProps {
  submissionId: string;
  submissionUserId: string;
  initialLikeCount: number;
}

export function LikeButton({ submissionId, submissionUserId, initialLikeCount }: LikeButtonProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isLiked, likeCount, loading, mutating, toggleLike } = useLikes({
    userId: user?.id,
    submissionId,
    initialLikeCount,
  });

  const isOwnSubmission = user?.id === submissionUserId;
  const isLoggedOut = !user;
  const isDisabled = isOwnSubmission || mutating || loading;

  const handleClick = async () => {
    if (isLoggedOut) {
      setShowLoginModal(true);
      return;
    }
    if (isDisabled) return;
    await toggleLike();
  };

  // Determine tooltip text
  let tooltipText = 'Like';
  if (!user) {
    tooltipText = 'Sign in to like';
  } else if (isOwnSubmission) {
    tooltipText = "You can't like your own work";
  } else if (isLiked) {
    tooltipText = 'Unlike';
  }

  // Format like count: show nothing for 0, "9999+" for >9999
  const displayCount = likeCount === 0 ? null : likeCount > 9999 ? '9999+' : likeCount;

  const showDisabledStyle = (isDisabled || isLoggedOut) && !mutating;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        title={tooltipText}
        aria-label={isLiked ? 'Unlike submission' : 'Like submission'}
        aria-pressed={isLiked}
        className={`
          inline-flex items-center gap-1.5 px-4 py-2 rounded-(--radius-pill) text-sm font-medium transition-all
          ${showDisabledStyle
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer'
          }
          ${isLiked
            ? 'text-(--color-danger)'
            : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
          }
          focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-1 focus:ring-offset-(--color-bg-primary)
        `}
        style={{
          background: isLiked ? 'transparent' : 'transparent',
          border: 'var(--border-width, 2px) solid var(--color-border-light)',
        }}
      >
        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
        <span>{isLiked ? 'Liked' : 'Like'}</span>
        {displayCount !== null && (
          <span>{displayCount}</span>
        )}
      </button>
      {showLoginModal && (
        <LoginPromptModal
          onClose={() => setShowLoginModal(false)}
          title="Sign In to Like"
          message="You need to be logged in to like submissions."
        />
      )}
    </>
  );
}
