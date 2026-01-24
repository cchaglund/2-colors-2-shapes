import { useState, useCallback, useRef } from 'react';
import {
  generateDistinctColors,
  createMathRandom,
  parseHSLColor,
  getColorContrastRatio,
} from '../../utils/dailyChallenge';

// Calculate perceptual distance between two colors
function colorDistance(color1: string, color2: string): number {
  const c1 = parseHSLColor(color1);
  const c2 = parseHSLColor(color2);

  let hueDiff = Math.abs(c1.h - c2.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  return Math.sqrt(
    Math.pow(hueDiff * 2, 2) +
    Math.pow((c1.l - c2.l) * 1.5, 2) +
    Math.pow((c1.s - c2.s) * 0.5, 2)
  );
}

export function ColorTester() {
  const [colors, setColors] = useState<[string, string] | null>(null);
  const [history, setHistory] = useState<[string, string][]>([]);
  // Track "previous day" colors to test consecutive day avoidance
  const previousColorsRef = useRef<string[]>([]);

  const handleGenerate = useCallback(() => {
    // Use production color generation with previous colors to avoid
    const random = createMathRandom();
    const newColors = generateDistinctColors(random, previousColorsRef.current);

    setColors(newColors);
    setHistory((prev) => [newColors, ...prev]);

    // Update "previous" colors for next generation (simulates day-to-day)
    previousColorsRef.current = [...newColors];
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    previousColorsRef.current = [];
  }, []);

  const contrastRatio = colors ? getColorContrastRatio(colors[0], colors[1]) : null;
  const distance = colors ? colorDistance(colors[0], colors[1]) : null;
  const hueDiff = colors
    ? (() => {
        const c1 = parseHSLColor(colors[0]);
        const c2 = parseHSLColor(colors[1]);
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
            Tests the <strong>production</strong> color generation algorithm. Each click simulates
            a new day, avoiding colors too similar to the previous day.
          </p>
        </header>

        <div className="flex flex-col items-center gap-6">
          {/* Production Settings Info */}
          <div className="w-full p-4 rounded-lg bg-(--color-bg-secondary)">
            <h3 className="text-sm font-semibold mb-2 text-(--color-text-primary)">
              Production Settings
            </h3>
            <ul className="text-xs text-(--color-text-tertiary) space-y-1">
              <li>Color space: OKLCH (perceptually uniform)</li>
              <li>Lightness range: 0.4 - 0.9</li>
              <li>Muddy hues excluded: 30-50° (browns)</li>
              <li>Min contrast ratio: 2.5</li>
              <li>Min hue difference: 30°</li>
              <li>Consecutive day similarity check: enabled</li>
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
                onClick={handleClearHistory}
                className="px-4 py-3 rounded-lg font-medium text-sm cursor-pointer transition-opacity bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:opacity-80"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="relative w-64 h-48 flex items-center justify-center">
            {colors ? (
              <>
                <svg
                  width="150"
                  height="150"
                  viewBox="0 0 150 150"
                  className="absolute left-5"
                >
                  <circle cx="75" cy="75" r="70" fill={colors[0]} stroke="none" />
                </svg>
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
                  {contrastRatio && contrastRatio >= 2.5 && (
                    <span className="ml-2 text-green-500">(passes min 2.5)</span>
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

        {/* History Section */}
        {history.length > 1 && (
          <div className="mt-8 pt-6 border-t border-(--color-border)">
            <h2 className="text-lg font-semibold mb-4 text-(--color-text-primary)">
              History (simulated consecutive days)
            </h2>
            <p className="text-xs text-(--color-text-tertiary) mb-4">
              Each pair should avoid having colors too similar to the previous pair.
            </p>
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
