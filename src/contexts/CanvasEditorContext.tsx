import { CanvasEditorContext } from './canvasEditorContextDef';
import type { CanvasEditorContextValue } from './canvasEditorContextDef';

export function CanvasEditorProvider({ value, children }: { value: CanvasEditorContextValue; children: React.ReactNode }) {
  return <CanvasEditorContext.Provider value={value}>{children}</CanvasEditorContext.Provider>;
}

export { CanvasEditorContext };
export type { CanvasEditorContextValue };
