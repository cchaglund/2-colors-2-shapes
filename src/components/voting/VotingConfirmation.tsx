import type { VotingConfirmationProps } from './types';

export function VotingConfirmation({
  isEntered,
  wallDate,
  canContinueVoting,
  onContinue,
  onDone,
}: VotingConfirmationProps) {
  const wallUrl = `?view=wall-of-the-day&date=${wallDate}`;

  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6 w-full max-w-sm text-center">
      {isEntered ? (
        <>
          <div className="text-3xl mb-3">🎉</div>
          <h2 id="voting-title" className="text-lg font-semibold text-(--color-text-primary) mb-1">
            Your art has been entered!
          </h2>
          <p className="text-[13px] text-(--color-text-secondary) mb-2">
            Tomorrow users will be able to vote on your artwork, with winners announced the following day.
          </p>
          <p className="text-[13px] text-(--color-text-secondary) mb-5">
            Thanks for participating!
          </p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-(--color-accent-subtle) flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 id="voting-title" className="text-lg font-semibold text-(--color-text-primary) mb-1">
            Artwork saved!
          </h2>
          <p className="text-[13px] text-(--color-text-secondary) mb-5">
            Your artwork has been saved to your gallery.
          </p>
        </>
      )}
      <div className="flex flex-col gap-2">
        {canContinueVoting && (
          <button
            onClick={onContinue}
            className="w-full px-4 py-2 border border-(--color-border) text-[13px] text-(--color-text-primary) rounded-md font-medium hover:bg-(--color-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 cursor-pointer"
          >
            Continue Voting
          </button>
        )}
        <button
          onClick={onDone}
          className="w-full px-4 py-2 bg-(--color-accent) text-white text-[13px] rounded-md font-medium hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 cursor-pointer"
        >
          Done
        </button>
        <a
          href={wallUrl}
          className="w-full px-4 py-2 border border-(--color-border) text-[13px] text-(--color-text-primary) rounded-md font-medium hover:bg-(--color-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 text-center"
        >
          See what others submitted
        </a>
      </div>
    </div>
  );
}
