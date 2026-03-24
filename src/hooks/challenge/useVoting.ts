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

/** Resolve the next voting pair from the server into a full VotingPair, or null. */
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

  // Tracks the in-flight processVote call so we can ensure it completes
  // before prefetching (the server must record the vote first).
  const lastVotePromiseRef = useRef<Promise<void> | null>(null);
  // Prefetch buffer: holds the next pair fetched after the previous vote was recorded.
  const prefetchedRef = useRef<{ pair: VotingPair | null; noMore: boolean } | null>(null);
  const prefetchingRef = useRef<Promise<void> | null>(null);

  /**
   * Start prefetching the next pair in the background.
   * Only call this AFTER the previous vote has been recorded on the server,
   * so get_next_pair won't return the pair we just voted on.
   */
  const startPrefetch = useCallback(() => {
    if (!userId || noSubmissions || submissionCount < 2) return;
    if (prefetchingRef.current) return;

    prefetchedRef.current = null;
    prefetchingRef.current = resolvePair(userId, challengeDate)
      .then((result) => {
        prefetchedRef.current = result;
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

  // Fetch the next pair to vote on (used for initial load)
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
        setNoMorePairs(false);
      }
    } catch (error) {
      console.error('Error fetching next pair:', error);
    }

    setLoading(false);
  }, [userId, challengeDate, noSubmissions, submissionCount]);

  /**
   * Display the next pair: use the prefetch buffer if available, otherwise fetch.
   * Returns the processVote result from the server (for state reconciliation).
   */
  const showNextPair = useCallback(async () => {
    // Wait for any in-progress prefetch to complete
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
        setNoMorePairs(false);
      }
    } else {
      // No prefetched pair — fetch synchronously (first vote, or user was faster than prefetch)
      await fetchNextPair();
    }
  }, [fetchNextPair]);

  // Submit a vote
  const vote = useCallback(
    async (winnerId: string) => {
      if (!userId || !currentPair) return;

      setSubmitting(true);

      // Capture current pair for the vote call
      const votedPair = currentPair;

      // Optimistically update vote count and ranking status
      const optimisticCount = voteCount + 1;
      setVoteCount(optimisticCount);
      const effectiveRequired = requiredVotes;
      if (optimisticCount >= effectiveRequired) {
        setHasEnteredRanking(true);
      }

      // Ensure any prior background vote has completed before we proceed
      if (lastVotePromiseRef.current) {
        await lastVotePromiseRef.current;
      }

      // Fire processVote and fetchNextPair in parallel.
      // processVote records the vote; fetchNextPair gets the next pair.
      // get_next_pair might return the same pair since the vote isn't recorded yet,
      // but this is extremely unlikely with many submissions, and the UNIQUE constraint
      // on comparisons will catch duplicates safely.
      const votePromise = processVote(
        votedPair.submissionA.id,
        votedPair.submissionB.id,
        winnerId
      );

      // Show the next pair (from prefetch cache or fresh fetch) in parallel with processVote
      const [result] = await Promise.all([
        votePromise.catch((error) => {
          console.error('Error submitting vote:', error);
          return null;
        }),
        showNextPair(),
      ]);

      // Reconcile with server truth
      if (result) {
        setVoteCount(result.voteCount);
        if (result.requiredVotes !== undefined) setRequiredVotes(result.requiredVotes);
        const serverRequired = result.requiredVotes ?? effectiveRequired;
        setHasEnteredRanking(result.enteredRanking || result.voteCount >= serverRequired);
      }

      setSubmitting(false);

      // Now that the vote IS recorded on the server, prefetch the next pair safely
      startPrefetch();
    },
    [userId, currentPair, voteCount, requiredVotes, showNextPair, startPrefetch]
  );

  // Skip the current pair (doesn't count toward vote requirement)
  const skip = useCallback(async () => {
    if (!userId || !currentPair) return;

    setSubmitting(true);

    const skippedPair = currentPair;

    // Ensure any prior background vote has completed
    if (lastVotePromiseRef.current) {
      await lastVotePromiseRef.current;
    }

    // Record skip and fetch next pair in parallel
    await Promise.all([
      processVote(skippedPair.submissionA.id, skippedPair.submissionB.id, null)
        .catch((error) => {
          console.error('Error skipping pair:', error);
        }),
      showNextPair(),
    ]);

    setSubmitting(false);

    // Prefetch after skip is recorded
    startPrefetch();
  }, [userId, currentPair, showNextPair, startPrefetch]);

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
