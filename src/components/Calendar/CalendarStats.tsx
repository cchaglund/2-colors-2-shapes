import { TrophyBadge } from '../TrophyBadge';
import type { ViewMode, WinnerEntry } from './types';
import type { Submission } from '../../hooks/submission/useSubmissions';

interface CalendarStatsProps {
  effectiveViewMode: ViewMode;
  submissions: Submission[];
  rankings: Map<string, number>;
  winners: WinnerEntry[];
}

export function CalendarStats({
  effectiveViewMode,
  submissions,
  rankings,
  winners,
}: CalendarStatsProps) {
  return (
    <div className="mt-auto pt-4 border-t flex items-center justify-between text-sm border-(--color-border) text-(--color-text-secondary)">
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
  );
}
