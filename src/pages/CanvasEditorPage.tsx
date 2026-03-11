import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { DailyChallenge, Shape } from '../types';
import type { ThemeMode, ThemeName } from '../hooks/ui/useThemeState';
import { getYesterdayDateUTC } from '../utils/dailyChallenge';
import { invalidateWallCache } from '../hooks/challenge/useWallOfTheDay';
import { setIncludedInRanking } from '../lib/api';
import { useAuth } from '../hooks/auth/useAuth';
import { useProfile } from '../hooks/auth/useProfile';
import { useCanvasEditorState } from '../hooks/canvas/useCanvasEditorState';
import { useSidebarState } from '../hooks/ui/useSidebarState';
import { useAppModals } from '../hooks/ui/useAppModals';
import { useKeyboardSettings } from '../hooks/ui/useKeyboardSettings';
import { useWinnerAnnouncement } from '../hooks/ui/useWinnerAnnouncement';
import { useIsTouchDevice } from '../hooks/ui/useIsTouchDevice';
import { useIsDesktop } from '../hooks/ui/useBreakpoint';
import { useSubmissions } from '../hooks/submission/useSubmissions';
import { useSaveSubmission } from '../hooks/submission/useSaveSubmission';
import { useSubmissionSync } from '../hooks/submission/useSubmissionSync';
import { CanvasEditorProvider } from '../contexts/CanvasEditorContext';
import { Canvas } from '../components/canvas/Canvas';
import { TopBar } from '../components/canvas/TopBar';
import { BottomToolbar } from '../components/canvas/BottomToolbar';
import { ToolsPanel } from '../components/canvas/ToolsPanel';
import { ZoomControls } from '../components/canvas/ZoomControls';
import { KeyboardShortcutsPopover } from '../components/canvas/KeyboardShortcutsPopover';
import { BackgroundColorPicker } from '../components/canvas/BackgroundColorPicker';
import { UndoRedoToast } from '../components/canvas/UndoRedoToast';
import { CanvasModals } from '../components/canvas/CanvasModals';
import { LayerPanel } from '../components/LayerPanel';
import { OnboardingModal } from '../components/modals/OnboardingModal';
import { ShapeIcon } from '../components/shared/ShapeIcon';
import { useTour } from '../hooks/ui/useTour';
import { TourOverlay } from '../components/tour/TourOverlay';
import { useDiscoveryHints } from '../hooks/ui/useDiscoveryHints';
import { DiscoveryHint } from '../components/shared/DiscoveryHint';

