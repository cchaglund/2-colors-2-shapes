import { useState, useCallback, useRef } from 'react';
import type { CanvasState } from '../../types';

const MAX_HISTORY = 50;
const COALESCE_MS = 300;

export function useCanvasHistory(initialState: CanvasState) {
  const historyRef = useRef<CanvasState[]>([initialState]);
  const historyLabelsRef = useRef<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);
  const isUndoRedoRef = useRef(false);
  const lastHistoryTimeRef = useRef(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  const pushHistory = useCallback((state: CanvasState, label = 'Edit') => {
    if (isUndoRedoRef.current) return;

    const now = Date.now();
    const shouldCoalesce = now - lastHistoryTimeRef.current < COALESCE_MS;
    lastHistoryTimeRef.current = now;

    setHistoryIndex((currentIndex) => {
      if (shouldCoalesce && currentIndex > 0) {
        historyRef.current[currentIndex] = state;
        historyLabelsRef.current[currentIndex] = label;
        return currentIndex;
      }

      // Remove any future history if we're not at the end
      historyRef.current = historyRef.current.slice(0, currentIndex + 1);
      historyLabelsRef.current = historyLabelsRef.current.slice(0, currentIndex + 1);
      historyRef.current.push(state);
      historyLabelsRef.current.push(label);

      // Limit history size
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current = historyRef.current.slice(1);
        historyLabelsRef.current = historyLabelsRef.current.slice(1);
        setHistoryLength(historyRef.current.length);
        return currentIndex; // Index stays same when we trim from start
      } else {
        setHistoryLength(historyRef.current.length);
        return currentIndex + 1;
      }
    });
  }, []);

  /**
   * Commit a specific state snapshot to history unconditionally (no coalescing check).
   * Used after drag operations complete to ensure the final state is recorded.
   */
  const commitToHistory = useCallback((state: CanvasState, label = 'Edit') => {
    setHistoryIndex((currentIndex) => {
      historyRef.current = historyRef.current.slice(0, currentIndex + 1);
      historyLabelsRef.current = historyLabelsRef.current.slice(0, currentIndex + 1);
      historyRef.current.push(state);
      historyLabelsRef.current.push(label);

      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current = historyRef.current.slice(1);
        historyLabelsRef.current = historyLabelsRef.current.slice(1);
        setHistoryLength(historyRef.current.length);
        return currentIndex;
      } else {
        setHistoryLength(historyRef.current.length);
        return currentIndex + 1;
      }
    });
    lastHistoryTimeRef.current = Date.now();
  }, []);

  const undo = useCallback((onRestore: (state: CanvasState, label: string) => void): void => {
    setHistoryIndex((currentIndex) => {
      if (currentIndex > 0) {
        isUndoRedoRef.current = true;
        const newIndex = currentIndex - 1;
        onRestore(historyRef.current[newIndex], historyLabelsRef.current[currentIndex]);
        setTimeout(() => {
          isUndoRedoRef.current = false;
        }, 0);
        return newIndex;
      }
      return currentIndex;
    });
  }, []);

  const redo = useCallback((onRestore: (state: CanvasState, label: string) => void): void => {
    setHistoryIndex((currentIndex) => {
      if (currentIndex < historyRef.current.length - 1) {
        isUndoRedoRef.current = true;
        const newIndex = currentIndex + 1;
        onRestore(historyRef.current[newIndex], historyLabelsRef.current[newIndex]);
        setTimeout(() => {
          isUndoRedoRef.current = false;
        }, 0);
        return newIndex;
      }
      return currentIndex;
    });
  }, []);

  /** Reset history to a single state (used when loading external canvas state). */
  const resetHistory = useCallback((state: CanvasState) => {
    historyRef.current = [state];
    historyLabelsRef.current = [''];
    setHistoryIndex(0);
    setHistoryLength(1);
  }, []);

  return {
    pushHistory,
    commitToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
}
