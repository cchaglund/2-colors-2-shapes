import { describe, it, expect } from 'vitest';
import { canViewCurrentDay } from '../privacyRules';

describe('Privacy Rules', () => {
  describe('canViewCurrentDay', () => {
    const TODAY = '2025-01-15';
    const YESTERDAY = '2025-01-14';
    const LAST_WEEK = '2025-01-08';

    describe('past days', () => {
      it('returns true for past day regardless of submission status', () => {
        // Yesterday - not submitted
        expect(canViewCurrentDay(YESTERDAY, TODAY, false)).toBe(true);

        // Yesterday - submitted
        expect(canViewCurrentDay(YESTERDAY, TODAY, true)).toBe(true);

        // Last week - not submitted
        expect(canViewCurrentDay(LAST_WEEK, TODAY, false)).toBe(true);

        // Last week - submitted
        expect(canViewCurrentDay(LAST_WEEK, TODAY, true)).toBe(true);
      });
    });

    describe('current day', () => {
      it('returns false when user has not submitted today', () => {
        expect(canViewCurrentDay(TODAY, TODAY, false)).toBe(false);
      });

      it('returns true when user has submitted today', () => {
        expect(canViewCurrentDay(TODAY, TODAY, true)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('handles year boundaries correctly', () => {
        const newYearsDay = '2025-01-01';
        const newYearsEve = '2024-12-31';

        // Past year's date is viewable
        expect(canViewCurrentDay(newYearsEve, newYearsDay, false)).toBe(true);

        // New year's day blocks without submission
        expect(canViewCurrentDay(newYearsDay, newYearsDay, false)).toBe(false);
      });

      it('handles month boundaries correctly', () => {
        const firstOfMonth = '2025-02-01';
        const lastOfPrevMonth = '2025-01-31';

        // Previous month's last day is viewable
        expect(canViewCurrentDay(lastOfPrevMonth, firstOfMonth, false)).toBe(true);
      });

      it('treats exact date match as current day', () => {
        const date = '2025-06-15';
        expect(canViewCurrentDay(date, date, false)).toBe(false);
        expect(canViewCurrentDay(date, date, true)).toBe(true);
      });
    });

    describe('Submission Visibility Rules (from privacy spec)', () => {
      /**
       * Table from spec:
       * | Viewer's State                      | Current Day | Past Days              |
       * |-------------------------------------|-------------|------------------------|
       * | Not logged in                       | Locked      | Visible (public only)  |
       * | Logged in, no submission today      | Locked      | Visible (public only)  |
       * | Logged in, has saved today          | Visible     | Visible (public only)  |
       */

      it('not logged in: current day locked', () => {
        // When not logged in, hasSubmittedToday will be false
        expect(canViewCurrentDay(TODAY, TODAY, false)).toBe(false);
      });

      it('not logged in: past days visible', () => {
        expect(canViewCurrentDay(YESTERDAY, TODAY, false)).toBe(true);
        expect(canViewCurrentDay(LAST_WEEK, TODAY, false)).toBe(true);
      });

      it('logged in without submission: current day locked', () => {
        expect(canViewCurrentDay(TODAY, TODAY, false)).toBe(false);
      });

      it('logged in without submission: past days visible', () => {
        expect(canViewCurrentDay(YESTERDAY, TODAY, false)).toBe(true);
      });

      it('logged in with submission: current day visible', () => {
        expect(canViewCurrentDay(TODAY, TODAY, true)).toBe(true);
      });

      it('logged in with submission: past days visible', () => {
        expect(canViewCurrentDay(YESTERDAY, TODAY, true)).toBe(true);
      });
    });
  });
});
