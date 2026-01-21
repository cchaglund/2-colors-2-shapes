# Friends/Follow System - Implementation Plan

> **Entry point:** Use [MASTER.md](./MASTER.md) to automatically determine which task to work on next.

**Tasks file:** `features/friends-feature-tasks.json`
**Shared context:** [social-features-meta-plan.md](./social-features-meta-plan.md)

---

## Overview

A one-way follow system (like Twitter/X) where users can follow other artists to see their public submissions. Following is instant - no acceptance required. "Friends" in the UI refers to people you follow.

**Key Design Decisions:**
- One-way follow model (instant, no friend requests)
- Show both Following AND Followers tabs
- Show empty cell (just date number) for days without public submissions
- Count badge in Friends Feed calendar (e.g., "5 friends posted")
- NO Calendar refactor — add tabs to existing Calendar/

---

## Privacy Rules (CRITICAL)

These apply to ALL social features - see meta plan for details:

1. **Only show public submissions** - `included_in_ranking = true`
2. **Current day restriction** - Can't see others' submissions until you've saved your own
3. **Past days are always visible** (for public submissions)

---

## Database Schema

### New Table: `follows`

**File**: `supabase/migrations/XXX_follows.sql`

```sql
-- Follows Feature Migration
-- Implements one-way follow system (like Twitter)

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

## Implementation Phases

### Phase 1: Database Migration

1. Create migration file with table + RLS + helper function
2. Test RLS policies in Supabase SQL Editor
3. Deploy: `supabase db push`

---

### Phase 2: FollowsContext (Global React Context)

> **Architecture Decision:** Use a global React Context instead of a per-component hook. See meta-plan for rationale.

**File**: `src/contexts/FollowsContext.tsx`

```typescript
interface FollowsContextValue {
  // Data
  following: FollowUser[];
  followers: FollowUser[];
  followingIds: Set<string>;        // O(1) lookup
  followingCount: number;
  followersCount: number;

