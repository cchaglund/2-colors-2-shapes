import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { LayerPanel } from '../LayerPanel';
import { ZoomControls } from './ZoomControls';
import { ActionToolbar } from './ActionToolbar';
import { OnboardingModal } from '../modals/OnboardingModal';
import { WelcomeModal } from '../modals/WelcomeModal';
import { FollowsProvider } from '../../contexts/FollowsContext';
import { KeyboardSettingsModal } from './KeyboardSettingsModal';
import { FriendsModal } from '../modals/FriendsModal';
import { VotingModal } from '../voting';
import { ResetConfirmModal } from './ResetConfirmModal';
import { WinnerAnnouncementModal } from '../modals/WinnerAnnouncementModal';
import { CongratulatoryModal } from '../modals/CongratulatoryModal';
import { useCanvasState } from '../../hooks/canvas/useCanvasState';
import { UndoRedoToast } from './UndoRedoToast';
import { useViewportState } from '../../hooks/canvas/useViewportState';
import { useSidebarState } from '../../hooks/ui/useSidebarState';
import type { ThemeMode, ThemeName } from '../../hooks/ui/useThemeState';
import { useGridState } from '../../hooks/canvas/useGridState';
import { useOffCanvasState } from '../../hooks/canvas/useOffCanvasState';
import { useAuth } from '../../hooks/auth/useAuth';
import { useProfile } from '../../hooks/auth/useProfile';
import { useSubmissions } from '../../hooks/submission/useSubmissions';
import { useWelcomeModal } from '../../hooks/ui/useWelcomeModal';
import { useKeyboardSettings } from '../../hooks/ui/useKeyboardSettings';
import { useWinnerAnnouncement } from '../../hooks/ui/useWinnerAnnouncement';
import { useShapeActions } from '../../hooks/canvas/useShapeActions';

import { useAppModals } from '../../hooks/ui/useAppModals';
import { useSaveSubmission } from '../../hooks/submission/useSaveSubmission';
import { useSubmissionSync } from '../../hooks/submission/useSubmissionSync';
import { invalidateWallCache } from '../../hooks/challenge/useWallOfTheDay';
import { getYesterdayDateUTC } from '../../utils/dailyChallenge';
import { supabase } from '../../lib/supabase';
import type { DailyChallenge } from '../../types';
import { useMemo } from 'react';

interface CanvasEditorPageProps {
  challenge: DailyChallenge;
  todayDate: string;
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
  themeName: ThemeName;
  onSetThemeName: (name: ThemeName) => void;
}

