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
        className="absolute right-0 top-4 z-10 rounded-l-md px-1.5 py-3 cursor-pointer transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRightWidth: 0,
          borderColor: 'var(--color-border)',
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
