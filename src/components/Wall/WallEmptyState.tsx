import { ImageOff } from 'lucide-react';
import { EmptyState } from '../shared/EmptyState';

export function WallEmptyState() {
  return (
    <EmptyState
      icon={<ImageOff size={24} color="var(--color-text-tertiary)" />}
      message="No public submissions for this day"
    />
  );
}
