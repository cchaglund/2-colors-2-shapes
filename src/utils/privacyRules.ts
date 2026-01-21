/**
 * Privacy rules for social features.
 *
 * These rules control visibility of other users' submissions to prevent
 * being influenced by others' work before creating your own.
 */

/**
 * Determines if a user can view submissions for a given date.
 *
 * Rule: Users cannot see OTHER users' submissions for the current day
 * until they have saved their own art. Past days are always visible.
 *
 * @param targetDate - The date being viewed (YYYY-MM-DD format)
 * @param todayDate - Today's date (YYYY-MM-DD format)
 * @param hasSubmittedToday - Whether the viewer has submitted their art today
 * @returns true if the user can view submissions for the target date
 */
export function canViewCurrentDay(
  targetDate: string,
  todayDate: string,
  hasSubmittedToday: boolean
): boolean {
  // Past days are always viewable
  if (targetDate !== todayDate) {
    return true;
  }

  // Current day requires user to have submitted
  return hasSubmittedToday;
}
