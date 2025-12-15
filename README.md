# 2 Colors 2 Shapes

A daily art challenge app where you create art using only 2 colors and 2 geometric shapes.

## Concept

Every day, the app generates a unique set of constraints:
- **2 Colors**: Two visually distinct colors (ensured to be different enough to distinguish)
- **2 Shapes**: Two geometric shapes from: circle, square, triangle, pentagon, hexagon, star

The same date always generates the same colors and shapes (seed-based randomization).

## Features

### Current
- **800x800 SVG Canvas**: Create your art on a square canvas
- **Figma-style manipulation**:
  - Drag shapes to move them
  - Drag corner handles to resize
  - Drag rotation handles to rotate (handles on all 4 sides, hold Shift for 15° snapping)
  - Arrow keys to move selected shape (hold Shift for 10px steps)
  - Period/Comma keys to rotate (hold Shift for 15° steps)
  - w to undo, Shift+w to redo
  - c to duplicate selected shape
- **Layer system**:
  - Reorder shapes (bring to front, send to back, move up/down)
  - Visual layer panel showing all shapes
  - Click layers to select shapes
  - Double-click layer name to rename
- **Background toggle**: Set canvas background to either daily color or white
- **Auto-save**: Canvas state persists in localStorage (resets when the day changes)
- **Reset**: Clear canvas with confirmation dialog

### Planned
- [ ] User authentication (Google OAuth)
- [ ] Save submissions to database
- [ ] Calendar view of past submissions
- [ ] Procedurally generated shapes (advanced mode)
- [ ] Mobile support

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **SVG** for rendering (React-managed DOM elements)
- **localStorage** for persistence (future: database)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx        # Main SVG canvas with shape rendering
│   ├── ShapeElement.tsx  # Individual shape SVG component
│   ├── TransformHandles.tsx # Resize/rotate handles for selected shape
│   ├── LayerPanel.tsx    # Sidebar for layer management
│   └── Toolbar.tsx       # Left sidebar with controls
├── hooks/
│   └── useCanvasState.ts # State management + localStorage persistence
├── utils/
│   ├── dailyChallenge.ts # Seed-based color/shape generation
│   └── shapeHelpers.ts   # SVG path generation for shapes
├── types/
│   └── index.ts          # TypeScript type definitions
├── App.tsx
└── main.tsx
```

## How the Daily Challenge Works

1. The current date (YYYY-MM-DD) is hashed to create a numeric seed
2. A seeded random number generator (mulberry32) ensures deterministic output
3. Colors are generated in HSL space with a minimum perceptual distance check
4. Two shapes are randomly selected from the available set
5. The same date will always produce the same challenge

## License

MIT
