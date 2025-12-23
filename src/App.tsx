import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { LayerPanel } from './components/LayerPanel';
import { ZoomControls } from './components/ZoomControls';
import { ActionToolbar } from './components/ActionToolbar';
import { ShapeExplorer } from './components/ShapeExplorer';
import { OnboardingModal } from './components/OnboardingModal';
import { WelcomeModal } from './components/WelcomeModal';
import { Calendar } from './components/Calendar';
import { SubmissionDetailPage } from './components/SubmissionDetailPage';
import { KeyboardSettingsModal } from './components/KeyboardSettingsModal';
import { VotingModal } from './components/voting';
import { WinnerAnnouncementModal } from './components/WinnerAnnouncementModal';
import { VotingTestPage } from './test/VotingTestPage';
import { Dashboard } from './components/Dashboard';
import { useCanvasState } from './hooks/useCanvasState';
import { useViewportState } from './hooks/useViewportState';
import { useSidebarState } from './hooks/useSidebarState';
import { useThemeState } from './hooks/useThemeState';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useSubmissions } from './hooks/useSubmissions';
import { useWelcomeModal } from './hooks/useWelcomeModal';
import { useKeyboardSettings } from './hooks/useKeyboardSettings';
import { useWinnerAnnouncement } from './hooks/useWinnerAnnouncement';
import { getTodayChallenge, getYesterdayDate } from './utils/dailyChallenge';

const CANVAS_SIZE = 800;

// Check if Shape Explorer mode is enabled via URL parameter or environment variable
function isShapeExplorerEnabled(): boolean {
  // Check URL parameter: ?explorer or ?explorer=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('explorer')) {
    const value = urlParams.get('explorer');
    return value === null || value === '' || value === 'true';
  }
  // Check environment variable
  return import.meta.env.VITE_SHAPE_EXPLORER === 'true';
}

// Check if submission detail view is requested
function getSubmissionView(): { view: 'submission'; date: string } | { view: 'submission'; id: string } | null {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'submission') {
    const id = urlParams.get('id');
    if (id) {
      return { view: 'submission', id };
    }
    const date = urlParams.get('date');
    if (date) {
      return { view: 'submission', date };
    }
  }
  return null;
}

// Check if voting test page is requested
function isVotingTestEnabled(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('test') === 'voting';
}

// Check if dashboard view is requested
function isDashboardEnabled(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('view') === 'dashboard';
}

