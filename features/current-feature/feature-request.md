# Feature Request: UI/UX Redesign

## What
Redesign the entire UI/UX of the 2 Colors 2 Shapes canvas editor to match the design exploration built in the `2colors-ui-exploration` repo. The current app's UI is functional but feels rudimentary, perfunctory, and unintuitive. The design exploration represents a ground-up reimagining of the interface with a more polished, expressive, and delightful user experience.

## Why
The current UI has several pain points:
- **Left sidebar is overloaded** — account info, shape adding, color selection, background, save/reset actions, view toggles, controls documentation, and theme toggle are all crammed into one 300px panel
- **Adding shapes is indirect** — user picks a shape type + color from the sidebar, and it appears at canvas center. No "stamp" / click-to-place workflow
- **Floating action toolbar at top is disconnected** from the creative flow — undo/redo/duplicate/delete/move/rotate/mirror buttons are small and away from the canvas
- **No personality or theming** — the app has a single muted teal accent color. No way for users to express preference via themes
- **Navigation is URL-query-param based** — gallery, profiles, etc. are all `?view=` params, no visual navigation affordance
- **The overall layout feels like a form, not a creative tool**

## What the design exploration does differently

### 1. Layout restructuring
- **Top bar** replaces the sidebar header — logo, theme/dark-mode toggles, inspiration word, action buttons (Reset, Submit, Gallery, Login) all live in a compact 56px top bar
- **Left tools panel** is a slim vertical strip of icon buttons (undo, redo, duplicate, delete, layer ordering) — collapsible, not a wide sidebar
- **Right layers panel** is a focused, compact layer list (240px) — collapsible, shows visibility/ordering/grouping
- **Bottom floating toolbar** is the primary creative interface — shape tool selector (Select/Circle/Square), color swatches, background color — all in one horizontal pill

### 2. Shape creation via "stamp mode"
- Click one of today's two assigned shape buttons in bottom toolbar to enter stamp mode (toolbar dynamically shows the daily challenge shapes — could be any of the 45 supported types, not just circle/square)
- Click canvas to place at default size, or drag to size
- Ghost cursor follows mouse as preview
- Hint text appears: "Click to place - Drag to size - Esc to select"
- Much more direct and intuitive than sidebar-based adding

### 3. Theme system (4 themes x 2 modes)
- **Theme A — Pop Art**: Deep purple, hot pink, cyan. Fredoka/Lilita One fonts. Rounded corners, chunky shadows, dot pattern overlay
- **Theme B — Minimal Swiss**: Black, red accent. DM Sans font. Minimal radius, subtle shadows, clean
- **Theme C — Soft Cloud**: Warm sage, coral, cream. Nunito font. Very rounded, diffuse shadows, dreamy
- **Theme D — Brutalist**: Neon yellow, stark black. Space Mono font. Zero radius, thick borders, heavy shadows
- Each theme has light and dark mode variants
- Theme switcher is always visible in top bar (A/B/C/D buttons + dark mode toggle)
- Themes control: colors, borders, corner radius, spacing, font, shadows, selection handles, scrollbar styling, background patterns

### 4. Selection/transform handle theming
- Selection borders, handle sizes, handle fills, rotation handle colors, dash patterns — all vary per theme
- E.g., Theme B uses dashed selection borders, Theme D uses thick solid borders with square handles

