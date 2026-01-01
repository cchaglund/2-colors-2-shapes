import { describe, it, expect } from 'vitest';
import { getWordForDate } from '../dailyChallenge';

describe('Daily Word Selection', () => {
  describe('getWordForDate', () => {
    it('returns a string for any valid date', () => {
      const word = getWordForDate('2026-01-01');
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    });

    it('returns the same word for the same date (deterministic)', () => {
      const word1 = getWordForDate('2026-06-15');
      const word2 = getWordForDate('2026-06-15');
      expect(word1).toBe(word2);
    });

    it('returns different words for different days', () => {
      // Check multiple days to ensure variety
      const words = new Set([
        getWordForDate('2026-01-01'),
        getWordForDate('2026-01-02'),
        getWordForDate('2026-01-03'),
        getWordForDate('2026-01-04'),
        getWordForDate('2026-01-05'),
      ]);
      // Should have at least 2 different words (very unlikely to have all same)
      expect(words.size).toBeGreaterThan(1);
    });

    it('handles day 1 correctly (January 1st)', () => {
      const word = getWordForDate('2026-01-01');
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    });

    it('handles day 365 correctly (December 31st, non-leap year)', () => {
      const word = getWordForDate('2026-12-31');
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    });

    it('handles leap year day 366 (December 31st of leap year)', () => {
      // 2024 is a leap year
      const word = getWordForDate('2024-12-31');
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    });

    it('wraps around for same day in different years', () => {
      // Same day of year should get the same word (modulo 365)
      const word2026 = getWordForDate('2026-03-15');
      const word2027 = getWordForDate('2027-03-15');
      expect(word2026).toBe(word2027);
    });

    it('produces valid words from the word list', () => {
      // Check a sample of dates to ensure all words are non-empty strings
      const testDates = [
        '2026-01-01',
        '2026-02-14',
        '2026-07-04',
        '2026-10-31',
        '2026-12-25',
      ];

      for (const date of testDates) {
        const word = getWordForDate(date);
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
        // Words should be lowercase (based on the word list)
        expect(word).toMatch(/^[a-z]+$/);
      }
    });
  });

  describe('edge cases', () => {
    it('handles start of year boundary', () => {
      const dec31 = getWordForDate('2025-12-31');
      const jan1 = getWordForDate('2026-01-01');
      // These should be different words (different days of year)
      expect(dec31).not.toBe(jan1);
    });

    it('produces consistent results across multiple calls', () => {
      const date = '2026-08-15';
      const results = Array.from({ length: 10 }, () => getWordForDate(date));
      // All results should be identical
      expect(new Set(results).size).toBe(1);
    });
  });
});
