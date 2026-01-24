import { useState, useMemo, useEffect, useCallback } from 'react';
import { useWallOfTheDay, type SortMode } from '../../hooks/useWallOfTheDay';
import { useDailyChallenge } from '../../hooks/useDailyChallenge';
import { WallSortControls } from './WallSortControls';
import { WallLockedState } from './WallLockedState';
import { WallEmptyState } from './WallEmptyState';
import { SubmissionThumbnail } from '../SubmissionThumbnail';
import { getTodayDateUTC } from '../../utils/dailyChallenge';
import { formatDate, getDaysInMonth, getFirstDayOfMonth } from '../../utils/calendarUtils';
import { supabase } from '../../lib/supabase';

type ViewType = 'grid' | 'calendar';

interface SubmissionCountByDate {
  [date: string]: number;
}

interface WallContentProps {
  date: string;
  onDateChange: (date: string) => void;
  hasSubmittedToday: boolean;
  isLoggedIn: boolean;
  showNavigation?: boolean;
  showCalendarButton?: boolean;
  onSubmissionClick?: (submissionId: string) => void;
}

export function WallContent({
  date,
  onDateChange,
  hasSubmittedToday,
  isLoggedIn,
  showNavigation = false,
  onSubmissionClick,
}: WallContentProps) {
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [submissionCounts, setSubmissionCounts] = useState<SubmissionCountByDate>({});
  const [calendarLoading, setCalendarLoading] = useState(false);

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
  } = useWallOfTheDay({ date, hasSubmittedToday });

  // Fetch challenge data for the date to get colors from DB
  const { challenge } = useDailyChallenge(date);

  // Get today's date for "Today" button
  const todayDate = useMemo(() => getTodayDateUTC(), []);
  const isToday = date === todayDate;

  // Parse year/month from date for calendar view
  const [calendarYear, calendarMonth] = useMemo(() => {
    const d = new Date(date + 'T00:00:00Z');
    return [d.getUTCFullYear(), d.getUTCMonth()];
  }, [date]);

  // Fetch submission counts for calendar view
  const fetchSubmissionCounts = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const startDate = formatDate(calendarYear, calendarMonth, 1);
      const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
      const endDate = formatDate(calendarYear, calendarMonth, daysInMonth);

      const { data } = await supabase
        .from('submissions')
        .select('challenge_date')
        .gte('challenge_date', startDate)
        .lte('challenge_date', endDate)
        .eq('included_in_ranking', true);

      if (data) {
        const counts: SubmissionCountByDate = {};
        data.forEach(s => {
          counts[s.challenge_date] = (counts[s.challenge_date] || 0) + 1;
        });
        setSubmissionCounts(counts);
      }
    } catch (err) {
      console.error('Failed to fetch submission counts:', err);
    } finally {
      setCalendarLoading(false);
    }
  }, [calendarYear, calendarMonth]);

  // Fetch counts when switching to calendar view or when month changes
  useEffect(() => {
    if (viewType === 'calendar') {
      fetchSubmissionCounts();
    }
  }, [viewType, fetchSubmissionCounts]);

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
    onDateChange(todayDate);
  }, [onDateChange, todayDate]);

  const handleDayClick = useCallback((day: number) => {
    const dateStr = formatDate(calendarYear, calendarMonth, day);
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
      // Default behavior: navigate to submission detail page
      window.location.href = `/?view=submission&id=${submissionId}`;
    }
  };

  // Locked state
  if (!canViewCurrentDay) {
    return <WallLockedState isLoggedIn={isLoggedIn} />;
  }

  // Loading state - only for grid view
  if (loading && viewType === 'grid') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-(--color-border) border-t-(--color-accent) rounded-full animate-spin mb-4" />
        <p className="text-[13px] text-(--color-text-secondary)">
          Loading submissions...
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

  // Empty state - only in grid view (calendar always shows)
  if (submissions.length === 0 && viewType === 'grid') {
    return (
      <WallEmptyState
        showNavigation={showNavigation}
        adjacentDates={adjacentDates}
        onDateChange={onDateChange}
        formattedDate={formattedDate}
        todayDate={todayDate}
        isToday={isToday}
        viewType={viewType}
        onViewTypeChange={setViewType}
      />
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
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-(--color-text-primary)">
                {formattedDate}
              </span>
              {!isToday && (
                <button
                  onClick={() => onDateChange(todayDate)}
                  className="px-2 py-1 text-[12px] font-medium bg-(--color-accent) text-white rounded hover:opacity-90"
                >
                  Today
                </button>
              )}
            </div>
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
                  const isDayToday = dateStr === todayDate;
                  const isFuture = dateStr > todayDate;
                  const submissionCount = submissionCounts[dateStr] || 0;
                  const isCurrentDayLocked = dateStr === todayDate && !hasSubmittedToday;

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
                        ${isDayToday ? 'ring-2 ring-(--color-accent)' : ''}
                      `}
                    >
                      {/* Day number */}
                      <span className={`
                        text-[12px]
                        ${isDayToday ? 'text-(--color-accent) font-semibold' : 'text-(--color-text-secondary)'}
                      `}>
                        {day}
                      </span>

                      {/* Submission count badge */}
                      {submissionCount > 0 && !isFuture && !isCurrentDayLocked && (
                        <span className="absolute top-1 right-1 bg-(--color-accent) text-white text-[10px] font-medium rounded-full min-w-4.5 h-4.5 flex items-center justify-center">
                          {submissionCount}
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
      {viewType === 'grid' && challenge && (
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
                  likeCount={submission.like_count}
                  showLikeCount={sortMode === 'likes'}
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
    </div>
  );
}
