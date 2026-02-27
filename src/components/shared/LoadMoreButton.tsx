import type { ReactNode } from 'react';

interface LoadMoreButtonProps {
  onClick: () => void;
  children?: ReactNode;
}

export function LoadMoreButton({ onClick, children = 'Load more submissions' }: LoadMoreButtonProps) {
  return (
    <button
      onClick={onClick}
      className="h-8 px-4 text-(--text-sm) font-medium transition-colors cursor-pointer inline-flex items-center"
      style={{
        color: 'var(--color-accent)',
        border: 'var(--border-width, 2px) solid var(--color-accent)',
        borderRadius: 'var(--radius-pill)',
        background: 'transparent',
      }}
    >
      {children}
    </button>
  );
}
