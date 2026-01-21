/**
 * Wall Sorting Utilities
 *
 * Fisher-Yates shuffle and related sorting helpers for the Wall of the Day feature.
 */

/**
 * Fisher-Yates (Knuth) shuffle algorithm.
 * Returns a new array with elements randomly shuffled.
 * Time complexity: O(n)
 * Space complexity: O(n)
 *
 * @param array - The array to shuffle
 * @returns A new shuffled array (original is not modified)
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
