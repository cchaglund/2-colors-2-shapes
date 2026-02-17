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
  canView?: boolean;
  lockedContent?: React.ReactNode;
  thumbnailSize?: number;
  hideEmptyDayIcon?: boolean;
}

const cellBase = 'block aspect-square border-b border-r border-(--color-border) p-1 relative transition-all overflow-hidden';

function cellClasses(hasContent: boolean, isFuture: boolean, isToday: boolean) {
  return `
    ${cellBase}
    ${hasContent ? 'cursor-pointer hover:ring-1 hover:ring-inset hover:ring-(--color-accent) bg-(--color-bg-tertiary)' : ''}
    ${isFuture ? 'bg-(--color-bg-secondary) opacity-50' : ''}
    ${isToday ? 'ring-2 ring-inset ring-(--color-accent)' : ''}
  `;
}

function DayNumber({ day, isToday, hasContent }: { day: number; isToday: boolean; hasContent: boolean }) {
  return (
    <div
      className={`absolute top-1 left-1 text-[10px] font-medium tabular-nums ${
        isToday
          ? 'text-(--color-accent)'
          : hasContent
          ? 'text-(--color-text-primary)'
          : 'text-(--color-text-tertiary)'
      }`}
    >
      {day}
    </div>
  );
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
  canView = true,
  lockedContent,
  thumbnailSize,
  hideEmptyDayIcon,
}: CalendarDayCellProps) {
  const showWordTooltip = !isFuture && challenge?.word;

  if (viewMode === 'my-submissions') {
    // Locked day (profile privacy check)
    if (!canView && !isFuture) {
      const className = `${cellBase} ${isToday ? 'ring-2 ring-inset ring-(--color-accent)' : ''}`;
      return (
        <div className={className}>
          <DayNumber day={day} isToday={isToday} hasContent={false} />
          <div className="w-full h-full flex items-center justify-center pt-3">
            {lockedContent}
          </div>
        </div>
      );
    }

    const isClickable = !isFuture && !!submission;
    const className = `group ${cellClasses(!!submission, isFuture, isToday)}`;
    const size = thumbnailSize ?? 70;

    const inner = (
      <>
        <DayNumber day={day} isToday={isToday} hasContent={!!submission} />
        {submission && challenge && ranking !== undefined && ranking <= 3 && (
          <div className="absolute top-0.5 right-0.5">
            <TrophyBadge rank={ranking as 1 | 2 | 3} size="sm" />
          </div>
        )}
        {submission && challenge && (
          <div className="absolute top-0.5 left-6 hidden group-hover:block">
            <ChallengeShapeIndicators shapes={challenge.shapes} size={12} />
          </div>
        )}
        <div className="w-full h-full flex items-center justify-center pt-3">
          {submission && challenge ? (
            <SubmissionThumbnail
              shapes={submission.shapes}
              challenge={challenge}
              backgroundColorIndex={submission.background_color_index}
              size={size}
            />
          ) : !isFuture && !hideEmptyDayIcon ? (
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
      </>
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
  const winnersClassName = cellClasses(!!hasWinner, isFuture, isToday);

  const winnersInner = (
    <>
      <DayNumber day={day} isToday={isToday} hasContent={!!hasWinner} />
      <div className="w-full h-full flex items-center justify-center pt-3 relative">
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
    </>
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
