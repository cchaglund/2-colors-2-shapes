import { useState, useCallback } from 'react';

export type TourStep = 'challenge' | 'add-shape' | 'manipulate' | 'colors' | 'submit';

const STEP_ORDER: TourStep[] = ['challenge', 'add-shape', 'manipulate', 'colors', 'submit'];
const STORAGE_KEY = 'tour-completed';

function shouldShowTour(): boolean {
  if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  } catch {
    return false;
  }
}

function completeTour(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {}
}

export function useTour() {
  const [active, setActive] = useState(() => shouldShowTour());
  const [step, setStep] = useState<TourStep>('challenge');

  const next = useCallback(() => {
    setStep(prev => {
      const currentIndex = STEP_ORDER.indexOf(prev);
      if (currentIndex === STEP_ORDER.length - 1) {
        completeTour();
        setActive(false);
        return 'challenge';
      }
      return STEP_ORDER[currentIndex + 1];
    });
  }, []);

  const skip = useCallback(() => {
    completeTour();
    setActive(false);
    setStep('challenge');
  }, []);

  const replay = useCallback(() => {
    setStep('challenge');
    setActive(true);
  }, []);

  return { active, step, next, skip, replay };
}
