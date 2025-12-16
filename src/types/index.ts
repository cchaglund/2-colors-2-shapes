export type ShapeType = 'circle' | 'square' | 'triangle' | 'pentagon' | 'hexagon' | 'star';

export interface Shape {
  id: string;
  type: ShapeType;
  name: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  colorIndex: 0 | 1; // Index into the daily colors array
  zIndex: number;
}

export interface DailyChallenge {
  date: string; // YYYY-MM-DD format
  colors: [string, string];
  shapes: [ShapeType, ShapeType];
}

export interface CanvasState {
  shapes: Shape[];
  backgroundColorIndex: 0 | 1 | null; // null means transparent/white
  selectedShapeIds: Set<string>; // Set of selected shape IDs for multi-select
}

export interface ViewportState {
  zoom: number; // 1 = 100%, 0.5 = 50%, 2 = 200%
  panX: number; // Pan offset in SVG coordinates
  panY: number;
}

export interface AppState {
  challenge: DailyChallenge;
  canvas: CanvasState;
}
