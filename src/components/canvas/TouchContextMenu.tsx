import { useEffect, useRef } from 'react';
import { Copy, FlipHorizontal2, FlipVertical2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface TouchContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMirrorHorizontal: () => void;
  onMirrorVertical: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export function TouchContextMenu({
  x,
  y,
  onClose,
  onDuplicate,
  onDelete,
  onMirrorHorizontal,
  onMirrorVertical,
  onBringToFront,
  onSendToBack,
}: TouchContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate close from the same touch
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  // Position the menu to stay within viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    transform: 'translate(-50%, -100%)',
    zIndex: 1000,
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const itemClass = "w-full px-4 py-3 text-left hover:bg-(--color-hover) active:bg-(--color-selected) flex items-center gap-3";

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-(--color-bg-elevated) rounded-(--radius-lg) shadow-(--shadow-modal) border border-(--color-border) py-2 min-w-40 touch-manipulation"
    >
      <button className={itemClass} onClick={() => handleAction(onDuplicate)}>
        <Copy className="w-5 h-5" />
        <span>Duplicate</span>
      </button>

      <button className={itemClass} onClick={() => handleAction(onMirrorHorizontal)}>
        <FlipHorizontal2 className="w-5 h-5" />
        <span>Flip Horizontal</span>
      </button>

      <button className={itemClass} onClick={() => handleAction(onMirrorVertical)}>
        <FlipVertical2 className="w-5 h-5" />
        <span>Flip Vertical</span>
      </button>

      <div className="border-t border-(--color-border) my-1" />

      <button className={itemClass} onClick={() => handleAction(onBringToFront)}>
        <ChevronUp className="w-5 h-5" />
        <span>Bring to Front</span>
      </button>

      <button className={itemClass} onClick={() => handleAction(onSendToBack)}>
        <ChevronDown className="w-5 h-5" />
        <span>Send to Back</span>
      </button>

      <div className="border-t border-(--color-border) my-1" />

      <button
        className="w-full px-4 py-3 text-left text-(--color-danger) hover:bg-(--color-danger)/5 active:bg-(--color-danger)/10 flex items-center gap-3"
        onClick={() => handleAction(onDelete)}
      >
        <Trash2 className="w-5 h-5" />
        <span>Delete</span>
      </button>
    </div>
  );
}
