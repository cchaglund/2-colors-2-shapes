import { useState, useCallback, useRef } from 'react';
import {
  countSubmissions,
  countOtherSubmissions,
  initializeDailyRankings,
  fetchVotingStatus,
  fetchNextVotingPair,
  fetchSubmissionPair,
  processVote,
} from '../../lib/api';
import { calculateRequiredVotes } from '../../utils/votingRules';
import type { VotingPair, Shape } from '../../types';

interface SubmissionRow {
  id: string;
  user_id: string;
  shapes: Shape[];
  background_color_index: number | null;
}

interface UseVotingReturn {
  currentPair: VotingPair | null;
  loading: boolean;
  submitting: boolean;
  voteCount: number;
  requiredVotes: number;
  hasEnteredRanking: boolean;
  noMorePairs: boolean;
  noSubmissions: boolean; // 0 submissions - bootstrap case
  submissionCount: number;
  vote: (winnerId: string) => Promise<void>;
  skip: () => Promise<void>;
  fetchNextPair: () => Promise<void>;
  initializeVoting: () => Promise<void>;
}

/** Resolve a pair of submission IDs into a full VotingPair, or null */
async function resolvePair(
  userId: string,
  challengeDate: string,
): Promise<{ pair: VotingPair; noMore: false } | { pair: null; noMore: true }> {
  const pairData = await fetchNextVotingPair(userId, challengeDate);

  if (!pairData || pairData.length === 0) {
    return { pair: null, noMore: true };
  }

  const raw = pairData[0];
  const submissions = await fetchSubmissionPair(raw.submission_a_id, raw.submission_b_id);

  if (!submissions || submissions.length < 2) {
    return { pair: null, noMore: true };
  }

  const subA = submissions.find((s) => s.id === raw.submission_a_id) as SubmissionRow | undefined;
  const subB = submissions.find((s) => s.id === raw.submission_b_id) as SubmissionRow | undefined;

  if (!subA || !subB) {
    return { pair: null, noMore: true };
  }

  return {
    noMore: false,
    pair: {
      submissionA: {
        id: subA.id,
        user_id: subA.user_id,
        shapes: subA.shapes as Shape[],
        background_color_index: subA.background_color_index,
      },
      submissionB: {
        id: subB.id,
        user_id: subB.user_id,
        shapes: subB.shapes as Shape[],
        background_color_index: subB.background_color_index,
      },
    },
  };
}

function pairIds(pair: VotingPair): string {
  return [pair.submissionA.id, pair.submissionB.id].sort().join(',');
}

