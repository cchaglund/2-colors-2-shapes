import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { checkLikesExistBatch, insertLike, deleteLike } from '../../lib/api';

interface UseBatchLikedStatusReturn {
  /** Set of submission IDs the current user has liked */
  likedSet: Set<string>;
  /** Optimistic +1/-1 deltas per submission (key = submissionId) */
  countAdjustments: Map<string, number>;
  /** Toggle like for a submission. Handles optimistic update + API call + rollback. */
  toggleLiked: (submissionId: string) => Promise<void>;
  /** Whether the initial batch check is still loading */
  loading: boolean;
}

export function useBatchLikedStatus(
  userId: string | undefined,
  submissionIds: string[]
): UseBatchLikedStatusReturn {
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [countAdjustments, setCountAdjustments] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  // Track which IDs we've already fetched to avoid redundant calls (e.g. on loadMore)
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  const prevUserIdRef = useRef<string | undefined>(undefined);

  // Serialized IDs for dependency tracking
  const idsKey = useMemo(() => submissionIds.join(','), [submissionIds]);

  useEffect(() => {
    if (!userId) {
      setLikedSet(new Set());
      setCountAdjustments(new Map());
      fetchedIdsRef.current = new Set();
      setLoading(false);
      return;
    }

    // Reset if user changed
    if (prevUserIdRef.current !== userId) {
      fetchedIdsRef.current = new Set();
      setLikedSet(new Set());
      setCountAdjustments(new Map());
      prevUserIdRef.current = userId;
    }

    // Find IDs we haven't fetched yet
    const newIds = submissionIds.filter(id => !fetchedIdsRef.current.has(id));
    if (newIds.length === 0) return;

    setLoading(true);

    (async () => {
      try {
        const likedIds = await checkLikesExistBatch(userId, newIds);

        // Mark these IDs as fetched
        for (const id of newIds) fetchedIdsRef.current.add(id);

        setLikedSet(prev => {
          const next = new Set(prev);
          for (const id of likedIds) next.add(id);
          return next;
        });
      } catch (err) {
        console.error('Failed to batch check likes:', err);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, idsKey]);

  const toggleLiked = useCallback(async (submissionId: string) => {
    if (!userId) return;

    const wasLiked = likedSet.has(submissionId);

    // Optimistic update
    setLikedSet(prev => {
      const next = new Set(prev);
      if (wasLiked) next.delete(submissionId);
      else next.add(submissionId);
      return next;
    });
    setCountAdjustments(prev => {
      const next = new Map(prev);
      const current = next.get(submissionId) ?? 0;
      next.set(submissionId, current + (wasLiked ? -1 : 1));
      return next;
    });

    try {
      if (wasLiked) {
        await deleteLike(userId, submissionId);
      } else {
        await insertLike(userId, submissionId);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Rollback
      setLikedSet(prev => {
        const next = new Set(prev);
        if (wasLiked) next.add(submissionId);
        else next.delete(submissionId);
        return next;
      });
      setCountAdjustments(prev => {
        const next = new Map(prev);
        const current = next.get(submissionId) ?? 0;
        next.set(submissionId, current + (wasLiked ? 1 : -1));
        return next;
      });
    }
  }, [userId, likedSet]);

  return { likedSet, countAdjustments, toggleLiked, loading };
}
