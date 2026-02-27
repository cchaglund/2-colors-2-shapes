import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface CardProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
}

export function Card({ children, className = '', style, ...rest }: CardProps) {
  return (
    <div
      className={`p-5 ${className}`}
      style={{
        background: 'var(--color-card-bg)',
        border: 'var(--border-width, 2px) solid var(--color-border-light)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-btn)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
