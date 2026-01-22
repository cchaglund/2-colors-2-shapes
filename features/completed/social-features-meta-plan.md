# Social Features - Meta Plan

> **Entry point:** Use [MASTER.md](./MASTER.md) to automatically determine which task to work on next.

This document provides shared context, privacy rules, and architecture decisions. Reference it when implementing features, but use MASTER.md to find the next task.

---

## Critical Clarifications (Added During Review)

### How `included_in_ranking` Actually Works

**Important:** The original documentation implied users choose at save time whether to enter competition. This is **incorrect**.

**Actual flow (from `process-vote/index.ts:195-202`):**
1. User clicks "Save Creation" → submission saved with `included_in_ranking = false`
2. VotingModal opens automatically after save
3. User can vote or close the modal
4. Only when user casts their **5th vote** does `included_in_ranking` become `true`

**Implication:** ALL submissions start as "private." Only users who vote 5 times appear on Wall of the Day.

### Toolbar UI Update Required

The current Toolbar shows "Submitted" regardless of whether the user voted. This needs to change:

| State | Button Text | Additional UI |
|-------|-------------|---------------|
| `hasSubmittedToday && enteredRanking` | "Submitted" (disabled) | None |
| `hasSubmittedToday && !enteredRanking` | "Saved" (disabled) | + "Vote and submit" button below |

**"Vote and submit" button:** Opens VotingModal. Only available during voting hours (same rules as VotingModal).

### Privacy Rule 2 is Client-Side Only

**Decision:** The "can't see today's submissions until you've saved" rule is enforced via JavaScript state (`hasSubmittedToday`), NOT database RLS.

**Accepted limitation:** A technically sophisticated user could bypass this check via DevTools. This is an acceptable tradeoff for simplicity.

### useFollows Architecture: Global Context

**Decision:** Instead of a per-component `useFollows(userId)` hook, create a **global React Context** for follows.

**Rationale:** In a grid of 100 submissions, we'd otherwise make 100 separate hook calls to check follow status.

```typescript
// src/contexts/FollowsContext.tsx
interface FollowsContextValue {
  following: Set<string>;      // O(1) lookup
  followers: Set<string>;
  followingCount: number;
  followersCount: number;
  isFollowing: (userId: string) => boolean;
  follow: (userId: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
  loading: boolean;
}
```

### Follow Limit

**Decision:** Hard limit of **500 users** maximum. Enforce in `FollowsContext.follow()`:
```typescript
if (following.size >= 500) {
  return { success: false, error: 'You can follow a maximum of 500 users' };
}
```

---

## Features Overview

| Feature | Complexity | New DB Tables | Plan |
|---------|------------|---------------|------|
| **Wall of the Day** | Medium | None | [wall-of-the-day-plan.md](./wall-of-the-day-plan.md) |
| **Other User's Profiles** | Medium | None | (included in friends plan) |
| **Friends/Follow System** | High | `follows` | [friends-feature-plan.md](./friends-feature-plan.md) |
| **Friends Feed** | Medium | None | (included in friends plan) |

**Recommended Implementation Order:**
1. Nickname uniqueness (prerequisite)
2. Shared infrastructure (caching, component extensions)
3. Wall of the Day (establishes grid patterns, thumbnail cards, access control)
4. Friends/Follow System + User Profiles + Friends Feed (all in one plan)

---

## Key Design Decisions

These decisions have been made and should be followed:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Social model | **One-way follow** (like Twitter) | Simpler, instant follows, no pending states |
| Follow limit | **Hard cap at 500** | Prevents abuse, enforced in context |
| Private days on profiles | **Show empty cell** | Just show date number, no "No art submitted" text |
| Friends Feed calendar cells | **Count badge** (e.g., "5") | Simple, clear indication of friend activity |
| Followers visibility | **Show both lists** | Following tab + Followers tab in Friends modal |
| Calendar refactor | **NO refactor** | Add tabs to existing Calendar/, don't rename/restructure |
| Thumbnail component | **Extend existing** | Add props to SubmissionThumbnail, don't create new components |
| Pagination | **Limit + Load More** | 100 initial limit, "Load more" button for simplicity |
| Random sort | **Shuffle once per fetch** | Store shuffled order in state, don't re-shuffle on navigation/re-render |
| Caching | **In-memory only** (no localStorage) | Submissions change frequently; localStorage would go stale |
| Follows architecture | **Global React Context** | Single source of truth, O(1) lookups, avoids per-component hook calls |
| Privacy enforcement | **Client-side only** | Accepted tradeoff for simplicity |

