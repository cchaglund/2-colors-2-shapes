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
        className="absolute right-0 top-4 z-10 rounded-l-lg px-2 py-4 cursor-pointer transition-all bg-(--color-bg-secondary) shadow-(--shadow-panel) hover:bg-(--color-hover)"
        onClick={onToggle}
        title="Show Layers"
      >
        <span className="text-sm text-(--color-text-secondary)">‹</span>
      </button>
    </div>
  );
}
