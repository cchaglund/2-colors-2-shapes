import { SubmissionThumbnail } from '../shared/SubmissionThumbnail';
import { TrophyBadge } from '../shared/TrophyBadge';
import type { RankingEntry, DailyChallenge } from '../../types';

interface WinnerCardProps {
  entry: RankingEntry;
  challenge: DailyChallenge;
  onView?: (submissionId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  /** Use page variant styling (larger borders, shadows, consistent nickname style) */
  /** Override the default thumbnail size */
}

export function WinnerCard({
  entry,
  challenge,
  onView,
  size = 'md',
}: WinnerCardProps) {

  // Page uses different thumbnail sizes than modal
  const thumbnailSize = (size === 'lg' ? 240 : size === 'md' ? 180 : 150)

  return (
    <button
      className={`flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-102`}
      onClick={() => onView?.(entry.submission_id)}
      title="View submission"
    >
      <div className="relative">
        <div className="absolute -top-3 -right-3 z-10">
          <TrophyBadge rank={entry.rank as 1 | 2 | 3} />
        </div>
        <div className="rounded-(--radius-xl) overflow-hidden shadow-(--shadow-card)">
          <SubmissionThumbnail
            shapes={entry.shapes}
            groups={entry.groups}
            challenge={challenge}
            backgroundColorIndex={entry.background_color_index}
            size={thumbnailSize}
          />
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-(--color-text-primary)">@{entry.nickname}</p>
    </button>
  );
}
