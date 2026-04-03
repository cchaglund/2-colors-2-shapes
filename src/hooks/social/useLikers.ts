import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchSubmissionLikers, type Liker } from '../../lib/api';

export function useLikers(submissionId: string | undefined) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchSubmissionLikers(id);
      setLikers(data);
    } catch {
      // Silently fail — likers are supplementary info
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!submissionId || fetchedRef.current === submissionId) return;
    fetchedRef.current = submissionId;
    load(submissionId);
  }, [submissionId, load]);

  return { likers, loading };
}