function ChallengeDisplay({ challenge }: { challenge: DailyChallenge }) {
  return (
    <div data-tour="challenge" className="flex items-center gap-6">
      <span className="text-xs uppercase tracking-widest text-(--color-accent) font-semibold">
        Today&rsquo;s Challenge:
      </span>
      {/* Colors — single swatch rectangle */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="flex h-5 rounded-sm overflow-hidden"
          style={{ outline: '1.5px solid var(--color-border)' }}
        >
          {challenge.colors.map((color, i) => (
            <div
              key={i}
              className="w-5"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-[9px] uppercase tracking-wider text-(--color-text-tertiary)">
          Colors
        </span>
      </div>
      {/* Shapes */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5 h-5">
          {challenge.shapes.map((shape, i) => (
            <ShapeIcon
              key={i}
              type={shape.type}
              size={20}
              fill="var(--color-text-tertiary)"
              stroke="var(--color-border)"
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="text-[9px] uppercase tracking-wider text-(--color-text-tertiary)">
          Shapes
        </span>
      </div>
      {/* Word */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold text-(--color-text-primary) capitalize font-display truncate leading-5">
          &ldquo;{challenge.word}&rdquo;
        </span>
        <span className="text-[9px] uppercase tracking-wider text-(--color-text-tertiary)">
          Word
        </span>
      </div>
    </div>
  );
}

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
    closeFriendsModal,
    dismissCongrats,
    dismissWinner,
  } = useAppModals();

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

  // Canvas editor state (composes canvas, viewport, grid, off-canvas, shape actions)
  const {
    editorContext,
    canvasState,
    loadCanvasState,
    resetCanvas,
    viewport,
    resetViewport,
    minZoom,
    maxZoom,
    handleZoomIn,
    handleZoomOut,
    showGrid,
    toggleGrid,
    showOffCanvas,
    toggleOffCanvas,
    handleMoveShapes,
    handleDuplicate,
    handleMirrorHorizontal,
    handleMirrorVertical,
    handleResizeShapes,
    handleBringForward,
    handleSendBackward,
    addShape,
    setBackgroundColor,
    updateShapes,
    deleteSelectedShapes,
    undo,
    redo,
    canUndo,
    canRedo,
    marqueeStartRef,
    toast,
    dismissToast,
  } = useCanvasEditorState({ challenge, userId: user?.id, keyMappings });

  // Sync submission from server
  const { hydrated } = useSubmissionSync({
    userId: user?.id,
    challenge,
    loadSubmission,
    loadCanvasState,
  });

  // Sidebar state
  const {
    leftOpen,
    rightOpen,
    toggleLeft,
    toggleRight,
  } = useSidebarState();

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
    try {
      await setIncludedInRanking(user.id, challenge.date);
    } catch (error) {
      console.error('[handleOptInToRanking] Error:', error);
    }
  }, [user, challenge]);

  const isTouchDevice = useIsTouchDevice();
  const isDesktop = useIsDesktop();
  const tour = useTour();
  const hints = useDiscoveryHints({ tourActive: tour.active });

  useEffect(() => {
    hints.onShapeSelectionChange(canvasState.selectedShapeIds.size);
  }, [canvasState.selectedShapeIds.size]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    hints.onShapeCountChange(canvasState.shapes.length);
  }, [canvasState.shapes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Selected color for new shapes
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);

  // Sync selected color to match the selected shape(s) color
  useEffect(() => {
    if (canvasState.selectedShapeIds.size === 0) return;
    const selectedShapes = canvasState.shapes.filter((s) =>
      canvasState.selectedShapeIds.has(s.id)
    );
    if (selectedShapes.length === 0) return;
    const firstColor = selectedShapes[0].colorIndex;
    const allSameColor = selectedShapes.every((s) => s.colorIndex === firstColor);
    if (allSameColor && firstColor !== selectedColorIndex) {
      setSelectedColorIndex(firstColor);
    }
  }, [canvasState.selectedShapeIds, canvasState.shapes]);

  const handleAddShape = useCallback((shapeIndex: number, colorIndex: number) => {
    addShape(shapeIndex, colorIndex);
  }, [addShape]);

  // When advancing from add-shape step, auto-add a shape if none on canvas
  const handleTourNext = useCallback(() => {
    if (tour.step === 'add-shape') {
      addShape(0, 1);
      // Delay so shape renders and selectedShapeId propagates before manipulate step
      requestAnimationFrame(() => tour.next());
      return;
    }
    tour.next();
  }, [tour, addShape]);

  // When a color is clicked, also recolor any selected shapes
  const handleSetSelectedColor = useCallback((colorIndex: number) => {
    setSelectedColorIndex(colorIndex);
    if (canvasState.selectedShapeIds.size > 0) {
      const updates = new Map<string, Partial<Shape>>();
      canvasState.selectedShapeIds.forEach((id: string) => {
        updates.set(id, { colorIndex });
      });
      updateShapes(updates, true, 'Change color');
    }
  }, [canvasState.selectedShapeIds, updateShapes]);

  const handleBackgroundMouseDown = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || target.classList.contains('canvas-wrapper')) {
      if (e.button !== 0) return;
      e.preventDefault();
      marqueeStartRef.current?.(e.clientX, e.clientY);
    }
  }, [marqueeStartRef]);

  const showOnboarding = user && profile && !profile.onboarding_complete;
  const anyModalOpen = !!(showOnboarding || showWinnerAnnouncement || showVotingModal || showResetConfirm || showFriendsModal);

  return (
    <CanvasEditorProvider value={editorContext}>
    <div className="flex flex-col h-screen overflow-hidden">
      {showOnboarding && <OnboardingModal onComplete={updateNickname} />}

      {tour.active && !anyModalOpen && (
        <TourOverlay
          step={tour.step}
          selectedShapeId={canvasState.selectedShapeIds.size === 1 ? [...canvasState.selectedShapeIds][0] : null}
          onNext={handleTourNext}
          onSkip={tour.skip}
        />
      )}

      {hints.activeHint && !tour.active && (
        <DiscoveryHint hintId={hints.activeHint} onDismiss={hints.dismissHint} />
      )}

      {/* Top bar */}
      <TopBar
        themeMode={themeMode}
        onSetThemeMode={onSetThemeMode}
        themeName={themeName}
        onSetThemeName={onSetThemeName}
        centerContent={<ChallengeDisplay challenge={challenge} />}
        onReset={handleReset}
        onSave={handleSave}
        isSaving={saving}
        saveStatus={saveStatus}
        hasSubmittedToday={hasSubmittedToday}
        isLoggedIn={!!user}
        profile={profile}
        profileLoading={profileLoading}
      />

      {/* Canvas area wrapper (everything below top bar) */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas fills area */}
        <main
          className="w-full h-full flex items-center justify-center bg-(--color-checkered-bg) overflow-auto"
          onMouseDown={handleBackgroundMouseDown}
        >
          <div className="overflow-visible p-4 md:p-16 canvas-wrapper">
            <Canvas marqueeStartRef={marqueeStartRef} />
          </div>
        </main>

        {/* Empty canvas prompt — only after hydration to avoid flash */}
        {hydrated && canvasState.shapes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
            <div
              className="flex items-center gap-3 px-5 py-2.5 select-none pointer-events-auto"
              style={{
                background: 'var(--color-card-bg)',
                border: 'var(--border-width, 2px) solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p className="text-sm text-(--color-text-secondary)">
                Add a shape below to start creating!
              </p>
              <div className="w-px h-5 bg-(--color-border-light) shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-(--color-text-secondary)">
                  Background:
                </span>
                <BackgroundColorPicker
                  colors={challenge.colors}
                  selectedIndex={canvasState.backgroundColorIndex}
                  onSelect={setBackgroundColor}
                />
              </div>
            </div>
          </div>
        )}

        {/* Left tools panel collapsed toggle */}
        {!leftOpen && (
          <button
            data-hint="left-toolbar"
            className="absolute left-3 top-3 z-20 w-10 h-10 flex items-center justify-center cursor-pointer transition-colors rounded-(--radius-md) bg-(--color-card-bg) text-(--color-text-secondary) hover:bg-(--color-hover) hover:text-(--color-text-primary)"
            style={{ border: 'var(--border-width, 2px) solid var(--color-border)', boxShadow: 'var(--shadow-btn)' }}
            onClick={toggleLeft}
            title="Show Tools"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </button>
        )}

        {/* Left tools panel */}
        <AnimatePresence>
          {leftOpen && (
            <motion.div
              key="left-tools"
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
              exit={{ x: -60, opacity: 0, transition: { duration: 0.2 } }}
              className="absolute top-3 left-3 z-20"
              data-hint="left-toolbar"
            >
              <ToolsPanel
                keyMappings={keyMappings}
                hasSelection={canvasState.selectedShapeIds.size > 0}
                canUndo={canUndo}
                canRedo={canRedo}
                showGrid={showGrid}
                showOffCanvas={showOffCanvas}
                onClose={toggleLeft}
                onUndo={undo}
                onRedo={redo}
                onDuplicate={handleDuplicate}
                onDelete={deleteSelectedShapes}
                onMoveUp={() => handleMoveShapes(0, -1)}
                onMoveDown={() => handleMoveShapes(0, 1)}
                onMoveLeft={() => handleMoveShapes(-1, 0)}
                onMoveRight={() => handleMoveShapes(1, 0)}
                onSizeIncrease={() => handleResizeShapes(5)}
                onSizeDecrease={() => handleResizeShapes(-5)}
                onMirrorHorizontal={handleMirrorHorizontal}
                onMirrorVertical={handleMirrorVertical}
                onBringForward={handleBringForward}
                onSendBackward={handleSendBackward}
                onToggleGrid={toggleGrid}
                onToggleOffCanvas={toggleOffCanvas}
                onToolButtonClick={hints.onToolbarButtonClick}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom floating toolbar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <BottomToolbar
            challenge={challenge}
            selectedColorIndex={selectedColorIndex}
            backgroundColorIndex={canvasState.backgroundColorIndex}
            hasSelection={canvasState.selectedShapeIds.size > 0}
            onAddShape={handleAddShape}
            onSetSelectedColor={handleSetSelectedColor}
            onSetBackground={setBackgroundColor}
          />
        </div>

        {/* Zoom controls — bottom right (raised on mobile to avoid BottomToolbar) */}
        <div className="absolute bottom-18 md:bottom-4 right-4 z-10">
          <ZoomControls
            zoom={viewport.zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={resetViewport}
            minZoom={minZoom}
            maxZoom={maxZoom}
          />
        </div>

        {/* Keyboard shortcuts popover — bottom left (hidden on touch devices) */}
        {!isTouchDevice && (
          <div className="absolute bottom-4 left-4 z-30">
            <KeyboardShortcutsPopover
              keyMappings={keyMappings}
              onOpenSettings={openKeyboardSettings}
              onReplayTour={tour.replay}
            />
          </div>
        )}

        {/* Right layers panel collapsed toggle */}
        {!rightOpen && (
          <button
            data-hint="layers-panel"
            className={`absolute z-20 flex items-center gap-1.5 h-10 px-3.5 cursor-pointer transition-colors rounded-(--radius-md) bg-(--color-card-bg) hover:bg-(--color-hover) text-(--color-text-secondary) ${
              isDesktop ? 'right-3 top-3' : 'right-3 bottom-30'
            }`}
            style={{ border: 'var(--border-width, 2px) solid var(--color-border)', boxShadow: 'var(--shadow-btn)' }}
            onClick={toggleRight}
            title="Show Layers"
            aria-label="Open layers"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span className="text-xs font-semibold leading-none">
              {canvasState.shapes.length}
            </span>
          </button>
        )}

        {/* Right layers panel — side panel on desktop, bottom sheet on mobile */}
        <AnimatePresence>
          {rightOpen && (
            <motion.div
              key="right-sidebar"
              initial={isDesktop ? { x: 40, opacity: 0 } : { y: 100, opacity: 0 }}
              animate={isDesktop
                ? { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }
                : { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }
              }
              exit={isDesktop
                ? { x: 40, opacity: 0, transition: { duration: 0.2 } }
                : { y: 100, opacity: 0, transition: { duration: 0.2 } }
              }
              className={isDesktop
                ? 'absolute top-3 right-3 z-20'
                : 'absolute bottom-18 left-0 right-0 z-20 max-h-[50vh]'
              }
              style={isDesktop ? { width: 280 } : undefined}
            >
              <LayerPanel onToggle={toggleRight} />
            </motion.div>
          )}
        </AnimatePresence>

        {toast && (
          <UndoRedoToast
            key={toast.key}
            message={toast.message}
            onDismiss={dismissToast}
          />
        )}
      </div>

      <CanvasModals
        showResetConfirm={showResetConfirm}
        onConfirmReset={confirmReset}
        onCancelReset={cancelReset}
        showKeyboardSettings={showKeyboardSettings}
        keyMappings={keyMappings}
        onUpdateBinding={updateBinding}
        onResetAllBindings={resetAllBindings}
        onCloseKeyboardSettings={closeKeyboardSettings}
        keyboardSyncing={keyboardSyncing}
        showWinnerAnnouncement={showWinnerAnnouncement}
        winnerLoading={winnerLoading}
        userPlacement={userPlacement}
        congratsDismissed={congratsDismissed}
        winnerDismissed={winnerDismissed}
        winnerChallengeDate={winnerChallengeDate}
        winnerTopThree={winnerTopThree}
        onPersistSeen={persistSeen}
        onDismissCongrats={dismissCongrats}
        onDismissWinnerAnnouncement={dismissWinnerAnnouncement}
        onDismissWinner={dismissWinner}
        showVotingModal={showVotingModal}
        votingUserId={user?.id}
        yesterdayDate={yesterdayDate}
        onCloseVotingModal={closeVotingModal}
        onOptInToRanking={handleOptInToRanking}
        showFriendsModal={showFriendsModal}
        onCloseFriendsModal={closeFriendsModal}
      />
    </div>
    </CanvasEditorProvider>
  );
}
