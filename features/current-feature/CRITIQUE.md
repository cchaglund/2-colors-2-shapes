# Critique: Convert Gallery Modal to Full Page

## The Elephant in the Room: No Client-Side Router

This app has no router. Every `window.location.href` is a **full page reload**. The PRD cheerfully claims tab switching will "update URL without full page reload" (GALLERY-003) but provides zero mechanism for this. You have two options:

1. Tab switching uses `window.location.href` — full reload every time you tap a tab. Congrats, you've made the gallery strictly worse than the modal.
2. Tab switching uses `history.replaceState` — this breaks the pattern used by every other view param in the app, and `useMemo(() => getGalleryView(), [])` with empty deps means URL changes after mount are invisible to React.

Neither option is addressed. This is the single biggest gap in the entire PRD.

## UX Regression: Browse-and-Return is Worse Now

Current modal behavior: click thumbnail → opens in new tab → modal stays open → keep browsing. You can open 5 submissions in background tabs while scanning the gallery.

New behavior: click thumbnail → full page reload to submission → press back → full page reload back to gallery (cold start, all data re-fetched, scroll position lost, month navigation reset).

You've traded "modal is annoying" for "browsing multiple submissions is painful." The feature request correctly identifies the modal's exit problem but the cure may be worse than the disease for power users who browse multiple submissions.

## State Destruction on Every Navigation

The calendar tabs maintain:
- Current month (via ContentNavigation)
- Loaded submission/winner data
- Scroll position (especially Wall tab with potentially many items)
- Any pagination/infinite scroll state

Every `window.location.href` navigation destroys all of this. Navigate to a submission and back? You're starting from scratch. The PRD doesn't mention any state persistence strategy.

## WinnersDayPage Also Opens New Tabs

The feature request fixes `UserProfilePage` line 112 (`window.open` → `window.location.href`) but ignores that `WinnersDayPage` (lines 30-37) does the **exact same thing** — opens submissions via `window.open('...', '_blank')`. If same-tab navigation is the goal, this is an inconsistency.

## FollowsProvider: Where Does It Go?

Calendar modal is wrapped in `FollowsProvider` in App.tsx. The feature request says to remove this wrapper. But `FriendsFeedContent` (used in the Friends tab) presumably needs follow data. Does `GalleryPage` wrap itself in `FollowsProvider`? Does it only wrap the Friends tab? Not specified.

Look at how `FriendsFeedPage` is rendered in App.tsx — it's wrapped in `FollowsProvider`. The gallery page will need the same treatment, either internally or in App.tsx. The PRD says to remove the wrapper and never mentions adding one back.

## WallContent/FriendsFeedContent: Prop Strategy Unspecified

Both components have an `onSubmissionClick` prop with fallback to `window.location.href` default behavior. The PRD lists the exact navigation URLs that match the default behavior, suggesting we don't pass the prop. But it never explicitly says this. An implementer might wire up redundant `onSubmissionClick` handlers that duplicate the default, or worse, break it.

## No Loading States

GalleryPage cold-starts on every visit. The modal could piggyback on already-loaded app state. A full page needs to:
- Show loading indicators per tab
- Handle the flash of empty content on initial load
- Deal with the fact that switching tabs via URL (if using full reloads) means re-loading everything

None of this is mentioned.

## Auth Tab Behavior is Vague

GALLERY-009 says my-submissions and friends tabs "show login prompt or redirect" for logged-out users. Which is it? A login prompt inline? A redirect to...where? The current `CalendarViewToggle` disables these tabs with a tooltip for logged-out users. Is that behavior preserved? Changed? The PRD lists two contradictory approaches ("login prompt" vs "redirect") as if they're interchangeable.

## Missing: Mobile/Responsive Considerations

The modal had specific viewport-aware styling (full-screen overlay, centered content). A full page has different responsive needs. No mention of mobile layout, breakpoints, or how the tab bar behaves on small screens.

## The `useMemo` Empty Deps Problem

Every view parser in App.tsx uses `useMemo(() => getXxxView(), [])`. This means URL params are read exactly once on mount. If you implement tab switching via `history.pushState`/`replaceState` (to avoid full reloads), App.tsx will never re-render to pick up the change. You'd need to either:
- Not use the `useMemo` pattern for gallery (breaks consistency)
- Add a `popstate` listener (not mentioned)
- Accept full reloads (back to the elephant)

## Unresolved Questions

1. How does tab switching update the URL without a full page reload given no router exists?
2. What state persistence strategy prevents data loss on back-navigation?
3. Should `WinnersDayPage` submission clicks also be converted to same-tab?
4. Where does `FollowsProvider` go for the Friends tab?
5. Logged-out users on auth-required tabs: disable tabs (current), show inline prompt, or redirect?
6. Is the loss of multi-submission browsing (open in background tabs) acceptable?