---

## Prerequisite: Nickname Uniqueness

Before implementing social features, ensure nickname uniqueness is enforced.

### Required Changes
1. **Add database constraint** (if not already present):
   ```sql
   ALTER TABLE profiles ADD CONSTRAINT profiles_nickname_unique UNIQUE(nickname);
   CREATE INDEX IF NOT EXISTS profiles_nickname_lower_idx ON profiles(LOWER(nickname));
   ```

2. **Add case-insensitive check** in `useProfile.ts` before save:
   ```typescript
   const { data: existing } = await supabase
     .from('profiles')
     .select('id')
     .ilike('nickname', nickname)
     .neq('id', userId)
     .maybeSingle();
   if (existing) return { success: false, error: 'This nickname is already taken' };
   ```

---

## Shared Privacy Rules (CRITICAL)

These rules apply across ALL social features:

### Rule 1: Only Show Public Submissions
A submission is "public" only if `included_in_ranking = true`. This means the user chose to submit for the daily competition.

```typescript
// ALWAYS filter by this
.eq('included_in_ranking', true)
```

### Rule 2: Current Day Restriction
Users cannot see OTHER users' submissions for the current day until they have saved their own art. This prevents being influenced by others' work.

**Applies to:**
- Wall of the Day (current day view)
- Other user's profile page (current day cell)
- Friends Feed (current day submissions)

**Implementation:**
```typescript
const canViewCurrentDay = hasSubmittedToday || targetDate !== todayDateUTC;
```

**UX:**
- Show locked state with message: "Save your art first to see today's submissions"
- Past days are always visible
- Current day becomes visible immediately after saving

### Rule 3: Submission Visibility by Date
| Viewer's State | Current Day | Past Days |
|----------------|-------------|-----------|
| Not logged in | Locked | Visible (public only) |
| Logged in, no submission today | Locked | Visible (public only) |
| Logged in, has saved today | Visible | Visible (public only) |

---

## Shared URL Patterns

All social features follow the existing URL parameter pattern:

| Feature | URL Pattern |
|---------|-------------|
| Wall of the Day | `?view=wall-of-the-day&date=YYYY-MM-DD` |
| User Profile | `?view=profile&user=USER_ID` |
| User Submission | `?view=submission&id=SUBMISSION_ID` |
| Friends Feed | `?view=friends-feed&date=YYYY-MM-DD` |

**Note:** The Friends modal does NOT have a URL - it's triggered from the Toolbar button.

---

## Architecture: NO Calendar Refactor

**Decision:** Add new tabs to the existing `Calendar/` component structure. Do NOT rename to SubmissionsModal or restructure.

### Changes to Existing Structure
```
src/components/Calendar/
├── Calendar.tsx              # Add 'wall' and 'friends' to ViewMode
├── CalendarViewToggle.tsx    # Add "Wall" and "Friends" tab buttons
├── types.ts                  # Extend ViewMode type
└── tabs/                     # NEW folder
    ├── WallTab.tsx           # Grid view of today's submissions
    └── FriendsFeedTab.tsx    # Grid view of friends' submissions
```

**Rationale:**
- Calendar.tsx is only 335 lines - not too large
- Already well-factored with 7 sub-components
- Adding 2 tabs doesn't require a full restructure
- Avoids breaking imports and risking regressions

---

## Caching Strategy

**Important difference from `useDailyChallenge`:** Social feature data changes frequently (new submissions, follows/unfollows). Do NOT use localStorage caching—only in-memory with request deduplication.

