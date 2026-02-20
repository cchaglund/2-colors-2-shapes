import { useState, useEffect, useCallback, useRef } from 'react';
import type { DailyChallenge } from '../../types';
import { supabase } from '../../lib/supabase';

// =============================================================================
// Persistent Cache for Challenge Data
// =============================================================================
// Historical challenge data never changes, so we can safely persist it.
// Challenge generation is SERVER-SIDE ONLY - no local fallback.
// =============================================================================

const CACHE_KEY = 'challenge-cache';
const CACHE_VERSION = 3; // Increment when data format changes (added word field)

interface CacheData {
  version: number;
  challenges: Record<string, DailyChallenge>;
}

// In-memory cache (fast access)
const challengeCache = new Map<string, DailyChallenge>();

// Track in-flight requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<DailyChallenge>>();

// Load cache from localStorage on module init
function loadCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return;

    const data: CacheData = JSON.parse(stored);

    // Check version - invalidate cache if format changed
    if (data.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }

    // Load into memory cache
    for (const [date, challenge] of Object.entries(data.challenges)) {
      challengeCache.set(date, challenge);
    }
  } catch (e) {
    console.error('Failed to load challenge cache from storage:', e);
    localStorage.removeItem(CACHE_KEY);
  }
}

// Save cache to localStorage
function saveCacheToStorage(): void {
  try {
    const challenges: Record<string, DailyChallenge> = {};
    challengeCache.forEach((challenge, date) => {
      challenges[date] = challenge;
    });

    const data: CacheData = {
      version: CACHE_VERSION,
      challenges,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save challenge cache to storage:', e);
  }
}

// Debounced save to avoid excessive writes
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveCacheToStorage();
    saveTimeout = null;
  }, 1000);
}

// Add to cache with persistence
function cacheChallenge(challenge: DailyChallenge): void {
  challengeCache.set(challenge.date, challenge);
  debouncedSave();
}

// Initialize cache from storage
loadCacheFromStorage();

// =============================================================================
// Hook and Utilities
// =============================================================================

interface UseDailyChallengeReturn {
  challenge: DailyChallenge | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDailyChallenge(date: string): UseDailyChallengeReturn {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(() => {
    // Check cache first for instant display
    return challengeCache.get(date) || null;
  });
  const [loading, setLoading] = useState(!challengeCache.has(date));
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchChallenge = useCallback(async () => {
    // Skip fetching if date is empty/invalid
    if (!date) {
      setChallenge(null);
      setLoading(false);
      return;
    }

    // Check cache
    if (challengeCache.has(date)) {
      setChallenge(challengeCache.get(date)!);
      setLoading(false);
      return;
    }

    // Check if there's already a pending request for this date
    const pending = pendingRequests.get(date);
    if (pending) {
      try {
        const result = await pending;
        setChallenge(result);
        setLoading(false);
        return;
      } catch {
        // Will be handled by the original request
      }
    }

    setLoading(true);
    setError(null);

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const fetchPromise = (async (): Promise<DailyChallenge> => {
      const { data, error: fetchError } = await supabase.functions.invoke(
        'get-daily-challenge',
        {
          body: { date },
        }
      );

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch challenge');
      }

      // DEBUG: Override shapes with equilateral triangle and circle
      // const debugShapes: [import('../types').ChallengeShapeData, import('../types').ChallengeShapeData] = [
      //   {
      //     type: 'triangle',
      //     name: 'Triangle',
      //     svg: 'M 50 6.699 L 93.301 81.699 L 6.699 81.699 Z',
      //   },
      //   {
      //     type: 'circle',
      //     name: 'Circle',
      //     svg: 'M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z',
      //   },
      // ];

      // DEBUG: Override colors (uncomment to force specific colors)
      // const debugColors = [
      //   'hsl(270, 100%, 85%)',  // blue
      //   'hsl(324, 100%, 44%)',  // red
      //   'hsl(61, 52%, 67%)',   // yellow
      // ];

      const fetchedChallenge: DailyChallenge = {
        date: data.date,
        colors: data.colors,
        // colors: debugColors,
        shapes: data.shapes,
        // shapes: debugShapes,
        word: data.word,
      };

      // Cache the result (with persistence)
      cacheChallenge(fetchedChallenge);
      return fetchedChallenge;
    })();

    pendingRequests.set(date, fetchPromise);

    try {
      const result = await fetchPromise;
      setChallenge(result);
    } catch (err) {
      console.error('Failed to fetch challenge:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // No fallback - server is the only source of truth
    } finally {
      pendingRequests.delete(date);
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchChallenge();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchChallenge]);

  return {
    challenge,
    loading,
    error,
    refetch: fetchChallenge,
  };
}

// Batch fetch for Calendar - optimized to only fetch uncached dates
export async function fetchChallengesBatch(
  dates: string[]
): Promise<Map<string, DailyChallenge>> {
  // Check cache for all dates first
  const uncachedDates = dates.filter((d) => !challengeCache.has(d));

  if (uncachedDates.length === 0) {
    // All cached - no network request needed
    return new Map(dates.map((d) => [d, challengeCache.get(d)!]));
  }

  const { data, error } = await supabase.functions.invoke('get-daily-challenge', {
    body: { dates: uncachedDates },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch challenges');
  }

  // Cache all fetched challenges (with persistence)
  for (const challenge of data.challenges) {
    const c: DailyChallenge = {
      date: challenge.date,
      colors: challenge.colors,
      shapes: challenge.shapes,
      word: challenge.word,
    };
    cacheChallenge(c);
  }

  // Return all requested dates from cache
  return new Map(dates.map((d) => [d, challengeCache.get(d)!]));
}

// Simple sync getter for components that need immediate access
// Returns cached challenge or null if not cached
export function getChallengeSync(date: string): DailyChallenge | null {
  return challengeCache.get(date) || null;
}

// Prefetch a challenge (useful for preloading)
export async function prefetchChallenge(date: string): Promise<void> {
  if (challengeCache.has(date)) {
    return;
  }

  try {
    const { data, error } = await supabase.functions.invoke('get-daily-challenge', {
      body: { date },
    });

    if (!error && data) {
      cacheChallenge({
        date: data.date,
        colors: data.colors,
        shapes: data.shapes,
        word: data.word,
      });
    }
  } catch {
    // Silently fail prefetch
  }
}

// Clear the cache (useful for debugging or forced refresh)
export function clearChallengeCache(): void {
  challengeCache.clear();
  localStorage.removeItem(CACHE_KEY);
}

// Get cache statistics (useful for debugging)
export function getCacheStats(): { memorySize: number; storageSize: number } {
  const stored = localStorage.getItem(CACHE_KEY);
  return {
    memorySize: challengeCache.size,
    storageSize: stored ? stored.length : 0,
  };
}
