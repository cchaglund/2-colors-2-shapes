import { useEffect, useRef } from 'react';
import { SubmissionThumbnail } from './SubmissionThumbnail';
import { TrophyBadge } from './TrophyBadge';
import { generateDailyChallenge } from '../utils/dailyChallenge';
import type { RankingEntry } from '../types';

interface WinnerAnnouncementModalProps {
  challengeDate: string;
  topThree: RankingEntry[];
  onDismiss: () => void;
  onViewSubmission?: (submissionId: string) => void;
}

export function WinnerAnnouncementModal({
  challengeDate,
  topThree,
  onDismiss,
  onViewSubmission,
}: WinnerAnnouncementModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const challenge = generateDailyChallenge(challengeDate);

  // Focus the button when modal opens and trap focus
  useEffect(() => {
    buttonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
      // Trap focus within the modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Group entries by rank
  const winners = topThree.filter((e) => e.rank === 1);
  const runnerUps = topThree.filter((e) => e.rank === 2);
  const thirdPlaces = topThree.filter((e) => e.rank === 3);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-title"
    >
      <div
        ref={modalRef}
        className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl"
      >
        <div className="text-center mb-6">
          <h2 id="winner-title" className="text-xl font-semibold text-(--color-text-primary) mb-1">
            {formatDate(challengeDate)}
          </h2>
          <p className="text-sm text-(--color-text-secondary)">{winners.length > 1 ? 'Winners' : 'Winner'}</p>
          {winners.length > 1 && (
            <p className="text-xs text-(--color-text-tertiary) mt-1">
              {winners.length === 3 ? 'Three-way tie!' : winners.length === 2 ? 'Tie for 1st place!' : ''}
            </p>
          )}
        </div>

        {/* Winners (1st place) - show all tied winners */}
        {winners.length > 0 && (
          <div className={`flex justify-center ${winners.length > 1 ? 'gap-6' : ''} mb-6`}>
            {winners.map((winner) => (
              <button
                key={winner.submission_id}
                className="flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-105"
                onClick={() => onViewSubmission?.(winner.submission_id)}
                title="View submission"
              >
                <div className="relative">
                  <div className="absolute -top-3 -right-3 z-10">
                    <TrophyBadge rank={1} size={winners.length > 2 ? 'md' : 'lg'} />
                  </div>
                  <div className="border-4 border-yellow-400 rounded-xl p-2 shadow-lg">
                    <SubmissionThumbnail
                      shapes={winner.shapes}
                      challenge={challenge}
                      backgroundColorIndex={winner.background_color_index}
                      size={winners.length > 2 ? 120 : winners.length > 1 ? 140 : 180}
                    />
                  </div>
                </div>
                <p className="mt-3 font-medium text-(--color-text-primary)">@{winner.nickname}</p>
              </button>
            ))}
          </div>
        )}

        {/* 2nd and 3rd place - show if single winner, or show 3rd place for 2-way tie */}
        {(winners.length === 1 && (runnerUps.length > 0 || thirdPlaces.length > 0)) || (winners.length === 2 && thirdPlaces.length > 0) ? (
          <div className="flex justify-center gap-8 mb-6">
            {/* Only show 2nd place if there's a single winner (no tie for 1st) */}
            {winners.length === 1 && runnerUps.map((runnerUp) => (
              <button
                key={runnerUp.submission_id}
                className="flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-105"
                onClick={() => onViewSubmission?.(runnerUp.submission_id)}
                title="View submission"
              >
                <div className="relative">
                  <div className="absolute -top-2 -right-2 z-10">
                    <TrophyBadge rank={2} size="md" />
                  </div>
                  <div className="border-2 border-gray-300 rounded-lg p-1">
                    <SubmissionThumbnail
                      shapes={runnerUp.shapes}
                      challenge={challenge}
                      backgroundColorIndex={runnerUp.background_color_index}
                      size={100}
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm text-(--color-text-secondary)">@{runnerUp.nickname}</p>
              </button>
            ))}

            {thirdPlaces.map((thirdPlace) => (
              <button
                key={thirdPlace.submission_id}
                className="flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-105"
                onClick={() => onViewSubmission?.(thirdPlace.submission_id)}
                title="View submission"
              >
                <div className="relative">
                  <div className="absolute -top-2 -right-2 z-10">
                    <TrophyBadge rank={3} size="md" />
                  </div>
                  <div className="border-2 border-amber-600 rounded-lg p-1">
                    <SubmissionThumbnail
                      shapes={thirdPlace.shapes}
                      challenge={challenge}
                      backgroundColorIndex={thirdPlace.background_color_index}
                      size={100}
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm text-(--color-text-secondary)">@{thirdPlace.nickname}</p>
              </button>
            ))}
          </div>
        ) : null}

        <button
          ref={buttonRef}
          onClick={onDismiss}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
