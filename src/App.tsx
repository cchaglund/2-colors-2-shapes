import { lazy, Suspense, useMemo } from 'react';
import { MotionConfig } from 'motion/react';
import { FollowsProvider } from './contexts/FollowsContext';
import { getTodayDateUTC } from './utils/dailyChallenge';
import { useDailyChallenge } from './hooks/challenge/useDailyChallenge';
import { useAppRoute, isStandaloneRoute } from './hooks/useAppRoute';
import { useThemeState } from './hooks/ui/useThemeState';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

// Route-based code splitting: each page loads only when navigated to
const ShapeExplorer = lazy(() => import('./components/admin/ShapeExplorer').then(m => ({ default: m.ShapeExplorer })));
const ColorTester = lazy(() => import('./components/admin/ColorTester').then(m => ({ default: m.ColorTester })));
const Dashboard = lazy(() => import('./components/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const GalleryPage = lazy(() => import('./components/pages/GalleryPage').then(m => ({ default: m.GalleryPage })));
const SubmissionDetailPage = lazy(() => import('./components/pages/SubmissionDetailPage').then(m => ({ default: m.SubmissionDetailPage })));
const WinnersDayPage = lazy(() => import('./components/pages/WinnersDayPage').then(m => ({ default: m.WinnersDayPage })));
const WallOfTheDayPage = lazy(() => import('./components/pages/WallOfTheDayPage').then(m => ({ default: m.WallOfTheDayPage })));
const UserProfilePage = lazy(() => import('./components/pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const VotingTestPage = lazy(() => import('./test/VotingTestPage').then(m => ({ default: m.VotingTestPage })));
const SocialTestPage = lazy(() => import('./test/SocialTestPage').then(m => ({ default: m.SocialTestPage })));
const CanvasEditorPage = lazy(() => import('./components/canvas/CanvasEditorPage').then(m => ({ default: m.CanvasEditorPage })));

function AppContent() {
  // Apply theme globally so all pages respect the selected theme + dark mode
  const { mode: themeMode, setMode: setThemeMode, theme: themeName, setTheme: setThemeName } = useThemeState();

  // Resolve current route from URL params
  const route = useAppRoute();

  // Fetch today's challenge from server
  const todayDate = useMemo(() => getTodayDateUTC(), []);
  const { challenge, loading: challengeLoading } = useDailyChallenge(todayDate);

  // Render standalone pages (no challenge data needed)
  if (isStandaloneRoute(route)) {
    const page = (() => {
      switch (route.type) {
        case 'explorer': return <ShapeExplorer />;
        case 'voting-test': return <VotingTestPage />;
        case 'social-test': return <SocialTestPage />;
        case 'dashboard': return <Dashboard />;
        case 'color-tester': return <ColorTester />;
        case 'gallery': return <FollowsProvider><GalleryPage tab={route.tab} year={route.year} month={route.month} date={route.date} themeMode={themeMode} onSetThemeMode={setThemeMode} themeName={themeName} onSetThemeName={setThemeName} /></FollowsProvider>;
        case 'wall-of-the-day': return <WallOfTheDayPage date={route.date} />;
        case 'profile': return <FollowsProvider><UserProfilePage userId={route.userId} /></FollowsProvider>;
      }
    })();
    return <Suspense fallback={<LoadingSpinner size="lg" fullScreen />}>{page}</Suspense>;
  }

  // Show loading spinner while challenge is loading
  if (challengeLoading || !challenge) {
    return <LoadingSpinner size="lg" fullScreen />;
  }

  // Render challenge-dependent pages
  let page;
  if (route.type === 'winners-day') {
    page = <WinnersDayPage date={route.date} />;
  } else if (route.type === 'submission-by-id') {
    page = <FollowsProvider><SubmissionDetailPage submissionId={route.id} themeMode={themeMode} onSetThemeMode={setThemeMode} themeName={themeName} onSetThemeName={setThemeName} /></FollowsProvider>;
  } else if (route.type === 'submission-by-date') {
    page = <FollowsProvider><SubmissionDetailPage date={route.date} themeMode={themeMode} onSetThemeMode={setThemeMode} themeName={themeName} onSetThemeName={setThemeName} /></FollowsProvider>;
  } else {
    // Default: canvas editor
    page = <CanvasEditorPage challenge={challenge} todayDate={todayDate} themeMode={themeMode} onSetThemeMode={setThemeMode} themeName={themeName} onSetThemeName={setThemeName} />;
  }

  return <Suspense fallback={<LoadingSpinner size="lg" fullScreen />}>{page}</Suspense>;
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppContent />
    </MotionConfig>
  );
}

export default App;