export function CanvasEditorPage({ challenge, todayDate, themeMode, onSetThemeMode, themeName, onSetThemeName }: CanvasEditorPageProps) {
  // Modal states
  const {
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
  } = useAppModals();
  const { isOpen: showWelcome, dismiss: dismissWelcome } = useWelcomeModal();

  // Auth state
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateNickname } = useProfile(user?.id);
  const { saveSubmission, loadSubmission, saving, hasSubmittedToday } = useSubmissions(user?.id, todayDate);

  // Winner announcement for yesterday's results
  const {
    shouldShow: showWinnerAnnouncement,
    topThree: winnerTopThree,
    challengeDate: winnerChallengeDate,
    dismiss: dismissWinnerAnnouncement,
    loading: winnerLoading,
    userPlacement,
    persistSeen,
  } = useWinnerAnnouncement(user?.id);

  // Yesterday's date for voting
  const yesterdayDate = useMemo(() => getYesterdayDateUTC(), []);

  // Keyboard settings
  const {
    mappings: keyMappings,
    updateBinding,
    resetAllBindings,
    syncing: keyboardSyncing,
  } = useKeyboardSettings(user?.id);

  // Canvas state
  const {
    canvasState,
    addShape,
    duplicateShapes,
    updateShape,
    updateShapes,
    deleteShape,
    deleteSelectedShapes,
    selectShape,
    selectShapes,
    moveLayer,
    moveGroup,
    reorderLayers,
    reorderGroup,
    setBackgroundColor,
    resetCanvas,
    mirrorHorizontal,
    mirrorVertical,
    undo,
    redo,
    canUndo,
    canRedo,
    commitToHistory,
    createGroup,
    deleteGroup,
    ungroupShapes,
    renameGroup,
    toggleGroupCollapsed,
    toggleShapeVisibility,
    toggleGroupVisibility,
    selectGroup,
    loadCanvasState,
    toast,
    dismissToast,
  } = useCanvasState(challenge, user?.id);

  // Sync submission from server
  useSubmissionSync({
    userId: user?.id,
    challenge,
    loadSubmission,
    loadCanvasState,
  });

  // Viewport state
  const {
    viewport,
    setZoom,
    setPan,
    zoomAtPoint,
    setZoomAtPoint,
    resetViewport,
    minZoom,
    maxZoom,
  } = useViewportState();

  // Sidebar state
  const {
    leftOpen,
    rightOpen,
    leftWidth,
    rightWidth,
    toggleLeft,
    toggleRight,
    startResizeLeft,
    startResizeRight,
  } = useSidebarState();

  // Theme state (received from App)

  // Grid state
  const { showGrid, toggleGrid } = useGridState();

  // Off-canvas state
  const { showOffCanvas, toggleOffCanvas } = useOffCanvasState();

  // Shape actions (move, rotate, resize, mirror, duplicate)
  const {
    handleMoveShapes,
    handleRotateShapes,
    handleDuplicate,
    handleMirrorHorizontal,
    handleMirrorVertical,
    handleResizeShapes,
  } = useShapeActions({
    shapes: canvasState.shapes,
    selectedShapeIds: canvasState.selectedShapeIds,
    updateShapes,
    duplicateShapes,
    mirrorHorizontal,
    mirrorVertical,
  });

  // Save submission
  const { saveStatus, handleSave } = useSaveSubmission({
    challenge,
    shapes: canvasState.shapes,
    groups: canvasState.groups,
    backgroundColorIndex: canvasState.backgroundColorIndex,
    user,
    saveSubmission,
    onSaveSuccess: () => {
      if (challenge) {
        invalidateWallCache(challenge.date);
      }
      openVotingModal();
    },
  });

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(viewport.zoom + 0.1);
  }, [viewport.zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(viewport.zoom - 0.1);
  }, [viewport.zoom, setZoom]);

  // Reset handlers
  const handleReset = () => openResetConfirm();
  const confirmReset = () => {
    resetCanvas();
    closeResetConfirm();
  };
  const cancelReset = () => closeResetConfirm();

  // Handler for opting into ranking without voting (bootstrap case: < 2 other submissions)
  const handleOptInToRanking = useCallback(async () => {
    if (!user || !challenge) {
      console.error('[handleOptInToRanking] Missing user or challenge', { user: !!user, challenge: !!challenge });
      return;
    }
    const { error } = await supabase
      .from('submissions')
      .update({ included_in_ranking: true })
      .eq('user_id', user.id)
      .eq('challenge_date', challenge.date);
    if (error) {
      console.error('[handleOptInToRanking] Error:', error);
    }
  }, [user, challenge]);

  // Hover highlight state (transient UI, not canvas document state)
  const [hoveredShapeIds, setHoveredShapeIds] = useState<Set<string> | null>(null);

  // Computed values
  const backgroundColor =
    canvasState.backgroundColorIndex !== null && challenge
      ? challenge.colors[canvasState.backgroundColorIndex]
      : null;

  // Marquee selection from outside the canvas (checkerboard background)
  const marqueeStartRef = useRef<((clientX: number, clientY: number) => void) | null>(null);
  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || target.classList.contains('canvas-wrapper')) {
      if (e.button !== 0) return;
      e.preventDefault(); // Prevent text selection during marquee drag
      marqueeStartRef.current?.(e.clientX, e.clientY);
    }
  }, []);

  // Show onboarding modal if user is logged in but hasn't completed onboarding
  const showOnboarding = user && profile && !profile.onboarding_complete;

  return (
    <div className="relative h-screen overflow-hidden">
      {showWelcome && <WelcomeModal onDismiss={dismissWelcome} challenge={challenge} />}
      {showOnboarding && <OnboardingModal onComplete={updateNickname} />}

      {/* Canvas fills full viewport */}
      <main
        className="w-full h-full flex items-center justify-center canvas-bg-checkered overflow-auto relative"
        onMouseDown={handleBackgroundMouseDown}
      >
        <div className="overflow-visible p-16 canvas-wrapper">
          <Canvas
            shapes={canvasState.shapes}
            groups={canvasState.groups}
            selectedShapeIds={canvasState.selectedShapeIds}
            backgroundColor={backgroundColor}
            challenge={challenge}
            viewport={viewport}
            keyMappings={keyMappings}
            showGrid={showGrid}
            showOffCanvas={showOffCanvas}
            onSelectShape={selectShape}
            onSelectShapes={selectShapes}
            onUpdateShape={updateShape}
            onUpdateShapes={updateShapes}
            onCommitToHistory={commitToHistory}
            onDuplicateShapes={duplicateShapes}
            onDeleteSelectedShapes={deleteSelectedShapes}
            onUndo={undo}
            onRedo={redo}
            onMirrorHorizontal={mirrorHorizontal}
            onMirrorVertical={mirrorVertical}
            onZoomAtPoint={zoomAtPoint}
            onSetZoomAtPoint={setZoomAtPoint}
            onPan={setPan}
            onToggleGrid={toggleGrid}
            hoveredShapeIds={hoveredShapeIds}
            marqueeStartRef={marqueeStartRef}
          />
        </div>

        {/* Action toolbar at top */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <ActionToolbar
            keyMappings={keyMappings}
            hasSelection={canvasState.selectedShapeIds.size > 0}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onDuplicate={handleDuplicate}
            onDelete={deleteSelectedShapes}
            onMoveUp={() => handleMoveShapes(0, -1)}
            onMoveDown={() => handleMoveShapes(0, 1)}
            onMoveLeft={() => handleMoveShapes(-1, 0)}
            onMoveRight={() => handleMoveShapes(1, 0)}
            onRotateClockwise={() => handleRotateShapes(1)}
            onRotateCounterClockwise={() => handleRotateShapes(-1)}
            onSizeIncrease={() => handleResizeShapes(5)}
            onSizeDecrease={() => handleResizeShapes(-5)}
            onMirrorHorizontal={handleMirrorHorizontal}
            onMirrorVertical={handleMirrorVertical}
          />
        </div>

        {/* Zoom controls overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <ZoomControls
            zoom={viewport.zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={resetViewport}
            minZoom={minZoom}
            maxZoom={maxZoom}
          />
        </div>
      </main>

      {/* Left sidebar collapsed toggle */}
      {!leftOpen && (
        <button
          className="absolute left-0 top-4 z-20 px-1.5 py-3 cursor-pointer transition-colors border-r border-y border-(--color-border) rounded-r-md bg-(--color-bg-primary) hover:bg-(--color-hover)"
          onClick={toggleLeft}
          title="Show Toolbar"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="4 2 8 6 4 10" />
          </svg>
        </button>
      )}

      {/* Left sidebar overlay */}
      <AnimatePresence>
        {leftOpen && (
          <motion.div
            key="left-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
            exit={{ x: [0, '3%', '-100%'], transition: { duration: 0.4, times: [0, 0.15, 1], ease: ['easeOut', [0.55, 0, 1, 0.2]] } }}
            className="absolute top-0 left-0 h-full z-20 shadow-lg"
            style={{ width: leftWidth }}
          >
            <Toolbar
              challenge={challenge}
              backgroundColorIndex={canvasState.backgroundColorIndex}
              selectedShapeIds={canvasState.selectedShapeIds}
              onAddShape={addShape}
              onSetBackground={setBackgroundColor}
              onChangeShapeColor={(colorIndex) => {
                const updates = new Map<string, { colorIndex: number }>();
                canvasState.selectedShapeIds.forEach((id) => {
                  updates.set(id, { colorIndex });
                });
                updateShapes(updates, true, 'Change color');
              }}
              onReset={handleReset}
              onToggle={toggleLeft}
              onStartResize={startResizeLeft}
              themeMode={themeMode}
              onSetThemeMode={onSetThemeMode}
              themeName={themeName}
              onSetThemeName={onSetThemeName}
              isLoggedIn={!!user}
              onSave={handleSave}
              isSaving={saving}
              saveStatus={saveStatus}
              hasSubmittedToday={hasSubmittedToday}
              onOpenFriendsModal={openFriendsModal}
              keyMappings={keyMappings}
              onOpenKeyboardSettings={openKeyboardSettings}
              profile={profile}
              profileLoading={profileLoading}
              showGrid={showGrid}
              onToggleGrid={toggleGrid}
              showOffCanvas={showOffCanvas}
              onToggleOffCanvas={toggleOffCanvas}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right sidebar collapsed toggle */}
      {!rightOpen && (
        <button
          className="absolute right-0 top-4 z-20 px-1.5 py-3 cursor-pointer transition-colors border-l border-y border-(--color-border) rounded-l-md bg-(--color-bg-primary) hover:bg-(--color-hover)"
          onClick={toggleRight}
          title="Show Layers"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="8 2 4 6 8 10" />
          </svg>
        </button>
      )}

      {/* Right sidebar overlay */}
      <AnimatePresence>
        {rightOpen && (
          <motion.div
            key="right-sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
            exit={{ x: [0, '-3%', '100%'], transition: { duration: 0.4, times: [0, 0.15, 1], ease: ['easeOut', [0.55, 0, 1, 0.2]] } }}
            className="absolute top-0 right-0 h-full z-20 shadow-lg"
            style={{ width: rightWidth }}
          >
            <LayerPanel
              shapes={canvasState.shapes}
              groups={canvasState.groups}
              selectedShapeIds={canvasState.selectedShapeIds}
              challenge={challenge}
              onSelectShape={selectShape}
              onMoveLayer={moveLayer}
              onMoveGroup={moveGroup}
              onReorderLayers={reorderLayers}
              onReorderGroup={reorderGroup}
              onDeleteShape={deleteShape}
              onRenameShape={(id, name) => updateShape(id, { name }, true, 'Rename')}
              onCreateGroup={createGroup}
              onDeleteGroup={deleteGroup}
              onUngroupShapes={ungroupShapes}
              onRenameGroup={renameGroup}
              onToggleGroupCollapsed={toggleGroupCollapsed}
              onToggleShapeVisibility={toggleShapeVisibility}
              onToggleGroupVisibility={toggleGroupVisibility}
              onSelectGroup={selectGroup}
              onToggle={toggleRight}
              onStartResize={startResizeRight}
              onHoverShape={setHoveredShapeIds}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showResetConfirm && (
        <ResetConfirmModal onConfirm={confirmReset} onCancel={cancelReset} />
      )}

      {showKeyboardSettings && (
        <KeyboardSettingsModal
          mappings={keyMappings}
          onUpdateBinding={updateBinding}
          onResetAll={resetAllBindings}
          onClose={closeKeyboardSettings}
          syncing={keyboardSyncing}
        />
      )}

      {/* Congratulatory modal (user placed top 3) then winner announcement */}
      {showWinnerAnnouncement && !winnerLoading && (
        <>
          {userPlacement && !congratsDismissed ? (
            <CongratulatoryModal
              userEntry={userPlacement}
              challengeDate={winnerChallengeDate}
              onDismiss={() => {
                persistSeen();
                dismissCongrats();
              }}
            />
          ) : !winnerDismissed ? (
            <WinnerAnnouncementModal
              challengeDate={winnerChallengeDate}
              topThree={winnerTopThree}
              onDismiss={() => {
                dismissWinnerAnnouncement();
                dismissWinner();
              }}
              onViewSubmission={(submissionId: any) => {
                window.location.href = `?view=submission&id=${submissionId}`;
              }}
            />
          ) : null}
        </>
      )}

      {/* Voting modal - shows after saving a submission */}
      {showVotingModal && user && (
        <VotingModal
          userId={user.id}
          challengeDate={yesterdayDate}
          onComplete={closeVotingModal}
          onSkipVoting={closeVotingModal}
          onOptInToRanking={handleOptInToRanking}
        />
      )}

      {/* Friends modal */}
      {showFriendsModal && (
        <FollowsProvider>
          <FriendsModal onClose={closeFriendsModal} />
        </FollowsProvider>
      )}

      {toast && (
        <UndoRedoToast
          key={toast.key}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
