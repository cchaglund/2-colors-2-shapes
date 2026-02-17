import { useState, useMemo, useCallback, useRef } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { LayerPanel } from './components/LayerPanel';
import { ZoomControls } from './components/ZoomControls';
import { ActionToolbar } from './components/ActionToolbar';
import { ShapeExplorer } from './components/admin/ShapeExplorer';
import { ColorTester } from './components/admin/ColorTester';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { Calendar } from './components/Calendar';
import { GalleryPage } from './components/GalleryPage';
import { SubmissionDetailPage } from './components/SubmissionDetailPage';
import { WinnersDayPage } from './components/WinnersDayPage';
import { WallOfTheDayPage } from './components/WallOfTheDay/WallOfTheDayPage';
import { UserProfilePage } from './components/UserProfilePage';
import { FriendsFeedPage } from './components/FriendsFeed/FriendsFeedPage';
import { FollowsProvider } from './contexts/FollowsContext';
import { KeyboardSettingsModal } from './components/KeyboardSettingsModal';
import { FriendsModal } from './components/modals/FriendsModal';
import { VotingModal } from './components/voting';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { VotingTestPage } from './test/VotingTestPage';
import { SocialTestPage } from './test/SocialTestPage';
import { Dashboard } from './components/admin/Dashboard';
import { useCanvasState } from './hooks/useCanvasState';
import { useViewportState } from './hooks/useViewportState';
import { useSidebarState } from './hooks/useSidebarState';
import { useThemeState } from './hooks/useThemeState';
import { useGridState } from './hooks/useGridState';
import { useOffCanvasState } from './hooks/useOffCanvasState';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useSubmissions } from './hooks/useSubmissions';
import { useWelcomeModal } from './hooks/useWelcomeModal';
import { useKeyboardSettings } from './hooks/useKeyboardSettings';
import { useWinnerAnnouncement } from './hooks/useWinnerAnnouncement';
import { useShapeActions } from './hooks/useShapeActions';
import { useBackgroundPanning } from './hooks/useBackgroundPanning';
import { useSaveSubmission } from './hooks/useSaveSubmission';
import { useSubmissionSync } from './hooks/useSubmissionSync';
import { invalidateWallCache } from './hooks/useWallOfTheDay';
import { getTodayDateUTC, getYesterdayDateUTC } from './utils/dailyChallenge';
import { supabase } from './lib/supabase';
import { useDailyChallenge } from './hooks/useDailyChallenge';
import {
  isShapeExplorerEnabled,
  getSubmissionView,
  isVotingTestEnabled,
  isSocialTestEnabled,
  isDashboardEnabled,
  isColorTesterEnabled,
  getWinnersDayView,
  getWallOfTheDayView,
  getProfileView,
  getFriendsFeedView,
  getGalleryView,
} from './utils/urlParams';
import { WinnerAnnouncementModal } from './components/modals/WinnerAnnouncementModal';
import { CongratulatoryModal } from './components/modals/CongratulatoryModal';

