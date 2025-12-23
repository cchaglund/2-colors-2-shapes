# Feature: layer-grouping

## Description

# Layer Grouping

The user should be able to group layers together for better organization and management within the application. In the layer panel, users can select multiple layers and group them into a single group layer. Today, when you click on a layer this selects the shape. Similarly, clicking on the group heading should select all the shapes. You should be able to rename the group, just like you can rename individual layers. This feature allows for easier manipulation of multiple layers at once, such as moving, hiding, or applying effects.

![alt text](image-3.png)

---

## Implementation Summary

### Status: Completed

### Changes Made

#### 1. Type System Updates (`src/types/index.ts`)
- Added `groupId?: string` optional property to the `Shape` interface
- Created new `ShapeGroup` interface with properties:
  - `id: string` - Unique identifier
  - `name: string` - Display name (e.g., "Group 1")
  - `isCollapsed: boolean` - Whether the group is collapsed in the layer panel
  - `zIndex: number` - For ordering groups in the layer panel
- Updated `CanvasState` to include `groups: ShapeGroup[]`

#### 2. State Management (`src/hooks/useCanvasState.ts`)
Added the following group management functions:
- `createGroup(shapeIds, groupName?)` - Create a new group from selected shapes
- `deleteGroup(groupId)` - Delete a group (shapes remain but become ungrouped)
- `ungroupShapes(shapeIds)` - Remove shapes from their groups
- `renameGroup(groupId, newName)` - Rename a group
- `toggleGroupCollapsed(groupId)` - Toggle collapse/expand state
- `moveToGroup(shapeIds, groupId)` - Move shapes to a different group
- `selectGroup(groupId)` - Select all shapes in a group
- `getShapesInGroup(groupId)` - Helper to get shapes in a group

Updated localStorage migration to handle old canvas data without groups.

#### 3. Layer Panel UI (`src/components/LayerPanel.tsx`)
- Added "Group" and "Ungroup" buttons at the top of the panel
- Groups display as collapsible headers with:
  - Expand/collapse toggle (▶/▼)
  - Group icon (G)
  - Group name (editable via double-click)
  - Shape count indicator
  - Delete button (removes group, keeps shapes)
- Shapes within groups are indented for visual hierarchy
- Clicking a group header selects all shapes in that group
- Partial selection highlighting when some shapes in a group are selected

#### 4. CSS Updates (`src/index.css`)
- Added `--color-selected-partial` CSS variable for both light and dark themes to indicate partial group selection

#### 5. App Integration (`src/App.tsx`)
- Wired up all group management functions from useCanvasState to LayerPanel

### Features
- **Multi-select grouping**: Select 2+ shapes and click "Group" to create a group
- **Ungrouping**: Select grouped shapes and click "Ungroup" to remove them from the group
- **Rename groups**: Double-click on a group name to rename it
- **Collapse/expand**: Click the arrow to collapse or expand a group
- **Group selection**: Click on a group header to select all shapes in that group
- **Auto-naming**: Groups are automatically named "Group 1", "Group 2", etc.
- **Empty group cleanup**: Groups are automatically deleted when they become empty
- **Persistence**: Groups are saved to localStorage and restored on page reload
