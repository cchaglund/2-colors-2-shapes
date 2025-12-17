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

// Generate right triangle points
export function getRightTrianglePoints(size: number): string {
  return `0,${size} ${size},${size} 0,0`;
}

// Generate isosceles triangle (taller than equilateral)
export function getIsoscelesTrianglePoints(size: number): string {
  const centerX = size / 2;
  return `${centerX},0 ${size},${size} 0,${size}`;
}

// Generate diamond (rhombus) points
export function getDiamondPoints(size: number): string {
  const half = size / 2;
  return `${half},0 ${size},${half} ${half},${size} 0,${half}`;
}

// Generate trapezoid points
export function getTrapezoidPoints(size: number): string {
  const inset = size * 0.2;
  return `${inset},0 ${size - inset},0 ${size},${size} 0,${size}`;
}

// Generate parallelogram points
export function getParallelogramPoints(size: number): string {
  const skew = size * 0.25;
  return `${skew},0 ${size},0 ${size - skew},${size} 0,${size}`;
}

// Generate kite points
export function getKitePoints(size: number): string {
  const centerX = size / 2;
  const widthOffset = size * 0.35;
  const topHeight = size * 0.3;
  return `${centerX},0 ${centerX + widthOffset},${topHeight} ${centerX},${size} ${centerX - widthOffset},${topHeight}`;
}

// Generate cross/plus points
export function getCrossPoints(size: number): string {
  const armWidth = size / 3;
  const outer = size;
  const inner1 = armWidth;
  const inner2 = armWidth * 2;
  return `${inner1},0 ${inner2},0 ${inner2},${inner1} ${outer},${inner1} ${outer},${inner2} ${inner2},${inner2} ${inner2},${outer} ${inner1},${outer} ${inner1},${inner2} 0,${inner2} 0,${inner1} ${inner1},${inner1}`;
}

// Generate arrow/chevron points
export function getArrowPoints(size: number): string {
  const shaftWidth = size * 0.35;
  const headStart = size * 0.5;
  const centerY = size / 2;
  const halfShaft = shaftWidth / 2;
  return `0,${centerY - halfShaft} ${headStart},${centerY - halfShaft} ${headStart},0 ${size},${centerY} ${headStart},${size} ${headStart},${centerY + halfShaft} 0,${centerY + halfShaft}`;
}

// Generate semicircle path
export function getSemicirclePath(size: number): string {
  const radius = size / 2;
  return `M 0,${size} A ${radius},${radius} 0 0 1 ${size},${size} L 0,${size} Z`;
}

// Generate quarter circle path
export function getQuarterCirclePath(size: number): string {
  return `M 0,0 L ${size},0 A ${size},${size} 0 0 1 0,${size} L 0,0 Z`;
}

// Generate blade/leaf path (curved asymmetric shape)
export function getBladePath(size: number): string {
  const controlOffset = size * 0.5;
  return `M ${size / 2},0 Q ${size + controlOffset * 0.5},${size * 0.35} ${size / 2},${size} Q ${-controlOffset * 0.5},${size * 0.65} ${size / 2},0 Z`;
}

// Generate lens (vesica piscis) path
export function getLensPath(size: number): string {
  const radius = size * 0.7;
  const centerY = size / 2;
  return `M 0,${centerY} A ${radius},${radius} 0 0 1 ${size},${centerY} A ${radius},${radius} 0 0 1 0,${centerY} Z`;
}

// Generate arch path
export function getArchPath(size: number): string {
  const archWidth = size * 0.3;
  const innerWidth = size - archWidth * 2;
  const innerRadius = innerWidth / 2;
  const outerRadius = size / 2;
  return `M 0,${size} L 0,${size * 0.4} A ${outerRadius},${outerRadius} 0 0 1 ${size},${size * 0.4} L ${size},${size} L ${size - archWidth},${size} L ${size - archWidth},${size * 0.4 + archWidth * 0.5} A ${innerRadius},${innerRadius} 0 0 0 ${archWidth},${size * 0.4 + archWidth * 0.5} L ${archWidth},${size} Z`;
}

// Generate teardrop/drop path (smooth curve using cubic bezier)
export function getDropPath(size: number): string {
  const centerX = size / 2;
  return `M ${centerX},0 C ${size * 0.9},${size * 0.4} ${size * 0.9},${size * 0.7} ${centerX},${size} C ${size * 0.1},${size * 0.7} ${size * 0.1},${size * 0.4} ${centerX},0 Z`;
}

