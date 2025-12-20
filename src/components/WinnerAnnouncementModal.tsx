import { useEffect, useRef } from 'react';
import { SubmissionThumbnail } from './SubmissionThumbnail';
import { TrophyBadge } from './TrophyBadge';
import { generateDailyChallenge } from '../utils/dailyChallenge';
import type { RankingEntry } from '../types';

interface WinnerAnnouncementModalProps {
  challengeDate: string;
  topThree: RankingEntry[];
  totalSubmissions: number;
  notEnoughSubmissions: boolean;
  onDismiss: () => void;
}

export function WinnerAnnouncementModal({
  challengeDate,
  topThree,
  totalSubmissions,
  notEnoughSubmissions,
  onDismiss,
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

  // Check for ties
  const hasTie = topThree.length > 1 && topThree[0].rank === topThree[1].rank;
  const hasThreeWayTie = hasTie && topThree.length > 2 && topThree[1].rank === topThree[2].rank;

  // Not enough submissions
  if (notEnoughSubmissions) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-title"
      >
        <div
          ref={modalRef}
          className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl text-center"
        >
          <h2 id="winner-title" className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Yesterday's Results
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">{formatDate(challengeDate)}</p>

          <div className="py-8 text-[var(--color-text-tertiary)]">
            <div className="text-4xl mb-4">📊</div>
            <p>Not enough entries for ranking</p>
            <p className="text-sm mt-2">
              Only {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''} (need at least 5)
            </p>
          </div>

          <button
            ref={buttonRef}
            onClick={onDismiss}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  const winner = topThree[0];
  const runnerUp = topThree.find((e) => e.rank === 2);
  const thirdPlace = topThree.find((e) => e.rank === 3);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-title"
    >
      <div
        ref={modalRef}
        className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl"
      >
        <div className="text-center mb-6">
          <h2 id="winner-title" className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">
            Yesterday's Winners!
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(challengeDate)}</p>
          {(hasTie || hasThreeWayTie) && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {hasThreeWayTie ? 'Three-way tie!' : 'Tie for 1st place!'}
            </p>
          )}
        </div>

        {/* Winner (1st place) */}
        {winner && (
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="absolute -top-3 -right-3 z-10">
                <TrophyBadge rank={1} size="lg" />
              </div>
              <div className="border-4 border-yellow-400 rounded-xl p-2 shadow-lg">
                <SubmissionThumbnail
                  shapes={winner.shapes}
                  challenge={challenge}
                  backgroundColorIndex={winner.background_color_index}
                  size={180}
                />
              </div>
            </div>
            <p className="mt-3 font-medium text-[var(--color-text-primary)]">@{winner.nickname}</p>
          </div>
        )}

        {/* 2nd and 3rd place */}
        {(runnerUp || thirdPlace) && (
          <div className="flex justify-center gap-8 mb-6">
            {runnerUp && (
              <div className="flex flex-col items-center">
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
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">@{runnerUp.nickname}</p>
              </div>
            )}

            {thirdPlace && (
              <div className="flex flex-col items-center">
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
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">@{thirdPlace.nickname}</p>
              </div>
            )}
          </div>
        )}

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
