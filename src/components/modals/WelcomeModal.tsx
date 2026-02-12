import { useEffect, useRef } from 'react';
import type { DailyChallenge } from '../../types';
import { getShapeSVGData } from '../../utils/shapeHelpers';

interface WelcomeModalProps {
  onDismiss: () => void;
  challenge?: DailyChallenge | null;
}

function ShapeIcon({ type, size = 24 }: { type: string; size?: number }) {
  const { element, props, viewBox } = getShapeSVGData(type as never, size);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}>
      {element === 'ellipse' && <ellipse {...props} fill="currentColor" />}
      {element === 'rect' && <rect {...props} fill="currentColor" />}
      {element === 'polygon' && <polygon {...props} fill="currentColor" />}
      {element === 'path' && <path {...props} fill="currentColor" />}
    </svg>
  );
}

export function WelcomeModal({ onDismiss, challenge }: WelcomeModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus the button when modal opens and trap focus
  useEffect(() => {
    buttonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
      // Trap focus within the modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div
        ref={modalRef}
        className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6 w-full max-w-lg mx-4"
      >
        <h2
          id="welcome-title"
          className="text-xl font-semibold text-(--color-text-primary) mb-5 text-center"
        >
          Welcome to 2 Colors 2 Shapes!
        </h2>

        {challenge && (
          <div className="flex flex-col items-center gap-3 mt-10 mb-8">
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full border border-(--color-border)"
                style={{ backgroundColor: challenge.colors[0] }}
              />
              <div
                className="w-6 h-6 rounded-full border border-(--color-border)"
                style={{ backgroundColor: challenge.colors[1] }}
              />
              <div className="w-px h-5 bg-(--color-border) mx-1" />
              <span className="text-(--color-text-tertiary)">
                <ShapeIcon type={challenge.shapes[0].type} size={22} />
              </span>
              <span className="text-(--color-text-tertiary)">
                <ShapeIcon type={challenge.shapes[1].type} size={22} />
              </span>
            </div>
            <p className="text-[13px] italic text-(--color-text-tertiary) capitalize">
              "{challenge.word}"
            </p>
          </div>
        )}

        <div className="flex items-center gap-4 mb-5">

          <p className="text-md text-(--color-text-secondary) text-center">
            Each day brings a new <strong>creative challenge</strong> — make art using today's 2 colors and 2 shapes!
          </p>
        </div>

        <div className='border border-gray-200 my-6 w-[80%] mx-auto'></div>

        <div className="flex items-center gap-4 mb-5">
          <p className="text-[25px]">
            🎨
          </p>

          <p className="text-md text-(--color-text-secondary) italic">
            Use the optional daily word for extra inspiration
          </p>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <p className="text-[25px]">
            🌎
          </p>

          <p className="text-md text-(--color-text-secondary) italic">
            Submit your art and the community votes on their favorites each day
          </p>
        </div>

        <button
          ref={buttonRef}
          onClick={onDismiss}
          className="w-full mt-6 px-4 py-2 text-white rounded-md text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 bg-(--color-accent) hover:bg-(--color-accent-hover) cursor-pointer"
        >
          Start creating
        </button>
      </div>
    </div>
  );
}
