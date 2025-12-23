import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalUsers: number;
  recentUsers: number;
  totalSubmissions: number;
  submissionsPerDay: { date: string; count: number }[];
  votesPerDay: { date: string; count: number }[];
}

export function useAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (!userId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_admin ?? false);
      }
      setLoading(false);
    }

    checkAdmin();
  }, [userId]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!userId || !isAdmin) return;

    setStatsLoading(true);
    setStatsError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      const { data, error } = await supabase.functions.invoke('dashboard-stats', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        throw error;
      }

      setStats(data as DashboardStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setStatsError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setStatsLoading(false);
    }
  }, [userId, isAdmin]);

  return {
    isAdmin,
    loading,
    stats,
    statsLoading,
    statsError,
    fetchStats,
  };
}
