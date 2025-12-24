import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { useVoting } from '../../hooks/useVoting';
import { useDailyChallenge } from '../../hooks/useDailyChallenge';
import { VotingPairView } from './VotingPairView';
import { VotingConfirmation } from './VotingConfirmation';
import { VotingNoPairs } from './VotingNoPairs';
import { VotingOptInPrompt } from './VotingOptInPrompt';

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

  // Fetch challenge for the date being voted on
  const { challenge } = useDailyChallenge(challengeDate);

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

  // Determine content to render
  const renderContent = () => {
    // Bootstrap case: No submissions yesterday
    if (noSubmissions && !loading) {
      return <VotingOptInPrompt variant="zero" onOptIn={handleOptIn} onSkip={onSkipVoting} />;
    }

    // Bootstrap case: Only 1 submission
    if (submissionCount === 1 && !loading) {
      return <VotingOptInPrompt variant="one" onOptIn={handleOptIn} onSkip={onSkipVoting} />;
    }

    // Confirmation screen after reaching required votes
    if (showConfirmation) {
      return (
        <VotingConfirmation
          canContinueVoting={!noMorePairs}
          onContinue={handleContinueVoting}
          onDone={onComplete}
        />
      );
    }

    // No more pairs to vote on
    if (noMorePairs && !loading) {
      return (
        <VotingNoPairs
          voteCount={voteCount}
          requiredVotes={requiredVotes}
          challengeDate={challengeDate}
          onDone={onComplete}
          onSkipVoting={onSkipVoting}
        />
      );
    }

    // Main voting UI
    if (loading || !currentPair || !challenge) {
      return (
        <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 w-full max-w-3xl shadow-xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-(--color-text-secondary)">Loading...</div>
          </div>
        </div>
      );
    }

    return (
      <VotingPairView
        currentPair={currentPair}
        challenge={challenge}
        challengeDate={challengeDate}
        voteCount={voteCount}
        requiredVotes={requiredVotes}
        submitting={submitting}
        onVote={handleVote}
        onSkip={handleSkip}
        onSkipVoting={onSkipVoting}
      />
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voting-title"
    >
      <div ref={modalRef} className="mx-4">
        {renderContent()}
      </div>
    </div>
  );
}
