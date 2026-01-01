import type { VotingConfirmationProps } from './types';

export function VotingConfirmation({ canContinueVoting, onContinue, onDone }: VotingConfirmationProps) {
  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 w-full max-w-md shadow-xl text-center">
      <div className="text-4xl mb-4">🎉</div>
      <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary) mb-2">
        Your submission is now entered!
      </h2>
      <p className="text-(--color-text-secondary) mb-6">
        Thanks for voting! Your artwork will be included in today's ranking.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onContinue}
          disabled={!canContinueVoting}
          className="flex-1 px-4 py-2.5 border border-(--color-border) text-(--color-text-primary) rounded-lg font-medium hover:bg-(--color-bg-secondary) transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue Voting
        </button>
        <button
          onClick={onDone}
          className="flex-1 px-4 py-2.5 bg-(--color-accent) text-white rounded-lg font-medium hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
        >
          Done
        </button>
      </div>
    </div>
  );
}
