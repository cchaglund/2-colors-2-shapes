import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoteRequest {
  submissionAId: string;
  submissionBId: string;
  winnerId: string | null; // null if skipped
  challengeDate: string; // YYYY-MM-DD
}

interface EloResult {
  newRatingA: number;
  newRatingB: number;
}

/**
 * Calculate new Elo ratings after a match
 * K-factor of 32 is standard for most rating systems
 */
function calculateElo(ratingA: number, ratingB: number, winner: 'A' | 'B'): EloResult {
  const K = 32;

  // Expected scores based on current ratings
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  // Actual scores
  const scoreA = winner === 'A' ? 1 : 0;
  const scoreB = winner === 'B' ? 1 : 0;

  // New ratings
  const newRatingA = Math.round(ratingA + K * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + K * (scoreB - expectedB));

  return { newRatingA, newRatingB };
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

    // Create Supabase client with user's auth
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

    // Parse request body
    const { submissionAId, submissionBId, winnerId, challengeDate }: VoteRequest = await req.json();

    // Validate input
    if (!submissionAId || !submissionBId || !challengeDate) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Record the comparison
    const { error: comparisonError } = await supabaseAdmin.from('comparisons').insert({
      voter_id: user.id,
      challenge_date: challengeDate,
      submission_a_id: submissionAId,
      submission_b_id: submissionBId,
      winner_id: winnerId,
    });

    if (comparisonError) {
      // Check if it's a duplicate vote
      if (comparisonError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Already voted on this pair' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw comparisonError;
    }

    // If not skipped, update Elo scores
    if (winnerId) {
      // Get current ratings
      const { data: rankings, error: rankingsError } = await supabaseAdmin
        .from('daily_rankings')
        .select('submission_id, elo_score, vote_count')
        .in('submission_id', [submissionAId, submissionBId])
        .eq('challenge_date', challengeDate);

      if (rankingsError) throw rankingsError;

      const rankingA = rankings?.find((r) => r.submission_id === submissionAId);
      const rankingB = rankings?.find((r) => r.submission_id === submissionBId);

      if (rankingA && rankingB) {
        const winner = winnerId === submissionAId ? 'A' : 'B';
        const { newRatingA, newRatingB } = calculateElo(rankingA.elo_score, rankingB.elo_score, winner);

        // Update both ratings
        await supabaseAdmin
          .from('daily_rankings')
          .update({ elo_score: newRatingA, vote_count: rankingA.vote_count + 1 })
          .eq('submission_id', submissionAId)
          .eq('challenge_date', challengeDate);

        await supabaseAdmin
          .from('daily_rankings')
          .update({ elo_score: newRatingB, vote_count: rankingB.vote_count + 1 })
          .eq('submission_id', submissionBId)
          .eq('challenge_date', challengeDate);
      }
    }

    // Update user voting status
    const isActualVote = winnerId !== null;

    // Get or create voting status
    const { data: existingStatus } = await supabaseAdmin
      .from('user_voting_status')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_date', challengeDate)
      .single();

    if (existingStatus) {
      // Update existing status
      const newVoteCount = isActualVote ? existingStatus.vote_count + 1 : existingStatus.vote_count;
      const enteredRanking = newVoteCount >= 5;

      await supabaseAdmin
        .from('user_voting_status')
        .update({
          vote_count: newVoteCount,
          entered_ranking: enteredRanking,
        })
        .eq('id', existingStatus.id);

      // If user just hit 5 votes, mark their submission as included in ranking
      if (enteredRanking && !existingStatus.entered_ranking) {
        // Get today's date (the day after challengeDate, when user is voting)
        const today = new Date().toISOString().split('T')[0];

        await supabaseAdmin
          .from('submissions')
          .update({ included_in_ranking: true })
          .eq('user_id', user.id)
          .eq('challenge_date', today);
      }

      return new Response(
        JSON.stringify({
          success: true,
          voteCount: newVoteCount,
          enteredRanking,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Create new status
      const voteCount = isActualVote ? 1 : 0;

      await supabaseAdmin.from('user_voting_status').insert({
        user_id: user.id,
        challenge_date: challengeDate,
        vote_count: voteCount,
        entered_ranking: false,
      });

      return new Response(
        JSON.stringify({
          success: true,
          voteCount,
          enteredRanking: false,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Error processing vote:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal server error', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
