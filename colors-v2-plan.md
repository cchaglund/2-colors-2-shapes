# Colors V2: Harmonious Palette Generation

## Problem Statement

The current color generation system produces an abundance of unappealing brown tones. Analysis of the `?colors` simulator output reveals the pattern clearly:

| Generated Color | Hue | Sat | Light | Perceived As |
|---|---|---|---|---|
| `hsl(34, 79%, 22%)` | 34 | 79% | 22% | Dark brown |
| `hsl(42, 64%, 25%)` | 42 | 64% | 25% | Brown |
| `hsl(25, 44%, 39%)` | 25 | 44% | 39% | Brown |
| `hsl(37, 50%, 28%)` | 37 | 50% | 28% | Brown |
| `hsl(47, 73%, 26%)` | 47 | 73% | 26% | Brown |
| `hsl(29, 64%, 26%)` | 29 | 64% | 26% | Brown |
| `hsl(41, 64%, 22%)` | 41 | 64% | 22% | Brown |
| `hsl(39, 100%, 26%)` | 39 | 100% | 26% | Brown (even at max saturation!) |
| `hsl(30, 58%, 33%)` | 30 | 58% | 33% | Brown |
| `hsl(28, 65%, 40%)` | 28 | 65% | 40% | Acceptable (approaching orange) |

Additionally, true reds are extremely rare — only one instance spotted in a full simulator run.

Meanwhile, the system produces many beautiful colors we want to keep:
- `hsl(196, 100%, 26%)` — gorgeous deep teal (low lightness works great for cool hues)
- `hsl(260, 78%, 86%)` — soft lavender (light and gentle)

## Root Cause Analysis

### Brown is not a hue — it's a perceptual region

The current system's only defense against browns is a hue-based exclusion (`generateSafeHue` skips hues 30-50). This is insufficient because:

1. **Brown is a combination, not a hue.** It's what happens when warm hues (roughly 15-55) combine with low lightness. A 35° hue at L=80% is golden/amber. The same hue at L=25% is brown. The hue filter can't distinguish these.

2. **The exclusion range is too narrow.** Many browns in the data have hues of 25-29°, which pass through the 30-50° filter.

3. **Brown perception is asymmetric.** A dark blue (`hsl(220, 80%, 25%)`) reads as "deep navy" — appealing. The same lightness on a warm hue (`hsl(35, 80%, 25%)`) reads as brown. Human perception treats dark warm colors differently from dark cool colors.

4. **Saturation doesn't save warm hues.** `hsl(39, 100%, 26%)` is at maximum saturation and still reads as brown. This disproves any approach based on raising chroma/saturation minimums.

### The combination problem

The system generates hues, lightness, and chroma independently and randomly. This means:
- No guarantee that colors harmonize with each other
- No lightness variety within a palette (could get three dark colors, or three light ones)
- A dark brown can end up next to two bright pastels, where it looks worst

### How Coolors avoids this

Coolors *does* occasionally produce browns (e.g. "saddle brown" `#854D27`), but they work in context — paired with "shadow gray" (`#2E1F27`) and "tuscan sun" (`#F4C95D`), the palette reads as sophisticated and intentional. Key strategies:

1. **Color harmony rules** — hues relate to each other (complementary, triadic, etc.), not random
2. **Lightness distribution** — palettes have variety (light + medium + dark), creating visual hierarchy
3. **Context makes browns work** — a brown next to graphite and gold = moody warm palette; a brown next to baby blue and pale pink = bad

## Alternatives Considered and Rejected

### A. Post-generation brown rejection (hue + lightness filter)

```typescript
function isBrown(h: number, s: number, l: number): boolean {
  if (h >= 15 && h <= 55) {
    if (l < 40) return true;
    if (l < 50 && s < 60) return true;
  }
  return false;
}
```

**Rejected because:** Rejection-based, doesn't improve overall palette quality. Would prevent browns but doesn't make colors harmonize. Also blocks legitimate dark warm tones that could work in the right palette context.

### B. Raising global chroma/lightness minimums

Increase OKLCH chroma min from 0.07 to 0.10, lightness min from 0.4 to 0.45.

**Rejected because:** Blunt instrument. Would kill beautiful colors like deep teal (`hsl(196, 100%, 26%)`) and soft pastels. The problem isn't global — it's specific to warm hues at low lightness. Dark blues and deep greens at L=0.4 are gorgeous; raising the floor would remove them. Also, chroma and lightness aren't independently responsible for browns — it's the specific combination of warm hue + low lightness that creates the perception. Raising global floors risks removing nice tones (soft lavenders, deep teals) while not targeted enough to eliminate browns.

