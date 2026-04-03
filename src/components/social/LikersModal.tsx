import { Modal } from '../shared/Modal';
import { CloseButton } from '../shared/CloseButton';
import { AvatarImage } from '../shared/AvatarImage';
import { FollowButton } from './FollowButton';
import { navigate } from '../../lib/router';
import type { Liker } from '../../lib/api';

interface LikersModalProps {
  likers: Liker[];
  onClose: () => void;
}

export function LikersModal({ likers, onClose }: LikersModalProps) {
  return (
    <Modal
      onClose={onClose}
      size="max-w-sm"
      className="p-0! max-h-[80vh]! flex! flex-col!"
      closeOnEscape
      closeOnBackdropClick
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border-light) shrink-0">
        <h3 className="text-base font-bold font-display">Liked by</h3>
        <CloseButton onClick={onClose} />
      </div>

      {/* Liker list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin">
        {likers.length === 0 ? (
          <p className="text-sm text-(--color-text-tertiary) text-center py-6">
            No likes yet
          </p>
        ) : (
          likers.map((liker) => (
            <LikerRow key={liker.id} liker={liker} onClose={onClose} />
          ))
        )}
      </div>
    </Modal>
  );
}

function LikerRow({ liker, onClose }: { liker: Liker; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1 rounded-(--radius-sm) hover:bg-(--color-hover) transition-colors">
      <button
        onClick={() => {
          onClose();
          navigate(`?view=profile&user=${liker.id}`);
        }}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
      >
        <AvatarImage avatarUrl={liker.avatar_url} initial={liker.nickname[0]?.toUpperCase() ?? '?'} size="md" />
        <span className="text-sm font-semibold truncate text-(--color-text-primary)">
          {liker.nickname}
        </span>
      </button>
      <FollowButton targetUserId={liker.id} />
    </div>
  );
}
