import { SubmissionThumbnail } from '../SubmissionThumbnail';
import type { VotingPairViewProps } from './types';

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function VotingPairView({
  currentPair,
  challenge,
  challengeDate,
  voteCount,
  requiredVotes,
  submitting,
  onVote,
  onSkip,
  onSkipVoting,
}: VotingPairViewProps) {
  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 w-full max-w-3xl shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary)">
            Vote on Yesterday's Submissions
          </h2>
          <p className="text-sm text-(--color-text-secondary)">{formatDate(challengeDate)}</p>
          <p className="text-sm text-(--color-text-tertiary) mt-1">
            Word of the day was: <span className="italic">"{challenge.word}"</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-(--color-text-primary)">
            {voteCount} of {requiredVotes} votes
          </div>
          <div className="text-xs text-(--color-text-tertiary)">
            {requiredVotes - voteCount > 0
              ? `${requiredVotes - voteCount} more to enter ranking`
              : 'Entered in ranking!'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-(--color-bg-tertiary) rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-(--color-accent) transition-all duration-300"
          style={{ width: `${requiredVotes > 0 ? Math.min((voteCount / requiredVotes) * 100, 100) : 100}%` }}
        />
      </div>

      {/* Side by side comparison */}
      <div className="flex justify-center gap-6 mb-6">
        <button
          onClick={() => onVote(currentPair.submissionA.id)}
          disabled={submitting}
          className="group relative border-2 border-(--color-border) rounded-xl overflow-hidden hover:border-(--color-accent) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SubmissionThumbnail
            shapes={currentPair.submissionA.shapes}
            challenge={challenge}
            backgroundColorIndex={currentPair.submissionA.background_color_index}
            size={280}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-(--color-accent)/80 text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Choose this one
          </div>
        </button>

        <button
          onClick={() => onVote(currentPair.submissionB.id)}
          disabled={submitting}
          className="group relative border-2 border-(--color-border) rounded-xl overflow-hidden hover:border-(--color-accent) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SubmissionThumbnail
            shapes={currentPair.submissionB.shapes}
            challenge={challenge}
            backgroundColorIndex={currentPair.submissionB.background_color_index}
            size={280}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-(--color-accent)/80 text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Choose this one
          </div>
        </button>
      </div>

      {/* Voting guidance */}
      <p className="text-xs text-center text-(--color-text-tertiary) mb-4">
        Vote for whichever you prefer! You might consider creativity, composition, or interpretation of the daily word.
      </p>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={onSkipVoting}
          className="text-sm text-(--color-text-tertiary) hover:text-(--color-text-secondary) transition-colors"
        >
          Skip voting (won't enter ranking)
        </button>
        <button
          onClick={onSkip}
          disabled={submitting}
          className="px-4 py-2 text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors disabled:opacity-50"
        >
          Can't decide, skip this pair
        </button>
      </div>
    </div>
  );
}
