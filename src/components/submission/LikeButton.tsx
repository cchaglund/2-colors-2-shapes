import { useState } from 'react';
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
          inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors
          ${showDisabledStyle
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer'
          }
          ${isLiked
            ? 'bg-(--color-danger)/10 text-(--color-danger) hover:bg-(--color-danger)/20'
            : 'bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)'
          }
          focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-1 focus:ring-offset-(--color-bg-primary)
        `}
      >
        {/* Heart icon - filled when liked, outlined when not */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
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
