import type { DailyChallenge, ShapeType } from '../types';

// Simple seeded random number generator (mulberry32)
function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert date string to numeric seed
function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Generate a random HSL color
function generateColor(random: () => number): string {
  const hue = Math.floor(random() * 360);
  const saturation = 50 + Math.floor(random() * 40); // 50-90%
  const lightness = 35 + Math.floor(random() * 35); // 35-70%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Calculate color distance (simplified perceptual distance in HSL space)
function colorDistance(color1: string, color2: string): number {
  const parseHSL = (hsl: string) => {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return { h: 0, s: 0, l: 0 };
    return {
      h: parseInt(match[1]),
      s: parseInt(match[2]),
      l: parseInt(match[3]),
    };
  };

  const c1 = parseHSL(color1);
  const c2 = parseHSL(color2);

  // Hue distance (circular)
  let hueDiff = Math.abs(c1.h - c2.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  // Weighted distance - hue matters most, then lightness, then saturation
  const hueWeight = 2;
  const lightnessWeight = 1.5;
  const saturationWeight = 0.5;

  return Math.sqrt(
    Math.pow(hueDiff * hueWeight, 2) +
      Math.pow((c1.l - c2.l) * lightnessWeight, 2) +
      Math.pow((c1.s - c2.s) * saturationWeight, 2)
  );
}

// Generate two sufficiently different colors
function generateDistinctColors(random: () => number): [string, string] {
  const minDistance = 80; // Minimum perceptual distance
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const color1 = generateColor(random);
    const color2 = generateColor(random);

    if (colorDistance(color1, color2) >= minDistance) {
      return [color1, color2];
    }
    attempts++;
  }

  // Fallback: generate complementary colors
  const hue = Math.floor(random() * 360);
  const sat = 60 + Math.floor(random() * 30);
  return [
    `hsl(${hue}, ${sat}%, 45%)`,
    `hsl(${(hue + 180) % 360}, ${sat}%, 55%)`,
  ];
}

const ALL_SHAPES: ShapeType[] = [
  'circle',
  'square',
  'triangle',
  'pentagon',
  'hexagon',
  'star',
];

// Generate two different shapes
function generateShapes(random: () => number): [ShapeType, ShapeType] {
  const shuffled = [...ALL_SHAPES].sort(() => random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

// Get today's date in YYYY-MM-DD format
export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Generate the daily challenge for a given date
export function generateDailyChallenge(dateStr: string): DailyChallenge {
  const seed = dateToSeed(dateStr);
  const random = seededRandom(seed);

  return {
    date: dateStr,
    colors: generateDistinctColors(random),
    shapes: generateShapes(random),
  };
}

// Get today's challenge
export function getTodayChallenge(): DailyChallenge {
  return generateDailyChallenge(getTodayDate());
}
