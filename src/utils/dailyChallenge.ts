import type { DailyChallenge, ShapeType, ChallengeShapeData } from '../types';
import { getShapeSVGData, SHAPE_NAMES } from './shapeHelpers';

// =============================================================================
// Shape Data Helpers
// =============================================================================

function createShapeData(type: ShapeType): ChallengeShapeData {
  const svgData = getShapeSVGData(type, 100);
  let svg: string;

  if (svgData.element === 'path') {
    svg = svgData.props.d as string;
  } else if (svgData.element === 'polygon') {
    const points = (svgData.props.points as string).split(' ').map(p => p.split(',').map(Number));
    const [first, ...rest] = points;
    svg = `M ${first[0]},${first[1]} ${rest.map(([x, y]) => `L ${x},${y}`).join(' ')} Z`;
  } else if (svgData.element === 'rect') {
    const { x, y, width, height } = svgData.props as { x: number; y: number; width: number; height: number };
    svg = `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`;
  } else if (svgData.element === 'ellipse') {
    const { cx, cy, rx, ry } = svgData.props as { cx: number; cy: number; rx: number; ry: number };
    svg = `M ${cx},${cy - ry} A ${rx},${ry} 0 1 1 ${cx},${cy + ry} A ${rx},${ry} 0 1 1 ${cx},${cy - ry} Z`;
  } else {
    svg = 'M 0,0 L 100,0 L 100,100 L 0,100 Z';
  }

  return { type, name: SHAPE_NAMES[type], svg };
}

// =============================================================================
// Random Generation
// =============================================================================

function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateColor(random: () => number): string {
  const hue = Math.floor(random() * 360);
  const saturation = 50 + Math.floor(random() * 40);
  const lightness = 35 + Math.floor(random() * 35);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function parseHSL(hsl: string): { h: number; s: number; l: number } {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return { h: 0, s: 0, l: 0 };
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3]),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const c1 = parseHSL(color1);
  const c2 = parseHSL(color2);
  const rgb1 = hslToRgb(c1.h, c1.s, c1.l);
  const rgb2 = hslToRgb(c2.h, c2.s, c2.l);
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function colorDistance(color1: string, color2: string): number {
  const c1 = parseHSL(color1);
  const c2 = parseHSL(color2);

  let hueDiff = Math.abs(c1.h - c2.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  return Math.sqrt(
    Math.pow(hueDiff * 2, 2) +
    Math.pow((c1.l - c2.l) * 1.5, 2) +
    Math.pow((c1.s - c2.s) * 0.5, 2)
  );
}

function generateDistinctColors(random: () => number): [string, string] {
  const minDistance = 80;
  const minContrastRatio = 3.0; // WCAG AA for large graphical objects
  const minHueDiff = 30; // Ensure colors look distinctly different

  for (let i = 0; i < 100; i++) {
    const color1 = generateColor(random);
    const color2 = generateColor(random);

    // Check perceptual distance
    if (colorDistance(color1, color2) < minDistance) continue;

    // Check WCAG contrast ratio
    if (getContrastRatio(color1, color2) < minContrastRatio) continue;

    // Check hue difference to avoid colors that look too similar
    const c1 = parseHSL(color1);
    const c2 = parseHSL(color2);
    let hueDiff = Math.abs(c1.h - c2.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;
    if (hueDiff < minHueDiff) continue;

    return [color1, color2];
  }

  // Fallback: generate complementary colors with good contrast
  const hue = Math.floor(random() * 360);
  const sat = 60 + Math.floor(random() * 30);
  // Use significantly different lightness values to ensure contrast
  return [`hsl(${hue}, ${sat}%, 35%)`, `hsl(${(hue + 180) % 360}, ${sat}%, 65%)`];
}

const ALL_SHAPES: ShapeType[] = [
  'circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star',
  'rightTriangle', 'isoscelesTriangle', 'diamond', 'trapezoid',
  'parallelogram', 'kite', 'heptagon', 'cross', 'arrow',
  'semicircle', 'quarterCircle', 'ellipse', 'blade', 'lens',
  'arch', 'drop', 'shard', 'wedge', 'fan', 'hook', 'wave',
  'crescent', 'pill', 'splinter', 'chunk', 'fang', 'claw',
  'fin', 'thorn', 'slant', 'notch', 'spike', 'bulge', 'scoop', 'ridge',
];

function generateShapes(random: () => number): [ShapeType, ShapeType] {
  const shuffled = [...ALL_SHAPES].sort(() => random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

// =============================================================================
// Date Utilities (exported for use elsewhere)
// =============================================================================

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getTwoDaysAgoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return d.toISOString().split('T')[0];
}

// =============================================================================
// Challenge Generation (client-side fallback only)
// The server generates the actual challenges - this is used when offline
// =============================================================================

const challengeCache = new Map<string, DailyChallenge>();

export function generateDailyChallenge(dateStr: string): DailyChallenge {
  const cached = challengeCache.get(dateStr);
  if (cached) return cached;

  const seed = dateToSeed(dateStr);
  const random = seededRandom(seed);

  const challenge: DailyChallenge = {
    date: dateStr,
    colors: generateDistinctColors(random),
    shapes: [
      createShapeData(generateShapes(random)[0]),
      createShapeData(generateShapes(random)[1]),
    ],
  };

  // Re-generate shapes with fresh random to match server behavior
  const random2 = seededRandom(seed);
  generateDistinctColors(random2); // consume same random calls as colors
  const shapes = generateShapes(random2);
  challenge.shapes = [createShapeData(shapes[0]), createShapeData(shapes[1])];

  challengeCache.set(dateStr, challenge);
  return challenge;
}

export function getTodayChallenge(): DailyChallenge {
  return generateDailyChallenge(getTodayDate());
}
