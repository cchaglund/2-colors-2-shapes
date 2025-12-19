import { useEffect, useRef } from 'react';

interface WelcomeModalProps {
  onDismiss: () => void;
}

export function WelcomeModal({ onDismiss }: WelcomeModalProps) {
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
        className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
      >
        <h2
          id="welcome-title"
          className="text-xl font-semibold text-[var(--color-text-primary)] mb-4"
        >
          Welcome to 2 Colors 2 Shapes!
        </h2>

        <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
          <section>
            <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
              Daily Challenges
            </h3>
            <p>
              Each day brings a new creative challenge with 2 colors and 2 shapes.
              Use these constraints to create unique artwork.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
              Create & Customize
            </h3>
            <p>
              Add shapes to your canvas using the toolbar on the left.
              Resize, rotate, and layer them to bring your vision to life.
              Click a shape to select it, then transform it however you like.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
              Save & Share
            </h3>
            <p>
              Sign in to save your creations to the gallery and share them with others.
              Your work is automatically saved locally as you create.
            </p>
          </section>

          <section>
            <h3 className="font-medium text-[var(--color-text-primary)] mb-1">
              Browse Past Challenges
            </h3>
            <p>
              Use the calendar to explore previous daily challenges and see what
              others have created.
            </p>
          </section>
        </div>

        <button
          ref={buttonRef}
          onClick={onDismiss}
          className="w-full mt-6 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
