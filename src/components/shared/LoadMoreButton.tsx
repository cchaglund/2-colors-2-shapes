import type { ReactNode } from 'react';

interface LoadMoreButtonProps {
  onClick: () => void;
  children?: ReactNode;
}

export function LoadMoreButton({ onClick, children = 'Load more submissions' }: LoadMoreButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer"
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
