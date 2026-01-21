import { WallContent } from '../../Wall/WallContent';

interface WallTabProps {
  date: string;
  onDateChange: (date: string) => void;
  hasSubmittedToday: boolean;
  isLoggedIn: boolean;
}

export function WallTab({
  date,
  onDateChange,
  hasSubmittedToday,
  isLoggedIn,
}: WallTabProps) {
  return (
    <div className="mt-4">
      <WallContent
        date={date}
        onDateChange={onDateChange}
        hasSubmittedToday={hasSubmittedToday}
        isLoggedIn={isLoggedIn}
        showNavigation={true}
      />
    </div>
  );
}
