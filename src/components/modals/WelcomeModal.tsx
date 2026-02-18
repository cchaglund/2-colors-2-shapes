import type { DailyChallenge } from '../../types';
import { Modal } from '../Modal';
import { ShapeIcon } from '../ShapeIcon';

interface WelcomeModalProps {
  onDismiss: () => void;
  challenge?: DailyChallenge | null;
}

export function WelcomeModal({ onDismiss, challenge }: WelcomeModalProps) {
  return (
    <Modal onClose={onDismiss} ariaLabelledBy="welcome-title" dataTestId="welcome-modal">
      <h2
        id="welcome-title"
        className="text-xl font-semibold text-(--color-text-primary) mb-5 text-center"
      >
        Welcome to 2 Colors 2 Shapes!
      </h2>

      {challenge && (
        <div className="flex flex-col items-center gap-3 mt-11 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full border border-(--color-border)"
              style={{ backgroundColor: challenge.colors[0] }}
            />
            <div
              className="w-6 h-6 rounded-full border border-(--color-border)"
              style={{ backgroundColor: challenge.colors[1] }}
            />
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <span className="text-(--color-text-tertiary)">
              <ShapeIcon type={challenge.shapes[0].type} size={22} />
            </span>
            <span className="text-(--color-text-tertiary)">
              <ShapeIcon type={challenge.shapes[1].type} size={22} />
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <p className="text-md text-(--color-text-secondary) text-center">
          Each day brings a new <strong>creative challenge</strong> — make art using today's 2 colors and 2 shapes!
        </p>
      </div>

      <div className='border border-gray-200 my-10 w-[70%] mx-auto'></div>

      <div className="flex items-center gap-6 mb-6">
        <p className="text-[25px]">
          🧠
        </p>

        <p className="text-[14px] text-(--color-text-secondary) italic">
          Challenge your creativity — have fun expressing yourself in a simple and playful way
        </p>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <p className="text-[25px]">
          🌎
        </p>

        <p className="text-[14px] text-(--color-text-secondary) italic">
          Compete daily — Submit your art and join the community in voting for their favorites (optional, no pressure!)
        </p>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <p className="text-[25px]">
          🥳
        </p>

        <p className="text-[14px] text-(--color-text-secondary) italic">
          Follow your friends — See what your friends are creating and show them some love
        </p>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <p className="text-[25px]">
          🖼️
        </p>

        <p className="text-[14px] text-(--color-text-secondary) italic">
          Collect your creations — Your daily art is saved in your profile, so you can look back on your creative journey over time
        </p>
      </div>

      <button
        onClick={onDismiss}
        className="w-full mt-6 px-4 py-2 text-white rounded-md text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 bg-(--color-accent) hover:bg-(--color-accent-hover) cursor-pointer"
      >
        Start creating
      </button>
    </Modal>
  );
}
