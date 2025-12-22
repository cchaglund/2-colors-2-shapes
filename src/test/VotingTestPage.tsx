/**
 * Voting Test Page
 *
 * Visual test page for voting components with mock data.
 * Access via ?test=voting in the URL.
 */

import { useState, useMemo } from 'react';
import { SubmissionThumbnail } from '../components/SubmissionThumbnail';
import { WinnerAnnouncementModal } from '../components/WinnerAnnouncementModal';
import { TrophyBadge } from '../components/TrophyBadge';
import {
  MOCK_CHALLENGE,
  MOCK_VOTING_PAIRS,
  MOCK_TOP_THREE,
  MOCK_TIED_TOP_THREE,
  MOCK_THREE_WAY_TIE,
  createMockSubmission,
} from './mockData';
import { calculateRequiredVotes, calculateTotalPairs } from '../utils/votingRules';
import { generateDailyChallenge } from '../utils/dailyChallenge';
import type { RankingEntry, VotingPair } from '../types';

type TestScenario =
  | 'voting-ui'
  | 'voting-flow'
  | 'voting-progress'
  | 'voting-dynamic-threshold'
  | 'voting-confirmation'
  | 'voting-no-pairs'
  | 'voting-bootstrap-zero'
  | 'voting-bootstrap-one'
  | 'winner-normal'
  | 'winner-tied'
  | 'winner-three-way'
  | 'winner-not-enough'
  | 'calendar-trophies';

interface ScenarioConfig {
  name: string;
  description: string;
}

const SCENARIOS: Record<TestScenario, ScenarioConfig> = {
  'voting-ui': {
    name: 'Voting UI',
    description: 'Main voting interface with a pair of submissions',
  },
  'voting-flow': {
    name: 'Interactive Flow',
    description: 'Simulate full voting flow with confirmation modal',
  },
  'voting-progress': {
    name: 'Voting Progress',
    description: 'Vote progress states (0-5 votes)',
  },
  'voting-dynamic-threshold': {
    name: 'Dynamic Threshold',
    description: 'Vote requirements based on available submissions (2-4 subs)',
  },
  'voting-confirmation': {
    name: 'Voting Confirmation',
    description: 'Confirmation screen after reaching vote requirement',
  },
  'voting-no-pairs': {
    name: 'No More Pairs',
    description: 'When all pairs have been voted on',
  },
  'voting-bootstrap-zero': {
    name: 'Bootstrap (0 subs)',
    description: 'Day 1: No submissions exist yet - opt-in prompt',
  },
  'voting-bootstrap-one': {
    name: 'Bootstrap (1 sub)',
    description: 'Only 1 submission exists - no pairs possible',
  },
  'winner-normal': {
    name: 'Winner - Normal',
    description: 'Standard winner announcement with top 3',
  },
  'winner-tied': {
    name: 'Winner - Tied',
    description: 'Winner announcement with 1st place tie',
  },
  'winner-three-way': {
    name: 'Winner - Three-Way Tie',
    description: 'Winner announcement with three-way tie',
  },
  'winner-not-enough': {
    name: 'Winner - Not Enough',
    description: 'Winner modal when not enough submissions',
  },
  'calendar-trophies': {
    name: 'Calendar with Trophies',
    description: 'User calendar showing submissions with various trophy placements',
  },
};

