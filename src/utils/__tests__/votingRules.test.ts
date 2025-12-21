import { describe, it, expect } from 'vitest';
import {
  MIN_SUBMISSIONS_FOR_RANKING,
  DEFAULT_REQUIRED_VOTES,
  calculateTotalPairs,
  calculateRequiredVotes,
  hasEnoughSubmissionsForRanking,
  hasEnoughSubmissions,
  hasEnteredRanking,
  canVoteOnSubmission,
  isValidVotingPair,
  votesRemainingToEnterRanking,
  voteProgressPercentage,
  determineVotingState,
} from '../votingRules';

describe('Voting Rules', () => {
  describe('constants', () => {
    it('requires 5 submissions minimum for full ranking', () => {
      expect(MIN_SUBMISSIONS_FOR_RANKING).toBe(5);
    });

    it('default required votes is 5', () => {
      expect(DEFAULT_REQUIRED_VOTES).toBe(5);
    });
  });

  describe('calculateTotalPairs', () => {
    it('returns 0 for 0 submissions', () => {
      expect(calculateTotalPairs(0)).toBe(0);
    });

    it('returns 0 for 1 submission', () => {
      expect(calculateTotalPairs(1)).toBe(0);
    });

    it('returns 1 for 2 submissions', () => {
      expect(calculateTotalPairs(2)).toBe(1);
    });

    it('returns 3 for 3 submissions', () => {
      expect(calculateTotalPairs(3)).toBe(3);
    });

    it('returns 6 for 4 submissions', () => {
      expect(calculateTotalPairs(4)).toBe(6);
    });

    it('returns 10 for 5 submissions', () => {
      expect(calculateTotalPairs(5)).toBe(10);
    });

    it('returns 45 for 10 submissions', () => {
      expect(calculateTotalPairs(10)).toBe(45);
    });
  });

  describe('calculateRequiredVotes', () => {
    it('returns 0 for 0 submissions (bootstrap case)', () => {
      expect(calculateRequiredVotes(0)).toBe(0);
    });

    it('returns 0 for 1 submission (no pairs possible)', () => {
      // 1 submission = 0 pairs, so 0 votes required
      expect(calculateRequiredVotes(1)).toBe(0);
    });

    it('returns 1 for 2 submissions (only 1 pair)', () => {
      expect(calculateRequiredVotes(2)).toBe(1);
    });

    it('returns 3 for 3 submissions (3 pairs)', () => {
      expect(calculateRequiredVotes(3)).toBe(3);
    });

    it('returns 5 for 4 submissions (6 pairs, capped at 5)', () => {
      expect(calculateRequiredVotes(4)).toBe(5);
    });

    it('returns 5 for 5+ submissions', () => {
      expect(calculateRequiredVotes(5)).toBe(5);
      expect(calculateRequiredVotes(10)).toBe(5);
      expect(calculateRequiredVotes(100)).toBe(5);
    });
  });

  describe('hasEnoughSubmissionsForRanking', () => {
    it('returns false for less than 5 submissions', () => {
      expect(hasEnoughSubmissionsForRanking(0)).toBe(false);
      expect(hasEnoughSubmissionsForRanking(1)).toBe(false);
      expect(hasEnoughSubmissionsForRanking(4)).toBe(false);
    });

    it('returns true for 5+ submissions', () => {
      expect(hasEnoughSubmissionsForRanking(5)).toBe(true);
      expect(hasEnoughSubmissionsForRanking(10)).toBe(true);
    });
  });

  describe('hasEnoughSubmissions', () => {
    it('returns false for 0 submissions', () => {
      expect(hasEnoughSubmissions(0)).toBe(false);
    });

    it('returns false for 1 submission (need pairs)', () => {
      expect(hasEnoughSubmissions(1)).toBe(false);
    });

    it('returns true for 2+ submissions (can form pairs)', () => {
      expect(hasEnoughSubmissions(2)).toBe(true);
      expect(hasEnoughSubmissions(3)).toBe(true);
      expect(hasEnoughSubmissions(5)).toBe(true);
      expect(hasEnoughSubmissions(100)).toBe(true);
    });
  });

  describe('hasEnteredRanking', () => {
    it('returns false for 0 votes with default threshold', () => {
      expect(hasEnteredRanking(0)).toBe(false);
    });

    it('returns false for 4 votes with default threshold', () => {
      expect(hasEnteredRanking(4)).toBe(false);
    });

    it('returns true for exactly 5 votes with default threshold', () => {
      expect(hasEnteredRanking(5)).toBe(true);
    });

    it('returns true for more than 5 votes with default threshold', () => {
      expect(hasEnteredRanking(10)).toBe(true);
    });

    it('works with custom requiredVotes threshold', () => {
      expect(hasEnteredRanking(0, 1)).toBe(false);
      expect(hasEnteredRanking(1, 1)).toBe(true);
      expect(hasEnteredRanking(2, 3)).toBe(false);
      expect(hasEnteredRanking(3, 3)).toBe(true);
    });
  });

  describe('canVoteOnSubmission', () => {
    const currentUserId = 'user-123';
    const otherUserId = 'user-456';

    it('returns true when voting on another user submission', () => {
      expect(canVoteOnSubmission(otherUserId, currentUserId)).toBe(true);
    });

    it('returns false when voting on own submission', () => {
      expect(canVoteOnSubmission(currentUserId, currentUserId)).toBe(false);
    });
  });

  describe('isValidVotingPair', () => {
    const currentUserId = 'user-123';
    const userA = 'user-456';
    const userB = 'user-789';

    it('returns true for pair of other users submissions', () => {
      expect(isValidVotingPair(userA, userB, currentUserId)).toBe(true);
    });

    it('returns false if submission A belongs to voter', () => {
      expect(isValidVotingPair(currentUserId, userB, currentUserId)).toBe(false);
    });

    it('returns false if submission B belongs to voter', () => {
      expect(isValidVotingPair(userA, currentUserId, currentUserId)).toBe(false);
    });

    it('returns false if both submissions belong to voter', () => {
      expect(isValidVotingPair(currentUserId, currentUserId, currentUserId)).toBe(false);
    });
  });

  describe('votesRemainingToEnterRanking', () => {
    it('returns 5 for 0 votes with default threshold', () => {
      expect(votesRemainingToEnterRanking(0)).toBe(5);
    });

    it('returns 3 for 2 votes with default threshold', () => {
      expect(votesRemainingToEnterRanking(2)).toBe(3);
    });

    it('returns 1 for 4 votes with default threshold', () => {
      expect(votesRemainingToEnterRanking(4)).toBe(1);
    });

    it('returns 0 for 5 votes with default threshold', () => {
      expect(votesRemainingToEnterRanking(5)).toBe(0);
    });

    it('returns 0 for more than required votes', () => {
      expect(votesRemainingToEnterRanking(10)).toBe(0);
    });

    it('works with custom requiredVotes threshold', () => {
      expect(votesRemainingToEnterRanking(0, 3)).toBe(3);
      expect(votesRemainingToEnterRanking(2, 3)).toBe(1);
      expect(votesRemainingToEnterRanking(3, 3)).toBe(0);
    });
  });

  describe('voteProgressPercentage', () => {
    it('returns 0 for 0 votes with default threshold', () => {
      expect(voteProgressPercentage(0)).toBe(0);
    });

    it('returns 20 for 1 vote with default threshold', () => {
      expect(voteProgressPercentage(1)).toBe(20);
    });

    it('returns 60 for 3 votes with default threshold', () => {
      expect(voteProgressPercentage(3)).toBe(60);
    });

    it('returns 100 for 5 votes with default threshold', () => {
      expect(voteProgressPercentage(5)).toBe(100);
    });

    it('caps at 100 for more than required votes', () => {
      expect(voteProgressPercentage(10)).toBe(100);
      expect(voteProgressPercentage(100)).toBe(100);
    });

    it('returns 100 for 0 requiredVotes (edge case)', () => {
      expect(voteProgressPercentage(0, 0)).toBe(100);
    });

    it('works with custom requiredVotes threshold', () => {
      expect(voteProgressPercentage(0, 3)).toBe(0);
      expect(voteProgressPercentage(1, 3)).toBeCloseTo(33.33, 1);
      expect(voteProgressPercentage(3, 3)).toBe(100);
    });
  });

  describe('determineVotingState', () => {
    it('returns not_enough_submissions for 0-1 submissions', () => {
      expect(
        determineVotingState({
          submissionCount: 0,
          voteCount: 0,
          hasMorePairs: true,
        })
      ).toBe('not_enough_submissions');

      expect(
        determineVotingState({
          submissionCount: 1,
          voteCount: 0,
          hasMorePairs: true,
        })
      ).toBe('not_enough_submissions');
    });

    it('returns can_vote with 2+ submissions and under threshold', () => {
      expect(
        determineVotingState({
          submissionCount: 3,
          voteCount: 0,
          hasMorePairs: true,
        })
      ).toBe('can_vote');

      expect(
        determineVotingState({
          submissionCount: 10,
          voteCount: 3,
          hasMorePairs: true,
        })
      ).toBe('can_vote');
    });

    it('returns entered_ranking after 5 votes with many submissions', () => {
      expect(
        determineVotingState({
          submissionCount: 10,
          voteCount: 5,
          hasMorePairs: true,
        })
      ).toBe('entered_ranking');
    });

    it('returns no_more_pairs when all pairs exhausted (before entering ranking)', () => {
      expect(
        determineVotingState({
          submissionCount: 10,
          voteCount: 3,
          hasMorePairs: false,
        })
      ).toBe('no_more_pairs');
    });

    it('returns no_more_pairs when all pairs exhausted (after entering ranking)', () => {
      expect(
        determineVotingState({
          submissionCount: 10,
          voteCount: 7,
          hasMorePairs: false,
        })
      ).toBe('no_more_pairs');
    });
  });

  describe('edge cases', () => {
    it('handles boundary at exactly 2 submissions for pair creation', () => {
      expect(hasEnoughSubmissions(1)).toBe(false);
      expect(hasEnoughSubmissions(2)).toBe(true);
    });

    it('handles boundary at exactly 5 submissions for ranking', () => {
      expect(hasEnoughSubmissionsForRanking(4)).toBe(false);
      expect(hasEnoughSubmissionsForRanking(5)).toBe(true);
    });

    it('handles boundary at exactly 5 votes with default threshold', () => {
      expect(hasEnteredRanking(4)).toBe(false);
      expect(hasEnteredRanking(5)).toBe(true);
    });

    it('voting state transitions correctly at boundaries', () => {
      // 4 votes -> can_vote
      expect(
        determineVotingState({
          submissionCount: 10,
          voteCount: 4,
          hasMorePairs: true,
        })
      ).toBe('can_vote');

      // 5 votes -> entered_ranking
      expect(
        determineVotingState({
          submissionCount: 10,
          voteCount: 5,
          hasMorePairs: true,
        })
      ).toBe('entered_ranking');
    });

    it('dynamic threshold: 3 submissions = 3 pairs = require 3 votes', () => {
      const required = calculateRequiredVotes(3);
      expect(required).toBe(3);
      expect(hasEnteredRanking(2, required)).toBe(false);
      expect(hasEnteredRanking(3, required)).toBe(true);
    });

    it('dynamic threshold: 2 submissions = 1 pair = require 1 vote', () => {
      const required = calculateRequiredVotes(2);
      expect(required).toBe(1);
      expect(hasEnteredRanking(0, required)).toBe(false);
      expect(hasEnteredRanking(1, required)).toBe(true);
    });
  });
});
