# Convert Gallery Modal to Full Page

## Context

Gallery modal has 4 tabs of browsable content but clicking thumbnails ejects users out (new tab or page nav). No way to return to gallery. Browser back/forward don't work. The gallery has outgrown being a modal — it deserves proper page-level navigation.

## Approach

Convert the gallery modal into a full page at `?view=gallery&tab={tab}`. All thumbnail clicks become same-tab navigation. Browser back button naturally returns to the gallery.

## Changes

### 1. `src/utils/urlParams.ts` — add gallery view parser

Add `getGalleryView()` returning `{ tab?: string }` or `null` for `?view=gallery&tab=...`.

### 2. `src/components/GalleryPage.tsx` — NEW page component

Extract `Calendar.tsx` content into a full-page component (no modal wrapper).

Structure:

- "Back to app" link (same pattern as other pages)
- `CalendarViewToggle` (existing tabs component)
- Tab content: calendar grid for my-submissions/winners, `WallContent`/`FriendsFeedContent` for wall/friends
- `CalendarStats` footer

Key differences from `Calendar.tsx`:

- No fixed overlay, no click-to-close, no escape-to-close
- Page layout instead of modal
- `tab` prop from URL determines initial active tab; subsequent tab switches managed via React state + `history.replaceState()` (no full page reload)
- Thumbnail links use `<a href>` tags (not onClick + window.location.href) so Ctrl/Cmd+click opens in new tab for power users
- My Submissions day click: navigate to `?view=submission&date=...` (same tab, not `window.open`)
- Winners day click: navigate to `?view=winners-day&date=...` (same tab, shows all ranked submissions)
- Do NOT pass `onSubmissionClick` to WallContent/FriendsFeedContent — their default behavior (`window.location.href`) already does the right thing

Reuses existing sub-components:

- `CalendarViewToggle.tsx` — tabs
- `ContentNavigation.tsx` — month nav
- `CalendarGrid.tsx` — grid layout
- `CalendarDayCell.tsx` — day cells
- `CalendarStats.tsx` — stats footer
- `WallContent.tsx` — wall tab (already has `onSubmissionClick` prop)
- `FriendsFeedContent.tsx` — friends tab (already has `onSubmissionClick` prop)

### 3. `src/App.tsx` — wire up gallery page

- Add `galleryView` detection via `getGalleryView()`
- Render `<GalleryPage>` wrapped in `<FollowsProvider>` in the standalone pages section (doesn't need challenge data). Friends tab needs follow data.
- Remove `showCalendar` state and Calendar modal rendering
- Remove `Calendar` import and old `FollowsProvider` wrapper for it

### 4. `src/components/Toolbar.tsx` — Gallery button navigates

- Change from `onClick={onOpenCalendar}` to `window.location.href = '/?view=gallery'`
- Remove login gate — gallery has public tabs (winners, wall); page handles auth per tab
- Remove `onOpenCalendar` prop

### 5. Delete `src/components/Calendar/Calendar.tsx`

Modal version replaced by `GalleryPage`. Sub-components in `Calendar/` folder stay.

### 6. `src/components/UserProfilePage.tsx` — fix new-tab nav

Line 112: change `window.open(url, '_blank')` to `window.location.href = url`

### 7. `src/components/WinnersDayPage.tsx` — fix new-tab nav

Lines 30-37: change `window.open(url, '_blank')` to `window.location.href = url` (same inconsistency as UserProfilePage)

### 8. Clean up Toolbar props

- Remove `onOpenCalendar` from Toolbar interface
- Remove from `App.tsx` Toolbar usage

## Navigation Flow (after changes)

```
Canvas (/) → click "Gallery" → /?view=gallery&tab=my-submissions
  → click submission thumbnail → /?view=submission&id=xxx
  → browser Back → returns to /?view=gallery&tab=my-submissions
  → "Back to app" link → /
```

## Files

| File | Action |
|------|--------|
| `src/components/GalleryPage.tsx` | NEW |
| `src/utils/urlParams.ts` | Add `getGalleryView()` |
| `src/App.tsx` | Add gallery route, remove modal state |
| `src/components/Toolbar.tsx` | Gallery button navigates, remove `onOpenCalendar` prop |
| `src/components/Calendar/Calendar.tsx` | DELETE |
| `src/components/UserProfilePage.tsx` | Same-tab navigation |
| `src/components/WinnersDayPage.tsx` | Same-tab navigation |

## Verification

- Gallery button → opens gallery page (not modal)
- All 4 tabs work, switching tabs works
- Click thumbnail in any tab → navigates to submission in same tab
- Browser back → returns to gallery at correct tab
- "Back to app" from gallery → returns to canvas
- Direct URL `?view=gallery&tab=wall` → opens gallery at wall tab
- Profile page → click submission → same tab (not new tab)
- Non-logged-in user can access gallery (winners/wall tabs work, my-submissions/friends tabs disabled with tooltip — same as current CalendarViewToggle behavior)
- WinnersDayPage → click submission → same tab (not new tab)

## Decisions

- Tab switching updates URL (`?view=gallery&tab=friends`) via `history.replaceState` for shareability — no full page reload
- Winners tab: clicking a winner cell navigates to WinnersDayPage (same-tab) to show all ranked submissions
- Thumbnail links are `<a>` tags so Ctrl/Cmd+click opens in new tab (preserves power-user multi-browsing workflow)
- Auth-required tabs (my-submissions, friends): keep existing disabled-tab-with-tooltip behavior for logged-out users
- GalleryPage does NOT pass `onSubmissionClick` to WallContent/FriendsFeedContent — default behavior is correct
