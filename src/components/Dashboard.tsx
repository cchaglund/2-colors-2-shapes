import { useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Dashboard() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { isAdmin, loading: adminLoading, stats, statsLoading, statsError, fetchStats } = useAdmin(user?.id);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin, fetchStats]);

  // Loading state
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center p-8 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Admin Dashboard
          </h1>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Please sign in to access the dashboard.
          </p>
          <button
            onClick={signInWithGoogle}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Not an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center p-8 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Access Denied
          </h1>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            You don't have permission to view this page.
          </p>
          <a
            href="/"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium inline-block"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // Stats loading
  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard stats...</p>
        </div>
      </div>
    );
  }

  // Stats error
  if (statsError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center p-8 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {statsError}
          </p>
          <button
            onClick={fetchStats}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Dashboard content
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Admin Dashboard
          </h1>
          <a
            href="/"
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
            }}
          >
            Back to App
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            subtitle={`${stats?.recentUsers ?? 0} new this week`}
          />
          <StatCard
            title="Total Submissions"
            value={stats?.totalSubmissions ?? 0}
          />
          <StatCard
            title="Votes (7 days)"
            value={stats?.votesPerDay?.reduce((sum, d) => sum + d.count, 0) ?? 0}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions Chart */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Submissions (Last 7 Days)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.submissionsPerDay?.map(d => ({ ...d, date: formatDate(d.date) })) ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Votes Chart */}
          <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Votes (Last 7 Days)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.votesPerDay?.map(d => ({ ...d, date: formatDate(d.date) })) ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchStats}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Stats
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
}

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="p-6 rounded-xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {title}
      </h3>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
        {value.toLocaleString()}
      </p>
      {subtitle && (
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
