
### Users
Creative hobbyists looking for daily inspiration and fun. They come to make something quick and expressive within tight constraints, then see what others made. The interface should feel **playful and encouraging** — lower the barrier to creating, not raise it.

### Brand Personality
**Playful, Creative, Bold.** The app is energetic and expressive. It should feel alive and fun, never sterile or corporate. Design choices should have personality and intention.

### Default Theme
**Theme A (Pop Art)** is the primary theme. When making design decisions or writing new components, design for Theme A first, then verify it works across B (Swiss), C (Cloud), and D (Brutalist).

### Aesthetic Direction
- The existing multi-theme system IS the design direction — 4 distinct personalities (Pop Art, Swiss, Cloud, Brutalist) × 2 modes (light/dark)
- Every component must work across all 8 theme-mode combinations via CSS variables
- Never hardcode colors, shadows, border-radii, or font families — always use `var(--token)`
- The design already exists and is good — the goal is to **consolidate and codify**, not reinvent

### Anti-References
Not a generic SaaS dashboard. Not a social media feed. Not a kids' app (playful ≠ childish). Not an enterprise tool. It should feel like a creative tool with personality, not a product with a "design system" slapped on.

### Design Principles

1. **Every pixel intentional.** No default spacing, no "close enough" alignment. Use the 4px grid. Use the token system. If a value isn't in the system, question why.

2. **Theme-first components.** Components are authored against CSS variables, never raw color/font values. A component that breaks in one theme is a broken component.

3. **Personality through constraint.** Each theme has a distinct character (chunky shadows in Pop Art, zero radius in Brutalist, soft diffusion in Cloud). Lean into these differences — don't flatten them into sameness.

4. **Canvas is king.** The editor canvas is the core experience. UI chrome (toolbars, panels, modals) should support the canvas, not compete with it. Keep controls compact, contextual, and out of the way.

5. **Playful, not noisy.** Animations, colors, and visual effects should add delight without creating distraction. The user's artwork is always the hero.

### Design Tokens Reference
- **Typography scale:** 11px / 13px / 14px / 16px / 18px / 24px (via `--text-xs` through `--text-2xl`)
- **Spacing grid:** 4px increments (via `--space-1` through `--space-8`)
- **Component heights:** 32px (buttons), 40px (inputs)
- **Icon sizes:** 16px, 18px, 24px
- **All theme tokens defined in** `src/index.css` under `@layer base`
- **Theme switching:** `data-theme` + `data-mode` attributes on `<html>`, managed by `useThemeState` hook

### Accessibility
Best-effort approach: maintain reasonable contrast ratios, keyboard navigation, and screen reader support. Don't block features for strict WCAG compliance, but don't ignore it either. Respect `prefers-reduced-motion` and `prefers-color-scheme`.