  // Methods
  isFollowing: (userId: string) => boolean;
  follow: (userId: string) => Promise<{ success: boolean; error?: string }>;
  unfollow: (userId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;

  // State
  loading: boolean;
  actionLoading: boolean;
}

interface FollowUser {
  id: string;
  nickname: string;
  followedAt: string;
}
```

**Key Implementation Details:**

1. **Global Provider** - Wrap app in `<FollowsProvider>` in App.tsx
2. **Optimistic Updates** - Update local state immediately, rollback on error
3. **O(1) Lookup** - Maintain `Set<string>` for `isFollowing()` checks
4. **Follow Limit** - Hard cap at 500 users, reject follows beyond limit
5. **Batch Profile Fetching** - Fetch profiles separately from follows (avoid RLS join issues)

**Follow Limit Enforcement:**
```typescript
async function follow(targetUserId: string) {
  if (followingIds.size >= 500) {
    return { success: false, error: 'You can follow a maximum of 500 users' };
  }
  // ... proceed with optimistic update and API call
}
```

---

### Phase 3: FollowButton Component

**File**: `src/components/FollowButton.tsx`

```typescript
interface FollowButtonProps {
  targetUserId: string;
  size?: 'sm' | 'md';
}
```

**States:**
| State | Appearance | Hover |
|-------|------------|-------|
| Not logged in | Disabled, tooltip "Sign in to follow" | - |
| Not following | "Follow" - accent color | Darker accent |
| Following | "Following" - muted bg | "Unfollow" - red text |
| Loading | Disabled + spinner | - |

**Styling (matches existing patterns):**
```css
/* Follow state */
.follow-btn {
  background: var(--color-accent);
  color: white;
}
.follow-btn:hover {
  background: var(--color-accent-hover);
}

/* Following state */
.following-btn {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}
.following-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
```

**Placement:**
- SubmissionDetailPage: Next to `@{nickname}` text
- UserProfilePage: In profile header
- FriendsModal: Each row in lists

---

### Phase 4: FriendsModal

**File**: `src/components/modals/FriendsModal.tsx`

**Structure:**
```
src/components/modals/
  FriendsModal.tsx       # Modal container + tab switching
  FriendsModalTabs.tsx   # Tab toggle (Following/Followers)
  FriendsList.tsx        # List of FollowUser items
  FriendRow.tsx          # Single user row with FollowButton
  UserSearchBar.tsx      # Search input with debounce
```

**Features:**
1. **Two tabs:** Following / Followers
2. **User search:** Debounced (300ms) search by nickname
3. **Each row:** Nickname + Follow/Unfollow button
4. **Click nickname:** Navigate to user's profile (closes modal)
5. **"See friends' submissions →" button:** Closes modal, opens Calendar with Friends tab

**Empty States:**
- Not logged in: "Please sign in to manage friends"
- Following tab: "You're not following anyone yet. Search for artists above."
- Followers tab: "No followers yet. Create art and others will find you!"
- Search no results: "No users found matching '{query}'"

**Search Query:**
```typescript
const { data } = await supabase
  .from('profiles')
  .select('id, nickname')
  .ilike('nickname', `%${searchTerm}%`)
  .neq('id', currentUserId)  // Don't show self
  .limit(20);
```

---

### Phase 5: User Profile Page

**File**: `src/components/UserProfilePage.tsx`

**URL**: `?view=profile&user=USER_ID`

**Layout:**
```
┌─────────────────────────────────────────┐
│ ← Back to app                           │
├─────────────────────────────────────────┤
│ @username                    [Follow]   │
│ 42 following · 108 followers            │
├─────────────────────────────────────────┤
│     < January 2026 >    [Today]         │
│ ┌───┬───┬───┬───┬───┬───┬───┐         │
│ │Sun│Mon│Tue│Wed│Thu│Fri│Sat│         │
│ ├───┼───┼───┼───┼───┼───┼───┤         │
│ │   │   │ 1 │ 2 │ 3 │ 4 │ 5 │         │
│ │   │   │[T]│[T]│   │[T]│   │         │  [T] = thumbnail
│ └───┴───┴───┴───┴───┴───┴───┘         │
└─────────────────────────────────────────┘
```

**Day Cell States:**
| Condition | Display |
|-----------|---------|
| Public submission exists | Thumbnail (clickable) |
| No public submission | Empty (just date number) |
| Current day, viewer hasn't saved | Locked message |
| Future date | Grayed out |

**Data Query:**
```typescript
const { data } = await supabase
  .from('submissions')
  .select('id, challenge_date, shapes, background_color_index')
  .eq('user_id', targetUserId)
  .eq('included_in_ranking', true)
  .order('challenge_date', { ascending: false });
```

**Error Handling:**
```typescript
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

---

### Phase 6: Friends Feed Tab

**Files:**
```
src/components/Calendar/tabs/
  FriendsFeedTab.tsx           # Tab wrapper

src/components/FriendsFeed/
  FriendsFeedContent.tsx       # Shared content (modal + standalone)
  FriendsFeedPage.tsx          # Standalone page for URL access

src/hooks/
  useFriendsFeed.ts            # Data fetching with caching
```

**Default View (Grid):**
- Shows friends' submissions for selected date
- Same grid layout as Wall of the Day
- Same sorting options (Random, Newest, Oldest, Ranked for n-2+)
- Same pagination (100 limit, "Load more")
- Click submission → SubmissionDetailPage

**Calendar View:**
- Day cells show COUNT BADGE (number of friends who posted)
- Click day → Shows that day's friends' submissions

**Badge Implementation:**
```typescript
{friendCount > 0 && (
  <span className="absolute top-1 right-1 bg-(--color-accent) text-white
                   text-[10px] font-medium rounded-full min-w-[18px] h-[18px]
                   flex items-center justify-center">
    {friendCount}
  </span>
)}
```

**Empty States:**
- Not logged in: "Please sign in to see friends' submissions"
- No friends: "Follow some artists to see their work here"
- Friends but no submissions for date: "None of your friends posted on this day"

---

### Phase 7: URL Routing

**File**: `src/utils/urlParams.ts`

```typescript
export function getProfileView(): { view: 'profile'; userId: string } | null {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'profile') {
    const userId = urlParams.get('user');
    if (userId) return { view: 'profile', userId };
  }
  return null;
}

export function getFriendsFeedView(): { view: 'friends-feed'; date: string } | null {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'friends-feed') {
    const date = urlParams.get('date') || getTodayDateUTC();
    return { view: 'friends-feed', date };
  }
  return null;
}
```

**File**: `src/App.tsx`

```typescript
const profileView = useMemo(() => getProfileView(), []);
const friendsFeedView = useMemo(() => getFriendsFeedView(), []);

if (profileView) return <UserProfilePage userId={profileView.userId} />;
if (friendsFeedView) return <FriendsFeedPage date={friendsFeedView.date} />;
```

---

### Phase 8: Integration Points

#### Toolbar.tsx
Add "Friends" button (only visible when logged in):
```typescript
{user && (
  <button onClick={() => setShowFriendsModal(true)} className="...">
    Friends
  </button>
)}
```

#### SubmissionDetailPage.tsx
Make nickname clickable + add FollowButton:
```typescript
<div className="flex items-center gap-2">
  {nickname && (
    <>
      <button
        onClick={() => window.location.href = `?view=profile&user=${submission.user_id}`}
        className="text-[13px] text-(--color-text-secondary) hover:text-(--color-accent)"
      >
        @{nickname}
      </button>
      {user && user.id !== submission.user_id && (
        <FollowButton targetUserId={submission.user_id} size="sm" />
      )}
    </>
  )}
</div>
```

#### Calendar.tsx
Add Friends tab:
```typescript
type ViewMode = 'my-submissions' | 'winners' | 'wall' | 'friends';

{effectiveViewMode === 'friends' && <FriendsFeedTab />}
```

---

## Types to Add

**File**: `src/types/index.ts`

```typescript
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowUser {
  id: string;
  nickname: string;
  followedAt: string;
}

export interface FollowCounts {
  following_count: number;
  followers_count: number;
}

export interface FriendsSubmission {
  id: string;
  user_id: string;
  nickname: string;
  shapes: Shape[];
  groups: ShapeGroup[];
  background_color_index: number | null;
  created_at: string;
}
```

---

## File Summary

### New Files
```
supabase/migrations/
  XXX_follows.sql

src/hooks/
  useFollows.ts
  useFriendsFeed.ts
  useUserProfile.ts

src/components/
  FollowButton.tsx
  UserProfilePage.tsx

src/components/modals/
  FriendsModal.tsx
  FriendsModalTabs.tsx
  FriendsList.tsx
  FriendRow.tsx
  UserSearchBar.tsx

src/components/Calendar/tabs/
  FriendsFeedTab.tsx

src/components/FriendsFeed/
  FriendsFeedPage.tsx
  FriendsFeedContent.tsx
```

### Modified Files
```
src/utils/urlParams.ts          # Add getProfileView, getFriendsFeedView
src/types/index.ts              # Add Follow types
src/App.tsx                     # Add routing + FriendsModal state
src/components/Toolbar.tsx      # Add Friends button
src/components/Calendar/Calendar.tsx           # Add 'friends' view mode
src/components/Calendar/CalendarViewToggle.tsx # Add Friends tab button
src/components/Calendar/types.ts               # Extend ViewMode
src/components/SubmissionDetailPage.tsx        # Clickable nickname + FollowButton
```

---

## Implementation Order

```
Phase 1: Database Migration
    │
    ▼
Phase 2: useFollows Hook
    │
    ├──▶ Phase 3: FollowButton Component
    │
    ├──▶ Phase 4: FriendsModal
    │
    └──▶ Phase 5: User Profile Page
              │
              ▼
         Phase 6: Friends Feed Tab
              │
              ▼
         Phase 7: URL Routing
              │
              ▼
         Phase 8: Integration Points
```

**Dependencies:**
- Phase 3-5 can be done in parallel after Phase 2
- Phase 6 depends on Wall of the Day being complete (reuses patterns)
- Phase 8 ties everything together

---

## Verification Checklist

### Database
- [ ] `follows` table created with correct schema
- [ ] RLS policies work: can follow, can't follow as someone else
- [ ] Self-follow prevented by CHECK constraint
- [ ] `count_friends_submissions_by_date` RPC works

### useFollows Hook
- [ ] Fetches following/followers lists with nicknames
- [ ] `isFollowing()` returns correct boolean
- [ ] `follow()` works with optimistic update
- [ ] `unfollow()` works with optimistic update
- [ ] Handles errors gracefully, rolls back on failure
- [ ] Caching prevents redundant fetches

### FollowButton
- [ ] Disabled with tooltip when not logged in
- [ ] Shows "Follow" when not following
- [ ] Shows "Following" when following
- [ ] Hover shows "Unfollow" with red styling
- [ ] Loading state disables button

### FriendsModal
- [ ] Opens from Toolbar button (logged in only)
- [ ] Shows "Please sign in" when logged out
- [ ] Tab switching works (Following/Followers)
- [ ] Search finds users by nickname (debounced)
- [ ] Click user row → navigates to profile
- [ ] "See friends' submissions →" button works
- [ ] Empty states display correctly
- [ ] Modal closes on Escape and backdrop click

### User Profile Page
- [ ] `?view=profile&user=USER_ID` loads correctly
- [ ] Shows "User not found" with back link for invalid ID
- [ ] Shows correct nickname and follow counts
- [ ] FollowButton works (hidden on own profile)
- [ ] Calendar shows only PUBLIC submissions
- [ ] Empty cells for days without public submissions
- [ ] Current day locked if viewer hasn't saved
- [ ] Click submission → opens SubmissionDetailPage

### Friends Feed
- [ ] Tab appears in Calendar modal
- [ ] Shows "Please sign in" when logged out
- [ ] Shows friends' submissions for date
- [ ] Sorting works (Random, Newest, Oldest, Ranked)
- [ ] Calendar picker shows count badges
- [ ] Empty states display correctly
- [ ] Privacy rules enforced

### Security
- [ ] Can't see private submissions
- [ ] Can't see current day until saved own art
- [ ] Can't follow yourself
- [ ] Can't create follows as another user
- [ ] Can't view Friends features while logged out

---

## Design Notes

Following existing codebase patterns:

**Button styling:**
- Primary: `bg-(--color-accent) hover:bg-(--color-accent-hover)`
- Secondary: `bg-(--color-bg-secondary) border border-(--color-border)`
- Text: `text-[13px] font-medium`

**Modal styling:**
- Overlay: `fixed inset-0 bg-(--color-modal-overlay) z-50`
- Content: `bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6`
- Max width: `max-w-lg` for FriendsModal

**Typography:**
- Nicknames: `@{nickname}` with @ prefix
- Sizes: 13px for body, 11px for labels
