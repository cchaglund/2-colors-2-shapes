import { useState, useRef, useEffect } from 'react';
import type { ViewportState } from '../../types';
import type { KeyMappings } from '../../constants/keyboardActions';

/**
 * Hook for handling spacebar panning mode
 */
export function useCanvasPanning(
  viewport: ViewportState,
  keyMappings: KeyMappings,
  getClientPoint: (clientX: number, clientY: number) => { x: number; y: number },
  onPan: (panX: number, panY: number) => void
) {
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Handle spacebar for panning mode
  useEffect(() => {
    const panBinding = keyMappings.pan;
    const panKey = panBinding?.key || 'Space';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === panKey && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === panKey) {
        setIsSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyMappings.pan]);

  // Handle panning when space is pressed
  useEffect(() => {
    if (!isSpacePressed) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!isSpacePressed) return;
      e.preventDefault();
      setIsPanning(true);
      const point = getClientPoint(e.clientX, e.clientY);
      panStartRef.current = {
        x: point.x,
        y: point.y,
        panX: viewport.panX,
        panY: viewport.panY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !panStartRef.current) return;
      const point = getClientPoint(e.clientX, e.clientY);
      const dx = point.x - panStartRef.current.x;
      const dy = point.y - panStartRef.current.y;
      onPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSpacePressed, isPanning, viewport.panX, viewport.panY, getClientPoint, onPan]);

  // Cursor style based on panning state
  const cursorStyle = isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default';

  return { isSpacePressed, isPanning, cursorStyle };
}
