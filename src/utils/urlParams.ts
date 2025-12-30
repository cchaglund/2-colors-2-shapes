/**
 * URL parameter checking utilities
 */

// Check if Shape Explorer mode is enabled via URL parameter or environment variable
export function isShapeExplorerEnabled(): boolean {
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
export function getSubmissionView(): { view: 'submission'; date: string } | { view: 'submission'; id: string } | null {
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
export function isVotingTestEnabled(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('test') === 'voting';
}

// Check if dashboard view is requested
export function isDashboardEnabled(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('view') === 'dashboard';
}

// Check if color tester is requested
export function isColorTesterEnabled(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('colors');
}

// Check if winners-day view is requested
export function getWinnersDayView(): { view: 'winners-day'; date: string } | null {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'winners-day') {
    const date = urlParams.get('date');
    if (date) {
      return { view: 'winners-day', date };
    }
  }
  return null;
}
