# Shapeshade

A daily art challenge app where you create art using only 2 colors and 2 geometric shapes.

https://2-colors-2-shapes.netlify.app/

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
  - Z to undo, Shift+Z to redo
  - D to duplicate selected shape
- **Customizable keyboard shortcuts**:
  - Click "Customize" in the Controls section to open keyboard settings
  - Remap any shortcut to your preferred key
  - Automatic conflict detection and resolution
  - Settings sync to cloud for logged-in users, localStorage for anonymous users
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
  - Group multiple layers together for organization
  - Collapsible groups with expand/collapse toggle
  - Click group header to select all shapes in group
  - Rename groups by double-clicking the group name
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
- **Welcome modal**: First-time visitors see an intro explaining the app
- **Action toolbar**: Mouse-friendly toolbar at top of canvas
  - Buttons for undo/redo, duplicate, delete, move, and rotate actions
  - Tooltips show action name and keyboard shortcut on hover
  - Collapsible to save screen space
  - Disabled states when actions aren't available (e.g., no selection)
- **Mirroring**: Flip shapes horizontally or vertically
- **Zoom & pan**: Zoom in/out with controls or scroll wheel, pan the canvas
- **Voting system**: Vote on submissions using ELO-based pairwise comparison
  - Vote on pairs of yesterday's submissions to help rank the artwork
  - Cast 5 votes to enter the ranking yourself
  - Skip pairs if you can't decide
  - Timeline: Day X artwork is voted on during Day X+1, results shown Day X+2
- **Daily rankings**: ELO-based ranking system for submissions
  - Rankings computed from community votes
  - View your rank and total participants
