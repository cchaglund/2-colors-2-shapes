import { useState, useCallback, useEffect, useRef } from 'react';
import { checkLikeExists, insertLike, deleteLike } from '../../lib/api';

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
      const exists = await checkLikeExists(userId!, submissionId!);
      setIsLiked(exists);
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
        await deleteLike(userId, submissionId);
      } else {
        await insertLike(userId, submissionId);
      }

      setMutating(false);
      return { success: true };
    } catch (err: unknown) {
      setIsLiked(wasLiked);
      setLikeCount(prevCount);
      setMutating(false);

      if (err && typeof err === 'object' && 'code' in err && err.code === '23503') {
        return { success: false, error: 'Submission no longer exists' };
      }

      const message = err instanceof Error ? err.message
        : (err && typeof err === 'object' && 'message' in err) ? String((err as { message: unknown }).message)
        : 'Network error';
      return { success: false, error: message };
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
