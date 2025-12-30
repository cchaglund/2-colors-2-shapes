import type { Submission } from '../../hooks/useSubmissions';

interface SubmissionStatsCardProps {
  submission: Submission;
}

export function SubmissionStatsCard({ submission }: SubmissionStatsCardProps) {
  return (
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
  );
}
