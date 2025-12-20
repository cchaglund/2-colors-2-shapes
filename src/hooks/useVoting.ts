import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { VotingPair, Shape } from '../types';

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
  hasEnteredRanking: boolean;
  noMorePairs: boolean;
  notEnoughSubmissions: boolean;
  submissionCount: number;
  vote: (winnerId: string) => Promise<void>;
  skip: () => Promise<void>;
  fetchNextPair: () => Promise<void>;
  initializeVoting: () => Promise<void>;
}

const MIN_SUBMISSIONS = 5;

export function useVoting(userId: string | undefined, challengeDate: string): UseVotingReturn {
  const [currentPair, setCurrentPair] = useState<VotingPair | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [hasEnteredRanking, setHasEnteredRanking] = useState(false);
  const [noMorePairs, setNoMorePairs] = useState(false);
  const [notEnoughSubmissions, setNotEnoughSubmissions] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  // Initialize daily rankings for the challenge date if needed
  const initializeVoting = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    try {
      // Check how many submissions exist for this date
      const { count, error: countError } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_date', challengeDate);

      if (countError) throw countError;

      const totalSubmissions = count ?? 0;
      setSubmissionCount(totalSubmissions);

      if (totalSubmissions < MIN_SUBMISSIONS) {
        setNotEnoughSubmissions(true);
        setLoading(false);
        return;
      }

      // Initialize daily rankings if not already done
      const { error: initError } = await supabase.rpc('initialize_daily_rankings', {
        p_challenge_date: challengeDate,
      });

      if (initError) {
        console.error('Error initializing rankings:', initError);
      }

      // Load user's voting status
      const { data: status } = await supabase
        .from('user_voting_status')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', challengeDate)
        .single();

      if (status) {
        setVoteCount(status.vote_count);
        setHasEnteredRanking(status.entered_ranking);
      }
    } catch (error) {
      console.error('Error initializing voting:', error);
    }

    setLoading(false);
  }, [userId, challengeDate]);

  // Fetch the next pair to vote on
  const fetchNextPair = useCallback(async () => {
    if (!userId || notEnoughSubmissions) return;

    setLoading(true);

    try {
      // Call the database function to get next pair
      const { data: pairData, error: pairError } = await supabase.rpc('get_next_pair', {
        p_voter_id: userId,
        p_challenge_date: challengeDate,
      });

      if (pairError) throw pairError;

      if (!pairData || pairData.length === 0) {
        setNoMorePairs(true);
        setCurrentPair(null);
        setLoading(false);
        return;
      }

      const pair = pairData[0];

      // Fetch the actual submissions
      const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select('id, user_id, shapes, background_color_index')
        .in('id', [pair.submission_a_id, pair.submission_b_id]);

      if (subError) throw subError;

      if (!submissions || submissions.length < 2) {
        setNoMorePairs(true);
        setCurrentPair(null);
        setLoading(false);
        return;
      }

      const subA = submissions.find((s: SubmissionRow) => s.id === pair.submission_a_id);
      const subB = submissions.find((s: SubmissionRow) => s.id === pair.submission_b_id);

      if (!subA || !subB) {
        setNoMorePairs(true);
        setCurrentPair(null);
        setLoading(false);
        return;
      }

      setCurrentPair({
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
      });
      setNoMorePairs(false);
    } catch (error) {
      console.error('Error fetching next pair:', error);
    }

    setLoading(false);
  }, [userId, challengeDate, notEnoughSubmissions]);

  // Submit a vote
  const vote = useCallback(
    async (winnerId: string) => {
      if (!userId || !currentPair) return;

      setSubmitting(true);

      try {
        const response = await supabase.functions.invoke('process-vote', {
          body: {
            submissionAId: currentPair.submissionA.id,
            submissionBId: currentPair.submissionB.id,
            winnerId,
            challengeDate,
          },
        });

        if (response.error) throw response.error;

        const result = response.data;
        setVoteCount(result.voteCount);
        setHasEnteredRanking(result.enteredRanking);

        // Fetch next pair
        await fetchNextPair();
      } catch (error) {
        console.error('Error submitting vote:', error);
      }

      setSubmitting(false);
    },
    [userId, currentPair, challengeDate, fetchNextPair]
  );

  // Skip the current pair (doesn't count toward 5 votes)
  const skip = useCallback(async () => {
    if (!userId || !currentPair) return;

    setSubmitting(true);

    try {
      const response = await supabase.functions.invoke('process-vote', {
        body: {
          submissionAId: currentPair.submissionA.id,
          submissionBId: currentPair.submissionB.id,
          winnerId: null, // null = skip
          challengeDate,
        },
      });

      if (response.error) throw response.error;

      // Skips don't increment vote count, but we still move to next pair
      await fetchNextPair();
    } catch (error) {
      console.error('Error skipping pair:', error);
    }

    setSubmitting(false);
  }, [userId, currentPair, challengeDate, fetchNextPair]);

  return {
    currentPair,
    loading,
    submitting,
    voteCount,
    hasEnteredRanking,
    noMorePairs,
    notEnoughSubmissions,
    submissionCount,
    vote,
    skip,
    fetchNextPair,
    initializeVoting,
  };
}
