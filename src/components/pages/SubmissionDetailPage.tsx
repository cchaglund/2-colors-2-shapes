import { useRef } from 'react';
import { useAuth } from '../../hooks/auth/useAuth';
import { useSubmissions } from '../../hooks/submission/useSubmissions';
import { useRanking } from '../../hooks/challenge/useRanking';
import { useDailyChallenge } from '../../hooks/challenge/useDailyChallenge';
import { useSubmissionDetail } from '../../hooks/submission/useSubmissionDetail';
import { useExportActions } from '../../hooks/submission/useExportActions';
import { FollowButton } from '../social/FollowButton';
import {
  SubmissionCanvas,
  SubmissionNavigation,
  ChallengeDetailsCard,
  RankingCard,
  SubmissionStatsCard,
  ExportActionsCard,
  LikeButton,
} from '../submission';
import { TopBar } from '../canvas/TopBar';
import type { ThemeMode, ThemeName } from '../../hooks/ui/useThemeState';

interface SubmissionDetailPageProps {
  date?: string;
  submissionId?: string;
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
  themeName: ThemeName;
  onSetThemeName: (name: ThemeName) => void;
}

export function SubmissionDetailPage({ date, submissionId, themeMode, onSetThemeMode, themeName, onSetThemeName }: SubmissionDetailPageProps) {
  const { user } = useAuth();
  const { loadSubmission, getAdjacentSubmissionDates } = useSubmissions(user?.id);
  const { fetchSubmissionRank } = useRanking();
  const svgRef = useRef<SVGSVGElement>(null);

  // Load submission data
  const { submission, loading, rankInfo, error, adjacentDates, nickname } = useSubmissionDetail({
    date,
    submissionId,
    user,
    loadSubmission,
    fetchSubmissionRank,
    getAdjacentSubmissionDates,
  });

  // Determine the challenge date from either prop or loaded submission
  const challengeDate = date || submission?.challenge_date || '';
  const { challenge } = useDailyChallenge(challengeDate);

  // Export actions
  const { downloadSVG, downloadPNG, copyShareLink } = useExportActions(svgRef, challengeDate);

  const formattedDate = challengeDate
    ? new Date(challengeDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Loading...';

  // Only require auth when loading by date (own submission)
  if (!submissionId && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-(--color-bg-primary)">
        <div className="text-center text-(--color-text-secondary)">
          Please sign in to view this submission.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-(--color-bg-primary)">
        <div className="text-(--color-text-secondary)">
          Loading submission...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-(--color-bg-primary)">
        <div className="text-(--color-text-secondary)">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!submission || !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-(--color-bg-primary)">
        <div className="text-(--color-text-secondary)">
          {submissionId ? 'Submission not found.' : `No submission found for ${formattedDate}.`}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-(--color-bg-primary)">
      <TopBar
        themeMode={themeMode}
        onSetThemeMode={onSetThemeMode}
        themeName={themeName}
        onSetThemeName={onSetThemeName}
        centerContent={
          <span className="text-sm font-semibold text-(--color-text-primary) font-display">Submission</span>
        }
        rightContent={
          <div className="flex items-center gap-2">
            {date && <SubmissionNavigation adjacentDates={adjacentDates} />}
            <a
              href="/?view=gallery"
              className="h-8 px-3 rounded-(--radius-pill) border border-(--color-border) text-xs font-medium transition-colors bg-transparent text-(--color-text-secondary) hover:bg-(--color-hover) hover:text-(--color-text-primary) no-underline flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Gallery
            </a>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-4 md:p-8 theme-pattern">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold mb-1 text-(--color-text-primary) font-display">
              {formattedDate}
            </h1>
            <div className="flex items-center gap-2 text-[13px]">
              {nickname && submission?.user_id ? (
                <>
                  <a
                    href={`?view=profile&user=${submission.user_id}`}
                    className="text-(--color-text-secondary) hover:text-(--color-accent) transition-colors"
                  >
                    @{nickname}
                  </a>
                  <span className="text-(--color-text-tertiary)">·</span>
                  <span className="text-(--color-text-secondary)">Submission</span>
                  {user && user.id !== submission.user_id && (
                    <FollowButton targetUserId={submission.user_id} size="sm" />
                  )}
                </>
              ) : (
                <span className="text-(--color-text-secondary)">Daily Challenge Submission</span>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-col md:flex-row gap-5 items-start justify-center">
            {/* Canvas and actions */}
            <div className="flex flex-col gap-3">
              <div className="border rounded-lg overflow-hidden w-fit border-(--color-border)">
                <SubmissionCanvas
                  shapes={submission.shapes}
                  groups={submission.groups}
                  challenge={challenge}
                  backgroundColorIndex={submission.background_color_index}
                  svgRef={svgRef}
                />
              </div>
              {/* Like button */}
              <div className="flex items-center">
                <LikeButton
                  submissionId={submission.id}
                  submissionUserId={submission.user_id}
                  initialLikeCount={submission.like_count}
                />
              </div>
            </div>

            {/* Info sidebar */}
            <div className="space-y-3 w-full md:w-72">
              <ChallengeDetailsCard challenge={challenge} submissionShapes={submission.shapes} />
              {rankInfo && <RankingCard rankInfo={rankInfo} />}
              <SubmissionStatsCard submission={submission} />
              <ExportActionsCard
                onDownloadPNG={downloadPNG}
                onDownloadSVG={downloadSVG}
                onCopyLink={copyShareLink}
                showDownloadButtons={!submissionId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