// Generate shard - angular asymmetric fragment
export function getShardPoints(size: number): string {
  return `${size * 0.2},0 ${size * 0.9},${size * 0.15} ${size},${size * 0.6} ${size * 0.5},${size} 0,${size * 0.7} ${size * 0.1},${size * 0.3}`;
}

// Generate wedge - thick angled slice
export function getWedgePoints(size: number): string {
  return `${size * 0.5},0 ${size},${size * 0.3} ${size * 0.8},${size} ${size * 0.2},${size} 0,${size * 0.5}`;
}

// Generate fan - spread-out curved shape
export function getFanPath(size: number): string {
  return `M ${size * 0.1},${size} Q ${size * 0.1},${size * 0.5} ${size * 0.5},${size * 0.1} L ${size},0 Q ${size * 0.6},${size * 0.4} ${size * 0.9},${size} Z`;
}

// Generate hook - curved hook shape
export function getHookPath(size: number): string {
  return `M ${size * 0.3},0 L ${size * 0.5},0 Q ${size},0 ${size},${size * 0.4} Q ${size},${size * 0.7} ${size * 0.6},${size * 0.7} L ${size * 0.6},${size} L ${size * 0.3},${size} L ${size * 0.3},${size * 0.5} Q ${size * 0.3},${size * 0.2} ${size * 0.6},${size * 0.2} Q ${size * 0.75},${size * 0.2} ${size * 0.75},${size * 0.4} Q ${size * 0.75},${size * 0.5} ${size * 0.6},${size * 0.5} L ${size * 0.3},${size * 0.5} Z`;
}

// Generate wave - flowing wave shape
export function getWavePath(size: number): string {
  return `M 0,${size * 0.5} Q ${size * 0.25},${size * 0.2} ${size * 0.5},${size * 0.5} Q ${size * 0.75},${size * 0.8} ${size},${size * 0.5} L ${size},${size * 0.8} Q ${size * 0.75},${size} ${size * 0.5},${size * 0.8} Q ${size * 0.25},${size * 0.6} 0,${size * 0.8} Z`;
}

// Generate crescent - moon crescent shape
export function getCrescentPath(size: number): string {
  // Crescent using two arcs: outer arc curves left, inner arc curves right
  const r = size * 0.4;
  const cy = size / 2;
  const top = cy - r;
  const bottom = cy + r;
  const leftX = size * 0.3;
  const rightX = size * 0.5;
  // Outer arc bulges left, inner arc bulges right (creating moon shape)
  return `M ${size * 0.5},${top} Q ${leftX - r * 0.8},${cy} ${size * 0.5},${bottom} Q ${rightX + r * 0.3},${cy} ${size * 0.5},${top} Z`;
}

// Generate pill - rounded rectangle
export function getPillPath(size: number): string {
  const r = size * 0.2;
  return `M ${r},0 L ${size - r},0 A ${r},${r} 0 0 1 ${size - r},${r * 2} L ${r},${r * 2} A ${r},${r} 0 0 1 ${r},0 Z`;
}

// Generate splinter - thin angular shard
export function getSplinterPoints(size: number): string {
  return `${size * 0.4},0 ${size * 0.6},0 ${size * 0.8},${size * 0.3} ${size},${size} ${size * 0.7},${size * 0.6} ${size * 0.3},${size * 0.8} 0,${size * 0.4}`;
}

// Generate chunk - irregular blocky shape
export function getChunkPoints(size: number): string {
  return `${size * 0.1},${size * 0.1} ${size * 0.6},0 ${size},${size * 0.2} ${size * 0.9},${size * 0.7} ${size * 0.6},${size} ${size * 0.2},${size * 0.9} 0,${size * 0.5}`;
}

// Generate fang - pointed shape with curved back
export function getFangPath(size: number): string {
  return `M ${size * 0.3},0 L ${size * 0.7},0 L ${size * 0.5},${size} Q ${size * 0.2},${size * 0.6} ${size * 0.3},0 Z`;
}

// Generate claw - curved hook with angular base
export function getClawPath(size: number): string {
  return `M ${size * 0.2},${size} L ${size * 0.5},${size} L ${size * 0.6},${size * 0.7} Q ${size * 0.9},${size * 0.3} ${size * 0.5},0 Q ${size * 0.3},${size * 0.2} ${size * 0.35},${size * 0.5} L ${size * 0.2},${size} Z`;
}

