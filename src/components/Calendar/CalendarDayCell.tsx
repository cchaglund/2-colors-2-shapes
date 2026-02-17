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
  href?: string;
  onClick?: (day: number) => void;
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
  href,
  onClick,
}: CalendarDayCellProps) {
  const showWordTooltip = !isFuture && challenge?.word;

  if (viewMode === 'my-submissions') {
    const isClickable = !isFuture && !!submission;
    const className = `
      group aspect-square rounded-md p-1.5 transition-all border
      ${submission ? 'cursor-pointer hover:border-(--color-accent) bg-(--color-bg-tertiary) border-(--color-border-light)' : 'bg-(--color-bg-primary) border-(--color-border-light)'}
      ${isFuture ? 'opacity-30' : ''}
      ${isToday ? 'ring-2 ring-(--color-accent) ring-offset-1' : ''}
    `;

    const inner = (
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
              <div className="hidden group-hover:block pl-2">
                <ChallengeShapeIndicators
                  shapes={challenge.shapes}
                  size={12}
                />
              </div>
              {ranking !== undefined && ranking <= 3 && (
                <div className='ml-auto'>
                  <TrophyBadge
                    rank={ranking as 1 | 2 | 3}
                    size="sm"
                  />
                </div>
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
              size={70}
            />
          ) : !isFuture ? (
            <svg
              className="w-6 h-6 text-(--color-text-tertiary) opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : null}
        </div>
      </div>
    );

    const cellContent = isClickable && href ? (
      <a href={href} className={className}>{inner}</a>
    ) : isClickable && onClick ? (
      <div onClick={() => onClick(day)} className={className}>{inner}</div>
    ) : (
      <div className={className}>{inner}</div>
    );

    if (showWordTooltip) {
      return <Tooltip text={`"${challenge.word}"`}>{cellContent}</Tooltip>;
    }
    return cellContent;
  }

  // Winners view
  const hasWinner = dayWinners && dayWinners.length > 0;
  const hasResults = dateStr <= latestWinnersDate;

  const winnersClassName = `
    aspect-square rounded-md p-1.5 transition-all border
    ${hasWinner ? 'cursor-pointer hover:border-(--color-accent) bg-(--color-bg-tertiary) border-(--color-border-light)' : 'bg-(--color-bg-primary) border-(--color-border-light)'}
    ${isFuture ? 'opacity-30' : ''}
    ${isToday ? 'ring-2 ring-(--color-accent) ring-offset-1' : ''}
  `;

  const winnersInner = (
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
              size={80}
            />
            {dayWinners.length > 1 && (
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] px-1 rounded bg-(--color-bg-primary) border border-(--color-border-light) text-(--color-text-secondary)">
                +{dayWinners.length - 1}
              </div>
            )}
          </>
        ) : !isFuture ? (
          hasResults ? (
            <div className="text-[11px] text-center text-(--color-text-tertiary)">
              No winners
            </div>
          ) : (
            <div className="text-[11px] text-center text-(--color-text-tertiary)">
              {isToday ? 'Creating...' : 'Voting...'}
            </div>
          )
        ) : null}
      </div>
    </div>
  );

  const cellContent = hasWinner && href ? (
    <a href={href} className={winnersClassName}>{winnersInner}</a>
  ) : hasWinner && onClick ? (
    <div onClick={() => onClick(day)} className={winnersClassName}>{winnersInner}</div>
  ) : (
    <div className={winnersClassName}>{winnersInner}</div>
  );

  if (showWordTooltip) {
    return <Tooltip text={`"${challenge.word}"`}>{cellContent}</Tooltip>;
  }
  return cellContent;
}
