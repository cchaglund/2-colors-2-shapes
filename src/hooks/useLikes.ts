import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseLikesOptions {
  userId: string | undefined;
  submissionId: string | undefined;
}

export function useLikes({ userId, submissionId }: UseLikesOptions) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  // Check if user has liked this submission
  const checkLikeStatus = useCallback(async () => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // If no user, just mark as not liked
    if (!userId) {
      setIsLiked(false);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('submission_id', submissionId)
      .maybeSingle();

    setIsLiked(!!data);
    setLoading(false);
  }, [userId, submissionId]);

  // Initialize like count from submission data
  const initializeLikeCount = useCallback((count: number) => {
    setLikeCount(count);
  }, []);

  // Toggle like status
  const toggleLike = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !submissionId) {
      return { success: false, error: 'Not authenticated' };
    }

    setMutating(true);

    // Optimistic update
    const wasLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!wasLiked);
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1);

    try {
      if (wasLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('submission_id', submissionId);

        if (error) {
          // Rollback
          setIsLiked(wasLiked);
          setLikeCount(prevCount);
          setMutating(false);
          return { success: false, error: error.message };
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, submission_id: submissionId });

        if (error) {
          // Rollback
          setIsLiked(wasLiked);
          setLikeCount(prevCount);
          setMutating(false);

          // Check for foreign key violation (submission deleted)
          if (error.code === '23503') {
            return { success: false, error: 'Submission no longer exists' };
          }
          return { success: false, error: error.message };
        }
      }

      setMutating(false);
      return { success: true };
    } catch {
      // Rollback
      setIsLiked(wasLiked);
      setLikeCount(prevCount);
      setMutating(false);
      return { success: false, error: 'Network error' };
    }
  }, [userId, submissionId, isLiked, likeCount]);

  return {
    isLiked,
    likeCount,
    loading,
    mutating,
    checkLikeStatus,
    initializeLikeCount,
    toggleLike,
  };
}
