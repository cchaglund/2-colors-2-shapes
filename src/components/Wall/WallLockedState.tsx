import { Lock } from 'lucide-react';
import { Link } from '../shared/Link';
import { EmptyState } from '../shared/EmptyState';

export function WallLockedState() {
  return (
    <EmptyState
      icon={<Lock size={24} color="var(--color-text-tertiary)" />}
      message="Save your art first, in order to see today's submissions"
    >
      <Link
        href="/"
        className="text-sm text-(--color-accent) hover:underline"
      >
        ← Back to canvas
      </Link>
    </EmptyState>
  );
}
