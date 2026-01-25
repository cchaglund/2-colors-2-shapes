import type { Submission } from '../../hooks/useSubmissions';

interface SubmissionStatsCardProps {
  submission: Submission;
}

export function SubmissionStatsCard({ submission }: SubmissionStatsCardProps) {
  return (
    <div className="border rounded-xl p-4 bg-(--color-bg-primary) border-(--color-border)">
      <h2 className="text-sm font-semibold mb-3 text-(--color-text-primary)">
        Submission Stats
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-(--color-text-tertiary)">Shapes used</span>
          <span className="text-(--color-text-primary)">{submission.shapes.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-(--color-text-tertiary)">Submitted</span>
          <span className="text-(--color-text-primary)">
            {new Date(submission.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
