import { useSyncExternalStore } from 'react';

/**
 * Reactive hook that returns true when the viewport is at least `minWidth` px wide.
 * Uses matchMedia + useSyncExternalStore for tear-free reads.
 */
export function useBreakpoint(minWidth: number): boolean {
  const query = `(min-width: ${minWidth}px)`;

  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.matchMedia(query).matches,
    () => true, // SSR fallback: assume desktop
  );
}

/** Shorthand: true when viewport >= 768px */
export function useIsDesktop(): boolean {
  return useBreakpoint(768);
}
