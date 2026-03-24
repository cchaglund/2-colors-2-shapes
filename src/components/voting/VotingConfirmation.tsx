import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useDailyChallenge } from '../../hooks/challenge/useDailyChallenge';
import { fetchWallSubmissions, type WallSubmission } from '../../hooks/challenge/useWallOfTheDay';
import { Button } from '../shared/Button';
import { SubmissionThumbnail } from '../shared/SubmissionThumbnail';
import type { VotingConfirmationProps } from './types';

export function VotingConfirmation({
  isEntered,
  wallDate,
  // TODO: re-enable continue voting
  // canContinueVoting,
  // onContinue,
  onDone,
  userId,
}: VotingConfirmationProps) {
  const wallUrl = `?view=gallery&tab=wall&date=${wallDate}`;
  const { challenge } = useDailyChallenge(wallDate);
  const [previewSubmissions, setPreviewSubmissions] = useState<WallSubmission[]>([]);

  useEffect(() => {
    fetchWallSubmissions(wallDate).then((all) => {
      const others = all.filter((s) => s.user_id !== userId).slice(0, 6);
      setPreviewSubmissions(others);
    });
  }, [wallDate, userId]);

  return (
    <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-(--radius-lg) shadow-(--shadow-modal) p-6 w-full max-w-sm mx-auto text-center">
      {isEntered ? (
        <>
          <div className="text-3xl mb-3">🎉</div>
          <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary) mb-1">
            Your art has been entered!
          </h2>
          <p className="text-sm text-(--color-text-secondary) mb-2">
            Tomorrow users will be able to vote on your artwork, with winners announced the following day.
          </p>
          <p className="text-sm text-(--color-text-secondary) mb-5">
            Thanks for participating!
          </p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-(--radius-pill) bg-(--color-accent-subtle) flex items-center justify-center mx-auto mb-4">
            <Check size={24} color="var(--color-accent)" />
          </div>
          <h2 id="voting-title" className="text-xl font-semibold text-(--color-text-primary) mb-1">
            Artwork saved!
          </h2>
          <p className="text-sm text-(--color-text-secondary) mb-5">
            Your artwork has been saved to your gallery.
          </p>
        </>
      )}

      <div className="flex flex-col gap-3 w-full">
        <div className="flex gap-3 w-full">
          {/* TODO: re-enable continue voting
          {canContinueVoting && (
            <Button variant="secondary" fullWidth size='md' onClick={onContinue}>
              Continue Voting
            </Button>
          )}
          */}
          <Button variant="primary" fullWidth size="md" onClick={onDone}>
            Done
          </Button>
        </div>

        {challenge && previewSubmissions.length > 0 && (
          <div className="flex flex-col gap-2 mt-3 pt-3">
            <div className="w-[65%] mx-auto border-t border-(--color-border)/40 mb-3" />
            <Button as="a" variant="link" href={wallUrl}>
              See what others submitted:
            </Button>
            <div className="overflow-hidden rounded-(--radius-sm)">
              <div className="grid grid-cols-3 gap-1.5">
                {previewSubmissions.map((s) => (
                  <div key={s.id} className="aspect-square">
                    <SubmissionThumbnail
                      shapes={s.shapes}
                      groups={s.groups}
                      challenge={challenge}
                      backgroundColorIndex={s.background_color_index}
                      fill
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
