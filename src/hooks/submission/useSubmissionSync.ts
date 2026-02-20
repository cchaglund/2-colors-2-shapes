import { useEffect, useRef } from 'react';
import type { Shape, ShapeGroup, DailyChallenge } from '../../types';

interface UseSubmissionSyncOptions {
  userId: string | undefined;
  challenge: DailyChallenge | null;
  loadSubmission: (date: string) => Promise<{
    data: {
      shapes: Shape[];
      groups?: ShapeGroup[];
      background_color_index: number | null;
    } | null;
  }>;
  loadCanvasState: (
    shapes: Shape[],
    groups: ShapeGroup[],
    backgroundColorIndex: number | null
  ) => void;
}

/**
 * Hook for syncing artwork from server when user logs in
 * Local storage is the source of truth only if it belongs to the same user
 */
export function useSubmissionSync({
  userId,
  challenge,
  loadSubmission,
  loadCanvasState,
}: UseSubmissionSyncOptions) {
  // Track if we've synced the submission for this session to avoid repeated syncs
  const hasSyncedSubmissionRef = useRef(false);

  useEffect(() => {
    if (!userId || !challenge || hasSyncedSubmissionRef.current) return;

    const syncSubmission = async () => {
      // Check if we have local changes for today from the same user
      const stored = localStorage.getItem('2colors2shapes_canvas');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const isSameUser = parsed.userId === userId;
          const isSameDay = parsed.date === challenge.date;
          const hasShapes = parsed.canvas?.shapes?.length > 0;

          if (isSameDay && isSameUser && hasShapes) {
            // Local storage has work for today from same user - keep it as source of truth
            hasSyncedSubmissionRef.current = true;
            return;
          }
        } catch {
          // Invalid JSON, continue to load from DB
        }
      }

      // No valid local work for today - load from DB if available
      const { data: submission } = await loadSubmission(challenge.date);
      if (submission) {
        loadCanvasState(
          submission.shapes,
          submission.groups || [], // Handle old submissions without groups
          submission.background_color_index as number | null
        );
      }
      hasSyncedSubmissionRef.current = true;
    };

    syncSubmission();
  }, [userId, challenge, loadSubmission, loadCanvasState]);
}
