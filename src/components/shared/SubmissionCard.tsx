import { useState } from 'react';
import { Link } from './Link';
import { SubmissionThumbnail } from './SubmissionThumbnail';
import type { Shape, ShapeGroup, DailyChallenge } from '../../types';

interface SubmissionCardProps {
  shapes: Shape[];
  groups?: ShapeGroup[];
  challenge: DailyChallenge;
  backgroundColorIndex: number | null;
  showNickname?: boolean;
  nickname?: string;
  onClick?: () => void;
  href?: string;
  likeCount?: number;
  showLikeCount?: boolean;
}

export function SubmissionCard({
  shapes,
  groups,
  challenge,
  backgroundColorIndex,
  showNickname = false,
  nickname,
  onClick,
  href,
  likeCount,
  showLikeCount = false,
}: SubmissionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const displayLikeCount = likeCount !== undefined && likeCount > 9999 ? '9999+' : likeCount;

  const likeCountOverlay = showLikeCount && likeCount !== undefined && likeCount > 0 && (
    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-(--color-overlay) text-(--color-accent-text) text-xs font-medium rounded-(--radius-sm) px-1 py-0.5">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{displayLikeCount}</span>
    </div>
  );

  const cardStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-lg)',
    border: 'var(--border-width, 2px) solid var(--color-border)',
    background: 'var(--color-card-bg)',
    boxShadow: isHovered ? 'var(--shadow-card)' : 'var(--shadow-btn)',
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
  };

  const cardInner = (
    <>
      <div className="relative">
        <SubmissionThumbnail
          shapes={shapes}
          groups={groups}
          challenge={challenge}
          backgroundColorIndex={backgroundColorIndex}
          fill
        />
        {likeCountOverlay}
      </div>
      {showNickname && nickname && (
        <div style={{ padding: 'var(--space-2) var(--space-3)' }}>
          <span className="truncate block text-sm font-bold text-(--color-text-primary)">
            {nickname}
          </span>
        </div>
      )}
    </>
  );

  const hoverHandlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  if (href) {
    return (
      <Link href={href} style={cardStyle} className="block no-underline" {...hoverHandlers}>
        {cardInner}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={cardStyle} className="block w-full text-left" {...hoverHandlers}>
        {cardInner}
      </button>
    );
  }

  return (
    <div style={cardStyle} {...hoverHandlers}>
      {cardInner}
    </div>
  );
}