export function VotingTestPage() {
  const [activeScenario, setActiveScenario] = useState<TestScenario | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Interactive flow state
  const [flowSubmissionCount, setFlowSubmissionCount] = useState(5);
  const [flowVoteCount, setFlowVoteCount] = useState(0);
  const [flowPairIndex, setFlowPairIndex] = useState(0);
  const [flowShowConfirmation, setFlowShowConfirmation] = useState(false);
  const [flowHasEnteredRanking, setFlowHasEnteredRanking] = useState(false);

  const flowRequiredVotes = calculateRequiredVotes(flowSubmissionCount);
  const flowTotalPairs = calculateTotalPairs(flowSubmissionCount);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleVote = (winnerId: string) => {
    console.log('Vote cast for:', winnerId);
    setVoteCount((prev) => Math.min(prev + 1, 10));
    setCurrentPairIndex((prev) => Math.min(prev + 1, MOCK_VOTING_PAIRS.length - 1));
  };

  const handleSkip = () => {
    console.log('Pair skipped');
    setCurrentPairIndex((prev) => Math.min(prev + 1, MOCK_VOTING_PAIRS.length - 1));
  };

  const currentPair = MOCK_VOTING_PAIRS[currentPairIndex];

  // Interactive flow handlers
  const handleFlowVote = () => {
    const newVoteCount = flowVoteCount + 1;
    const newPairIndex = flowPairIndex + 1;
    setFlowVoteCount(newVoteCount);
    setFlowPairIndex(newPairIndex);

    // Check if just reached the threshold
    if (newVoteCount >= flowRequiredVotes && !flowHasEnteredRanking) {
      setFlowHasEnteredRanking(true);
      setFlowShowConfirmation(true);
    }
  };

  const handleFlowSkip = () => {
    // Skip doesn't increment vote count
    setFlowPairIndex((prev) => prev + 1);
  };

  const handleFlowContinueVoting = () => {
    setFlowShowConfirmation(false);
  };

  const handleFlowDone = () => {
    // Reset flow
    setFlowVoteCount(0);
    setFlowPairIndex(0);
    setFlowShowConfirmation(false);
    setFlowHasEnteredRanking(false);
  };

  const resetFlow = () => {
    setFlowVoteCount(0);
    setFlowPairIndex(0);
    setFlowShowConfirmation(false);
    setFlowHasEnteredRanking(false);
  };

  // Mock calendar data - generate submissions for December 2024 with various trophy placements
  const mockCalendarData = useMemo(() => {
    const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const year = 2024;
    const month = 11; // December (0-indexed)
    const daysInMonth = 31;
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    // Define which days have submissions and their ranks
    const submissionDays: { day: number; rank: number | null; seed: number }[] = [
      { day: 2, rank: 1, seed: 100 },   // Gold
      { day: 5, rank: 2, seed: 101 },   // Silver
      { day: 7, rank: null, seed: 102 }, // No rank (participated but not top 3)
      { day: 9, rank: 3, seed: 103 },   // Bronze
      { day: 11, rank: null, seed: 104 },
      { day: 13, rank: 1, seed: 105 },  // Gold
      { day: 15, rank: null, seed: 106 },
      { day: 17, rank: 2, seed: 107 },  // Silver
      { day: 18, rank: 1, seed: 108 },  // Gold (back to back!)
      { day: 19, rank: 3, seed: 109 },  // Bronze
      { day: 21, rank: null, seed: 110 },
    ];

    return {
      year,
      month,
      daysInMonth,
      firstDayOfWeek,
      submissionDays,
      DAYS_OF_WEEK,
    };
  }, []);

  const renderCalendarWithTrophies = () => {
    const { year, month, daysInMonth, firstDayOfWeek, submissionDays, DAYS_OF_WEEK } = mockCalendarData;
    const submissionMap = new Map(submissionDays.map(s => [s.day, s]));
    const today = 21; // Pretend today is Dec 21

    // Build calendar grid
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    return (
      <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-4xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            My Submissions
          </h2>
          <button
            className="p-2 rounded-md transition-colors bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
            aria-label="Close calendar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button className="p-2 rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-[var(--color-text-primary)]">
              December {year}
            </span>
            <button className="px-3 py-1 rounded-md text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
              Today
            </button>
          </div>
          <button className="p-2 rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] opacity-30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center py-2 text-sm font-medium text-[var(--color-text-tertiary)]">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const submission = submissionMap.get(day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const challenge = generateDailyChallenge(dateStr);
            const isToday = day === today;
            const isFuture = day > today;

            return (
              <div
                key={day}
                className={`
                  aspect-square rounded-lg p-1 transition-all
                  ${submission ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''}
                  ${isFuture ? 'opacity-30' : ''}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                `}
                style={{
                  backgroundColor: submission
                    ? 'var(--color-bg-secondary)'
                    : 'var(--color-bg-tertiary)',
                }}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`text-xs font-medium ${isToday ? 'text-blue-500' : ''}`}
                    style={{
                      color: isToday
                        ? undefined
                        : submission
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-tertiary)',
                    }}
                  >
                    {day}
                  </span>
                  <div className="flex-1 flex items-center justify-center relative">
                    {submission ? (
                      <>
                        <SubmissionThumbnail
                          shapes={createMockSubmission(`sub-${day}`, 'user-1', submission.seed).shapes}
                          challenge={challenge}
                          backgroundColorIndex={submission.seed % 3 === 0 ? 0 : submission.seed % 3 === 1 ? 1 : null}
                          size={70}
                        />
                        {submission.rank !== null && submission.rank <= 3 && (
                          <div className="absolute -top-1 -right-1">
                            <TrophyBadge rank={submission.rank as 1 | 2 | 3} size="sm" />
                          </div>
                        )}
                      </>
                    ) : !isFuture ? (
                      <div className="text-xs text-center text-[var(--color-text-tertiary)]">
                        No submission
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
          <span>Total submissions: {submissionDays.length}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <TrophyBadge rank={1} size="sm" /> ×3
            </span>
            <span className="flex items-center gap-1">
              <TrophyBadge rank={2} size="sm" /> ×2
            </span>
            <span className="flex items-center gap-1">
              <TrophyBadge rank={3} size="sm" /> ×2
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderVotingUI = (pair: VotingPair, votes: number) => (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-3xl shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Vote on Yesterday's Submissions
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(MOCK_CHALLENGE.date)}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-[var(--color-text-primary)]">{votes} of 5 votes</div>
          <div className="text-xs text-[var(--color-text-tertiary)]">
            {5 - votes > 0 ? `${5 - votes} more to enter ranking` : 'Entered in ranking!'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${Math.min((votes / 5) * 100, 100)}%` }}
        />
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <button
          onClick={() => handleVote(pair.submissionA.id)}
          className="group relative p-4 border-2 border-[var(--color-border)] rounded-xl hover:border-blue-500 transition-colors"
        >
          <div className="aspect-square">
            <SubmissionThumbnail
              shapes={pair.submissionA.shapes}
              challenge={MOCK_CHALLENGE}
              backgroundColorIndex={pair.submissionA.background_color_index}
              size={280}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-blue-600/80 text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            Choose this one
          </div>
        </button>

        <button
          onClick={() => handleVote(pair.submissionB.id)}
          className="group relative p-4 border-2 border-[var(--color-border)] rounded-xl hover:border-blue-500 transition-colors"
        >
          <div className="aspect-square">
            <SubmissionThumbnail
              shapes={pair.submissionB.shapes}
              challenge={MOCK_CHALLENGE}
              backgroundColorIndex={pair.submissionB.background_color_index}
              size={280}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-blue-600/80 text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            Choose this one
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors">
          Skip voting (won't enter ranking)
        </button>
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Can't decide, skip this pair
        </button>
      </div>
    </div>
  );

  const renderConfirmationScreen = () => (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md shadow-xl text-center">
      <div className="text-4xl mb-4">🎉</div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
        Your submission is now entered!
      </h2>
      <p className="text-[var(--color-text-secondary)] mb-6">
        Thanks for voting! Your artwork will be included in today's ranking.
      </p>
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-secondary)] transition-colors">
          Continue Voting
        </button>
        <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Done
        </button>
      </div>
    </div>
  );

  const renderNoMorePairs = (votes: number, required: number) => {
    const hasVotedEnough = votes >= required;
    return (
      <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md shadow-xl text-center">
        {hasVotedEnough ? (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">All Done!</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              You've voted on all available pairs. Your artwork is entered in today's ranking!
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">No More Pairs</h2>
            <p className="text-[var(--color-text-secondary)] mb-4">
              You've seen all available artwork pairs for {formatDate(MOCK_CHALLENGE.date)}.
            </p>
            <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
              You voted on {votes} pair{votes !== 1 ? 's' : ''}.
              {required > votes && ` Needed ${required} to enter ranking.`}
            </p>
          </>
        )}
        <button className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          {hasVotedEnough ? 'Done' : 'Continue Without Ranking'}
        </button>
      </div>
    );
  };

  const renderBootstrapZero = () => (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md shadow-xl text-center">
      <div className="text-4xl mb-4">🎨</div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Submit for Voting?</h2>
      <p className="text-[var(--color-text-secondary)] mb-6">
        There were no submissions yesterday to vote on. Would you like your artwork to be included in
        tomorrow's voting?
      </p>
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-secondary)] transition-colors">
          No thanks
        </button>
        <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Yes, include me!
        </button>
      </div>
    </div>
  );

  const renderBootstrapOne = () => (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md shadow-xl text-center">
      <div className="text-4xl mb-4">🎨</div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Submit for Voting?</h2>
      <p className="text-[var(--color-text-secondary)] mb-6">
        There was only 1 submission yesterday, so there's nothing to vote on yet. Would you like your artwork
        to be included in tomorrow's voting?
      </p>
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-secondary)] transition-colors">
          No thanks
        </button>
        <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Yes, include me!
        </button>
      </div>
    </div>
  );

  const renderDynamicThreshold = (submissionCount: number) => {
    const required = calculateRequiredVotes(submissionCount);
    const totalPairs = calculateTotalPairs(submissionCount);
    return (
      <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{submissionCount}</div>
          <div className="text-sm text-[var(--color-text-secondary)]">submissions</div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Total possible pairs:</span>
            <span className="text-[var(--color-text-primary)] font-medium">{totalPairs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Votes required:</span>
            <span className="text-[var(--color-text-primary)] font-medium">{required}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Formula:</span>
            <span className="text-[var(--color-text-tertiary)]">min(5, pairs)</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="text-xs text-[var(--color-text-tertiary)]">
            {required === 5
              ? 'Standard: 5 votes required'
              : `Reduced: Only ${required} vote${required !== 1 ? 's' : ''} needed`}
          </div>
        </div>
      </div>
    );
  };

  const renderWinnerModal = (topThree: RankingEntry[], notEnough = false, total = 10) => (
    <WinnerAnnouncementModal
      challengeDate={MOCK_CHALLENGE.date}
      topThree={topThree}
      totalSubmissions={total}
      notEnoughSubmissions={notEnough}
      onDismiss={() => setShowModal(false)}
    />
  );

  // Interactive flow voting UI with dynamic threshold
  const renderFlowVotingUI = () => {
    const pair = MOCK_VOTING_PAIRS[flowPairIndex % MOCK_VOTING_PAIRS.length];
    const noMorePairs = flowPairIndex >= flowTotalPairs;

    // No more pairs state
    if (noMorePairs) {
      return (
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md shadow-xl text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">All Done!</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            You've voted on all available pairs. Your artwork is entered in today's ranking!
          </p>
          <button
            onClick={handleFlowDone}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      );
    }

    return (
      <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-3xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Vote on Yesterday's Submissions
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(MOCK_CHALLENGE.date)}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">
              {flowVoteCount} of {flowRequiredVotes} votes
            </div>
            <div className="text-xs text-[var(--color-text-tertiary)]">
              {flowRequiredVotes - flowVoteCount > 0
                ? `${flowRequiredVotes - flowVoteCount} more to enter ranking`
                : 'Entered in ranking!'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${flowRequiredVotes > 0 ? Math.min((flowVoteCount / flowRequiredVotes) * 100, 100) : 100}%` }}
          />
        </div>

        {/* Side by side comparison */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <button
            onClick={handleFlowVote}
            className="group relative p-4 border-2 border-[var(--color-border)] rounded-xl hover:border-blue-500 transition-colors"
          >
            <div className="aspect-square">
              <SubmissionThumbnail
                shapes={pair.submissionA.shapes}
                challenge={MOCK_CHALLENGE}
                backgroundColorIndex={pair.submissionA.background_color_index}
                size={280}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-blue-600/80 text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              Choose this one
            </div>
          </button>

          <button
            onClick={handleFlowVote}
            className="group relative p-4 border-2 border-[var(--color-border)] rounded-xl hover:border-blue-500 transition-colors"
          >
            <div className="aspect-square">
              <SubmissionThumbnail
                shapes={pair.submissionB.shapes}
                challenge={MOCK_CHALLENGE}
                backgroundColorIndex={pair.submissionB.background_color_index}
                size={280}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-blue-600/80 text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              Choose this one
            </div>
          </button>
        </div>

        {/* Actions - changes based on whether user entered ranking */}
        <div className="flex justify-between items-center">
          {flowHasEnteredRanking ? (
            <button
              onClick={handleFlowDone}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Done voting
            </button>
          ) : (
            <button className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors">
              Skip voting (won't enter ranking)
            </button>
          )}
          <button
            onClick={handleFlowSkip}
            className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Can't decide, skip this pair
          </button>
        </div>
      </div>
    );
  };

  // Confirmation modal for interactive flow
  const renderFlowConfirmation = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Your submission is now entered!
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Thanks for voting! Your artwork will be included in today's ranking.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleFlowContinueVoting}
            disabled={flowPairIndex >= flowTotalPairs}
            className="flex-1 px-4 py-2.5 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue Voting
          </button>
          <button
            onClick={handleFlowDone}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  const renderScenario = () => {
    switch (activeScenario) {
      case 'voting-ui':
        return (
          <div className="flex items-center justify-center min-h-[600px]">
            {renderVotingUI(currentPair, voteCount)}
          </div>
        );

      case 'voting-flow':
        return (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Flow Controls</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[var(--color-text-secondary)]">Submissions:</label>
                  <select
                    value={flowSubmissionCount}
                    onChange={(e) => {
                      setFlowSubmissionCount(Number(e.target.value));
                      resetFlow();
                    }}
                    className="px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm"
                  >
                    <option value={2}>2 (1 pair, 1 vote req)</option>
                    <option value={3}>3 (3 pairs, 3 votes req)</option>
                    <option value={4}>4 (6 pairs, 5 votes req)</option>
                    <option value={5}>5 (10 pairs, 5 votes req)</option>
                    <option value={10}>10 (45 pairs, 5 votes req)</option>
                  </select>
                </div>
                <button
                  onClick={resetFlow}
                  className="px-3 py-1 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  Reset Flow
                </button>
                <div className="flex-1" />
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  Status: {flowHasEnteredRanking ? '✓ Entered ranking' : 'Not in ranking yet'} |
                  Pairs seen: {flowPairIndex}/{flowTotalPairs}
                </div>
              </div>
            </div>

            {/* Interactive voting UI or confirmation */}
            <div className="flex items-center justify-center min-h-[500px]">
              {flowShowConfirmation ? renderFlowConfirmation() : renderFlowVotingUI()}
            </div>
          </div>
        );

      case 'voting-progress':
        return (
          <div className="space-y-8">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Vote Progress States</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1, 2, 3, 4, 5, 7].map((count) => (
                <div key={count} className="p-4 border border-[var(--color-border)] rounded-lg">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    {count} vote{count !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${Math.min((count / 5) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {count >= 5 ? 'Entered!' : `${5 - count} more`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'voting-confirmation':
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            {renderConfirmationScreen()}
          </div>
        );

      case 'voting-no-pairs':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              No More Pairs Scenarios
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              "No More Pairs" only occurs when you've voted on ALL available pairs. With few submissions,
              this naturally leads to entering the ranking since you voted on everything available.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Scenario: 2 submissions (1 pair), user voted on it - entered! */}
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  2 subs = 1 pair → voted on it = entered!
                </p>
                {renderNoMorePairs(1, 1)}
              </div>
              {/* Scenario: 3 submissions (3 pairs possible), user voted on all 3 - entered ranking! */}
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  3 subs = 3 pairs → voted on all = entered!
                </p>
                {renderNoMorePairs(3, 3)}
              </div>
              {/* Scenario: 5+ submissions, voted on all 5 required - entered! */}
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  5+ subs → voted 5 = entered!
                </p>
                {renderNoMorePairs(5, 5)}
              </div>
            </div>
          </div>
        );

      case 'voting-dynamic-threshold':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
              Dynamic Vote Requirements
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              When fewer than 5 submissions exist, the vote requirement adjusts to the number of available pairs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[2, 3, 4, 5, 6, 10].map((count) => (
                <div key={count}>{renderDynamicThreshold(count)}</div>
              ))}
            </div>
          </div>
        );

      case 'voting-bootstrap-zero':
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            {renderBootstrapZero()}
          </div>
        );

      case 'voting-bootstrap-one':
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            {renderBootstrapOne()}
          </div>
        );

      case 'winner-normal':
        return showModal ? (
          renderWinnerModal(MOCK_TOP_THREE)
        ) : (
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Show Winner Modal
            </button>
          </div>
        );

      case 'winner-tied':
        return showModal ? (
          renderWinnerModal(MOCK_TIED_TOP_THREE)
        ) : (
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Show Tied Winner Modal
            </button>
          </div>
        );

      case 'winner-three-way':
        return showModal ? (
          renderWinnerModal(MOCK_THREE_WAY_TIE)
        ) : (
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Show Three-Way Tie Modal
            </button>
          </div>
        );

      case 'winner-not-enough':
        return showModal ? (
          renderWinnerModal([], true, 3)
        ) : (
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Show Not Enough Modal
            </button>
          </div>
        );

      case 'calendar-trophies':
        return (
          <div className="flex items-center justify-center">
            {renderCalendarWithTrophies()}
          </div>
        );

      default:
        return (
          <div className="text-center text-[var(--color-text-secondary)]">
            Select a scenario from the sidebar
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-[var(--color-border)] p-4 overflow-y-auto">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Voting Tests</h1>
        <p className="text-xs text-[var(--color-text-tertiary)] mb-6">
          Visual test page for voting components
        </p>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
            Voting Modal
          </h3>
          {(
            ['voting-ui', 'voting-flow', 'voting-progress', 'voting-dynamic-threshold', 'voting-confirmation', 'voting-no-pairs', 'voting-bootstrap-zero', 'voting-bootstrap-one'] as TestScenario[]
          ).map((scenario) => (
            <button
              key={scenario}
              onClick={() => {
                setActiveScenario(scenario);
                setShowModal(false);
                setVoteCount(0);
                setCurrentPairIndex(0);
                if (scenario === 'voting-flow') {
                  resetFlow();
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeScenario === scenario
                  ? 'bg-blue-600 text-white'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {SCENARIOS[scenario].name}
            </button>
          ))}

          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mt-6 mb-2">
            Winner Announcement
          </h3>
          {(
            ['winner-normal', 'winner-tied', 'winner-three-way', 'winner-not-enough'] as TestScenario[]
          ).map((scenario) => (
            <button
              key={scenario}
              onClick={() => {
                setActiveScenario(scenario);
                setShowModal(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeScenario === scenario
                  ? 'bg-blue-600 text-white'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {SCENARIOS[scenario].name}
            </button>
          ))}

          <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mt-6 mb-2">
            Calendar
          </h3>
          {(['calendar-trophies'] as TestScenario[]).map((scenario) => (
            <button
              key={scenario}
              onClick={() => {
                setActiveScenario(scenario);
                setShowModal(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeScenario === scenario
                  ? 'bg-blue-600 text-white'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {SCENARIOS[scenario].name}
            </button>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-[var(--color-border)]">
          <a
            href="/"
            className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← Back to App
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8">
        {activeScenario && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {SCENARIOS[activeScenario].name}
            </h2>
            <p className="text-[var(--color-text-secondary)]">{SCENARIOS[activeScenario].description}</p>
          </div>
        )}

        {renderScenario()}
      </div>
    </div>
  );
}
