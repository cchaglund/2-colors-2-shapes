import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubmissions, type Submission } from '../hooks/useSubmissions';
import { generateDailyChallenge, getTodayDate } from '../utils/dailyChallenge';
import { SubmissionThumbnail } from './SubmissionThumbnail';
import { TrophyBadge } from './TrophyBadge';
import { supabase } from '../lib/supabase';

interface RankingInfo {
  submission_id: string;
  final_rank: number | null;
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

  const todayStr = useMemo(() => getTodayDate(), []);

  // Load submissions on mount
  useEffect(() => {
    if (user) {
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
  }, [user, loadMySubmissions]);

  // Create a map of date -> submission for quick lookup
  const submissionsByDate = useMemo(() => {
    const map = new Map<string, Submission>();
    submissions.forEach((sub) => {
      map.set(sub.challenge_date, sub);
    });
    return map;
  }, [submissions]);

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
    const submission = submissionsByDate.get(dateStr);

    if (submission) {
      // Open in new tab
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'submission');
      url.searchParams.set('date', dateStr);
      window.open(url.toString(), '_blank');
    }
  }, [currentYear, currentMonth, submissionsByDate]);

  // Check if we can go to next month (can't go past current month)
  const canGoNext = useMemo(() => {
    const now = new Date();
    return currentYear < now.getFullYear() ||
           (currentYear === now.getFullYear() && currentMonth < now.getMonth());
  }, [currentYear, currentMonth]);

  if (!user) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'var(--color-modal-overlay)' }}
      >
        <div
          className="border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Sign In Required
          </h2>
          <p
            className="mb-6"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Please sign in to view your submission history.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            My Submissions
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
        {loading ? (
          <div
            className="flex items-center justify-center py-12"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Loading submissions...
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
              const submission = submissionsByDate.get(dateStr);
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;
              const challenge = generateDailyChallenge(dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => !isFuture && handleDayClick(day)}
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
          <span>Total submissions: {submissions.length}</span>
          {submissions.length > 0 && (
            <span>
              First submission:{' '}
              {new Date(submissions[submissions.length - 1].challenge_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
