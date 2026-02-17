import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubmissions, type Submission } from '../hooks/useSubmissions';
import { getTodayDateUTC, getTwoDaysAgoDateUTC } from '../utils/dailyChallenge';
import { fetchChallengesBatch } from '../hooks/useDailyChallenge';
import { supabase } from '../lib/supabase';
import type { Shape, DailyChallenge } from '../types';
import { formatDate, getDaysInMonth, getFirstDayOfMonth, MONTHS } from '../utils/calendarUtils';
import type { ViewMode, RankingInfo, WinnerEntry } from './Calendar/types';
import { CalendarViewToggle } from './Calendar/CalendarViewToggle';
import { ContentNavigation } from './Calendar/ContentNavigation';
import { CalendarGrid } from './Calendar/CalendarGrid';
import { CalendarDayCell } from './Calendar/CalendarDayCell';
import { CalendarStats } from './Calendar/CalendarStats';
import { WallTab } from './Calendar/tabs/WallTab';
import { FriendsFeedTab } from './Calendar/tabs/FriendsFeedTab';

interface GalleryPageProps {
  tab?: string;
}

export function GalleryPage({ tab: initialTab }: GalleryPageProps) {
  const { user } = useAuth();
  const { loadMySubmissions, loading } = useSubmissions(user?.id);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rankings, setRankings] = useState<Map<string, number>>(new Map());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [viewMode, setViewMode] = useState<ViewMode | null>(() => {
    if (initialTab && ['my-submissions', 'winners', 'wall', 'friends'].includes(initialTab)) {
      return initialTab as ViewMode;
    }
    return null;
  });
  const [winners, setWinners] = useState<WinnerEntry[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(false);
  const [challenges, setChallenges] = useState<Map<string, DailyChallenge>>(new Map());
  const [wallDate, setWallDate] = useState(() => getTodayDateUTC());
  const [friendsFeedDate, setFriendsFeedDate] = useState(() => getTodayDateUTC());

  // Determine effective view mode - null until auth loads, then based on user
  const effectiveViewMode: ViewMode = viewMode ?? (user ? 'my-submissions' : 'winners');

  const todayStr = useMemo(() => getTodayDateUTC(), []);
  const latestWinnersDate = useMemo(() => getTwoDaysAgoDateUTC(), []);

  // Keep URL in sync with active tab (so browser back always restores correct tab)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== effectiveViewMode) {
      url.searchParams.set('tab', effectiveViewMode);
      history.replaceState(null, '', url.toString());
    }
  }, [effectiveViewMode]);

  // Update URL when tab changes (without full page reload)
  const handleSetViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'gallery');
    url.searchParams.set('tab', mode);
    history.replaceState(null, '', url.toString());
  }, []);

  // Load submissions (only when in my-submissions mode)
  useEffect(() => {
    if (user && effectiveViewMode === 'my-submissions') {
      loadMySubmissions().then(({ data }) => {
        setSubmissions(data);
        if (data.length > 0) {
          const submissionIds = data.map((s) => s.id);
          supabase
            .from('daily_rankings')
            .select('submission_id, final_rank')
            .in('submission_id', submissionIds)
            .not('final_rank', 'is', null)
            .then(({ data: rankingData }) => {
              if (rankingData) {
                const rankMap = new Map<string, number>();
                (rankingData as RankingInfo[]).forEach((r) => {
                  if (r.final_rank !== null) {
                    rankMap.set(r.submission_id, r.final_rank);
                  }
                });
                setRankings(rankMap);
              }
            });
        }
      });
    }
  }, [user, effectiveViewMode, loadMySubmissions]);

  // Load winners for the current month when in winners mode
  useEffect(() => {
    if (effectiveViewMode !== 'winners') return;

    const loadWinners = async () => {
      setWinnersLoading(true);

      const startDate = formatDate(currentYear, currentMonth, 1);
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      const endDate = formatDate(currentYear, currentMonth, daysInMonth);

      const { data: rankingsData, error } = await supabase
        .from('daily_rankings')
        .select(`
          challenge_date,
          submission_id,
          user_id,
          final_rank,
          submissions!inner (
            shapes,
            background_color_index
          )
        `)
        .eq('final_rank', 1)
        .gte('challenge_date', startDate)
        .lte('challenge_date', endDate <= latestWinnersDate ? endDate : latestWinnersDate)
        .order('challenge_date', { ascending: true });

      if (error) {
        console.error('Error loading winners:', error);
        setWinnersLoading(false);
        return;
      }

      if (!rankingsData || rankingsData.length === 0) {
        setWinners([]);
        setWinnersLoading(false);
        return;
      }

      const userIds = [...new Set(rankingsData.map((r: { user_id: string }) => r.user_id))];
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

      interface RankingRow {
        challenge_date: string;
        submission_id: string;
        user_id: string;
        final_rank: number;
        submissions: { shapes: Shape[]; background_color_index: number | null };
      }
      const winnerEntries: WinnerEntry[] = (rankingsData as unknown as RankingRow[]).map((row) => ({
        challenge_date: row.challenge_date,
        submission_id: row.submission_id,
        user_id: row.user_id,
        nickname: profileMap.get(row.user_id) || 'Anonymous',
        final_rank: row.final_rank,
        shapes: row.submissions?.shapes || [],
        background_color_index: row.submissions?.background_color_index ?? null,
      }));

      setWinners(winnerEntries);
      setWinnersLoading(false);
    };

    loadWinners();
  }, [effectiveViewMode, currentYear, currentMonth, latestWinnersDate]);

  // Fetch challenges for all days in the current month
  useEffect(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(formatDate(currentYear, currentMonth, day));
    }

    fetchChallengesBatch(dates).then((challengeMap) => {
      setChallenges(challengeMap);
    });
  }, [currentYear, currentMonth]);

  // Map date -> submission for quick lookup
  const submissionsByDate = useMemo(() => {
    const map = new Map<string, Submission>();
    submissions.forEach((sub) => {
      map.set(sub.challenge_date, sub);
    });
    return map;
  }, [submissions]);

  // Check if user has submitted today (needed for Wall tab)
  const hasSubmittedToday = useMemo(() => {
    return submissionsByDate.has(todayStr);
  }, [submissionsByDate, todayStr]);

  // Map date -> winners for quick lookup
  const winnersByDate = useMemo(() => {
    const map = new Map<string, WinnerEntry[]>();
    winners.forEach((winner) => {
      const existing = map.get(winner.challenge_date) || [];
      existing.push(winner);
      map.set(winner.challenge_date, existing);
    });
    return map;
  }, [winners]);

  // Generate calendar grid data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentYear, currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  }, []);

  const getDayHref = useCallback((day: number): string | undefined => {
    const dateStr = formatDate(currentYear, currentMonth, day);

    if (effectiveViewMode === 'my-submissions') {
      const submission = submissionsByDate.get(dateStr);
      if (submission) {
        return `/?view=submission&date=${dateStr}`;
      }
    } else {
      const dayWinners = winnersByDate.get(dateStr);
      if (dayWinners && dayWinners.length > 0) {
        return `/?view=winners-day&date=${dateStr}`;
      }
    }
    return undefined;
  }, [currentYear, currentMonth, effectiveViewMode, submissionsByDate, winnersByDate]);

  const canGoNext = useMemo(() => {
    const now = new Date();
    return currentYear < now.getFullYear() ||
      (currentYear === now.getFullYear() && currentMonth < now.getMonth());
  }, [currentYear, currentMonth]);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return currentYear === now.getFullYear() && currentMonth === now.getMonth();
  }, [currentYear, currentMonth]);

  const isLoading = (effectiveViewMode === 'my-submissions' && loading) ||
    (effectiveViewMode === 'winners' && winnersLoading);
  const loadingMessage = effectiveViewMode === 'my-submissions'
    ? 'Loading submissions...'
    : 'Loading winners...';

  return (
    <div className="min-h-screen p-4 md:p-8 bg-(--color-bg-primary)">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm hover:underline text-(--color-text-secondary) mb-4"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to app
          </a>
          <h1 className="text-2xl font-bold mb-2 text-(--color-text-primary)">
            Gallery
          </h1>
        </div>

        {/* Tab toggle */}
        <CalendarViewToggle
          effectiveViewMode={effectiveViewMode}
          user={user}
          onSetViewMode={handleSetViewMode}
        />

        {/* Tab content */}
        {effectiveViewMode === 'wall' ? (
          <WallTab
            date={wallDate}
            onDateChange={setWallDate}
            hasSubmittedToday={hasSubmittedToday}
          />
        ) : effectiveViewMode === 'friends' ? (
          <FriendsFeedTab
            date={friendsFeedDate}
            onDateChange={setFriendsFeedDate}
            hasSubmittedToday={hasSubmittedToday}
          />
        ) : (
          <>
            <ContentNavigation
              label={`${MONTHS[currentMonth]} ${currentYear}`}
              canGoNext={canGoNext}
              onPrev={goToPreviousMonth}
              onNext={goToNextMonth}
              onToday={goToToday}
              showToday={!isCurrentMonth}
            />

            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-(--color-text-secondary) h-full">
                {loadingMessage}
              </div>
            ) : (
              <CalendarGrid
                className="mt-14"
                emptySlotCount={calendarDays.findIndex((d) => d !== null)}
              >
                {calendarDays
                  .filter((day): day is number => day !== null)
                  .map((day) => {
                    const dateStr = formatDate(currentYear, currentMonth, day);
                    const isToday = dateStr === todayStr;
                    const isFuture = dateStr > todayStr;
                    const challenge = challenges.get(dateStr);
                    const submission = submissionsByDate.get(dateStr);
                    const ranking = submission ? rankings.get(submission.id) : undefined;
                    const dayWinners = winnersByDate.get(dateStr);

                    return (
                      <CalendarDayCell
                        key={dateStr}
                        day={day}
                        dateStr={dateStr}
                        viewMode={effectiveViewMode}
                        isToday={isToday}
                        isFuture={isFuture}
                        challenge={challenge}
                        submission={submission}
                        ranking={ranking}
                        dayWinners={dayWinners}
                        latestWinnersDate={latestWinnersDate}
                        href={getDayHref(day)}
                      />
                    );
                  })}
              </CalendarGrid>
            )}

            <CalendarStats
              effectiveViewMode={effectiveViewMode}
              submissions={submissions}
              rankings={rankings}
              winners={winners}
            />
          </>
        )}
      </div>
    </div>
  );
}
