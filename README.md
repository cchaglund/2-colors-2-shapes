# Shapeshade

A daily art challenge app where you create art using only 2 colors and 2 geometric shapes.

## Concept

Every day, the app generates a unique set of constraints:
- **2 Colors**: Two visually distinct colors (ensured to be different enough to distinguish)
- **2 Shapes**: Two geometric shapes from 41 available shapes including basic shapes (circle, square, triangle, etc.), sophisticated polygons (diamond, trapezoid, parallelogram, etc.), and irregular abstract shapes with mixed straight/curved edges

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
- **Multi-select**:
  - Shift+click on shapes or layers to select multiple
  - Combined bounding box encompasses all selected shapes (rotation-aware)
  - Move, resize, or rotate multiple shapes as a group
  - Shift+click selected shape to remove from selection
- **Layer system**:
  - Reorder shapes (bring to front, send to back, move up/down)
  - Visual layer panel showing all shapes
  - Click layers to select shapes
  - Double-click layer name to rename
- **Background toggle**: Set canvas background to either daily color or white
- **Auto-save**: Canvas state persists in localStorage (resets when the day changes)
- **Reset**: Clear canvas with confirmation dialog
- **User authentication**: Sign in with Google OAuth
- **Save submissions**: Save your creations to the cloud
- **Calendar view**: Browse your past submissions
  - Monthly grid showing thumbnails of your work
  - Navigate between months/years
  - Click any day to view full submission in new tab
  - Download as PNG or SVG
  - Copy shareable link

### Planned
- [ ] Procedurally generated shapes (advanced mode)
- [ ] Mobile support
- [ ] Public gallery of submissions

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

## Developer Tools

### Shape Explorer

A developer tool that displays all 41 available shape types with sample renderings. Useful as a reference when working with the daily challenges.

**Available shapes:**
- Basic: Circle, Square, Triangle, Pentagon, Hexagon, Star
- Triangular: Right Triangle, Isosceles Triangle
- Quadrilaterals: Diamond, Trapezoid, Parallelogram, Kite, Heptagon
- Curved: Semicircle, Quarter Circle, Ellipse, Blade, Lens, Drop
- Special: Cross, Arrow, Arch
- Abstract: Shard, Wedge, Fan, Hook, Wave, Crescent, Pill, Splinter, Chunk
- Mixed (straight + curved): Fang, Claw, Fin, Thorn, Slant, Notch, Spike, Bulge, Scoop, Ridge

**Access via URL parameter:**
```
http://localhost:5173/?explorer
```

**Or via environment variable:**
```bash
VITE_SHAPE_EXPLORER=true npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx        # Main SVG canvas with shape rendering
│   ├── ShapeElement.tsx  # Individual shape SVG component
│   ├── TransformHandles.tsx # Resize/rotate handles for selected shape
│   ├── LayerPanel.tsx    # Sidebar for layer management
│   ├── Toolbar.tsx       # Left sidebar with controls
│   ├── Calendar.tsx      # Calendar modal for browsing submissions
│   ├── SubmissionThumbnail.tsx # Thumbnail renderer for submissions
│   └── SubmissionDetailPage.tsx # Full submission view with export
├── hooks/
│   ├── useCanvasState.ts # State management + localStorage persistence
│   ├── useAuth.ts        # Google OAuth authentication
│   ├── useProfile.ts     # User profile management
│   └── useSubmissions.ts # Submission CRUD operations
├── utils/
│   ├── dailyChallenge.ts # Seed-based color/shape generation
│   └── shapeHelpers.ts   # SVG path generation for shapes
├── types/
│   └── index.ts          # TypeScript type definitions
├── lib/
│   └── supabase.ts       # Supabase client configuration
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
