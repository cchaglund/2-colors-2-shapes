import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fisherYatesShuffle } from '../wallSorting';

describe('Wall Sorting', () => {
  describe('fisherYatesShuffle', () => {
    describe('basic behavior', () => {
      it('returns a new array (does not mutate original)', () => {
        const original = [1, 2, 3, 4, 5];
        const shuffled = fisherYatesShuffle(original);

        expect(shuffled).not.toBe(original);
        expect(original).toEqual([1, 2, 3, 4, 5]);
      });

      it('returns array with same length', () => {
        const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const shuffled = fisherYatesShuffle(array);

        expect(shuffled.length).toBe(array.length);
      });

      it('returns array with same elements', () => {
        const array = [1, 2, 3, 4, 5];
        const shuffled = fisherYatesShuffle(array);

        expect(shuffled.sort((a, b) => a - b)).toEqual(array.sort((a, b) => a - b));
      });

      it('handles empty array', () => {
        const result = fisherYatesShuffle([]);
        expect(result).toEqual([]);
      });

      it('handles single element array', () => {
        const result = fisherYatesShuffle([42]);
        expect(result).toEqual([42]);
      });

      it('handles two element array', () => {
        const result = fisherYatesShuffle([1, 2]);
        expect(result.sort((a, b) => a - b)).toEqual([1, 2]);
      });

      it('works with objects', () => {
        const objects = [
          { id: 'a', name: 'Alice' },
          { id: 'b', name: 'Bob' },
          { id: 'c', name: 'Carol' },
        ];
        const shuffled = fisherYatesShuffle(objects);

        expect(shuffled.length).toBe(3);
        expect(shuffled.map(o => o.id).sort()).toEqual(['a', 'b', 'c']);
      });

      it('works with strings', () => {
        const strings = ['apple', 'banana', 'cherry'];
        const shuffled = fisherYatesShuffle(strings);

        expect(shuffled.length).toBe(3);
        expect(shuffled.sort()).toEqual(['apple', 'banana', 'cherry']);
      });
    });

    describe('randomness properties', () => {
      let mockRandom: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        mockRandom = vi.spyOn(Math, 'random');
      });

      afterEach(() => {
        mockRandom.mockRestore();
      });

      it('uses Math.random for each swap', () => {
        const array = [1, 2, 3, 4, 5];
        // For n=5 array, Fisher-Yates makes 4 swaps (i from 4 to 1)
        mockRandom.mockReturnValue(0.5);

        fisherYatesShuffle(array);

        // Should be called 4 times (n-1 times for Fisher-Yates)
        expect(mockRandom).toHaveBeenCalledTimes(4);
      });

      it('produces predictable output with mocked random', () => {
        const array = [1, 2, 3, 4, 5];

        // Mock random to always return 0, which means j=0 always
        // This results in a specific shuffle pattern
        mockRandom.mockReturnValue(0);

        const result = fisherYatesShuffle(array);

        // With random() always returning 0:
        // i=4: j=floor(0*5)=0, swap 4,0 -> [5,2,3,4,1]
        // i=3: j=floor(0*4)=0, swap 3,0 -> [4,2,3,5,1]
        // i=2: j=floor(0*3)=0, swap 2,0 -> [3,2,4,5,1]
        // i=1: j=floor(0*2)=0, swap 1,0 -> [2,3,4,5,1]
        expect(result).toEqual([2, 3, 4, 5, 1]);
      });

      it('produces different output with different random values', () => {
        const array = [1, 2, 3, 4, 5];

        // Mock to return 0.99 (almost 1)
        mockRandom.mockReturnValue(0.99);

        const result = fisherYatesShuffle(array);

        // With random() always returning 0.99:
        // i=4: j=floor(0.99*5)=4, swap 4,4 -> [1,2,3,4,5] (no change)
        // i=3: j=floor(0.99*4)=3, swap 3,3 -> [1,2,3,4,5] (no change)
        // etc. - array stays unchanged
        expect(result).toEqual([1, 2, 3, 4, 5]);
      });
    });

    describe('statistical distribution (sanity check)', () => {
      it('distributes elements reasonably across positions', () => {
        const runs = 1000;
        const array = [0, 1, 2, 3, 4];
        const positionCounts: number[][] = Array(5).fill(null).map(() => Array(5).fill(0));

        for (let i = 0; i < runs; i++) {
          const shuffled = fisherYatesShuffle(array);
          shuffled.forEach((value, position) => {
            positionCounts[value][position]++;
          });
        }

        // Each element should appear in each position roughly 1/5 of the time (200 times out of 1000)
        // Allow for ±50% variance (100-300 range) to account for randomness
        const expectedPerPosition = runs / 5;
        const minExpected = expectedPerPosition * 0.5;
        const maxExpected = expectedPerPosition * 1.5;

        for (let value = 0; value < 5; value++) {
          for (let position = 0; position < 5; position++) {
            const count = positionCounts[value][position];
            expect(count).toBeGreaterThan(minExpected);
            expect(count).toBeLessThan(maxExpected);
          }
        }
      });
    });

    describe('edge cases', () => {
      it('handles array with duplicate values', () => {
        const array = [1, 1, 2, 2, 3];
        const shuffled = fisherYatesShuffle(array);

        expect(shuffled.length).toBe(5);
        expect(shuffled.filter(x => x === 1).length).toBe(2);
        expect(shuffled.filter(x => x === 2).length).toBe(2);
        expect(shuffled.filter(x => x === 3).length).toBe(1);
      });

      it('handles large array efficiently', () => {
        const largeArray = Array.from({ length: 10000 }, (_, i) => i);
        const start = performance.now();
        const shuffled = fisherYatesShuffle(largeArray);
        const duration = performance.now() - start;

        expect(shuffled.length).toBe(10000);
        // Should complete in under 100ms (very generous for O(n) algorithm)
        expect(duration).toBeLessThan(100);
      });

      it('handles array with null and undefined values', () => {
        const array = [1, null, undefined, 2, null];
        const shuffled = fisherYatesShuffle(array);

        expect(shuffled.length).toBe(5);
        expect(shuffled.filter(x => x === null).length).toBe(2);
        expect(shuffled.filter(x => x === undefined).length).toBe(1);
      });
    });
  });
});
