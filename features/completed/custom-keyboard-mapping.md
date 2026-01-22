# Custom Keyboard Mapping

## Status: Implemented ✅

## Description

The app previously had hard-coded keyboard mappings for various actions (e.g., 'w' for undo instead of the standard 'z'). This feature adds customizable keyboard shortcuts that users can personalize, with settings persisted in the database for logged-in users and localStorage for anonymous users.

## Default Key Bindings

The new standard default bindings are:

| Action | Default Key | Description |
|--------|-------------|-------------|
| Undo | Z | Undo the last action |
| Redo | Shift+Z | Redo the last undone action |
| Duplicate | D | Duplicate selected shapes |
| Delete | Backspace | Delete selected shapes |
| Move Up | ↑ | Move selected shapes up (Shift for 10px) |
| Move Down | ↓ | Move selected shapes down (Shift for 10px) |
| Move Left | ← | Move selected shapes left (Shift for 10px) |
| Move Right | → | Move selected shapes right (Shift for 10px) |
| Rotate Clockwise | . (Period) | Rotate clockwise (Shift for 15°) |
| Rotate Counter-Clockwise | , (Comma) | Rotate counter-clockwise (Shift for 15°) |
| Pan | Space | Hold and drag to pan canvas |

## Implementation

### Files Created

1. **`src/constants/keyboardActions.ts`** - Keyboard action definitions, default bindings, and helper functions for key matching, formatting, and conflict detection.

2. **`src/hooks/useKeyboardSettings.ts`** - React hook for managing keyboard settings with dual storage (localStorage for anonymous users, Supabase for logged-in users).

3. **`src/components/KeyboardSettingsModal.tsx`** - Modal UI for customizing keyboard shortcuts with interactive key capture and conflict resolution.

4. **`supabase/migrations/001_keyboard_settings.sql`** - Database migration for the `keyboard_settings` table with RLS policies.

### Files Modified

1. **`src/components/Canvas.tsx`** - Updated to accept `keyMappings` prop and use dynamic key bindings instead of hard-coded keys.

2. **`src/components/Toolbar.tsx`** - Added "Customize" button in Controls section and dynamic display of current key bindings.

3. **`src/App.tsx`** - Integrated keyboard settings hook and modal.

4. **`README.md`** - Updated documentation.

## Features

- **Interactive key capture**: Click on a shortcut, then press any key to remap
- **Conflict detection**: Warns when a key is already in use and offers to replace
- **Reset to defaults**: One-click reset all shortcuts
- **Modifier key support**: Supports Ctrl, Alt, Shift, and Meta (⌘) modifiers
- **Dynamic controls display**: The Controls section in Toolbar updates to show current bindings
- **Persistence**: Anonymous users use localStorage, logged-in users sync to Supabase

## Database Schema

```sql
CREATE TABLE keyboard_settings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  mappings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id)
);
```

## Usage

1. Open the app
2. In the left toolbar, scroll to the "Controls" section
3. Click the "Customize" button
4. Click any shortcut you want to change
5. Press the new key combination
6. If there's a conflict, choose to replace or cancel
7. Click "Done" when finished

Settings are automatically saved as you make changes.
