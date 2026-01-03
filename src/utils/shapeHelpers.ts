import type { ShapeType } from '../types';

// Generate polygon points for regular polygons, normalized to fill bounding box
export function getPolygonPoints(
  sides: number,
  size: number,
  offsetAngle: number = 0
): string {
  const rawPoints: { x: number; y: number }[] = [];
  const angleStep = (2 * Math.PI) / sides;
  const radius = 1; // Use unit circle first

  for (let i = 0; i < sides; i++) {
    const angle = angleStep * i + offsetAngle - Math.PI / 2; // Start from top
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    rawPoints.push({ x, y });
  }

  // Find bounding box
  const minX = Math.min(...rawPoints.map((p) => p.x));
  const maxX = Math.max(...rawPoints.map((p) => p.x));
  const minY = Math.min(...rawPoints.map((p) => p.y));
  const maxY = Math.max(...rawPoints.map((p) => p.y));
  const width = maxX - minX;
  const height = maxY - minY;

  // Normalize to fill 0-size
  return rawPoints
    .map((p) => {
      const nx = ((p.x - minX) / width) * size;
      const ny = ((p.y - minY) / height) * size;
      return `${nx},${ny}`;
    })
    .join(' ');
}

// Generate star points, normalized to fill bounding box
export function getStarPoints(size: number, points: number = 5): string {
  const rawPoints: { x: number; y: number }[] = [];
  const outerRadius = 1;
  const innerRadius = outerRadius * 0.4;
  const angleStep = Math.PI / points;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = angleStep * i - Math.PI / 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    rawPoints.push({ x, y });
  }

  // Find bounding box
  const minX = Math.min(...rawPoints.map((p) => p.x));
  const maxX = Math.max(...rawPoints.map((p) => p.x));
  const minY = Math.min(...rawPoints.map((p) => p.y));
  const maxY = Math.max(...rawPoints.map((p) => p.y));
  const width = maxX - minX;
  const height = maxY - minY;

  // Normalize to fill 0-size
  return rawPoints
    .map((p) => {
      const nx = ((p.x - minX) / width) * size;
      const ny = ((p.y - minY) / height) * size;
      return `${nx},${ny}`;
    })
    .join(' ');
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

