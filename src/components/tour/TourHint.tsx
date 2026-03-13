import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';

export function TourHint({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-[0.75rem] opacity-75 bg-current/8">
      <Lightbulb size={16} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
