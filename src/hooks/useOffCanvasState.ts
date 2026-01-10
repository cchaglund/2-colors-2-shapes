import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'off-canvas-state';

function loadOffCanvasState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
  } catch {
    // Ignore storage errors
  }
  return false; // Default to off-canvas shapes hidden
}

function saveOffCanvasState(showOffCanvas: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(showOffCanvas));
  } catch {
    // Ignore storage errors
  }
}

export function useOffCanvasState() {
  const [showOffCanvas, setShowOffCanvasState] = useState<boolean>(loadOffCanvasState);

  // Save to localStorage when state changes
  useEffect(() => {
    saveOffCanvasState(showOffCanvas);
  }, [showOffCanvas]);

  const setShowOffCanvas = useCallback((value: boolean) => {
    setShowOffCanvasState(value);
  }, []);

  const toggleOffCanvas = useCallback(() => {
    setShowOffCanvasState((prev) => !prev);
  }, []);

  return {
    showOffCanvas,
    setShowOffCanvas,
    toggleOffCanvas,
  };
}