- **Winner announcement**: See the top 3 submissions from the most recent completed ranking
  - Shown on first login of the day
  - Displays winners from 2 days ago (since yesterday's voting just completed their ranking)

### Planned
- [ ] Procedurally generated shapes (advanced mode)
- [ ] Mobile support
- [ ] Public gallery of submissions

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **SVG** for rendering (React-managed DOM elements)
- **Supabase** for authentication, database, and edge functions
- **localStorage** for canvas auto-save

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

This project is hosted on Netlify. **Automatic builds are disabled** to conserve credits.

### Manual Deployment via CLI

1. Login to Netlify (first time only):
   ```bash
   netlify login
   ```

2. Build and deploy:
   ```bash
   # Build the project
   npm run build

   # Deploy to production
   netlify deploy --prod --dir=dist
   ```

   Or for a preview deploy (doesn't affect production):
   ```bash
   netlify deploy --dir=dist
   ```

### Why manual deploys?

Netlify charges credits per build. With automatic builds enabled, every push to `main` triggers a build. Manual deploys let you control when builds happen, reducing credit usage.

## Development

### Supabase & Local Development

This project uses Supabase for authentication and storing submissions. Important notes:

- **Local dev uses the production database** - The `.env.local` file points to the same Supabase instance as production. Any submissions you save locally are saved to the real database.
- **Same account, same data** - If you sign in with the same Google account locally and on the production site, you'll see the same submissions in both places.
- **Offline limitations** - The canvas works offline (uses localStorage), but authentication and saving submissions require an internet connection.

If you wanted a separate development database, you would need to create a second Supabase project and use different environment variables.

### Supabase Edge Functions

Edge functions (located in `supabase/functions/`) handle server-side logic like the voting/rating system. They run on **Deno**, not Node.js.

#### Prerequisites for IDE Support

To avoid TypeScript errors in your IDE when editing edge functions:

1. Install the [Deno extension for VSCode](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno)
2. The project includes a `deno.json` in `supabase/functions/` that configures imports

Without the Deno extension, you'll see errors like "Cannot find module" for Deno-specific imports.

#### Supabase CLI Commands

First, install the Supabase CLI if you haven't:
```bash
# macOS
brew install supabase/tap/supabase

# npm (alternative)
npm install -g supabase
```

Login to Supabase (first time only):
```bash
supabase login
```

Link your local project to your Supabase project:
```bash
supabase link --project-ref <your-project-ref>
```

Common commands:
```bash
# Deploy all edge functions to production
supabase functions deploy

# Deploy a specific function
supabase functions deploy process-vote

# Serve functions locally for testing
supabase functions serve

# View function logs
supabase functions logs process-vote

# List all functions
supabase functions list
```

#### Environment Variables

Edge functions use these environment variables (automatically available in Supabase):
- `SUPABASE_URL` - Your project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

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

### Voting Test Page

A visual test page for voting components with hardcoded mock data. Allows testing the voting UI without needing real submissions or database interaction.

**Access via URL parameter:**
```
http://localhost:5173/?test=voting
```

**Test scenarios available:**
- **Voting UI**: Main voting interface with a pair of submissions
- **Interactive Flow**: Simulate full voting flow with confirmation modal
- **Voting Progress**: Vote progress bar states (0-5 votes)
- **Dynamic Threshold**: Vote requirements based on available submissions (2-4 subs)
- **Voting Confirmation**: Confirmation screen after reaching vote requirement
- **No More Pairs**: When all pairs have been voted on
- **Bootstrap (0 subs)**: Day 1 scenario with no submissions - opt-in prompt
- **Bootstrap (1 sub)**: Only 1 submission exists - no pairs possible
- **Winner - Normal**: Standard winner announcement with top 3
- **Winner - Tied**: Winner announcement with 1st place tie
- **Winner - Three-Way Tie**: Winner announcement with three-way tie
- **Calendar with Trophies**: User calendar showing submissions with various trophy placements

## Testing

### Unit Tests

Run unit tests with Vitest:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

**Test coverage:**
- **ELO calculation** (`src/utils/__tests__/elo.test.ts`): Tests for the ELO rating algorithm including expected scores, rating changes, upset wins, and edge cases
- **Voting rules** (`src/utils/__tests__/votingRules.test.ts`): Tests for vote eligibility, progress tracking, and state transitions

### Pure Utility Functions

The voting system uses pure functions that can be unit tested independently:

- `calculateElo(ratingA, ratingB, winner)` - ELO rating calculation
- `calculateExpectedScore(ratingA, ratingB)` - Expected win probability
- `hasEnoughSubmissions(count)` - Check minimum submission requirement
- `hasEnteredRanking(voteCount)` - Check if user entered ranking
- `voteProgressPercentage(voteCount)` - Calculate progress bar percentage
- `determineVotingState(options)` - Determine current voting state

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx        # Main SVG canvas with shape rendering
│   ├── ShapeElement.tsx  # Individual shape SVG component
│   ├── TransformHandles.tsx # Resize/rotate handles for selected shape
│   ├── LayerPanel.tsx    # Sidebar for layer management
│   ├── Toolbar.tsx       # Left sidebar with controls
│   ├── ActionToolbar.tsx # Top toolbar with action buttons
│   ├── Calendar.tsx      # Calendar modal for browsing submissions
│   ├── SubmissionThumbnail.tsx # Thumbnail renderer for submissions
│   ├── SubmissionDetailPage.tsx # Full submission view with export
│   └── ZoomControls.tsx  # Zoom in/out and reset controls
├── hooks/
│   ├── useCanvasState.ts # State management + localStorage persistence
│   ├── useAuth.ts        # Google OAuth authentication
│   ├── useProfile.ts     # User profile management
│   ├── useSubmissions.ts # Submission CRUD operations
│   ├── useWelcomeModal.ts # First-visit welcome modal state
│   ├── useKeyboardSettings.ts # Custom keyboard shortcut settings
│   ├── useVoting.ts      # Pairwise voting system
│   ├── useRanking.ts     # ELO rankings and leaderboard
│   ├── useWinnerAnnouncement.ts # Yesterday's winner modal
│   └── useViewportState.ts # Zoom and pan state
├── constants/
│   └── keyboardActions.ts # Keyboard action definitions and helpers
├── utils/
│   ├── dailyChallenge.ts # Seed-based color/shape generation
│   ├── shapeHelpers.ts   # SVG path generation for shapes
│   ├── elo.ts            # ELO rating calculation
│   ├── votingRules.ts    # Voting eligibility rules
│   └── __tests__/        # Unit tests for utilities
├── test/
│   ├── mockData.ts       # Mock data for visual testing
│   └── VotingTestPage.tsx # Visual test page for voting
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
