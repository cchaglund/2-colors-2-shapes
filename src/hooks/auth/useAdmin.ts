import { useState, useEffect, useCallback } from 'react';
import { checkIsAdmin, fetchDashboardStats } from '../../lib/api';

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

  useEffect(() => {
    async function check() {
      if (!userId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const admin = await checkIsAdmin(userId);
      setIsAdmin(admin);
      setLoading(false);
    }

    check();
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId || !isAdmin) return;

    setStatsLoading(true);
    setStatsError(null);

    try {
      const data = await fetchDashboardStats();
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
