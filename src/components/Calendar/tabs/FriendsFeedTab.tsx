import { FriendsFeedContent } from '../../FriendsFeed/FriendsFeedContent';

interface FriendsFeedTabProps {
  date: string;
  onDateChange: (date: string) => void;
  hasSubmittedToday: boolean;
}

export function FriendsFeedTab({
  date,
  onDateChange,
  hasSubmittedToday,
}: FriendsFeedTabProps) {
  return (
    <div className="mt-4">
      <FriendsFeedContent
        date={date}
        onDateChange={onDateChange}
        hasSubmittedToday={hasSubmittedToday}
        showNavigation={false}
      />
    </div>
  );
}
