import { FriendRow } from './FriendRow';
import type { FollowUser } from '../../contexts/FollowsContext';

export type FriendsListType = 'following' | 'followers';

interface FriendsListProps {
  users: FollowUser[];
  listType: FriendsListType;
  loading?: boolean;
  onNavigateToProfile?: (userId: string) => void;
}

const emptyStateMessages: Record<FriendsListType, string> = {
  following: "You're not following anyone yet. Search for artists above.",
  followers: "No followers yet. Create art and others will find you!",
};

export function FriendsList({
  users,
  listType,
  loading = false,
  onNavigateToProfile,
}: FriendsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-(--color-accent) border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-[13px] text-(--color-text-secondary)">
        {emptyStateMessages[listType]}
      </div>
    );
  }

  return (
    <div className="divide-y divide-(--color-border)">
      {users.map((user) => (
        <FriendRow
          key={user.id}
          userId={user.id}
          nickname={user.nickname}
          onNavigateToProfile={onNavigateToProfile}
        />
      ))}
    </div>
  );
}
