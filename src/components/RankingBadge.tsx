interface RankingBadgeProps {
  rank: number;
  total: number;
  className?: string;
}

export function RankingBadge({ rank, total, className = '' }: RankingBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-tertiary)] rounded text-sm font-medium text-[var(--color-text-primary)] ${className}`}
    >
      <span className="text-[var(--color-text-secondary)]">#</span>
      {rank}
      <span className="text-[var(--color-text-tertiary)]">/</span>
      <span className="text-[var(--color-text-secondary)]">{total}</span>
    </span>
  );
}
