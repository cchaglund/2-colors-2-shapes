import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// =============================================================================
// ColorTester - Tests the PRODUCTION color generation algorithm
// =============================================================================
// This component calls the server edge function to generate colors.
// It does NOT use local/client-side color generation.
//
// If you update color generation in supabase/functions/get-daily-challenge/,
// you MUST deploy before changes appear here:
//   supabase functions deploy get-daily-challenge
// =============================================================================

interface ColorMetadata {
  contrastRatio: number;
  hueDiff: number;
  distance: number;
}

interface TestColorResponse {
  colors: [string, string];
  metadata: ColorMetadata;
}

export function ColorTester() {
  const [colors, setColors] = useState<[string, string] | null>(null);
  const [metadata, setMetadata] = useState<ColorMetadata | null>(null);
  const [history, setHistory] = useState<[string, string][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track "previous day" colors to test consecutive day avoidance
  const previousColorsRef = useRef<string[]>([]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke(
        'get-daily-challenge',
        {
          body: {
            test: true,
            previousColors: previousColorsRef.current,
          },
        }
      );

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to generate colors');
      }

      const response = data as TestColorResponse;
      setColors(response.colors);
      setMetadata(response.metadata);
      setHistory((prev) => [response.colors, ...prev]);

      // Update "previous" colors for next generation (simulates day-to-day)
      previousColorsRef.current = [...response.colors];
    } catch (err) {
      console.error('Failed to generate colors:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    previousColorsRef.current = [];
  }, []);

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-(--color-bg-primary)">
      <div className="max-w-lg w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-(--color-text-primary)">Color Tester</h1>
          <p className="text-sm text-(--color-text-secondary)">
            Tests the <strong>production server</strong> color generation algorithm. Each click
            simulates a new day, avoiding colors too similar to the previous day.
          </p>
        </header>

        <div className="flex flex-col items-center gap-6">
          {/* Server Notice */}
          <div className="w-full p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              <strong>Note:</strong> This calls the deployed edge function. After updating color
              generation code, run <code className="bg-black/10 px-1 rounded">supabase functions deploy get-daily-challenge</code> for changes to appear here.
            </p>
          </div>

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
              disabled={loading}
              className="px-6 py-3 rounded-lg font-medium text-lg cursor-pointer transition-opacity bg-(--color-text-primary) text-(--color-bg-primary) hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Colors'}
            </button>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                disabled={loading}
                className="px-4 py-3 rounded-lg font-medium text-sm cursor-pointer transition-opacity bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:opacity-80 disabled:opacity-50"
              >
                Clear History
              </button>
            )}
          </div>

          {error && (
            <div className="w-full p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

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

          {colors && metadata && (
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
                  <strong>Contrast Ratio:</strong> {metadata.contrastRatio.toFixed(2)}:1
                  {metadata.contrastRatio >= 2.5 && (
                    <span className="ml-2 text-green-500">(passes min 2.5)</span>
                  )}
                </div>
                <div>
                  <strong>Perceptual Distance:</strong> {metadata.distance.toFixed(1)}
                </div>
                <div>
                  <strong>Hue Difference:</strong> {metadata.hueDiff.toFixed(0)}°
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
