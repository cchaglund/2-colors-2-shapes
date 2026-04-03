import { useState, type ReactNode } from 'react';
import {
  useFloating,
  useHover,
  useInteractions,
  offset,
  flip,
  shift,
  FloatingPortal,
  safePolygon,
  type Placement,
} from '@floating-ui/react';
import { AnimatePresence, motion } from 'motion/react';
import { AvatarImage } from '../shared/AvatarImage';
import { navigate } from '../../lib/router';
import type { Liker } from '../../lib/api';

interface LikersTooltipProps {
  children: ReactNode;
  likers: Liker[];
  totalCount: number;
  onViewAll: () => void;
  placement?: Placement;
}

const MAX_VISIBLE = 5;

export function LikersTooltip({ children, likers, totalCount, onViewAll, placement = 'top' }: LikersTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context, placement: resolvedPlacement } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 8 }),
    ],
    placement,
  });

  const hover = useHover(context, {
    handleClose: safePolygon(),
    delay: { open: 450 },
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

  // Callback refs from floating-ui, safe to extract
  const setReference = refs.setReference;
  const setFloating = refs.setFloating;

  // Nothing to show if no likes
  if (totalCount === 0) {
    return <>{children}</>;
  }

  const visible = likers.slice(0, MAX_VISIBLE);
  const hasMore = totalCount > MAX_VISIBLE;
  const isAbove = resolvedPlacement.startsWith('top');
  const slideY = isAbove ? 4 : -4;

  return (
    <>
      <div
        // eslint-disable-next-line react-hooks/refs -- callback ref from floating-ui
        ref={setReference}
        {...getReferenceProps()}
        className="inline-flex"
      >
        {children}
      </div>
      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <div
              // eslint-disable-next-line react-hooks/refs -- callback ref from floating-ui
              ref={setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-50"
            >
              {/* Inner wrapper handles animation so it doesn't fight floating-ui's transform */}
              <motion.div
                initial={{ opacity: 0, y: slideY }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: slideY }}
                transition={{
                  opacity: { duration: 0.15, ease: 'easeOut' },
                  y: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
                }}
              >
                <div className="bg-(--color-text-primary) text-(--color-bg-primary) rounded-(--radius-md) py-1.5 px-1 relative"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)', minWidth: '160px' }}
                >
                  {visible.map((liker) => (
                    <button
                      key={liker.id}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`?view=profile&user=${liker.id}`);
                      }}
                      className="flex items-center gap-2 w-full px-2 py-1 rounded-(--radius-sm) hover:bg-white/10 transition-colors text-left cursor-pointer"
                    >
                      <AvatarImage avatarUrl={liker.avatar_url} initial={liker.nickname[0]?.toUpperCase() ?? '?'} size="sm" />
                      <span className="text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                        {liker.nickname}
                      </span>
                    </button>
                  ))}
                  {hasMore && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onViewAll();
                      }}
                      className="w-full text-center text-[10.5px] font-semibold opacity-55 hover:opacity-100 hover:underline pt-1.5 pb-0.5 mt-0.5 cursor-pointer transition-opacity"
                      style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                      View all {totalCount} likes
                    </button>
                  )}
                </div>
                {/* Arrow */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    ...(isAbove
                      ? { bottom: -6, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid var(--color-text-primary)' }
                      : { top: -6, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid var(--color-text-primary)' }),
                    width: 0,
                    height: 0,
                  }}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}
