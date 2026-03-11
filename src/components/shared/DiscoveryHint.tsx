import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { HintId } from '../../hooks/ui/useDiscoveryHints';

const HINT_TEXT: Record<HintId, string> = {
  'left-toolbar': 'Duplicate, mirror, and reorder shapes here',
  'gallery': 'Explore past submissions and see what others created!',
  'keyboard-shortcuts': 'Customize your keyboard shortcuts here',
  'layers-panel': 'Manage shape layers and ordering here',
};

const HINT_SELECTOR: Record<HintId, string> = {
  'left-toolbar': '[data-hint="left-toolbar"]',
  'gallery': '[data-hint="gallery"]',
  'keyboard-shortcuts': '[data-hint="keyboard-shortcuts"]',
  'layers-panel': '[data-hint="layers-panel"]',
};

interface DiscoveryHintProps {
  hintId: HintId;
  onDismiss: () => void;
}

function useHintPosition(selector: string) {
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'above' | 'below' | 'right' } | null>(null);

  const measure = useCallback(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerY = rect.y + rect.height / 2;
    const centerX = rect.x + rect.width / 2;
    const gap = 12;

    // Prefer right placement for left-side elements, above for bottom elements, below otherwise
    if (centerX < window.innerWidth * 0.25) {
      setPosition({
        top: Math.min(rect.y + rect.height / 2, window.innerHeight - 100),
        left: rect.x + rect.width + gap,
        placement: 'right',
      });
    } else if (centerY > window.innerHeight * 0.6) {
      setPosition({
        top: rect.y - gap,
        left: rect.x + rect.width / 2,
        placement: 'above',
      });
    } else {
      setPosition({
        top: rect.y + rect.height + gap,
        left: rect.x + rect.width / 2,
        placement: 'below',
      });
    }
  }, [selector]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return position;
}

export function DiscoveryHint({ hintId, onDismiss }: DiscoveryHintProps) {
  const selector = HINT_SELECTOR[hintId];
  const text = HINT_TEXT[hintId];
  const position = useHintPosition(selector);

  if (!position) return null;

  const maxWidth = 220;
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 90,
    width: maxWidth,
    background: 'var(--color-card-bg)',
    color: 'var(--color-text-primary)',
    border: 'var(--border-width, 2px) solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
  };

  if (position.placement === 'right') {
    style.top = position.top;
    style.left = Math.min(position.left, window.innerWidth - maxWidth - 16);
    style.transform = 'translateY(-50%)';
  } else if (position.placement === 'above') {
    style.top = position.top;
    style.left = Math.max(16, Math.min(position.left - maxWidth / 2, window.innerWidth - maxWidth - 16));
    style.transform = 'translateY(-100%)';
  } else {
    style.top = position.top;
    style.left = Math.max(16, Math.min(position.left - maxWidth / 2, window.innerWidth - maxWidth - 16));
  }

  const slideDirection = position.placement === 'above' ? 6 : position.placement === 'right' ? 0 : -6;

  return (
    <AnimatePresence>
      <motion.div
        style={style}
        className="px-3 py-2.5 text-xs"
        initial={{ opacity: 0, y: slideDirection, x: position.placement === 'right' ? -6 : 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <p className="mb-2 font-medium leading-relaxed">{text}</p>
        <button
          className="text-xs font-semibold text-(--color-accent) hover:underline cursor-pointer"
          onClick={onDismiss}
        >
          Got it
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
