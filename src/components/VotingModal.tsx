import { useEffect, useRef, useState } from 'react';
import { useVoting } from '../hooks/useVoting';
import { SubmissionThumbnail } from './SubmissionThumbnail';
import { generateDailyChallenge } from '../utils/dailyChallenge';
import type { DailyChallenge } from '../types';

interface VotingModalProps {
  userId: string;
  challengeDate: string; // The date to vote on (yesterday)
  onComplete: () => void;
  onSkipVoting: () => void;
  onOptInToRanking?: () => void; // Called when user opts in without voting (bootstrap case)
}

export function VotingModal({
  userId,
  challengeDate,
  onComplete,
  onSkipVoting,
  onOptInToRanking,
}: VotingModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);

  const {
    currentPair,
    loading,
    submitting,
    voteCount,
    requiredVotes,
    hasEnteredRanking,
    noMorePairs,
    noSubmissions,
    submissionCount,
    vote,
    skip,
    fetchNextPair,
    initializeVoting,
  } = useVoting(userId, challengeDate);

  // Generate challenge for the date being voted on
  useEffect(() => {
    setChallenge(generateDailyChallenge(challengeDate));
  }, [challengeDate]);

  // Initialize voting on mount
  useEffect(() => {
    initializeVoting().then(() => {
      fetchNextPair();
    });
  }, [initializeVoting, fetchNextPair]);

  // Show confirmation when user reaches required votes
  useEffect(() => {
    if (hasEnteredRanking && !showConfirmation) {
      setShowConfirmation(true);
    }
  }, [hasEnteredRanking, showConfirmation]);

  // Focus trap and keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmation) {
          onComplete();
        } else {
          onSkipVoting();
        }
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
  }, [showConfirmation, onComplete, onSkipVoting]);

  const handleVote = async (winnerId: string) => {
    await vote(winnerId);
  };

  const handleSkip = async () => {
    await skip();
  };

  const handleContinueVoting = () => {
    setShowConfirmation(false);
  };

  const handleOptIn = () => {
    // User opts in to ranking without voting (bootstrap case)
    onOptInToRanking?.();
    onComplete();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Bootstrap case: No submissions yesterday - ask if they want to enter ranking
  if (noSubmissions && !loading) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voting-title"
      >
        <div
          ref={modalRef}
          className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl text-center"
        >
          <div className="text-4xl mb-4">🎨</div>
          <h2 id="voting-title" className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Submit for Voting?
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            There were no submissions yesterday to vote on. Would you like your artwork to be included in
            tomorrow's voting?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onSkipVoting}
              className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              No thanks
            </button>
            <button
              onClick={handleOptIn}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Yes, include me!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen after reaching required votes
  if (showConfirmation) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voting-title"
      >
        <div
          ref={modalRef}
          className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl text-center"
        >
          <div className="text-4xl mb-4">🎉</div>
          <h2 id="voting-title" className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Your submission is now entered!
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Thanks for voting! Your artwork will be included in today's ranking.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleContinueVoting}
              disabled={noMorePairs}
              className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue Voting
            </button>
            <button
              onClick={onComplete}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No more pairs to vote on
  if (noMorePairs && !loading) {
    const hasVotedEnough = voteCount >= requiredVotes;
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voting-title"
      >
        <div
          ref={modalRef}
          className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl text-center"
        >
          {hasVotedEnough ? (
            <>
              <div className="text-4xl mb-4">🎉</div>
              <h2 id="voting-title" className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                All Done!
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                You've voted on all available pairs. Your artwork is entered in today's ranking!
              </p>
            </>
          ) : (
            <>
              <h2 id="voting-title" className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                No More Pairs
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-4">
                You've seen all available artwork pairs for {formatDate(challengeDate)}.
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
                You voted on {voteCount} pair{voteCount !== 1 ? 's' : ''}.
                {requiredVotes > voteCount && ` Needed ${requiredVotes} to enter ranking.`}
              </p>
            </>
          )}
          <button
            onClick={hasVotedEnough ? onComplete : onSkipVoting}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {hasVotedEnough ? 'Done' : 'Continue Without Ranking'}
          </button>
        </div>
      </div>
    );
  }

  // Only 1 submission - can't make pairs
  if (submissionCount === 1 && !loading) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voting-title"
      >
        <div
          ref={modalRef}
          className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl text-center"
        >
          <div className="text-4xl mb-4">🎨</div>
          <h2 id="voting-title" className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Submit for Voting?
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            There was only 1 submission yesterday, so there's nothing to vote on yet. Would you like your
            artwork to be included in tomorrow's voting?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onSkipVoting}
              className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-secondary)] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              No thanks
            </button>
            <button
              onClick={handleOptIn}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Yes, include me!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main voting UI
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voting-title"
    >
      <div
        ref={modalRef}
        className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-3xl mx-4 shadow-xl"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 id="voting-title" className="text-xl font-semibold text-[var(--color-text-primary)]">
              Vote on Yesterday's Submissions
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(challengeDate)}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">
              {voteCount} of {requiredVotes} votes
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">
              {requiredVotes - voteCount > 0
                ? `${requiredVotes - voteCount} more to enter ranking`
                : 'Entered in ranking!'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${requiredVotes > 0 ? Math.min((voteCount / requiredVotes) * 100, 100) : 100}%` }}
          />
        </div>

        {loading || !currentPair || !challenge ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-[var(--color-text-secondary)]">Loading...</div>
          </div>
        ) : (
          <>
            {/* Side by side comparison */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <button
                onClick={() => handleVote(currentPair.submissionA.id)}
                disabled={submitting}
                className="group relative p-4 border-2 border-[var(--color-border)] rounded-xl hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="aspect-square">
                  <SubmissionThumbnail
                    shapes={currentPair.submissionA.shapes}
                    challenge={challenge}
                    backgroundColorIndex={currentPair.submissionA.background_color_index}
                    size={280}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-blue-600/80 text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  Choose this one
                </div>
              </button>

              <button
                onClick={() => handleVote(currentPair.submissionB.id)}
                disabled={submitting}
                className="group relative p-4 border-2 border-[var(--color-border)] rounded-xl hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="aspect-square">
                  <SubmissionThumbnail
                    shapes={currentPair.submissionB.shapes}
                    challenge={challenge}
                    backgroundColorIndex={currentPair.submissionB.background_color_index}
                    size={280}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-blue-600/80 text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  Choose this one
                </div>
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={onSkipVoting}
                className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Skip voting (won't enter ranking)
              </button>
              <button
                onClick={handleSkip}
                disabled={submitting}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
              >
                Can't decide, skip this pair
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
