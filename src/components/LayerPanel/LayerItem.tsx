import type { LayerItemProps } from './types';

/**
 * Renders a shape layer item in the layer panel
 */
export function LayerItem({
  shape,
  index,
  isInGroup,
  groupId,
  challenge,
  selectedShapeIds,
  editingId,
  editValue,
  draggedId,
  dropTargetIndex,
  isTouchDevice,
  isTopLayer,
  isBottomLayer,
  layerHint,
  onLayerClick,
  onStartEditing,
  onEditValueChange,
  onFinishEditing,
  onKeyDown,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onMoveLayer,
  onDeleteShape,
}: LayerItemProps) {
  return (
    <li
      draggable={editingId !== shape.id}
      onDragStart={(e) => onDragStart(e, shape.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index, groupId)}
      onDrop={(e) => onDrop(e, index, groupId)}
      className={`group relative flex items-center gap-2 p-2 rounded cursor-grab transition-colors ${
        draggedId === shape.id ? 'opacity-50' : ''
      } ${
        dropTargetIndex === index && draggedId !== shape.id
          ? 'border-t-2 border-blue-500'
          : ''
      }`}
      style={{
        backgroundColor: selectedShapeIds.has(shape.id) ? 'var(--color-selected)' : undefined,
        paddingLeft: isInGroup ? '24px' : '8px',
      }}
      onClick={(e) => onLayerClick(e, shape.id)}
      title={layerHint}
      onMouseEnter={(e) => {
        if (!selectedShapeIds.has(shape.id)) {
          e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selectedShapeIds.has(shape.id)) {
          e.currentTarget.style.backgroundColor = '';
        }
      }}
    >
      <div
        className="w-5 h-5 rounded shrink-0"
        style={{
          backgroundColor: challenge.colors[shape.colorIndex],
          border: '1px solid var(--color-border-light)',
        }}
      />
      {editingId === shape.id ? (
        <input
          className="flex-1 text-sm py-0.5 px-1 border border-blue-600 rounded outline-none min-w-0"
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
          className="flex-1 text-sm overflow-hidden text-ellipsis whitespace-nowrap cursor-text"
          style={{ color: 'var(--color-text-primary)' }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEditing(shape);
          }}
        >
          {shape.name}
        </span>
      )}
      {/* Action buttons - always visible on touch, hover-only on desktop */}
      {isTouchDevice ? (
        // Touch devices: always show a simplified set of buttons
        <div className="flex gap-0.5 shrink-0 ml-auto">
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Move up"
            disabled={isTopLayer}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'up');
            }}
          >
            ⬆
          </button>
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Move down"
            disabled={isBottomLayer}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'down');
            }}
          >
            ⬇
          </button>
          <button
            className="w-7 h-7 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
            }}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteShape(shape.id);
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        // Desktop: show on hover with full set of buttons
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 shadow-sm"
          style={{ backgroundColor: 'var(--color-overlay)' }}
        >
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Bring to front"
            disabled={isTopLayer}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'top');
            }}
            onMouseEnter={(e) => {
              if (!isTopLayer) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
            }}
          >
            ⬆⬆
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Move up"
            disabled={isTopLayer}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'up');
            }}
            onMouseEnter={(e) => {
              if (!isTopLayer) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
            }}
          >
            ⬆
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Move down"
            disabled={isBottomLayer}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'down');
            }}
            onMouseEnter={(e) => {
              if (!isBottomLayer) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
            }}
          >
            ⬇
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            title="Send to back"
            disabled={isBottomLayer}
            onClick={(e) => {
              e.stopPropagation();
              onMoveLayer(shape.id, 'bottom');
            }}
            onMouseEnter={(e) => {
              if (!isBottomLayer) e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
            }}
          >
            ⬇⬇
          </button>
          <button
            className="w-6 h-6 p-0 rounded cursor-pointer text-[10px] flex items-center justify-center text-red-600 ml-1 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
            }}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteShape(shape.id);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </li>
  );
}
