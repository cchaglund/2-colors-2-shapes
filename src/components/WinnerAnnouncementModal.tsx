import { useEffect, useRef } from 'react';
import { SubmissionThumbnail } from './SubmissionThumbnail';
import { TrophyBadge } from './TrophyBadge';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
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
  const { challenge, loading: challengeLoading } = useDailyChallenge(challengeDate);

  // Focus the button when modal opens and trap focus
  useEffect(() => {
    if (!challengeLoading) {
      buttonRef.current?.focus();
    }

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

  // Show loading state while challenge is being fetched
  if (challengeLoading || !challenge) {
    return (
      <div
        className="fixed inset-0 bg-(--color-modal-overlay) flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6">
          <div className="text-center">
            <div className="inline-block w-6 h-6 border-2 border-(--color-text-tertiary) border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-(--color-text-secondary)">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-(--color-modal-overlay) flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-title"
    >
      <div
        ref={modalRef}
        className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6 w-full max-w-md mx-4"
      >
        <div className="text-center mb-5">
          <h2 id="winner-title" className="text-lg font-semibold text-(--color-text-primary) mb-0.5">
            {formatDate(challengeDate)}
          </h2>
          <p className="text-[13px] text-(--color-text-secondary)">{winners.length > 1 ? 'Winners' : 'Winner'}</p>
          {winners.length > 1 && (
            <p className="text-[11px] text-(--color-text-tertiary) mt-0.5">
              {winners.length === 3 ? 'Three-way tie!' : winners.length === 2 ? 'Tie for 1st place!' : ''}
            </p>
          )}
        </div>

        {/* Winners (1st place) - show all tied winners */}
        {winners.length > 0 && (
          <div className={`flex justify-center ${winners.length > 1 ? 'gap-4' : ''} mb-5`}>
            {winners.map((winner) => (
              <button
                key={winner.submission_id}
                className="flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => onViewSubmission?.(winner.submission_id)}
                title="View submission"
              >
                <div className="relative">
                  <div className="absolute -top-2 -right-2 z-10">
                    <TrophyBadge rank={1} size={winners.length > 2 ? 'md' : 'lg'} />
                  </div>
                  <div className="border-2 border-amber-400 rounded-lg p-1.5 bg-(--color-bg-tertiary)">
                    <SubmissionThumbnail
                      shapes={winner.shapes}
                      challenge={challenge}
                      backgroundColorIndex={winner.background_color_index}
                      size={winners.length > 2 ? 100 : winners.length > 1 ? 120 : 160}
                    />
                  </div>
                </div>
                <p className="mt-2 text-[13px] font-medium text-(--color-text-primary)">@{winner.nickname}</p>
              </button>
            ))}
          </div>
        )}

        {/* 2nd and 3rd place - show if single winner, or show 3rd place for 2-way tie */}
        {(winners.length === 1 && (runnerUps.length > 0 || thirdPlaces.length > 0)) || (winners.length === 2 && thirdPlaces.length > 0) ? (
          <div className="flex justify-center gap-6 mb-5">
            {/* Only show 2nd place if there's a single winner (no tie for 1st) */}
            {winners.length === 1 && runnerUps.map((runnerUp) => (
              <button
                key={runnerUp.submission_id}
                className="flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => onViewSubmission?.(runnerUp.submission_id)}
                title="View submission"
              >
                <div className="relative">
                  <div className="absolute -top-1.5 -right-1.5 z-10">
                    <TrophyBadge rank={2} size="md" />
                  </div>
                  <div className="border border-(--color-border) rounded-md p-1 bg-(--color-bg-tertiary)">
                    <SubmissionThumbnail
                      shapes={runnerUp.shapes}
                      challenge={challenge}
                      backgroundColorIndex={runnerUp.background_color_index}
                      size={80}
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-[12px] text-(--color-text-secondary)">@{runnerUp.nickname}</p>
              </button>
            ))}

            {thirdPlaces.map((thirdPlace) => (
              <button
                key={thirdPlace.submission_id}
                className="flex flex-col items-center bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-[1.02]"
                onClick={() => onViewSubmission?.(thirdPlace.submission_id)}
                title="View submission"
              >
                <div className="relative">
                  <div className="absolute -top-1.5 -right-1.5 z-10">
                    <TrophyBadge rank={3} size="md" />
                  </div>
                  <div className="border border-(--color-border) rounded-md p-1 bg-(--color-bg-tertiary)">
                    <SubmissionThumbnail
                      shapes={thirdPlace.shapes}
                      challenge={challenge}
                      backgroundColorIndex={thirdPlace.background_color_index}
                      size={80}
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-[12px] text-(--color-text-secondary)">@{thirdPlace.nickname}</p>
              </button>
            ))}
          </div>
        ) : null}

        <button
          ref={buttonRef}
          onClick={onDismiss}
          className="w-full px-4 py-2 bg-(--color-accent) text-white text-[13px] rounded-md font-medium hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
