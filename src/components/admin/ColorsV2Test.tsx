import { useState, useCallback, useRef } from 'react';

// =============================================================================
// Colors V2 Test Page — Local algorithm, no server dependency
// =============================================================================
// Implements the V2 color generation plan:
// 1. Harmony-based hue selection (triadic, complementary, split-complementary, analogous)
// 2. Random lightness/chroma per color (full OKLCH ranges)
// 3. Relaxed contrast check (at least 1 of 3 pairs >= 2.5)
// 4. No muddy hue exclusion
// 5. Consecutive-day distinction via harmony rule change
// =============================================================================

type HarmonyRule = 'triadic' | 'complementary' | 'split-complementary' | 'analogous';

const HARMONY_RULES: HarmonyRule[] = ['triadic', 'complementary', 'split-complementary', 'analogous'];

// --- OKLCH Config ---
const OKLCH_CONFIG = {
  // Lightness uses a bell-curve distribution (average of 2 random values)
  // so extremes (near-black, near-white) are rare but possible
  lightness: { min: 0.15, max: 0.92 },
  chroma: { min: 0.07, max: 0.5 },
  minContrastRatio: 2.5,
};

/**
 * Bell-curve-ish random: average of N uniform randoms.
 * With n=2 (triangular distribution), values cluster around the center
 * of the range. Extremes are possible but rare.
 * ~25% chance of landing in the outer 20% of the range.
 */
function bellRandom(random: () => number, n = 2): number {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += random();
  return sum / n;
}

// --- OKLCH → RGB/HSL Conversion (ported from edge function) ---

interface OKLCH {
  l: number;
  c: number;
  h: number;
}

function oklchToRgb(oklch: OKLCH): { r: number; g: number; b: number } {
  const { l, c, h } = oklch;
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLinear = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const toSrgb = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  return {
    r: Math.round(toSrgb(rLinear) * 255),
    g: Math.round(toSrgb(gLinear) * 255),
    b: Math.round(toSrgb(bLinear) * 255),
  };
}

