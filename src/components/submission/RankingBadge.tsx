interface RankingBadgeProps {
  rank: number;
  total: number;
  className?: string;
}

export function RankingBadge({ rank, total, className = '' }: RankingBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 bg-(--color-bg-tertiary) rounded text-sm font-medium text-(--color-text-primary) ${className}`}
    >
      <span className="text-(--color-text-secondary)">#</span>
      {rank}
      <span className="text-(--color-text-tertiary)">/</span>
      <span className="text-(--color-text-secondary)">{total}</span>
    </span>
  );
}
