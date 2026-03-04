import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Shape, ShapeGroup } from '../../types';

export interface Submission {
  id: string;
  user_id: string;
  challenge_date: string;
  shapes: Shape[];
  groups: ShapeGroup[];
  background_color_index: number | null;
  created_at: string;
  updated_at: string;
  like_count: number;
}

interface SaveSubmissionParams {
  challengeDate: string;
  shapes: Shape[];
  groups: ShapeGroup[];
  backgroundColorIndex: number | null;
}

export function useSubmissions(userId: string | undefined, todayDate?: string) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [hasCheckedSubmission, setHasCheckedSubmission] = useState(false);

  // Check if user has already submitted today
  useEffect(() => {
    if (!userId || !todayDate) {
      return; // Initial state (false) handles the no-user case
    }

    setHasCheckedSubmission(false);
    const checkExistingSubmission = async () => {
      const { data } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', userId)
        .eq('challenge_date', todayDate)
        .maybeSingle();

      setHasSubmittedToday(!!data);
      setHasCheckedSubmission(true);
    };

    checkExistingSubmission();
  }, [userId, todayDate]);

  // Cache for loadMySubmissions to avoid re-fetching on every gallery navigation
  const mySubmissionsCache = useRef<{ userId: string; data: Submission[] } | null>(null);

  const saveSubmission = useCallback(
    async (params: SaveSubmissionParams): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'Not authenticated' };

      setSaving(true);
      const { error } = await supabase.from('submissions').upsert(
        {
          user_id: userId,
          challenge_date: params.challengeDate,
          shapes: params.shapes,
          groups: params.groups,
          background_color_index: params.backgroundColorIndex,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,challenge_date',
        }
      );
      setSaving(false);

      if (error) {
        return { success: false, error: error.message };
      }
      setHasSubmittedToday(true);
      // Invalidate my-submissions cache so next gallery visit re-fetches
      mySubmissionsCache.current = null;
      return { success: true };
    },
    [userId]
  );

  const loadSubmission = useCallback(
    async (challengeDate: string): Promise<{ data: Submission | null; error?: string }> => {
      if (!userId) return { data: null, error: 'Not authenticated' };

      setLoading(true);
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', challengeDate)
        .maybeSingle();
      setLoading(false);

      if (error) {
        return { data: null, error: error.message };
      }
      return { data: data as Submission | null };
    },
    [userId]
  );

  const loadMySubmissions = useCallback(async (): Promise<{
    data: Submission[];
    error?: string;
  }> => {
    if (!userId) return { data: [], error: 'Not authenticated' };

    // Return cached data if available for same user (skip loading state)
    if (mySubmissionsCache.current && mySubmissionsCache.current.userId === userId) {
      return { data: mySubmissionsCache.current.data };
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .order('challenge_date', { ascending: false });
    setLoading(false);

    if (error) {
      return { data: [], error: error.message };
    }
    const submissions = (data as Submission[]) ?? [];
    mySubmissionsCache.current = { userId, data: submissions };
    return { data: submissions };
  }, [userId]);

  const getAdjacentSubmissionDates = useCallback(
    async (
      currentDate: string
    ): Promise<{ prev: string | null; next: string | null }> => {
      if (!userId) return { prev: null, next: null };

      // Get the previous submission (closest date before currentDate)
      const { data: prevData } = await supabase
        .from('submissions')
        .select('challenge_date')
        .eq('user_id', userId)
        .lt('challenge_date', currentDate)
        .order('challenge_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get the next submission (closest date after currentDate)
      const { data: nextData } = await supabase
        .from('submissions')
        .select('challenge_date')
        .eq('user_id', userId)
        .gt('challenge_date', currentDate)
        .order('challenge_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      return {
        prev: prevData?.challenge_date ?? null,
        next: nextData?.challenge_date ?? null,
      };
    },
    [userId]
  );

  return {
    saveSubmission,
    loadSubmission,
    loadMySubmissions,
    getAdjacentSubmissionDates,
    saving,
    loading,
    hasSubmittedToday,
    hasCheckedSubmission,
  };
}
