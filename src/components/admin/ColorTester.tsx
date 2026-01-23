import { useState, useCallback } from 'react';

// Types for generation settings
type HarmonyMode = 'random' | 'complementary' | 'split-complementary' | 'triadic' | 'analogous' | 'square';
type ColorSpace = 'hsl' | 'oklch';

interface GenerationSettings {
  harmonyMode: HarmonyMode;
  colorSpace: ColorSpace;
  excludeMuddyHues: boolean;
  forceContrast: boolean; // Ensure one light + one dark color
}

interface OKLCH {
  l: number; // 0-1 (lightness)
  c: number; // 0-0.4 (chroma)
  h: number; // 0-360 (hue)
}

// Copy of the color generation logic from dailyChallenge.ts for testing
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

// OKLCH conversion functions for perceptually uniform color generation
function oklchToRgb(oklch: OKLCH): { r: number; g: number; b: number } {
  const { l: L, c: C, h: H } = oklch;

  // OKLCH to OKLab
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);

  // OKLab to LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Cube
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS to linear RGB
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bVal = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Gamma correction
  r = r <= 0.0031308 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : 1.055 * Math.pow(g, 1 / 2.4) - 0.055;
  bVal = bVal <= 0.0031308 ? 12.92 * bVal : 1.055 * Math.pow(bVal, 1 / 2.4) - 0.055;

  return {
    r: Math.round(Math.max(0, Math.min(255, r * 255))),
    g: Math.round(Math.max(0, Math.min(255, g * 255))),
    b: Math.round(Math.max(0, Math.min(255, bVal * 255))),
  };
}

