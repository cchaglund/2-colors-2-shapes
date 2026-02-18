import type { Shape } from '../types';
import { SVGShape } from './SVGShape';

interface ShapeElementProps {
  shape: Shape;
  color: string;
  isSelected: boolean;
}

export function ShapeElement({
  shape,
  color,
}: ShapeElementProps) {
  return (
    <SVGShape
      type={shape.type}
      size={shape.size}
      x={shape.x}
      y={shape.y}
      rotation={shape.rotation}
      flipX={shape.flipX}
      flipY={shape.flipY}
      color={color}
      style={{ cursor: 'move' }}
      dataShapeId={shape.id}
    />
  );
}
