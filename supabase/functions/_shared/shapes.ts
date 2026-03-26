// =============================================================================
// Shape Master List — single source of truth
// =============================================================================
// All shape types and their display names live here. Both the edge function
// and the frontend derive their types from this file.
//
// To add a new shape:
//   1. Add it to SHAPE_NAMES below
//   2. Add its SVG path/rendering in src/utils/shapes/
//   3. Optionally add it to shapeSimilarityGroups.ts
// =============================================================================

/**
 * Canonical mapping of every shape key to its human-readable name.
 * The keys of this object ARE the shape universe — nothing else is needed.
 */
export const SHAPE_NAMES = {
  // Basic shapes
  circle: 'Circle',
  square: 'Square',
  triangle: 'Triangle',
  pentagon: 'Pentagon',
  hexagon: 'Hexagon',
  star: 'Star',
  // Sophisticated shapes
  rightTriangle: 'Right Triangle',
  trapezoid: 'Trapezoid',
  parallelogram: 'Parallelogram',
  kite: 'Kite',
  heptagon: 'Heptagon',
  cross: 'Cross',
  arrow: 'Arrow',
  semicircle: 'Semicircle',
  quarterCircle: 'Quarter Circle',
  ellipse: 'Ellipse',
  lens: 'Lens',
  arch: 'Arch',
  // Irregular abstract shapes
  wedge: 'Wedge',
  wave: 'Wave',
  hook: 'Hook',
  crescent: 'Crescent',
  pill: 'Pill',
  splinter: 'Splinter',
  // Mixed straight/curved shapes
  fang: 'Fang',
  fin: 'Fin',
  keyhole: 'Keyhole',
  notch: 'Notch',
  drop: 'Drop',
  scoop: 'Scoop',
  ridge: 'Ridge',
  bean: 'Bean',
  hourglass: 'Hourglass',
  claw: 'Claw',
} as const;

/** Union of all valid shape type strings. */
export type ShapeType = keyof typeof SHAPE_NAMES;

/** Flat array of every shape type — derived from SHAPE_NAMES so it's always in sync. */
export const ALL_SHAPES: ShapeType[] = Object.keys(SHAPE_NAMES) as ShapeType[];