function oklchToHsl(oklch: OKLCH): string {
  const rgb = oklchToRgb(oklch);
  // Convert RGB to HSL for display consistency
  const r = rgb.r / 255,
    g = rgb.g / 255,
    b = rgb.b / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// Muddy hue detection
function isMuddyHue(hue: number): boolean {
  // Muddy range: ~30-60 degrees (browns, muddy yellows/oranges)
  return hue >= 30 && hue <= 60;
}

function generateSafeHue(excludeMuddy: boolean): number {
  if (!excludeMuddy) {
    return Math.floor(Math.random() * 360);
  }
  // Generate hue outside muddy range (0-29 or 61-359)
  const safe = Math.floor(Math.random() * 329);
  return safe < 30 ? safe : safe + 31;
}

// Harmony offsets in degrees
const HARMONY_OFFSETS: Record<HarmonyMode, number[]> = {
  random: [],
  complementary: [180],
  'split-complementary': [150, 210],
  triadic: [120, 240],
  analogous: [30, -30],
  square: [90, 180, 270],
};

// lightnessHint: 'light' | 'dark' | null - when forceContrast is on
function generateColorWithSettings(
  baseHue: number | null,
  settings: GenerationSettings,
  lightnessHint?: 'light' | 'dark'
): string {
  const hue = baseHue ?? generateSafeHue(settings.excludeMuddyHues);

  if (settings.colorSpace === 'oklch') {
    let l: number;
    if (lightnessHint === 'light') {
      l = 0.70 + Math.random() * 0.2; // 0.70-0.90 (light)
    } else if (lightnessHint === 'dark') {
      l = 0.45 + Math.random() * 0.15; // 0.45-0.60 (dark) - not too dark, keeps color
    } else {
      l = 0.45 + Math.random() * 0.35; // 0.45-0.80 (default)
    }
    const c = 0.07 + Math.random() * 0.93; // 0.12-0.25 chroma (higher floor for vibrancy)
    return oklchToHsl({ l, c, h: hue });
  } else {
    // HSL
    let lightness: number;
    if (lightnessHint === 'light') {
      lightness = 55 + Math.floor(Math.random() * 20); // 55-75% (light)
    } else if (lightnessHint === 'dark') {
      lightness = 25 + Math.floor(Math.random() * 20); // 25-45% (dark)
    } else {
      lightness = 35 + Math.floor(Math.random() * 35); // 35-70% (default)
    }
    const saturation = 50 + Math.floor(Math.random() * 40);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}

function generateDistinctColorsWithSettings(settings: GenerationSettings): [string, string] {
  const minDistance = 80;
  const minContrastRatio = 2; // Relaxed from 3.0 for more colorful darks
  const minHueDiff = 30;

  // When forceContrast is on, pick light/dark assignment randomly
  const firstIsLight = Math.random() > 0.5;
  const hint1 = settings.forceContrast ? (firstIsLight ? 'light' : 'dark') : undefined;
  const hint2 = settings.forceContrast ? (firstIsLight ? 'dark' : 'light') : undefined;

  if (settings.harmonyMode !== 'random') {
    // Harmony-based generation
    const offsets = HARMONY_OFFSETS[settings.harmonyMode];

    for (let i = 0; i < 50; i++) {
      const baseHue = generateSafeHue(settings.excludeMuddyHues);
      const offset = offsets[Math.floor(Math.random() * offsets.length)];
      const secondHue = (baseHue + offset + 360) % 360;

      // Skip if second hue lands in muddy range
      if (settings.excludeMuddyHues && isMuddyHue(secondHue)) continue;

      const color1 = generateColorWithSettings(baseHue, settings, hint1);
      const color2 = generateColorWithSettings(secondHue, settings, hint2);

      if (colorDistance(color1, color2) < minDistance) continue;
      if (getContrastRatio(color1, color2) < minContrastRatio) continue;

      return [color1, color2];
    }

    // Fallback: use complementary with forced contrast
    const hue = generateSafeHue(settings.excludeMuddyHues);
    return [
      generateColorWithSettings(hue, settings, hint1 ?? 'dark'),
      generateColorWithSettings((hue + 180) % 360, settings, hint2 ?? 'light'),
    ];
  }

  // Random mode (existing behavior with settings applied)
  for (let i = 0; i < 100; i++) {
    const hue1 = generateSafeHue(settings.excludeMuddyHues);
    const hue2 = generateSafeHue(settings.excludeMuddyHues);

    const color1 = generateColorWithSettings(hue1, settings, hint1);
    const color2 = generateColorWithSettings(hue2, settings, hint2);

    if (colorDistance(color1, color2) < minDistance) continue;
    if (getContrastRatio(color1, color2) < minContrastRatio) continue;

    const c1 = parseHSL(color1);
    const c2 = parseHSL(color2);
    let hueDiff = Math.abs(c1.h - c2.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;
    if (hueDiff < minHueDiff) continue;

    return [color1, color2];
  }

  // Fallback
  const hue = generateSafeHue(settings.excludeMuddyHues);
  const sat = 60 + Math.floor(Math.random() * 30);
  return [`hsl(${hue}, ${sat}%, 35%)`, `hsl(${(hue + 180) % 360}, ${sat}%, 65%)`];
}

export function ColorTester() {
  const [colors, setColors] = useState<[string, string] | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>({
    harmonyMode: 'random',
    colorSpace: 'hsl',
    excludeMuddyHues: false,
    forceContrast: false,
  });
  const [activeSettings, setActiveSettings] = useState<GenerationSettings | null>(null);
  const [history, setHistory] = useState<[string, string][]>([]);

  const handleGenerate = useCallback(() => {
    const newColors = generateDistinctColorsWithSettings(settings);
    setColors(newColors);
    setActiveSettings({ ...settings });
    setHistory((prev) => [newColors, ...prev]);
  }, [settings]);

  const contrastRatio = colors ? getContrastRatio(colors[0], colors[1]) : null;
  const distance = colors ? colorDistance(colors[0], colors[1]) : null;
  const hueDiff = colors
    ? (() => {
        const c1 = parseHSL(colors[0]);
        const c2 = parseHSL(colors[1]);
        let diff = Math.abs(c1.h - c2.h);
        if (diff > 180) diff = 360 - diff;
        return diff;
      })()
    : null;

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-(--color-bg-primary)">
      <div className="max-w-lg w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-(--color-text-primary)">Color Tester</h1>
          <p className="text-sm text-(--color-text-secondary)">
            Test the color generation algorithm. Access via{' '}
            <code className="px-2 py-1 rounded text-xs bg-(--color-bg-tertiary)">?colors</code> URL
            parameter.
          </p>
        </header>

        <div className="flex flex-col items-center gap-6">
          {/* Settings Panel */}
          <div className="w-full p-4 rounded-lg bg-(--color-bg-secondary)">
            {/* Harmony Mode */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-(--color-text-primary)">
                Harmony Mode
              </label>
              <select
                value={settings.harmonyMode}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, harmonyMode: e.target.value as HarmonyMode }))
                }
                className="w-full px-3 py-2 rounded-lg border text-sm bg-(--color-bg-tertiary) border-(--color-border) text-(--color-text-primary)"
              >
                <option value="random">Random (current behavior)</option>
                <option value="complementary">Complementary (180° apart)</option>
                <option value="split-complementary">Split-complementary (~150° apart)</option>
                <option value="triadic">Triadic (120° apart)</option>
                <option value="analogous">Analogous (30° apart)</option>
                <option value="square">Square (90° apart)</option>
              </select>
            </div>

            {/* Color Space */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-(--color-text-primary)">
                Color Space
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="colorSpace"
                    value="hsl"
                    checked={settings.colorSpace === 'hsl'}
                    onChange={() => setSettings((s) => ({ ...s, colorSpace: 'hsl' }))}
                    className="accent-(--color-accent)"
                  />
                  <span className="text-sm text-(--color-text-secondary)">HSL</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="colorSpace"
                    value="oklch"
                    checked={settings.colorSpace === 'oklch'}
                    onChange={() => setSettings((s) => ({ ...s, colorSpace: 'oklch' }))}
                    className="accent-(--color-accent)"
                  />
                  <span className="text-sm text-(--color-text-secondary)">
                    OKLCH (perceptually uniform)
                  </span>
                </label>
              </div>
            </div>

            {/* Exclude Muddy Hues */}
            <div className="mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.excludeMuddyHues}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, excludeMuddyHues: e.target.checked }))
                  }
                  className="accent-(--color-accent)"
                />
                <span className="text-sm text-(--color-text-secondary)">
                  Exclude muddy hues (30-60°)
                </span>
              </label>
            </div>

            {/* Force Contrast */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.forceContrast}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, forceContrast: e.target.checked }))
                  }
                  className="accent-(--color-accent)"
                />
                <span className="text-sm text-(--color-text-secondary)">
                  Force contrast (one light + one dark)
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="px-6 py-3 rounded-lg font-medium text-lg cursor-pointer transition-opacity bg-(--color-text-primary) text-(--color-bg-primary) hover:opacity-80"
          >
            Generate Colors
          </button>

          <div className="relative w-64 h-48 flex items-center justify-center">
            {colors ? (
              <>
                {/* First circle - left */}
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 150 150"
                  className="absolute left-5"
                >
                  <circle cx="75" cy="75" r="70" fill={colors[0]} stroke="none" />
                </svg>
                {/* Second circle - right, overlapping */}
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 150 150"
                  className="absolute right-5"
                >
                  <circle cx="75" cy="75" r="70" fill={colors[1]} stroke="none" />
                </svg>
              </>
            ) : (
              <p className="text-(--color-text-tertiary)">
                Click the button to generate colors
              </p>
            )}
          </div>

          {colors && (
            <div className="w-full p-4 rounded-lg bg-(--color-bg-secondary)">
              <h3 className="text-sm font-semibold mb-3 text-(--color-text-primary)">
                Color Details
              </h3>
              <div className="space-y-2 text-sm text-(--color-text-secondary)">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: colors[0] }}
                  />
                  <code>{colors[0]}</code>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: colors[1] }}
                  />
                  <code>{colors[1]}</code>
                </div>
                <hr className="border-(--color-border) my-3" />
                <div>
                  <strong>Contrast Ratio:</strong> {contrastRatio?.toFixed(2)}:1
                  {contrastRatio && contrastRatio >= 3.0 && (
                    <span className="ml-2 text-green-500">(passes WCAG)</span>
                  )}
                </div>
                <div>
                  <strong>Perceptual Distance:</strong> {distance?.toFixed(1)}
                </div>
                <div>
                  <strong>Hue Difference:</strong> {hueDiff?.toFixed(0)}°
                </div>
                {activeSettings && (
                  <>
                    <hr className="border-(--color-border) my-3" />
                    <div className="text-xs text-(--color-text-tertiary)">
                      Generated with: {activeSettings.harmonyMode} /{' '}
                      {activeSettings.colorSpace.toUpperCase()}
                      {activeSettings.excludeMuddyHues && ' / no muddy'}
                      {activeSettings.forceContrast && ' / forced contrast'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        {history.length > 1 && (
          <div className="mt-8 pt-6 border-t border-(--color-border)">
            <h2 className="text-lg font-semibold mb-4 text-(--color-text-primary)">History</h2>
            <div className="flex flex-wrap gap-4">
              {history.slice(1).map((pair, index) => (
                <div key={index} className="relative w-24 h-16 flex items-center justify-center">
                  <svg width="50" height="50" viewBox="0 0 50 50" className="absolute left-2">
                    <circle cx="25" cy="25" r="23" fill={pair[0]} stroke="none" />
                  </svg>
                  <svg width="50" height="50" viewBox="0 0 50 50" className="absolute right-2">
                    <circle cx="25" cy="25" r="23" fill={pair[1]} stroke="none" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-8 pt-6 border-t text-center text-sm border-(--color-border) text-(--color-text-tertiary)">
          <p>
            <a
              href="/"
              className="underline hover:no-underline text-(--color-text-secondary)"
            >
              Return to main app
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
