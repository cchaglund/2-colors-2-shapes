# PRD Critique: UI/UX Redesign

## Overall

This isn't a PRD. It's a wish list. 27 items spanning every component, every page, every interaction — with no phasing, no priority tiers, no dependency ordering. If someone handed me this and said "build it," I'd hand it back and say "pick 5."

---

## Scope & Planning

**No incremental delivery path.** The PRD wants to simultaneously rip out the sidebar, the action toolbar, the gallery, the submission page, the theming system, the shape creation model, the selection handles, the keyboard shortcuts, and the zoom controls. All at once. There's no "phase 1 ships value, phase 2 adds polish." It's "rewrite the entire frontend or nothing." That's how rewrites die.

**No priority ordering.** Are all 27 items equally critical? The theme system (4 themes x 2 modes = 8 visual configurations) and stamp mode are massive features on their own. The gallery redesign is a separate project's worth of work. But they're all sitting next to "move zoom controls to bottom-right" as if they're equivalent effort.

**Item #11 is missing from the feature request numbering.** Skips from 10 to 12. Sloppy.

---

## Theme System (THEME-1 through THEME-7)

**"Zero JS conditionals for styling" is dogmatic nonsense in a Tailwind app.** The current codebase uses Tailwind with arbitrary CSS variable values (`bg-(--color-bg-primary)`). Tailwind is fundamentally class-based. Enforcing "zero JS conditionals" while using a utility-first CSS framework is fighting two systems at once. What happens when a component needs conditional rendering based on theme (e.g., different icon sets, different layout spacing)? You can't express everything in CSS variables.

**Five font families is a performance disaster.** Fredoka, Lilita One, DM Sans, Nunito, Space Mono. Even with modern font loading strategies, that's 5 font families (likely 10+ font files for weights/styles) the user potentially needs. Currently the app loads one font (DM Sans, self-hosted for GDPR). The PRD doesn't mention font loading strategy, FOUT/FOIT handling, or the bandwidth cost for users on slow connections. Are we loading all 5 upfront? On demand? What does the theme switch look like while fonts are loading?

**"0.35s transition on themed properties" is a performance landmine.** Transitioning ALL CSS properties — including backgrounds, borders, shadows, fonts, pattern images — is expensive. Pattern images can't smoothly transition. Font changes cause layout reflow. This will either look janky or kill frame rate on mid-range devices.

**Background pattern overlays are visual noise.** Dot patterns, circular patterns — these look cute in a mockup and annoying after 10 minutes of actual use in a creative tool where you're trying to focus on your artwork. The PRD treats these as mandatory, not optional.

---

## Stamp Mode (STAMP-1, STAMP-2)

**What happened to 43 of the 45 shape types?** The current app supports 45 shapes: circle, square, triangle, star, diamond, blade, wave, crescent, fang, spike, and many more. The bottom toolbar shows Circle and Square. The feature request title is "2 Colors 2 Shapes" so maybe only 2 shape types per day — but the PRD never addresses how the daily shape assignment maps to the toolbar. What if today's shapes are "blade" and "crescent"? Does the toolbar show those? The PRD says "Circle button, Square button" as if they're hardcoded.

**Ghost cursor rendering over SVG canvas.** The ghost preview needs to follow the mouse over an SVG canvas that has its own coordinate system, zoom, and pan transforms. The PRD handwaves this as "follows the mouse position over the canvas" without acknowledging the coordinate transformation complexity. The ghost needs to respect the viewport transform to appear at the correct canvas position, not screen position.

**"Click to place at default size ~60px" — 60px in what coordinate space?** Canvas coordinates? Screen pixels? At 4x zoom, a 60px canvas shape is 240 screen pixels. At 0.25x zoom, it's 15 screen pixels. The PRD doesn't specify.

**Empty canvas prompt reappears on saved empty canvases.** STAMP-2 says "Text reappears if all shapes are deleted." What about loading a saved submission that happens to have zero shapes? What about the initial load before canvas state is hydrated from Supabase? The prompt will flash before data loads.

---

## Selection Handles (THEME-7)

**This is two separate PRD items crammed into one.** Structural changes (4→8 resize handles, 4→1 rotation handle) and theming changes are completely independent concerns. Bundling them guarantees a larger, harder-to-review diff.

**Removing 3 rotation handles breaks spatial affordance.** Currently users can grab any edge to rotate. Reducing to 1 handle at top-center means: (a) if the shape is near the top edge, the rotation handle may be off-screen or under the top bar, and (b) users who've built muscle memory for grabbing the nearest rotation handle lose that. The PRD doesn't acknowledge this UX regression.

**"Handles scale to 1.3x on hover" + touch support.** Touch devices don't have hover. The current app has full touch gesture support. The PRD never mentions touch devices or how any of these hover-dependent interactions degrade on mobile.

