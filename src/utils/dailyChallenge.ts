// =============================================================================
// Date Utilities
// =============================================================================
// Simple date helper functions used throughout the app.
// All dates use UTC to ensure consistency across timezones.
//
// Challenge/color generation is SERVER-SIDE ONLY in:
//   supabase/functions/get-daily-challenge/index.ts
// =============================================================================

export function getTodayDateUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString().split('T')[0];
}

export function getYesterdayDateUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
    .toISOString().split('T')[0];
}

export function getTwoDaysAgoDateUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2))
    .toISOString().split('T')[0];
}
