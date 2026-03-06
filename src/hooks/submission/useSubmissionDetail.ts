import { useState, useEffect, useRef } from 'react';
import type { Submission } from './useSubmissions';
import type { User } from '@supabase/supabase-js';
import { fetchSubmissionById, fetchProfileNickname, fetchSubmissionRankInfo } from '../../lib/api';

interface UseSubmissionDetailOptions {
  date?: string;
  submissionId?: string;
  user: User | null;
  loadSubmission: (date: string) => Promise<{ data: Submission | null; error?: string }>;
  fetchSubmissionRank: (submissionId: string) => Promise<{ rank: number; total: number } | null>;
  getAdjacentSubmissionDates: (date: string) => Promise<{ prev: string | null; next: string | null }>;
}

/**
 * Hook for loading submission detail data
 */
export function useSubmissionDetail({
  date,
  submissionId,
  user,
  loadSubmission,
  fetchSubmissionRank,
  getAdjacentSubmissionDates,
}: UseSubmissionDetailOptions) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankInfo, setRankInfo] = useState<{ rank: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjacentDates, setAdjacentDates] = useState<{ prev: string | null; next: string | null }>({ prev: null, next: null });
  const [nickname, setNickname] = useState<string | null>(null);

  // Track what we've loaded to prevent duplicate fetches
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    // Create a unique key for what we're loading
    const loadKey = submissionId || (date && user?.id ? `${date}-${user.id}` : null);

    // Skip if we've already loaded this exact thing, or if we can't load yet
    if (!loadKey || loadedForRef.current === loadKey) return;

    // Mark as loading immediately to prevent duplicate fetches (important for StrictMode)
    loadedForRef.current = loadKey;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (submissionId) {
          const data = await fetchSubmissionById(submissionId);

          if (!data) {
            setError('Submission not found');
            loadedForRef.current = null;
          } else {
            setSubmission(data as unknown as Submission);
            if (data.user_id) {
              const nick = await fetchProfileNickname(data.user_id);
              setNickname(nick);
            }
            if (data.id) {
              const info = await fetchSubmissionRankInfo(data.id);
              setRankInfo(info);
            }
          }
        } else if (date && user) {
          // Load user's own submission by date
          const { data: submissionData, error: fetchError } = await loadSubmission(date);
          if (fetchError) {
            setError(fetchError);
            loadedForRef.current = null; // Reset on error to allow retry
          } else {
            setSubmission(submissionData);
            if (submissionData?.id) {
              const info = await fetchSubmissionRank(submissionData.id);
              setRankInfo(info);
            }
          }
          // Fetch adjacent submission dates for navigation
          const adjacent = await getAdjacentSubmissionDates(date);
          setAdjacentDates(adjacent);
        } else if (date && !user) {
          setError('Please sign in to view this submission.');
        }
      } catch (err: unknown) {
        console.error('Error loading submission:', err);
        setError('Failed to load submission');
        loadedForRef.current = null; // Reset on error to allow retry
      }

      setLoading(false);
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId, date, user?.id]);

  return {
    submission,
    loading,
    rankInfo,
    error,
    adjacentDates,
    nickname,
  };
}