export function useVoting(userId: string | undefined, challengeDate: string): UseVotingReturn {
  const [currentPair, setCurrentPair] = useState<VotingPair | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [requiredVotes, setRequiredVotes] = useState(5);
  const [hasEnteredRanking, setHasEnteredRanking] = useState(false);
  const [noMorePairs, setNoMorePairs] = useState(false);
  const [noSubmissions, setNoSubmissions] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  // Prefetch buffer: holds the next pair fetched in the background
  const prefetchedRef = useRef<{ pair: VotingPair | null; noMore: boolean } | null>(null);
  const prefetchingRef = useRef<Promise<void> | null>(null);
  // Track current pair IDs to avoid prefetch returning the same pair
  const currentPairIdsRef = useRef<string | null>(null);

  /** Kick off a background prefetch of the next pair (non-blocking). */
  const startPrefetch = useCallback(() => {
    if (!userId || noSubmissions || submissionCount < 2) return;
    // Don't start another prefetch if one is already in progress
    if (prefetchingRef.current) return;

    prefetchedRef.current = null;
    prefetchingRef.current = resolvePair(userId, challengeDate)
      .then((result) => {
        // Discard if the prefetched pair is the same as what's currently displayed
        if (
          result.pair &&
          currentPairIdsRef.current &&
          pairIds(result.pair) === currentPairIdsRef.current
        ) {
          prefetchedRef.current = null;
        } else {
          prefetchedRef.current = result;
        }
      })
      .catch(() => {
        prefetchedRef.current = null;
      })
      .finally(() => {
        prefetchingRef.current = null;
      });
  }, [userId, challengeDate, noSubmissions, submissionCount]);

  // Initialize daily rankings for the challenge date if needed
  const initializeVoting = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const totalSubmissions = await countSubmissions(challengeDate);
      setSubmissionCount(totalSubmissions);

      if (totalSubmissions === 0) {
        setNoSubmissions(true);
        setRequiredVotes(0);
        setLoading(false);
        return;
      }

      const otherSubmissions = await countOtherSubmissions(challengeDate, userId);

      if (otherSubmissions < 2) {
        setNoSubmissions(true);
        setRequiredVotes(0);
        setLoading(false);
        return;
      }

      const required = calculateRequiredVotes(otherSubmissions);
      setRequiredVotes(required);

      if (totalSubmissions >= 2) {
        await initializeDailyRankings(challengeDate);
      }

      const status = await fetchVotingStatus(userId, challengeDate);

      if (status) {
        setVoteCount(status.vote_count);
        setHasEnteredRanking(status.entered_ranking || status.vote_count >= required);
      }
    } catch (error) {
      console.error('Error initializing voting:', error);
    }

    setLoading(false);
  }, [userId, challengeDate]);

  // Fetch the next pair to vote on (used for initial load and fallback)
  const fetchNextPair = useCallback(async () => {
    if (!userId || noSubmissions || submissionCount < 2) return;

    setLoading(true);

    try {
      const result = await resolvePair(userId, challengeDate);

      if (result.noMore) {
        setNoMorePairs(true);
        setCurrentPair(null);
      } else {
        setCurrentPair(result.pair);
        currentPairIdsRef.current = pairIds(result.pair);
        setNoMorePairs(false);
        // Start prefetching the next pair while user views this one
        startPrefetch();
      }
    } catch (error) {
      console.error('Error fetching next pair:', error);
    }

    setLoading(false);
  }, [userId, challengeDate, noSubmissions, submissionCount, startPrefetch]);

  /** Apply a prefetched pair or fall back to fetching one. Starts next prefetch. */
  const advanceToNextPair = useCallback(async () => {
    // Wait for any in-progress prefetch to finish
    if (prefetchingRef.current) {
      await prefetchingRef.current;
    }

    const cached = prefetchedRef.current;
    prefetchedRef.current = null;

    if (cached) {
      if (cached.noMore) {
        setNoMorePairs(true);
        setCurrentPair(null);
      } else if (cached.pair) {
        setCurrentPair(cached.pair);
        currentPairIdsRef.current = pairIds(cached.pair);
        setNoMorePairs(false);
        // Prefetch the one after this
        startPrefetch();
      }
    } else {
      // No cached pair available — fetch synchronously
      await fetchNextPair();
      // After fetchNextPair sets the new pair, kick off prefetch for the one after
      startPrefetch();
    }
  }, [fetchNextPair, startPrefetch]);

  // Submit a vote — optimistic: show next pair immediately, process vote in background
  const vote = useCallback(
    async (winnerId: string) => {
      if (!userId || !currentPair) return;

      setSubmitting(true);

      // Capture current pair for the background vote
      const votedPair = currentPair;

      // Optimistically update vote count
      const optimisticCount = voteCount + 1;
      setVoteCount(optimisticCount);
      const effectiveRequired = requiredVotes;
      if (optimisticCount >= effectiveRequired) {
        setHasEnteredRanking(true);
      }

      // Show the next pair immediately (don't wait for processVote)
      await advanceToNextPair();
      setSubmitting(false);

      // Process the vote in the background
      processVote(votedPair.submissionA.id, votedPair.submissionB.id, winnerId)
        .then((result) => {
          // Reconcile with server truth
          setVoteCount(result.voteCount);
          if (result.requiredVotes !== undefined) setRequiredVotes(result.requiredVotes);
          const serverRequired = result.requiredVotes ?? effectiveRequired;
          setHasEnteredRanking(result.enteredRanking || result.voteCount >= serverRequired);

          // Now that the vote is recorded, we can start a fresh prefetch
          // (the server will correctly exclude this voted pair)
          startPrefetch();
        })
        .catch((error) => {
          console.error('Error submitting vote:', error);
        });
    },
    [userId, currentPair, voteCount, requiredVotes, advanceToNextPair, startPrefetch]
  );

  // Skip the current pair (doesn't count toward vote requirement)
  const skip = useCallback(async () => {
    if (!userId || !currentPair) return;

    setSubmitting(true);

    // Capture current pair for the background skip
    const skippedPair = currentPair;

    // Show the next pair immediately
    await advanceToNextPair();
    setSubmitting(false);

    // Record the skip in the background
    processVote(skippedPair.submissionA.id, skippedPair.submissionB.id, null)
      .then(() => {
        startPrefetch();
      })
      .catch((error) => {
        console.error('Error skipping pair:', error);
      });
  }, [userId, currentPair, advanceToNextPair, startPrefetch]);

  return {
    currentPair,
    loading,
    submitting,
    voteCount,
    requiredVotes,
    hasEnteredRanking,
    noMorePairs,
    noSubmissions,
    submissionCount,
    vote,
    skip,
    fetchNextPair,
    initializeVoting,
  };
}
