# Feature: calendar

## Description

Create a calendar view to browse past daily challenges and submissions. I want to be able to see my progress over time and revisit old challenges easily. I want to see a grid layout of days (like a calendar) which shows a thumbnail of my submission for each day I completed. Clicking on a day should open a page in a new tab which shows the image in a larger view with options to download or share it (as both a png and svg). That view should also show the date and the shapes/colors used that day. Ideally, the calendar should allow me to navigate between months and years to explore my history of submissions. If the user hasn't submitted anything on a given day, that day should be grayed out or show a placeholder indicating no submission.

## Implementation Summary

### Components Created

1. **Calendar.tsx** - Main calendar modal component
   - Month/year navigation with previous/next buttons
   - "Today" button to jump to current month
   - 7-column grid layout showing days of the week
   - Thumbnail previews of submissions for each day
   - Stats showing total submissions and first submission date
   - Days without submissions show "No submission" placeholder
   - Future days are grayed out and non-clickable

2. **CalendarDay** - Integrated into Calendar component
   - Shows day number and submission thumbnail
   - Today is highlighted with a blue ring
   - Clickable days with submissions open detail view in new tab

3. **SubmissionThumbnail.tsx** - Reusable thumbnail renderer
   - Renders a miniature version of a submission's SVG
   - Configurable size (default 100px)
   - Used in both calendar grid and could be reused elsewhere

4. **SubmissionDetailPage.tsx** - Full submission view page
   - Accessible via URL: `?view=submission&date=YYYY-MM-DD`
   - Opens in new tab when clicking a calendar day
   - Shows full-size submission artwork
   - Displays challenge details (colors and shapes used)
   - Submission stats (shapes used, submission date)
   - Export options:
     - Download PNG (2x resolution for retina displays)
     - Download SVG (vector format)
     - Copy share link

### Integration

- **Toolbar.tsx** - Added "My Submissions" button (calendar icon)
  - Only visible when user is logged in
  - Opens the calendar modal

- **App.tsx** - Routing and state management
  - Added `showCalendar` state for modal visibility
  - Added URL parameter handling for submission detail view
  - Calendar modal renders on top of main app

### User Flow

1. User clicks "My Submissions" button in toolbar (must be logged in)
2. Calendar modal opens showing current month
3. User navigates between months using arrow buttons
4. Days with submissions show thumbnail previews
5. Clicking a day with a submission opens detail page in new tab
6. Detail page shows full artwork with export/share options

### Files Modified/Created

- `src/components/Calendar.tsx` (new)
- `src/components/SubmissionThumbnail.tsx` (new)
- `src/components/SubmissionDetailPage.tsx` (new)
- `src/components/Toolbar.tsx` (modified - added calendar button)
- `src/App.tsx` (modified - added routing and calendar state)
