import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { RankingEntry, Shape, ShapeGroup } from '../../types';

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
  getAdjacentRankingDates: (currentDate: string) => Promise<{ prev: string | null; next: string | null }>;
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
      // First try to compute final ranks if not already done
      // This may fail if user doesn't have permission, but that's ok - ranks may already be computed
      const rpcResult = await supabase.rpc('compute_final_ranks', { p_challenge_date: date });
      if (rpcResult.error) {
        // RPC may fail if user doesn't have permission or ranks already computed — expected
      }

      // Fetch rankings with submissions (no profiles join - will fetch separately)
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
            groups,
            background_color_index
          )
        `
        )
        .eq('challenge_date', date)
        .not('final_rank', 'is', null)
        .order('final_rank', { ascending: true })
        .limit(3);

      if (error) throw error;

      if (!data || data.length === 0) {
        setTopThree([]);
        setLoading(false);
        return;
      }

      // Fetch nicknames for all users separately
      const userIds = [...new Set(data.map((r: { user_id: string }) => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds);

      const profileMap = new Map<string, string>();
      if (profilesData) {
        profilesData.forEach((p: { id: string; nickname: string }) => {
          profileMap.set(p.id, p.nickname);
        });
      }

      interface RankingRowWithoutProfile {
        final_rank: number;
        submission_id: string;
        user_id: string;
        elo_score: number;
        vote_count: number;
        submissions: {
          shapes: Shape[];
          groups: ShapeGroup[] | null;
          background_color_index: number | null;
        };
      }

      const entries: RankingEntry[] = (data as unknown as RankingRowWithoutProfile[]).map((row) => ({
        rank: row.final_rank,
        submission_id: row.submission_id,
        user_id: row.user_id,
        nickname: profileMap.get(row.user_id) || 'Anonymous',
        elo_score: row.elo_score,
        vote_count: row.vote_count,
        shapes: row.submissions?.shapes || [],
        groups: row.submissions?.groups || [],
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

      // Fetch rankings with submissions (no profiles join - will fetch separately)
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
            groups,
            background_color_index
          )
        `
        )
        .eq('challenge_date', date)
        .not('final_rank', 'is', null)
        .order('final_rank', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        setRankings([]);
        setLoading(false);
        return;
      }

      // Fetch nicknames for all users separately
      const userIds = [...new Set(data.map((r: { user_id: string }) => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds);

      const profileMap = new Map<string, string>();
      if (profilesData) {
        profilesData.forEach((p: { id: string; nickname: string }) => {
          profileMap.set(p.id, p.nickname);
        });
      }

      interface RankingRowWithoutProfile {
        final_rank: number;
        submission_id: string;
        user_id: string;
        elo_score: number;
        vote_count: number;
        submissions: {
          shapes: Shape[];
          groups: ShapeGroup[] | null;
          background_color_index: number | null;
        };
      }

      const entries: RankingEntry[] = (data as unknown as RankingRowWithoutProfile[]).map((row) => ({
        rank: row.final_rank,
        submission_id: row.submission_id,
        user_id: row.user_id,
        nickname: profileMap.get(row.user_id) || 'Anonymous',
        elo_score: row.elo_score,
        vote_count: row.vote_count,
        shapes: row.submissions?.shapes || [],
        groups: row.submissions?.groups || [],
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
        .maybeSingle();

      if (error) throw error;

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
          .maybeSingle();

        if (rankingError) throw rankingError;

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

  // Get adjacent dates with rankings (for navigation)
  const getAdjacentRankingDates = useCallback(
    async (
      currentDate: string
    ): Promise<{ prev: string | null; next: string | null }> => {
      try {
        // Get the previous date with rankings (closest date before currentDate)
        const { data: prevData } = await supabase
          .from('daily_rankings')
          .select('challenge_date')
          .lt('challenge_date', currentDate)
          .not('final_rank', 'is', null)
          .order('challenge_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get the next date with rankings (closest date after currentDate)
        const { data: nextData } = await supabase
          .from('daily_rankings')
          .select('challenge_date')
          .gt('challenge_date', currentDate)
          .not('final_rank', 'is', null)
          .order('challenge_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        return {
          prev: prevData?.challenge_date ?? null,
          next: nextData?.challenge_date ?? null,
        };
      } catch (error) {
        console.error('Error fetching adjacent ranking dates:', error);
        return { prev: null, next: null };
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
    getAdjacentRankingDates,
  };
}
