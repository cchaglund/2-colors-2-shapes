export type FriendsTab = 'following' | 'followers';

interface FriendsModalTabsProps {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
  followingCount: number;
  followersCount: number;
  loading?: boolean;
}

export function FriendsModalTabs({
  activeTab,
  onTabChange,
  followingCount,
  followersCount,
  loading = false,
}: FriendsModalTabsProps) {
  return (
    <div className="flex border-b border-(--color-border)">
      <button
        onClick={() => onTabChange('following')}
        className={`flex-1 px-4 py-3 text-(--text-sm) font-medium transition-colors cursor-pointer ${
          activeTab === 'following'
            ? 'text-(--color-accent) border-b-2 border-(--color-accent)'
            : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
        }`}
      >
        Following {!loading && `(${followingCount})`}
      </button>
      <button
        onClick={() => onTabChange('followers')}
        className={`flex-1 px-4 py-3 text-(--text-sm) font-medium transition-colors cursor-pointer ${
          activeTab === 'followers'
            ? 'text-(--color-accent) border-b-2 border-(--color-accent)'
            : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
        }`}
      >
        Followers {!loading && `(${followersCount})`}
      </button>
    </div>
  );
}
