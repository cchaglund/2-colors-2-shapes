import { useMemo } from 'react';
import { WallContent } from '../Wall/WallContent';
import { useAuth } from '../../hooks/useAuth';
import { useSubmissions } from '../../hooks/useSubmissions';
import { getTodayDateUTC } from '../../utils/dailyChallenge';

interface WallOfTheDayPageProps {
  date: string;
}

export function WallOfTheDayPage({ date }: WallOfTheDayPageProps) {
  const { user } = useAuth();
  const todayDate = useMemo(() => getTodayDateUTC(), []);
  const { hasSubmittedToday } = useSubmissions(user?.id, todayDate);

  const handleDateChange = (newDate: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('date', newDate);
    window.location.href = url.toString();
  };

  // Format date for display
  const formattedDate = useMemo(() => {
    const d = new Date(date + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }, [date]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-(--color-bg-primary)">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm hover:underline text-(--color-text-secondary) mb-4"
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
            Back to app
          </a>
          <h1 className="text-2xl font-bold mb-2 text-(--color-text-primary)">
            Wall of the Day
          </h1>
          <p className="text-(--color-text-secondary)">{formattedDate}</p>
        </div>

        {/* Wall content */}
        <WallContent
          date={date}
          onDateChange={handleDateChange}
          hasSubmittedToday={hasSubmittedToday}
          showNavigation={true}
        />
      </div>
    </div>
  );
}
