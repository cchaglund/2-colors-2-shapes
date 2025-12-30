import type { VotingOptInPromptProps } from './types';

export function VotingOptInPrompt({ variant, onOptIn, onSkip }: VotingOptInPromptProps) {
  const message =
    variant === 'zero'
      ? 'There were too few submissions yesterday to vote on. Would you like your artwork to be included in tomorrow\'s voting?'
      : 'There was only 1 submission yesterday, so there\'s nothing to vote on yet. Would you like your artwork to be included in tomorrow\'s voting?';

  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 w-full max-w-md shadow-xl text-center">
      <div className="text-4xl mb-4">🎨</div>
      <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary) mb-2">
        Submit for Voting?
      </h2>
      <p className="text-(--color-text-secondary) mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 px-4 py-2.5 border border-(--color-border) text-(--color-text-primary) rounded-lg font-medium hover:bg-(--color-bg-secondary) transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          No thanks
        </button>
        <button
          onClick={onOptIn}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Yes, include me!
        </button>
      </div>
    </div>
  );
}
