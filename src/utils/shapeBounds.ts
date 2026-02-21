import type { Shape } from '../types';
import { getShapeDimensions } from './shapes';

interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Compute the axis-aligned bounding box of a shape, accounting for rotation.
 * Rotates the four corners of the shape around its center, then returns the
 * enclosing min/max rectangle in canvas coordinates.
 */
export function getShapeAABB(shape: Shape): AABB {
  const dims = getShapeDimensions(shape.type, shape.size);
  const cx = dims.width / 2;
  const cy = dims.height / 2;
  const angleRad = (shape.rotation * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const corners = [
    { x: 0, y: 0 },
    { x: dims.width, y: 0 },
    { x: dims.width, y: dims.height },
    { x: 0, y: dims.height },
  ];

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const c of corners) {
    const rx = (c.x - cx) * cos - (c.y - cy) * sin;
    const ry = (c.x - cx) * sin + (c.y - cy) * cos;
    const fx = shape.x + cx + rx;
    const fy = shape.y + cy + ry;
    minX = Math.min(minX, fx);
    minY = Math.min(minY, fy);
    maxX = Math.max(maxX, fx);
    maxY = Math.max(maxY, fy);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Check if two axis-aligned bounding boxes overlap (partial or full).
 */
export function rectsIntersect(a: AABB, b: AABB): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}
