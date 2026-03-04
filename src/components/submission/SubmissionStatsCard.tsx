import type { Submission } from '../../hooks/submission/useSubmissions';
import { Card } from '../shared/Card';

interface SubmissionStatsCardProps {
  submission: Submission;
}

export function SubmissionStatsCard({ submission }: SubmissionStatsCardProps) {
  return (
    <Card>
      <h2 className="text-base font-semibold mb-3 text-(--color-text-primary)">
        Submission Stats
      </h2>
      <div className="space-y-2 text-base">
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
    </Card>
  );
}
