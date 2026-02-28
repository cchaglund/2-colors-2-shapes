import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  children?: ReactNode;
}

export function EmptyState({ icon, message, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-(--radius-pill) bg-(--color-bg-tertiary) flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className={`text-sm text-(--color-text-secondary) ${children ? 'mb-4' : ''}`}>
        {message}
      </p>
      {children}
    </div>
  );
}
