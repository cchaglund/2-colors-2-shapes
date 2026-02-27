interface LoadingSpinnerProps {
  message?: string;
  /** Inline mode: no vertical padding, muted colors. For use inside modals. */
  inline?: boolean;
}

export function LoadingSpinner({ message, inline = false }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${inline ? 'text-center' : 'py-16'}`}>
      <div
        className={`w-6 h-6 border-2 rounded-full animate-spin ${
          inline
            ? 'border-(--color-text-tertiary) border-t-transparent mb-3'
            : 'border-(--color-border) border-t-(--color-accent) mb-4'
        }`}
      />
      {message && (
        <p className="text-[13px] text-(--color-text-secondary)">{message}</p>
      )}
    </div>
  );
}
