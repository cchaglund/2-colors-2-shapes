import { describe, it, expect } from 'vitest';
import {
  calculateElo,
  calculateExpectedScore,
  calculateRatingChange,
  K_FACTOR,
  INITIAL_RATING,
} from '../elo';

describe('ELO Calculation', () => {
  describe('calculateExpectedScore', () => {
    it('returns 0.5 for equal ratings', () => {
      const expected = calculateExpectedScore(1000, 1000);
      expect(expected).toBe(0.5);
    });

    it('returns higher expected score for higher-rated player', () => {
      const expected = calculateExpectedScore(1200, 1000);
      expect(expected).toBeGreaterThan(0.5);
      expect(expected).toBeLessThan(1);
    });

    it('returns lower expected score for lower-rated player', () => {
      const expected = calculateExpectedScore(1000, 1200);
      expect(expected).toBeLessThan(0.5);
      expect(expected).toBeGreaterThan(0);
    });

    it('expected scores of both players sum to 1', () => {
      const expectedA = calculateExpectedScore(1100, 1000);
      const expectedB = calculateExpectedScore(1000, 1100);
      expect(expectedA + expectedB).toBeCloseTo(1, 10);
    });

    it('400 point difference gives ~91% expected score', () => {
      // At 400 point difference, expected score should be ~0.909
      const expected = calculateExpectedScore(1400, 1000);
      expect(expected).toBeCloseTo(0.909, 2);
    });
  });

  describe('calculateElo', () => {
    it('winner gains points, loser loses points', () => {
      const result = calculateElo(1000, 1000, 'A');
      expect(result.newRatingA).toBeGreaterThan(1000);
      expect(result.newRatingB).toBeLessThan(1000);
    });

    it('total rating points are conserved (zero-sum)', () => {
      const result = calculateElo(1000, 1000, 'A');
      expect(result.newRatingA + result.newRatingB).toBe(2000);
    });

    it('upset win (lower beats higher) gives bigger rating change', () => {
      // Lower rated player (1000) beats higher rated (1200)
      const upsetResult = calculateElo(1000, 1200, 'A');
      const upsetGain = upsetResult.newRatingA - 1000;

      // Higher rated player (1200) beats lower rated (1000)
      const expectedResult = calculateElo(1200, 1000, 'A');
      const expectedGain = expectedResult.newRatingA - 1200;

      expect(upsetGain).toBeGreaterThan(expectedGain);
    });

    it('expected win gives smaller rating change', () => {
      // When favorite wins, they gain fewer points
      const result = calculateElo(1200, 1000, 'A');
      const gain = result.newRatingA - 1200;

      // Maximum gain is K_FACTOR when expected score is 0
      // Minimum gain approaches 0 when expected score is 1
      expect(gain).toBeLessThan(K_FACTOR / 2);
      expect(gain).toBeGreaterThan(0);
    });

    it('symmetry: order of players does not affect magnitude of change', () => {
      // Scenario: 1000-rated player beats 1100-rated player
      const resultA = calculateElo(1000, 1100, 'A'); // A (1000) beats B (1100)
      const resultB = calculateElo(1100, 1000, 'B'); // B (1000) beats A (1100)

      // Winner gain should be the same regardless of parameter order
      const gainWhenFirst = resultA.newRatingA - 1000; // Lower-rated wins as param A
      const gainWhenSecond = resultB.newRatingB - 1000; // Lower-rated wins as param B

      expect(gainWhenFirst).toBe(gainWhenSecond);
    });

    it('works with initial rating of 1000', () => {
      const result = calculateElo(INITIAL_RATING, INITIAL_RATING, 'A');
      // At equal ratings, winner gains K/2, loser loses K/2
      expect(result.newRatingA).toBe(1016); // 1000 + 32 * 0.5 = 1016
      expect(result.newRatingB).toBe(984); // 1000 - 32 * 0.5 = 984
    });

    it('handles extreme rating differences', () => {
      // Very high vs very low - favorite wins
      const result = calculateElo(2000, 500, 'A');
      // At 1500 point difference, expected score is ~0.9997
      // So winner gains almost nothing (rounds to 0)
      expect(result.newRatingA).toBeGreaterThanOrEqual(2000);
      expect(result.newRatingB).toBeLessThanOrEqual(500);
      // Favorite winning should gain almost no points (may round to 0)
      expect(result.newRatingA - 2000).toBeLessThan(5);

      // Upset: underdog wins - should gain many points
      const upsetResult = calculateElo(500, 2000, 'A');
      expect(upsetResult.newRatingA - 500).toBeGreaterThan(30); // Near max K
    });

    it('ratings stay integers (rounded)', () => {
      const result = calculateElo(1050, 1025, 'B');
      expect(Number.isInteger(result.newRatingA)).toBe(true);
      expect(Number.isInteger(result.newRatingB)).toBe(true);
    });
  });

  describe('calculateRatingChange', () => {
    it('returns positive number for winner', () => {
      const change = calculateRatingChange(1000, 1000, true);
      expect(change).toBeGreaterThan(0);
    });

    it('returns negative number for loser', () => {
      const change = calculateRatingChange(1000, 1000, false);
      expect(change).toBeLessThan(0);
    });

    it('change magnitude equals half K-factor for equal ratings', () => {
      const winChange = calculateRatingChange(1000, 1000, true);
      const loseChange = calculateRatingChange(1000, 1000, false);
      expect(winChange).toBe(16); // K/2 = 32/2 = 16
      expect(loseChange).toBe(-16);
    });

    it('underdog winning gains more than favorite winning', () => {
      const underdogWin = calculateRatingChange(1000, 1200, true);
      const favoriteWin = calculateRatingChange(1200, 1000, true);
      expect(underdogWin).toBeGreaterThan(favoriteWin);
    });
  });

  describe('edge cases', () => {
    it('very close ratings produce balanced changes', () => {
      const result = calculateElo(1001, 1000, 'A');
      // Should be very close to the equal-rating case
      expect(result.newRatingA - 1001).toBeCloseTo(16, 0);
    });

    it('handles negative ratings (though unusual)', () => {
      const result = calculateElo(-100, 100, 'A');
      expect(result.newRatingA).toBeGreaterThan(-100);
      expect(result.newRatingB).toBeLessThan(100);
    });

    it('handles very large ratings', () => {
      const result = calculateElo(5000, 5000, 'A');
      expect(result.newRatingA).toBe(5016);
      expect(result.newRatingB).toBe(4984);
    });
  });
});
