import { FollowButton } from '../social/FollowButton';

interface FriendRowProps {
  userId: string;
  nickname: string;
  onNavigateToProfile?: (userId: string) => void;
}

export function FriendRow({ userId, nickname, onNavigateToProfile }: FriendRowProps) {
  const handleNicknameClick = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile(userId);
    } else {
      window.location.href = `?view=profile&user=${userId}`;
    }
  };

  return (
    <div data-testid="friend-row" className="flex items-center justify-between py-2 px-1">
      <button
        onClick={handleNicknameClick}
        className="text-[13px] text-(--color-text-primary) hover:text-(--color-accent) transition-colors cursor-pointer truncate max-w-50"
      >
        @{nickname}
      </button>
      <FollowButton targetUserId={userId} size="sm" />
    </div>
  );
}
