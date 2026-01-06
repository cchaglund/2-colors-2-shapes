import type { VotingConfirmationProps } from './types';

export function VotingConfirmation({ canContinueVoting, onContinue, onDone }: VotingConfirmationProps) {
  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6 w-full max-w-sm text-center">
      <div className="text-3xl mb-3">🎉</div>
      <h2 id="voting-title" className="text-lg font-semibold text-(--color-text-primary) mb-1">
        Your submission is now entered!
      </h2>
      <p className="text-[13px] text-(--color-text-secondary) mb-5">
        Thanks for voting! Your artwork will be included in today's ranking.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onContinue}
          disabled={!canContinueVoting}
          className="flex-1 px-4 py-2 border border-(--color-border) text-[13px] text-(--color-text-primary) rounded-md font-medium hover:bg-(--color-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue Voting
        </button>
        <button
          onClick={onDone}
          className="flex-1 px-4 py-2 bg-(--color-accent) text-white text-[13px] rounded-md font-medium hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
        >
          Done
        </button>
      </div>
    </div>
  );
}