// Generate fin - angular with one curved edge
export function getFinPath(size: number): string {
  return `M 0,${size} L ${size * 0.3},${size * 0.7} L ${size * 0.2},${size * 0.2} L ${size * 0.8},0 Q ${size},${size * 0.4} ${size * 0.7},${size} Z`;
}

// Generate thorn - sharp point with curved sides
export function getThornPath(size: number): string {
  return `M ${size * 0.5},0 Q ${size * 0.8},${size * 0.3} ${size * 0.7},${size * 0.6} L ${size * 0.9},${size} L ${size * 0.1},${size} L ${size * 0.3},${size * 0.6} Q ${size * 0.2},${size * 0.3} ${size * 0.5},0 Z`;
}

// Generate slant - parallelogram with one curved side
export function getSlantPath(size: number): string {
  return `M ${size * 0.3},0 L ${size},0 L ${size * 0.7},${size} L 0,${size} Q ${size * 0.1},${size * 0.5} ${size * 0.3},0 Z`;
}

// Generate notch - angular shape with curved indent
export function getNotchPath(size: number): string {
  return `M 0,0 L ${size},0 L ${size},${size * 0.6} Q ${size * 0.5},${size * 0.4} 0,${size * 0.6} L 0,0 Z`;
}

// Generate spike - tall narrow with curved base
export function getSpikePath(size: number): string {
  return `M ${size * 0.5},0 L ${size * 0.7},${size * 0.6} Q ${size * 0.8},${size} ${size * 0.5},${size} Q ${size * 0.2},${size} ${size * 0.3},${size * 0.6} L ${size * 0.5},0 Z`;
}

// Generate bulge - angular corners with curved middle
export function getBulgePath(size: number): string {
  return `M ${size * 0.2},0 L ${size * 0.8},0 L ${size},${size * 0.3} Q ${size * 0.9},${size * 0.7} ${size * 0.7},${size} L ${size * 0.3},${size} Q ${size * 0.1},${size * 0.7} 0,${size * 0.3} L ${size * 0.2},0 Z`;
}

// Generate scoop - angular top with curved bottom
export function getScoopPath(size: number): string {
  return `M 0,${size * 0.2} L ${size * 0.3},0 L ${size * 0.7},0 L ${size},${size * 0.2} L ${size * 0.9},${size * 0.5} Q ${size * 0.5},${size * 1.1} ${size * 0.1},${size * 0.5} L 0,${size * 0.2} Z`;
}

