import type { DailyChallenge } from '../../types';
import type { Submission } from '../../hooks/useSubmissions';
import type { ViewMode, WinnerEntry } from './types';
import { SubmissionThumbnail } from '../SubmissionThumbnail';
import { TrophyBadge } from '../TrophyBadge';
import { ChallengeShapeIndicators } from '../ChallengeShapeIndicators';
import { Tooltip } from '../InfoTooltip';

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
  const showWordTooltip = !isFuture && challenge?.word;

  if (viewMode === 'my-submissions') {
    const cellContent = (
      <div
        onClick={() => !isFuture && submission && onClick(day)}
        className={`
          aspect-square rounded-md p-1.5 transition-all border
          ${submission ? 'cursor-pointer hover:border-(--color-accent) bg-(--color-bg-tertiary) border-(--color-border-light)' : 'bg-(--color-bg-primary) border-(--color-border-light)'}
          ${isFuture ? 'opacity-30' : ''}
          ${isToday ? 'ring-2 ring-(--color-accent) ring-offset-1' : ''}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-medium tabular-nums ${
                isToday
                  ? 'text-(--color-accent)'
                  : submission
                  ? 'text-(--color-text-primary)'
                  : 'text-(--color-text-tertiary)'
              }`}
            >
              {day}
            </span>
            {submission && challenge && (
              <div className="flex w-full px-1 justify-between items-center gap-0.5">
                <ChallengeShapeIndicators
                  shapes={challenge.shapes}
                  size={12}
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
                size={56}
              />
            ) : null}
          </div>
        </div>
      </div>
    );

    if (showWordTooltip) {
      return <Tooltip text={`"${challenge.word}"`}>{cellContent}</Tooltip>;
    }
    return cellContent;
  }

  // Winners view
  const hasWinner = dayWinners && dayWinners.length > 0;
  const hasResults = dateStr <= latestWinnersDate;

  const cellContent = (
    <div
      onClick={() => hasWinner && onClick(day)}
      className={`
        aspect-square rounded-md p-1.5 transition-all border
        ${hasWinner ? 'cursor-pointer hover:border-(--color-accent) bg-(--color-bg-tertiary) border-(--color-border-light)' : 'bg-(--color-bg-primary) border-(--color-border-light)'}
        ${isFuture ? 'opacity-30' : ''}
        ${isToday ? 'ring-2 ring-(--color-accent) ring-offset-1' : ''}
      `}
    >
      <div className="flex flex-col h-full">
        <span
          className={`text-[11px] font-medium tabular-nums ${
            isToday
              ? 'text-(--color-accent)'
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
                size={60}
              />
              <div className="absolute -top-0.5 -right-0.5">
                <TrophyBadge rank={1} size="sm" />
              </div>
              {dayWinners.length > 1 && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] px-1 rounded bg-(--color-bg-primary) border border-(--color-border-light) text-(--color-text-secondary)">
                  +{dayWinners.length - 1}
                </div>
              )}
            </>
          ) : !isFuture && !hasResults ? (
            <div className="text-[11px] text-center text-(--color-text-tertiary)">
              {isToday ? 'Creating...' : 'Voting...'}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (showWordTooltip) {
    return <Tooltip text={`"${challenge.word}"`}>{cellContent}</Tooltip>;
  }
  return cellContent;
}
