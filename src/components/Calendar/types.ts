import type { Shape, ShapeGroup } from '../../types';

export type ViewMode = 'my-submissions' | 'winners' | 'wall' | 'friends';

export interface RankingInfo {
  submission_id: string;
  final_rank: number | null;
}

export interface WinnerEntry {
  challenge_date: string;
  submission_id: string;
  user_id: string;
  nickname: string;
  final_rank: number;
  shapes: Shape[];
  groups?: ShapeGroup[];
  background_color_index: number | null;
}

export interface CalendarProps {
  onClose: () => void;
}
