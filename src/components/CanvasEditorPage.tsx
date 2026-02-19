import { useCallback, useRef } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { LayerPanel } from './LayerPanel';
import { ZoomControls } from './ZoomControls';
import { ActionToolbar } from './ActionToolbar';
import { OnboardingModal } from './modals/OnboardingModal';
import { WelcomeModal } from './modals/WelcomeModal';
import { FollowsProvider } from '../contexts/FollowsContext';
import { KeyboardSettingsModal } from './KeyboardSettingsModal';
import { FriendsModal } from './modals/FriendsModal';
import { VotingModal } from './voting';
import { ResetConfirmModal } from './ResetConfirmModal';
import { WinnerAnnouncementModal } from './modals/WinnerAnnouncementModal';
import { CongratulatoryModal } from './modals/CongratulatoryModal';
import { useCanvasState } from '../hooks/canvas/useCanvasState';
import { UndoRedoToast } from './UndoRedoToast';
import { useViewportState } from '../hooks/canvas/useViewportState';
import { useSidebarState } from '../hooks/ui/useSidebarState';
import { useThemeState } from '../hooks/ui/useThemeState';
import { useGridState } from '../hooks/canvas/useGridState';
import { useOffCanvasState } from '../hooks/canvas/useOffCanvasState';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfile } from '../hooks/auth/useProfile';
import { useSubmissions } from '../hooks/submission/useSubmissions';
import { useWelcomeModal } from '../hooks/ui/useWelcomeModal';
import { useKeyboardSettings } from '../hooks/ui/useKeyboardSettings';
import { useWinnerAnnouncement } from '../hooks/ui/useWinnerAnnouncement';
import { useShapeActions } from '../hooks/canvas/useShapeActions';
import { useBackgroundPanning } from '../hooks/canvas/useBackgroundPanning';
import { useAppModals } from '../hooks/ui/useAppModals';
import { useSaveSubmission } from '../hooks/submission/useSaveSubmission';
import { useSubmissionSync } from '../hooks/submission/useSubmissionSync';
import { invalidateWallCache } from '../hooks/challenge/useWallOfTheDay';
import { getYesterdayDateUTC } from '../utils/dailyChallenge';
import { supabase } from '../lib/supabase';
import type { DailyChallenge } from '../types';
import { useMemo } from 'react';

interface CanvasEditorPageProps {
  challenge: DailyChallenge;
  todayDate: string;
}

export function CanvasEditorPage({ challenge, todayDate }: CanvasEditorPageProps) {
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

  // Refs
  const mainRef = useRef<HTMLElement>(null);

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

  // Theme state
  const { mode: themeMode, setMode: setThemeMode } = useThemeState();

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

  // Background panning
  const { isBackgroundPanning, handleBackgroundMouseDown } = useBackgroundPanning({
    mainRef,
    panX: viewport.panX,
    panY: viewport.panY,
    setPan,
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

  // Computed values
  const backgroundColor =
    canvasState.backgroundColorIndex !== null && challenge
      ? challenge.colors[canvasState.backgroundColorIndex]
      : null;

  // Show onboarding modal if user is logged in but hasn't completed onboarding
  const showOnboarding = user && profile && !profile.onboarding_complete;

  return (
    <div className="flex h-screen">
      {showWelcome && <WelcomeModal onDismiss={dismissWelcome} challenge={challenge} />}
      {showOnboarding && <OnboardingModal onComplete={updateNickname} />}

      <Toolbar
        challenge={challenge}
        backgroundColorIndex={canvasState.backgroundColorIndex}
        selectedShapeIds={canvasState.selectedShapeIds}
        onAddShape={addShape}
        onSetBackground={setBackgroundColor}
        onChangeShapeColor={(colorIndex) => {
          const updates = new Map<string, { colorIndex: 0 | 1 }>();
          canvasState.selectedShapeIds.forEach((id) => {
            updates.set(id, { colorIndex });
          });
          updateShapes(updates, true, 'Change color');
        }}
        onReset={handleReset}
        isOpen={leftOpen}
        width={leftWidth}
        onToggle={toggleLeft}
        onStartResize={startResizeLeft}
        themeMode={themeMode}
        onSetThemeMode={setThemeMode}
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

      <main
        ref={mainRef}
        className="flex-1 flex items-center justify-center canvas-bg-checkered overflow-auto relative"
        style={{ cursor: isBackgroundPanning ? 'grabbing' : undefined }}
        onMouseDown={handleBackgroundMouseDown}
        onClick={() => selectShape(null)}
      >
        <div className="overflow-visible p-16 canvas-wrapper" style={{ cursor: isBackgroundPanning ? 'grabbing' : 'grab' }}>
          <Canvas
            shapes={canvasState.shapes}
            selectedShapeIds={canvasState.selectedShapeIds}
            backgroundColor={backgroundColor}
            challenge={challenge}
            viewport={viewport}
            keyMappings={keyMappings}
            showGrid={showGrid}
            showOffCanvas={showOffCanvas}
            onSelectShape={selectShape}
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
        onSelectGroup={selectGroup}
        isOpen={rightOpen}
        width={rightWidth}
        onToggle={toggleRight}
        onStartResize={startResizeRight}
      />

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
