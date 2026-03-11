import { useState, useCallback, useEffect, useRef } from 'react';

export type HintId = 'left-toolbar' | 'gallery' | 'keyboard-shortcuts' | 'layers-panel';

const HINT_DELAY = 400;
const AUTO_DISMISS_MS = 8000;
const VISIT_COUNT_KEY = 'visit-count';
const GALLERY_HINT_DELAY = 5000;

function hasSeenHint(id: HintId): boolean {
  try {
    return localStorage.getItem(`hint-seen-${id}`) === 'true';
  } catch {
    return true;
  }
}

function markHintSeen(id: HintId): void {
  try {
    localStorage.setItem(`hint-seen-${id}`, 'true');
  } catch {}
}

function getAndIncrementVisitCount(): number {
  try {
    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

interface UseDiscoveryHintsOptions {
  tourActive: boolean;
}

export function useDiscoveryHints({ tourActive }: UseDiscoveryHintsOptions) {
  const [activeHint, setActiveHint] = useState<HintId | null>(null);
  const queueRef = useRef<HintId[]>([]);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const delayRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggeredRef = useRef<Set<HintId>>(new Set());

  const showHint = useCallback((id: HintId) => {
    if (hasSeenHint(id) || triggeredRef.current.has(id)) return;
    triggeredRef.current.add(id);

    setActiveHint(current => {
      if (current) {
        queueRef.current.push(id);
        return current;
      }
      return id;
    });
  }, []);

  const dismissHint = useCallback(() => {
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);

    setActiveHint(current => {
      if (current) markHintSeen(current);
      const next = queueRef.current.shift();
      if (next) {
        delayRef.current = setTimeout(() => setActiveHint(next), 300);
        return null;
      }
      return null;
    });
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (activeHint) {
      autoDismissRef.current = setTimeout(dismissHint, AUTO_DISMISS_MS);
      return () => {
        if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      };
    }
  }, [activeHint, dismissHint]);

  // Suppress hints during tour
  useEffect(() => {
    if (tourActive && activeHint) {
      setActiveHint(null);
      queueRef.current = [];
    }
  }, [tourActive, activeHint]);

  // Gallery hint — second visit
  useEffect(() => {
    if (tourActive) return;
    const visitCount = getAndIncrementVisitCount();
    if (visitCount === 2 && !hasSeenHint('gallery')) {
      const timer = setTimeout(() => showHint('gallery'), GALLERY_HINT_DELAY);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onShapeSelectionChange = useCallback((count: number) => {
    if (tourActive) return;
    if (count >= 2) {
      const timer = setTimeout(() => showHint('left-toolbar'), HINT_DELAY);
      return () => clearTimeout(timer);
    }
  }, [tourActive, showHint]);

  const onToolbarButtonClick = useCallback(() => {
    if (tourActive) return;
    setTimeout(() => showHint('keyboard-shortcuts'), HINT_DELAY);
  }, [tourActive, showHint]);

  const onShapeCountChange = useCallback((count: number) => {
    if (tourActive) return;
    if (count >= 3) {
      setTimeout(() => showHint('layers-panel'), HINT_DELAY);
    }
  }, [tourActive, showHint]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  return {
    activeHint,
    dismissHint,
    onShapeSelectionChange,
    onToolbarButtonClick,
    onShapeCountChange,
  };
}
