import { Modal } from '../shared/Modal';
import { PillButton } from '../shared/PillButton';

interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmModal({ onConfirm, onCancel }: ResetConfirmModalProps) {
  return (
    <Modal
      onClose={onCancel}
      size="max-w-100"
      className="text-center"
      closeOnEscape={false}
      closeOnBackdropClick={false}
      zIndex="z-1000"
      ariaLabelledBy="reset-confirm-title"
      dataTestId="reset-confirm-modal"
    >
      <h3
        id="reset-confirm-title"
        className="m-0 mb-3 text-lg font-semibold text-(--color-text-primary)"
      >
        Reset Canvas?
      </h3>
      <p className="m-0 mb-5 text-[13px] text-(--color-text-secondary)">
        This will delete all shapes and cannot be undone.
      </p>
      <div className="flex gap-3 justify-center">
        <PillButton variant="ghost" onClick={onCancel}>
          Cancel
        </PillButton>
        <PillButton variant="danger" onClick={onConfirm}>
          Reset
        </PillButton>
      </div>
    </Modal>
  );
}
