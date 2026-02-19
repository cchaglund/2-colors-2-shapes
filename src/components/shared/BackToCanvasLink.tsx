export function BackToCanvasLink() {
    return (
        <a
            href="/"
            className="inline-flex items-center gap-1 text-sm hover:underline text-(--color-text-secondary) mb-4"
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to canvas
        </a>
    );
};