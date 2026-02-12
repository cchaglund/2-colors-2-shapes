import { useState, useEffect } from 'react';
import { fetchChallengesBatch, getChallengeSync } from './useDailyChallenge';
import { formatDate, getDaysInMonth } from '../utils/calendarUtils';
import type { DailyChallenge } from '../types';

export function useCalendarChallenges(
  calendarYear: number,
  calendarMonth: number,
  enabled: boolean,
) {
  const [challengesMap, setChallengesMap] = useState<Map<string, DailyChallenge>>(new Map());

  useEffect(() => {
    if (!enabled) return;

    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(formatDate(calendarYear, calendarMonth, day));
    }

    // Immediately populate from global cache (synchronous) to avoid flash
    const cachedMap = new Map<string, DailyChallenge>();
    dates.forEach(date => {
      const cached = getChallengeSync(date);
      if (cached) cachedMap.set(date, cached);
    });
    if (cachedMap.size > 0) {
      setChallengesMap(cachedMap);
    }

    // Then fetch any uncached dates (fetchChallengesBatch handles this efficiently)
    fetchChallengesBatch(dates).then(setChallengesMap);
  }, [enabled, calendarYear, calendarMonth]);

  return challengesMap;
}
