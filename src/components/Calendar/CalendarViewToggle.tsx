import type { ViewMode } from './types';
import { ViewToggle } from '../shared/ViewToggle';

interface CalendarViewToggleProps {
  effectiveViewMode: ViewMode;
  user: { id: string } | null;
  onSetViewMode: (mode: ViewMode) => void;
}

export function CalendarViewToggle({
  effectiveViewMode,
  user,
  onSetViewMode,
}: CalendarViewToggleProps) {
  const options = [
    { value: 'my-submissions' as ViewMode, label: 'My Submissions', disabled: !user, disabledTitle: 'Sign in to view my submissions' },
    { value: 'winners' as ViewMode, label: 'Winners' },
    { value: 'wall' as ViewMode, label: 'Wall' },
    { value: 'friends' as ViewMode, label: 'Friends', disabled: !user, disabledTitle: 'Sign in to view friends' },
  ];

  return (
    <ViewToggle
      options={options}
      activeValue={effectiveViewMode}
      onChange={onSetViewMode}
      size="md"
      fullWidth
      className="mb-7"
    />
  );
}
