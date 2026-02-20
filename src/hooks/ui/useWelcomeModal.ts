import { useState, useCallback } from 'react';

const STORAGE_KEY = 'welcome-modal-seen';

function hasSeenWelcomeModal(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // If localStorage is unavailable, don't show the modal repeatedly
    return false;
  }
}

function markWelcomeModalSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

export function useWelcomeModal() {
  const [isOpen, setIsOpen] = useState(() => !hasSeenWelcomeModal());

  const dismiss = useCallback(() => {
    markWelcomeModalSeen();
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    dismiss,
  };
}
