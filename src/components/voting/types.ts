import type { VotingPair, DailyChallenge } from '../../types';

export interface VotingProgressProps {
  voteCount: number;
  requiredVotes: number;
}

export interface VotingPairViewProps {
  currentPair: VotingPair;
  challenge: DailyChallenge;
  challengeDate: string;
  voteCount: number;
  requiredVotes: number;
  submitting: boolean;
  onVote: (winnerId: string) => void;
  onSkip: () => void;
  onSkipVoting: () => void;
}

export interface VotingConfirmationProps {
  canContinueVoting: boolean;
  onContinue: () => void;
  onDone: () => void;
}

export interface VotingNoPairsProps {
  voteCount: number;
  requiredVotes: number;
  challengeDate: string;
  onDone: () => void;
  onSkipVoting: () => void;
}

export interface VotingOptInPromptProps {
  onOptIn: () => void;
  onSkip: () => void;
}