### 5. Bottom toolbar as creative hub
- Horizontal pill at bottom center with backdrop blur
- Groups: [Select | Shape1 | Shape2 (today's assigned shapes)] | [Color swatches] | [Background swatches]
- Dividers between sections
- Spring animation entrance from bottom
- This is where the user spends most of their attention

### 6. Collapsible side panels
- Tools (left): slim icon strip, not a wide sidebar with text labels
- Layers (right): focused list with grouping support
- Both panels float over the canvas (absolute positioned, not pushing content)
- Toggle buttons visible when panels are closed

### 7. Info/shortcuts popover
- Small "?" button (30x30) in bottom-left corner
- Opens a popover listing all keyboard shortcuts in a two-column layout (key | action)
- Includes: V/Esc (Select mode), Shift+Click (Multi-select), Z (Undo), Shift+Z (Redo), Backspace/Del (Delete), Arrow keys (Move shape), Alt+Drag (Pan canvas), Scroll wheel (Zoom)
- "Customize shortcuts" button at bottom with gear icon
- Clean, unobtrusive — closes when clicking elsewhere

### 8. Gallery redesign
- Top bar persists with theme toggles + centered "Gallery" title + "Back to canvas" button top-right
- **Tabs**: My Submissions, Winners, Wall, Friends — displayed as a pill-style tab bar
- **My Submissions**: Calendar view with artwork thumbnails in day cells. Day numbers as badges. Empty days show date + small "x". Today's cell highlighted with accent border + "Create!" CTA. Footer: total submissions count + medal tallies
- **Winners**: Calendar view, every day shows a procedurally-generated winning artwork with crown emoji. Footer: "Winners this month: N" + "N unique winners". Days in progress show "Voting..." / "Creating..."
- **Wall**: Has Grid/Calendar toggle. Calendar view shows submission counts per day as colored number badges. Grid view shows date navigation (< Thu, Feb 26, 2026 Today >) with Newest/Oldest/Random sort dropdown, artwork cards in a responsive grid with author name + date + trophy badge for winners
- **Friends**: Grid layout of friend submissions, each card shows artwork + author name + date + trophy badge. Has Grid/Calendar toggle + Newest/Oldest/Random sort. Scrollable feed-style layout
- Month navigation with left/right arrows

### 9. Zoom controls
- Moved to bottom-right corner (out of the way)
- Compact pill: +, percentage, -, 1:1 reset
- Extended range: 0.25x to 4x (current app: 0.5x to 2x)

### 10. User menu
- When logged out: "Log in" pill button in top-right. Clicking simulates login
- When logged in: Shows avatar circle (initial letter) + name + chevron in top-right
- Clicking opens a dropdown with spring animation (scale 0.92->1, y offset)
- Dropdown header: large avatar circle + name + "N following - N followers" stats
- Following/Followers tabs with counts, active tab has accent underline
- Friends list: each row shows avatar, name. Hover highlights row
- "Add by nickname..." text input + accent "Add" button
- "Log out" button at bottom (full-width, surface color)

### 12. Submission detail page
- Top bar: logo + theme toggles | centered "Submission" title | "< Gallery" back button
- Date as large heading (e.g. "Tuesday, February 24, 2026")
- Metadata line: @username - "Submission" - "Following" badge
- Two-column layout: large artwork preview (left) + info cards stacked (right)
- Info cards: Inspiration word + Colors swatches + Shapes used (icon + count), Ranking (#N / total + "Winner of the day!" text), Submission Stats (shapes used count, submitted date), Export & Share (Copy Link button with link icon)
- "Like" button below artwork (heart icon + "Like" text, pill style)

### 13. Animation and polish
- Spring physics for shape placement (scale 0->1, rotate -180->target)
- AnimatePresence for panel open/close
- Hover feedback on all interactive elements
- Smooth 0.35s transition on theme change
- Ghost cursor in stamp mode

## Scope note
The design exploration is a UI mockup — it has no backend, no auth, no persistence. The task is to port its **visual design, layout, interaction patterns, and theming system** into the working application, which already has all the backend functionality (Supabase, auth, canvas state persistence, voting, etc.).

## Scope clarifications
- **This is a redesign, not a feature reduction.** All existing business logic stays: all 45 shape types, daily color/shape generation, voting, etc. The design exploration hardcodes circle/square for simplicity — the real app must dynamically show whatever today's assigned shapes are.
- **Preserve existing mobile/touch support.** The current app has pinch-to-zoom, multi-touch rotate, long-press context menu, etc. The new UI must not break any of this.
- **No backwards compatibility needed.** There are no real users yet, so keyboard shortcut remapping, routing changes, etc. can happen freely without migration paths.
- **No online presence.** The design exploration shows green "online" dots on friends — this is removed. No real-time presence infrastructure exists or is planned.
