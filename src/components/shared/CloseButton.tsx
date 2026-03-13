import { X } from 'lucide-react';

interface CloseButtonProps {
  onClick: () => void;
  size?: 'sm' | 'md';
  label?: string;
}

export function CloseButton({ onClick, size = 'md', label = 'Close' }: CloseButtonProps) {
  const iconSize = size === 'sm' ? 16 : 20;
  return (
    <button
      onClick={onClick}
      className="text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors cursor-pointer"
      aria-label={label}
    >
      <X size={iconSize} />
    </button>
  );
}
