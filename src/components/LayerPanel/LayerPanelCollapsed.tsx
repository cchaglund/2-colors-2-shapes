interface LayerPanelCollapsedProps {
  onToggle: () => void;
}

/**
 * Collapsed state view of the layer panel
 */
export function LayerPanelCollapsed({ onToggle }: LayerPanelCollapsedProps) {
  return (
    <div className="relative">
      <button
        className="absolute right-0 top-4 z-10 px-1.5 py-3 cursor-pointer transition-colors border-l border-y border-(--color-border) rounded-l-md bg-(--color-bg-primary) hover:bg-(--color-hover)"
        onClick={onToggle}
        title="Show Layers"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="8 2 4 6 8 10" />
        </svg>
      </button>
    </div>
  );
}
