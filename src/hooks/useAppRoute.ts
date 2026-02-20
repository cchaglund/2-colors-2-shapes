import { useMemo } from 'react';
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
  getGalleryView,
} from '../utils/urlParams';

// Routes that render standalone pages (no challenge data needed)
type StandaloneRoute =
  | { type: 'explorer' }
  | { type: 'voting-test' }
  | { type: 'social-test' }
  | { type: 'dashboard' }
  | { type: 'color-tester' }
  | { type: 'gallery'; tab?: string; year?: number; month?: number; date?: string }
  | { type: 'wall-of-the-day'; date: string }
  | { type: 'profile'; userId: string };

// Routes that need challenge data loaded first
type ChallengeRoute =
  | { type: 'winners-day'; date: string }
  | { type: 'submission-by-id'; id: string }
  | { type: 'submission-by-date'; date: string }
  | { type: 'canvas' };

export type AppRoute = StandaloneRoute | ChallengeRoute;

export function useAppRoute(): AppRoute {
  return useMemo(() => {
    if (isShapeExplorerEnabled()) return { type: 'explorer' };
    if (isVotingTestEnabled()) return { type: 'voting-test' };
    if (isSocialTestEnabled()) return { type: 'social-test' };
    if (isDashboardEnabled()) return { type: 'dashboard' };
    if (isColorTesterEnabled()) return { type: 'color-tester' };

    const gallery = getGalleryView();
    if (gallery) return { type: 'gallery', tab: gallery.tab, year: gallery.year, month: gallery.month, date: gallery.date };

    const wall = getWallOfTheDayView();
    if (wall) return { type: 'wall-of-the-day', date: wall.date };

    const profile = getProfileView();
    if (profile) return { type: 'profile', userId: profile.userId };

    const winners = getWinnersDayView();
    if (winners) return { type: 'winners-day', date: winners.date };

    const submission = getSubmissionView();
    if (submission) {
      if ('id' in submission) return { type: 'submission-by-id', id: submission.id };
      return { type: 'submission-by-date', date: submission.date };
    }

    return { type: 'canvas' };
  }, []);
}

/** Check if a route needs challenge data before rendering */
export function isStandaloneRoute(route: AppRoute): route is StandaloneRoute {
  return (
    route.type === 'explorer' ||
    route.type === 'voting-test' ||
    route.type === 'social-test' ||
    route.type === 'dashboard' ||
    route.type === 'color-tester' ||
    route.type === 'gallery' ||
    route.type === 'wall-of-the-day' ||
    route.type === 'profile'
  );
}
