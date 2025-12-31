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
  isTop,
  isBottom,
  topLevelIndex,
  draggedGroupId,
  dropTargetTopLevelIndex,
  onGroupClick,
  onStartEditingGroup,
  onEditValueChange,
  onFinishEditing,
  onKeyDown,
  onToggleGroupCollapsed,
  onDeleteGroup,
  onMoveGroup,
  onGroupDragStart,
  onGroupDragEnd,
  onGroupDragOver,
  onGroupDrop,
}: GroupHeaderProps) {
  // Check if all shapes in group are selected
  const allSelected = shapesInGroup.every((s) => selectedShapeIds.has(s.id));
  const someSelected = shapesInGroup.some((s) => selectedShapeIds.has(s.id));

  const isDragging = draggedGroupId === group.id;
  const isDropTarget = dropTargetTopLevelIndex === topLevelIndex && draggedGroupId !== group.id;

  return (
    <li
      draggable={editingGroupId !== group.id}
      onDragStart={(e) => onGroupDragStart(e, group.id)}
      onDragEnd={onGroupDragEnd}
      onDragOver={(e) => onGroupDragOver(e, topLevelIndex)}
      onDrop={(e) => onGroupDrop(e, topLevelIndex)}
      className={`group relative flex items-center gap-2 p-2 rounded cursor-grab transition-colors ${
        isDragging ? 'opacity-50' : ''
      } ${
        isDropTarget ? 'border-t-2 border-blue-500' : ''
      } ${
        allSelected
          ? 'bg-(--color-selected)'
          : someSelected
          ? 'bg-(--color-selected-partial) hover:bg-(--color-hover)'
          : 'hover:bg-(--color-hover)'
      }`}
      onClick={(e) => onGroupClick(e, group.id)}
      title={isTouchDevice
        ? (isMultiSelectMode ? 'Tap to toggle group selection' : 'Tap to select group')
        : `Click to select all shapes in group, ${modifierKeyHint}+click to add to selection`}
    >
      {/* Collapse/expand toggle */}
      <button
        className="w-5 h-5 flex items-center justify-center text-xs rounded hover:bg-black/10 text-(--color-text-secondary)"
        onClick={(e) => {
          e.stopPropagation();
          onToggleGroupCollapsed(group.id);
        }}
        title={group.isCollapsed ? 'Expand group' : 'Collapse group'}
      >
        {group.isCollapsed ? '▶' : '▼'}
      </button>

      {/* Group icon */}
      <div className="w-5 h-5 rounded shrink-0 flex items-center justify-center text-xs bg-(--color-bg-tertiary) border border-(--color-border) text-(--color-text-secondary)">
        G
      </div>

      {/* Group name */}
      {editingGroupId === group.id ? (
        <input
          className="flex-1 text-sm py-0.5 px-1 border border-blue-600 rounded outline-none min-w-0 font-medium bg-(--color-bg-primary) text-(--color-text-primary)"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={onFinishEditing}
          onKeyDown={onKeyDown}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap cursor-text font-medium text-(--color-text-primary)"
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEditingGroup(group);
          }}
        >
          {group.name}
          <span className="ml-1 text-xs font-normal text-(--color-text-tertiary)">
            ({shapesInGroup.length})
          </span>
        </span>
      )}

      {/* Group actions - always visible on touch, hover-only on desktop */}
      {isTouchDevice ? (
        <div className="flex gap-0.5 shrink-0 ml-auto">
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed bg-(--color-bg-primary) border border-(--color-border) text-(--color-text-primary)"
            title="Move up"
            disabled={isTop}
            onClick={(e) => {
              e.stopPropagation();
              onMoveGroup(group.id, 'up');
            }}
          >
            ⬆
          </button>
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed bg-(--color-bg-primary) border border-(--color-border) text-(--color-text-primary)"
            title="Move down"
            disabled={isBottom}
            onClick={(e) => {
              e.stopPropagation();
              onMoveGroup(group.id, 'down');
            }}
          >
            ⬇
          </button>
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 bg-(--color-bg-primary) border border-(--color-border)"
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
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 shadow-sm bg-(--color-overlay)">
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed bg-(--color-bg-primary) border border-(--color-border) text-(--color-text-primary) hover:enabled:bg-(--color-hover)"
            title="Bring to front"
            disabled={isTop}
            onClick={(e) => {
              e.stopPropagation();
              onMoveGroup(group.id, 'top');
            }}
          >
            ⬆⬆
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed bg-(--color-bg-primary) border border-(--color-border) text-(--color-text-primary) hover:enabled:bg-(--color-hover)"
            title="Move up"
            disabled={isTop}
            onClick={(e) => {
              e.stopPropagation();
              onMoveGroup(group.id, 'up');
            }}
          >
            ⬆
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed bg-(--color-bg-primary) border border-(--color-border) text-(--color-text-primary) hover:enabled:bg-(--color-hover)"
            title="Move down"
            disabled={isBottom}
            onClick={(e) => {
              e.stopPropagation();
              onMoveGroup(group.id, 'down');
            }}
          >
            ⬇
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed bg-(--color-bg-primary) border border-(--color-border) text-(--color-text-primary) hover:enabled:bg-(--color-hover)"
            title="Send to back"
            disabled={isBottom}
            onClick={(e) => {
              e.stopPropagation();
              onMoveGroup(group.id, 'bottom');
            }}
          >
            ⬇⬇
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 ml-1 hover:bg-red-50 bg-(--color-bg-primary) border border-(--color-border)"
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
