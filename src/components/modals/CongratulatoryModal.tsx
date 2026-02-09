import { useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { RankingEntry } from '../../types';
import { useDailyChallenge } from '../../hooks/useDailyChallenge';
import { WinnerCard } from '../WinnerCard';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
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

  // Focus the button when modal opens and trap focus
  useEffect(() => {
    if (!challengeLoading) {
      buttonRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
      // Trap focus within the modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [challengeLoading, handleDismiss]);

  // Show loading state while challenge is being fetched
  if (challengeLoading || !challenge) {
    return (
      <div
        className="fixed inset-0 bg-(--color-modal-overlay) flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6">
          <div className="text-center">
            <div className="inline-block w-6 h-6 border-2 border-(--color-text-tertiary) border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-(--color-text-secondary)">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const heading = HEADINGS[userEntry.rank] ?? `#${userEntry.rank}`;
  const subtext = SUBTEXTS[userEntry.rank] ?? 'Congratulations!';

  return (
    <div
      className="fixed inset-0 bg-(--color-modal-overlay) flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="congrats-title"
    >
      <div
        ref={modalRef}
        className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6 w-full max-w-lg mx-4"
      >
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

        <button
          ref={buttonRef}
          onClick={handleDismiss}
          className="w-full px-4 py-2 bg-(--color-accent) text-white text-[13px] rounded-md font-medium hover:bg-(--color-accent-hover) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2"
        >
          Yay!
        </button>
      </div>
    </div>
  );
}
