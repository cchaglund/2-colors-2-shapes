import type { LayerItemProps } from './types';
import { VisibilityToggle } from './VisibilityToggle';
import { ShapeIcon } from '../shared/ShapeIcon';

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
  onToggleVisibility,
  onHoverShape,
  groupVisible,
}: LayerItemProps) {
  const isSelected = selectedShapeIds.has(shape.id);
  const isVisible = shape.visible !== false;
  const isEffectivelyVisible = isVisible && groupVisible;
  const shapeColor = challenge.colors[shape.colorIndex];

  return (
    <li
      draggable={editingId !== shape.id}
      onDragStart={(e) => onDragStart(e, shape.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index, groupId)}
      onDrop={(e) => onDrop(e, index, groupId)}
      className={`relative flex items-center gap-1.5 py-1.5 px-2 rounded-(--radius-sm) cursor-grab transition-colors ${
        draggedId === shape.id ? 'opacity-50' : ''
      } ${
        dropTargetIndex === index && draggedId !== shape.id
          ? 'border-t-2 border-(--color-accent)'
          : ''
      } ${
        isSelected ? 'bg-(--color-selected)' : 'hover:bg-(--color-hover)'
      } ${isInGroup ? 'pl-6' : 'pl-2'} ${!isEffectivelyVisible ? 'opacity-50' : ''}`}
      onClick={(e) => onLayerClick(e, shape.id)}
      onMouseEnter={() => onHoverShape(new Set([shape.id]))}
      onMouseLeave={() => onHoverShape(null)}
      title={layerHint}
    >
      <VisibilityToggle
        visible={isVisible}
        onToggle={(e) => {
          e.stopPropagation();
          onToggleVisibility(shape.id);
        }}
      />
      {/* Shape thumbnail — colored shape with border */}
      <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
        <ShapeIcon
          type={shape.type}
          size={18}
          fill={shapeColor}
          stroke="var(--color-border)"
          strokeWidth={1.5}
        />
      </div>
      {editingId === shape.id ? (
        <input
          className="flex-1 text-xs py-0.5 px-1 border border-(--color-accent) rounded-(--radius-sm) outline-none min-w-0 bg-(--color-bg-primary) text-(--color-text-primary)"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={onFinishEditing}
          onKeyDown={onKeyDown}
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span
          className="flex-1 text-xs font-semibold overflow-hidden text-ellipsis whitespace-nowrap cursor-text text-(--color-text-primary) capitalize"
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartEditing(shape);
          }}
        >
          {shape.name}
        </span>
      )}
      {/* Action buttons — always visible */}
      <div className="flex gap-0.5 shrink-0 ml-auto">
        <button
          className="w-3 h-3 p-0 bg-transparent border-none cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-(--color-text-secondary) hover:enabled:text-(--color-text-primary) rounded-(--radius-sm)"
          title="Move up"
          disabled={isTopLayer}
          onClick={(e) => {
            e.stopPropagation();
            onMoveLayer(shape.id, 'up');
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button
          className="w-3 h-3 p-0 bg-transparent border-none cursor-pointer flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-(--color-text-secondary) hover:enabled:text-(--color-text-primary) rounded-(--radius-sm)"
          title="Move down"
          disabled={isBottomLayer}
          onClick={(e) => {
            e.stopPropagation();
            onMoveLayer(shape.id, 'down');
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
        <button
          className="w-3 h-3 p-0 bg-transparent border-none cursor-pointer flex items-center justify-center text-(--color-accent) rounded-(--radius-sm)"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteShape(shape.id);
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </li>
  );
}
