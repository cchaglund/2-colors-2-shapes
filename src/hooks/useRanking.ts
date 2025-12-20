import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RankingEntry, Shape } from '../types';

interface RankingRow {
  final_rank: number;
  submission_id: string;
  user_id: string;
  elo_score: number;
  vote_count: number;
  submissions: {
    shapes: Shape[];
    background_color_index: number | null;
  };
  profiles: {
    nickname: string;
  };
}

interface UseRankingReturn {
  topThree: RankingEntry[];
  rankings: RankingEntry[];
  totalSubmissions: number;
  userRank: number | null;
  loading: boolean;
  fetchTopThree: (date: string) => Promise<void>;
  fetchRankings: (date: string) => Promise<void>;
  fetchUserRank: (date: string, userId: string) => Promise<number | null>;
  fetchSubmissionRank: (submissionId: string) => Promise<{ rank: number; total: number } | null>;
}

export function useRanking(): UseRankingReturn {
  const [topThree, setTopThree] = useState<RankingEntry[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch top 3 for winner announcement
  const fetchTopThree = useCallback(async (date: string) => {
    setLoading(true);

    try {
      // First compute final ranks if not already done
      await supabase.rpc('compute_final_ranks', { p_challenge_date: date });

      const { data, error } = await supabase
        .from('daily_rankings')
        .select(
          `
          final_rank,
          submission_id,
          user_id,
          elo_score,
          vote_count,
          submissions!inner (
            shapes,
            background_color_index
          ),
          profiles!inner (
            nickname
          )
        `
        )
        .eq('challenge_date', date)
        .not('final_rank', 'is', null)
        .order('final_rank', { ascending: true })
        .limit(3);

      if (error) throw error;

      const entries: RankingEntry[] = (data as unknown as RankingRow[]).map((row) => ({
        rank: row.final_rank,
        submission_id: row.submission_id,
        user_id: row.user_id,
        nickname: row.profiles?.nickname || 'Anonymous',
        elo_score: row.elo_score,
        vote_count: row.vote_count,
        shapes: row.submissions?.shapes || [],
        background_color_index: row.submissions?.background_color_index ?? null,
      }));

      setTopThree(entries);
    } catch (error) {
      console.error('Error fetching top three:', error);
    }

    setLoading(false);
  }, []);

  // Fetch full rankings for a date
  const fetchRankings = useCallback(async (date: string) => {
    setLoading(true);

    try {
      // Get total count
      const { count } = await supabase
        .from('daily_rankings')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_date', date);

      setTotalSubmissions(count ?? 0);

      // Fetch rankings with submissions and profiles
      const { data, error } = await supabase
        .from('daily_rankings')
        .select(
          `
          final_rank,
          submission_id,
          user_id,
          elo_score,
          vote_count,
          submissions!inner (
            shapes,
            background_color_index
          ),
          profiles!inner (
            nickname
          )
        `
        )
        .eq('challenge_date', date)
        .not('final_rank', 'is', null)
        .order('final_rank', { ascending: true })
        .limit(50);

      if (error) throw error;

      const entries: RankingEntry[] = (data as unknown as RankingRow[]).map((row) => ({
        rank: row.final_rank,
        submission_id: row.submission_id,
        user_id: row.user_id,
        nickname: row.profiles?.nickname || 'Anonymous',
        elo_score: row.elo_score,
        vote_count: row.vote_count,
        shapes: row.submissions?.shapes || [],
        background_color_index: row.submissions?.background_color_index ?? null,
      }));

      setRankings(entries);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    }

    setLoading(false);
  }, []);

  // Fetch a specific user's rank for a date
  const fetchUserRank = useCallback(async (date: string, userId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('daily_rankings')
        .select('final_rank')
        .eq('challenge_date', date)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No row found
        throw error;
      }

      const rank = data?.final_rank ?? null;
      setUserRank(rank);
      return rank;
    } catch (error) {
      console.error('Error fetching user rank:', error);
      return null;
    }
  }, []);

  // Fetch rank for a specific submission
  const fetchSubmissionRank = useCallback(
    async (submissionId: string): Promise<{ rank: number; total: number } | null> => {
      try {
        // Get the submission's ranking entry
        const { data: rankingData, error: rankingError } = await supabase
          .from('daily_rankings')
          .select('final_rank, challenge_date')
          .eq('submission_id', submissionId)
          .single();

        if (rankingError) {
          if (rankingError.code === 'PGRST116') return null;
          throw rankingError;
        }

        if (!rankingData?.final_rank) return null;

        // Get total for that date
        const { count } = await supabase
          .from('daily_rankings')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_date', rankingData.challenge_date);

        return {
          rank: rankingData.final_rank,
          total: count ?? 0,
        };
      } catch (error) {
        console.error('Error fetching submission rank:', error);
        return null;
      }
    },
    []
  );

  return {
    topThree,
    rankings,
    totalSubmissions,
    userRank,
    loading,
    fetchTopThree,
    fetchRankings,
    fetchUserRank,
    fetchSubmissionRank,
  };
}
