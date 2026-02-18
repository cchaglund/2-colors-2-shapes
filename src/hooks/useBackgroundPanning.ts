import { useState, useRef, useEffect, useCallback, type RefObject } from 'react';
import { CANVAS_SIZE } from '../types/canvas';

interface UseBackgroundPanningOptions {
  mainRef: RefObject<HTMLElement | null>;
  panX: number;
  panY: number;
  setPan: (panX: number, panY: number) => void;
}

/**
 * Hook for handling background panning (clicking on checkerboard area)
 */
export function useBackgroundPanning({
  mainRef,
  panX,
  panY,
  setPan,
}: UseBackgroundPanningOptions) {
  const [isBackgroundPanning, setIsBackgroundPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Get client coordinates relative to the main element, normalized to canvas size
  const getClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!mainRef.current) return { x: 0, y: 0 };
      const canvasElement = mainRef.current.querySelector('svg');
      if (!canvasElement) return { x: 0, y: 0 };
      const rect = canvasElement.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
        y: ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
      };
    },
    [mainRef]
  );

  const handleBackgroundMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      // Only trigger if clicking directly on the main element (the checkerboard background)
      // or the wrapper div, not on the canvas itself
      if (e.target === mainRef.current || (e.target as HTMLElement).classList.contains('canvas-wrapper')) {
        e.preventDefault();
        setIsBackgroundPanning(true);
        const point = getClientPoint(e.clientX, e.clientY);
        panStartRef.current = {
          x: point.x,
          y: point.y,
          panX,
          panY,
        };
      }
    },
    [getClientPoint, panX, panY, mainRef]
  );

  // Handle background panning mouse move and mouse up
  useEffect(() => {
    if (!isBackgroundPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isBackgroundPanning || !panStartRef.current) return;
      const point = getClientPoint(e.clientX, e.clientY);
      const dx = point.x - panStartRef.current.x;
      const dy = point.y - panStartRef.current.y;
      setPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
    };

    const handleMouseUp = () => {
      setIsBackgroundPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isBackgroundPanning, getClientPoint, setPan]);

  return {
    isBackgroundPanning,
    handleBackgroundMouseDown,
  };
}
