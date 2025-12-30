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
        className="absolute right-0 top-4 z-10 rounded-l-lg px-2 py-4 cursor-pointer transition-all"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          boxShadow: 'var(--shadow-panel)',
        }}
        onClick={onToggle}
        title="Show Layers"
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
      >
        <span style={{ color: 'var(--color-text-secondary)' }} className="text-sm">‹</span>
      </button>
    </div>
  );
}
