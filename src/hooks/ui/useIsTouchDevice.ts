import { useState } from 'react';

/**
 * Hook to detect if the user is on a touch device
 */
export function useIsTouchDevice() {
  const [isTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Check for touch capability
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE-specific
      navigator.msMaxTouchPoints > 0
    );
  });

  return isTouchDevice;
}
