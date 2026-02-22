import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface UseLikesOptions {
  userId: string | undefined;
  submissionId: string | undefined;
  initialLikeCount: number;
}

export function useLikes({ userId, submissionId, initialLikeCount }: UseLikesOptions) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);

  // Dedup: track what we've already checked
  const checkedForRef = useRef<string | null>(null);

  // Check like status on mount, deduped
  useEffect(() => {
    const key = userId && submissionId ? `${userId}:${submissionId}` : null;
    if (!key || checkedForRef.current === key) return;
    checkedForRef.current = key;

    (async () => {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId!)
        .eq('submission_id', submissionId!)
        .maybeSingle();

      setIsLiked(!!data);
      setLoading(false);
    })();
  }, [userId, submissionId]);

  // Handle no-user or no-submission case
  useEffect(() => {
    if (!submissionId || !userId) {
      setLoading(false);
    }
  }, [userId, submissionId]);

  // Sync initialLikeCount prop changes
  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

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
    toggleLike,
  };
}
