interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmModal({ onConfirm, onCancel }: ResetConfirmModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-1000 bg-(--color-modal-overlay)">
      <div className="p-6 rounded-lg max-w-100 text-center bg-(--color-bg-primary) border border-(--color-border)">
        <h3 className="m-0 mb-3 text-lg font-semibold text-(--color-text-primary)">
          Reset Canvas?
        </h3>
        <p className="m-0 mb-5 text-[13px] text-(--color-text-secondary)">
          This will delete all shapes and cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            className="px-5 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-colors bg-(--color-bg-tertiary) text-(--color-text-primary) border border-(--color-border) hover:bg-(--color-hover)"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded-md cursor-pointer text-[13px] font-medium transition-colors text-white bg-(--color-danger) border border-(--color-danger) hover:bg-(--color-danger-hover)"
            onClick={onConfirm}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
