import type { Shape, ShapeGroup, DailyChallenge } from '../../types';

export interface LayerPanelProps {
  shapes: Shape[];
  groups: ShapeGroup[];
  selectedShapeIds: Set<string>;
  challenge: DailyChallenge;
  onSelectShape: (id: string | null, options?: { toggle?: boolean; range?: boolean; orderedIds?: string[] }) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onReorderLayers: (draggedId: string, targetIndex: number, targetGroupId: string | null) => void;
  onDeleteShape: (id: string) => void;
  onRenameShape: (id: string, name: string) => void;
  // Group handlers
  onCreateGroup: (shapeIds: string[], groupName?: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onUngroupShapes: (shapeIds: string[]) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onToggleGroupCollapsed: (groupId: string) => void;
  onSelectGroup: (groupId: string, options?: { toggle?: boolean }) => void;
  isOpen: boolean;
  width: number;
  onToggle: () => void;
  onStartResize: (e: React.MouseEvent) => void;
}

// Helper type for rendering grouped and ungrouped shapes
export interface LayerItem {
  type: 'shape' | 'group-header';
  shape?: Shape;
  group?: ShapeGroup;
  shapesInGroup?: Shape[];
  belongsToGroupId?: string; // Track which group this item belongs to for drag-drop
}

export interface LayerItemProps {
  shape: Shape;
  index: number;
  isInGroup: boolean;
  groupId: string | null;
  challenge: DailyChallenge;
  selectedShapeIds: Set<string>;
  editingId: string | null;
  editValue: string;
  draggedId: string | null;
  dropTargetIndex: number | null;
  isTouchDevice: boolean;
  isTopLayer: boolean;
  isBottomLayer: boolean;
  layerHint: string;
  onLayerClick: (e: React.MouseEvent, shapeId: string) => void;
  onStartEditing: (shape: Shape) => void;
  onEditValueChange: (value: string) => void;
  onFinishEditing: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDragStart: (e: React.DragEvent, shapeId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number, groupId: string | null) => void;
  onDrop: (e: React.DragEvent, targetIndex: number, targetGroupId: string | null) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onDeleteShape: (id: string) => void;
}

export interface GroupHeaderProps {
  group: ShapeGroup;
  shapesInGroup: Shape[];
  selectedShapeIds: Set<string>;
  editingGroupId: string | null;
  editValue: string;
  isTouchDevice: boolean;
  isMultiSelectMode: boolean;
  modifierKeyHint: string;
  onGroupClick: (e: React.MouseEvent, groupId: string) => void;
  onStartEditingGroup: (group: ShapeGroup) => void;
  onEditValueChange: (value: string) => void;
  onFinishEditing: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onToggleGroupCollapsed: (groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
}
