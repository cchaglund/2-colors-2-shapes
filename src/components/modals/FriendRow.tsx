import { FollowButton } from '../FollowButton';

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
    <div className="flex items-center justify-between py-2 px-1">
      <button
        onClick={handleNicknameClick}
        className="text-[13px] text-(--color-text-primary) hover:text-(--color-accent) transition-colors cursor-pointer truncate max-w-[200px]"
      >
        @{nickname}
      </button>
      <FollowButton targetUserId={userId} size="sm" />
    </div>
  );
}
