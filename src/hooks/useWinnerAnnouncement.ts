import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getYesterdayDate } from '../utils/dailyChallenge';
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

interface UseWinnerAnnouncementReturn {
  shouldShow: boolean;
  topThree: RankingEntry[];
  challengeDate: string;
  totalSubmissions: number;
  notEnoughSubmissions: boolean;
  loading: boolean;
  dismiss: () => Promise<void>;
  checkAnnouncement: () => Promise<void>;
}

const MIN_SUBMISSIONS = 5;

export function useWinnerAnnouncement(userId: string | undefined): UseWinnerAnnouncementReturn {
  const [shouldShow, setShouldShow] = useState(false);
  const [topThree, setTopThree] = useState<RankingEntry[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [notEnoughSubmissions, setNotEnoughSubmissions] = useState(false);
  const [loading, setLoading] = useState(true);

  const challengeDate = getYesterdayDate();

  const checkAnnouncement = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Check if user has already seen the announcement for yesterday
      const { data: status } = await supabase
        .from('user_voting_status')
        .select('seen_winner_announcement')
        .eq('user_id', userId)
        .eq('challenge_date', challengeDate)
        .maybeSingle();

      if (status?.seen_winner_announcement) {
        setShouldShow(false);
        setLoading(false);
        return;
      }

      // Check if there are enough submissions for yesterday
      const { count } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_date', challengeDate);

      const total = count ?? 0;
      setTotalSubmissions(total);

      if (total === 0) {
        // No submissions yesterday at all, don't show modal
        setShouldShow(false);
        setLoading(false);
        return;
      }

      if (total < MIN_SUBMISSIONS) {
        setNotEnoughSubmissions(true);
        setShouldShow(true);
        setLoading(false);
        return;
      }

      // Compute final ranks if not done
      await supabase.rpc('compute_final_ranks', { p_challenge_date: challengeDate });

      // Fetch top 3
      const { data: rankingsData, error: rankingsError } = await supabase
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
        .eq('challenge_date', challengeDate)
        .not('final_rank', 'is', null)
        .order('final_rank', { ascending: true })
        .limit(3);

      if (rankingsError) throw rankingsError;

      if (!rankingsData || rankingsData.length === 0) {
        // No rankings computed yet (no votes cast)
        setShouldShow(false);
        setLoading(false);
        return;
      }

      const entries: RankingEntry[] = (rankingsData as unknown as RankingRow[]).map((row) => ({
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
      setNotEnoughSubmissions(false);
      setShouldShow(true);
    } catch (error) {
      console.error('Error checking winner announcement:', error);
      setShouldShow(false);
    }

    setLoading(false);
  }, [userId, challengeDate]);

  const dismiss = useCallback(async () => {
    if (!userId) return;

    setShouldShow(false);

    try {
      // Upsert the voting status to mark announcement as seen
      await supabase.from('user_voting_status').upsert(
        {
          user_id: userId,
          challenge_date: challengeDate,
          seen_winner_announcement: true,
        },
        {
          onConflict: 'user_id,challenge_date',
        }
      );
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  }, [userId, challengeDate]);

  // Check on mount
  useEffect(() => {
    checkAnnouncement();
  }, [checkAnnouncement]);

  return {
    shouldShow,
    topThree,
    challengeDate,
    totalSubmissions,
    notEnoughSubmissions,
    loading,
    dismiss,
    checkAnnouncement,
  };
}