function App() {
  // Check if Shape Explorer mode should be shown
  const showExplorer = useMemo(() => isShapeExplorerEnabled(), []);
  // Check if submission detail view is requested
  const submissionView = useMemo(() => getSubmissionView(), []);
  // Check if voting test page should be shown
  const showVotingTest = useMemo(() => isVotingTestEnabled(), []);
  // Check if dashboard should be shown
  const showDashboard = useMemo(() => isDashboardEnabled(), []);
  // Calendar modal state
  const [showCalendar, setShowCalendar] = useState(false);
  // Keyboard settings modal state
  const [showKeyboardSettings, setShowKeyboardSettings] = useState(false);
  // Voting modal state
  const [showVotingModal, setShowVotingModal] = useState(false);
  // Welcome modal for first-time visitors
  const { isOpen: showWelcome, dismiss: dismissWelcome } = useWelcomeModal();

  const challenge = useMemo(() => getTodayChallenge(), []);

  // Auth state
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateNickname } = useProfile(user?.id);
  const { saveSubmission, loadSubmission, saving, hasSubmittedToday } = useSubmissions(user?.id, challenge.date);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

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

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isBackgroundPanning, setIsBackgroundPanning] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Track if we've synced the submission for this session to avoid repeated syncs
  const hasSyncedSubmissionRef = useRef(false);

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
    // Group management
    createGroup,
    deleteGroup,
    ungroupShapes,
    renameGroup,
    toggleGroupCollapsed,
    selectGroup,
    // External loading
    loadCanvasState,
  } = useCanvasState(challenge);

  // Sync artwork from server when user logs in
  // This ensures seamless experience across devices - if user has submitted today,
  // their submission is loaded into local storage (overwriting any local changes)
  useEffect(() => {
    if (!user?.id || hasSyncedSubmissionRef.current) return;

    const syncSubmission = async () => {
      const { data: submission } = await loadSubmission(challenge.date);
      if (submission) {
        // User has a submission for today - load it into the canvas
        loadCanvasState(submission.shapes, submission.background_color_index as 0 | 1 | null);
      }
      hasSyncedSubmissionRef.current = true;
    };

    syncSubmission();
  }, [user?.id, challenge.date, loadSubmission, loadCanvasState]);

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

  const {
    mode: themeMode,
    setMode: setThemeMode,
  } = useThemeState();

  const handleZoomIn = useCallback(() => {
    setZoom(viewport.zoom + 0.1);
  }, [viewport.zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(viewport.zoom - 0.1);
  }, [viewport.zoom, setZoom]);

  // Movement and rotation handlers for ActionToolbar
  const selectedShapes = useMemo(
    () => canvasState.shapes.filter((s) => canvasState.selectedShapeIds.has(s.id)),
    [canvasState.shapes, canvasState.selectedShapeIds]
  );

  const handleMoveShapes = useCallback(
    (dx: number, dy: number) => {
      if (selectedShapes.length === 0) return;
      const updates = new Map<string, { x: number; y: number }>();
      selectedShapes.forEach((shape) => {
        updates.set(shape.id, { x: shape.x + dx, y: shape.y + dy });
      });
      updateShapes(updates);
    },
    [selectedShapes, updateShapes]
  );

  const handleRotateShapes = useCallback(
    (dRotation: number) => {
      if (selectedShapes.length === 0) return;
      const updates = new Map<string, { rotation: number }>();
      selectedShapes.forEach((shape) => {
        updates.set(shape.id, { rotation: shape.rotation + dRotation });
      });
      updateShapes(updates);
    },
    [selectedShapes, updateShapes]
  );

  const handleDuplicate = useCallback(() => {
    if (canvasState.selectedShapeIds.size === 0) return;
    duplicateShapes(Array.from(canvasState.selectedShapeIds));
  }, [canvasState.selectedShapeIds, duplicateShapes]);

  const handleMirrorHorizontal = useCallback(() => {
    if (canvasState.selectedShapeIds.size === 0) return;
    mirrorHorizontal(Array.from(canvasState.selectedShapeIds));
  }, [canvasState.selectedShapeIds, mirrorHorizontal]);

  const handleMirrorVertical = useCallback(() => {
    if (canvasState.selectedShapeIds.size === 0) return;
    mirrorVertical(Array.from(canvasState.selectedShapeIds));
  }, [canvasState.selectedShapeIds, mirrorVertical]);

  // Resize from center - adjust position to keep center fixed
  const handleResizeShapes = useCallback(
    (delta: number) => {
      if (selectedShapes.length === 0) return;
      const updates = new Map<string, { size: number; x: number; y: number }>();
      selectedShapes.forEach((shape) => {
        const newSize = Math.max(10, shape.size + delta); // Minimum size of 10
        const sizeDiff = newSize - shape.size;
        // Adjust position to keep center fixed (shape position is top-left corner)
        updates.set(shape.id, {
          size: newSize,
          x: shape.x - sizeDiff / 2,
          y: shape.y - sizeDiff / 2,
        });
      });
      updateShapes(updates);
    },
    [selectedShapes, updateShapes]
  );

  // Get client coordinates relative to the main element, normalized to canvas size
  const getClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!mainRef.current) return { x: 0, y: 0 };
      const canvasElement = mainRef.current.querySelector('svg');
      if (!canvasElement) return { x: 0, y: 0 };
      const rect = canvasElement.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
        y: ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
      };
    },
    []
  );

  // Handle background panning (clicking on checkerboard area)
  const handleBackgroundMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      // Only trigger if clicking directly on the main element (the checkerboard background)
      // or the wrapper div, not on the canvas itself
      if (e.target === mainRef.current || (e.target as HTMLElement).classList.contains('canvas-wrapper')) {
        e.preventDefault();
        setIsBackgroundPanning(true);
        const point = getClientPoint(e.clientX, e.clientY);
        panStartRef.current = {
          x: point.x,
          y: point.y,
          panX: viewport.panX,
          panY: viewport.panY,
        };
      }
    },
    [getClientPoint, viewport.panX, viewport.panY]
  );

  // Handle background panning mouse move and mouse up
  useEffect(() => {
    if (!isBackgroundPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isBackgroundPanning || !panStartRef.current) return;
      const point = getClientPoint(e.clientX, e.clientY);
      const dx = point.x - panStartRef.current.x;
      const dy = point.y - panStartRef.current.y;
      setPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
    };

    const handleMouseUp = () => {
      setIsBackgroundPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isBackgroundPanning, getClientPoint, setPan]);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    resetCanvas();
    setShowResetConfirm(false);
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  const handleSave = useCallback(async () => {
    setSaveStatus('idle');
    const result = await saveSubmission({
      challengeDate: challenge.date,
      shapes: canvasState.shapes,
      backgroundColorIndex: canvasState.backgroundColorIndex,
    });
    if (result.success) {
      setSaveStatus('saved');
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
      // Show voting modal if user is logged in
      if (user) {
        setShowVotingModal(true);
      }
    } else {
      setSaveStatus('error');
    }
  }, [saveSubmission, challenge.date, canvasState.shapes, canvasState.backgroundColorIndex, user]);

  const backgroundColor =
    canvasState.backgroundColorIndex !== null
      ? challenge.colors[canvasState.backgroundColorIndex]
      : null;

  // Render Shape Explorer if enabled
  if (showExplorer) {
    return <ShapeExplorer />;
  }

  // Render Voting Test Page if enabled
  if (showVotingTest) {
    return <VotingTestPage />;
  }

  // Render Dashboard if enabled
  if (showDashboard) {
    return <Dashboard />;
  }

  // Render Submission Detail Page if viewing a submission
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
        <div
          className="fixed inset-0 flex items-center justify-center z-1000"
          style={{ backgroundColor: 'var(--color-modal-overlay)' }}
        >
          <div
            className="p-6 rounded-xl max-w-100 text-center shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
            style={{ backgroundColor: 'var(--color-modal-bg)' }}
          >
            <h3
              className="m-0 mb-3 text-xl"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Reset Canvas?
            </h3>
            <p
              className="m-0 mb-5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              This will delete all shapes and cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-6 py-2.5 rounded-md border-none cursor-pointer text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                }}
                onClick={cancelReset}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2.5 rounded-md border-none cursor-pointer text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600"
                onClick={confirmReset}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
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
            // Navigate to submission detail page
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
