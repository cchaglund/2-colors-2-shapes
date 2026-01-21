import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFriendsFeed, type SortMode } from '../../hooks/useFriendsFeed';
import { WallSortControls } from '../Wall/WallSortControls';
import { SubmissionThumbnail } from '../SubmissionThumbnail';
import { generateDailyChallenge, getTodayDateUTC } from '../../utils/dailyChallenge';
import { useAuth } from '../../hooks/useAuth';
import { useFollows } from '../../contexts/FollowsContext';
import { supabase } from '../../lib/supabase';
import { formatDate, getDaysInMonth, getFirstDayOfMonth } from '../../utils/calendarUtils';
import type { DailyChallenge } from '../../types';

type ViewType = 'grid' | 'calendar';

interface FriendsFeedContentProps {
  date: string;
  onDateChange: (date: string) => void;
  hasSubmittedToday: boolean;
  showNavigation?: boolean;
  onSubmissionClick?: (submissionId: string) => void;
}

interface FriendsCountByDate {
  [date: string]: number;
}

export function FriendsFeedContent({
  date,
  onDateChange,
  hasSubmittedToday,
  showNavigation = false,
  onSubmissionClick,
}: FriendsFeedContentProps) {
  const { user } = useAuth();
  const { followingIds, followingCount } = useFollows();
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [friendsCounts, setFriendsCounts] = useState<FriendsCountByDate>({});
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Parse year/month from date for calendar view
  const [calendarYear, calendarMonth] = useMemo(() => {
    const d = new Date(date + 'T00:00:00Z');
    return [d.getUTCFullYear(), d.getUTCMonth()];
  }, [date]);

  const {
    submissions,
    loading,
    error,
    sortMode,
    setSortMode,
    canViewCurrentDay,
    isRankedAvailable,
    hasMore,
    loadMore,
    adjacentDates,
  } = useFriendsFeed({ date, hasSubmittedToday });

  // Generate challenge data for the date to get colors
  const challenge: DailyChallenge = useMemo(
    () => generateDailyChallenge(date),
    [date]
  );

  const todayStr = useMemo(() => getTodayDateUTC(), []);

  // Format date for display
  const formattedDate = useMemo(() => {
    const d = new Date(date + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }, [date]);

  // Format submission time for tooltip
  const formatTime = (createdAt: string) => {
    const d = new Date(createdAt);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Handle thumbnail click
  const handleThumbnailClick = (submissionId: string) => {
    if (onSubmissionClick) {
      onSubmissionClick(submissionId);
    } else {
      window.location.href = `/?view=submission&id=${submissionId}`;
    }
  };

  // Fetch friends counts for calendar view
  const fetchFriendsCounts = useCallback(async () => {
    if (!user || followingIds.size === 0) {
      setFriendsCounts({});
      return;
    }

    setCalendarLoading(true);
    try {
      const startDate = formatDate(calendarYear, calendarMonth, 1);
      const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
      const endDate = formatDate(calendarYear, calendarMonth, daysInMonth);

      // Use the RPC function if available, otherwise fall back to manual counting
      const { data, error: rpcError } = await supabase.rpc('count_friends_submissions_by_date', {
        p_user_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (rpcError) {
        console.warn('RPC failed, falling back to manual count:', rpcError);
        // Fallback: query submissions directly
        const followingIdsArray = Array.from(followingIds);
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('challenge_date, user_id')
          .in('user_id', followingIdsArray)
          .gte('challenge_date', startDate)
          .lte('challenge_date', endDate)
          .eq('included_in_ranking', true);

        if (submissionsData) {
          const counts: FriendsCountByDate = {};
          const usersByDate = new Map<string, Set<string>>();

          submissionsData.forEach(s => {
            if (!usersByDate.has(s.challenge_date)) {
              usersByDate.set(s.challenge_date, new Set());
            }
            usersByDate.get(s.challenge_date)!.add(s.user_id);
          });

          usersByDate.forEach((users, dateKey) => {
            counts[dateKey] = users.size;
          });

          setFriendsCounts(counts);
        }
      } else if (data) {
        const counts: FriendsCountByDate = {};
        (data as { challenge_date: string; friend_count: number }[]).forEach(row => {
          counts[row.challenge_date] = row.friend_count;
        });
        setFriendsCounts(counts);
      }
    } catch (err) {
      console.error('Failed to fetch friends counts:', err);
    } finally {
      setCalendarLoading(false);
    }
  }, [user, followingIds, calendarYear, calendarMonth]);

  // Fetch counts when switching to calendar view or when month changes
  useEffect(() => {
    if (viewType === 'calendar') {
      fetchFriendsCounts();
    }
  }, [viewType, fetchFriendsCounts]);

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [calendarYear, calendarMonth]);

  // Calendar navigation
  const goToPreviousMonth = useCallback(() => {
    let newMonth = calendarMonth - 1;
    let newYear = calendarYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    onDateChange(formatDate(newYear, newMonth, 1));
  }, [calendarMonth, calendarYear, onDateChange]);

  const goToNextMonth = useCallback(() => {
    let newMonth = calendarMonth + 1;
    let newYear = calendarYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    onDateChange(formatDate(newYear, newMonth, 1));
  }, [calendarMonth, calendarYear, onDateChange]);

  const goToToday = useCallback(() => {
    onDateChange(todayStr);
  }, [onDateChange, todayStr]);

  const handleDayClick = useCallback((day: number) => {
    const dateStr = formatDate(calendarYear, calendarMonth, day);
    // Switch to grid view and show that day's submissions
    setViewType('grid');
    onDateChange(dateStr);
  }, [calendarYear, calendarMonth, onDateChange]);

  const canGoNext = useMemo(() => {
    const now = new Date();
    return calendarYear < now.getFullYear() ||
      (calendarYear === now.getFullYear() && calendarMonth < now.getMonth());
  }, [calendarYear, calendarMonth]);

  const monthYearLabel = useMemo(() => {
    const d = new Date(calendarYear, calendarMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarYear, calendarMonth]);

  // Not logged in state
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-(--color-bg-tertiary) flex items-center justify-center mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-tertiary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <p className="text-[13px] text-(--color-text-secondary)">
          Please sign in to see friends' submissions
        </p>
      </div>
    );
  }

  // No friends state
  if (followingCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-(--color-bg-tertiary) flex items-center justify-center mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-tertiary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <p className="text-[13px] text-(--color-text-secondary)">
          Follow some artists to see their work here
        </p>
      </div>
    );
  }

  // Locked state (today and hasn't submitted)
  if (!canViewCurrentDay) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-(--color-bg-tertiary) flex items-center justify-center mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-text-tertiary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className="text-[13px] text-(--color-text-secondary) mb-4">
          Save your art first to see friends' submissions for today
        </p>
        <a
          href="/"
          className="text-[13px] text-(--color-accent) hover:underline"
        >
          ← Back to canvas
        </a>
      </div>
    );
  }

  // Loading state
  if (loading && viewType === 'grid') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-(--color-border) border-t-(--color-accent) rounded-full animate-spin mb-4" />
        <p className="text-[13px] text-(--color-text-secondary)">
          Loading friends' submissions...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-[13px] text-red-500 mb-2">
          Failed to load submissions
        </p>
        <p className="text-[12px] text-(--color-text-tertiary)">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* View toggle and controls */}
      <div className="flex flex-col gap-3">
        {/* View type toggle */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-md p-0.5 border border-(--color-border) bg-(--color-bg-tertiary)">
            <button
              onClick={() => setViewType('grid')}
              className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
                viewType === 'grid'
                  ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
                  : 'bg-transparent text-(--color-text-secondary) border border-transparent'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
                viewType === 'calendar'
                  ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
                  : 'bg-transparent text-(--color-text-secondary) border border-transparent'
              }`}
            >
              Calendar
            </button>
          </div>

          {/* Sort controls - only show in grid view */}
          {viewType === 'grid' && (
            <WallSortControls
              sortMode={sortMode}
              onSortModeChange={(mode: SortMode) => setSortMode(mode)}
              isRankedAvailable={isRankedAvailable}
            />
          )}
        </div>

        {/* Date navigation - only show in grid view */}
        {showNavigation && viewType === 'grid' && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => adjacentDates.prev && onDateChange(adjacentDates.prev)}
              disabled={!adjacentDates.prev}
              className="text-[13px] text-(--color-accent) hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
            >
              ← Previous
            </button>
            <span className="text-[13px] font-medium text-(--color-text-primary)">
              {formattedDate}
            </span>
            <button
              onClick={() => adjacentDates.next && onDateChange(adjacentDates.next)}
              disabled={!adjacentDates.next}
              className="text-[13px] text-(--color-accent) hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Calendar view */}
      {viewType === 'calendar' && (
        <div className="flex flex-col gap-4">
          {/* Calendar navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="text-[13px] text-(--color-accent) hover:underline"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-semibold text-(--color-text-primary)">
                {monthYearLabel}
              </span>
              <button
                onClick={goToToday}
                className="text-[11px] text-(--color-text-secondary) hover:text-(--color-accent) px-2 py-1 border border-(--color-border) rounded"
              >
                Today
              </button>
            </div>
            <button
              onClick={goToNextMonth}
              disabled={!canGoNext}
              className="text-[13px] text-(--color-accent) hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
            >
              Next →
            </button>
          </div>

          {/* Calendar loading state */}
          {calendarLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-(--color-border) border-t-(--color-accent) rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className="text-center text-[11px] font-medium text-(--color-text-tertiary) py-2"
                  >
                    {day}
                  </div>
                ))}

                {/* Day cells */}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dateStr = formatDate(calendarYear, calendarMonth, day);
                  const isToday = dateStr === todayStr;
                  const isFuture = dateStr > todayStr;
                  const friendCount = friendsCounts[dateStr] || 0;
                  const isCurrentDayLocked = dateStr === todayStr && !hasSubmittedToday;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !isFuture && !isCurrentDayLocked && handleDayClick(day)}
                      disabled={isFuture || isCurrentDayLocked}
                      className={`
                        relative aspect-square rounded-lg p-1 transition-colors
                        ${isFuture || isCurrentDayLocked
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-(--color-bg-secondary) cursor-pointer'
                        }
                        ${isToday ? 'ring-2 ring-(--color-accent)' : ''}
                      `}
                    >
                      {/* Day number */}
                      <span className={`
                        text-[12px]
                        ${isToday ? 'text-(--color-accent) font-semibold' : 'text-(--color-text-secondary)'}
                      `}>
                        {day}
                      </span>

                      {/* Friend count badge */}
                      {friendCount > 0 && !isFuture && !isCurrentDayLocked && (
                        <span className="absolute top-1 right-1 bg-(--color-accent) text-white text-[10px] font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                          {friendCount}
                        </span>
                      )}

                      {/* Lock icon for current day when not submitted */}
                      {isCurrentDayLocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--color-text-tertiary)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Grid view */}
      {viewType === 'grid' && (
        <>
          {/* Empty state for no submissions on this day */}
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-(--color-bg-tertiary) flex items-center justify-center mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
              </div>
              <p className="text-[13px] text-(--color-text-secondary)">
                None of your friends posted on this day
              </p>
            </div>
          ) : (
            <>
              {/* Grid of submissions */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                }}
              >
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex flex-col items-center"
                    title={`Submitted at ${formatTime(submission.created_at)}`}
                  >
                    <SubmissionThumbnail
                      shapes={submission.shapes}
                      challenge={challenge}
                      backgroundColorIndex={submission.background_color_index}
                      size={140}
                      showNickname={true}
                      nickname={submission.nickname}
                      onClick={() => handleThumbnailClick(submission.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Load more button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    className="px-4 py-2 text-[13px] font-medium text-(--color-accent) border border-(--color-accent) rounded-md hover:bg-(--color-accent) hover:text-white transition-colors"
                  >
                    Load more submissions
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
