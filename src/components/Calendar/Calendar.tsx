import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSubmissions, type Submission } from '../../hooks/useSubmissions';
import { getTodayDate, getTwoDaysAgoDate } from '../../utils/dailyChallenge';
import { fetchChallengesBatch, getChallengeSync } from '../../hooks/useDailyChallenge';
import { supabase } from '../../lib/supabase';
import type { Shape, DailyChallenge } from '../../types';
import { formatDate, getDaysInMonth, getFirstDayOfMonth } from '../../utils/calendarUtils';
import type { CalendarProps, ViewMode, RankingInfo, WinnerEntry } from './types';
import { CalendarHeader } from './CalendarHeader';
import { CalendarViewToggle } from './CalendarViewToggle';
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarGrid } from './CalendarGrid';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarStats } from './CalendarStats';

export function Calendar({ onClose }: CalendarProps) {
  const { user } = useAuth();
  const { loadMySubmissions, loading } = useSubmissions(user?.id);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rankings, setRankings] = useState<Map<string, number>>(new Map());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);
  const [winners, setWinners] = useState<WinnerEntry[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(false);
  const [challenges, setChallenges] = useState<Map<string, DailyChallenge>>(new Map());

  // Determine effective view mode - null until auth loads, then based on user
  const effectiveViewMode: ViewMode = viewMode ?? (user ? 'my-submissions' : 'winners');

  const todayStr = useMemo(() => getTodayDate(), []);
  // Winners are only available up to 2 days ago (voting completes the day after submission)
  const latestWinnersDate = useMemo(() => getTwoDaysAgoDate(), []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load submissions on mount (only when in my-submissions mode)
  useEffect(() => {
    if (user && effectiveViewMode === 'my-submissions') {
      loadMySubmissions().then(({ data }) => {
        setSubmissions(data);
        // Load rankings for all submissions
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

      // Calculate date range for the current month
      const startDate = formatDate(currentYear, currentMonth, 1);
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      const endDate = formatDate(currentYear, currentMonth, daysInMonth);

      // Fetch all 1st place winners for the month (up to latestWinnersDate)
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

      // Fetch nicknames for all winners
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

      // Transform data into WinnerEntry format
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

  // Create a map of date -> submission for quick lookup
  const submissionsByDate = useMemo(() => {
    const map = new Map<string, Submission>();
    submissions.forEach((sub) => {
      map.set(sub.challenge_date, sub);
    });
    return map;
  }, [submissions]);

  // Create a map of date -> winners for quick lookup
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

  const handleDayClick = useCallback((day: number) => {
    const dateStr = formatDate(currentYear, currentMonth, day);

    if (effectiveViewMode === 'my-submissions') {
      const submission = submissionsByDate.get(dateStr);
      if (submission) {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'submission');
        url.searchParams.set('date', dateStr);
        window.open(url.toString(), '_blank');
      }
    } else {
      const dayWinners = winnersByDate.get(dateStr);
      if (dayWinners && dayWinners.length > 0) {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'winners-day');
        url.searchParams.set('date', dateStr);
        window.open(url.toString(), '_blank');
      }
    }
  }, [currentYear, currentMonth, effectiveViewMode, submissionsByDate, winnersByDate]);

  // Check if we can go to next month
  const canGoNext = useMemo(() => {
    const now = new Date();
    return currentYear < now.getFullYear() ||
      (currentYear === now.getFullYear() && currentMonth < now.getMonth());
  }, [currentYear, currentMonth]);

  const isLoading = (effectiveViewMode === 'my-submissions' && loading) ||
    (effectiveViewMode === 'winners' && winnersLoading);
  const loadingMessage = effectiveViewMode === 'my-submissions'
    ? 'Loading submissions...'
    : 'Loading winners...';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'var(--color-modal-overlay)' }}
      onClick={onClose}
    >
      <div
        className="border rounded-xl p-6 w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-auto"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderColor: 'var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CalendarHeader onClose={onClose} />

        <CalendarViewToggle
          effectiveViewMode={effectiveViewMode}
          user={user}
          onSetViewMode={setViewMode}
        />

        <CalendarNavigation
          currentYear={currentYear}
          currentMonth={currentMonth}
          canGoNext={canGoNext}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          onToday={goToToday}
        />

        <CalendarGrid loading={isLoading} loadingMessage={loadingMessage}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = formatDate(currentYear, currentMonth, day);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const challenge = challenges.get(dateStr) || getChallengeSync(dateStr);
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
                onClick={handleDayClick}
              />
            );
          })}
        </CalendarGrid>

        <CalendarStats
          effectiveViewMode={effectiveViewMode}
          submissions={submissions}
          rankings={rankings}
          winners={winners}
        />
      </div>
    </div>
  );
}
