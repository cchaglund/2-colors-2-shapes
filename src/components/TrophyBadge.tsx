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
      stroke='black'
      strokeWidth='0.5'
      height="16" width="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M4 0H12V2H16V4C16 6.45641 14.2286 8.49909 11.8936 8.92038C11.5537 10.3637 10.432 11.5054 9 11.874V14H12V16H4V14H7V11.874C5.56796 11.5054 4.44628 10.3637 4.1064 8.92038C1.77136 8.49909 0 6.45641 0 4V2H4V0ZM12 6.82929V4H14C14 5.30622 13.1652 6.41746 12 6.82929ZM4 4H2C2 5.30622 2.83481 6.41746 4 6.82929V4Z" 
      fill={rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : "#CD7F32"}
    >
    </path> </g></svg>
  )

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
