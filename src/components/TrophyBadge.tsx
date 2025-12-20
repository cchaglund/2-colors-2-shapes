interface TrophyBadgeProps {
  rank: 1 | 2 | 3;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TROPHY_COLORS = {
  1: { fill: '#FFD700', stroke: '#B8860B' }, // Gold
  2: { fill: '#C0C0C0', stroke: '#808080' }, // Silver
  3: { fill: '#CD7F32', stroke: '#8B4513' }, // Bronze
};

const SIZES = {
  sm: 20,
  md: 28,
  lg: 40,
};

export function TrophyBadge({ rank, size = 'md', className = '' }: TrophyBadgeProps) {
  const colors = TROPHY_COLORS[rank];
  const pixelSize = SIZES[size];

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label={`${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} place trophy`}
    >
      {/* Trophy cup */}
      <path
        d="M8 21h8m-4-4v4m-5-8c-1.5 0-3-1-3-3V6h16v4c0 2-1.5 3-3 3m-10 0h10m-10 0c0 3 2 5 5 5m5-5c0 3-2 5-5 5"
        stroke={colors.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={colors.fill}
      />
      {/* Trophy handles */}
      <path
        d="M4 6c-1 0-2 .5-2 2s1 2 2 2M20 6c1 0 2 .5 2 2s-1 2-2 2"
        stroke={colors.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rank number */}
      <text
        x="12"
        y="11"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6"
        fontWeight="bold"
        fill={colors.stroke}
      >
        {rank}
      </text>
    </svg>
  );
}
