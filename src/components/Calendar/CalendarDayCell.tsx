import type { DailyChallenge } from '../../types';
import type { Submission } from '../../hooks/useSubmissions';
import type { ViewMode, WinnerEntry } from './types';
import { SubmissionThumbnail } from '../SubmissionThumbnail';
import { TrophyBadge } from '../TrophyBadge';
import { ChallengeShapeIndicators } from '../ChallengeShapeIndicators';

interface CalendarDayCellProps {
  day: number;
  dateStr: string;
  viewMode: ViewMode;
  isToday: boolean;
  isFuture: boolean;
  challenge: DailyChallenge | undefined;
  submission: Submission | undefined;
  ranking: number | undefined;
  dayWinners: WinnerEntry[] | undefined;
  latestWinnersDate: string;
  onClick: (day: number) => void;
}

export function CalendarDayCell({
  day,
  dateStr,
  viewMode,
  isToday,
  isFuture,
  challenge,
  submission,
  ranking,
  dayWinners,
  latestWinnersDate,
  onClick,
}: CalendarDayCellProps) {
  if (viewMode === 'my-submissions') {
    return (
      <div
        onClick={() => !isFuture && submission && onClick(day)}
        title={challenge?.word ? `"${challenge.word}"` : undefined}
        className={`
          aspect-square rounded-lg p-1 transition-all
          ${submission ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 bg-(--color-bg-secondary)' : 'bg-(--color-bg-tertiary)'}
          ${isFuture ? 'opacity-30' : ''}
          ${isToday ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                isToday
                  ? 'text-blue-500'
                  : submission
                  ? 'text-(--color-text-primary)'
                  : 'text-(--color-text-tertiary)'
              }`}
            >
              {day}
            </span>
            {submission && challenge && (
              <div className="flex w-full px-2 justify-between items-center gap-1">
                <ChallengeShapeIndicators
                  shapes={challenge.shapes}
                  size={14}
                />
                {ranking !== undefined && ranking <= 3 && (
                  <TrophyBadge
                    rank={ranking as 1 | 2 | 3}
                    size="sm"
                  />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center">
            {submission && challenge ? (
              <SubmissionThumbnail
                shapes={submission.shapes}
                challenge={challenge}
                backgroundColorIndex={submission.background_color_index}
                size={60}
              />
            ) : !isFuture ? (
              <div className="text-xs text-center text-(--color-text-tertiary)">
                No submission
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Winners view
  const hasWinner = dayWinners && dayWinners.length > 0;
  const hasResults = dateStr <= latestWinnersDate;

  return (
    <div
      onClick={() => hasWinner && onClick(day)}
      title={challenge?.word ? `"${challenge.word}"` : undefined}
      className={`
        aspect-square rounded-lg p-1 transition-all
        ${hasWinner ? 'cursor-pointer hover:ring-2 hover:ring-yellow-500 bg-(--color-bg-secondary)' : 'bg-(--color-bg-tertiary)'}
        ${isFuture ? 'opacity-30' : ''}
        ${isToday ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <div className="flex flex-col h-full">
        <span
          className={`text-xs font-medium ${
            isToday
              ? 'text-blue-500'
              : hasWinner
              ? 'text-(--color-text-primary)'
              : 'text-(--color-text-tertiary)'
          }`}
        >
          {day}
        </span>
        <div className="flex-1 flex items-center justify-center relative">
          {hasWinner && challenge ? (
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
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs px-1 rounded bg-(--color-bg-primary) text-(--color-text-secondary)">
                  +{dayWinners.length - 1}
                </div>
              )}
            </>
          ) : !isFuture && hasResults ? (
            <div className="text-xs text-center text-(--color-text-tertiary)">
              No winner
            </div>
          ) : !isFuture && !hasResults ? (
            <div className="text-xs text-center text-(--color-text-tertiary)">
              Voting...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
