import { useEffect, useState } from 'react';

interface UndoRedoToastProps {
  message: string;
  onDismiss: () => void;
}

export function UndoRedoToast({ message, onDismiss }: UndoRedoToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    const raf = requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200); // Wait for exit transition
    }, 1500);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        px-3 py-1.5 rounded-(--radius-md)
        text-(--text-sm) font-medium
        bg-(--color-bg-elevated) text-(--color-text-secondary)
        border border-(--color-border)
        shadow-(--shadow-btn)
        transition-all duration-200 ease-out
        pointer-events-none select-none
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {message}
    </div>
  );
}
