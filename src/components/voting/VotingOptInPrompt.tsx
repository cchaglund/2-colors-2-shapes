import type { VotingOptInPromptProps } from './types';

export function VotingOptInPrompt({ onOptIn, onSkip }: VotingOptInPromptProps) {
  const message = 'If you opt in, your artwork will be visible for others to vote on tomorrow. Winners are announced the following day.';
  const message3 = 'Your artwork has been saved to your gallery regardless of your choice.';

  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6 w-full max-w-md text-center">
      <div className="w-12 h-12 rounded-full bg-(--color-accent-subtle) flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
      <h2 id="voting-title" className="text-lg font-semibold text-(--color-text-primary) mb-2">
        Submit for Voting?
      </h2>
      <p className="text-[13px] text-(--color-text-secondary) mb-4">{message}</p>
      <p className="text-[11px] text-(--color-text-tertiary) mb-6">{message3}</p>
      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 px-4 py-2 border border-(--color-border) text-(--color-text-primary) rounded-md text-[13px] font-medium hover:bg-(--color-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 cursor-pointer"
        >
          No thanks
        </button>
        <button
          onClick={onOptIn}
          className="flex-1 px-4 py-2 bg-(--color-accent) text-white rounded-md text-[13px] font-medium hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 cursor-pointer"
        >
          Yes, include me!
        </button>
      </div>
    </div>
  );
}