---

## Mobile / Responsive / Accessibility

**Zero mention of responsive behavior.** The current app has touch gesture support (pinch to zoom, multi-touch rotate). The PRD describes a layout with: 56px top bar + slim left panel + 240px right panel + bottom toolbar + zoom controls in bottom-right + info button in bottom-left. On a tablet or phone, that's UI colliding everywhere. The feature request says nothing about breakpoints, touch affordances, or mobile layout.

**Zero accessibility considerations.** No ARIA labels, no keyboard navigation for the new bottom toolbar, no focus management when panels open/close, no screen reader considerations for the theme switcher. The current app at least has keyboard shortcuts — the new layout adds clickable elements with no mention of how they're accessible.

---

## Gallery (GALLERY-1 through GALLERY-5)

**This is a separate project masquerading as a sub-item.** 5 PRD items covering: tab redesign, calendar view for My Submissions, calendar view for Winners, dual-mode Wall (grid + calendar + 3 sort modes + date navigation), Friends feed. Each of these is a full feature. The Gallery alone is probably 40% of total effort.

**Calendar views need data that may not exist.** The Winners calendar needs winning artwork for every past day. Does the backend return this efficiently? Or are we making 30 API calls per month view? The PRD has no data/API considerations.

**"Random" sort option.** Random sort with pagination is a well-known nightmare. Do you re-randomize on every page? Cache the random order? The PRD just says "Random" like it's free.

---

## User Menu (USER-1)

**"Green online status dot" requires real-time presence.** The current backend is Supabase. Does it have presence/real-time channels set up? Online status tracking is a feature unto itself — it needs heartbeats, timeout logic, and real-time subscriptions. The PRD treats it as a UI detail.

**"Add by nickname" in a dropdown menu is bad UX.** Adding friends is a deliberate action that deserves a proper flow, not a text input crammed into a user dropdown. What happens on error? Where does the success/failure feedback go? The dropdown is going to get awkwardly tall with the avatar + stats + tabs + friend list + input + logout button all stacked.

---

## Keyboard Shortcuts (SHORTCUT-1)

**Remapping V breaks existing users with zero migration path.** V currently does mirror vertical. Users who've built that into muscle memory will suddenly be yanked into select mode when they try to flip a shape. The PRD doesn't mention migration, notification, or even a one-time "shortcuts have changed" toast. It also doesn't mention what happens for users who've already customized their bindings — do custom bindings take precedence? They should, but it's not stated.

---

## Animation (ANIM-1 through ANIM-3)

**Spring animation on every shape placement will get old fast.** Power users placing 10+ shapes in rapid succession don't want to watch each one bounce in. The PRD doesn't have a "reduced motion" escape hatch beyond the existing `prefers-reduced-motion` media query (which the current app already respects, but the PRD never mentions).

**"Rotation from -180 to target" on shape placement.** If the target rotation is 0, the shape spins 180 degrees on every placement. That's disorienting and adds nothing to the creative flow. It's a demo-ware flourish that will annoy real users.

---

## Submission Detail (SUBMISSION-1)

**Two-column layout with no responsive fallback.** On viewports under ~900px, two columns of "large artwork preview" + "stacked info cards" will either overflow or need to stack — which the PRD doesn't address.

**"Following" badge requires relationship data per submission.** Is this data included in the submission query? Or is it a separate lookup? The PRD doesn't consider data loading.

**"Copy Link" button, but routing is query-param based.** The current app uses `?view=submission&id=X`. That's technically shareable, but ugly and fragile. The PRD doesn't mention whether routing should change.

---

## What's Missing

1. **Error states and loading states** — for the gallery views, user menu data, friend lists. Nothing.
2. **Performance budget** — 5 fonts, pattern overlays, spring animations everywhere, 0.25x-4x zoom range with potentially many shapes. No discussion.
3. **Testing strategy** — 27 items touching every component. How do we verify we haven't broken canvas editing, submission saving, voting, auth?
4. **Migration of existing UI tests** — if any exist.
5. **Rollback plan** — if the redesign ships and users hate it.
6. **Data attribute naming convention** — `data-theme='a|b|c|d'` is cryptic. Why not `data-theme='pop-art|swiss|cloud|brutalist'`?

---

## Summary

This PRD tries to boil the ocean. It's a ground-up rewrite of every visual surface in the app, with no phasing, no priority ordering, no responsive strategy, no accessibility plan, no performance budget, and several features (online presence, layer grouping UX, 45→2 shape types in toolbar) that have unanswered design questions. The theme system alone — done properly with 8 variants, smooth transitions, font loading, and pattern overlays — is a multi-week effort. Ship the layout restructuring and stamp mode first. Ship themes later. Ship the gallery redesign as a separate initiative. Stop trying to do everything at once.
