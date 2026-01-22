import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFollows } from '../../hooks/useFollows';
import { FriendsModalTabs, type FriendsTab } from './FriendsModalTabs';
import { FriendsList } from './FriendsList';
import { UserSearchBar } from './UserSearchBar';

interface FriendsModalProps {
  onClose: () => void;
}

export function FriendsModal({ onClose }: FriendsModalProps) {
  const { user } = useAuth();
  const { following, followers, followingCount, followersCount, loading } = useFollows();
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<FriendsTab>('following');

  // Handle escape key and focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [onClose]);

  // Focus first focusable element on mount
  useEffect(() => {
    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements?.[0]?.focus();
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleNavigateToProfile = useCallback((userId: string) => {
    onClose();
    window.location.href = `?view=profile&user=${userId}`;
  }, [onClose]);

  // Not logged in state
  if (!user) {
    return (
      <div
        className="fixed inset-0 bg-(--color-modal-overlay) flex items-center justify-center z-50"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="friends-modal-title"
      >
        <div
          ref={modalRef}
          className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg p-6 w-full max-w-lg mx-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="friends-modal-title"
              className="text-lg font-semibold text-(--color-text-primary)"
            >
              Friends
            </h2>
            <button
              onClick={onClose}
              className="text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-[13px] text-(--color-text-secondary) text-center py-8">
            Please sign in to manage friends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-(--color-modal-overlay) flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="friends-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-(--color-bg-primary) border border-(--color-border) rounded-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--color-border)">
          <h2
            id="friends-modal-title"
            className="text-lg font-semibold text-(--color-text-primary)"
          >
            Friends
          </h2>
          <button
            onClick={onClose}
            className="text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <FriendsModalTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          followingCount={followingCount}
          followersCount={followersCount}
          loading={loading}
        />

        {/* Search bar */}
        <div className="px-4 pt-4">
          <UserSearchBar onNavigateToProfile={handleNavigateToProfile} />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4">
          <FriendsList
            users={activeTab === 'following' ? following : followers}
            listType={activeTab}
            loading={loading}
            onNavigateToProfile={handleNavigateToProfile}
          />
        </div>
      </div>
    </div>
  );
}
