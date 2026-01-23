/* eslint-disable react-refresh/only-export-components -- Context exported for useFollows hook */
import { createContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export interface FollowUser {
  id: string;
  nickname: string;
  followedAt: string;
}

export interface FollowsContextValue {
  // Data
  following: FollowUser[];
  followers: FollowUser[];
  followingIds: Set<string>;
  followingCount: number;
  followersCount: number;

  // Methods
  isFollowing: (userId: string) => boolean;
  follow: (userId: string) => Promise<{ success: boolean; error?: string }>;
  unfollow: (userId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;

  // State
  loading: boolean;
  actionLoading: boolean;
}

export const FollowsContext = createContext<FollowsContextValue | null>(null);

interface FollowsProviderProps {
  children: ReactNode;
}

export function FollowsProvider({ children }: FollowsProviderProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // O(1) lookup set for isFollowing checks
  const followingIds = useMemo(() => new Set(following.map(f => f.id)), [following]);

  const followingCount = following.length;
  const followersCount = followers.length;

  const isFollowing = useCallback((userId: string) => followingIds.has(userId), [followingIds]);

  // Fetch following and followers lists
  const fetchFollowData = useCallback(async () => {
    if (!user) {
      setFollowing([]);
      setFollowers([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch following (users I follow)
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      // Fetch followers (users who follow me)
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', user.id);

      if (followersError) throw followersError;

      // Get profile info for following
      const followingUserIds = followingData?.map(f => f.following_id) || [];
      const followersUserIds = followersData?.map(f => f.follower_id) || [];
      const allUserIds = [...new Set([...followingUserIds, ...followersUserIds])];

      let profilesMap: Record<string, string> = {};
      if (allUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nickname')
          .in('id', allUserIds);

        if (profilesError) throw profilesError;

        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.nickname || 'Anonymous';
          return acc;
        }, {} as Record<string, string>);
      }

      // Build following list
      const followingList: FollowUser[] = (followingData || []).map(f => ({
        id: f.following_id,
        nickname: profilesMap[f.following_id] || 'Anonymous',
        followedAt: f.created_at,
      }));

      // Build followers list
      const followersList: FollowUser[] = (followersData || []).map(f => ({
        id: f.follower_id,
        nickname: profilesMap[f.follower_id] || 'Anonymous',
        followedAt: f.created_at,
      }));

      setFollowing(followingList);
      setFollowers(followersList);
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchFollowData();
  }, [fetchFollowData]);

  // Follow a user with optimistic update
  const follow = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Must be logged in to follow users' };
    }

    if (userId === user.id) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    if (followingIds.has(userId)) {
      return { success: false, error: 'Already following this user' };
    }

    // Enforce 500-user follow limit
    if (followingIds.size >= 500) {
      return { success: false, error: 'You can follow a maximum of 500 users' };
    }

    setActionLoading(true);

    // Optimistic update: add to following list immediately
    const optimisticUser: FollowUser = {
      id: userId,
      nickname: 'Loading...', // Will be updated on refetch
      followedAt: new Date().toISOString(),
    };
    const previousFollowing = following;
    setFollowing(prev => [...prev, optimisticUser]);

    try {
      // Insert follow record
      const { error: insertError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (insertError) throw insertError;

      // Fetch the user's nickname to update the optimistic entry
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', userId)
        .single();

      // Update with real nickname
      setFollowing(prev =>
        prev.map(f => f.id === userId
          ? { ...f, nickname: profile?.nickname || 'Anonymous' }
          : f
        )
      );

      return { success: true };
    } catch (error) {
      // Rollback on error
      setFollowing(previousFollowing);
      console.error('Error following user:', error);
      return { success: false, error: 'Failed to follow user' };
    } finally {
      setActionLoading(false);
    }
  }, [user, followingIds, following]);

  // Unfollow a user with optimistic update
  const unfollow = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Must be logged in to unfollow users' };
    }

    if (!followingIds.has(userId)) {
      return { success: false, error: 'Not following this user' };
    }

    setActionLoading(true);

    // Optimistic update: remove from following list immediately
    const previousFollowing = following;
    setFollowing(prev => prev.filter(f => f.id !== userId));

    try {
      // Delete follow record
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (error) {
      // Rollback on error
      setFollowing(previousFollowing);
      console.error('Error unfollowing user:', error);
      return { success: false, error: 'Failed to unfollow user' };
    } finally {
      setActionLoading(false);
    }
  }, [user, followingIds, following]);

  const value: FollowsContextValue = {
    following,
    followers,
    followingIds,
    followingCount,
    followersCount,
    isFollowing,
    follow,
    unfollow,
    refetch: fetchFollowData,
    loading,
    actionLoading,
  };

  return (
    <FollowsContext.Provider value={value}>
      {children}
    </FollowsContext.Provider>
  );
}
