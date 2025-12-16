import type { DailyChallenge } from '../types';
import { SHAPE_NAMES } from '../utils/shapeHelpers';

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
}: ToolbarProps) {
  const hasSelection = selectedShapeIds.size > 0;

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          className="absolute left-0 top-4 z-10 bg-neutral-100 border border-l-0 border-gray-300 rounded-r-md px-1.5 py-3 cursor-pointer hover:bg-neutral-200 transition-colors"
          onClick={onToggle}
          title="Show Toolbar"
        >
          <span className="text-gray-600 text-sm">›</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-neutral-100 border-r border-gray-300 p-4 overflow-y-auto shrink-0 relative"
      style={{ width }}>
      {/* Collapse button */}
      <button
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
        onClick={onToggle}
        title="Hide Toolbar"
      >
        ‹
      </button>

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-colors"
        onMouseDown={onStartResize}
      />
      <div className="mb-6">
        <h3 className="m-0 text-base text-gray-700">Today's Challenge</h3>
        <p className="mt-1 mb-0 text-sm text-gray-500">{challenge.date}</p>
      </div>

      <div className="mb-6">
        <h4 className="m-0 mb-3 text-xs uppercase text-gray-500">Colors</h4>
        <div className="flex gap-2">
          {challenge.colors.map((color, index) => (
            <button
              key={index}
              className={`w-10 h-10 rounded-lg border-2 transition-transform ${
                hasSelection
                  ? 'cursor-pointer hover:scale-110 hover:shadow-md border-black/20'
                  : 'cursor-default border-black/20'
              }`}
              style={{ backgroundColor: color }}
              title={hasSelection ? `Change selected shape(s) to ${color}` : color}
              onClick={() => hasSelection && onChangeShapeColor(index as 0 | 1)}
              disabled={!hasSelection}
            />
          ))}
        </div>
        {hasSelection && (
          <p className="mt-2 mb-0 text-xs text-gray-500">Click a color to change selected shape(s)</p>
        )}
      </div>

      <div className="mb-6">
        <h4 className="m-0 mb-3 text-xs uppercase text-gray-500">Add Shape</h4>
        <div className="flex flex-col gap-2">
          {challenge.shapes.map((shape, shapeIndex) => (
            <div key={shape} className="flex items-center justify-between">
              <span className="text-sm">{SHAPE_NAMES[shape]}</span>
              <div className="flex gap-1">
                {challenge.colors.map((color, colorIndex) => (
                  <button
                    key={colorIndex}
                    className="w-8 h-8 border-2 border-black/20 rounded-md cursor-pointer text-lg font-bold text-white/90 drop-shadow-sm transition-transform hover:scale-110 hover:shadow-md"
                    style={{ backgroundColor: color }}
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
        <h4 className="m-0 mb-3 text-xs uppercase text-gray-500">Background</h4>
        <div className="flex gap-2">
          <button
            className={`w-10 h-10 border-2 rounded-lg cursor-pointer text-base text-black/50 transition-transform hover:scale-105 ${
              backgroundColorIndex === null
                ? 'border-blue-600 shadow-[0_0_0_2px_rgba(0,102,255,0.3)]'
                : 'border-black/20'
            }`}
            onClick={() => onSetBackground(null)}
            style={{ backgroundColor: '#fff' }}
            title="White background"
          >
            ✓
          </button>
          {challenge.colors.map((color, index) => (
            <button
              key={index}
              className={`w-10 h-10 border-2 rounded-lg cursor-pointer text-base text-black/50 transition-transform hover:scale-105 ${
                backgroundColorIndex === index
                  ? 'border-blue-600 shadow-[0_0_0_2px_rgba(0,102,255,0.3)]'
                  : 'border-black/20'
              }`}
              onClick={() => onSetBackground(index as 0 | 1)}
              style={{ backgroundColor: color }}
              title={`${color} background`}
            >
              {backgroundColorIndex === index ? '✓' : ''}
            </button>
          ))}
        </div>
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
        <h4 className="m-0 mb-3 text-xs uppercase text-gray-500">Controls</h4>
        <ul className="m-0 pl-4 text-xs text-gray-500 space-y-1">
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
          <li>Ctrl/⌘ + scroll to zoom</li>
          <li>Hold Space + drag to pan</li>
        </ul>
      </div>
    </div>
  );
}
