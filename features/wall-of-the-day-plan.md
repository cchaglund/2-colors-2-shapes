# Wall of the Day - Implementation Plan

> **Entry point:** Use [MASTER.md](./MASTER.md) to automatically determine which task to work on next.

**Tasks file:** `features/wall-of-the-day-tasks.json`
**Shared context:** [social-features-meta-plan.md](./social-features-meta-plan.md)

---

## Overview

Add a "Wall of the Day" feature that displays all public submissions for a given day in a grid view. Available both as a tab in the Calendar modal AND as a standalone URL-addressable page.

**Key Privacy Rules:** (see meta plan for details)
1. Only show submissions where `included_in_ranking = true`
2. Block current day view until user has saved their own art

---

## Feature Requirements Summary

- **Tab in modal:** Third tab "Wall" in Calendar modal for quick access
- **Standalone URL:** `?view=wall-of-the-day&date=YYYY-MM-DD` for direct linking/sharing
- Grid of submission thumbnails with nicknames
- **Sorting controls:** Random (default), Newest, Oldest, Ranked (only for days n-2 and older)
- **Clear date header** showing which day is being viewed
- Calendar picker to browse other dates (day cells show shape indicators)
- Prev/Next navigation between days
- Locked state for current day if user hasn't saved
- **Pagination:** 100 initial limit, "Load more" button

---

## Architecture Decisions

### NO Calendar Refactor
Add the Wall tab to the existing `Calendar/` structure. Do NOT rename to SubmissionsModal or restructure the component.

**Rationale:**
- Calendar.tsx is only 335 lines — not too large
- Already well-factored with 7 sub-components
- Adding 2 tabs doesn't require a full restructure
- Avoids breaking imports and risking regressions

### Reuse Existing Components
Extend `SubmissionThumbnail.tsx` with new props instead of creating new thumbnail components.

### Caching
Apply the `useDailyChallenge` pattern (in-memory + localStorage + request deduplication).

---

## Implementation Approach

### Files to Create

```
src/components/Calendar/tabs/
  WallTab.tsx                    # Tab content wrapper

src/components/Wall/
  WallContent.tsx                # Shared content (used in tab + standalone page)
  WallSortControls.tsx           # Random/Newest/Oldest/Ranked toggle
  WallLockedState.tsx            # "Save your art first" message
  WallEmptyState.tsx             # "No submissions for this day"
  WallCalendarPicker.tsx         # Calendar overlay for date selection

src/components/WallOfTheDay/
  WallOfTheDayPage.tsx           # Standalone page for direct URL access

src/hooks/
  useWallOfTheDay.ts             # Data fetching with caching
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/Calendar/Calendar.tsx` | Add 'wall' to ViewMode, render WallTab |
| `src/components/Calendar/CalendarViewToggle.tsx` | Add "Wall" tab button |
| `src/components/Calendar/types.ts` | Extend ViewMode type |
| `src/utils/urlParams.ts` | Add `getWallOfTheDayView()` |
| `src/App.tsx` | Route `?view=wall-of-the-day` to WallOfTheDayPage |
| `src/components/SubmissionThumbnail.tsx` | Add showNickname, nickname, onClick props |

---

## Data Layer

### useWallOfTheDay Hook

```typescript
interface UseWallOfTheDayOptions {
  date: string;
  hasSubmittedToday: boolean;
}

interface UseWallOfTheDayReturn {
  submissions: WallSubmission[];
  loading: boolean;
  error: string | null;

  sortMode: 'random' | 'newest' | 'oldest' | 'ranked';
  setSortMode: (mode: SortMode) => void;

  canViewCurrentDay: boolean;
  isRankedAvailable: boolean;  // false for today and yesterday

  hasMore: boolean;
  loadMore: () => Promise<void>;

  adjacentDates: { prev: string | null; next: string | null };
}

interface WallSubmission {
  id: string;
  user_id: string;
  nickname: string;
  shapes: Shape[];
  groups: ShapeGroup[];
  background_color_index: number | null;
  created_at: string;
  final_rank?: number;
}
```

### Caching Pattern

> **Note:** Unlike `useDailyChallenge`, do NOT use localStorage. Wall submissions change frequently.

