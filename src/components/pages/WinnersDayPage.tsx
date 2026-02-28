import { useState, useEffect } from 'react';
import { useRanking } from '../../hooks/challenge/useRanking';
import { useDailyChallenge } from '../../hooks/challenge/useDailyChallenge';
import { WinnerCard } from '../submission/WinnerCard';
import { getShapeSVGData } from '../../utils/shapes';
import { BackToCanvasLink } from '../shared/BackToCanvasLink';

interface WinnersDayPageProps {
  date: string;
}

export function WinnersDayPage({ date }: WinnersDayPageProps) {
  const { fetchTopThree, topThree, loading, getAdjacentRankingDates } = useRanking();
  const { challenge, loading: challengeLoading } = useDailyChallenge(date);
  const [adjacentDates, setAdjacentDates] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });

  useEffect(() => {
    fetchTopThree(date);
    getAdjacentRankingDates(date).then(setAdjacentDates);
  }, [date, fetchTopThree, getAdjacentRankingDates]);

  const formattedDate = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Loading...';

  const handleViewSubmission = (submissionId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('date');
    url.searchParams.set('view', 'submission');
    url.searchParams.set('id', submissionId);
    window.location.href = url.toString();
  };

  // Group entries by rank
  const winners = topThree.filter((e) => e.rank === 1);
  const runnerUps = topThree.filter((e) => e.rank === 2);
  const thirdPlaces = topThree.filter((e) => e.rank === 3);

  if (loading || challengeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-(--color-bg-primary)">
        <div className="text-(--color-text-secondary)">
          Loading rankings...
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-(--color-bg-primary)">
        <div className="text-(--color-text-secondary)">
          Challenge not found for {formattedDate}.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-(--color-bg-primary) theme-pattern">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <BackToCanvasLink />
            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (adjacentDates.prev) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('date', adjacentDates.prev);
                    window.location.href = url.toString();
                  }
                }}
                disabled={!adjacentDates.prev}
                className="px-3 py-1.5 rounded-(--radius-md) text-base font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 bg-(--color-bg-tertiary) text-(--color-text-primary)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Previous
              </button>
              <button
                onClick={() => {
                  if (adjacentDates.next) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('date', adjacentDates.next);
                    window.location.href = url.toString();
                  }
                }}
                disabled={!adjacentDates.next}
                className="px-3 py-1.5 rounded-(--radius-md) text-base font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 bg-(--color-bg-tertiary) text-(--color-text-primary)"
              >
                Next
                <svg
                  width="14"
                  height="14"
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
          </div>
          <h1 className="text-2xl font-bold mb-2 text-(--color-text-primary) font-display">
            {formattedDate}
          </h1>
          <p className="text-(--color-text-secondary)">
            Daily Challenge Rankings
          </p>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-center">
          {/* Rankings */}
          <div className="flex-1 space-y-6">
            {topThree.length === 0 ? (
              <div className="text-center py-12 text-(--color-text-secondary)">
                No rankings available for this day.
              </div>
            ) : (
              <>
                {/* Winners (1st place) */}
                
                {winners.length > 0 && (
                  <div className="text-center">
                    <h2 className="text-base font-medium mb-4 text-(--color-text-tertiary)">
                      {winners.length > 1 ? '1st Place (Tie)' : '1st Place'}
                    </h2>
                    <div className={`flex flex-wrap justify-center ${winners.length > 1 ? 'gap-4 md:gap-6' : ''}`}>
                      {winners.map((winner) => (
                        <WinnerCard
                          key={winner.submission_id}
                          entry={winner}
                          challenge={challenge}
                          onView={handleViewSubmission}
                          size={winners.length > 2 ? 'sm' : winners.length > 1 ? 'md' : 'lg'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2nd and 3rd place */}
                {(runnerUps.length > 0 || thirdPlaces.length > 0) && (
                  <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                    {runnerUps.map((entry) => (
                      <WinnerCard
                        key={entry.submission_id}
                        entry={entry}
                        challenge={challenge}
                        onView={handleViewSubmission}
                        size="sm"
                      />
                    ))}
                    {thirdPlaces.map((entry) => (
                      <WinnerCard
                        key={entry.submission_id}
                        entry={entry}
                        challenge={challenge}
                        onView={handleViewSubmission}
                        size="sm"
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Challenge details sidebar */}
          <div className="w-full md:w-75 space-y-4">
            <div className="border rounded-(--radius-xl) p-4 bg-(--color-bg-primary) border-(--color-border)">
              <h2 className="text-base font-semibold mb-3 text-(--color-text-primary)">
                Challenge Details
              </h2>

              {/* Daily Word */}
              <div className="mb-4">
                <span className="text-xs text-(--color-text-tertiary)">
                  Inspiration
                </span>
                <p className="mt-1 text-lg font-medium italic text-(--color-text-primary)">
                  "{challenge.word}"
                </p>
              </div>

              {/* Colors */}
              <div className="mb-4">
                <span className="text-xs text-(--color-text-tertiary)">
                  Colors
                </span>
                <div className="flex gap-2 mt-1">
                  {challenge.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-(--radius-md) border border-(--color-border)"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Shapes */}
              <div>
                <span className="text-xs text-(--color-text-tertiary)">
                  Shapes
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {challenge.shapes.map((shapeData, i) => {
                    const { element, props } = getShapeSVGData(shapeData.type, 32);
                    return (
                      <div
                        key={i}
                        className="rounded-(--radius-md) p-1 flex items-center justify-center bg-(--color-bg-tertiary)"
                        title={shapeData.name}
                      >
                        <svg width={40} height={40} viewBox="0 0 32 32">
                          {element === 'ellipse' && (
                            <ellipse {...props} fill="var(--color-text-primary)" />
                          )}
                          {element === 'rect' && (
                            <rect {...props} fill="var(--color-text-primary)" />
                          )}
                          {element === 'polygon' && (
                            <polygon {...props} fill="var(--color-text-primary)" />
                          )}
                          {element === 'path' && (
                            <path {...props} fill="var(--color-text-primary)" />
                          )}
                        </svg>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

