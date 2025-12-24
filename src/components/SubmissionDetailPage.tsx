import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubmissions, type Submission } from '../hooks/useSubmissions';
import { useRanking } from '../hooks/useRanking';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
import { supabase } from '../lib/supabase';
import { getShapeSVGData } from '../utils/shapeHelpers';
import { TrophyBadge } from './TrophyBadge';
import { RankingBadge } from './RankingBadge';
import type { DailyChallenge, Shape } from '../types';

interface SubmissionDetailPageProps {
  date?: string;
  submissionId?: string;
}

const CANVAS_SIZE = 800;

function SubmissionCanvas({
  shapes,
  challenge,
  backgroundColorIndex,
  svgRef,
}: {
  shapes: Shape[];
  challenge: DailyChallenge;
  backgroundColorIndex: number | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);
  const backgroundColor =
    backgroundColorIndex !== null
      ? challenge.colors[backgroundColorIndex]
      : '#ffffff';

  return (
    <svg
      ref={svgRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <rect
        x={0}
        y={0}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        fill={backgroundColor}
      />
      {sortedShapes.map((shape) => {
        const { element, props } = getShapeSVGData(shape.type, shape.size);
        const center = shape.size / 2;
        const scaleX = shape.flipX ? -1 : 1;
        const scaleY = shape.flipY ? -1 : 1;
        const transform = `translate(${shape.x}, ${shape.y}) translate(${center}, ${center}) scale(${scaleX}, ${scaleY}) translate(${-center}, ${-center}) rotate(${shape.rotation}, ${center}, ${center})`;
        const color = challenge.colors[shape.colorIndex];

        return (
          <g key={shape.id} transform={transform}>
            {element === 'ellipse' && <ellipse {...props} fill={color} />}
            {element === 'rect' && <rect {...props} fill={color} />}
            {element === 'polygon' && <polygon {...props} fill={color} />}
            {element === 'path' && <path {...props} fill={color} />}
          </g>
        );
      })}
    </svg>
  );
}

export function SubmissionDetailPage({ date, submissionId }: SubmissionDetailPageProps) {
  const { user } = useAuth();
  const { loadSubmission } = useSubmissions(user?.id);
  const { fetchSubmissionRank } = useRanking();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankInfo, setRankInfo] = useState<{ rank: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Determine the challenge date from either prop or loaded submission
  const challengeDate = date || submission?.challenge_date || '';
  const { challenge } = useDailyChallenge(challengeDate);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (submissionId) {
          // Load any submission by ID (public view)
          const { data, error: fetchError } = await supabase
            .from('submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

          if (fetchError) {
            setError(fetchError.message);
          } else {
            setSubmission(data as Submission);
            // Fetch ranking info
            if (data?.id) {
              const info = await fetchSubmissionRank(data.id);
              setRankInfo(info);
            }
          }
        } else if (date && user) {
          // Load user's own submission by date
          const { data, error: fetchError } = await loadSubmission(date);
          if (fetchError) {
            setError(fetchError);
          } else {
            setSubmission(data);
            if (data?.id) {
              const info = await fetchSubmissionRank(data.id);
              setRankInfo(info);
            }
          }
        } else if (date && !user) {
          setError('Please sign in to view this submission.');
        }
      } catch (err) {
        setError('Failed to load submission');
      }

      setLoading(false);
    };

    loadData();
  }, [user, date, submissionId, loadSubmission, fetchSubmissionRank]);

  const downloadSVG = useCallback(() => {
    if (!svgRef.current || !challengeDate) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `submission-${challengeDate}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [challengeDate]);

  const downloadPNG = useCallback(() => {
    if (!svgRef.current || !challengeDate) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE * 2; // 2x for retina
    canvas.height = CANVAS_SIZE * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `submission-${challengeDate}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };

    img.src = url;
  }, [challengeDate]);

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

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
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <div
          className="text-center"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Please sign in to view this submission.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <div style={{ color: 'var(--color-text-secondary)' }}>
          Loading submission...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <div style={{ color: 'var(--color-text-secondary)' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!submission || !challenge) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <div style={{ color: 'var(--color-text-secondary)' }}>
          {submissionId ? 'Submission not found.' : `No submission found for ${formattedDate}.`}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm mb-4 hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to app
          </a>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {formattedDate}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Daily Challenge Submission
          </p>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-center">
          {/* Canvas */}
          <div
            className="border rounded-xl overflow-hidden w-fit"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <SubmissionCanvas
              shapes={submission.shapes}
              challenge={challenge}
              backgroundColorIndex={submission.background_color_index}
              svgRef={svgRef}
            />
          </div>

          {/* Info sidebar */}
          <div className="space-y-4 w-full md:w-75">
            {/* Challenge info */}
            <div
              className="border rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Challenge Details
              </h2>

              {/* Colors */}
              <div className="mb-4">
                <span
                  className="text-xs"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Colors
                </span>
                <div className="flex gap-2 mt-1">
                  {challenge.colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-md border"
                      style={{
                        backgroundColor: color,
                        borderColor: 'var(--color-border)',
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Shapes */}
              <div>
                <span
                  className="text-xs"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Shapes
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {challenge.shapes.map((shapeData, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md text-sm"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {shapeData.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Ranking */}
            {rankInfo && (
              <div
                className="border rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h2
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Ranking
                </h2>
                <div className="flex items-center gap-3">
                  {rankInfo.rank <= 3 && (
                    <TrophyBadge rank={rankInfo.rank as 1 | 2 | 3} size="lg" />
                  )}
                  <RankingBadge rank={rankInfo.rank} total={rankInfo.total} />
                </div>
                {rankInfo.rank === 1 && (
                  <p
                    className="mt-2 text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Winner of the day!
                  </p>
                )}
              </div>
            )}

            {/* Stats */}
            <div
              className="border rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Submission Stats
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    Shapes used
                  </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {submission.shapes.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>
                    Submitted
                  </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              className="border rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Export & Share
              </h2>
              <div className="space-y-2">
                <button
                  onClick={downloadPNG}
                  className="w-full px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PNG
                </button>
                <button
                  onClick={downloadSVG}
                  className="w-full px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download SVG
                </button>
                <button
                  onClick={copyShareLink}
                  className="w-full px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
