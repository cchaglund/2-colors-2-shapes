export type SortMode = 'random' | 'newest' | 'oldest' | 'ranked';

interface WallSortControlsProps {
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  isRankedAvailable: boolean;
}

export function WallSortControls({
  sortMode,
  onSortModeChange,
  isRankedAvailable,
}: WallSortControlsProps) {
  const options: { value: SortMode; label: string }[] = [
    { value: 'random', label: 'Random' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'ranked', label: 'Ranked' },
  ];

  return (
    <div className="flex rounded-md p-0.5 border border-(--color-border) bg-(--color-bg-tertiary)">
      {options.map((option) => {
        const isDisabled = option.value === 'ranked' && !isRankedAvailable;
        const isSelected = sortMode === option.value;

        return (
          <button
            key={option.value}
            onClick={() => !isDisabled && onSortModeChange(option.value)}
            disabled={isDisabled}
            className={`flex-1 px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              isSelected
                ? 'bg-(--color-bg-primary) text-(--color-text-primary) border border-(--color-border-light)'
                : 'bg-transparent text-(--color-text-secondary) border border-transparent'
            }`}
            title={isDisabled ? 'Voting still in progress' : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
