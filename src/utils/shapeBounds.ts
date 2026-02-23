import type { Shape } from '../types';
import { getShapeDimensions, getShapeSVGData } from './shapes';

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

// ── Helpers for polygon / circle vs rectangle intersection ───────────

type Pt = { x: number; y: number };

/** Parse an SVG points string ("x,y x,y …") into an array of {x,y}. */
function parsePoints(s: string): Pt[] {
  return s.split(/\s+/).map((pair) => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });
}

/** Point-in-polygon via ray-casting (works for convex & concave). */
function pointInPolygon(pt: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i].y, yj = poly[j].y;
    if ((yi > pt.y) !== (yj > pt.y) &&
        pt.x < ((poly[j].x - poly[i].x) * (pt.y - yi)) / (yj - yi) + poly[i].x) {
      inside = !inside;
    }
  }
  return inside;
}

/** Do two line segments (p1→p2) and (p3→p4) cross? */
function segmentsIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return false;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/** Does an arbitrary polygon intersect an AABB? */
function polygonIntersectsRect(poly: Pt[], rect: AABB): boolean {
  const rc: Pt[] = [
    { x: rect.minX, y: rect.minY },
    { x: rect.maxX, y: rect.minY },
    { x: rect.maxX, y: rect.maxY },
    { x: rect.minX, y: rect.maxY },
  ];

  // 1. Any polygon vertex inside rect?
  for (const v of poly) {
    if (v.x >= rect.minX && v.x <= rect.maxX && v.y >= rect.minY && v.y <= rect.maxY) return true;
  }
  // 2. Any rect corner inside polygon?
  for (const c of rc) {
    if (pointInPolygon(c, poly)) return true;
  }
  // 3. Any edges cross?
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    for (let j = 0; j < 4; j++) {
      if (segmentsIntersect(a, b, rc[j], rc[(j + 1) % 4])) return true;
    }
  }
  return false;
}

/** Does a circle (center + radius) intersect an AABB? */
function circleIntersectsRect(center: Pt, r: number, rect: AABB): boolean {
  const closestX = Math.max(rect.minX, Math.min(center.x, rect.maxX));
  const closestY = Math.max(rect.minY, Math.min(center.y, rect.maxY));
  const dx = center.x - closestX;
  const dy = center.y - closestY;
  return dx * dx + dy * dy <= r * r;
}

// ── Public: accurate shape-vs-rect test ─────────────────────────────

/**
 * Test if a shape's *actual geometry* (polygon, circle, or OBB fallback)
 * intersects an axis-aligned rectangle.
 */
export function shapeIntersectsRect(shape: Shape, rect: AABB): boolean {
  const svgData = getShapeSVGData(shape.type, shape.size);
  const { width, height } = svgData.viewBox;
  const cx = width / 2;
  const cy = height / 2;
  const angleRad = (shape.rotation * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  /** Transform a local-space point to world/canvas coordinates. */
  const toWorld = (lx: number, ly: number): Pt => {
    const rx = (lx - cx) * cos - (ly - cy) * sin;
    const ry = (lx - cx) * sin + (ly - cy) * cos;
    return { x: shape.x + cx + rx, y: shape.y + cy + ry };
  };

  // ── Polygon shapes: use actual vertices ───────────────────────────
  if (svgData.element === 'polygon') {
    const verts = parsePoints(svgData.props.points as string).map((p) => toWorld(p.x, p.y));
    return polygonIntersectsRect(verts, rect);
  }

  // ── Circle / ellipse ──────────────────────────────────────────────
  if (svgData.element === 'ellipse') {
    const props = svgData.props as { cx: number; cy: number; rx: number; ry: number };
    // True circle: rotation-invariant, use fast circle test
    if (Math.abs(props.rx - props.ry) < 0.01) {
      const center = toWorld(props.cx, props.cy);
      return circleIntersectsRect(center, props.rx, rect);
    }
    // Ellipse: approximate as 16-gon
    const verts: Pt[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (2 * Math.PI * i) / 16;
      verts.push(toWorld(props.cx + props.rx * Math.cos(a), props.cy + props.ry * Math.sin(a)));
    }
    return polygonIntersectsRect(verts, rect);
  }

  // ── Rect and path shapes: fall back to OBB (rotated bounding rect) ─
  const hw = width / 2;
  const hh = height / 2;
  const wcx = shape.x + hw;
  const wcy = shape.y + hh;
  const obb: Pt[] = [
    { x: wcx + (-hw * cos - -hh * sin), y: wcy + (-hw * sin + -hh * cos) },
    { x: wcx + (hw * cos - -hh * sin), y: wcy + (hw * sin + -hh * cos) },
    { x: wcx + (hw * cos - hh * sin), y: wcy + (hw * sin + hh * cos) },
    { x: wcx + (-hw * cos - hh * sin), y: wcy + (-hw * sin + hh * cos) },
  ];
  return polygonIntersectsRect(obb, rect);
}
