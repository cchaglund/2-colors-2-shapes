import type { Shape, ShapeGroup } from '../types';

/** Check if a shape is effectively visible (considers its own + group visibility) */
export function isShapeVisible(shape: Shape, groups: ShapeGroup[]): boolean {
  if (shape.visible === false) return false;
  if (shape.groupId) {
    const group = groups.find(g => g.id === shape.groupId);
    if (group && group.visible === false) return false;
  }
  return true;
}

/** Filter shapes to only those effectively visible */
export function getVisibleShapes(shapes: Shape[], groups: ShapeGroup[]): Shape[] {
  return shapes.filter(s => isShapeVisible(s, groups));
}
