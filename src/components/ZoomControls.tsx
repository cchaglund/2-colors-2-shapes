interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  minZoom: number;
  maxZoom: number;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  minZoom,
  maxZoom,
}: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);
  const canZoomIn = zoom < maxZoom - 0.001;
  const canZoomOut = zoom > minZoom + 0.001;
  const isDefaultZoom = Math.abs(zoom - 1) < 0.001;

  return (
    <div
      className="flex items-center gap-1 backdrop-blur-sm rounded-lg shadow-md px-2 py-1"
      style={{
        backgroundColor: 'var(--color-overlay)',
        border: '1px solid var(--color-border)',
      }}
    >
      <button
        className="w-7 h-7 flex items-center justify-center rounded disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        style={{ color: 'var(--color-text-primary)' }}
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom out"
        onMouseEnter={(e) => {
          if (canZoomOut) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        −
      </button>

      <button
        className={`min-w-14 h-7 px-2 flex items-center justify-center rounded text-sm font-medium transition-colors ${
          isDefaultZoom
            ? 'cursor-default'
            : 'cursor-pointer'
        }`}
        style={{
          color: isDefaultZoom ? 'var(--color-text-tertiary)' : '#2563eb',
        }}
        onClick={onResetZoom}
        disabled={isDefaultZoom}
        title="Reset zoom to 100%"
        onMouseEnter={(e) => {
          if (!isDefaultZoom) e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {zoomPercent}%
      </button>

      <button
        className="w-7 h-7 flex items-center justify-center rounded disabled:opacity-40 disabled:cursor-not-allowed font-medium"
        style={{ color: 'var(--color-text-primary)' }}
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom in"
        onMouseEnter={(e) => {
          if (canZoomIn) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        +
      </button>
    </div>
  );
}
