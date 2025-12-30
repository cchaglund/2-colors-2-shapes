import type { GroupHeaderProps } from './types';

/**
 * Renders a group header in the layer panel
 */
export function GroupHeader({
  group,
  shapesInGroup,
  selectedShapeIds,
  editingGroupId,
  editValue,
  isTouchDevice,
  isMultiSelectMode,
  modifierKeyHint,
  onGroupClick,
  onStartEditingGroup,
  onEditValueChange,
  onFinishEditing,
  onKeyDown,
  onToggleGroupCollapsed,
  onDeleteGroup,
}: GroupHeaderProps) {
  // Check if all shapes in group are selected
  const allSelected = shapesInGroup.every((s) => selectedShapeIds.has(s.id));
  const someSelected = shapesInGroup.some((s) => selectedShapeIds.has(s.id));

  return (
    <li
      className="group relative flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
      style={{
        backgroundColor: allSelected ? 'var(--color-selected)' : someSelected ? 'var(--color-selected-partial)' : undefined,
      }}
      onClick={(e) => onGroupClick(e, group.id)}
      title={isTouchDevice
        ? (isMultiSelectMode ? 'Tap to toggle group selection' : 'Tap to select group')
        : `Click to select all shapes in group, ${modifierKeyHint}+click to add to selection`}
      onMouseEnter={(e) => {
        if (!allSelected) {
          e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!allSelected && !someSelected) {
          e.currentTarget.style.backgroundColor = '';
        } else if (someSelected && !allSelected) {
          e.currentTarget.style.backgroundColor = 'var(--color-selected-partial)';
        }
      }}
    >
      {/* Collapse/expand toggle */}
      <button
        className="w-5 h-5 flex items-center justify-center text-xs rounded hover:bg-opacity-20"
        style={{ color: 'var(--color-text-secondary)' }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleGroupCollapsed(group.id);
        }}
        title={group.isCollapsed ? 'Expand group' : 'Collapse group'}
      >
        {group.isCollapsed ? '▶' : '▼'}
      </button>

      {/* Group icon */}
      <div
        className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-xs"
        style={{
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        G
      </div>

      {/* Group name */}
      {editingGroupId === group.id ? (
        <input
          className="flex-1 text-sm py-0.5 px-1 border border-blue-600 rounded outline-none min-w-0 font-medium"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          }}
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={onFinishEditing}
          onKeyDown={onKeyDown}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap cursor-text font-medium"
          style={{ color: 'var(--color-text-primary)' }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEditingGroup(group);
          }}
        >
          {group.name}
          <span className="ml-1 text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
            ({shapesInGroup.length})
          </span>
        </span>
      )}

      {/* Group actions - always visible on touch, hover-only on desktop */}
      {isTouchDevice ? (
        <div className="flex gap-0.5 shrink-0 ml-auto">
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
            }}
            title="Delete group (keeps shapes)"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup(group.id);
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 shadow-sm"
          style={{ backgroundColor: 'var(--color-overlay)' }}
        >
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 hover:bg-red-50"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
            }}
            title="Delete group (keeps shapes)"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteGroup(group.id);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </li>
  );
}
