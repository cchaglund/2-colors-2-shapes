import { useCallback, type RefObject } from 'react';
import { CANVAS_SIZE } from '../../types/canvas';

/**
 * Hook for converting between client coordinates and SVG/canvas coordinates
 */
export function useCanvasCoordinates(svgRef: RefObject<SVGSVGElement | null>) {
  // Convert client coordinates to SVG/canvas coordinates
  // When using viewBox, getScreenCTM already accounts for the viewBox transform
  const getSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      // The viewBox transform is already applied by getScreenCTM
      return { x: svgP.x, y: svgP.y };
    },
    [svgRef]
  );

  // Get client coordinates relative to the SVG element (for zoom center calculation)
  const getClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      // Return position relative to SVG element, normalized to 0-CANVAS_SIZE range
      return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
        y: ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
      };
    },
    [svgRef]
  );

  return { getSVGPoint, getClientPoint, CANVAS_SIZE };
}