function App() {
  // Check URL-based view modes
  const showExplorer = useMemo(() => isShapeExplorerEnabled(), []);
  const submissionView = useMemo(() => getSubmissionView(), []);
  const winnersDayView = useMemo(() => getWinnersDayView(), []);
  const showVotingTest = useMemo(() => isVotingTestEnabled(), []);
  const showSocialTest = useMemo(() => isSocialTestEnabled(), []);
  const wallOfTheDayView = useMemo(() => getWallOfTheDayView(), []);
  const profileView = useMemo(() => getProfileView(), []);
  const friendsFeedView = useMemo(() => getFriendsFeedView(), []);
  const galleryView = useMemo(() => getGalleryView(), []);
  const showDashboard = useMemo(() => isDashboardEnabled(), []);
  const showColorTester = useMemo(() => isColorTesterEnabled(), []);

  // Modal states
  const [showCalendar, setShowCalendar] = useState(false);
  const [showKeyboardSettings, setShowKeyboardSettings] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const { isOpen: showWelcome, dismiss: dismissWelcome } = useWelcomeModal();

  // Refs
  const mainRef = useRef<HTMLElement>(null);

  // Fetch today's challenge from server
  const todayDate = useMemo(() => getTodayDateUTC(), []);
  const { challenge, loading: challengeLoading } = useDailyChallenge(todayDate);

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
  const [congratsDismissed, setCongratsDismissed] = useState(false);
  const [winnerDismissed, setWinnerDismissed] = useState(false);

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
      setShowVotingModal(true);
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
  const handleReset = () => setShowResetConfirm(true);
  const confirmReset = () => {
    resetCanvas();
    setShowResetConfirm(false);
  };
  const cancelReset = () => setShowResetConfirm(false);

  // Handler for opting into ranking without voting (bootstrap case: < 2 other submissions)
  const handleOptInToRanking = useCallback(async () => {
    if (!user || !challenge) {
      console.error('[handleOptInToRanking] Missing user or challenge', { user: !!user, challenge: !!challenge });
      return;
    }
    console.log('[handleOptInToRanking] Updating submission', { userId: user.id, date: challenge.date });
    const { error } = await supabase
      .from('submissions')
      .update({ included_in_ranking: true })
      .eq('user_id', user.id)
      .eq('challenge_date', challenge.date);
    if (error) {
      console.error('[handleOptInToRanking] Error:', error);
    } else {
      console.log('[handleOptInToRanking] Success!');
    }
  }, [user, challenge]);

  // Computed values
  const backgroundColor =
    canvasState.backgroundColorIndex !== null && challenge
      ? challenge.colors[canvasState.backgroundColorIndex]
      : null;

  // Render test pages early (before challenge loading) since they use mock data
  if (showExplorer) return <ShapeExplorer />;
  if (showVotingTest) return <VotingTestPage />;
  if (showSocialTest) return <SocialTestPage />;
  if (showDashboard) return <Dashboard />;
  if (showColorTester) return <ColorTester />;

  // Standalone pages that don't need challenge data
  if (galleryView) return <FollowsProvider><GalleryPage tab={galleryView.tab} /></FollowsProvider>;
  if (wallOfTheDayView) return <WallOfTheDayPage date={wallOfTheDayView.date} />;
  if (profileView) return <FollowsProvider><UserProfilePage userId={profileView.userId} /></FollowsProvider>;
  if (friendsFeedView) return <FollowsProvider><FriendsFeedPage date={friendsFeedView.date} /></FollowsProvider>;

  // Show loading spinner while challenge is loading
  if (challengeLoading || !challenge) {
    return (
      <div className="flex h-screen items-center justify-center bg-(--color-bg-primary)">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-(--color-text-secondary) border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-(--color-text-secondary)">Loading today's challenge...</p>
        </div>
      </div>
    );
  }

  // Render special view pages based on URL params
  if (winnersDayView) return <WinnersDayPage date={winnersDayView.date} />;
  if (submissionView) {
    if ('id' in submissionView) {
      return <FollowsProvider><SubmissionDetailPage submissionId={submissionView.id} /></FollowsProvider>;
    }
    return <FollowsProvider><SubmissionDetailPage date={submissionView.date} /></FollowsProvider>;
  }

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
          updateShapes(updates);
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
        onOpenFriendsModal={() => setShowFriendsModal(true)}
        keyMappings={keyMappings}
        onOpenKeyboardSettings={() => setShowKeyboardSettings(true)}
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
        onRenameShape={(id, name) => updateShape(id, { name })}
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

      {showCalendar && (
        <FollowsProvider>
          <Calendar onClose={() => setShowCalendar(false)} />
        </FollowsProvider>
      )}

      {showKeyboardSettings && (
        <KeyboardSettingsModal
          mappings={keyMappings}
          onUpdateBinding={updateBinding}
          onResetAll={resetAllBindings}
          onClose={() => setShowKeyboardSettings(false)}
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
                setCongratsDismissed(true);
              }}
            />
          ) : !winnerDismissed ? (
            <WinnerAnnouncementModal
              challengeDate={winnerChallengeDate}
              topThree={winnerTopThree}
              onDismiss={() => {
                dismissWinnerAnnouncement();
                setWinnerDismissed(true);
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
          onComplete={() => setShowVotingModal(false)}
          onSkipVoting={() => setShowVotingModal(false)}
          onOptInToRanking={handleOptInToRanking}
        />
      )}

      {/* Friends modal */}
      {showFriendsModal && (
        <FollowsProvider>
          <FriendsModal onClose={() => setShowFriendsModal(false)} />
        </FollowsProvider>
      )}
    </div>
  );
}

export default App;
