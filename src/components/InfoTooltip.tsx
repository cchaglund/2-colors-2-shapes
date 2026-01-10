import { useState, type ReactNode } from 'react';
import {
  useFloating,
  useHover,
  useInteractions,
  offset,
  flip,
  shift,
  FloatingPortal,
} from '@floating-ui/react';

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift()],
    placement: 'top',
  });

  const hover = useHover(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  // These are callback refs from floating-ui, safe to use during render
  const setReference = refs.setReference;
  const setFloating = refs.setFloating;

  return (
    <>
      <div
        // eslint-disable-next-line react-hooks/refs -- callback ref from floating-ui
        ref={setReference}
        {...getReferenceProps()}
        className="inline-block h-full"
      >
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            // eslint-disable-next-line react-hooks/refs -- callback ref from floating-ui
            ref={setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="capitalize max-w-xs px-2.5 py-1.5 text-[11px] text-white bg-neutral-800 rounded-md z-50"
          >
            {text}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip text={text}>
      <span
        className="align-middle inline-flex items-center justify-center w-4 h-4 ml-1.5 text-xs rounded-full bg-(--color-bg-tertiary) text-(--color-text-tertiary) cursor-help hover:bg-(--color-accent) hover:text-white transition-colors"
        aria-label="More information"
      >
        i
      </span>
    </Tooltip>
  );
}
