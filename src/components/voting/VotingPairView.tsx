import { InfoTooltip } from '../InfoTooltip';
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

      <div className="bg-(--color-bg-secondary) p-4 rounded-lg mb-10 space-y-4 flex flex-col pb-6">
        <h2 className="text-center text-xl font-semibold text-(--color-text-primary)">
          Your art has been saved!
        </h2>

        <p className='text-xs'>
          Every day you can compete to win a spot on the leaderboard by voting on others' submissions. To participate, you need to cast a certain number of votes. If you prefer not to vote today, you can choose to skip participation.
        </p>

        <button
          className={`m-auto center py-2.5 px-4 text-white border-none rounded-md cursor-pointer text-sm font-medium transition-colors bg-(--color-danger) hover:bg-(--color-danger-hover) `}
          onClick={onSkipVoting}
        >
          Skip participation
        </button>
      </div>


      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary) flex items-center">
            Vote on Yesterday's Submissions
            <InfoTooltip text="By voting you submit your artwork for the competition and it will be visible for others to vote on tomorrow. Winners are announced the following day." />
          </h2>
          <p className="text-sm text-(--color-text-secondary)">{formatDate(challengeDate)}</p>
          <p className="text-sm text-(--color-text-tertiary) mt-1">
            Word of the day was: <strong>"{challenge.word}"</strong>
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

      {/* Voting guidance */}
      <p className="text-m text-center font-bold text-(--color-text-tertiary) py-6">
        Which of these two submissions do you prefer?
      </p>

      {/* Side by side comparison */}
      <div className="flex justify-center gap-6 mb-6">
        <button
          onClick={() => onVote(currentPair.submissionA.id)}
          disabled={submitting}
          className="cursor-pointer group relative border-2 border-(--color-border) rounded-xl overflow-hidden hover:border-(--color-accent) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="cursor-pointer group relative border-2 border-(--color-border) rounded-xl overflow-hidden hover:border-(--color-accent) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Actions */}
      <div className="flex justify-between items-center">
        {/* <button
          onClick={onSkipVoting}
          className="text-sm text-(--color-text-tertiary) hover:text-(--color-text-secondary) transition-colors"
        >
          Skip voting (won't enter ranking)
        </button> */}
        {/* <button
          className={` py-2.5 px-4 text-white border-none rounded-md cursor-pointer text-sm font-medium transition-colors bg-(--color-danger) hover:bg-(--color-danger-hover) `}
          onClick={onSkipVoting}
        >
          Skip voting (won't enter ranking)
        </button> */}
        <button
          onClick={onSkip}
          disabled={submitting}
          className="ml-auto cursor-pointer px-4 py-2 text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors disabled:opacity-50"
        >
          Can't decide, skip this pair
        </button>
      </div>

      {/* <div>
        <p className='text-xs pt-3 max-w-125'>
          Your art has been saved! If you don't want to submit it for the competition just click the "skip voting" button. But to participate in the competition you need to contribute with votes! 
        </p>
      </div> */}
    </div>
  );
}
