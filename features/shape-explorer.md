# Feature: Shape Explorer

## Description

A developer tool that displays all possible shapes the program can generate. This "shape explorer" shows each shape type along with its name and sample renderings. Developers can use this as a reference to understand what shapes are available for use in the daily challenges or other features.

This is not a user-facing feature—it's a tool for development and testing.

## Implementation Summary

### How to Access

The Shape Explorer can be accessed in two ways:

1. **URL Parameter**: Add `?explorer` to the URL
   - Example: `http://localhost:5173/?explorer`
   - Also accepts `?explorer=true`

2. **Environment Variable**: Set `VITE_SHAPE_EXPLORER=true` when starting the app
   - Example: `VITE_SHAPE_EXPLORER=true npm run dev`

### Files Created/Modified

- **Created**: `src/components/ShapeExplorer.tsx` - The Shape Explorer component
- **Modified**: `src/App.tsx` - Added conditional rendering to show ShapeExplorer when enabled

### Available Shapes

The Shape Explorer displays all 6 shape types:

| Shape Type | Display Name |
|------------|--------------|
| `circle`   | Circle       |
| `square`   | Square       |
| `triangle` | Triangle     |
| `pentagon` | Pentagon     |
| `hexagon`  | Hexagon      |
| `star`     | Star         |

Each shape is rendered in two sample colors (blue and red) for visibility, along with its type identifier.

### Features

- Responsive grid layout (2 columns on mobile, 3 columns on larger screens)
- Respects the app's dark/light theme settings
- Shows the shape type identifier for easy reference in code
- Link to return to the main app

### Technical Notes

- Reuses existing shape rendering infrastructure from `shapeHelpers.ts`
- Uses the same CSS variables for theming consistency
- No additional dependencies required
