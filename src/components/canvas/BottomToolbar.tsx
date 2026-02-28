import { motion } from 'motion/react';
import type { DailyChallenge } from '../../types';
import { ShapeIcon } from '../shared/ShapeIcon';

// --- Icons ---

function CursorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  );
}

// --- Types ---

export type EditorTool = 'select' | 'stamp-0' | 'stamp-1';

// --- Sub-components ---

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`w-[34px] h-[34px] flex items-center justify-center rounded-(--radius-sm) transition-all cursor-pointer ${
        active
          ? 'text-(--color-text-primary)'
          : 'bg-transparent text-(--color-text-secondary) border border-transparent hover:bg-(--color-hover) hover:text-(--color-text-primary)'
      }`}
      style={active ? {
        background: 'var(--color-card-bg)',
        border: 'var(--border-width, 2px) solid var(--color-border)',
        boxShadow: 'var(--shadow-btn)',
      } : undefined}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

function ColorSwatch({
  color,
  selected,
  onClick,
  title,
  small,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
  title?: string;
  small?: boolean;
}) {
  return (
    <button
      className={`cursor-pointer transition-all shrink-0 ${
        small ? 'w-5 h-5 md:w-[22px] md:h-[22px]' : 'w-6 h-6 md:w-7 md:h-7'
      } ${selected ? 'scale-115' : 'hover:scale-105'}`}
      style={{
        backgroundColor: color,
        borderRadius: 'var(--radius-sm)',
        border: selected
          ? 'var(--border-width, 2px) solid var(--color-border)'
          : small
            ? 'var(--border-width, 2px) solid var(--color-border-light)'
            : 'var(--border-width, 2px) solid transparent',
      }}
      onClick={onClick}
      title={title ?? color}
    />
  );
}

function Divider() {
  return <div className="w-px h-6 bg-(--color-border-light) mx-0.5 md:mx-1 shrink-0" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="hidden md:inline text-xs font-bold uppercase tracking-wide text-(--color-text-tertiary) px-1 shrink-0">
      {children}
    </span>
  );
}

// --- Main component ---

interface BottomToolbarProps {
  challenge: DailyChallenge;
  activeTool: EditorTool;
  selectedColorIndex: number;
  backgroundColorIndex: number | null;
  selectedColor: string;
  onSetTool: (tool: EditorTool) => void;
  onSetSelectedColor: (index: number) => void;
  onSetBackground: (index: number | null) => void;
}

export function BottomToolbar({
  challenge,
  activeTool,
  selectedColorIndex,
  backgroundColorIndex,
  selectedColor,
  onSetTool,
  onSetSelectedColor,
  onSetBackground,
}: BottomToolbarProps) {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      }}
      className="flex items-center h-12 gap-1 md:gap-1.5 px-2 md:px-4 backdrop-blur-sm"
      style={{
        background: 'var(--color-card-bg)',
        border: 'var(--border-width, 2px) solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Tool mode: Select + shape buttons (grouped in tray) */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-(--radius-md) bg-(--color-selected)">
        <ToolButton
          active={activeTool === 'select'}
          onClick={() => onSetTool('select')}
          title="Select (V)"
        >
          <CursorIcon />
        </ToolButton>
        {challenge.shapes.map((shape, i) => {
          const toolId = `stamp-${i}` as EditorTool;
          return (
            <ToolButton
              key={shape.type}
              active={activeTool === toolId}
              onClick={() => onSetTool(activeTool === toolId ? 'select' : toolId)}
              title={shape.name}
            >
              <ShapeIcon
                type={shape.type}
                size={16}
                fill={selectedColor}
                stroke="var(--color-border)"
                strokeWidth={1.5}
              />
            </ToolButton>
          );
        })}
      </div>

      <Divider />

      {/* Shape color selection */}
      <SectionLabel>Color</SectionLabel>
      {challenge.colors.map((color, i) => (
        <ColorSwatch
          key={`color-${i}`}
          color={color}
          selected={selectedColorIndex === i}
          onClick={() => onSetSelectedColor(i)}
        />
      ))}

      <Divider />

      {/* Background color selection */}
      <SectionLabel>Background</SectionLabel>
      {challenge.colors.map((color, i) => (
        <ColorSwatch
          key={`bg-${i}`}
          color={color}
          selected={backgroundColorIndex === i}
          onClick={() => onSetBackground(i)}
          small
        />
      ))}
      <ColorSwatch
        color="#FFFDF7"
        selected={backgroundColorIndex === null}
        onClick={() => onSetBackground(null)}
        title="Default (cream)"
        small
      />
    </motion.div>
  );
}
