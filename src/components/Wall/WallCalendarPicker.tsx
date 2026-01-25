import { useState, useMemo, useCallback, useEffect } from 'react';
import { getTodayDateUTC } from '../../utils/dailyChallenge';
import { fetchChallengesBatch } from '../../hooks/useDailyChallenge';
import type { DailyChallenge } from '../../types';
import {
  DAYS_OF_WEEK,
  MONTHS,
  formatDate,
  getDaysInMonth,
  getFirstDayOfMonth,
} from '../../utils/calendarUtils';
import { ChallengeShapeIndicators } from '../ChallengeShapeIndicators';

interface WallCalendarPickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onClose: () => void;
}

export function WallCalendarPicker({
  selectedDate,
  onDateSelect,
  onClose,
}: WallCalendarPickerProps) {
  // Parse selectedDate to initialize year/month
  const initialDate = useMemo(() => {
    const [year, month] = selectedDate.split('-').map(Number);
    return { year, month: month - 1 }; // month is 0-indexed
  }, [selectedDate]);

  const [currentYear, setCurrentYear] = useState(initialDate.year);
  const [currentMonth, setCurrentMonth] = useState(initialDate.month);
  const [challenges, setChallenges] = useState<Map<string, DailyChallenge>>(new Map());

  const todayStr = useMemo(() => getTodayDateUTC(), []);

  // Fetch challenges for all days in the current month
  useEffect(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const dates: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(formatDate(currentYear, currentMonth, day));
    }

    fetchChallengesBatch(dates).then((challengeMap) => {
      setChallenges(challengeMap);
    });
  }, [currentYear, currentMonth]);

  // Generate calendar grid data
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentYear, currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  }, []);

  // Check if we can go to next month
  const canGoNext = useMemo(() => {
    const now = new Date();
    return (
      currentYear < now.getFullYear() ||
      (currentYear === now.getFullYear() && currentMonth < now.getMonth())
    );
  }, [currentYear, currentMonth]);

  const handleDayClick = useCallback(
    (day: number) => {
      const dateStr = formatDate(currentYear, currentMonth, day);
      if (dateStr <= todayStr) {
        onDateSelect(dateStr);
        onClose();
      }
    },
    [currentYear, currentMonth, todayStr, onDateSelect, onClose]
  );

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-(--color-modal-overlay)"
      onClick={onClose}
    >
      <div
        className="border rounded-lg p-4 w-full max-w-md mx-4 bg-(--color-bg-primary) border-(--color-border)"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-(--color-text-primary)">
            Select Date
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors hover:bg-(--color-bg-tertiary) text-(--color-text-secondary)"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-md cursor-pointer transition-colors bg-(--color-bg-tertiary) text-(--color-text-primary)"
            aria-label="Previous month"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-(--color-text-primary)">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={goToToday}
              className="px-2 py-1 rounded-md cursor-pointer text-xs transition-colors bg-(--color-bg-tertiary) text-(--color-text-secondary)"
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="p-2 rounded-md cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-(--color-bg-tertiary) text-(--color-text-primary)"
            aria-label="Next month"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center py-1 text-xs font-medium text-(--color-text-tertiary)"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = formatDate(currentYear, currentMonth, day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const isFuture = dateStr > todayStr;
            const challenge = challenges.get(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                disabled={isFuture}
                className={`
                  aspect-square rounded-md p-1 flex flex-col items-center justify-center gap-0.5
                  transition-colors text-xs
                  ${isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-(--color-bg-tertiary)'}
                  ${isSelected ? 'bg-(--color-accent) text-white' : ''}
                  ${isToday && !isSelected ? 'ring-1 ring-(--color-accent)' : ''}
                  ${!isSelected && !isFuture ? 'text-(--color-text-primary)' : ''}
                `}
              >
                <span className="font-medium tabular-nums">{day}</span>
                {challenge && !isFuture && (
                  <ChallengeShapeIndicators
                    shapes={challenge.shapes}
                    size={8}
                    gap={1}
                    color={isSelected ? 'white' : undefined}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
