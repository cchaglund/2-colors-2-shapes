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
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6 w-full max-w-md text-center">
      {hasVotedEnough ? (
        <>
          <div className="w-12 h-12 rounded-full bg-(--color-accent-subtle) flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 id="voting-title" className="text-lg font-semibold text-(--color-text-primary) mb-2">
            Your art has been entered!
          </h2>
          <p className="text-[13px] text-(--color-text-secondary) mb-2">
            Tomorrow users will be able to vote on your artwork, with winners announced the following day.
          </p>
          <p className="text-[13px] text-(--color-text-secondary) mb-6">
            Thanks for participating!
          </p>
        </>
      ) : (
        <>
          <h2 id="voting-title" className="text-lg font-semibold text-(--color-text-primary) mb-2">
            No More Pairs
          </h2>
          <p className="text-[13px] text-(--color-text-secondary) mb-4">
            You've seen all available artwork pairs for {formatDate(challengeDate)}.
          </p>
          <p className="text-[11px] text-(--color-text-tertiary) mb-6">
            You voted on {voteCount} pair{voteCount !== 1 ? 's' : ''}.
            {requiredVotes > voteCount && ` Needed ${requiredVotes} to enter ranking.`}
          </p>
        </>
      )}
      <button
        onClick={hasVotedEnough ? onDone : onSkipVoting}
        className="w-full px-4 py-2 bg-(--color-accent) text-white rounded-md text-[13px] font-medium hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 cursor-pointer"
      >
        {hasVotedEnough ? 'Done' : 'Continue Without Ranking'}
      </button>
    </div>
  );
}
