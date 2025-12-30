import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubmissions, type Submission } from '../hooks/useSubmissions';
import { getTodayDate, getTwoDaysAgoDate } from '../utils/dailyChallenge';
import { fetchChallengesBatch, getChallengeSync } from '../hooks/useDailyChallenge';
import { SubmissionThumbnail } from './SubmissionThumbnail';
import { TrophyBadge } from './TrophyBadge';
import { supabase } from '../lib/supabase';
import type { Shape, DailyChallenge } from '../types';

type ViewMode = 'my-submissions' | 'winners';

interface RankingInfo {
  submission_id: string;
  final_rank: number | null;
}

interface WinnerEntry {
  challenge_date: string;
  submission_id: string;
  user_id: string;
  nickname: string;
  final_rank: number;
  shapes: Shape[];
  background_color_index: number | null;
}

interface CalendarProps {
  onClose: () => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

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

  // Create a map of date -> winners for quick lookup (can have multiple winners per day for ties)
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

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
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
        // Open in new tab
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'submission');
        url.searchParams.set('date', dateStr);
        window.open(url.toString(), '_blank');
      }
    } else {
      // Winners mode - open the winners day page showing all rankings
      const dayWinners = winnersByDate.get(dateStr);
      if (dayWinners && dayWinners.length > 0) {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'winners-day');
        url.searchParams.set('date', dateStr);
        window.open(url.toString(), '_blank');
      }
    }
  }, [currentYear, currentMonth, effectiveViewMode, submissionsByDate, winnersByDate]);

  // Check if we can go to next month (can't go past current month)
  const canGoNext = useMemo(() => {
    const now = new Date();
    return currentYear < now.getFullYear() ||
      (currentYear === now.getFullYear() && currentMonth < now.getMonth());
  }, [currentYear, currentMonth]);

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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Calendar
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md cursor-pointer transition-colors hover:bg-opacity-80"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
            }}
            aria-label="Close calendar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* View Mode Toggle */}
        <div
          className="flex rounded-lg p-1 mb-4"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <button
            onClick={() => setViewMode('my-submissions')}
            disabled={!user}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            style={{
              backgroundColor: effectiveViewMode === 'my-submissions' ? 'var(--color-bg-primary)' : 'transparent',
              color: effectiveViewMode === 'my-submissions' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: effectiveViewMode === 'my-submissions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
            title={!user ? 'Sign in to view your submissions' : undefined}
          >
            My Submissions
          </button>
          <button
            onClick={() => setViewMode('winners')}
            className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: effectiveViewMode === 'winners' ? 'var(--color-bg-primary)' : 'transparent',
              color: effectiveViewMode === 'winners' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: effectiveViewMode === 'winners' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            🏆 Winners
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-md cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
            }}
            aria-label="Previous month"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <span
              className="text-lg font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={goToToday}
              className="px-3 py-1 rounded-md cursor-pointer text-sm transition-colors"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="p-2 rounded-md cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
            }}
            aria-label="Next month"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        {(effectiveViewMode === 'my-submissions' && loading) || (effectiveViewMode === 'winners' && winnersLoading) ? (
          <div
            className="flex items-center justify-center py-12"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {effectiveViewMode === 'my-submissions' ? 'Loading submissions...' : 'Loading winners...'}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="text-center py-2 text-sm font-medium"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = formatDate(currentYear, currentMonth, day);
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;
              const challenge = challenges.get(dateStr) || getChallengeSync(dateStr);

              if (effectiveViewMode === 'my-submissions') {
                // My Submissions view
                const submission = submissionsByDate.get(dateStr);

                return (
                  <div
                    key={dateStr}
                    onClick={() => !isFuture && submission && handleDayClick(day)}
                    className={`
                      aspect-square rounded-lg p-1 transition-all
                      ${submission ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''}
                      ${isFuture ? 'opacity-30' : ''}
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                    `}
                    style={{
                      backgroundColor: submission
                        ? 'var(--color-bg-secondary)'
                        : 'var(--color-bg-tertiary)',
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <span
                        className={`text-xs font-medium ${isToday ? 'text-blue-500' : ''}`}
                        style={{
                          color: isToday
                            ? undefined
                            : submission
                            ? 'var(--color-text-primary)'
                            : 'var(--color-text-tertiary)',
                        }}
                      >
                        {day}
                      </span>
                      <div className="flex-1 flex items-center justify-center relative">
                        {submission ? (
                          <>
                            <SubmissionThumbnail
                              shapes={submission.shapes}
                              challenge={challenge}
                              backgroundColorIndex={submission.background_color_index}
                              size={70}
                            />
                            {rankings.get(submission.id) !== undefined &&
                              rankings.get(submission.id)! <= 3 && (
                                <div className="absolute -top-1 -right-1">
                                  <TrophyBadge
                                    rank={rankings.get(submission.id) as 1 | 2 | 3}
                                    size="sm"
                                  />
                                </div>
                              )}
                          </>
                        ) : !isFuture ? (
                          <div
                            className="text-xs text-center"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            No submission
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Winners view
                const dayWinners = winnersByDate.get(dateStr);
                const hasWinner = dayWinners && dayWinners.length > 0;
                // Winners are only available up to 2 days ago
                const hasResults = dateStr <= latestWinnersDate;

                return (
                  <div
                    key={dateStr}
                    onClick={() => hasWinner && handleDayClick(day)}
                    className={`
                      aspect-square rounded-lg p-1 transition-all
                      ${hasWinner ? 'cursor-pointer hover:ring-2 hover:ring-yellow-500' : ''}
                      ${isFuture ? 'opacity-30' : ''}
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                    `}
                    style={{
                      backgroundColor: hasWinner
                        ? 'var(--color-bg-secondary)'
                        : 'var(--color-bg-tertiary)',
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <span
                        className={`text-xs font-medium ${isToday ? 'text-blue-500' : ''}`}
                        style={{
                          color: isToday
                            ? undefined
                            : hasWinner
                            ? 'var(--color-text-primary)'
                            : 'var(--color-text-tertiary)',
                        }}
                      >
                        {day}
                      </span>
                      <div className="flex-1 flex items-center justify-center relative">
                        {hasWinner ? (
                          <>
                            <SubmissionThumbnail
                              shapes={dayWinners[0].shapes}
                              challenge={challenge}
                              backgroundColorIndex={dayWinners[0].background_color_index}
                              size={70}
                            />
                            <div className="absolute -top-1 -right-1">
                              <TrophyBadge rank={1} size="sm" />
                            </div>
                            {dayWinners.length > 1 && (
                              <div
                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs px-1 rounded"
                                style={{
                                  backgroundColor: 'var(--color-bg-primary)',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                +{dayWinners.length - 1}
                              </div>
                            )}
                          </>
                        ) : !isFuture && hasResults ? (
                          <div
                            className="text-xs text-center"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            No winner
                          </div>
                        ) : !isFuture && !hasResults ? (
                          <div
                            className="text-xs text-center"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            Voting...
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Stats */}
        <div
          className="mt-6 pt-4 border-t flex items-center justify-between text-sm"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {effectiveViewMode === 'my-submissions' ? (
            <>
              <span>Total submissions: {submissions.length}</span>
              {submissions.length > 0 && (() => {
                // Count trophies by rank
                const trophyCounts = { 1: 0, 2: 0, 3: 0 };
                rankings.forEach((rank) => {
                  if (rank >= 1 && rank <= 3) {
                    trophyCounts[rank as 1 | 2 | 3]++;
                  }
                });
                const hasTrophies = trophyCounts[1] > 0 || trophyCounts[2] > 0 || trophyCounts[3] > 0;

                return hasTrophies ? (
                  <div className="flex items-center gap-4">
                    {trophyCounts[1] > 0 && (
                      <span className="flex items-center gap-1">
                        <TrophyBadge rank={1} size="sm" /> ×{trophyCounts[1]}
                      </span>
                    )}
                    {trophyCounts[2] > 0 && (
                      <span className="flex items-center gap-1">
                        <TrophyBadge rank={2} size="sm" /> ×{trophyCounts[2]}
                      </span>
                    )}
                    {trophyCounts[3] > 0 && (
                      <span className="flex items-center gap-1">
                        <TrophyBadge rank={3} size="sm" /> ×{trophyCounts[3]}
                      </span>
                    )}
                  </div>
                ) : null;
              })()}
            </>
          ) : (
            <>
              <span>Winners this month: {winners.length}</span>
              {winners.length > 0 && (
                <span>
                  {[...new Set(winners.map(w => w.user_id))].length} unique winner{[...new Set(winners.map(w => w.user_id))].length !== 1 ? 's' : ''}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
