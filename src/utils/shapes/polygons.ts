// Polygon point generators for regular polygons, stars, and custom polygon shapes

// Generate polygon points for regular polygons, scaled to fill width
export function getPolygonPoints(
  sides: number,
  size: number,
  offsetAngle: number = 0
): { points: string; width: number; height: number } {
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
  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;

  // Scale to fill width, height follows aspect ratio
  const scaledWidth = size;
  const scaledHeight = (rawHeight / rawWidth) * size;

  const points = rawPoints
    .map((p) => {
      const nx = ((p.x - minX) / rawWidth) * scaledWidth;
      const ny = ((p.y - minY) / rawHeight) * scaledHeight;
      return `${nx},${ny}`;
    })
    .join(' ');

  return { points, width: scaledWidth, height: scaledHeight };
}

// Generate star points, scaled to fill width
export function getStarPoints(size: number, numPoints: number = 5): { points: string; width: number; height: number } {
  const rawPoints: { x: number; y: number }[] = [];
  const outerRadius = 1;
  const innerRadius = outerRadius * 0.4;
  const angleStep = Math.PI / numPoints;

  for (let i = 0; i < numPoints * 2; i++) {
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
  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;

  // Scale to fill width, height follows aspect ratio
  const scaledWidth = size;
  const scaledHeight = (rawHeight / rawWidth) * size;

  const points = rawPoints
    .map((p) => {
      const nx = ((p.x - minX) / rawWidth) * scaledWidth;
      const ny = ((p.y - minY) / rawHeight) * scaledHeight;
      return `${nx},${ny}`;
    })
    .join(' ');

  return { points, width: scaledWidth, height: scaledHeight };
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

// Generate shard - angular asymmetric fragment
export function getShardPoints(size: number): string {
  return `${size * 0.2},0 ${size * 0.9},${size * 0.15} ${size},${size * 0.6} ${size * 0.5},${size} 0,${size * 0.7} ${size * 0.1},${size * 0.3}`;
}

// Generate wedge - thick angled slice
export function getWedgePoints(size: number): string {
  return `${size * 0.5},0 ${size},${size * 0.3} ${size * 0.8},${size} ${size * 0.2},${size} 0,${size * 0.5}`;
}

// Generate splinter - thin angular shard
export function getSplinterPoints(size: number): string {
  return `${size * 0.4},0 ${size * 0.6},0 ${size * 0.8},${size * 0.3} ${size},${size} ${size * 0.7},${size * 0.6} ${size * 0.3},${size * 0.8} 0,${size * 0.4}`;
}

// Generate chunk - irregular blocky shape
export function getChunkPoints(size: number): string {
  return `${size * 0.1},${size * 0.1} ${size * 0.6},0 ${size},${size * 0.2} ${size * 0.9},${size * 0.7} ${size * 0.6},${size} ${size * 0.2},${size * 0.9} 0,${size * 0.5}`;
}
