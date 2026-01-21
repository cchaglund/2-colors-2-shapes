interface WallLockedStateProps {
  isLoggedIn: boolean;
}

export function WallLockedState({ isLoggedIn }: WallLockedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-(--color-bg-tertiary) flex items-center justify-center mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-tertiary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <p className="text-[13px] text-(--color-text-secondary) mb-4">
        {isLoggedIn
          ? "Save your art first to see today's submissions"
          : "Sign in to see today's submissions"}
      </p>
      <a
        href="/"
        className="text-[13px] text-(--color-accent) hover:underline"
      >
        ← Back to canvas
      </a>
    </div>
  );
}
