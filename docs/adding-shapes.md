# Adding Shapes

The shape system supports two types of shapes: **parameterized** (code-generated) and **fixed** (Figma-exported). This guide covers both, with emphasis on adding Figma exports since that's the typical workflow.

## Overview

| Type | How paths are defined | Examples |
|------|----------------------|----------|
| Parameterized | Function generates path scaled to `width`/`height` | circle, star, drop, fan |
| Fixed (Figma export) | Constant path string with native viewBox, browser scales via nested `<svg>` | lens, crescent, hook |

## Adding a Figma-exported shape

### 1. Export the SVG from Figma

- Select the shape in Figma
- Export as SVG
- Open the SVG file and extract the `d` attribute from the `<path>` element
- Note the `width` and `height` from the SVG's `viewBox` (or from the `width`/`height` attributes)

Example Figma export:
```xml
<svg width="257" height="370" viewBox="0 0 257 370" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M193.271 0C215.472 0 236.799..." fill="#D9D9D9"/>
</svg>
```

You need: the `d` string and the dimensions (257×370).

### 2. Add constants to `src/utils/shapes/paths.ts`

Add a path constant and a native viewBox constant:

```typescript
// ShapeName — fixed Figma export (native viewBox: WxH)
export const SHAPENAME_PATH = 'M193.271 0C215.472 0 236.799...';
export const SHAPENAME_NATIVE_VIEWBOX = { width: 257, height: 370 };
```

If replacing an existing parameterized shape, delete its old function.

### 3. Export the constants from `src/utils/shapes/index.ts`

Add to the `paths` export block:

```typescript
export {
  // ... existing exports ...
  SHAPENAME_PATH,
  SHAPENAME_NATIVE_VIEWBOX,
} from './paths';
```

If replacing an existing shape, remove its old function export.

### 4. Update `src/utils/shapes/utils.ts`

Three changes:

**a) Import the new constants:**
```typescript
import {
  // ... existing imports ...
  SHAPENAME_PATH,
  SHAPENAME_NATIVE_VIEWBOX,
} from './paths';
```

**b) Set the aspect ratio** (in `SHAPE_ASPECT_RATIOS`):
```typescript
shapeName: SHAPENAME_NATIVE_VIEWBOX.width / SHAPENAME_NATIVE_VIEWBOX.height,
```

This must match the actual Figma export dimensions. Getting this wrong causes whitespace around the shape and broken stroke scaling.

**c) Update the `getShapeSVGData` switch case:**
```typescript
case 'shapeName':
  return {
    element: 'path' as const,
    props: { d: SHAPENAME_PATH },
    viewBox: SHAPENAME_NATIVE_VIEWBOX,
    dimensions: { width, height },
  };
```

The key difference from parameterized shapes: **`viewBox` is the native Figma coordinate space** and **`dimensions` is the intended render size**. The rendering system uses a nested `<svg>` with viewBox scaling when `dimensions` is present, so the fixed path coordinates get scaled to the correct size on the canvas.

### 5. If this is a brand new shape (not replacing an existing one)

You also need to:

- Add the shape type to the `ShapeType` union in `src/types/index.ts`
- Add its display name to `SHAPE_NAMES` in `src/utils/shapes/utils.ts`
- The shape will automatically work on the canvas, in toolbars, in shape indicators, etc.

### Outline shapes (arch, hook)

Some shapes have an inner cutout (like arch and hook). These use an `outlineD` field so that the selection border follows only the outer edge, not the inner hole:

```typescript
case 'arch':
  return {
    element: 'path' as const,
    props: { d: getArchPath(size) },
    viewBox: { width, height },
    outlineD: getArchOutlinePath(size),
  };
```

If your Figma shape has an inner cutout and you want the selection border to follow just the outer edge, provide a separate `outlineD` path.

## Adding a parameterized shape

Parameterized shapes are defined as functions that take `size` (or `width`/`height`) and return path data scaled to those dimensions. No `dimensions` field is needed since `viewBox` equals the rendered size.

### 1. Add path function to `src/utils/shapes/paths.ts` (for curved) or `src/utils/shapes/polygons.ts` (for polygon)

```typescript
// For a path-based shape:
export function getMyShapePath(width: number, height: number): string {
  return `M 0,0 L ${width},0 L ${width},${height} L 0,${height} Z`;
}

// For a polygon-based shape:
export function getMyShapePoints(size: number): string {
  return `0,0 ${size},0 ${size},${size}`;
}
```

### 2. Export from `src/utils/shapes/index.ts`

### 3. Update `src/utils/shapes/utils.ts`

- Import the function
- Set aspect ratio in `SHAPE_ASPECT_RATIOS` (1 for square, >1 for wider, <1 for taller)
- Add switch case in `getShapeSVGData` — no `dimensions` field needed:

```typescript
case 'myShape':
  return {
    element: 'path' as const,  // or 'polygon'
    props: { d: getMyShapePath(width, height) },  // or { points: getMyShapePoints(size) }
    viewBox: { width, height },
  };
```

### 4. Add to types and names (if new shape)

Same as step 5 for Figma exports above.

## How it works under the hood

- `getShapeSVGData(type, size)` computes `width`/`height` from `size` × aspect ratio, then returns `{ element, props, viewBox, dimensions? }`
- **Parameterized shapes**: `viewBox` = rendered size. Path coordinates already match.
- **Fixed shapes**: `viewBox` = native Figma coordinate space. `dimensions` = rendered size. The rendering components (`SVGShape.tsx`, `TransformHandles.tsx`, etc.) wrap the shape in a nested `<svg>` with `viewBox` scaling when `dimensions` is present.
- `ShapeIcon.tsx` uses `vectorEffect: 'non-scaling-stroke'` so toolbar borders render at consistent pixel width regardless of viewBox scaling.

## Testing a shape

To test a specific shape, override the daily challenge in `src/hooks/challenge/useDailyChallenge.ts`. Find the `fetchPromise` and add:

```typescript
return {
  ...base,
  shapes: [
    { type: 'shapeName', name: SHAPE_NAMES['shapeName'], svg: '' },
    base.shapes[1],
  ],
};
```

Remember to remove this override when done.
