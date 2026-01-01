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
    <div className="flex items-center gap-1 backdrop-blur-sm rounded-lg shadow-md px-2 py-1 bg-(--color-overlay) border border-(--color-border)">
      <button
        className="w-7 h-7 flex items-center justify-center rounded disabled:opacity-40 disabled:cursor-not-allowed font-medium text-(--color-text-primary) hover:enabled:bg-(--color-hover) transition-colors"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom out"
      >
        −
      </button>

      <button
        className={`min-w-14 h-7 px-2 flex items-center justify-center rounded text-sm font-medium transition-colors ${
          isDefaultZoom
            ? 'cursor-default text-(--color-text-tertiary)'
            : 'cursor-pointer text-(--color-accent) hover:bg-(--color-accent)/10'
        }`}
        onClick={onResetZoom}
        disabled={isDefaultZoom}
        title="Reset zoom to 100%"
      >
        {zoomPercent}%
      </button>

      <button
        className="w-7 h-7 flex items-center justify-center rounded disabled:opacity-40 disabled:cursor-not-allowed font-medium text-(--color-text-primary) hover:enabled:bg-(--color-hover) transition-colors"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
}
