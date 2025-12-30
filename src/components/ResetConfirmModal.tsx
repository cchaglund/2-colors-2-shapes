interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmModal({ onConfirm, onCancel }: ResetConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-1000"
      style={{ backgroundColor: 'var(--color-modal-overlay)' }}
    >
      <div
        className="p-6 rounded-xl max-w-100 text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        style={{ backgroundColor: 'var(--color-modal-bg)' }}
      >
        <h3
          className="m-0 mb-3 text-xl"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Reset Canvas?
        </h3>
        <p
          className="m-0 mb-5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          This will delete all shapes and cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            className="px-6 py-2.5 rounded-md border-none cursor-pointer text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
            }}
            onClick={onCancel}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 rounded-md border-none cursor-pointer text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600"
            onClick={onConfirm}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
