# Dark Mode Feature

## Description
Implement a dark mode feature that allows users to toggle between light and dark themes for the application interface. The dark mode should adjust background colors, text colors, and UI element styles to provide a comfortable viewing experience in low-light environments. The toggle should be accessible from the main toolbar, and the user's preference should be saved and persisted across sessions. There should also be an automatic option to switch themes based on system settings. The implementation should ensure that all components of the application are styled appropriately for both themes, maintaining usability and aesthetic consistency. The setting can be placed in the left sidebar toolbar area. Only the day's challenge's colors remain unchanged in dark mode.

---

## Implementation Summary

### Files Created
- **[src/hooks/useThemeState.ts](src/hooks/useThemeState.ts)** - Custom hook for theme state management with localStorage persistence and system theme detection
- **[src/components/ThemeToggle.tsx](src/components/ThemeToggle.tsx)** - UI component for switching between Light, Dark, and Auto (system) themes

### Files Modified
- **[src/index.css](src/index.css)** - Added CSS custom properties (variables) for light and dark themes
- **[src/App.tsx](src/App.tsx)** - Integrated theme state hook and updated modal styling
- **[src/components/Toolbar.tsx](src/components/Toolbar.tsx)** - Added theme toggle section and updated all styles to use CSS variables
- **[src/components/LayerPanel.tsx](src/components/LayerPanel.tsx)** - Updated all styles to use CSS variables
- **[src/components/ZoomControls.tsx](src/components/ZoomControls.tsx)** - Updated styles to use CSS variables
- **[src/components/Canvas.tsx](src/components/Canvas.tsx)** - Updated border color to use CSS variables

### Technical Approach

#### 1. Theme State Management (`useThemeState` hook)
- Three theme modes: `light`, `dark`, and `system` (auto)
- Persists user preference to `localStorage` under key `theme-preference`
- Listens for system theme changes via `matchMedia('(prefers-color-scheme: dark)')`
- Applies theme by adding/removing `dark` class on `document.documentElement`

#### 2. CSS Variables System
Light theme variables:
```css
--color-bg-primary: #ffffff
--color-bg-secondary: #f5f5f5
--color-bg-tertiary: #e5e5e5
--color-text-primary: #213547
--color-text-secondary: #6b7280
--color-text-tertiary: #9ca3af
--color-border: #d1d5db
--color-hover: #e5e5e5
--color-selected: #dbeafe
--color-overlay: rgba(255, 255, 255, 0.9)
--color-modal-overlay: rgba(0, 0, 0, 0.5)
--color-modal-bg: #ffffff
--color-checkered-bg: #e0e0e0
--color-checkered-pattern: #d0d0d0
```

Dark theme variables (applied via `:root.dark`):
```css
--color-bg-primary: #1a1a1a
--color-bg-secondary: #262626
--color-bg-tertiary: #333333
--color-text-primary: #e5e5e5
--color-text-secondary: #a3a3a3
--color-text-tertiary: #737373
--color-border: #404040
--color-hover: #333333
--color-selected: #1e3a5f
--color-overlay: rgba(38, 38, 38, 0.95)
--color-modal-overlay: rgba(0, 0, 0, 0.7)
--color-modal-bg: #262626
--color-checkered-bg: #2a2a2a
--color-checkered-pattern: #333333
```

#### 3. Theme Toggle UI
Located in the left sidebar toolbar under the "Theme" section with three buttons:
- **Light** - Forces light theme
- **Dark** - Forces dark theme  
- **Auto** - Follows system preference

#### 4. Preserved Elements
The daily challenge colors (shapes and color swatches) remain unchanged in both themes as specified in the requirements.

### Features
- Smooth transitions between themes
- Automatic theme detection based on OS/browser settings
- Persistent preference across browser sessions
- All UI components properly styled for both themes
- Canvas checkered background adapts to theme
- Modal dialogs styled appropriately for both themes
