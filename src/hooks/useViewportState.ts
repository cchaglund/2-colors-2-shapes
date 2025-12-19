import { useState, useCallback } from 'react';
import type { ViewportState } from '../types';

const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 5; // 500%
const ZOOM_STEP = 0.05; // 5% per scroll notch (reduced from 10% for finer control)

const initialViewportState: ViewportState = {
  zoom: 1,
  panX: 0,
  panY: 0,
};

export function useViewportState() {
  const [viewport, setViewport] = useState<ViewportState>(initialViewportState);

  const setZoom = useCallback((zoom: number) => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)),
    }));
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    setViewport((prev) => ({
      ...prev,
      panX,
      panY,
    }));
  }, []);

  const zoomAtPoint = useCallback(
    (delta: number, pointX: number, pointY: number) => {
      setViewport((prev) => {
        const newZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, prev.zoom + delta * ZOOM_STEP)
        );

        if (newZoom === prev.zoom) return prev;

        // Zoom toward cursor: adjust pan so the point stays in the same position
        const zoomRatio = newZoom / prev.zoom;
        const newPanX = pointX - (pointX - prev.panX) * zoomRatio;
        const newPanY = pointY - (pointY - prev.panY) * zoomRatio;

        return {
          zoom: newZoom,
          panX: newPanX,
          panY: newPanY,
        };
      });
    },
    []
  );

  const resetViewport = useCallback(() => {
    setViewport(initialViewportState);
  }, []);

  return {
    viewport,
    setZoom,
    setPan,
    zoomAtPoint,
    resetViewport,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  };
}
