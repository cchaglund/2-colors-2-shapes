import { useState, useCallback } from 'react';

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

function generateColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 50 + Math.floor(Math.random() * 40);
  const lightness = 35 + Math.floor(Math.random() * 35);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function generateDistinctColors(): [string, string] {
  const minDistance = 80;
  const minContrastRatio = 3.0;
  const minHueDiff = 30;

  for (let i = 0; i < 100; i++) {
    const color1 = generateColor();
    const color2 = generateColor();

    if (colorDistance(color1, color2) < minDistance) continue;
    if (getContrastRatio(color1, color2) < minContrastRatio) continue;

    const c1 = parseHSL(color1);
    const c2 = parseHSL(color2);
    let hueDiff = Math.abs(c1.h - c2.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;
    if (hueDiff < minHueDiff) continue;

    return [color1, color2];
  }

  const hue = Math.floor(Math.random() * 360);
  const sat = 60 + Math.floor(Math.random() * 30);
  return [`hsl(${hue}, ${sat}%, 35%)`, `hsl(${(hue + 180) % 360}, ${sat}%, 65%)`];
}

export function ColorTester() {
  const [colors, setColors] = useState<[string, string] | null>(null);

  const handleGenerate = useCallback(() => {
    setColors(generateDistinctColors());
  }, []);

  const contrastRatio = colors ? getContrastRatio(colors[0], colors[1]) : null;
  const distance = colors ? colorDistance(colors[0], colors[1]) : null;
  const hueDiff = colors ? (() => {
    const c1 = parseHSL(colors[0]);
    const c2 = parseHSL(colors[1]);
    let diff = Math.abs(c1.h - c2.h);
    if (diff > 180) diff = 360 - diff;
    return diff;
  })() : null;

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-(--color-bg-primary)">
      <div className="max-w-lg w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-(--color-text-primary)">
            Color Tester
          </h1>
          <p className="text-sm text-(--color-text-secondary)">
            Test the color generation algorithm. Access via{' '}
            <code className="px-2 py-1 rounded text-xs bg-(--color-bg-tertiary)">
              ?colors
            </code>{' '}
            URL parameter.
          </p>
        </header>

        <div className="flex flex-col items-center gap-6">
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
              </div>
            </div>
          )}
        </div>

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
