import { useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { RankingEntry } from '../../types';
import { useDailyChallenge } from '../../hooks/challenge/useDailyChallenge';
import { WinnerCard } from '../submission/WinnerCard';
import { Modal } from '../shared/Modal';
import { PillButton } from '../shared/PillButton';

const CONFETTI_DURATION_MS = 6_000;
const CONFETTI_INTERVAL_MS = 300;

interface CongratulatoryModalProps {
  userEntry: RankingEntry;
  challengeDate: string;
  onDismiss: () => void;
}

const HEADINGS: Record<number, string> = {
  1: 'You won!',
  2: '2nd Place!',
  3: '3rd Place!',
};

const SUBTEXTS: Record<number, string> = {
  1: '1st place — Congratulations!',
  2: 'Congratulations!',
  3: 'Congratulations!',
};

export function CongratulatoryModal({
  userEntry,
  challengeDate,
  onDismiss,
}: CongratulatoryModalProps) {
  const { challenge, loading: challengeLoading } = useDailyChallenge(challengeDate);

  // Confetti refs and dismiss handler
  const confettiInstance = useRef<confetti.CreateTypes | null>(null);
  const stopConfetti = useCallback(() => {
    confettiInstance.current?.reset();
    confettiInstance.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    stopConfetti();
    onDismiss();
  }, [stopConfetti, onDismiss]);

  // Confetti: continuous bursts for 6s, skip if prefers-reduced-motion
  useEffect(() => {
    if (challengeLoading) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const instance = confetti.create(undefined, { resize: true });
    confettiInstance.current = instance;

    const fireConfetti = () => {
      instance({
        particleCount: 30,
        spread: 70,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        zIndex: 100,
      });
    };

    fireConfetti();
    const interval = setInterval(fireConfetti, CONFETTI_INTERVAL_MS);
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, CONFETTI_DURATION_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      instance.reset();
      confettiInstance.current = null;
    };
  }, [challengeLoading]);

  // Show loading state while challenge is being fetched
  if (challengeLoading || !challenge) {
    return (
      <Modal onClose={handleDismiss} closeOnBackdropClick={false} dataTestId="congratulatory-modal">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 border-(--color-text-tertiary) border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[13px] text-(--color-text-secondary)">Loading...</p>
        </div>
      </Modal>
    );
  }

  const heading = HEADINGS[userEntry.rank] ?? `#${userEntry.rank}`;
  const subtext = SUBTEXTS[userEntry.rank] ?? 'Congratulations!';

  return (
    <Modal onClose={handleDismiss} ariaLabelledBy="congrats-title" dataTestId="congratulatory-modal">
      <div className="text-center mb-5">
        <h2 id="congrats-title" className="text-lg font-semibold text-(--color-text-primary) mb-0.5">
          {heading}
        </h2>
        <p className="text-[13px] text-(--color-text-secondary)">{subtext}</p>
      </div>

      <div className="flex justify-center mb-5">
        <WinnerCard
          entry={userEntry}
          challenge={challenge}
          size="lg"
        />
      </div>

      <PillButton variant="primary" fullWidth onClick={handleDismiss}>
        Yay!
      </PillButton>
    </Modal>
  );
}
