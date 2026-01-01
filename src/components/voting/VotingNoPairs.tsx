import type { VotingNoPairsProps } from './types';

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function VotingNoPairs({
  voteCount,
  requiredVotes,
  challengeDate,
  onDone,
  onSkipVoting,
}: VotingNoPairsProps) {
  const hasVotedEnough = voteCount >= requiredVotes;

  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 w-full max-w-md shadow-xl text-center">
      {hasVotedEnough ? (
        <>
          <div className="text-4xl mb-4">🎉</div>
          <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary) mb-2">
            All Done!
          </h2>
          <p className="text-(--color-text-secondary) mb-6">
            You've voted on all available pairs. Your artwork is entered in today's ranking!
          </p>
        </>
      ) : (
        <>
          <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary) mb-2">
            No More Pairs
          </h2>
          <p className="text-(--color-text-secondary) mb-4">
            You've seen all available artwork pairs for {formatDate(challengeDate)}.
          </p>
          <p className="text-(--color-text-tertiary) text-sm mb-6">
            You voted on {voteCount} pair{voteCount !== 1 ? 's' : ''}.
            {requiredVotes > voteCount && ` Needed ${requiredVotes} to enter ranking.`}
          </p>
        </>
      )}
      <button
        onClick={hasVotedEnough ? onDone : onSkipVoting}
        className="w-full px-4 py-2.5 bg-(--color-accent) text-white rounded-lg font-medium hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
      >
        {hasVotedEnough ? 'Done' : 'Continue Without Ranking'}
      </button>
    </div>
  );
}
