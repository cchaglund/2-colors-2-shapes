/**
 * ELO Rating System utilities
 *
 * Standard chess-style ELO rating with K-factor of 32.
 * Initial rating: 1000
 */

export interface EloResult {
  newRatingA: number;
  newRatingB: number;
}

export const K_FACTOR = 32;
export const INITIAL_RATING = 1000;

/**
 * Calculate expected score (probability of winning) for player A
 * Based on the rating difference between A and B
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO ratings after a match
 *
 * @param ratingA - Current rating of player A
 * @param ratingB - Current rating of player B
 * @param winner - 'A' if A won, 'B' if B won
 * @returns New ratings for both players
 */
export function calculateElo(ratingA: number, ratingB: number, winner: 'A' | 'B'): EloResult {
  const expectedA = calculateExpectedScore(ratingA, ratingB);
  const expectedB = 1 - expectedA;

  const scoreA = winner === 'A' ? 1 : 0;
  const scoreB = winner === 'B' ? 1 : 0;

  const newRatingA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + K_FACTOR * (scoreB - expectedB));

  return { newRatingA, newRatingB };
}

/**
 * Calculate rating change for a single player
 * Positive if won, negative if lost
 */
export function calculateRatingChange(
  playerRating: number,
  opponentRating: number,
  won: boolean
): number {
  const expected = calculateExpectedScore(playerRating, opponentRating);
  const actual = won ? 1 : 0;
  return Math.round(K_FACTOR * (actual - expected));
}
