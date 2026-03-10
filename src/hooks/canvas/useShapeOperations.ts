import type { CanvasState, DailyChallenge } from '../../types';
import { useShapeCRUD } from './useShapeCRUD';
import { useShapeGrouping } from './useShapeGrouping';
import { useShapeLayering } from './useShapeLayering';

type SetCanvasState = (
  updater: CanvasState | ((prev: CanvasState) => CanvasState),
  addToHistory?: boolean,
  label?: string
) => void;

export function useShapeOperations(
  challenge: DailyChallenge | null,
  setCanvasState: SetCanvasState,
) {
  const crud = useShapeCRUD(challenge, setCanvasState);
  const grouping = useShapeGrouping(setCanvasState);
  const layering = useShapeLayering(setCanvasState);

  return { ...crud, ...grouping, ...layering };
}
