import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getTwoDaysAgoDateUTC } from '../utils/dailyChallenge';
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
}

interface ProfileRow {
  id: string;
  nickname: string;
}

interface UseWinnerAnnouncementReturn {
  shouldShow: boolean;
  topThree: RankingEntry[];
  challengeDate: string;
  loading: boolean;
  userPlacement: RankingEntry | null;
  dismiss: () => Promise<void>;
  persistSeen: () => Promise<void>;
  checkAnnouncement: () => Promise<void>;
}

export function useWinnerAnnouncement(userId: string | undefined): UseWinnerAnnouncementReturn {
  const [shouldShow, setShouldShow] = useState(false);
  const [topThree, setTopThree] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const challengeDate = getTwoDaysAgoDateUTC();

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

      if (total < 2) {
        // Need at least 2 submissions to have a ranking
        setShouldShow(false);
        setLoading(false);
        return;
      }

      // Compute final ranks if not done
      await supabase.rpc('compute_final_ranks', { p_challenge_date: challengeDate });

      // Fetch top 3 rankings with submission data
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

      // Fetch profiles for the users in the rankings
      const userIds = (rankingsData as unknown as RankingRow[]).map((r) => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds);

      const profileMap = new Map<string, string>();
      if (profilesData) {
        (profilesData as ProfileRow[]).forEach((p) => {
          profileMap.set(p.id, p.nickname);
        });
      }

      const entries: RankingEntry[] = (rankingsData as unknown as RankingRow[]).map((row) => ({
        rank: row.final_rank,
        submission_id: row.submission_id,
        user_id: row.user_id,
        nickname: profileMap.get(row.user_id) || 'Anonymous',
        elo_score: row.elo_score,
        vote_count: row.vote_count,
        shapes: row.submissions?.shapes || [],
        background_color_index: row.submissions?.background_color_index ?? null,
      }));

      setTopThree(entries);
      setShouldShow(true);
    } catch (error) {
      console.error('Error checking winner announcement:', error);
      setShouldShow(false);
    }

    setLoading(false);
  }, [userId, challengeDate]);

  const userPlacement = useMemo(() => {
    if (!userId) return null;
    return topThree.find((entry) => entry.user_id === userId) ?? null;
  }, [userId, topThree]);

  const persistSeen = useCallback(async () => {
    if (!userId) return;

    try {
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
      console.error('Error persisting seen status:', error);
    }
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
    loading,
    userPlacement,
    dismiss,
    persistSeen,
    checkAnnouncement,
  };
}
