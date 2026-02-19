import { useState, useMemo, useEffect, useCallback } from 'react';
import { useWallOfTheDay, type SortMode } from '../../hooks/challenge/useWallOfTheDay';
import { useDailyChallenge } from '../../hooks/challenge/useDailyChallenge';
import { useCalendarMonth } from '../../hooks/challenge/useCalendarMonth';
import { useCalendarChallenges } from '../../hooks/challenge/useCalendarChallenges';
import { WallSortControls } from './WallSortControls';
import { WallLockedState } from './WallLockedState';
import { WallEmptyState } from './WallEmptyState';
import { SubmissionThumbnail } from '../shared/SubmissionThumbnail';
import { ContentNavigation } from '../Calendar/ContentNavigation';
import { ContentCalendarGrid } from '../Calendar/ContentCalendarGrid';
import { formatDate, getDaysInMonth } from '../../utils/calendarUtils';
import { supabase } from '../../lib/supabase';

type ViewType = 'grid' | 'calendar';

interface SubmissionCountByDate {
  [date: string]: number;
}

interface WallContentProps {
  date: string;
  onDateChange: (date: string) => void;
  hasSubmittedToday: boolean;
  showNavigation?: boolean;
  showCalendarButton?: boolean;
  onSubmissionClick?: (submissionId: string) => void;
}

export function WallContent({
  date,
  onDateChange,
  hasSubmittedToday,
  showNavigation = false,
  onSubmissionClick,
}: WallContentProps) {
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [submissionCounts, setSubmissionCounts] = useState<SubmissionCountByDate>({});
  const [calendarLoading, setCalendarLoading] = useState(false);

  const {
    calendarYear,
    calendarMonth,
    calendarDays,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    canGoNext,
    monthYearLabel,
    shortDateLabel,
    todayStr: todayDate,
    isToday,
  } = useCalendarMonth(date, onDateChange);

  const challengesMap = useCalendarChallenges(calendarYear, calendarMonth, viewType === 'calendar');

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

  // Format date for display (used in empty state)
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

  const getSubmissionHref = (submissionId: string) =>
    `/?view=submission&id=${submissionId}`;

  const handleDayClick = useCallback((day: number) => {
    const dateStr = formatDate(calendarYear, calendarMonth, day);
    setViewType('grid');
    onDateChange(dateStr);
  }, [calendarYear, calendarMonth, onDateChange]);

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

  // Empty state - only in grid view when can view (calendar always shows)
  if (submissions.length === 0 && viewType === 'grid' && canViewCurrentDay) {
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
      {/* Navigation */}
      {showNavigation && (
        <ContentNavigation
          label={viewType === 'calendar' ? monthYearLabel : shortDateLabel}
          onPrev={viewType === 'calendar' ? goToPreviousMonth : () => adjacentDates.prev && onDateChange(adjacentDates.prev)}
          onNext={viewType === 'calendar' ? goToNextMonth : () => adjacentDates.next && onDateChange(adjacentDates.next)}
          onToday={goToToday}
          canGoPrev={viewType === 'calendar' ? true : !!adjacentDates.prev}
          canGoNext={viewType === 'calendar' ? canGoNext : !!adjacentDates.next}
          showToday={!isToday}
        />
      )}

      {/* View toggle and sort controls */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-md p-0.5 border border-(--color-border) bg-(--color-bg-tertiary)">
          <button
            onClick={() => setViewType('grid')}
            className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              viewType === 'grid'
                ? 'bg-(--color-selected) text-(--color-text-primary) border border-(--color-border-light)'
                : 'bg-transparent text-(--color-text-secondary) border border-transparent'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewType('calendar')}
            className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              viewType === 'calendar'
                ? 'bg-(--color-selected) text-(--color-text-primary) border border-(--color-border-light)'
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

      {/* Calendar view */}
      {viewType === 'calendar' && (
        <div className="flex flex-col gap-4">
          <ContentCalendarGrid
            calendarYear={calendarYear}
            calendarMonth={calendarMonth}
            calendarDays={calendarDays}
            todayStr={todayDate}
            hasSubmittedToday={hasSubmittedToday}
            loading={calendarLoading}
            counts={submissionCounts}
            challengesMap={challengesMap}
            onDayClick={handleDayClick}
          />
        </div>
      )}

      {/* Grid view */}
      {viewType === 'grid' && (
        !canViewCurrentDay ? (
          <WallLockedState/>
        ) : challenge ? (
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
                  href={onSubmissionClick ? undefined : getSubmissionHref(submission.id)}
                  onClick={onSubmissionClick ? () => onSubmissionClick(submission.id) : undefined}
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
        ) : null
      )}
    </div>
  );
}
