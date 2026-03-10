import { useState, useCallback } from 'react';
import { Link } from '../shared';
import { PALETTES } from '../../data/palettes';

// =============================================================================
// ColorTester - Palette-based color selection from Coolors.co palettes
// =============================================================================
// Uses 365 pre-scraped 5-color palettes and picks 3 colors deterministically
// based on a day index + year, so the same palette yields different picks
// across years. This matches the edge function's color generation algorithm.
// =============================================================================

const PALETTE_COUNT = PALETTES.length; // 365

/** Simple seeded PRNG (mulberry32) */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick 3 unique indices from [0..4] using seeded random */
function pick3From5(random: () => number): [number, number, number] {
  const indices = [0, 1, 2, 3, 4];
  // Fisher-Yates shuffle first 3
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(random() * (5 - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return [indices[0], indices[1], indices[2]];
}

/** Get 3 colors for a given day-of-year (0-364) and year */
function getColorsForDay(dayIndex: number, year: number): { colors: string[]; paletteIndex: number; fullPalette: string[]; pickedIndices: number[] } {
  const paletteIndex = dayIndex % PALETTE_COUNT;
  const palette = PALETTES[paletteIndex];
  // Seed from both day and year so picks differ across years
  const seed = dayIndex * 1000 + year;
  const random = seededRandom(seed);
  const picked = pick3From5(random);
  return {
    colors: picked.map(i => palette[i]),
    paletteIndex,
    fullPalette: palette,
    pickedIndices: picked,
  };
}

interface HistoryEntry {
  colors: string[];
  paletteIndex: number;
  fullPalette: string[];
  pickedIndices: number[];
  dayIndex: number;
  year: number;
}

export function ColorTester() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [simulatedDay, setSimulatedDay] = useState(0);
  const [simulatedYear, setSimulatedYear] = useState(2026);

  const handleGenerate = useCallback(() => {
    const result = getColorsForDay(simulatedDay, simulatedYear);
    setHistory(prev => [{ ...result, dayIndex: simulatedDay, year: simulatedYear }, ...prev]);
    setSimulatedDay(prev => (prev + 1) % PALETTE_COUNT);
  }, [simulatedDay, simulatedYear]);

  const handleGenerateBatch = useCallback((count: number) => {
    const entries: HistoryEntry[] = [];
    let day = simulatedDay;
    for (let i = 0; i < count; i++) {
      const result = getColorsForDay(day, simulatedYear);
      entries.push({ ...result, dayIndex: day, year: simulatedYear });
      day = (day + 1) % PALETTE_COUNT;
    }
    setHistory(prev => [...entries, ...prev]);
    setSimulatedDay(day);
  }, [simulatedDay, simulatedYear]);

  const handleClear = useCallback(() => {
    setHistory([]);
    setSimulatedDay(0);
  }, []);

  const current = history[0] ?? null;

  return (
    <div className="min-h-screen p-8 flex flex-col items-center bg-(--color-bg-primary)">
      <div className="max-w-lg w-full">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-(--color-text-primary)">Color Tester</h1>
          <p className="text-sm text-(--color-text-secondary)">
            Tests palette-based color selection from <strong>365 Coolors.co palettes</strong>.
            Each day picks a palette, then selects 3 of 5 colors using a seeded random
            that varies by year.
          </p>
        </header>

        <div className="flex flex-col items-center gap-6">
          {/* Settings */}
          <div className="w-full p-4 rounded-lg bg-(--color-bg-secondary)">
            <h3 className="text-sm font-semibold mb-3 text-(--color-text-primary)">Settings</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-xs text-(--color-text-tertiary) block mb-1">Day Index</label>
                <input
                  type="number"
                  min={0}
                  max={PALETTE_COUNT - 1}
                  value={simulatedDay}
                  onChange={e => setSimulatedDay(Math.max(0, Math.min(PALETTE_COUNT - 1, Number(e.target.value))))}
                  className="w-full px-3 py-1.5 rounded border text-sm bg-(--color-bg-primary) border-(--color-border) text-(--color-text-primary)"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-(--color-text-tertiary) block mb-1">Year</label>
                <input
                  type="number"
                  min={2024}
                  max={2100}
                  value={simulatedYear}
                  onChange={e => setSimulatedYear(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded border text-sm bg-(--color-bg-primary) border-(--color-border) text-(--color-text-primary)"
                />
              </div>
            </div>
            <p className="text-xs text-(--color-text-tertiary) mt-2">
              {PALETTE_COUNT} palettes available. Same palette + different year = different 3-color pick.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={handleGenerate}
              className="px-6 py-3 rounded-lg font-medium text-lg cursor-pointer transition-opacity bg-(--color-text-primary) text-(--color-bg-primary) hover:opacity-80"
            >
              Generate
            </button>
            <button
              onClick={() => handleGenerateBatch(10)}
              className="px-4 py-3 rounded-lg font-medium text-sm cursor-pointer transition-opacity bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:opacity-80"
            >
              +10
            </button>
            <button
              onClick={() => handleGenerateBatch(50)}
              className="px-4 py-3 rounded-lg font-medium text-sm cursor-pointer transition-opacity bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:opacity-80"
            >
              +50
            </button>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="px-4 py-3 rounded-lg font-medium text-sm cursor-pointer transition-opacity bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:opacity-80"
              >
                Clear
              </button>
            )}
          </div>

          {/* Current result */}
          {current && (
            <>
              <div className="flex items-center justify-center py-4">
                <svg width="240" height="235" viewBox="0 0 240 235">
                  <circle cx="80" cy="80" r="75" fill={current.colors[0]} stroke="none" />
                  <circle cx="160" cy="80" r="75" fill={current.colors[1]} stroke="none" />
                  <circle cx="120" cy="158" r="75" fill={current.colors[2]} stroke="none" />
                </svg>
              </div>

              <div className="w-full p-4 rounded-lg bg-(--color-bg-secondary)">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-(--color-text-primary)">Details</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-(--color-bg-tertiary) text-(--color-text-secondary)">
                    Palette #{current.paletteIndex} &middot; Day {current.dayIndex} &middot; Year {current.year}
                  </span>
                </div>

                {/* Selected colors */}
                <div className="space-y-2 text-sm text-(--color-text-secondary) mb-3">
                  {current.colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                      <code>{color}</code>
                      <span className="text-xs text-(--color-text-tertiary)">(index {current.pickedIndices[i]})</span>
                    </div>
                  ))}
                </div>

                {/* Full palette preview */}
                <hr className="border-(--color-border) my-3" />
                <h4 className="text-xs font-semibold text-(--color-text-primary) mb-2">Full Palette</h4>
                <div className="flex gap-1">
                  {current.fullPalette.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className="w-full h-10 rounded"
                        style={{
                          backgroundColor: color,
                          outline: current.pickedIndices.includes(i) ? '2px solid var(--color-text-primary)' : 'none',
                          outlineOffset: '-2px',
                        }}
                      />
                      <span className="text-[10px] text-(--color-text-tertiary)">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* History */}
        {history.length > 1 && (
          <div className="mt-8 pt-6 border-t border-(--color-border)">
            <h2 className="text-lg font-semibold mb-4 text-(--color-text-primary)">
              History ({history.length} palettes)
            </h2>
            <div className="flex flex-wrap gap-4">
              {history.slice(1).map((entry, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <svg width="64" height="62" viewBox="0 0 64 62">
                    <circle cx="21" cy="21" r="19" fill={entry.colors[0]} stroke="none" />
                    <circle cx="43" cy="21" r="19" fill={entry.colors[1]} stroke="none" />
                    <circle cx="32" cy="41" r="19" fill={entry.colors[2]} stroke="none" />
                  </svg>
                  <span className="text-[10px] text-(--color-text-tertiary)">
                    #{entry.paletteIndex}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-8 pt-6 border-t text-center text-sm border-(--color-border) text-(--color-text-tertiary)">
          <p>
            <Link
              href="/"
              className="underline hover:no-underline text-(--color-text-secondary)"
            >
              Return to main app
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
