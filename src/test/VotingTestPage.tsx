/**
 * Voting Test Page
 *
 * Visual test page for voting components with mock data.
 * Access via ?test=voting in the URL.
 *
 * Uses the actual production components with mock data to ensure
 * tests verify real component behavior.
 */

import { useState } from 'react';
import { WinnerAnnouncementModal } from '../components/WinnerAnnouncementModal';
import {
  VotingPairView,
  VotingConfirmation,
  VotingNoPairs,
  VotingOptInPrompt,
  VotingProgress,
} from '../components/voting';
import {
  MOCK_CHALLENGE,
  MOCK_VOTING_PAIRS,
  MOCK_TOP_THREE,
  MOCK_TIED_TOP_THREE,
  MOCK_THREE_WAY_TIE,
} from './mockData';
import { calculateRequiredVotes, calculateTotalPairs } from '../utils/votingRules';
import type { RankingEntry } from '../types';

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
  | 'winner-three-way';

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
  const handleFlowVote = (winnerId: string) => {
    console.log('Flow vote cast for:', winnerId);
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


  const renderDynamicThreshold = (submissionCount: number) => {
    const required = calculateRequiredVotes(submissionCount);
    const totalPairs = calculateTotalPairs(submissionCount);
    return (
      <div className="bg-(--color-bg-primary) border border-(--color-border) rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-(--color-text-primary)">{submissionCount}</div>
          <div className="text-sm text-(--color-text-secondary)">submissions</div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-(--color-text-secondary)">Total possible pairs:</span>
            <span className="text-(--color-text-primary) font-medium">{totalPairs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-(--color-text-secondary)">Votes required:</span>
            <span className="text-(--color-text-primary) font-medium">{required}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-(--color-text-secondary)">Formula:</span>
            <span className="text-(--color-text-tertiary)">min(5, pairs)</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-(--color-border)">
          <div className="text-xs text-(--color-text-tertiary)">
            {required === 5
              ? 'Standard: 5 votes required'
              : `Reduced: Only ${required} vote${required !== 1 ? 's' : ''} needed`}
          </div>
        </div>
      </div>
    );
  };

  const renderWinnerModal = (topThree: RankingEntry[]) => (
    <WinnerAnnouncementModal
      challengeDate={MOCK_CHALLENGE.date}
      topThree={topThree}
      onDismiss={() => setShowModal(false)}
      onViewSubmission={(submissionId) => {
        alert(`View submission: ${submissionId}`);
      }}
    />
  );

  const renderScenario = () => {
    switch (activeScenario) {
      case 'voting-ui':
        return (
          <div className="flex items-center justify-center min-h-150">
            <VotingPairView
              currentPair={currentPair}
              challenge={MOCK_CHALLENGE}
              challengeDate={MOCK_CHALLENGE.date}
              voteCount={voteCount}
              requiredVotes={5}
              submitting={false}
              onVote={handleVote}
              onSkip={handleSkip}
              onSkipVoting={() => console.log('Skip voting clicked')}
            />
          </div>
        );

      case 'voting-flow': {
        const flowPair = MOCK_VOTING_PAIRS[flowPairIndex % MOCK_VOTING_PAIRS.length];
        const noMorePairs = flowPairIndex >= flowTotalPairs;

        return (
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-(--color-bg-secondary) border border-(--color-border) rounded-lg p-4">
              <h3 className="text-sm font-semibold text-(--color-text-primary) mb-3">Flow Controls</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-(--color-text-secondary)">Submissions:</label>
                  <select
                    value={flowSubmissionCount}
                    onChange={(e) => {
                      setFlowSubmissionCount(Number(e.target.value));
                      resetFlow();
                    }}
                    className="px-2 py-1 rounded border border-(--color-border) bg-(--color-bg-primary) text-(--color-text-primary) text-sm"
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
                  className="px-3 py-1 text-sm border border-(--color-border) rounded hover:bg-(--color-bg-tertiary) transition-colors"
                >
                  Reset Flow
                </button>
                <div className="flex-1" />
                <div className="text-xs text-(--color-text-tertiary)">
                  Status: {flowHasEnteredRanking ? '✓ Entered ranking' : 'Not in ranking yet'} |
                  Pairs seen: {flowPairIndex}/{flowTotalPairs}
                </div>
              </div>
            </div>

            {/* Interactive voting UI or confirmation */}
            <div className="flex items-center justify-center min-h-125">
              {flowShowConfirmation ? (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <VotingConfirmation
                    canContinueVoting={flowPairIndex < flowTotalPairs}
                    onContinue={handleFlowContinueVoting}
                    onDone={handleFlowDone}
                  />
                </div>
              ) : noMorePairs ? (
                <VotingNoPairs
                  voteCount={flowVoteCount}
                  requiredVotes={flowRequiredVotes}
                  challengeDate={MOCK_CHALLENGE.date}
                  onDone={handleFlowDone}
                  onSkipVoting={handleFlowDone}
                />
              ) : (
                <VotingPairView
                  currentPair={flowPair}
                  challenge={MOCK_CHALLENGE}
                  challengeDate={MOCK_CHALLENGE.date}
                  voteCount={flowVoteCount}
                  requiredVotes={flowRequiredVotes}
                  submitting={false}
                  onVote={handleFlowVote}
                  onSkip={handleFlowSkip}
                  onSkipVoting={() => console.log('Skip voting clicked')}
                />
              )}
            </div>
          </div>
        );
      }

      case 'voting-progress':
        return (
          <div className="space-y-8">
            <h3 className="text-lg font-medium text-(--color-text-primary)">Vote Progress States</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1, 2, 3, 4, 5, 7].map((count) => (
                <div key={count} className="p-4 border border-(--color-border) rounded-lg">
                  <p className="text-sm text-(--color-text-secondary) mb-2">
                    {count} vote{count !== 1 ? 's' : ''}
                  </p>
                  <VotingProgress voteCount={count} requiredVotes={5} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'voting-confirmation':
        return (
          <div className="flex items-center justify-center min-h-100">
            <VotingConfirmation
              canContinueVoting={true}
              onContinue={() => console.log('Continue clicked')}
              onDone={() => console.log('Done clicked')}
            />
          </div>
        );

      case 'voting-no-pairs':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-(--color-text-primary)">
              No More Pairs Scenarios
            </h3>
            <p className="text-sm text-(--color-text-secondary) mb-4">
              "No More Pairs" only occurs when you've voted on ALL available pairs. With few submissions,
              this naturally leads to entering the ranking since you voted on everything available.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Scenario: 2 submissions (1 pair), user voted on it - entered! */}
              <div>
                <p className="text-sm text-(--color-text-secondary) mb-2">
                  2 subs = 1 pair → voted on it = entered!
                </p>
                <VotingNoPairs
                  voteCount={1}
                  requiredVotes={1}
                  challengeDate={MOCK_CHALLENGE.date}
                  onDone={() => console.log('Done')}
                  onSkipVoting={() => console.log('Skip')}
                />
              </div>
              {/* Scenario: 3 submissions (3 pairs possible), user voted on all 3 - entered ranking! */}
              <div>
                <p className="text-sm text-(--color-text-secondary) mb-2">
                  3 subs = 3 pairs → voted on all = entered!
                </p>
                <VotingNoPairs
                  voteCount={3}
                  requiredVotes={3}
                  challengeDate={MOCK_CHALLENGE.date}
                  onDone={() => console.log('Done')}
                  onSkipVoting={() => console.log('Skip')}
                />
              </div>
              {/* Scenario: 5+ submissions, voted on all 5 required - entered! */}
              <div>
                <p className="text-sm text-(--color-text-secondary) mb-2">
                  5+ subs → voted 5 = entered!
                </p>
                <VotingNoPairs
                  voteCount={5}
                  requiredVotes={5}
                  challengeDate={MOCK_CHALLENGE.date}
                  onDone={() => console.log('Done')}
                  onSkipVoting={() => console.log('Skip')}
                />
              </div>
            </div>
          </div>
        );

      case 'voting-dynamic-threshold':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-(--color-text-primary)">
              Dynamic Vote Requirements
            </h3>
            <p className="text-sm text-(--color-text-secondary)">
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
          <div className="flex items-center justify-center min-h-100">
            <VotingOptInPrompt
              onOptIn={() => console.log('Opted in')}
              onSkip={() => console.log('Skipped')}
            />
          </div>
        );

      case 'voting-bootstrap-one':
        return (
          <div className="flex items-center justify-center min-h-100">
            <VotingOptInPrompt
              onOptIn={() => console.log('Opted in')}
              onSkip={() => console.log('Skipped')}
            />
          </div>
        );

      case 'winner-normal':
        return showModal ? (
          renderWinnerModal(MOCK_TOP_THREE)
        ) : (
          <div className="text-center">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-(--color-accent) text-white rounded-lg font-medium hover:bg-(--color-accent-hover)"
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
              className="px-6 py-3 bg-(--color-accent) text-white rounded-lg font-medium hover:bg-(--color-accent-hover)"
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
              className="px-6 py-3 bg-(--color-accent) text-white rounded-lg font-medium hover:bg-(--color-accent-hover)"
            >
              Show Three-Way Tie Modal
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center text-(--color-text-secondary)">
            Select a scenario from the sidebar
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-(--color-bg-primary) flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-(--color-border) p-4 overflow-y-auto">
        <h1 className="text-xl font-bold text-(--color-text-primary) mb-4">Voting Tests</h1>
        <p className="text-xs text-(--color-text-tertiary) mb-6">
          Visual test page for voting components
        </p>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide mb-2">
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
                  ? 'bg-(--color-accent) text-white'
                  : 'text-(--color-text-primary) hover:bg-(--color-bg-secondary)'
              }`}
            >
              {SCENARIOS[scenario].name}
            </button>
          ))}

          <h3 className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide mt-6 mb-2">
            Winner Announcement
          </h3>
          {(
            ['winner-normal', 'winner-tied', 'winner-three-way'] as TestScenario[]
          ).map((scenario) => (
            <button
              key={scenario}
              onClick={() => {
                setActiveScenario(scenario);
                setShowModal(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeScenario === scenario
                  ? 'bg-(--color-accent) text-white'
                  : 'text-(--color-text-primary) hover:bg-(--color-bg-secondary)'
              }`}
            >
              {SCENARIOS[scenario].name}
            </button>
          ))}

        </div>

        <div className="mt-8 pt-4 border-t border-(--color-border)">
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
            <h2 className="text-2xl font-bold text-(--color-text-primary)">
              {SCENARIOS[activeScenario].name}
            </h2>
            <p className="text-(--color-text-secondary)">{SCENARIOS[activeScenario].description}</p>
          </div>
        )}

        {renderScenario()}
      </div>
    </div>
  );
}
