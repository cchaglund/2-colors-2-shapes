import type { DailyChallenge, ShapeType } from '../types';
import type { ThemeMode } from '../hooks/useThemeState';
import { SHAPE_NAMES, getShapeSVGData } from '../utils/shapeHelpers';
import { ThemeToggle } from './ThemeToggle';
import { AuthButton } from './AuthButton';

// Small shape preview component for the toolbar
function ShapePreviewIcon({ type, size = 20 }: { type: ShapeType; size?: number }) {
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
  // Calendar
  onOpenCalendar?: () => void;
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
  onOpenCalendar,
}: ToolbarProps) {
  const hasSelection = selectedShapeIds.size > 0;

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          className="absolute left-0 top-4 z-10 rounded-r-md px-1.5 py-3 cursor-pointer transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderLeftWidth: 0,
            borderColor: 'var(--color-border)',
          }}
          onClick={onToggle}
          title="Show Toolbar"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
        >
          <span style={{ color: 'var(--color-text-secondary)' }} className="text-sm">›</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="p-4 overflow-y-auto shrink-0 relative"
      style={{
        width,
        backgroundColor: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
      }}>
      {/* Collapse button */}
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer rounded transition-colors"
        style={{ color: 'var(--color-text-tertiary)' }}
        onClick={onToggle}
        title="Hide Toolbar"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-tertiary)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ‹
      </button>

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors"
        onMouseDown={onStartResize}
      />
      <div className="mb-6">
        <h3 className="m-0 text-base" style={{ color: 'var(--color-text-primary)' }}>Today's Challenge</h3>
        <p className="mt-1 mb-0 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{challenge.date}</p>
      </div>

      <div className="mb-6">
        <h4 className="m-0 mb-3 text-xs uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Colors</h4>
        <div className="flex gap-2">
          {challenge.colors.map((color, index) => (
            <button
              key={index}
              className={`w-10 h-10 rounded-lg transition-transform ${
                hasSelection
                  ? 'cursor-pointer hover:scale-110 hover:shadow-md'
                  : 'cursor-default'
              }`}
              style={{
                backgroundColor: color,
                border: '2px solid var(--color-border-light)',
              }}
              title={hasSelection ? `Change selected shape(s) to ${color}` : color}
              onClick={() => hasSelection && onChangeShapeColor(index as 0 | 1)}
              disabled={!hasSelection}
            />
          ))}
        </div>
        {hasSelection && (
          <p className="mt-2 mb-0 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Click a color to change selected shape(s)</p>
        )}
      </div>

      <div className="mb-6">
        <h4 className="m-0 mb-3 text-xs uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Add Shape</h4>
        <div className="flex flex-col gap-2">
          {challenge.shapes.map((shape, shapeIndex) => (
            <div key={shape} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <ShapePreviewIcon type={shape} size={18} />
                </span>
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{SHAPE_NAMES[shape]}</span>
              </div>
              <div className="flex gap-1">
                {challenge.colors.map((color, colorIndex) => (
                  <button
                    key={colorIndex}
                    className="w-8 h-8 rounded-md cursor-pointer text-lg font-bold text-white/90 drop-shadow-sm transition-transform hover:scale-110 hover:shadow-md"
                    style={{
                      backgroundColor: color,
                      border: '2px solid var(--color-border-light)',
                    }}
                    onClick={() =>
                      onAddShape(shapeIndex as 0 | 1, colorIndex as 0 | 1)
                    }
                    title={`Add ${SHAPE_NAMES[shape]} with ${color}`}
                  >
                    +
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="m-0 mb-3 text-xs uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Background</h4>
        <div className="flex gap-2">
          <button
            className={`w-10 h-10 rounded-lg cursor-pointer text-base transition-transform hover:scale-105 ${
              backgroundColorIndex === null
                ? 'border-blue-600 shadow-[0_0_0_2px_rgba(0,102,255,0.3)]'
                : ''
            }`}
            onClick={() => onSetBackground(null)}
            style={{
              backgroundColor: '#fff',
              border: backgroundColorIndex === null ? '2px solid #2563eb' : '2px solid var(--color-border-light)',
              color: 'var(--color-text-tertiary)',
            }}
            title="White background"
          >
            {backgroundColorIndex === null ? '✓' : ''}
          </button>
          {challenge.colors.map((color, index) => (
            <button
              key={index}
              className={`w-10 h-10 rounded-lg cursor-pointer text-base transition-transform hover:scale-105 ${
                backgroundColorIndex === index
                  ? 'border-blue-600 shadow-[0_0_0_2px_rgba(0,102,255,0.3)]'
                  : ''
              }`}
              onClick={() => onSetBackground(index as 0 | 1)}
              style={{
                backgroundColor: color,
                border: backgroundColorIndex === index ? '2px solid #2563eb' : '2px solid var(--color-border-light)',
                color: 'var(--color-text-tertiary)',
              }}
              title={`${color} background`}
            >
              {backgroundColorIndex === index ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <ThemeToggle mode={themeMode} onSetMode={onSetThemeMode} />
      </div>

      <div className="mb-6">
        <h4 className="m-0 mb-3 text-xs uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Account</h4>
        <AuthButton />
        {isLoggedIn && onSave && (
          <button
            className="w-full mt-3 py-2.5 px-4 bg-blue-600 text-white border-none rounded-md cursor-pointer text-sm font-medium transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save Creation'}
          </button>
        )}
        {saveStatus === 'error' && (
          <p className="mt-1 mb-0 text-xs text-red-500">Failed to save. Try again.</p>
        )}
        {isLoggedIn && onOpenCalendar && (
          <button
            className="w-full mt-3 py-2.5 px-4 border-none rounded-md cursor-pointer text-sm font-medium transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
            }}
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
            My Submissions
          </button>
        )}
      </div>

      <div className="mb-6">
        <button
          className="w-full py-2.5 px-4 bg-red-500 text-white border-none rounded-md cursor-pointer text-sm font-medium transition-colors hover:bg-red-600"
          onClick={onReset}
        >
          Reset Canvas
        </button>
      </div>

      <div className="mt-auto">
        <h4 className="m-0 mb-3 text-xs uppercase" style={{ color: 'var(--color-text-tertiary)' }}>Controls</h4>
        <ul className="m-0 pl-4 text-xs space-y-1" style={{ color: 'var(--color-text-tertiary)' }}>
          <li>Drag shape to move</li>
          <li>Drag corners to resize</li>
          <li>Drag circle handles to rotate</li>
          <li>Shift+click to multi-select</li>
          <li>Click color to change selected</li>
          <li>Arrow keys to move</li>
          <li>Period/Comma to rotate</li>
          <li>Hold Shift for larger steps</li>
          <li>w to undo, Shift+w to redo</li>
          <li>c to duplicate selected</li>
          <li>Backspace to delete selected</li>
          <li>Ctrl/⌘ + scroll to zoom</li>
          <li>Hold Space + drag to pan</li>
        </ul>
      </div>
    </div>
  );
}