// Generate ridge - zigzag top with curved bottom
export function getRidgePath(size: number): string {
  return `M 0,${size * 0.4} L ${size * 0.25},${size * 0.1} L ${size * 0.5},${size * 0.3} L ${size * 0.75},${size * 0.1} L ${size},${size * 0.4} Q ${size * 0.8},${size} ${size * 0.5},${size} Q ${size * 0.2},${size} 0,${size * 0.4} Z`;
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

    // New sophisticated shapes
    case 'rightTriangle':
      return {
        element: 'polygon' as const,
        props: {
          points: getRightTrianglePoints(size),
        },
      };

    case 'isoscelesTriangle':
      return {
        element: 'polygon' as const,
        props: {
          points: getIsoscelesTrianglePoints(size),
        },
      };

    case 'diamond':
      return {
        element: 'polygon' as const,
        props: {
          points: getDiamondPoints(size),
        },
      };

    case 'trapezoid':
      return {
        element: 'polygon' as const,
        props: {
          points: getTrapezoidPoints(size),
        },
      };

    case 'parallelogram':
      return {
        element: 'polygon' as const,
        props: {
          points: getParallelogramPoints(size),
        },
      };

    case 'kite':
      return {
        element: 'polygon' as const,
        props: {
          points: getKitePoints(size),
        },
      };

    case 'heptagon':
      return {
        element: 'polygon' as const,
        props: {
          points: getPolygonPoints(7, size),
        },
      };

    case 'cross':
      return {
        element: 'polygon' as const,
        props: {
          points: getCrossPoints(size),
        },
      };

    case 'arrow':
      return {
        element: 'polygon' as const,
        props: {
          points: getArrowPoints(size),
        },
      };

    case 'semicircle':
      return {
        element: 'path' as const,
        props: {
          d: getSemicirclePath(size),
        },
      };

    case 'quarterCircle':
      return {
        element: 'path' as const,
        props: {
          d: getQuarterCirclePath(size),
        },
      };

    case 'ellipse':
      return {
        element: 'ellipse' as const,
        props: {
          cx: size / 2,
          cy: size / 2,
          rx: size / 2,
          ry: size / 3,
        },
      };

    case 'blade':
      return {
        element: 'path' as const,
        props: {
          d: getBladePath(size),
        },
      };

    case 'lens':
      return {
        element: 'path' as const,
        props: {
          d: getLensPath(size),
        },
      };

    case 'arch':
      return {
        element: 'path' as const,
        props: {
          d: getArchPath(size),
        },
      };

    case 'drop':
      return {
        element: 'path' as const,
        props: {
          d: getDropPath(size),
        },
      };

    // Irregular abstract shapes
    case 'shard':
      return {
        element: 'polygon' as const,
        props: {
          points: getShardPoints(size),
        },
      };

    case 'wedge':
      return {
        element: 'polygon' as const,
        props: {
          points: getWedgePoints(size),
        },
      };

    case 'fan':
      return {
        element: 'path' as const,
        props: {
          d: getFanPath(size),
        },
      };

    case 'hook':
      return {
        element: 'path' as const,
        props: {
          d: getHookPath(size),
        },
      };

    case 'wave':
      return {
        element: 'path' as const,
        props: {
          d: getWavePath(size),
        },
      };

    case 'crescent':
      return {
        element: 'path' as const,
        props: {
          d: getCrescentPath(size),
        },
      };

    case 'pill':
      return {
        element: 'path' as const,
        props: {
          d: getPillPath(size),
        },
      };

    case 'splinter':
      return {
        element: 'polygon' as const,
        props: {
          points: getSplinterPoints(size),
        },
      };

    case 'chunk':
      return {
        element: 'polygon' as const,
        props: {
          points: getChunkPoints(size),
        },
      };

    // Mixed straight/curved shapes
    case 'fang':
      return {
        element: 'path' as const,
        props: {
          d: getFangPath(size),
        },
      };

    case 'claw':
      return {
        element: 'path' as const,
        props: {
          d: getClawPath(size),
        },
      };

    case 'fin':
      return {
        element: 'path' as const,
        props: {
          d: getFinPath(size),
        },
      };

    case 'thorn':
      return {
        element: 'path' as const,
        props: {
          d: getThornPath(size),
        },
      };

    case 'slant':
      return {
        element: 'path' as const,
        props: {
          d: getSlantPath(size),
        },
      };

    case 'notch':
      return {
        element: 'path' as const,
        props: {
          d: getNotchPath(size),
        },
      };

    case 'spike':
      return {
        element: 'path' as const,
        props: {
          d: getSpikePath(size),
        },
      };

    case 'bulge':
      return {
        element: 'path' as const,
        props: {
          d: getBulgePath(size),
        },
      };

    case 'scoop':
      return {
        element: 'path' as const,
        props: {
          d: getScoopPath(size),
        },
      };

    case 'ridge':
      return {
        element: 'path' as const,
        props: {
          d: getRidgePath(size),
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
  // Sophisticated shapes
  rightTriangle: 'Right Triangle',
  isoscelesTriangle: 'Isosceles Triangle',
  diamond: 'Diamond',
  trapezoid: 'Trapezoid',
  parallelogram: 'Parallelogram',
  kite: 'Kite',
  heptagon: 'Heptagon',
  cross: 'Cross',
  arrow: 'Arrow',
  semicircle: 'Semicircle',
  quarterCircle: 'Quarter Circle',
  ellipse: 'Ellipse',
  blade: 'Blade',
  lens: 'Lens',
  arch: 'Arch',
  drop: 'Drop',
  // Irregular abstract shapes
  shard: 'Shard',
  wedge: 'Wedge',
  fan: 'Fan',
  hook: 'Hook',
  wave: 'Wave',
  crescent: 'Crescent',
  pill: 'Pill',
  splinter: 'Splinter',
  chunk: 'Chunk',
  // Mixed straight/curved shapes
  fang: 'Fang',
  claw: 'Claw',
  fin: 'Fin',
  thorn: 'Thorn',
  slant: 'Slant',
  notch: 'Notch',
  spike: 'Spike',
  bulge: 'Bulge',
  scoop: 'Scoop',
  ridge: 'Ridge',
};
