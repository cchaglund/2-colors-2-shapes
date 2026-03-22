// Shared color picking logic used by both the edge function and ColorTester.
// Picks the 3 most perceptually diverse colors from a 5-color palette.

/** All 10 possible 3-element combinations from [0..4] */
export const ALL_COMBOS: [number, number, number][] = [
  [0,1,2],[0,1,3],[0,1,4],[0,2,3],[0,2,4],
  [0,3,4],[1,2,3],[1,2,4],[1,3,4],[2,3,4],
];

// ---------------------------------------------------------------------------
// Color conversion helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

/** Convert hex to HSL. H in [0,360), S and L in [0,1]. */
function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;

  return [h, s, l];
}

/** Circular hue distance in degrees, range [0, 180]. */
function hueDist(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2);
  return d > 180 ? 360 - d : d;
}

/**
 * Perceptual distance between two colors.
 * Weighted combination of hue, saturation, and lightness differences.
 * Hue is weighted most heavily since the user cares about hue diversity.
 */
function colorDistance(hex1: string, hex2: string): number {
  const [h1, s1, l1] = hexToHsl(hex1);
  const [h2, s2, l2] = hexToHsl(hex2);

  // Normalize hue distance to [0,1] (180° = max distance)
  const hDist = hueDist(h1, h2) / 180;
  const sDist = Math.abs(s1 - s2);
  const lDist = Math.abs(l1 - l2);

  // Weight hue most, then lightness, then saturation.
  // Desaturated colors (low chroma) make hue less meaningful,
  // so scale hue contribution by average saturation.
  const avgSat = (s1 + s2) / 2;
  const effectiveHue = hDist * (0.3 + 0.7 * avgSat); // hue matters less when grey

  return effectiveHue * 3.0 + lDist * 2.0 + sDist * 1.0;
}

/**
 * Score a combination of 3 colors by summing all pairwise distances.
 * Higher = more diverse / contrasting.
 */
function comboScore(colors: string[]): number {
  return (
    colorDistance(colors[0], colors[1]) +
    colorDistance(colors[0], colors[2]) +
    colorDistance(colors[1], colors[2])
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Convert hex color to relative luminance (WCAG 2.x) */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio between two hex colors (1 to 21) */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Pick the 3 most perceptually diverse colors from a 5-color palette.
 * Deterministic — always returns the same result for the same palette.
 */
export function pickMostContrasting3(palette: string[]): {
  colors: string[];
  pickedIndices: [number, number, number];
} {
  let bestScore = -1;
  let bestCombo: [number, number, number] = ALL_COMBOS[0];

  for (const combo of ALL_COMBOS) {
    const colors = combo.map(i => palette[i]);
    const score = comboScore(colors);
    if (score > bestScore) {
      bestScore = score;
      bestCombo = combo;
    }
  }

  return {
    colors: bestCombo.map(i => palette[i]),
    pickedIndices: bestCombo,
  };
}