### C. Hue-dependent lightness/chroma floors

Different min lightness and chroma per hue zone (e.g. warm hues require L >= 0.55).

```typescript
function getMinLightnessForHue(hue: number): number {
  if (hue >= 15 && hue <= 55) return 0.55;
  return 0.4;
}
```

**Rejected because:** Better than global floors but still prevents dark warm tones that work in the right context (e.g. brown + graphite + gold). Doesn't address harmony or lightness distribution.

### D. Contextual brown rejection (brown allowed only with dark companions)

Allow browns only when another color in the palette is also dark, so the brown doesn't stick out as the lone muddy tone.

**Rejected because:** Adds complexity. With harmony rules in place, the worst cases (lone brown + two unrelated pastels) are already unlikely since the hues will be harmonically related. Can be added later if testing reveals remaining issues.

### E. Palette archetypes / mood system

Define palette moods (Vibrant, Pastel, Moody, Earthy, High Contrast, Neutral) that constrain chroma and lightness distributions. Track which archetype was used to prevent consecutive similar moods.

**Rejected because:** Over-engineered. Creates obvious "buckets" — users would notice "ah, today's a pastel day." Also prevents interesting cross-archetype palettes (e.g. a pastel color alongside a dark architectural gray). The constraints are too rigid for a creative tool.

### F. Forced lightness banding (one light, one mid, one dark)

Assign each of the 3 colors to a different lightness band to guarantee variety.

**Rejected because:** Too constraining. Two light colors with one dark can be a beautiful palette. Three mid-tones can work if the hues are well-chosen. Forced banding prevents valid palette shapes. A simpler contrast check achieves the goal without over-constraining.

## Chosen Approach

### 1. Harmony-based hue selection

Replace fully random hue generation with color harmony strategies. Pick a random anchor hue (full 0-360° range, no exclusions), then derive the other two hues using a randomly selected harmony rule with controlled jitter.

```typescript
type HarmonyRule = 'triadic' | 'complementary' | 'split-complementary' | 'analogous';

function generateHarmoniousHues(random: () => number): [number, number, number] {
  const anchor = Math.floor(random() * 360);
  const rules: HarmonyRule[] = ['triadic', 'complementary', 'split-complementary', 'analogous'];
  const rule = rules[Math.floor(random() * rules.length)];
  const jitter = () => (random() - 0.5) * 30; // +/-15 degrees

  const normalize = (h: number) => ((h % 360) + 360) % 360;

  switch (rule) {
    case 'triadic':
      return [anchor, normalize(anchor + 120 + jitter()), normalize(anchor + 240 + jitter())];
    case 'complementary':
      // Two colors near the complement, one at the anchor
      return [anchor, normalize(anchor + 180 + jitter()), normalize(anchor + 180 + jitter())];
    case 'split-complementary':
      return [anchor, normalize(anchor + 150 + jitter()), normalize(anchor + 210 + jitter())];
    case 'analogous':
      return [anchor, normalize(anchor + 30 + jitter()), normalize(anchor + 60 + jitter())];
  }
}
```

**Why this helps:**
- Colors inherently relate to each other through established color theory
- Triadic guarantees wide hue spread (no three muddy warm tones)
- Analogous creates cohesive palettes where even darker tones feel intentional
- Replaces the need for hue exclusion zones entirely — all hues are valid, harmony makes them work
- The harmony rule only determines hue relationships; lightness and chroma are still independent per color, so palettes have natural variety in weight and intensity

**Important note on harmony and hue equivalence:** Some harmony rules produce equivalent hue sets regardless of which vertex is the "anchor." For example, triadic from hue 0° gives {0, 120, 240}, and triadic from hue 120° gives {120, 240, 0} — the same triangle. This means changing the anchor alone doesn't guarantee a different-feeling palette if the same rule is used. This is why consecutive-day distinction (below) requires the harmony rule to change.

### 2. Relaxed contrast check (minimum 1 pair)

The current system requires at least 2 of 3 color pairs to have a WCAG contrast ratio >= 2.5. This is too strict — it prevents valid palettes like two pastels + one dark, or two darks + one light.

**Change:** Require at least **1 of 3 pairs** to have contrast ratio >= 2.5.

This ensures there's always at least one color pairing with good contrast (usable for foreground/background in art), while allowing the other two colors to be close in lightness if the randomness lands that way. Two similar colors + one contrasting color is a perfectly valid and often beautiful palette shape.

