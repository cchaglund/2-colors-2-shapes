import { useMemo } from 'react';
import { ShapeExplorer } from './components/admin/ShapeExplorer';
import { ColorTester } from './components/admin/ColorTester';
import { GalleryPage } from './components/GalleryPage';
import { SubmissionDetailPage } from './components/SubmissionDetailPage';
import { WinnersDayPage } from './components/WinnersDayPage';
import { WallOfTheDayPage } from './components/WallOfTheDay/WallOfTheDayPage';
import { UserProfilePage } from './components/UserProfilePage';
import { FollowsProvider } from './contexts/FollowsContext';
import { VotingTestPage } from './test/VotingTestPage';
import { SocialTestPage } from './test/SocialTestPage';
import { Dashboard } from './components/admin/Dashboard';
import { CanvasEditorPage } from './components/CanvasEditorPage';
import { getTodayDateUTC } from './utils/dailyChallenge';
import { useDailyChallenge } from './hooks/challenge/useDailyChallenge';
import { useAppRoute, isStandaloneRoute } from './hooks/useAppRoute';

function App() {
  // Resolve current route from URL params
  const route = useAppRoute();

  // Fetch today's challenge from server
  const todayDate = useMemo(() => getTodayDateUTC(), []);
  const { challenge, loading: challengeLoading } = useDailyChallenge(todayDate);

  // Render standalone pages (no challenge data needed)
  if (isStandaloneRoute(route)) {
    switch (route.type) {
      case 'explorer': return <ShapeExplorer />;
      case 'voting-test': return <VotingTestPage />;
      case 'social-test': return <SocialTestPage />;
      case 'dashboard': return <Dashboard />;
      case 'color-tester': return <ColorTester />;
      case 'gallery': return <FollowsProvider><GalleryPage tab={route.tab} year={route.year} month={route.month} date={route.date} /></FollowsProvider>;
      case 'wall-of-the-day': return <WallOfTheDayPage date={route.date} />;
      case 'profile': return <FollowsProvider><UserProfilePage userId={route.userId} /></FollowsProvider>;
    }
  }

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

  // Render challenge-dependent pages
  if (route.type === 'winners-day') return <WinnersDayPage date={route.date} />;
  if (route.type === 'submission-by-id') return <FollowsProvider><SubmissionDetailPage submissionId={route.id} /></FollowsProvider>;
  if (route.type === 'submission-by-date') return <FollowsProvider><SubmissionDetailPage date={route.date} /></FollowsProvider>;

  // Default: canvas editor
  return <CanvasEditorPage challenge={challenge} todayDate={todayDate} />;
}

export default App;
