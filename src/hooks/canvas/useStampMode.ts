import { useState, useCallback, useRef, useEffect } from 'react';
import type { EditorTool } from '../../components/canvas/BottomToolbar';

interface StampDragState {
  startClientX: number;
  startClientY: number;
  canvasX: number;
  canvasY: number;
}

export interface StampGhost {
  x: number;
  y: number;
}

interface UseStampModeOptions {
  editorTool: EditorTool;
  selectedColorIndex: number;
  getSVGPoint: (clientX: number, clientY: number) => { x: number; y: number };
  onAddShape: (shapeIndex: number, colorIndex: number, options?: { x?: number; y?: number; size?: number }) => void;
  onSetTool: (tool: EditorTool) => void;
}

const DEFAULT_STAMP_SIZE = 60;
const MIN_STAMP_SIZE = 20;
/** Minimum drag distance (px) to distinguish drag-to-size from click-to-place */
const DRAG_THRESHOLD = 5;

export function useStampMode({
  editorTool,
  selectedColorIndex,
  getSVGPoint,
  onAddShape,
  onSetTool,
}: UseStampModeOptions) {
  const isStampMode = editorTool.startsWith('stamp-');
  const shapeIndex = isStampMode ? parseInt(editorTool.split('-')[1], 10) : -1;

  const [ghost, setGhost] = useState<StampGhost | null>(null);
  const dragRef = useRef<StampDragState | null>(null);
  const ghostRef = useRef<StampGhost | null>(null);

  // Track mouse move over SVG for ghost cursor
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isStampMode || dragRef.current) return;
      const point = getSVGPoint(e.clientX, e.clientY);
      const g = { x: point.x, y: point.y };
      ghostRef.current = g;
      setGhost(g);
    },
    [isStampMode, getSVGPoint]
  );

  const handleMouseLeave = useCallback(() => {
    if (!dragRef.current) {
      ghostRef.current = null;
      setGhost(null);
    }
  }, []);

  // Mouse down: start stamp placement (or drag-to-size)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isStampMode || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const point = getSVGPoint(e.clientX, e.clientY);
      dragRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        canvasX: point.x,
        canvasY: point.y,
      };
      // Hide ghost during potential drag
      ghostRef.current = null;
      setGhost(null);
    },
    [isStampMode, getSVGPoint]
  );

  // Window-level mousemove/mouseup for drag-to-size
  useEffect(() => {
    if (!isStampMode) {
      dragRef.current = null;
      return;
    }

    const handleWindowMouseUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;

      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      const clientDist = Math.sqrt(dx * dx + dy * dy);

      if (clientDist < DRAG_THRESHOLD) {
        // Click-to-place: default size, centered on click
        onAddShape(shapeIndex, selectedColorIndex, {
          x: drag.canvasX,
          y: drag.canvasY,
          size: DEFAULT_STAMP_SIZE,
        });
      } else {
        // Drag-to-size: use canvas-coordinate distance for size
        const endPoint = getSVGPoint(e.clientX, e.clientY);
        const canvasDx = endPoint.x - drag.canvasX;
        const canvasDy = endPoint.y - drag.canvasY;
        const canvasDist = Math.sqrt(canvasDx * canvasDx + canvasDy * canvasDy);
        const size = Math.max(MIN_STAMP_SIZE, canvasDist * 2);
        onAddShape(shapeIndex, selectedColorIndex, {
          x: drag.canvasX,
          y: drag.canvasY,
          size,
        });
      }

      // Restore ghost at current mouse position
      const point = getSVGPoint(e.clientX, e.clientY);
      const g = { x: point.x, y: point.y };
      ghostRef.current = g;
      setGhost(g);
    };

    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [isStampMode, shapeIndex, selectedColorIndex, getSVGPoint, onAddShape]);

  // Esc / V to exit stamp mode
  useEffect(() => {
    if (!isStampMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape' || e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        onSetTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStampMode, onSetTool]);

  return {
    isStampMode,
    shapeIndex,
    ghost,
    handleMouseMove,
    handleMouseLeave,
    handleMouseDown,
  };
}
