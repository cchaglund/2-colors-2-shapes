import type { VotingProgressProps } from './types';

export function VotingProgress({ voteCount, requiredVotes }: VotingProgressProps) {
  const percentage = requiredVotes > 0 ? Math.min((voteCount / requiredVotes) * 100, 100) : 100;
  const remaining = Math.max(0, requiredVotes - voteCount);

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <div className="text-right">
          <div className="text-(--text-base) font-medium text-(--color-text-primary)">
            {voteCount} of {requiredVotes} votes
          </div>
          <div className="text-(--text-xs) text-(--color-text-tertiary)">
            {remaining > 0 ? `${remaining} more to enter ranking` : 'Entered in ranking!'}
          </div>
        </div>
      </div>
      <div className="w-full h-2 bg-(--color-bg-tertiary) rounded-(--radius-pill) overflow-hidden">
        <div
          className="h-full bg-(--color-accent) transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