function oklchToHsl(oklch: OKLCH): { h: number; s: number; l: number } {
  const rgb = oklchToRgb(oklch);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// --- Gamut mapping ---

function isOklchInGamut(l: number, c: number, h: number): boolean {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const rLinear = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const eps = 0.001;
  return rLinear >= -eps && rLinear <= 1 + eps &&
         gLinear >= -eps && gLinear <= 1 + eps &&
         bLinear >= -eps && bLinear <= 1 + eps;
}

function maxChromaInGamut(l: number, h: number): number {
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (isOklchInGamut(l, mid, h)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return lo;
}

// --- HSL utilities ---

function parseHSL(hsl: string): { h: number; s: number; l: number } {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return { h: 0, s: 0, l: 0 };
  return { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) };
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

// --- V2 Algorithm ---

function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

function generateHarmoniousHues(random: () => number, rule: HarmonyRule): [number, number, number] {
  const anchor = Math.floor(random() * 360);
  const jitter = () => (random() - 0.5) * 30; // +/-15 degrees

  switch (rule) {
    case 'triadic':
      return [anchor, normalizeHue(anchor + 120 + jitter()), normalizeHue(anchor + 240 + jitter())];
    case 'complementary':
      return [anchor, normalizeHue(anchor + 180 + jitter()), normalizeHue(anchor + 180 + jitter())];
    case 'split-complementary':
      return [anchor, normalizeHue(anchor + 150 + jitter()), normalizeHue(anchor + 210 + jitter())];
    case 'analogous':
      return [anchor, normalizeHue(anchor + 30 + jitter()), normalizeHue(anchor + 60 + jitter())];
  }
}

function generateColorWithOKLCH(random: () => number, hue: number): string {
  const { lightness, chroma } = OKLCH_CONFIG;
  const l = lightness.min + bellRandom(random) * (lightness.max - lightness.min);
  const maxC = maxChromaInGamut(l, hue);
  const effectiveMax = Math.min(chroma.max, maxC);
  const effectiveMin = Math.min(chroma.min, effectiveMax);
  const c = effectiveMin + random() * (effectiveMax - effectiveMin);
  const hsl = oklchToHsl({ l, c, h: hue });
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function pickHarmonyRule(random: () => number, excludeRule: HarmonyRule | null): HarmonyRule {
  const available = excludeRule
    ? HARMONY_RULES.filter(r => r !== excludeRule)
    : HARMONY_RULES;
  return available[Math.floor(random() * available.length)];
}

interface GenerationResult {
  colors: string[];
  rule: HarmonyRule;
  anchorHue: number;
  metadata: { pair: string; contrastRatio: number; hueDiff: number; distance: number }[];
}

function generatePalette(previousRule: HarmonyRule | null): GenerationResult {
  const random = () => Math.random();

  for (let attempt = 0; attempt < 100; attempt++) {
    const rule = pickHarmonyRule(random, previousRule);
    const hues = generateHarmoniousHues(random, rule);
    const colors = hues.map(hue => generateColorWithOKLCH(random, hue));

    // Relaxed contrast: require at least 1 of 3 pairs >= 2.5
    const pairs = [
      { pair: '1-2', contrastRatio: getContrastRatio(colors[0], colors[1]) },
      { pair: '1-3', contrastRatio: getContrastRatio(colors[0], colors[2]) },
      { pair: '2-3', contrastRatio: getContrastRatio(colors[1], colors[2]) },
    ];
    const passingPairs = pairs.filter(p => p.contrastRatio >= OKLCH_CONFIG.minContrastRatio).length;
    if (passingPairs < 1) continue;

    // Build metadata
    const metadata = pairs.map((p, i) => {
      const [a, b] = [[0,1],[0,2],[1,2]][i];
      const ca = parseHSL(colors[a]);
      const cb = parseHSL(colors[b]);
      let hueDiff = Math.abs(ca.h - cb.h);
      if (hueDiff > 180) hueDiff = 360 - hueDiff;
      return {
        pair: p.pair,
        contrastRatio: p.contrastRatio,
        hueDiff,
        distance: colorDistance(colors[a], colors[b]),
      };
    });

    return { colors, rule, anchorHue: hues[0], metadata };
  }

  // Fallback — just return whatever we get
  const rule = pickHarmonyRule(random, previousRule);
  const hues = generateHarmoniousHues(random, rule);
  const colors = hues.map(hue => generateColorWithOKLCH(random, hue));
  return { colors, rule, anchorHue: hues[0], metadata: [] };
}

// --- UI ---

interface HistoryEntry {
  colors: string[];
  rule: HarmonyRule;
  anchorHue: number;
}

const RULE_LABELS: Record<HarmonyRule, string> = {
  'triadic': 'Triadic',
  'complementary': 'Complementary',
  'split-complementary': 'Split Complementary',
  'analogous': 'Analogous',
};

export function ColorsV2Test() {
  const [current, setCurrent] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const previousRuleRef = useRef<HarmonyRule | null>(null);

  const handleGenerate = useCallback(() => {
    const result = generatePalette(previousRuleRef.current);
    setCurrent(result);
    setHistory(prev => [{ colors: result.colors, rule: result.rule, anchorHue: result.anchorHue }, ...prev]);
    previousRuleRef.current = result.rule;
  }, []);

  const handleClear = useCallback(() => {
    setHistory([]);
    setCurrent(null);
    previousRuleRef.current = null;
  }, []);

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-(--color-bg-primary)">
      <div className="max-w-lg w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-(--color-text-primary)">Colors V2 Test</h1>
          <p className="text-sm text-(--color-text-secondary)">
            Tests the <strong>V2 harmony-based</strong> color generation algorithm locally.
            Each click simulates a new day with a different harmony rule.
          </p>
        </header>

        <div className="flex flex-col items-center gap-6">
          {/* Algorithm Info */}
          <div className="w-full p-4 rounded-lg bg-(--color-bg-secondary)">
            <h3 className="text-sm font-semibold mb-2 text-(--color-text-primary)">V2 Settings</h3>
            <ul className="text-xs text-(--color-text-tertiary) space-y-1">
              <li>Color space: OKLCH (perceptually uniform)</li>
              <li>Hue selection: Harmony-based (triadic, complementary, split-comp, analogous)</li>
              <li>Lightness: 0.15 - 0.92 (bell-curve distribution, extremes rare)</li>
              <li>Chroma: 0.07 - 0.5 (random per color)</li>
              <li>No muddy hue exclusion</li>
              <li>Contrast: at least 1 of 3 pairs {'≥'} 2.5</li>
              <li>Consecutive day: harmony rule must differ</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              className="px-6 py-3 rounded-lg font-medium text-lg cursor-pointer transition-opacity bg-(--color-text-primary) text-(--color-bg-primary) hover:opacity-80"
            >
              Generate Colors
            </button>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="px-4 py-3 rounded-lg font-medium text-sm cursor-pointer transition-opacity bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:opacity-80"
              >
                Clear History
              </button>
            )}
          </div>

          {/* Current Palette */}
          <div className="flex items-center justify-center py-4">
            {current ? (
              <svg width="240" height="235" viewBox="0 0 240 235">
                <circle cx="80" cy="80" r="75" fill={current.colors[0]} stroke="none" />
                <circle cx="160" cy="80" r="75" fill={current.colors[1]} stroke="none" />
                <circle cx="120" cy="158" r="75" fill={current.colors[2]} stroke="none" />
              </svg>
            ) : (
              <p className="text-(--color-text-tertiary)">Click the button to generate colors</p>
            )}
          </div>

          {/* Current Details */}
          {current && (
            <div className="w-full p-4 rounded-lg bg-(--color-bg-secondary)">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-(--color-text-primary)">Details</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-(--color-bg-tertiary) text-(--color-text-secondary)">
                  {RULE_LABELS[current.rule]}
                </span>
                <span className="text-xs text-(--color-text-tertiary)">
                  anchor: {current.anchorHue}°
                </span>
              </div>
              <div className="space-y-2 text-sm text-(--color-text-secondary)">
                {current.colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                    <code>{color}</code>
                  </div>
                ))}
                {current.metadata.length > 0 && (
                  <>
                    <hr className="border-(--color-border) my-3" />
                    <h4 className="text-xs font-semibold text-(--color-text-primary) mb-2">
                      Pairwise Comparisons
                    </h4>
                    {current.metadata.map((m, i) => (
                      <div key={i} className="p-2 rounded bg-(--color-bg-tertiary) space-y-1">
                        <div className="text-xs font-medium text-(--color-text-primary)">{m.pair}</div>
                        <div>
                          <strong>Contrast:</strong> {m.contrastRatio.toFixed(2)}:1
                          {m.contrastRatio >= 2.5 && <span className="ml-2 text-green-500">(passes)</span>}
                        </div>
                        <div><strong>Distance:</strong> {m.distance.toFixed(1)}</div>
                        <div><strong>Hue Diff:</strong> {m.hueDiff.toFixed(0)}°</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 1 && (
          <div className="mt-8 pt-6 border-t border-(--color-border)">
            <h2 className="text-lg font-semibold mb-4 text-(--color-text-primary)">
              History (simulated consecutive days)
            </h2>
            <p className="text-xs text-(--color-text-tertiary) mb-4">
              Each palette uses a different harmony rule from the previous one.
            </p>
            <div className="flex flex-wrap gap-4">
              {history.slice(1).map((entry, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <svg width="64" height="62" viewBox="0 0 64 62">
                    <circle cx="21" cy="21" r="19" fill={entry.colors[0]} stroke="none" />
                    <circle cx="43" cy="21" r="19" fill={entry.colors[1]} stroke="none" />
                    <circle cx="32" cy="41" r="19" fill={entry.colors[2]} stroke="none" />
                  </svg>
                  <span className="text-[10px] text-(--color-text-tertiary)">
                    {RULE_LABELS[entry.rule]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-8 pt-6 border-t text-center text-sm border-(--color-border) text-(--color-text-tertiary)">
          <p>
            <a href="/" className="underline hover:no-underline text-(--color-text-secondary)">
              Return to main app
            </a>
            {' · '}
            <a href="/?colors" className="underline hover:no-underline text-(--color-text-secondary)">
              V1 Color Tester
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