// Generate kite points, normalized to fill bounding box
export function getKitePoints(size: number): string {
  // Kite shape: top point, right point, bottom point, left point
  // Normalized to fill 0-size in both dimensions
  const topHeight = 0.3; // where the side points are vertically
  return `${size * 0.5},0 ${size},${size * topHeight} ${size * 0.5},${size} 0,${size * topHeight}`;
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

// Generate semicircle path (fills full width and height)
export function getSemicirclePath(width: number, height: number): string {
  return `M 0,${height} A ${width / 2},${height} 0 0 1 ${width},${height} L 0,${height} Z`;
}

// Generate quarter circle path
export function getQuarterCirclePath(size: number): string {
  return `M 0,0 L ${size},0 A ${size},${size} 0 0 1 0,${size} L 0,0 Z`;
}

// Generate blade/leaf path (curved asymmetric shape)
export function getBladePath(width: number, height: number): string {
  // Blade/leaf shape - elliptical with pointed ends, filling bounding box
  // Control points at edges make the curves bulge to touch the left/right edges
  return `M ${width / 2},0 Q ${width},${height * 0.25} ${width},${height / 2} Q ${width},${height * 0.75} ${width / 2},${height} Q 0,${height * 0.75} 0,${height / 2} Q 0,${height * 0.25} ${width / 2},0 Z`;
}

// Generate lens (vesica piscis) path
export function getLensPath(width: number, height: number): string {
  // Lens shape - curves go through top/bottom center points
  // Use two arcs per side to ensure the shape touches y=0 and y=height at center
  return `M 0,${height / 2} Q ${width * 0.25},0 ${width / 2},0 Q ${width * 0.75},0 ${width},${height / 2} Q ${width * 0.75},${height} ${width / 2},${height} Q ${width * 0.25},${height} 0,${height / 2} Z`;
}

// Generate arch path
export function getArchPath(size: number): string {
  // Arch normalized to fill bounding box (y range 0-1 instead of 0.4-1)
  const archWidth = size * 0.3;
  const innerWidth = size - archWidth * 2;
  const innerRadius = innerWidth / 2;
  const outerRadius = size / 2;
  // Scale y coordinates: newY = (oldY - 0.4) / 0.6
  return `M 0,${size} L 0,0 A ${outerRadius},${outerRadius * 0.6} 0 0 1 ${size},0 L ${size},${size} L ${size - archWidth},${size} L ${size - archWidth},${size * 0.25} A ${innerRadius},${innerRadius * 0.6} 0 0 0 ${archWidth},${size * 0.25} L ${archWidth},${size} Z`;
}

// Generate teardrop/drop path (smooth curve using cubic bezier)
export function getDropPath(width: number, height: number): string {
  // Drop/leaf shape - pointed ends with curves touching left/right edges
  return `M ${width / 2},0 Q ${width},${height * 0.25} ${width},${height / 2} Q ${width},${height * 0.75} ${width / 2},${height} Q 0,${height * 0.75} 0,${height / 2} Q 0,${height * 0.25} ${width / 2},0 Z`;
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
  // Original went from x: 0.1 to 1.0, y: 0 to 1.0
  // Normalize to fill 0-size: scale x by 1/0.9, offset by -0.1/0.9
  return `M 0,${size} Q 0,${size * 0.444} ${size * 0.444},${size * 0.111} L ${size},0 Q ${size * 0.556},${size * 0.444} ${size * 0.889},${size} Z`;
}

// Generate hook - curved hook shape
export function getHookPath(size: number): string {
  // Original x range: 0.3 to 1.0 (width 0.7), normalize to 0-1
  // Transform: newX = (oldX - 0.3) / 0.7
  return `M 0,0 L ${size * 0.286},0 Q ${size},0 ${size},${size * 0.4} Q ${size},${size * 0.7} ${size * 0.429},${size * 0.7} L ${size * 0.429},${size} L 0,${size} L 0,${size * 0.5} Q 0,${size * 0.2} ${size * 0.429},${size * 0.2} Q ${size * 0.643},${size * 0.2} ${size * 0.643},${size * 0.4} Q ${size * 0.643},${size * 0.5} ${size * 0.429},${size * 0.5} L 0,${size * 0.5} Z`;
}

// Generate wave - flowing wave shape
export function getWavePath(width: number, height: number): string {
  // Wave shape - top edge passes through y=0 at 25%, bottom edge passes through y=height at 75%
  // Split curves to go through the actual edge points
  return `M 0,${height * 0.4} Q ${width * 0.125},0 ${width * 0.25},0 Q ${width * 0.375},0 ${width * 0.5},${height * 0.4} Q ${width * 0.625},${height * 0.8} ${width * 0.75},${height * 0.4} Q ${width * 0.875},0 ${width},${height * 0.4} L ${width},${height * 0.6} Q ${width * 0.875},${height} ${width * 0.75},${height} Q ${width * 0.625},${height} ${width * 0.5},${height * 0.6} Q ${width * 0.375},${height * 0.2} ${width * 0.25},${height * 0.6} Q ${width * 0.125},${height} 0,${height * 0.6} Z`;
}

// Generate crescent - moon crescent shape
export function getCrescentPath(width: number, height: number): string {
  // Crescent moon shape filling bounding box
  // Outer curve passes through x=0 at middle, inner curve creates the crescent hollow
  // Split into segments so outer curve actually touches the left edge
  return `M ${width},0 Q ${width * 0.3},0 0,${height * 0.5} Q ${width * 0.3},${height} ${width},${height} Q ${width * 0.5},${height * 0.5} ${width},0 Z`;
}

// Generate pill - rounded rectangle (horizontal, fills bounding box)
export function getPillPath(width: number, height: number): string {
  // Horizontal pill shape with rounded ends, filling the full dimensions
  const r = height / 2;
  return `M ${r},0 L ${width - r},0 A ${r},${r} 0 0 1 ${width - r},${height} L ${r},${height} A ${r},${r} 0 0 1 ${r},0 Z`;
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
export function getFangPath(width: number, height: number): string {
  // Fang shape filling full bounding box
  return `M 0,0 L ${width},0 L ${width * 0.5},${height} Q 0,${height * 0.5} 0,0 Z`;
}

// Generate claw - curved talon/hook shape
export function getClawPath(width: number, height: number): string {
  // Claw shape: curved talon pointing up-right, thick base at bottom-left
  // Outer edge curves from bottom-left up to pointed tip at top-right
  // Inner edge creates the hook/claw thickness
  return `M 0,${height} L 0,${height * 0.7} Q 0,${height * 0.3} ${width * 0.3},${height * 0.15} Q ${width * 0.6},0 ${width},0 L ${width * 0.7},${height * 0.2} Q ${width * 0.4},${height * 0.25} ${width * 0.25},${height * 0.5} Q ${width * 0.15},${height * 0.7} ${width * 0.4},${height} Z`;
}

// Generate fin - angular with one curved edge
export function getFinPath(size: number): string {
  // Fin shape normalized to fill bounding box
  return `M 0,${size} L ${size * 0.35},${size * 0.7} L ${size * 0.25},${size * 0.2} L ${size},0 Q ${size},${size * 0.5} ${size * 0.85},${size} Z`;
}

// Generate thorn - sharp point with curved sides
export function getThornPath(size: number): string {
  // Original x range: 0.1 to 0.9 (width 0.8), normalize to 0-1
  // Transform: newX = (oldX - 0.1) / 0.8
  return `M ${size * 0.5},0 Q ${size * 0.875},${size * 0.3} ${size * 0.75},${size * 0.6} L ${size},${size} L 0,${size} L ${size * 0.25},${size * 0.6} Q ${size * 0.125},${size * 0.3} ${size * 0.5},0 Z`;
}

// Generate slant - parallelogram with one curved side
export function getSlantPath(size: number): string {
  return `M ${size * 0.3},0 L ${size},0 L ${size * 0.7},${size} L 0,${size} Q ${size * 0.1},${size * 0.5} ${size * 0.3},0 Z`;
}

// Generate notch - angular shape with curved indent
export function getNotchPath(size: number): string {
  // Original y range: 0 to 0.6, normalize to fill full height
  // Transform: newY = oldY / 0.6
  return `M 0,0 L ${size},0 L ${size},${size} Q ${size * 0.5},${size * 0.667} 0,${size} L 0,0 Z`;
}

// Generate spike - tall narrow with curved base
export function getSpikePath(width: number, height: number): string {
  // Spike/teardrop shape - pointed top, rounded bottom filling bounding box
  return `M ${width / 2},0 L ${width},${height * 0.55} Q ${width},${height} ${width / 2},${height} Q 0,${height} 0,${height * 0.55} L ${width / 2},0 Z`;
}

// Generate bulge - angular corners with curved middle
export function getBulgePath(size: number): string {
  return `M ${size * 0.2},0 L ${size * 0.8},0 L ${size},${size * 0.3} Q ${size * 0.9},${size * 0.7} ${size * 0.7},${size} L ${size * 0.3},${size} Q ${size * 0.1},${size * 0.7} 0,${size * 0.3} L ${size * 0.2},0 Z`;
}

// Generate scoop - angular top with curved bottom
export function getScoopPath(width: number, height: number): string {
  // Scoop shape - flat angular top, curved bottom passing through y=height at center
  // Split the bottom curve so it actually touches y=height
  return `M 0,${height * 0.1} L ${width * 0.3},0 L ${width * 0.7},0 L ${width},${height * 0.1} L ${width},${height * 0.3} Q ${width * 0.75},${height} ${width / 2},${height} Q ${width * 0.25},${height} 0,${height * 0.3} L 0,${height * 0.1} Z`;
}

// Generate ridge - zigzag top with curved bottom
export function getRidgePath(width: number, height: number): string {
  // Ridge shape filling bounding box
  return `M 0,${height * 0.333} L ${width * 0.25},0 L ${width * 0.5},${height * 0.222} L ${width * 0.75},0 L ${width},${height * 0.333} Q ${width * 0.8},${height} ${width * 0.5},${height} Q ${width * 0.2},${height} 0,${height * 0.333} Z`;
}

// Shape aspect ratios (width:height) - 1 means square
// Values > 1 mean wider than tall, < 1 mean taller than wide
export const SHAPE_ASPECT_RATIOS: Record<ShapeType, number> = {
  // Basic shapes - square
  circle: 1,
  square: 1,
  triangle: 1,
  pentagon: 1,
  hexagon: 1,
  star: 1,
  // Sophisticated shapes
  rightTriangle: 1,
  isoscelesTriangle: 1,
  diamond: 1,
  trapezoid: 1,
  parallelogram: 1,
  kite: 1,
  heptagon: 1,
  cross: 1,
  arrow: 1,
  semicircle: 2, // wider than tall
  quarterCircle: 1,
  ellipse: 1.67, // wider than tall
  blade: 0.5, // taller than wide
  lens: 1.8, // wider than tall (thicker)
  arch: 1,
  drop: 0.7, // taller than wide
  // Irregular abstract shapes
  shard: 1,
  wedge: 1,
  fan: 1,
  hook: 1,
  wave: 2, // wider than tall
  crescent: 0.8, // taller than wide (thicker)
  pill: 2.5, // wider than tall
  splinter: 1,
  chunk: 1,
  // Mixed straight/curved shapes
  fang: 0.8, // slightly taller
  claw: 0.8,
  fin: 1,
  thorn: 1,
  slant: 1,
  notch: 1,
  spike: 0.6, // taller than wide
  bulge: 1,
  scoop: 1.2, // slightly wider
  ridge: 1.3, // slightly wider
};

// Get SVG path/element data for each shape type
// Returns element type, props, and viewBox dimensions
export function getShapeSVGData(type: ShapeType, size: number) {
  const aspectRatio = SHAPE_ASPECT_RATIOS[type] || 1;
  // Size represents the larger dimension
  const width = aspectRatio >= 1 ? size : size * aspectRatio;
  const height = aspectRatio >= 1 ? size / aspectRatio : size;

  switch (type) {
    case 'circle':
      return {
        element: 'ellipse' as const,
        props: {
          cx: width / 2,
          cy: height / 2,
          rx: width / 2,
          ry: height / 2,
        },
        viewBox: { width, height },
      };

    case 'square':
      return {
        element: 'rect' as const,
        props: { x: 0, y: 0, width, height },
        viewBox: { width, height },
      };

    case 'triangle':
      return {
        element: 'polygon' as const,
        props: { points: getPolygonPoints(3, size) },
        viewBox: { width, height },
      };

    case 'pentagon':
      return {
        element: 'polygon' as const,
        props: { points: getPolygonPoints(5, size) },
        viewBox: { width, height },
      };

    case 'hexagon':
      return {
        element: 'polygon' as const,
        props: { points: getPolygonPoints(6, size) },
        viewBox: { width, height },
      };

    case 'star':
      return {
        element: 'polygon' as const,
        props: { points: getStarPoints(size) },
        viewBox: { width, height },
      };

    case 'rightTriangle':
      return {
        element: 'polygon' as const,
        props: { points: getRightTrianglePoints(size) },
        viewBox: { width, height },
      };

    case 'isoscelesTriangle':
      return {
        element: 'polygon' as const,
        props: { points: getIsoscelesTrianglePoints(size) },
        viewBox: { width, height },
      };

    case 'diamond':
      return {
        element: 'polygon' as const,
        props: { points: getDiamondPoints(size) },
        viewBox: { width, height },
      };

    case 'trapezoid':
      return {
        element: 'polygon' as const,
        props: { points: getTrapezoidPoints(size) },
        viewBox: { width, height },
      };

    case 'parallelogram':
      return {
        element: 'polygon' as const,
        props: { points: getParallelogramPoints(size) },
        viewBox: { width, height },
      };

    case 'kite':
      return {
        element: 'polygon' as const,
        props: { points: getKitePoints(size) },
        viewBox: { width, height },
      };

    case 'heptagon':
      return {
        element: 'polygon' as const,
        props: { points: getPolygonPoints(7, size) },
        viewBox: { width, height },
      };

    case 'cross':
      return {
        element: 'polygon' as const,
        props: { points: getCrossPoints(size) },
        viewBox: { width, height },
      };

    case 'arrow':
      return {
        element: 'polygon' as const,
        props: { points: getArrowPoints(size) },
        viewBox: { width, height },
      };

    case 'semicircle':
      return {
        element: 'path' as const,
        props: { d: getSemicirclePath(width, height) },
        viewBox: { width, height },
      };

    case 'quarterCircle':
      return {
        element: 'path' as const,
        props: { d: getQuarterCirclePath(size) },
        viewBox: { width, height },
      };

    case 'ellipse':
      return {
        element: 'ellipse' as const,
        props: { cx: width / 2, cy: height / 2, rx: width / 2, ry: height / 2 },
        viewBox: { width, height },
      };

    case 'blade':
      return {
        element: 'path' as const,
        props: { d: getBladePath(width, height) },
        viewBox: { width, height },
      };

    case 'lens':
      return {
        element: 'path' as const,
        props: { d: getLensPath(width, height) },
        viewBox: { width, height },
      };

    case 'arch':
      return {
        element: 'path' as const,
        props: { d: getArchPath(size) },
        viewBox: { width, height },
      };

    case 'drop':
      return {
        element: 'path' as const,
        props: { d: getDropPath(width, height) },
        viewBox: { width, height },
      };

    case 'shard':
      return {
        element: 'polygon' as const,
        props: { points: getShardPoints(size) },
        viewBox: { width, height },
      };

    case 'wedge':
      return {
        element: 'polygon' as const,
        props: { points: getWedgePoints(size) },
        viewBox: { width, height },
      };

    case 'fan':
      return {
        element: 'path' as const,
        props: { d: getFanPath(size) },
        viewBox: { width, height },
      };

    case 'hook':
      return {
        element: 'path' as const,
        props: { d: getHookPath(size) },
        viewBox: { width, height },
      };

    case 'wave':
      return {
        element: 'path' as const,
        props: { d: getWavePath(width, height) },
        viewBox: { width, height },
      };

    case 'crescent':
      return {
        element: 'path' as const,
        props: { d: getCrescentPath(width, height) },
        viewBox: { width, height },
      };

    case 'pill':
      return {
        element: 'path' as const,
        props: { d: getPillPath(width, height) },
        viewBox: { width, height },
      };

    case 'splinter':
      return {
        element: 'polygon' as const,
        props: { points: getSplinterPoints(size) },
        viewBox: { width, height },
      };

    case 'chunk':
      return {
        element: 'polygon' as const,
        props: { points: getChunkPoints(size) },
        viewBox: { width, height },
      };

    case 'fang':
      return {
        element: 'path' as const,
        props: { d: getFangPath(width, height) },
        viewBox: { width, height },
      };

    case 'claw':
      return {
        element: 'path' as const,
        props: { d: getClawPath(width, height) },
        viewBox: { width, height },
      };

    case 'fin':
      return {
        element: 'path' as const,
        props: { d: getFinPath(size) },
        viewBox: { width, height },
      };

    case 'thorn':
      return {
        element: 'path' as const,
        props: { d: getThornPath(size) },
        viewBox: { width, height },
      };

    case 'slant':
      return {
        element: 'path' as const,
        props: { d: getSlantPath(size) },
        viewBox: { width, height },
      };

    case 'notch':
      return {
        element: 'path' as const,
        props: { d: getNotchPath(size) },
        viewBox: { width, height },
      };

    case 'spike':
      return {
        element: 'path' as const,
        props: { d: getSpikePath(width, height) },
        viewBox: { width, height },
      };

    case 'bulge':
      return {
        element: 'path' as const,
        props: { d: getBulgePath(size) },
        viewBox: { width, height },
      };

    case 'scoop':
      return {
        element: 'path' as const,
        props: { d: getScoopPath(width, height) },
        viewBox: { width, height },
      };

    case 'ridge':
      return {
        element: 'path' as const,
        props: { d: getRidgePath(width, height) },
        viewBox: { width, height },
      };

    default:
      return {
        element: 'rect' as const,
        props: { x: 0, y: 0, width: size, height: size },
        viewBox: { width: size, height: size },
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
