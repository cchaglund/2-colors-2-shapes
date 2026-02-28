interface LoadingSpinnerProps {
  message?: string;
  /** Inline mode: no vertical padding, muted colors. For use inside modals. */
  inline?: boolean;
  /** Size variant: sm (20px), md (24px, default), lg (32px) */
  size?: 'sm' | 'md' | 'lg';
  /** Wrap in a full-screen centered container (for page-level loading) */
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
} as const;

export function LoadingSpinner({ message, inline = false, size = 'md', fullScreen = false }: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center justify-center ${inline ? 'text-center' : fullScreen ? '' : 'py-16'}`}>
      <div
        className={`${sizeClasses[size]} rounded-(--radius-pill) animate-spin ${
          inline
            ? 'border-(--color-text-tertiary) border-t-transparent mb-3'
            : 'border-(--color-border) border-t-(--color-accent) mb-4'
        }`}
      />
      {message && (
        <p className="text-sm text-(--color-text-secondary)">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--color-bg-primary)">
        {spinner}
      </div>
    );
  }

  return spinner;
}
