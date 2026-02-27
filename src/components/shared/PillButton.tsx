import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from 'react';

/**
 * Pill-shaped button used across the UI.
 *
 * Variants:
 * - secondary: white/surface bg + shadow (Reset, user menu trigger)
 * - primary:   accent bg + shadow (Submit, modal CTAs)
 * - ghost:     selected/tinted bg, no shadow (Gallery, subtle actions)
 * - inverse:   dark bg (text-primary as bg), shadow (Log in)
 * - danger:    danger bg + shadow (destructive actions)
 */

export type PillButtonVariant = 'secondary' | 'primary' | 'ghost' | 'inverse' | 'danger';

const variantClasses: Record<PillButtonVariant, string> = {
  secondary:
    'bg-(--color-card-bg) text-(--color-text-primary) hover:text-(--color-text-primary)',
  primary:
    'bg-(--color-accent) text-(--color-accent-text) hover:bg-(--color-accent-hover)',
  ghost:
    'bg-(--color-selected) text-(--color-text-primary) hover:bg-(--color-selected-hover)',
  inverse: '',
  danger:
    'bg-(--color-danger) text-(--color-accent-text) hover:bg-(--color-danger-hover)',
};

/** Variants that get the btn-shadow */
const shadowVariants = new Set<PillButtonVariant>(['secondary', 'primary', 'inverse', 'danger']);

type PillButtonProps<T extends ElementType = 'button'> = {
  variant?: PillButtonVariant;
  as?: T;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className' | 'style'>;

export function PillButton<T extends ElementType = 'button'>({
  variant = 'secondary',
  as,
  fullWidth = false,
  className = '',
  style,
  children,
  ...rest
}: PillButtonProps<T>) {
  const Tag = as || 'button';
  const hasShadow = shadowVariants.has(variant);

  const inverseStyle = variant === 'inverse'
    ? {
        background: 'var(--color-text-primary)',
        color: 'var(--color-bg-primary)',
      }
    : {};

  return (
    <Tag
      className={`h-8 px-3 rounded-(--radius-pill) text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center no-underline ${fullWidth ? 'w-full' : ''} ${variantClasses[variant]} ${className}`}
      style={{
        border: 'var(--border-width, 2px) solid var(--color-border)',
        ...(hasShadow ? { boxShadow: 'var(--shadow-btn)' } : {}),
        ...inverseStyle,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
