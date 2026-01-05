import type { DailyChallenge, ShapeType } from '../types';
import type { ThemeMode } from '../hooks/useThemeState';
import type { Profile } from '../hooks/useProfile';
import { getShapeSVGData } from '../utils/shapeHelpers';
import { ThemeToggle } from './ThemeToggle';
import { AuthButton } from './AuthButton';
import { type KeyMappings, formatKeyBinding } from '../constants/keyboardActions';

// Card wrapper for sidebar sections
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-3 rounded-lg bg-(--color-card-bg) shadow-(--shadow-card) ${className}`}>
      {children}
    </div>
  );
}

// Small shape preview component for the toolbar
function ShapePreviewIcon({ type, size = 20 }: { type: ShapeType; size?: number; }) {
  const { element, props } = getShapeSVGData(type, size);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {element === 'ellipse' && <ellipse {...props} fill="currentColor" />}
      {element === 'rect' && <rect {...props} fill="currentColor" />}
      {element === 'polygon' && <polygon {...props} fill="currentColor" />}
      {element === 'path' && <path {...props} fill="currentColor" />}
    </svg>
  );
}

interface ToolbarProps {
  challenge: DailyChallenge;
  backgroundColorIndex: 0 | 1 | null;
  selectedShapeIds: Set<string>;
  onAddShape: (shapeIndex: 0 | 1, colorIndex: 0 | 1) => void;
  onSetBackground: (colorIndex: 0 | 1 | null) => void;
  onChangeShapeColor: (colorIndex: 0 | 1) => void;
  onReset: () => void;
  isOpen: boolean;
  width: number;
  onToggle: () => void;
  onStartResize: (e: React.MouseEvent) => void;
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
  // Save functionality
  isLoggedIn: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'saved' | 'error';
  hasSubmittedToday?: boolean;
  // Calendar
  onOpenCalendar?: () => void;
  // Keyboard settings
  keyMappings: KeyMappings;
  onOpenKeyboardSettings?: () => void;
  // Profile for AuthButton
  profile?: Profile | null;
  profileLoading?: boolean;
  // Grid toggle
  showGrid?: boolean;
  onToggleGrid?: () => void;
}

export function Toolbar({
  challenge,
  backgroundColorIndex,
  selectedShapeIds,
  onAddShape,
  onSetBackground,
  onChangeShapeColor,
  onReset,
  isOpen,
  width,
  onToggle,
  onStartResize,
  themeMode,
  onSetThemeMode,
  isLoggedIn,
  onSave,
  isSaving,
  saveStatus,
  hasSubmittedToday,
  onOpenCalendar,
  keyMappings,
  onOpenKeyboardSettings,
  profile,
  profileLoading,
  showGrid,
  onToggleGrid,
}: ToolbarProps) {
  const hasSelection = selectedShapeIds.size > 0;

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          className="absolute left-0 top-4 z-10 rounded-r-lg px-2 py-4 cursor-pointer transition-all bg-(--color-bg-secondary) shadow-(--shadow-panel) hover:bg-(--color-hover)"
          onClick={onToggle}
          title="Show Toolbar"
        >
          <span className="text-sm text-(--color-text-secondary)">›</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="p-4 overflow-y-auto shrink-0 relative flex flex-col gap-4 z-10 bg-(--color-bg-secondary) shadow-(--shadow-panel)"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors"
        onMouseDown={onStartResize}
      />

      {/* Collapse button at top */}
      <div className="flex justify-end -mt-1 -mb-2">
        <button
          className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer rounded transition-colors text-(--color-text-tertiary) hover:text-(--color-text-secondary) hover:bg-(--color-hover)"
          onClick={onToggle}
          title="Hide Toolbar"
        >
          ‹
        </button>
      </div>

      {/* Account Section */}
      <Card>
        <h4 className="m-0 mb-3 text-xs uppercase text-(--color-text-tertiary)">Account</h4>
        <AuthButton profile={profile} profileLoading={profileLoading} />

        {isLoggedIn && onOpenCalendar && (
          <button
            className="w-full mt-3 py-2.5 px-4 border-none rounded-md cursor-pointer text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-(--color-bg-tertiary) text-(--color-text-primary) hover:bg-(--color-hover)"
            onClick={onOpenCalendar}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Calendar
          </button>
        )}
      </Card>

      {/* Today's Challenge Section */}
      <Card>
        <h3 className="m-0 text-base text-(--color-text-primary)">Today's Challenge</h3>
        <p className="mt-1 mb-3 text-sm text-(--color-text-secondary)">{challenge.date}</p>

        {/* Daily Word */}
        <div className="mb-4 pb-3 border-b border-(--color-border-light)">
          <h4 className="m-0 mb-1 text-xs uppercase text-(--color-text-tertiary)">Inspiration</h4>
          <p className="m-0 text-lg font-medium italic text-(--color-text-primary) capitalize">"{challenge.word}"</p>
        </div>

        <h4 className="m-0 mb-2 text-xs uppercase text-(--color-text-tertiary)">Colors</h4>
        <div className="flex gap-2 mb-3">
          {challenge.colors.map((color, index) => (
            <button
              key={index}
              className={`w-10 h-10 rounded-lg border-2 border-(--color-border-light) transition-transform ${hasSelection
                  ? 'cursor-pointer hover:scale-110 hover:shadow-md'
                  : 'cursor-default'
                }`}
              style={{ backgroundColor: color }}
              title={hasSelection ? `Change selected shape(s) to ${color}` : color}
              onClick={() => hasSelection && onChangeShapeColor(index as 0 | 1)}
              disabled={!hasSelection}
            />
          ))}
        </div>
        {hasSelection && (
          <p className="mt-0 mb-0 text-xs text-(--color-text-tertiary)">Click a color to change selected shape(s)</p>
        )}
      </Card>

      {/* Background Section */}
      <Card>
        <h4 className="m-0 mb-2 text-xs uppercase text-(--color-text-tertiary)">Background</h4>
        <div className="flex gap-2">
          <button
            className={`w-10 h-10 rounded-lg cursor-pointer text-base transition-transform hover:scale-105 bg-white border-2 text-(--color-text-tertiary) ${
              backgroundColorIndex === null
                ? 'border-(--color-accent) shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_30%,transparent)]'
                : 'border-(--color-border-light) shadow-none'
            }`}
            onClick={() => onSetBackground(null)}
            title="White background"
          >
            {backgroundColorIndex === null ? '✓' : ''}
          </button>
          {challenge.colors.map((color, index) => (
            <button
              key={index}
              className={`w-10 h-10 rounded-lg cursor-pointer text-base transition-transform hover:scale-105 border-2 text-(--color-text-tertiary) ${
                backgroundColorIndex === index
                  ? 'border-(--color-accent) shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-accent)_30%,transparent)]'
                  : 'border-(--color-border-light) shadow-none'
              }`}
              onClick={() => onSetBackground(index as 0 | 1)}
              style={{ backgroundColor: color }}
              title={`${color} background`}
            >
              {backgroundColorIndex === index ? '✓' : ''}
            </button>
          ))}
        </div>
      </Card>

      {/* Add Shape Section */}
      <Card>
        <h4 className="m-0 mb-2 text-xs uppercase text-(--color-text-tertiary)">Add Shape</h4>
        <div className="flex flex-col gap-2">
          {challenge.shapes.map((shapeData, shapeIndex) => (
            <div key={shapeData.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-(--color-text-secondary)">
                  <ShapePreviewIcon type={shapeData.type} size={18} />
                </span>
                <span className="text-sm text-(--color-text-primary)">{shapeData.name}</span>
              </div>
              <div className="flex gap-1">
                {challenge.colors.map((color, colorIndex) => (
                  <button
                    key={colorIndex}
                    className="w-8 h-8 rounded-md cursor-pointer text-lg font-bold text-white/90 drop-shadow-sm transition-transform hover:scale-110 hover:shadow-md border-2 border-(--color-border-light)"
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      onAddShape(shapeIndex as 0 | 1, colorIndex as 0 | 1)
                    }
                    title={`Add ${shapeData.name} with ${color}`}
                  >
                    +
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions Section */}
      <Card>
        {isLoggedIn && onSave && (
          <button
            className="w-full py-2.5 px-4 text-white border-none rounded-md cursor-pointer text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-(--color-accent) hover:bg-(--color-accent-hover)"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : hasSubmittedToday ? 'Update Creation' : 'Save Creation'}
          </button>
        )}
        {saveStatus === 'error' && (
          <p className="mt-1 mb-0 text-xs text-(--color-danger)">Failed to save. Try again.</p>
        )}

        <button
          className={`w-full py-2.5 px-4 text-white border-none rounded-md cursor-pointer text-sm font-medium transition-colors bg-(--color-danger) hover:bg-(--color-danger-hover) ${isLoggedIn && onSave ? 'mt-2' : ''}`}
          onClick={onReset}
        >
          Reset Canvas
        </button>
      </Card>

      {/* View Section */}
      <Card>
        <h4 className="m-0 mb-2 text-xs uppercase text-(--color-text-tertiary)">View</h4>
        <button
          className={`flex items-center gap-2 w-full py-2 px-3 rounded-md cursor-pointer text-sm transition-colors text-(--color-text-primary) hover:bg-(--color-hover) ${
            showGrid
              ? 'bg-(--color-bg-tertiary) border border-(--color-border)'
              : 'bg-transparent border border-transparent'
          }`}
          onClick={onToggleGrid}
          title={`${showGrid ? 'Hide' : 'Show'} grid lines (${keyMappings.toggleGrid ? formatKeyBinding(keyMappings.toggleGrid) : 'G'})`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {/* Grid icon - 3x3 grid */}
            <line x1="5.5" y1="1" x2="5.5" y2="15" />
            <line x1="10.5" y1="1" x2="10.5" y2="15" />
            <line x1="1" y1="5.5" x2="15" y2="5.5" />
            <line x1="1" y1="10.5" x2="15" y2="10.5" />
          </svg>
          <span>Grid Lines</span>
          {showGrid && <span className="ml-auto text-xs text-(--color-text-tertiary)">On</span>}
        </button>
      </Card>

      {/* Controls Section */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h4 className="m-0 text-xs uppercase text-(--color-text-tertiary)">Controls</h4>
          {onOpenKeyboardSettings && (
            <button
              onClick={onOpenKeyboardSettings}
              className="text-xs px-2 py-1 rounded-md border-none cursor-pointer transition-colors bg-(--color-bg-tertiary) text-(--color-text-secondary) hover:bg-(--color-hover)"
              title="Customize keyboard shortcuts"
            >
              Customize
            </button>
          )}
        </div>
        <ul className="m-0 pl-4 text-xs space-y-1 text-(--color-text-tertiary)">
          <li>Drag shape to move</li>
          <li>Drag corners to resize</li>
          <li>Drag circle handles to rotate</li>
          <li>Shift+click to multi-select</li>
          <li>Click color to change selected</li>
          <li>{keyMappings.moveUp ? formatKeyBinding(keyMappings.moveUp).replace('↑', 'Arrow keys') : 'Arrow keys'} to move</li>
          <li>{keyMappings.rotateClockwise ? formatKeyBinding(keyMappings.rotateClockwise) : '.'}/{keyMappings.rotateCounterClockwise ? formatKeyBinding(keyMappings.rotateCounterClockwise) : ','} to rotate</li>
          <li>{keyMappings.mirrorHorizontal ? formatKeyBinding(keyMappings.mirrorHorizontal) : 'H'}/{keyMappings.mirrorVertical ? formatKeyBinding(keyMappings.mirrorVertical) : 'V'} to mirror</li>
          <li>Hold Shift for larger steps</li>
          <li>{keyMappings.undo ? formatKeyBinding(keyMappings.undo) : 'Z'} to undo, {keyMappings.redo ? formatKeyBinding(keyMappings.redo) : 'Shift+Z'} to redo</li>
          <li>{keyMappings.duplicate ? formatKeyBinding(keyMappings.duplicate) : 'D'} to duplicate selected</li>
          <li>{keyMappings.delete ? formatKeyBinding(keyMappings.delete) : '⌫'} to delete selected</li>
          <li>Ctrl/⌘ + scroll to zoom</li>
          <li>Hold {keyMappings.pan ? formatKeyBinding(keyMappings.pan) : 'Space'} + drag to pan</li>
          <li>{keyMappings.toggleGrid ? formatKeyBinding(keyMappings.toggleGrid) : 'G'} to toggle grid</li>
        </ul>
      </Card>

      {/* Theme Toggle */}
      <Card className="mt-auto">
        <ThemeToggle mode={themeMode} onSetMode={onSetThemeMode} />
      </Card>
    </div>
  );
}
