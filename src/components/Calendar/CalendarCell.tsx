import cn from "classnames";

interface CalendarCellProps {
  day: number;
  isToday: boolean;
  isFuture: boolean;
  hasContent?: boolean;
  disabled?: boolean;
  /** When true, children fill entire cell (no padding), day number overlays on art */
  artFill?: boolean;
  /** Show colored inset outline for trophy rank (1=gold, 2=silver, 3=bronze) */
  rankOutline?: 1 | 2 | 3;
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const cellBase = 'aspect-square border-b border-r border-(--color-border) relative transition-all overflow-hidden overflow-visible';

const rankOutlineColors: Record<1 | 2 | 3, string> = {
  1: '#FFD700',
  2: '#D1D5DC',
  3: '#CE8946',
};

export function CalendarCell({
  day,
  isToday,
  isFuture,
  hasContent = false,
  disabled = false,
  artFill = false,
  rankOutline,
  href,
  onClick,
  className = '',
  children,
}: CalendarCellProps) {
  const isInteractive = !disabled && (!!href || !!onClick);

  const classes = `
    ${cellBase}
    ${artFill ? '' : 'p-1'}
    ${hasContent ? 'bg-(--color-bg-tertiary)' : ''}
    ${isInteractive ? 'cursor-pointer hover:ring-1 hover:ring-inset hover:ring-(--color-accent)' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed bg-(--color-bg-secondary)' : ''}
    ${isFuture && !disabled ? 'bg-(--color-bg-secondary) opacity-50' : ''}
    ${isToday ? 'ring-2 ring-inset ring-(--color-accent)' : ''}
    ${className}
  `;

  const borderStyle = rankOutline
    ? { border: `6px solid ${rankOutlineColors[rankOutline]}` }
    : undefined;

  const content = (
    <>
      {artFill ? (
        <>
          <div className={cn(
            "absolute  z-10 bg-black/70 text-white text-[10px] font-medium tabular-nums px-1 rounded-sm leading-tight",
            rankOutline ? "-top-0.5 -left-0.5" : "top-1 left-1"
          )}>

            {day}
          </div>
          <div className="absolute inset-0">
            {children}
          </div>
        </>
      ) : (
        <>
          <div
            className={`absolute top-1 left-1 text-[10px] font-medium tabular-nums ${
              isToday
                ? 'text-(--color-accent)'
                : hasContent
                ? 'text-(--color-text-primary)'
                : 'text-(--color-text-tertiary)'
            }`}
          >
            {day}
          </div>
          <div className="w-full h-full flex items-center justify-center pt-3">
            {children}
          </div>
        </>
      )}
    </>
  );

  if (href) {
    return <a href={href} className={`block ${classes}`} style={borderStyle}>{content}</a>;
  }

  if (onClick && !disabled) {
    return <button onClick={onClick} className={classes} style={borderStyle}>{content}</button>;
  }

  if (onClick && disabled) {
    return <button onClick={onClick} disabled className={classes} style={borderStyle}>{content}</button>;
  }

  return <div className={classes} style={borderStyle}>{content}</div>;
}
