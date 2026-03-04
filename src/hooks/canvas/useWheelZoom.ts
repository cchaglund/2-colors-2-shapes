import { useEffect, useRef, type RefObject } from 'react';
import type { ViewportState } from '../../types';
import { CANVAS_SIZE } from '../../types/canvas';

/**
 * Hook for handling scroll wheel zoom (Ctrl/Cmd+wheel) and trackpad panning (two-finger scroll)
 */
export function useWheelZoom(
  svgRef: RefObject<SVGSVGElement | null>,
  onZoomAtPoint: (delta: number, pointX: number, pointY: number) => void,
  onPan?: (panX: number, panY: number) => void,
  viewport?: ViewportState
) {
  // Refs to avoid re-registering listeners when viewport/callbacks change
  const onPanRef = useRef(onPan);
  onPanRef.current = onPan;
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const onZoomRef = useRef(onZoomAtPoint);
  onZoomRef.current = onZoomAtPoint;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      // Ctrl/Cmd + wheel → zoom
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        const point = {
          x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
          y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
        };
        const delta = -Math.sign(e.deltaY);
        onZoomRef.current(delta, point.x, point.y);
      } else if (onPanRef.current && viewportRef.current) {
        // Unmodified wheel → pan (two-finger trackpad scroll)
        e.preventDefault();
        const v = viewportRef.current;
        const panScale = 1 / v.zoom;
        onPanRef.current(
          v.panX - e.deltaX * panScale,
          v.panY - e.deltaY * panScale
        );
      }
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [svgRef]);
}
