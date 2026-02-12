import { useState } from 'react';
import logoSvg from '../assets/logo.svg';
import type { DailyChallenge, ShapeType } from '../types';
import type { ThemeMode } from '../hooks/useThemeState';
import type { Profile } from '../hooks/useProfile';
import { getShapeSVGData } from '../utils/shapeHelpers';
import { ThemeToggle } from './ThemeToggle';
import { AuthButton } from './AuthButton';
import { LoginPromptModal } from './LoginPromptModal';
import { type KeyMappings, formatKeyBinding } from '../constants/keyboardActions';
import { InfoTooltip } from './InfoTooltip';

// Small shape preview component for the toolbar
function ShapePreviewIcon({ type, size = 18 }: { type: ShapeType; size?: number }) {
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

// Section label - consistent typography
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-wide text-(--color-text-tertiary) mb-2">
      {children}
    </div>
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
  // Friends modal
  onOpenFriendsModal?: () => void;
  // Keyboard settings
  keyMappings: KeyMappings;
  onOpenKeyboardSettings?: () => void;
  // Profile for AuthButton
  profile?: Profile | null;
  profileLoading?: boolean;
  // Grid toggle
  showGrid?: boolean;
  onToggleGrid?: () => void;
  // Off-canvas toggle
  showOffCanvas?: boolean;
  onToggleOffCanvas?: () => void;
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
  onOpenFriendsModal,
  keyMappings,
  onOpenKeyboardSettings,
  profile,
  profileLoading,
  showGrid,
  onToggleGrid,
  showOffCanvas,
  onToggleOffCanvas,
}: ToolbarProps) {
  const [loginModalVariant, setLoginModalVariant] = useState<'save' | 'submissions' | 'friends' | null>(null);
  const hasSelection = selectedShapeIds.size > 0;

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          className="absolute left-0 top-4 z-10 px-1.5 py-3 cursor-pointer transition-colors border-r border-y border-(--color-border) rounded-r-md bg-(--color-bg-primary) hover:bg-(--color-hover)"
          onClick={onToggle}
          title="Show Toolbar"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="4 2 8 6 4 10" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto shrink-0 relative flex flex-col z-10 bg-(--color-bg-primary) border-r border-(--color-border)"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-(--color-accent) transition-colors"
        onMouseDown={onStartResize}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Header with collapse */}
        <div className="flex items-center justify-between py-3 border-b border-(--color-border-light)">
          <span className="flex items-center gap-2 text-[13px] font-medium text-(--color-text-primary)">
            <img src={logoSvg} alt="" width="28" height="28" />
            <span className="flex flex-col leading-tight">
              <span>2 Colors</span>
              <span>2 Shapes</span>
            </span>
          </span>
          <button
            className="w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer rounded transition-colors text-(--color-text-tertiary) hover:text-(--color-text-secondary) hover:bg-(--color-hover)"
            onClick={onToggle}
            title="Hide Toolbar"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="8 2 4 6 8 10" />
            </svg>
          </button>
        </div>

        {/* Account Section */}
        <div className="py-4 border-b border-(--color-border-light)">
          <Label>Account</Label>
          <AuthButton profile={profile} profileLoading={profileLoading} />

          {onOpenCalendar && (
            <button
              className="w-full mt-2 py-2 px-3 border border-(--color-border) rounded-md cursor-pointer text-[13px] font-medium transition-colors flex items-center justify-center gap-2 bg-transparent text-(--color-text-primary) hover:bg-(--color-hover)"
              onClick={isLoggedIn ? onOpenCalendar : () => setLoginModalVariant('submissions')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Gallery
            </button>
          )}

          {onOpenFriendsModal && (
            <button
              className="w-full mt-2 py-2 px-3 border border-(--color-border) rounded-md cursor-pointer text-[13px] font-medium transition-colors flex items-center justify-center gap-2 bg-transparent text-(--color-text-primary) hover:bg-(--color-hover)"
              onClick={isLoggedIn ? onOpenFriendsModal : () => setLoginModalVariant('friends')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Friends
            </button>
          )}
        </div>

        {/* Today's Challenge Section */}
        <div className="py-4 border-b border-(--color-border-light)">

          {/* Daily Word */}
          <div className="mt-3 mb-4">
            <Label>Inspiration<InfoTooltip text="This is just for inspiration, feel free to ignore it" /></Label>
            <p className="m-0 text-base font-medium text-(--color-text-primary) capitalize">"{challenge.word}"</p>
          </div>

          {/* Colors */}
          <Label>Colors</Label>
          <div className="flex gap-2">
            {challenge.colors.map((color, index) => (
              <button
                key={index}
                className={`w-8 h-8 rounded-md border transition-all ${
                  hasSelection
                    ? 'cursor-pointer hover:scale-105 border-(--color-border)'
                    : 'cursor-default border-(--color-border-light)'
                }`}
                style={{ backgroundColor: color }}
                title={hasSelection ? `Change selected shape(s) to ${color}` : color}
                onClick={() => hasSelection && onChangeShapeColor(index as 0 | 1)}
                disabled={!hasSelection}
              />
            ))}
          </div>
          {hasSelection && (
            <p className="mt-1.5 mb-0 text-[11px] text-(--color-text-tertiary)">Click to change selected</p>
          )}
        </div>

        {/* Background Section */}
        <div className="py-4 border-b border-(--color-border-light)">
          <Label>Background</Label>
          <div className="flex gap-2">
            <button
              className={`w-8 h-8 rounded-md cursor-pointer text-[11px] transition-all flex items-center justify-center bg-white border ${
                backgroundColorIndex === null
                  ? 'border-(--color-accent) ring-2 ring-(--color-accent-subtle)'
                  : 'border-(--color-border) hover:border-(--color-border-emphasis)'
              }`}
              onClick={() => onSetBackground(null)}
              title="White background"
            >
              {backgroundColorIndex === null && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              )}
            </button>
            {challenge.colors.map((color, index) => (
              <button
                key={index}
                className={`w-8 h-8 rounded-md cursor-pointer text-[11px] transition-all border flex items-center justify-center ${
                  backgroundColorIndex === index
                    ? 'border-(--color-accent) ring-2 ring-(--color-accent-subtle)'
                    : 'border-(--color-border) hover:border-(--color-border-emphasis)'
                }`}
                onClick={() => onSetBackground(index as 0 | 1)}
                style={{ backgroundColor: color }}
                title={`${color} background`}
              >
                {backgroundColorIndex === index && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Add Shape Section */}
        <div className="py-4 border-b border-(--color-border-light)">
          <Label>Add Shape</Label>
          <div className="flex flex-col gap-2">
            {challenge.shapes.map((shapeData, shapeIndex) => (
              <div key={shapeData.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-(--color-text-tertiary)">
                    <ShapePreviewIcon type={shapeData.type} size={16} />
                  </span>
                  <span className="text-[13px] text-(--color-text-primary)">{shapeData.name}</span>
                </div>
                <div className="flex gap-1">
                  {challenge.colors.map((color, colorIndex) => (
                    <button
                      key={colorIndex}
                      className="w-7 h-7 rounded-md cursor-pointer text-[13px] font-medium text-white/90 transition-all hover:scale-105 border border-(--color-border-light) flex items-center justify-center"
                      style={{ backgroundColor: color, textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}
                      onClick={() => onAddShape(shapeIndex as 0 | 1, colorIndex as 0 | 1)}
                      title={`Add ${shapeData.name} with ${color}`}
                    >
                      +
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Section */}
        <div className="py-4 border-b border-(--color-border-light)">
          {isLoggedIn && onSave ? (
            <button
              className="w-full py-2 px-3 text-white border-none rounded-md cursor-pointer text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-(--color-accent) hover:bg-(--color-accent-hover)"
              onClick={onSave}
              disabled={isSaving || hasSubmittedToday}
            >
              {isSaving 
                ? 'Saving...' 
                : saveStatus === 'saved' 
                  ? 'Saved' 
                  : hasSubmittedToday
                    ? 'Submitted'
                    : 'Save Creation'
                }
            </button>
          ) : (
            <button
              className="w-full py-2 px-3 text-white border-none rounded-md cursor-pointer text-[13px] font-medium transition-colors bg-(--color-accent) hover:bg-(--color-accent-hover)"
              onClick={() => setLoginModalVariant('save')}
            >
              Save Creation
            </button>
          )}
          {saveStatus === 'error' && (
            <p className="mt-1 mb-0 text-[11px] text-(--color-danger)">Failed to save. Try again.</p>
          )}

          <button
            className="w-full py-2 px-3 border border-(--color-border) rounded-md cursor-pointer text-[13px] font-medium transition-colors text-(--color-text-secondary) hover:text-(--color-danger) hover:border-(--color-danger) hover:bg-transparent mt-2"
            onClick={onReset}
          >
            Reset Canvas
          </button>
        </div>

        {loginModalVariant && (
          <LoginPromptModal
            onClose={() => setLoginModalVariant(null)}
            {...(loginModalVariant === 'submissions' && {
              title: 'View Gallery',
              message: "To view others' art, and to save your own, you need to be logged in.",
            })}
            {...(loginModalVariant === 'friends' && {
              title: 'Follow Your Friends',
              message: 'To follow other users you must first log in.',
            })}
          />
        )}

        {/* View Section */}
        <div className="py-4 border-b border-(--color-border-light)">
          <Label>View</Label>
          <button
            className={`flex items-center gap-2 w-full py-1.5 px-2 rounded-md cursor-pointer text-[13px] transition-colors ${
              showGrid
                ? 'bg-(--color-selected) text-(--color-text-primary)'
                : 'bg-transparent text-(--color-text-secondary) hover:bg-(--color-hover)'
            }`}
            onClick={onToggleGrid}
            title={`${showGrid ? 'Hide' : 'Show'} grid lines (${keyMappings.toggleGrid ? formatKeyBinding(keyMappings.toggleGrid) : 'G'})`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="5.5" y1="1" x2="5.5" y2="15" />
              <line x1="10.5" y1="1" x2="10.5" y2="15" />
              <line x1="1" y1="5.5" x2="15" y2="5.5" />
              <line x1="1" y1="10.5" x2="15" y2="10.5" />
            </svg>
            <span>Grid Lines</span>
            {showGrid && <span className="ml-auto text-[11px] text-(--color-text-tertiary)">On</span>}
          </button>
          <button
            className={`flex items-center gap-2 w-full py-1.5 px-2 rounded-md cursor-pointer text-[13px] transition-colors ${
              showOffCanvas
                ? 'bg-(--color-selected) text-(--color-text-primary)'
                : 'bg-transparent text-(--color-text-secondary) hover:bg-(--color-hover)'
            }`}
            onClick={onToggleOffCanvas}
            title={`${showOffCanvas ? 'Hide' : 'Show'} shapes outside canvas bounds`}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="4" y="4" width="8" height="8" />
              <circle cx="2" cy="8" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="14" cy="8" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <span>Off-Canvas</span>
            {showOffCanvas && <span className="ml-auto text-[11px] text-(--color-text-tertiary)">On</span>}
          </button>
        </div>

        {/* Controls Section */}
        <div className="py-4 border-b border-(--color-border-light)">
          <div className="flex items-center justify-between mb-2">
            <Label>Controls</Label>
            {onOpenKeyboardSettings && (
              <button
                onClick={onOpenKeyboardSettings}
                className="text-[11px] px-1.5 py-0.5 rounded border border-(--color-border) cursor-pointer transition-colors bg-transparent text-(--color-text-tertiary) hover:text-(--color-text-secondary) hover:border-(--color-border-emphasis)"
                title="Customize keyboard shortcuts"
              >
                Customize
              </button>
            )}
          </div>
          <ul className="m-0 pl-3.5 text-[11px] space-y-0.5 text-(--color-text-tertiary)">
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
            <li>{keyMappings.duplicate ? formatKeyBinding(keyMappings.duplicate) : 'D'} to duplicate</li>
            <li>{keyMappings.delete ? formatKeyBinding(keyMappings.delete) : '⌫'} to delete</li>
            <li>Ctrl/⌘ + scroll to zoom</li>
            <li>Hold {keyMappings.pan ? formatKeyBinding(keyMappings.pan) : 'Space'} + drag to pan</li>
          </ul>
        </div>

        {/* Theme Toggle */}
        <div className="py-4">
          <ThemeToggle mode={themeMode} onSetMode={onSetThemeMode} />
        </div>
      </div>
    </div>
  );
}
