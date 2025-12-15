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
  selectedShapeId: string | null;
}

export interface AppState {
  challenge: DailyChallenge;
  canvas: CanvasState;
}
