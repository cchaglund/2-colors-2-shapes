import { useState, useCallback } from 'react';

export function useAppModals() {
  const [showKeyboardSettings, setShowKeyboardSettings] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [congratsDismissed, setCongratsDismissed] = useState(false);
  const [winnerDismissed, setWinnerDismissed] = useState(false);

  const openKeyboardSettings = useCallback(() => setShowKeyboardSettings(true), []);
  const closeKeyboardSettings = useCallback(() => setShowKeyboardSettings(false), []);

  const openVotingModal = useCallback(() => setShowVotingModal(true), []);
  const closeVotingModal = useCallback(() => setShowVotingModal(false), []);

  const openResetConfirm = useCallback(() => setShowResetConfirm(true), []);
  const closeResetConfirm = useCallback(() => setShowResetConfirm(false), []);

  const openFriendsModal = useCallback(() => setShowFriendsModal(true), []);
  const closeFriendsModal = useCallback(() => setShowFriendsModal(false), []);

  const dismissCongrats = useCallback(() => setCongratsDismissed(true), []);
  const dismissWinner = useCallback(() => setWinnerDismissed(true), []);

  return {
    showKeyboardSettings,
    showVotingModal,
    showResetConfirm,
    showFriendsModal,
    congratsDismissed,
    winnerDismissed,

    openKeyboardSettings,
    closeKeyboardSettings,
    openVotingModal,
    closeVotingModal,
    openResetConfirm,
    closeResetConfirm,
    openFriendsModal,
    closeFriendsModal,
    dismissCongrats,
    dismissWinner,
  };
}
