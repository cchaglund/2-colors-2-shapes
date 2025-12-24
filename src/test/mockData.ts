/**
 * Mock data for testing voting components
 */

import type { Shape, RankingEntry, VotingPair, DailyChallenge } from '../types';

// Fixed challenge for consistent test rendering
export const MOCK_CHALLENGE: DailyChallenge = {
  date: '2024-01-15',
  colors: ['#FF6B6B', '#4ECDC4'],
  shapes: [
    { type: 'circle', name: 'Circle', svg: 'M50,10 a40,40 0 1,0 0.001,0 Z' },
    { type: 'square', name: 'Square', svg: 'M10,10 H90 V90 H10 Z' },
  ],
};

// Mock shapes for test submissions
function createMockShapes(seed: number): Shape[] {
  const shapes: Shape[] = [];
  const count = 2 + (seed % 4);

  for (let i = 0; i < count; i++) {
    shapes.push({
      id: `shape-${seed}-${i}`,
      type: (seed + i) % 2 === 0 ? 'circle' : 'square',
      name: `Shape ${i + 1}`,
      x: 150 + (((seed * 37 + i * 73) % 500)),
      y: 150 + (((seed * 53 + i * 97) % 500)),
      size: 80 + ((seed * 17 + i * 31) % 120),
      rotation: (seed * 41 + i * 67) % 360,
      colorIndex: (seed + i) % 2 === 0 ? 0 : 1,
      zIndex: i,
      flipX: (seed + i) % 5 === 0,
      flipY: (seed + i) % 7 === 0,
    });
  }

  return shapes;
}

// Mock submission for voting pair
export function createMockSubmission(id: string, userId: string, seed: number) {
  return {
    id,
    user_id: userId,
    shapes: createMockShapes(seed),
    background_color_index: seed % 3 === 0 ? 0 : seed % 3 === 1 ? 1 : null,
  };
}

// Mock voting pairs for different test scenarios
export const MOCK_VOTING_PAIRS: VotingPair[] = [
  {
    submissionA: createMockSubmission('sub-a1', 'user-1', 1),
    submissionB: createMockSubmission('sub-b1', 'user-2', 2),
  },
  {
    submissionA: createMockSubmission('sub-a2', 'user-3', 3),
    submissionB: createMockSubmission('sub-b2', 'user-4', 4),
  },
  {
    submissionA: createMockSubmission('sub-a3', 'user-5', 5),
    submissionB: createMockSubmission('sub-b3', 'user-6', 6),
  },
  {
    submissionA: createMockSubmission('sub-a4', 'user-7', 7),
    submissionB: createMockSubmission('sub-b4', 'user-8', 8),
  },
  {
    submissionA: createMockSubmission('sub-a5', 'user-9', 9),
    submissionB: createMockSubmission('sub-b5', 'user-10', 10),
  },
];

// Mock ranking entries for winner announcement
export const MOCK_TOP_THREE: RankingEntry[] = [
  {
    rank: 1,
    submission_id: 'sub-winner',
    user_id: 'user-winner',
    nickname: 'ArtistPro',
    elo_score: 1150,
    vote_count: 12,
    shapes: createMockShapes(100),
    background_color_index: 0,
  },
  {
    rank: 2,
    submission_id: 'sub-second',
    user_id: 'user-second',
    nickname: 'DesignMaster',
    elo_score: 1080,
    vote_count: 10,
    shapes: createMockShapes(200),
    background_color_index: 1,
  },
  {
    rank: 3,
    submission_id: 'sub-third',
    user_id: 'user-third',
    nickname: 'CreativeGuru',
    elo_score: 1020,
    vote_count: 8,
    shapes: createMockShapes(300),
    background_color_index: null,
  },
];

// Tied ranking scenario
export const MOCK_TIED_TOP_THREE: RankingEntry[] = [
  {
    rank: 1,
    submission_id: 'sub-tie-1',
    user_id: 'user-tie-1',
    nickname: 'TieBreaker1',
    elo_score: 1100,
    vote_count: 10,
    shapes: createMockShapes(400),
    background_color_index: 0,
  },
  {
    rank: 1,
    submission_id: 'sub-tie-2',
    user_id: 'user-tie-2',
    nickname: 'TieBreaker2',
    elo_score: 1100,
    vote_count: 10,
    shapes: createMockShapes(500),
    background_color_index: 1,
  },
  {
    rank: 3,
    submission_id: 'sub-third-tied',
    user_id: 'user-third-tied',
    nickname: 'AlmostFirst',
    elo_score: 1050,
    vote_count: 9,
    shapes: createMockShapes(600),
    background_color_index: null,
  },
];

// Three-way tie scenario
export const MOCK_THREE_WAY_TIE: RankingEntry[] = [
  {
    rank: 1,
    submission_id: 'sub-3tie-1',
    user_id: 'user-3tie-1',
    nickname: 'TripleThreat1',
    elo_score: 1100,
    vote_count: 10,
    shapes: createMockShapes(700),
    background_color_index: 0,
  },
  {
    rank: 1,
    submission_id: 'sub-3tie-2',
    user_id: 'user-3tie-2',
    nickname: 'TripleThreat2',
    elo_score: 1100,
    vote_count: 10,
    shapes: createMockShapes(800),
    background_color_index: 1,
  },
  {
    rank: 1,
    submission_id: 'sub-3tie-3',
    user_id: 'user-3tie-3',
    nickname: 'TripleThreat3',
    elo_score: 1100,
    vote_count: 10,
    shapes: createMockShapes(900),
    background_color_index: null,
  },
];