```typescript
// Pattern to reuse (WITHOUT localStorage):
const cache = new Map<string, Data>();
const pendingRequests = new Map<string, Promise<Data>>();

async function fetchWithCache(key: string): Promise<Data> {
  // 1. Check in-memory cache
  if (cache.has(key)) return cache.get(key)!;

  // 2. Deduplicate in-flight requests
  if (pendingRequests.has(key)) return pendingRequests.get(key)!;

  // 3. Fetch and cache
  const promise = actualFetch(key);
  pendingRequests.set(key, promise);
  const data = await promise;
  cache.set(key, data);
  pendingRequests.delete(key);
  return data;
}
```

### Cache Invalidation Strategy

| Event | Action |
|-------|--------|
| User saves submission | Clear `wall-${todayDate}` from cache |
| User follows someone | Clear all `friends-*` entries from cache |
| User unfollows someone | Clear all `friends-*` entries from cache |
| Navigation between dates | Use cached data if available |

```typescript
// Expose invalidation methods
function invalidateWallCache(date: string) {
  cache.delete(`wall-${date}`);
}

function invalidateFriendsFeedCache() {
  // Clear all friends feed entries
  for (const key of cache.keys()) {
    if (key.startsWith('friends-')) cache.delete(key);
  }
}
```

Apply to:
- `useWallOfTheDay` — Cache submissions by date, invalidate on own submission
- `useFriendsFeed` — Cache friend submissions by date, invalidate on follow/unfollow
- `useUserProfile` — Cache user profiles by userId (rarely changes)
- `FollowsContext` — Global state, no caching needed (always fresh)

---

## Pagination Strategy

For all grid views (Wall, Friends Feed, User Profiles):

```typescript
const INITIAL_LIMIT = 100;
const LOAD_MORE_COUNT = 50;

// Initial fetch - get 101 to check if more exist
const { data } = await supabase
  .from('submissions')
  .select('...')
  .limit(INITIAL_LIMIT + 1);

setHasMore(data.length > INITIAL_LIMIT);
setSubmissions(data.slice(0, INITIAL_LIMIT));
```

---

## Shared UI Components

### SubmissionThumbnail Enhancement
Extend the existing `SubmissionThumbnail.tsx` with new props:

```typescript
interface SubmissionThumbnailProps {
  // Existing props...

  // New optional props for social features:
  showNickname?: boolean;      // Display @nickname below thumbnail
  nickname?: string;
  showRank?: boolean;          // Display rank badge
  rank?: number;
  onClick?: () => void;        // Click handler for navigation
}
```

**Do NOT create separate thumbnail components** (WallThumbnailCard, SubmissionThumbnailCard, etc.)

### FollowButton
Used by: Profile page, SubmissionDetailPage, FriendsModal rows

```typescript
interface FollowButtonProps {
  targetUserId: string;
  size?: 'sm' | 'md';
}
```

**States:**
- Not logged in: disabled, tooltip "Sign in to follow"
- Not following: "Follow" - accent color
- Following: "Following" - muted, hover shows "Unfollow" in red
- Loading: disabled with spinner

### SortControls
Used by: Wall, Friends Feed

```typescript
interface SortControlsProps {
  value: 'random' | 'newest' | 'oldest' | 'ranked';
  onChange: (value: SortMode) => void;
  isRankedDisabled: boolean;  // true for current day and yesterday
}
```

**Random sort behavior (clarified):**
- Shuffle **once** when data is fetched using Fisher-Yates algorithm
- Store shuffled order in component state
- **Do NOT re-shuffle** on:
  - Component re-renders
  - Navigation away and back
  - Sort mode changes (switching from "Newest" back to "Random" uses the stored shuffle)
- **DO re-shuffle** when:
  - User explicitly refreshes the page
  - Data is re-fetched (e.g., after cache invalidation)

```typescript
// Store shuffled order separately
const [shuffledOrder, setShuffledOrder] = useState<string[]>([]);

// Shuffle only on initial fetch
useEffect(() => {
  if (submissions.length && shuffledOrder.length === 0) {
    setShuffledOrder(fisherYatesShuffle(submissions.map(s => s.id)));
  }
}, [submissions]);

// Apply current sort
const sortedSubmissions = useMemo(() => {
  if (sortMode === 'random') {
    return shuffledOrder.map(id => submissions.find(s => s.id === id)!);
  }
  // ... other sort modes
}, [sortMode, submissions, shuffledOrder]);
```

