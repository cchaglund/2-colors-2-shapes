import { Eye, EyeOff } from 'lucide-react';

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: (e: React.MouseEvent) => void;
}

export function VisibilityToggle({ visible, onToggle }: VisibilityToggleProps) {
  return (
    <button
      className="w-5 h-5 flex items-center justify-center shrink-0 bg-transparent border-none cursor-pointer rounded text-(--color-text-tertiary) hover:text-(--color-text-primary) transition-colors"
      onClick={onToggle}
      title={visible ? 'Hide layer' : 'Show layer'}
    >
      {visible ? <Eye size={14} /> : <EyeOff size={14} />}
    </button>
  );
}