```typescript
// Module-level cache (in-memory only, no localStorage)
const wallCache = new Map<string, WallSubmission[]>();
const pendingRequests = new Map<string, Promise<WallSubmission[]>>();

async function fetchWallSubmissions(date: string): Promise<WallSubmission[]> {
  const cacheKey = `wall-${date}`;

  if (wallCache.has(cacheKey)) return wallCache.get(cacheKey)!;
  if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey)!;

  const promise = actualFetch(date);
  pendingRequests.set(cacheKey, promise);
  const data = await promise;
  wallCache.set(cacheKey, data);
  pendingRequests.delete(cacheKey);
  return data;
}

// Cache invalidation - call when user saves a submission
export function invalidateWallCache(date: string) {
  wallCache.delete(`wall-${date}`);
}
```

### Cache Invalidation Strategy

| Event | Action |
|-------|--------|
| User saves submission for today | Call `invalidateWallCache(todayDate)` |
| User navigates to different date | Use cached data if available |
| User refreshes page | Cache resets (in-memory only) |

**Integration point in App.tsx:**
```typescript
// In useSaveSubmission success callback:
onSaveSuccess: () => {
  invalidateWallCache(challenge.date);  // <-- Add this
  setShowVotingModal(true);
}
```

### Database Query

```typescript
const INITIAL_LIMIT = 100;

const { data } = await supabase
  .from('submissions')
  .select(`
    id,
    user_id,
    shapes,
    groups,
    background_color_index,
    created_at
  `)
  .eq('challenge_date', targetDate)
  .eq('included_in_ranking', true)
  .limit(INITIAL_LIMIT + 1);  // +1 to check if more exist

// Batch fetch nicknames separately (avoid RLS join issues)
const userIds = [...new Set(data.map(s => s.user_id))];
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, nickname')
  .in('id', userIds);
```

### Sorting Logic

- **Random:** Fisher-Yates shuffle **once per fetch**, stored in component state (see below)
- **Newest:** Sort by `created_at` descending
- **Oldest:** Sort by `created_at` ascending
- **Ranked:** Sort by `final_rank` ascending (only available for n-2+ days; **hide if null**)

**Random Sort Behavior (Clarified):**
```typescript
// Store shuffled order separately from submissions
const [shuffledOrder, setShuffledOrder] = useState<string[]>([]);

// Shuffle ONLY when submissions are first fetched
useEffect(() => {
  if (submissions.length > 0 && shuffledOrder.length === 0) {
    setShuffledOrder(fisherYatesShuffle(submissions.map(s => s.id)));
  }
}, [submissions]);

// Do NOT re-shuffle on:
// - Component re-renders
// - Sort mode changes (switching back to Random uses stored order)
// - Navigation away and back (if cached)

// DO re-shuffle on:
// - Page refresh (state resets)
// - Cache invalidation (new fetch)
```

**Ranked Sort Fallback:**
If `final_rank` is null for n-2+ days (finalization job failed), hide the "Ranked" option entirely rather than showing broken sorting.

---

## UI Components

### WallContent Component

```typescript
interface WallContentProps {
  date: string;
  onDateChange: (date: string) => void;
  showNavigation?: boolean;
  showCalendarButton?: boolean;
}
```

### WallSortControls

```
┌─────────┬─────────┬─────────┬─────────┐
│ Random  │ Newest  │ Oldest  │ Ranked  │
│   ●     │   ○     │   ○     │   ○     │
└─────────┴─────────┴─────────┴─────────┘
```

- Radio-style buttons
- "Ranked" disabled with tooltip for current day and yesterday: "Voting still in progress"

### Date Header

Clear indicator of which date is being viewed:

```
← January 18, 2026 →
   [Show Calendar]
```

### Grid Layout

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
gap: 16px;
```

### Thumbnail Cards

Use enhanced `SubmissionThumbnail` with:
- `showNickname={true}`
- `nickname={submission.nickname}`
- `onClick={() => navigateToSubmission(submission.id)}`
- Hover tooltip: "Submitted at 2:34 PM"

### Locked State

```typescript
<WallLockedState>
  <LockIcon />
  <p>Save your art first to see today's submissions</p>
  <a href="/">← Back to canvas</a>
</WallLockedState>
```

For logged-out users: "Sign in to see today's submissions"

### Empty State

```typescript
<WallEmptyState>
  <p>No public submissions for this day</p>
