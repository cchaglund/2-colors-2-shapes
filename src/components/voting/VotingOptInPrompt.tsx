import { Image } from 'lucide-react';
import { Button } from '../shared/Button';
import type { VotingOptInPromptProps } from './types';

export function VotingOptInPrompt({ onOptIn, onSkip }: VotingOptInPromptProps) {
  const message = 'If you opt in, your artwork will be visible for others to vote on tomorrow. Winners are announced the following day.';
  const message3 = 'Your artwork has been saved to your gallery regardless of your choice.';

  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-(--radius-lg) shadow-(--shadow-modal) p-6 w-full max-w-md mx-auto text-center">
      <div className="w-12 h-12 rounded-(--radius-pill) bg-(--color-accent-subtle) flex items-center justify-center mx-auto mb-4">
        <Image size={24} color="var(--color-accent)" />
      </div>
      <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary) mb-2">
        Submit for Voting?
      </h2>
      <p className="text-sm text-(--color-text-secondary) mb-4">{message}</p>
      <p className="text-xs text-(--color-text-tertiary) mb-6">{message3}</p>
      <div className="flex gap-3">
        <Button variant="secondary" size="md" onClick={onSkip} className="flex-1">
          No thanks
        </Button>
        <Button variant="primary" size="md" onClick={onOptIn} className="flex-1">
          Yes, include me!
        </Button>
      </div>
    </div>
  );
}
