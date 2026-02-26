import type { DailyChallenge } from '../../types';
import { ShapeIcon } from '../shared/ShapeIcon';
import { type KeyMappings, formatKeyBinding } from '../../constants/keyboardActions';

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
  backgroundColorIndex: number | null;
  selectedShapeIds: Set<string>;
  onAddShape: (shapeIndex: number, colorIndex: number) => void;
  onSetBackground: (colorIndex: number | null) => void;
  onChangeShapeColor: (colorIndex: number) => void;
  onToggle: () => void;
  onStartResize: (e: React.MouseEvent) => void;
  // Keyboard settings
  keyMappings: KeyMappings;
  onOpenKeyboardSettings?: () => void;
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
  onToggle,
  onStartResize,
  keyMappings,
  onOpenKeyboardSettings,
  showGrid,
  onToggleGrid,
  showOffCanvas,
  onToggleOffCanvas,
}: ToolbarProps) {
  const hasSelection = selectedShapeIds.size > 0;

  return (
    <div
      className="overflow-y-auto h-full w-full relative flex flex-col bg-(--color-bg-primary) border-r border-(--color-border)"
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
          <span className="text-[13px] font-medium text-(--color-text-primary)">
            Toolbox
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

        {/* Background Section */}
        <div className="py-4 border-b border-(--color-border-light)">
          <div className="mb-3">
            <Label>Background</Label>
            <div className="flex gap-2">
              {challenge.colors.map((color, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded-md cursor-pointer text-[11px] transition-all border flex items-center justify-center ${backgroundColorIndex === index
                      ? 'border-(--color-accent) ring-2 ring-(--color-accent-subtle)'
                      : 'border-(--color-border) hover:border-(--color-border-emphasis)'
                    }`}
                  onClick={() => onSetBackground(index)}
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

          {/* Colors */}
          <Label>Shape Color</Label>
          <div className="flex gap-2">
            {challenge.colors.map((color, index) => (
              <button
                key={index}
                className={`w-8 h-8 rounded-md border transition-all ${hasSelection
                  ? 'cursor-pointer hover:scale-105 border-(--color-border)'
                  : 'cursor-default border-(--color-border-light)'
                  }`}
                style={{ backgroundColor: color }}
                title={hasSelection ? `Change selected shape(s) to ${color}` : color}
                onClick={() => hasSelection && onChangeShapeColor(index)}
                disabled={!hasSelection}
              />
            ))}
          </div>
          {hasSelection && (
            <p className="mt-1.5 mb-0 text-[11px] text-(--color-text-tertiary)">Click to change selected</p>
          )}

        </div>

        {/* Add Shape Section */}
        <div className="py-4 border-b border-(--color-border-light)">
          <Label>Add Shape</Label>
          <div className="flex flex-col gap-2">
            {challenge.shapes.map((shapeData, shapeIndex) => (
              <div key={shapeData.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-(--color-text-tertiary)">
                    <ShapeIcon type={shapeData.type} size={16} />
                  </span>
                  <span className="text-[13px] text-(--color-text-primary)">{shapeData.name}</span>
                </div>
                <div className="flex gap-1">
                  {challenge.colors.map((color, colorIndex) => (
                    <button
                      key={colorIndex}
                      className="w-7 h-7 rounded-md cursor-pointer text-[16px] font-medium text-(--color-accent-text)/90 transition-all hover:scale-105 border border-(--color-border-light) flex items-center justify-center"
                      style={{ backgroundColor: color, textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}
                      onClick={() => onAddShape(shapeIndex, colorIndex)}
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
        <div className="py-4">
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
      </div>
    </div>
  );
}
