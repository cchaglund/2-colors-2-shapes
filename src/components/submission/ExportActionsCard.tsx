interface ExportActionsCardProps {
  onDownloadPNG: () => void;
  onDownloadSVG: () => void;
  onCopyLink: () => void;
}

export function ExportActionsCard({
  onDownloadPNG,
  onDownloadSVG,
  onCopyLink,
}: ExportActionsCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-(--color-bg-primary) border-(--color-border)">
      <h2 className="text-[13px] font-semibold mb-3 text-(--color-text-primary)">
        Export & Share
      </h2>
      <div className="space-y-1.5">
        <button
          onClick={onDownloadPNG}
          className="w-full px-3 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-colors flex items-center justify-center gap-2 bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PNG
        </button>
        <button
          onClick={onDownloadSVG}
          className="w-full px-3 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-colors flex items-center justify-center gap-2 bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download SVG
        </button>
        <button
          onClick={onCopyLink}
          className="w-full px-3 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-colors flex items-center justify-center gap-2 bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-hover)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Copy Link
        </button>
      </div>
    </div>
  );
}
