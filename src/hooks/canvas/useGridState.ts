import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'grid-state';

function loadGridState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true' || stored === 'false') {
      return stored === 'true';
    }
  } catch {
    // Ignore storage errors
  }
  return false; // Default to grid hidden
}

function saveGridState(showGrid: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(showGrid));
  } catch {
    // Ignore storage errors
  }
}

export function useGridState() {
  const [showGrid, setShowGridState] = useState<boolean>(loadGridState);

  // Save to localStorage when state changes
  useEffect(() => {
    saveGridState(showGrid);
  }, [showGrid]);

  const setShowGrid = useCallback((value: boolean) => {
    setShowGridState(value);
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGridState((prev) => !prev);
  }, []);

  return {
    showGrid,
    setShowGrid,
    toggleGrid,
  };
}
