import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type KeyMappings,
  type KeyboardActionId,
  type KeyBinding,
  KEYBOARD_ACTIONS,
  KEYBOARD_ACTIONS_MAP,
  formatKeyBinding,
  bindingFromEvent,
  findConflicts,
} from '../constants/keyboardActions';

interface KeyboardSettingsModalProps {
  mappings: KeyMappings;
  onUpdateBinding: (
    actionId: KeyboardActionId,
    binding: KeyBinding,
    resolveConflicts?: boolean
  ) => Promise<{ success: boolean; conflicts?: KeyboardActionId[] }>;
  onResetAll: () => Promise<void>;
  onClose: () => void;
  syncing?: boolean;
}

export function KeyboardSettingsModal({
  mappings,
  onUpdateBinding,
  onResetAll,
  onClose,
  syncing,
}: KeyboardSettingsModalProps) {
  const [listeningFor, setListeningFor] = useState<KeyboardActionId | null>(null);
  const [pendingConflicts, setPendingConflicts] = useState<{
    actionId: KeyboardActionId;
    binding: KeyBinding;
    conflicts: KeyboardActionId[];
  } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close modal or cancel listening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (listeningFor) {
          setListeningFor(null);
        } else if (pendingConflicts) {
          setPendingConflicts(null);
        } else {
          onClose();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listeningFor, pendingConflicts, onClose]);

  // Handle key capture when listening
  useEffect(() => {
    if (!listeningFor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier-only presses
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const newBinding = bindingFromEvent(e);

      // Check for conflicts
      const conflicts = findConflicts(mappings, listeningFor, newBinding);

      if (conflicts.length > 0) {
        // Show conflict dialog
        setPendingConflicts({
          actionId: listeningFor,
          binding: newBinding,
          conflicts,
        });
      } else {
        // No conflicts, just update
        onUpdateBinding(listeningFor, newBinding);
      }

      setListeningFor(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [listeningFor, mappings, onUpdateBinding]);

  const handleStartListening = useCallback((actionId: KeyboardActionId) => {
    const action = KEYBOARD_ACTIONS_MAP.get(actionId);
    if (action?.allowRemap === false) return;
    setListeningFor(actionId);
  }, []);

  const handleResolveConflict = useCallback(
    async (resolve: boolean) => {
      if (!pendingConflicts) return;

      if (resolve) {
        await onUpdateBinding(
          pendingConflicts.actionId,
          pendingConflicts.binding,
          true // resolve conflicts
        );
      }
      setPendingConflicts(null);
    },
    [pendingConflicts, onUpdateBinding]
  );

  const handleResetAll = useCallback(async () => {
    await onResetAll();
  }, [onResetAll]);

  // Group actions by category
  const actionsByCategory = {
    editing: KEYBOARD_ACTIONS.filter((a) => a.category === 'editing'),
    movement: KEYBOARD_ACTIONS.filter((a) => a.category === 'movement'),
    navigation: KEYBOARD_ACTIONS.filter((a) => a.category === 'navigation'),
  };

  const categoryLabels = {
    editing: 'Editing',
    movement: 'Shape Movement',
    navigation: 'Canvas Navigation',
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-(--color-modal-overlay)"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-col bg-(--color-modal-bg)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-settings-title"
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between border-(--color-border)">
          <h2
            id="keyboard-settings-title"
            className="m-0 text-lg font-semibold text-(--color-text-primary)"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border-none cursor-pointer transition-colors bg-transparent text-(--color-text-tertiary)"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <p className="mt-0 mb-4 text-sm text-(--color-text-secondary)">
            Click on a shortcut to change it. Press Escape to cancel.
          </p>

          {Object.entries(actionsByCategory).map(([category, actions]) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="m-0 mb-3 text-xs uppercase font-medium text-(--color-text-tertiary)">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h3>
              <div className="space-y-2">
                {actions.map((action) => {
                  const binding = mappings[action.id];
                  const isListening = listeningFor === action.id;
                  const isRemappable = action.allowRemap !== false;

                  return (
                    <div
                      key={action.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-(--color-bg-tertiary)"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm font-medium text-(--color-text-primary)">
                          {action.label}
                        </div>
                        <div className="text-xs truncate text-(--color-text-tertiary)">
                          {action.description}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartListening(action.id)}
                        disabled={!isRemappable}
                        className={`px-3 py-1.5 rounded-md text-sm font-mono border transition-colors min-w-20 bg-(--color-bg-secondary) border-(--color-border) ${
                          isListening ? 'ring-2 ring-blue-500' : ''
                        } ${
                          binding ? 'text-(--color-text-primary)' : 'text-(--color-text-tertiary)'
                        } ${
                          isRemappable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                        }`}
                        title={
                          isRemappable
                            ? 'Click to change'
                            : 'This shortcut cannot be changed'
                        }
                      >
                        {isListening
                          ? 'Press a key...'
                          : binding
                          ? formatKeyBinding(binding)
                          : 'Not set'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between border-(--color-border)">
          <button
            onClick={handleResetAll}
            className="px-4 py-2 rounded-md border-none cursor-pointer text-sm font-medium transition-colors bg-(--color-bg-tertiary) text-(--color-text-primary)"
          >
            Reset to Defaults
          </button>
          <div className="flex items-center gap-3">
            {syncing && (
              <span className="text-xs text-(--color-text-tertiary)">
                Saving...
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border-none cursor-pointer text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Resolution Dialog */}
      {pendingConflicts && (
        <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/50">
          <div className="p-6 rounded-xl max-w-sm text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] bg-(--color-modal-bg)">
            <h3 className="m-0 mb-3 text-lg font-semibold text-(--color-text-primary)">
              Shortcut Conflict
            </h3>
            <p className="m-0 mb-4 text-sm text-(--color-text-secondary)">
              <span className="font-mono font-medium">
                {formatKeyBinding(pendingConflicts.binding)}
              </span>{' '}
              is already used by{' '}
              <span className="font-medium">
                {pendingConflicts.conflicts
                  .map((id) => KEYBOARD_ACTIONS_MAP.get(id)?.label)
                  .join(', ')}
              </span>
              . Replace it?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleResolveConflict(false)}
                className="px-4 py-2 rounded-md border-none cursor-pointer text-sm font-medium transition-colors bg-(--color-bg-tertiary) text-(--color-text-primary)"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolveConflict(true)}
                className="px-4 py-2 rounded-md border-none cursor-pointer text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
