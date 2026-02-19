import { useEffect, type RefObject } from 'react';
import { CANVAS_SIZE } from '../../types/canvas';

/**
 * Hook for handling Ctrl/Cmd + scroll wheel zoom
 */
export function useWheelZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  onZoomAtPoint: (delta: number, pointX: number, pointY: number) => void
) {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      // Check for Ctrl (Windows/Linux) or Meta/Cmd (Mac)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        // Get position relative to SVG element, normalized to 0-CANVAS_SIZE range
        const point = {
          x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
          y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
        };
        // Normalize wheel delta (different browsers have different values)
        const delta = -Math.sign(e.deltaY);
        onZoomAtPoint(delta, point.x, point.y);
      }
    };

    // Add non-passive event listener to allow preventDefault
    svg.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [svgRef, onZoomAtPoint]);
}
