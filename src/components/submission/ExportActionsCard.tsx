import { Card } from '../shared/Card';

const actionBtnStyle: React.CSSProperties = {
  background: 'var(--color-selected)',
  border: 'var(--border-width, 2px) solid var(--color-border-light)',
  borderRadius: 'var(--radius-md)',
};

interface ExportActionsCardProps {
  onDownloadPNG: () => void;
  onDownloadSVG: () => void;
  onCopyLink: () => void;
  showDownloadButtons?: boolean;
}

export function ExportActionsCard({
  onDownloadPNG,
  onDownloadSVG,
  onCopyLink,
  showDownloadButtons = true,
}: ExportActionsCardProps) {
  return (
    <Card>
      <h2 className="text-sm font-semibold mb-3 text-(--color-text-primary)">
        Export & Share
      </h2>
      <div className="space-y-1.5">
        {showDownloadButtons && (
          <>
            <button
              onClick={onDownloadPNG}
              className="w-full px-3 py-2.5 cursor-pointer text-sm font-semibold transition-all flex items-center justify-center gap-1.5 text-(--color-text-primary) hover:opacity-80"
              style={actionBtnStyle}
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
              className="w-full px-3 py-2.5 cursor-pointer text-sm font-semibold transition-all flex items-center justify-center gap-1.5 text-(--color-text-primary) hover:opacity-80"
              style={actionBtnStyle}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download SVG
            </button>
          </>
        )}
        <button
          onClick={onCopyLink}
          className="w-full px-3 py-2.5 cursor-pointer text-sm font-semibold transition-all flex items-center justify-center gap-1.5 text-(--color-text-primary) hover:opacity-80"
          style={actionBtnStyle}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Copy Link
        </button>
      </div>
    </Card>
  );
}
