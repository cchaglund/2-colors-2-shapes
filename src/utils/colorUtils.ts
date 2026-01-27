/**
 * Parse HSL color string to [h, s, l] values
 * Format: "hsl(h, s%, l%)"
 */
function parseHsl(hslStr: string): [number, number, number] | null {
  const match = hslStr.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)/i);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])];
  }
  return null;
}

/**
 * Convert HSL to RGB
 * h: 0-360, s: 0-100, l: 0-100
 * Returns [r, g, b] where each is 0-255
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
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

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

/**
 * Parse hex color to RGB values
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * Calculate relative luminance from RGB using WCAG formula
 * Returns 0-1 where 0 is darkest, 1 is lightest
 */
function calculateLuminance(r: number, g: number, b: number): number {
  const [rL, gL, bL] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

/**
 * Get perceived luminance of a color (works with both HSL and hex)
 * Returns value 0-1 where 0 is darkest, 1 is lightest
 */
function getLuminance(color: string): number {
  let rgb: [number, number, number];

  if (color.startsWith('hsl')) {
    const hsl = parseHsl(color);
    if (!hsl) return 0.5;
    rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
  } else {
    rgb = hexToRgb(color);
  }

  return calculateLuminance(rgb[0], rgb[1], rgb[2]);
}

/**
 * Given two colors, return which is darker and which is lighter
 */
export function getDarkerLighterColors(
  colors: [string, string]
): { darker: string; lighter: string } {
  const l0 = getLuminance(colors[0]);
  const l1 = getLuminance(colors[1]);
  return l0 < l1
    ? { darker: colors[0], lighter: colors[1] }
    : { darker: colors[1], lighter: colors[0] };
}
