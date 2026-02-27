import { InfoTooltip } from '../shared/InfoTooltip';
import { SubmissionThumbnail } from '../shared/SubmissionThumbnail';
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
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-(--radius-lg) w-full max-w-3xl">
      {/* Header banner */}
      <div className="px-6 py-5 border-b border-(--color-border-light) bg-(--color-bg-tertiary)">
        <h2 className="text-center text-(--text-xl) font-semibold text-(--color-text-primary) mb-2">
          Your art has been saved!
        </h2>
        <p className="text-(--text-sm) text-(--color-text-secondary) text-center max-w-md mx-auto mb-4">
          Compete for the leaderboard by voting on others' submissions. Vote to participate, or skip if you prefer not to enter today.
        </p>
        <div className="flex justify-center">
          <button
            className="py-2 px-4 border border-(--color-border) rounded-(--radius-md) cursor-pointer text-(--text-sm) font-medium transition-colors bg-(--color-bg-primary) text-(--color-danger) hover:bg-(--color-danger) hover:text-(--color-accent-text) hover:border-(--color-danger)"
            onClick={onSkipVoting}
          >
            Skip participation
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 id="voting-title" className="text-(--text-lg) font-semibold text-(--color-text-primary) flex items-center gap-1">
              Vote on Yesterday's Submissions
              <InfoTooltip text="By voting you submit your artwork for the competition and it will be visible for others to vote on tomorrow. Winners are announced the following day." />
            </h3>
            <p className="text-(--text-sm) text-(--color-text-secondary)">{formatDate(challengeDate)}</p>
            <p className="text-(--text-sm) text-(--color-text-tertiary) mt-0.5">
              Word of the day was: <span className="font-medium">"{challenge.word}"</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-(--text-sm) font-medium text-(--color-text-primary) tabular-nums">
              {voteCount} of {requiredVotes} votes
            </div>
            <div className="text-(--text-xs) text-(--color-text-tertiary)">
              {requiredVotes - voteCount > 0
                ? `${requiredVotes - voteCount} more to enter ranking`
                : 'Entered in ranking!'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-(--color-bg-tertiary) rounded-(--radius-pill) mb-6 overflow-hidden">
          <div
            className="h-full bg-(--color-accent) transition-all duration-300"
            style={{ width: `${requiredVotes > 0 ? Math.min((voteCount / requiredVotes) * 100, 100) : 100}%` }}
          />
        </div>

        {/* Voting guidance */}
        <p className="text-(--text-sm) text-center font-medium text-(--color-text-secondary) py-4">
          Which of these two submissions do you prefer?
        </p>

        {/* Side by side comparison */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => onVote(currentPair.submissionA.id)}
            disabled={submitting}
            className="cursor-pointer group relative border border-(--color-border) rounded-(--radius-lg) overflow-hidden hover:border-(--color-accent) transition-all focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SubmissionThumbnail
              shapes={currentPair.submissionA.shapes}
              groups={currentPair.submissionA.groups}
              challenge={challenge}
              backgroundColorIndex={currentPair.submissionA.background_color_index}
              size={260}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-(--color-accent)/85 text-(--color-accent-text) text-(--text-sm) font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Choose this one
            </div>
          </button>

          <button
            onClick={() => onVote(currentPair.submissionB.id)}
            disabled={submitting}
            className="cursor-pointer group relative border border-(--color-border) rounded-(--radius-lg) overflow-hidden hover:border-(--color-accent) transition-all focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SubmissionThumbnail
              shapes={currentPair.submissionB.shapes}
              groups={currentPair.submissionB.groups}
              challenge={challenge}
              backgroundColorIndex={currentPair.submissionB.background_color_index}
              size={260}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-(--color-accent)/85 text-(--color-accent-text) text-(--text-sm) font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Choose this one
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={onSkip}
            disabled={submitting}
            className="cursor-pointer px-3 py-1.5 text-(--text-sm) text-(--color-text-tertiary) hover:text-(--color-text-secondary) transition-colors disabled:opacity-50"
          >
            Can't decide, skip this pair
          </button>
        </div>
      </div>
    </div>
  );
}