---

## Database: Follows Table

```sql
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are public" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Helper function for calendar badge
CREATE OR REPLACE FUNCTION count_friends_submissions_by_date(
  p_user_id UUID, p_start_date TEXT, p_end_date TEXT
) RETURNS TABLE (challenge_date TEXT, friend_count BIGINT) AS $$
  SELECT s.challenge_date, COUNT(DISTINCT s.user_id)
  FROM submissions s
  INNER JOIN follows f ON f.following_id = s.user_id AND f.follower_id = p_user_id
  WHERE s.challenge_date BETWEEN p_start_date AND p_end_date
    AND s.included_in_ranking = true
  GROUP BY s.challenge_date;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## Shared Hooks

### useHasSubmittedToday
Already exists in `useSubmissions.ts` as `hasSubmittedToday`. Used for access control.

### useUserProfile (to be created)
```typescript
function useUserProfile(userId: string) {
  return {
    profile: { nickname, followingCount, followersCount },
    submissions: Submission[],  // Only public ones, with caching
    loading: boolean,
    error: string | null,
  };
}
```

### FollowsContext (to be created)

**Architecture:** Global React Context, NOT a per-component hook. This ensures O(1) follow status lookups and avoids redundant API calls.

**File:** `src/contexts/FollowsContext.tsx`

```typescript
interface FollowsContextValue {
  // Data
  following: FollowUser[];          // Full list with nicknames
  followers: FollowUser[];
  followingIds: Set<string>;        // O(1) lookup set
  followingCount: number;
  followersCount: number;

  // Methods
  isFollowing: (userId: string) => boolean;  // O(1) using Set
  follow: (userId: string) => Promise<{ success: boolean; error?: string }>;
  unfollow: (userId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;     // Force refresh

  // State
  loading: boolean;
}

const FollowsContext = createContext<FollowsContextValue | null>(null);

export function FollowsProvider({ children }: { children: ReactNode }) {
  // Fetch follows for current user on mount
  // Maintain Set<string> for O(1) isFollowing checks
  // Enforce 500 follow limit in follow()
}

export function useFollows() {
  const context = useContext(FollowsContext);
  if (!context) throw new Error('useFollows must be used within FollowsProvider');
  return context;
}
```

**Usage in App.tsx:**
```typescript
<FollowsProvider>
  <App />
</FollowsProvider>
```

**Optimistic updates:** Update UI immediately on follow/unfollow, rollback on error.

**Follow limit enforcement:**
```typescript
async function follow(targetUserId: string) {
  if (followingIds.size >= 500) {
    return { success: false, error: 'You can follow a maximum of 500 users' };
  }
  // ... proceed with follow
}
```

---

## Error Handling

Standard pattern for all new pages:

```typescript
// User not found
if (!profile) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-(--color-text-secondary) mb-4">User not found</p>
        <a href="/" className="text-(--color-accent)">← Back to app</a>
      </div>
    </div>
  );
}
```

### Edge Cases
| Case | Handling |
|------|----------|
| User deleted their account | CASCADE DELETE removes follows; don't show in lists |
| User tries to follow while logged out | FollowButton disabled, tooltip "Sign in to follow" |
| Friends tab when logged out | Show "Please sign in to see friends' submissions" |
| Database timeout | Show generic error with retry option |
| **NEW:** User reaches 500 follow limit | Show error "You can follow a maximum of 500 users" |
| **NEW:** `final_rank` null for n-2 days (finalization failed) | Hide "Ranked" sort option, show only Random/Newest/Oldest |
| **NEW:** Wall of the Day with 0 submissions | Show empty state: "No one has submitted for this day yet" |
| **NEW:** User's own profile page | Hide FollowButton (can't follow yourself) |
| **NEW:** Invalid UUID in profile URL | Show "User not found" with back link |
| **NEW:** Deleted user's profile URL | Show "User not found" with back link |

### Error Recovery Strategy

For all social feature pages, wrap in error boundary and show:
```typescript
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
    <p className="text-(--color-text-secondary) mb-4">Something went wrong</p>
    <button onClick={refetch} className="text-(--color-accent)">
      Try again
    </button>
  </div>
