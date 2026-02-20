import { useMemo, useCallback } from 'react';
import { formatDate, getDaysInMonth, getFirstDayOfMonth } from '../../utils/calendarUtils';
import { getTodayDateUTC } from '../../utils/dailyChallenge';

export function useCalendarMonth(date: string, onDateChange: (date: string) => void) {
  const [calendarYear, calendarMonth] = useMemo(() => {
    const d = new Date(date + 'T00:00:00Z');
    return [d.getUTCFullYear(), d.getUTCMonth()];
  }, [date]);

  const todayStr = useMemo(() => getTodayDateUTC(), []);
  const isToday = date === todayStr;

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [calendarYear, calendarMonth]);

  const goToPreviousMonth = useCallback(() => {
    let newMonth = calendarMonth - 1;
    let newYear = calendarYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    onDateChange(formatDate(newYear, newMonth, 1));
  }, [calendarMonth, calendarYear, onDateChange]);

  const goToNextMonth = useCallback(() => {
    let newMonth = calendarMonth + 1;
    let newYear = calendarYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    onDateChange(formatDate(newYear, newMonth, 1));
  }, [calendarMonth, calendarYear, onDateChange]);

  const goToToday = useCallback(() => {
    onDateChange(todayStr);
  }, [onDateChange, todayStr]);

  const canGoNext = useMemo(() => {
    const now = new Date();
    return calendarYear < now.getFullYear() ||
      (calendarYear === now.getFullYear() && calendarMonth < now.getMonth());
  }, [calendarYear, calendarMonth]);

  const monthYearLabel = useMemo(() => {
    const d = new Date(calendarYear, calendarMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarYear, calendarMonth]);

  const shortDateLabel = useMemo(() => {
    const d = new Date(date + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }, [date]);

  return {
    calendarYear,
    calendarMonth,
    calendarDays,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    canGoNext,
    monthYearLabel,
    shortDateLabel,
    todayStr,
    isToday,
  };
}
