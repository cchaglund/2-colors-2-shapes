import { useEffect, useRef } from 'react';

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

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-40 touch-manipulation"
    >
      <button
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 flex items-center gap-3"
        onClick={() => handleAction(onDuplicate)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>Duplicate</span>
      </button>

      <button
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 flex items-center gap-3"
        onClick={() => handleAction(onMirrorHorizontal)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12m-12 5h12M4 7v.01M4 12v.01M4 17v.01" />
        </svg>
        <span>Flip Horizontal</span>
      </button>

      <button
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 flex items-center gap-3"
        onClick={() => handleAction(onMirrorVertical)}
      >
        <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12m-12 5h12M4 7v.01M4 12v.01M4 17v.01" />
        </svg>
        <span>Flip Vertical</span>
      </button>

      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

      <button
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 flex items-center gap-3"
        onClick={() => handleAction(onBringToFront)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        <span>Bring to Front</span>
      </button>

      <button
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 flex items-center gap-3"
        onClick={() => handleAction(onSendToBack)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span>Send to Back</span>
      </button>

      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

      <button
        className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 flex items-center gap-3"
        onClick={() => handleAction(onDelete)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Delete</span>
      </button>
    </div>
  );
}
