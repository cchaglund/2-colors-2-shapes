import { useState, useMemo, useCallback, useRef } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { LayerPanel } from './components/LayerPanel';
import { ZoomControls } from './components/ZoomControls';
import { ActionToolbar } from './components/ActionToolbar';
import { ShapeExplorer } from './components/ShapeExplorer';
import { ColorTester } from './components/ColorTester';
import { OnboardingModal } from './components/OnboardingModal';
import { WelcomeModal } from './components/WelcomeModal';
import { Calendar } from './components/Calendar';
import { SubmissionDetailPage } from './components/SubmissionDetailPage';
import { WinnersDayPage } from './components/WinnersDayPage';
import { KeyboardSettingsModal } from './components/KeyboardSettingsModal';
import { VotingModal } from './components/voting';
import { WinnerAnnouncementModal } from './components/WinnerAnnouncementModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { VotingTestPage } from './test/VotingTestPage';
import { Dashboard } from './components/Dashboard';
import { useCanvasState } from './hooks/useCanvasState';
import { useViewportState } from './hooks/useViewportState';
import { useSidebarState } from './hooks/useSidebarState';
import { useThemeState } from './hooks/useThemeState';
import { useGridState } from './hooks/useGridState';
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
import { getTodayDate, getYesterdayDate } from './utils/dailyChallenge';
import { useDailyChallenge } from './hooks/useDailyChallenge';
import {
  isShapeExplorerEnabled,
  getSubmissionView,
  isVotingTestEnabled,
  isDashboardEnabled,
  isColorTesterEnabled,
  getWinnersDayView,
} from './utils/urlParams';

function App() {
  // Check URL-based view modes
  const showExplorer = useMemo(() => isShapeExplorerEnabled(), []);
  const submissionView = useMemo(() => getSubmissionView(), []);
  const winnersDayView = useMemo(() => getWinnersDayView(), []);
  const showVotingTest = useMemo(() => isVotingTestEnabled(), []);
  const showDashboard = useMemo(() => isDashboardEnabled(), []);
  const showColorTester = useMemo(() => isColorTesterEnabled(), []);

  // Modal states
  const [showCalendar, setShowCalendar] = useState(false);
  const [showKeyboardSettings, setShowKeyboardSettings] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { isOpen: showWelcome, dismiss: dismissWelcome } = useWelcomeModal();

  // Refs
  const mainRef = useRef<HTMLElement>(null);

  // Fetch today's challenge from server
  const todayDate = useMemo(() => getTodayDate(), []);
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
  } = useWinnerAnnouncement(user?.id);

  // Yesterday's date for voting
  const yesterdayDate = useMemo(() => getYesterdayDate(), []);

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
    reorderLayers,
    setBackgroundColor,
    resetCanvas,
    mirrorHorizontal,
    mirrorVertical,
    undo,
    redo,
    canUndo,
    canRedo,
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
    onSaveSuccess: () => setShowVotingModal(true),
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

  // Computed values
  const backgroundColor =
    canvasState.backgroundColorIndex !== null && challenge
      ? challenge.colors[canvasState.backgroundColorIndex]
      : null;

  // Show loading spinner while challenge is loading
  if (challengeLoading || !challenge) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--color-text-secondary)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading today's challenge...</p>
        </div>
      </div>
    );
  }

  // Render special pages based on URL params
  if (showExplorer) return <ShapeExplorer />;
  if (showVotingTest) return <VotingTestPage />;
  if (showDashboard) return <Dashboard />;
  if (showColorTester) return <ColorTester />;
  if (winnersDayView) return <WinnersDayPage date={winnersDayView.date} />;
  if (submissionView) {
    if ('id' in submissionView) {
      return <SubmissionDetailPage submissionId={submissionView.id} />;
    }
    return <SubmissionDetailPage date={submissionView.date} />;
  }

  // Show onboarding modal if user is logged in but hasn't completed onboarding
  const showOnboarding = user && profile && !profile.onboarding_complete;

  return (
    <div className="flex h-screen">
      {showWelcome && <WelcomeModal onDismiss={dismissWelcome} />}
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
        onOpenCalendar={() => setShowCalendar(true)}
        keyMappings={keyMappings}
        onOpenKeyboardSettings={() => setShowKeyboardSettings(true)}
        profile={profile}
        profileLoading={profileLoading}
        showGrid={showGrid}
        onToggleGrid={toggleGrid}
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
            onSelectShape={selectShape}
            onUpdateShape={updateShape}
            onUpdateShapes={updateShapes}
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
        onReorderLayers={reorderLayers}
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
        <Calendar onClose={() => setShowCalendar(false)} />
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

      {/* Winner announcement modal - shows on first visit of the day */}
      {showWinnerAnnouncement && !winnerLoading && (
        <WinnerAnnouncementModal
          challengeDate={winnerChallengeDate}
          topThree={winnerTopThree}
          onDismiss={dismissWinnerAnnouncement}
          onViewSubmission={(submissionId) => {
            window.location.href = `?view=submission&id=${submissionId}`;
          }}
        />
      )}

      {/* Voting modal - shows after saving a submission */}
      {showVotingModal && user && (
        <VotingModal
          userId={user.id}
          challengeDate={yesterdayDate}
          onComplete={() => setShowVotingModal(false)}
          onSkipVoting={() => setShowVotingModal(false)}
        />
      )}
    </div>
  );
}

export default App;