</div>
```

---

## Navigation Flow

```
Main App
├── Toolbar
│   ├── "Submissions" button → Calendar Modal
│   │   ├── My Submissions tab (calendar view)
│   │   ├── Winners tab (calendar view)
│   │   ├── Wall tab (grid view)
│   │   └── Friends Feed tab (grid view)
│   │
│   └── "Friends" button → FriendsModal
│       ├── Following tab (user list)
│       ├── Followers tab (user list)
│       ├── Search bar (find users)
│       └── "See friends' submissions →" button (closes modal, opens Calendar with Friends tab)
│
├── Click on submission → SubmissionDetailPage
│   └── Click on nickname → Profile page
│       └── Click on submission → SubmissionDetailPage
│
└── Direct URLs
    ├── ?view=wall-of-the-day&date=...
    ├── ?view=profile&user=...
    ├── ?view=submission&id=...
    └── ?view=friends-feed&date=...
```

---

## Implementation Order

### Phase -1: Testing Infrastructure (MUST complete first)

Complete tasks 1-9 from `features/testing-infrastructure-tasks.json` before proceeding.

This sets up:
- Mock users, profiles, follows, submissions for testing
- SocialTestPage shell (`?test=social`)
- Test utilities for unit tests

**Agent instructions:** See `features/testing-infrastructure-plan.md`

---

### Phase 0: Prerequisites (MUST complete before any social feature)

1. **Nickname uniqueness migration**
   - Add UNIQUE constraint to profiles.nickname
   - Add case-insensitive index
   - Update useProfile.ts to check uniqueness before save

2. **Toolbar "Saved" vs "Submitted" UI**
   - Fetch `enteredRanking` from `user_voting_status` table
   - Show "Saved" (disabled) when saved but not entered ranking
   - Show "Submitted" (disabled) when entered ranking
   - Add "Vote and submit" button when saved but not entered

3. **Create FollowsContext** (can be empty initially)
   - Scaffold the context provider
   - Will be populated in Phase 2

### Phase 1: Wall of the Day

**Tasks:** `features/wall-of-the-day-tasks.json`
**Plan:** `features/wall-of-the-day-plan.md`

### Phase 2 & 3: Friends System + Friends Feed

**Tasks:** `features/friends-feature-tasks.json`
**Plan:** `features/friends-feature-plan.md`

---

## Testing Checklist (applies to all features)

### Privacy
- [ ] Privacy Rule 1: Only `included_in_ranking = true` submissions shown
- [ ] Privacy Rule 2: Current day locked until user saves (client-side check)
- [ ] Own submissions always visible regardless of `included_in_ranking`

### Navigation
- [ ] URL navigation works correctly for all views
- [ ] Back navigation works from all pages
- [ ] Invalid URLs redirect gracefully (to home or today)
- [ ] Clickable nicknames navigate to profile

### States
- [ ] Loading states display properly (spinner or skeleton)
- [ ] Empty states display properly with clear messaging
- [ ] Error states show "Something went wrong" with retry button
- [ ] "User not found" for invalid profile URLs

### Caching & Performance
- [ ] Caching prevents redundant fetches on tab switch
- [ ] Cache invalidates when user saves submission
- [ ] Cache invalidates when user follows/unfollows
- [ ] "Load more" appears with 100+ items

### Sorting (Wall & Friends Feed)
- [ ] Random sort: shuffles once per fetch, not on re-renders
- [ ] Newest: most recent first
- [ ] Oldest: oldest first
- [ ] Ranked: only available for n-2+ days
- [ ] Ranked: hidden if `final_rank` data missing

### Follows
- [ ] Follow button shows correct state (Follow/Following/Unfollow on hover)
- [ ] Follow limit of 500 enforced with clear error message
- [ ] Can't follow yourself (button hidden on own profile)
- [ ] Optimistic updates work (UI updates immediately)
- [ ] Rollback on error (UI reverts if API fails)

### Prerequisites
- [ ] Nickname uniqueness enforced (can't have duplicate nicknames)
- [ ] Toolbar shows "Saved" vs "Submitted" correctly
- [ ] "Vote and submit" button appears when saved but not entered ranking
