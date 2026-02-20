import { useState, useCallback } from 'react';
import type { Shape, ShapeGroup, DailyChallenge } from '../../types';
import type { User } from '@supabase/supabase-js';

interface UseSaveSubmissionOptions {
  challenge: DailyChallenge | null;
  shapes: Shape[];
  groups: ShapeGroup[];
  backgroundColorIndex: number | null;
  user: User | null;
  saveSubmission: (params: {
    challengeDate: string;
    shapes: Shape[];
    groups: ShapeGroup[];
    backgroundColorIndex: number | null;
  }) => Promise<{ success: boolean }>;
  onSaveSuccess?: () => void;
}

/**
 * Hook for managing save submission logic with status management
 */
export function useSaveSubmission({
  challenge,
  shapes,
  groups,
  backgroundColorIndex,
  user,
  saveSubmission,
  onSaveSuccess,
}: UseSaveSubmissionOptions) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleSave = useCallback(async () => {
    if (!challenge) return;
    setSaveStatus('idle');
    const result = await saveSubmission({
      challengeDate: challenge.date,
      shapes,
      groups,
      backgroundColorIndex,
    });
    if (result.success) {
      setSaveStatus('saved');
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
      // Call success callback if user is logged in
      if (user) {
        onSaveSuccess?.();
      }
    } else {
      setSaveStatus('error');
    }
  }, [saveSubmission, challenge, shapes, groups, backgroundColorIndex, user, onSaveSuccess]);

  return {
    saveStatus,
    handleSave,
  };
}
