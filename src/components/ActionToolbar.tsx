import { useState } from 'react';
import type { KeyMappings } from '../constants/keyboardActions';
import { formatKeyBinding, getDefaultMappings } from '../constants/keyboardActions';

// SVG Icons as components for cleaner code
const UndoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.36 2.64L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 13" />
  </svg>
);

const DuplicateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const MoveUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const MoveDownIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const MoveLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const MoveRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const RotateClockwiseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6" />
    <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
  </svg>
);

const RotateCounterClockwiseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v6h6" />
    <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
  </svg>
);

const SizeIncreaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const SizeDecreaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const MirrorHorizontalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="3" x2="12" y2="21" />
    <polyline points="16 7 20 12 16 17" />
    <polyline points="8 7 4 12 8 17" />
  </svg>
);

const MirrorVerticalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <polyline points="7 8 12 4 17 8" />
    <polyline points="7 16 12 20 17 16" />
  </svg>
);

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

interface ActionToolbarProps {
  keyMappings: KeyMappings;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRotateClockwise: () => void;
  onRotateCounterClockwise: () => void;
  onSizeIncrease: () => void;
  onSizeDecrease: () => void;
  onMirrorHorizontal: () => void;
  onMirrorVertical: () => void;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, shortcut, onClick, disabled }: ToolbarButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative">
      <button
        className="w-8 h-8 flex items-center justify-center rounded disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          color: 'var(--color-text-primary)',
          backgroundColor: isHovered && !disabled ? 'var(--color-hover)' : 'transparent',
        }}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={label}
      >
        {icon}
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded text-xs whitespace-nowrap z-50 pointer-events-none"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <div className="font-medium">{label}</div>
          <div style={{ color: 'var(--color-text-secondary)' }}>{shortcut}</div>
        </div>
      )}
    </div>
  );
}

function Separator() {
  return (
    <div
      className="w-px h-5 mx-1"
      style={{ backgroundColor: 'var(--color-border)' }}
    />
  );
}

export function ActionToolbar({
  keyMappings,
  hasSelection,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onRotateClockwise,
  onRotateCounterClockwise,
  onSizeIncrease,
  onSizeDecrease,
  onMirrorHorizontal,
  onMirrorVertical,
}: ActionToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Get formatted shortcuts from mappings
  const defaults = getDefaultMappings();
  const getShortcut = (actionId: keyof KeyMappings) => {
    const binding = keyMappings[actionId] || defaults[actionId];
    return binding ? formatKeyBinding(binding) : '';
  };

  return (
    <div
      className="flex items-center gap-1 backdrop-blur-sm rounded-lg shadow-md px-2 py-1"
      style={{
        backgroundColor: 'var(--color-overlay)',
        border: '1px solid var(--color-border)',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Collapse toggle */}
      <button
        className="w-6 h-6 flex items-center justify-center rounded"
        style={{ color: 'var(--color-text-secondary)' }}
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        title={collapsed ? 'Expand toolbar' : 'Collapse toolbar'}
        aria-label={collapsed ? 'Expand toolbar' : 'Collapse toolbar'}
      >
        <CollapseIcon collapsed={collapsed} />
      </button>

      {!collapsed && (
        <>
          <Separator />

          {/* Undo/Redo */}
          <ToolbarButton
            icon={<UndoIcon />}
            label="Undo"
            shortcut={getShortcut('undo')}
            onClick={onUndo}
            disabled={!canUndo}
          />
          <ToolbarButton
            icon={<RedoIcon />}
            label="Redo"
            shortcut={getShortcut('redo')}
            onClick={onRedo}
            disabled={!canRedo}
          />

          <Separator />

          {/* Selection actions */}
          <ToolbarButton
            icon={<DuplicateIcon />}
            label="Duplicate"
            shortcut={getShortcut('duplicate')}
            onClick={onDuplicate}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<DeleteIcon />}
            label="Delete"
            shortcut={getShortcut('delete')}
            onClick={onDelete}
            disabled={!hasSelection}
          />

          <Separator />

          {/* Movement */}
          <ToolbarButton
            icon={<MoveUpIcon />}
            label="Move Up"
            shortcut={getShortcut('moveUp')}
            onClick={onMoveUp}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<MoveDownIcon />}
            label="Move Down"
            shortcut={getShortcut('moveDown')}
            onClick={onMoveDown}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<MoveLeftIcon />}
            label="Move Left"
            shortcut={getShortcut('moveLeft')}
            onClick={onMoveLeft}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<MoveRightIcon />}
            label="Move Right"
            shortcut={getShortcut('moveRight')}
            onClick={onMoveRight}
            disabled={!hasSelection}
          />

          <Separator />

          {/* Rotation */}
          <ToolbarButton
            icon={<RotateCounterClockwiseIcon />}
            label="Rotate CCW"
            shortcut={getShortcut('rotateCounterClockwise')}
            onClick={onRotateCounterClockwise}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<RotateClockwiseIcon />}
            label="Rotate CW"
            shortcut={getShortcut('rotateClockwise')}
            onClick={onRotateClockwise}
            disabled={!hasSelection}
          />

          <Separator />

          {/* Size */}
          <ToolbarButton
            icon={<SizeDecreaseIcon />}
            label="Decrease Size"
            shortcut="Mouse only"
            onClick={onSizeDecrease}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<SizeIncreaseIcon />}
            label="Increase Size"
            shortcut="Mouse only"
            onClick={onSizeIncrease}
            disabled={!hasSelection}
          />

          <Separator />

          {/* Mirror */}
          <ToolbarButton
            icon={<MirrorHorizontalIcon />}
            label="Mirror Horizontal"
            shortcut={getShortcut('mirrorHorizontal')}
            onClick={onMirrorHorizontal}
            disabled={!hasSelection}
          />
          <ToolbarButton
            icon={<MirrorVerticalIcon />}
            label="Mirror Vertical"
            shortcut={getShortcut('mirrorVertical')}
            onClick={onMirrorVertical}
            disabled={!hasSelection}
          />
        </>
      )}
    </div>
  );
}
