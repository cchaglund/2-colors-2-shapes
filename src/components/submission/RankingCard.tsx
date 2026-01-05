import { TrophyBadge } from '../TrophyBadge';
import { RankingBadge } from '../RankingBadge';

interface RankingCardProps {
  rankInfo: { rank: number; total: number };
}

export function RankingCard({ rankInfo }: RankingCardProps) {
  return (
    <div className="border rounded-xl p-4 bg-white border-(--color-border)">
      <h2 className="text-sm font-semibold mb-3 text-(--color-text-primary)">
        Ranking
      </h2>
      <div className="flex items-center gap-3">
        {rankInfo.rank <= 3 && (
          <TrophyBadge rank={rankInfo.rank as 1 | 2 | 3} size="lg" />
        )}
        <RankingBadge rank={rankInfo.rank} total={rankInfo.total} />
      </div>
      {rankInfo.rank === 1 && (
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          Winner of the day!
        </p>
      )}
    </div>
  );
}
