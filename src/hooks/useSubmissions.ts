import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Shape } from '../types';

export interface Submission {
  id: string;
  user_id: string;
  challenge_date: string;
  shapes: Shape[];
  background_color_index: number | null;
  created_at: string;
  updated_at: string;
}

interface SaveSubmissionParams {
  challengeDate: string;
  shapes: Shape[];
  backgroundColorIndex: 0 | 1 | null;
}

export function useSubmissions(userId: string | undefined) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const saveSubmission = useCallback(
    async (params: SaveSubmissionParams): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: 'Not authenticated' };

      setSaving(true);
      const { error } = await supabase.from('submissions').upsert(
        {
          user_id: userId,
          challenge_date: params.challengeDate,
          shapes: params.shapes,
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
        .single();
      setLoading(false);

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
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
    return { data: (data as Submission[]) ?? [] };
  }, [userId]);

  return { saveSubmission, loadSubmission, loadMySubmissions, saving, loading };
}