### 3. Consecutive-day distinction via harmony rule

To prevent palettes from feeling repetitive across days, require the harmony rule to differ from the previous day's rule.

**Mechanism:** Store the harmony rule used alongside the challenge in the DB (or derive it from the seed). When generating a new day, exclude the previous day's rule from the random selection, leaving 3 of 4 options.

This is sufficient because:
- Different harmony rules produce fundamentally different hue relationships
- The anchor hue varies naturally via the seeded random
- Lightness and chroma vary independently per color
- No risk of ping-ponging (4 rules, always 3 available, plenty of variety)

### What we remove

- **`excludeMuddyHues` config flag and `generateSafeHue` function** — no longer needed. Harmony rules handle palette quality. The hue-only filter was both too aggressive (blocking valid warm hues like amber/gold) and too permissive (missing browns outside 30-50°). All hues are now valid; harmony makes them work together.
- **The `minHueDiff` check in `generateDistinctColors`** — harmony rules inherently ensure hue spread (except analogous, where close hues are intentional and desirable).

### 4. Bell-curve lightness distribution (wider range, center-weighted)

The V1 lightness range of 0.4 - 0.9 prevents near-black and near-white colors entirely. We want to allow the full spectrum — charcoals, near-blacks, bright whites — but make extremes rare so that most palettes land in the visually versatile mid-range.

**Change:** Widen lightness range to **0.15 - 0.92** and use a **triangular distribution** (average of 2 uniform random values) instead of uniform random. This clusters values around the center (~0.54) while allowing the full range.

```typescript
// Average of 2 uniform randoms → triangular distribution
// Peaks at center, tapers toward extremes
function bellRandom(random: () => number, n = 2): number {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += random();
  return sum / n;
}

// Usage:
const l = 0.15 + bellRandom(random) * (0.92 - 0.15);
```

**Probability characteristics:**
- ~50% of values land between 0.35-0.73 (comfortable mid-range)
- ~25% land in the outer 20% (dark or very light)
- Near-black (L < 0.25) or near-white (L > 0.85): each ~5-8% per color
- At least one near-black in a 3-color palette: roughly 15-22% of palettes

This means a user playing daily would see a near-black color roughly once a week — rare enough to feel special, common enough to not feel absent.

### What we keep unchanged

- **OKLCH color space and gamut mapping** — perceptually uniform, good color quality
- **Chroma range (0.07 - 0.5)** — the "color intensity" axis. 0.07 is nearly gray (subtle hue tint), 0.5 is maximum vivid. The full range means some colors are muted/soft, some vivid. Each color picks randomly within this range. Consider lowering to 0.02 or 0.0 to allow true neutral grays (charcoal, graphite, porcelain) — current 0.07 minimum excludes these. Decision to be made during implementation/testing.
- **Previous-day color similarity avoidance** — existing `isColorTooSimilar` check against last 3 days' individual colors
- **Seeded deterministic randomness** — same date always produces same palette
- **All existing infrastructure** — edge function, DB storage, caching, ColorTester

## Implementation Plan

1. Add `generateHarmoniousHues()` function with the 4 harmony rules
2. Add `bellRandom()` helper for center-weighted lightness distribution
3. Widen lightness range from 0.4-0.9 to 0.15-0.92, using bell-curve distribution
4. Modify `generateDistinctColors()` to use harmony-based hues instead of 3x independent `generateSafeHue`
5. Relax contrast check from `passingPairs < 2` to `passingPairs < 1`
6. Remove `excludeMuddyHues` config flag and `generateSafeHue` function
7. Remove `minHueDiff` pairwise hue check (harmony rules handle this)
8. Add consecutive-day harmony rule tracking (store rule in DB or derive from seed, exclude previous day's rule)
9. Deploy edge function: `supabase functions deploy get-daily-challenge`
10. Test with `?colors` simulator — visually verify palette quality across many samples

## Verification Criteria

- Browns may appear, but only in harmonically coherent palettes (not lone brown + two unrelated pastels)
- Near-black and near-white colors appear occasionally (roughly every few palettes) but not constantly
- Deep cool tones (teal, navy, forest green) still appear at low lightness
- Soft/pastel tones still appear
- True neutrals (grays, charcoal, porcelain) are possible (if chroma floor is lowered)
- True reds appear with reasonable frequency (no hue exclusion blocking them)
- Colors within each palette feel harmonious / intentional together
- Consecutive days feel distinct (different harmony rules = different palette character)
- At least one color pair per palette has good contrast (usable for art)