</WallEmptyState>
```

### Load More

```typescript
{hasMore && (
  <button onClick={loadMore} className="...">
    Load more submissions
  </button>
)}
```

---

## URL Routing

### urlParams.ts addition

```typescript
export function getWallOfTheDayView(): { view: 'wall-of-the-day'; date: string } | null {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'wall-of-the-day') {
    const date = urlParams.get('date') || getTodayDateUTC();
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { view: 'wall-of-the-day', date: getTodayDateUTC() };
    }
    // Redirect future dates to today
    if (date > getTodayDateUTC()) {
      return { view: 'wall-of-the-day', date: getTodayDateUTC() };
    }
    return { view: 'wall-of-the-day', date };
  }
  return null;
}
```

### App.tsx addition

```typescript
const wallOfTheDayView = useMemo(() => getWallOfTheDayView(), []);

// In render logic (before main app)
if (wallOfTheDayView) return <WallOfTheDayPage date={wallOfTheDayView.date} />;
```

---

## Edge Cases

| Case | Handling |
|------|----------|
| Current day, not logged in | Locked: "Sign in to see today's submissions" |
| Current day, logged in, no submission | Locked: "Save your art first..." |
| Current day, has saved | Show wall (Ranked sort disabled) |
| Yesterday (n-1) | Show wall (Ranked sort disabled) |
| Day n-2 and older | Full functionality including Ranked sort |
| No public submissions | Empty state: "No public submissions for this day" |
| Future date in URL | Redirect to today |
| Invalid date in URL | Redirect to today |
| 100+ submissions | Show first 100, "Load more" button |

---

## Calendar Tab Integration

### Calendar.tsx changes

```typescript
// types.ts
type ViewMode = 'my-submissions' | 'winners' | 'wall';

// CalendarViewToggle.tsx - add Wall button

// Calendar.tsx
{effectiveViewMode === 'wall' && (
  <WallTab date={selectedDate} onDateChange={setSelectedDate} />
)}
```

---

## File Summary

### New Files (8)

```
src/components/Calendar/tabs/
  WallTab.tsx

src/components/Wall/
  WallContent.tsx
  WallSortControls.tsx
  WallLockedState.tsx
  WallEmptyState.tsx
  WallCalendarPicker.tsx

src/components/WallOfTheDay/
  WallOfTheDayPage.tsx

src/hooks/
  useWallOfTheDay.ts
```

### Modified Files (6)

```
src/components/Calendar/Calendar.tsx
src/components/Calendar/CalendarViewToggle.tsx
src/components/Calendar/types.ts
src/components/SubmissionThumbnail.tsx
src/utils/urlParams.ts
src/App.tsx
```

---

## Verification Checklist

### Tab Functionality
- [ ] "Wall" tab appears in Calendar modal
- [ ] Tab switching works (My Submissions ↔ Winners ↔ Wall)
- [ ] Caching prevents refetch when switching tabs

### Standalone Page
- [ ] `?view=wall-of-the-day` URL works
- [ ] `?view=wall-of-the-day&date=2026-01-10` shows that date
- [ ] Future dates redirect to today
- [ ] Invalid dates redirect to today

### Privacy
- [ ] Only `included_in_ranking = true` submissions shown
- [ ] Current day locked when not logged in
- [ ] Current day locked when no submission
- [ ] Unlocks after saving submission
- [ ] Past days always visible

### UI
- [ ] Date header clearly shows current date
- [ ] Click thumbnail → opens SubmissionDetailPage
- [ ] Sort: Random shuffles on each load
- [ ] Sort: Newest shows most recent first
- [ ] Sort: Oldest shows oldest first
- [ ] Sort: Ranked disabled for today and yesterday
- [ ] Sort: Ranked works for n-2+ days
- [ ] Empty state for days without submissions
- [ ] Calendar picker opens/closes
- [ ] Prev/Next navigation works
- [ ] Hover tooltip shows submission time
- [ ] "Load more" appears with 100+ submissions

---

## Implementation Order

1. Extend `SubmissionThumbnail` with new props
2. Create `useWallOfTheDay` hook with caching
3. Create `WallContent` and supporting components
4. Add `WallTab` to Calendar
5. Create `WallOfTheDayPage` for standalone URL
6. Update URL routing in App.tsx
7. Test all edge cases
