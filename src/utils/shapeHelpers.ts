import type { ShapeType } from '../types';

// Generate polygon points for regular polygons
export function getPolygonPoints(
  sides: number,
  size: number,
  offsetAngle: number = 0
): string {
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / sides;
  const radius = size / 2;

  for (let i = 0; i < sides; i++) {
    const angle = angleStep * i + offsetAngle - Math.PI / 2; // Start from top
    const x = radius + radius * Math.cos(angle);
    const y = radius + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return points.join(' ');
}

// Generate star points
export function getStarPoints(size: number, points: number = 5): string {
  const coords: string[] = [];
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.4;
  const angleStep = Math.PI / points;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = angleStep * i - Math.PI / 2;
    const x = outerRadius + radius * Math.cos(angle);
    const y = outerRadius + radius * Math.sin(angle);
    coords.push(`${x},${y}`);
  }

  return coords.join(' ');
}

// Get SVG path/element data for each shape type
export function getShapeSVGData(type: ShapeType, size: number) {
  switch (type) {
    case 'circle':
      return {
        element: 'ellipse' as const,
        props: {
          cx: size / 2,
          cy: size / 2,
          rx: size / 2,
          ry: size / 2,
        },
      };

    case 'square':
      return {
        element: 'rect' as const,
        props: {
          x: 0,
          y: 0,
          width: size,
          height: size,
        },
      };

    case 'triangle':
      return {
        element: 'polygon' as const,
        props: {
          points: getPolygonPoints(3, size),
        },
      };

    case 'pentagon':
      return {
        element: 'polygon' as const,
        props: {
          points: getPolygonPoints(5, size),
        },
      };

    case 'hexagon':
      return {
        element: 'polygon' as const,
        props: {
          points: getPolygonPoints(6, size),
        },
      };

    case 'star':
      return {
        element: 'polygon' as const,
        props: {
          points: getStarPoints(size),
        },
      };

    default:
      return {
        element: 'rect' as const,
        props: {
          x: 0,
          y: 0,
          width: size,
          height: size,
        },
      };
  }
}

// Generate a unique ID
export function generateId(): string {
  return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Shape display names
export const SHAPE_NAMES: Record<ShapeType, string> = {
  circle: 'Circle',
  square: 'Square',
  triangle: 'Triangle',
  pentagon: 'Pentagon',
  hexagon: 'Hexagon',
  star: 'Star',
};
