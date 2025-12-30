import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a touch device
 */
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check for touch capability
    const hasTouchScreen =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-expect-error - msMaxTouchPoints is IE-specific
      navigator.msMaxTouchPoints > 0;

    setIsTouchDevice(hasTouchScreen);
  }, []);

  return isTouchDevice;
}
