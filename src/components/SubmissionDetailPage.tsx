import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubmissions, type Submission } from '../hooks/useSubmissions';
import { generateDailyChallenge } from '../utils/dailyChallenge';
import { getShapeSVGData, SHAPE_NAMES } from '../utils/shapeHelpers';
import type { DailyChallenge, Shape } from '../types';

interface SubmissionDetailPageProps {
  date: string;
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
        const transform = `translate(${shape.x}, ${shape.y}) rotate(${shape.rotation}, ${shape.size / 2}, ${shape.size / 2})`;
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

export function SubmissionDetailPage({ date }: SubmissionDetailPageProps) {
  const { user } = useAuth();
  const { loadSubmission, loading } = useSubmissions(user?.id);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const challenge = generateDailyChallenge(date);

  useEffect(() => {
    if (user) {
      loadSubmission(date).then(({ data, error }) => {
        if (error) {
          setError(error);
        } else {
          setSubmission(data);
        }
      });
    }
  }, [user, date, loadSubmission]);

  const downloadSVG = useCallback(() => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `submission-${date}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [date]);

  const downloadPNG = useCallback(() => {
    if (!svgRef.current) return;

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
        link.download = `submission-${date}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };

    img.src = url;
  }, [date]);

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!user) {
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

  if (!submission) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      >
        <div style={{ color: 'var(--color-text-secondary)' }}>
          No submission found for {formattedDate}.
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
        <div className="grid md:grid-cols-[1fr,300px] gap-6">
          {/* Canvas */}
          <div
            className="border rounded-xl overflow-hidden"
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
          <div className="space-y-4">
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
                  {challenge.shapes.map((shape, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-md text-sm"
                      style={{
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {SHAPE_NAMES[shape]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

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
