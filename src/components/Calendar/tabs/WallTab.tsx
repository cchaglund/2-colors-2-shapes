import { WallContent } from '../../Wall/WallContent';

interface WallTabProps {
  date: string;
  onDateChange: (date: string) => void;
  hasSubmittedToday: boolean;
}

export function WallTab({
  date,
  onDateChange,
  hasSubmittedToday,
}: WallTabProps) {
  return (
    <WallContent
      date={date}
      onDateChange={onDateChange}
      hasSubmittedToday={hasSubmittedToday}
      showNavigation={true}
    />
  );
}
