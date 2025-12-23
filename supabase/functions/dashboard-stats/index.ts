import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardStats {
  totalUsers: number;
  recentUsers: number; // Last 7 days
  totalSubmissions: number;
  submissionsPerDay: { date: string; count: number }[];
  votesPerDay: { date: string; count: number }[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's auth to verify identity
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate date range for last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // Get total users count from auth.users via admin API
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get recent users (registered in last 7 days)
    const { count: recentUsers, error: recentUsersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentUsersError) throw recentUsersError;

    // Get total submissions
    const { count: totalSubmissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    if (submissionsError) throw submissionsError;

    // Get submissions per day for last 7 days
    const { data: submissionsData, error: submissionsPerDayError } = await supabaseAdmin
      .from('submissions')
      .select('challenge_date')
      .gte('challenge_date', sevenDaysAgoStr)
      .order('challenge_date', { ascending: true });

    if (submissionsPerDayError) throw submissionsPerDayError;

    // Aggregate submissions by date
    const submissionsPerDay = aggregateByDate(submissionsData || [], 'challenge_date', sevenDaysAgoStr);

    // Get votes per day for last 7 days
    const { data: votesData, error: votesPerDayError } = await supabaseAdmin
      .from('comparisons')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (votesPerDayError) throw votesPerDayError;

    // Aggregate votes by date
    const votesPerDay = aggregateByTimestamp(votesData || [], 'created_at', sevenDaysAgoStr);

    const stats: DashboardStats = {
      totalUsers: totalUsers ?? 0,
      recentUsers: recentUsers ?? 0,
      totalSubmissions: totalSubmissions ?? 0,
      submissionsPerDay,
      votesPerDay,
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Aggregate records by a date field (YYYY-MM-DD string)
 */
function aggregateByDate(
  records: { [key: string]: string }[],
  dateField: string,
  startDate: string
): { date: string; count: number }[] {
  const counts: Record<string, number> = {};

  // Initialize all dates in range with 0
  const start = new Date(startDate);
  const today = new Date();
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    counts[dateStr] = 0;
  }

  // Count records per date
  for (const record of records) {
    const date = record[dateField];
    if (date && counts[date] !== undefined) {
      counts[date]++;
    }
  }

  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregate records by a timestamp field (ISO string)
 */
function aggregateByTimestamp(
  records: { [key: string]: string }[],
  timestampField: string,
  startDate: string
): { date: string; count: number }[] {
  const counts: Record<string, number> = {};

  // Initialize all dates in range with 0
  const start = new Date(startDate);
  const today = new Date();
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    counts[dateStr] = 0;
  }

  // Count records per date
  for (const record of records) {
    const timestamp = record[timestampField];
    if (timestamp) {
      const date = timestamp.split('T')[0];
      if (counts[date] !== undefined) {
        counts[date]++;
      }
    }
  }

  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
