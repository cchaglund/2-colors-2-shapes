import { useContext } from 'react';
import { CanvasEditorContext } from './CanvasEditorContext';
import type { CanvasEditorContextValue } from './CanvasEditorContext';

export function useCanvasEditor(): CanvasEditorContextValue {
  const ctx = useContext(CanvasEditorContext);
  if (!ctx) throw new Error('useCanvasEditor must be used within CanvasEditorProvider');
  return ctx;
}
