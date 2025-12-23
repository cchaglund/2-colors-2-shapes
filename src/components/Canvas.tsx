import { useRef, useCallback, useState, useEffect } from 'react';
import type { Shape, DailyChallenge, ViewportState } from '../types';
import { ShapeElement } from './ShapeElement';
import {
  TransformInteractionLayer,
  MultiSelectTransformLayer,
  MultiSelectInteractionLayer,
} from './TransformHandles';
import { type KeyMappings, matchesBinding } from '../constants/keyboardActions';
import { TouchContextMenu } from './TouchContextMenu';

interface CanvasProps {
  shapes: Shape[];
  selectedShapeIds: Set<string>;
  backgroundColor: string | null;
  challenge: DailyChallenge;
  viewport: ViewportState;
  keyMappings: KeyMappings;
  onSelectShape: (id: string | null, options?: { toggle?: boolean; range?: boolean; orderedIds?: string[] }) => void;
  onUpdateShape: (id: string, updates: Partial<Shape>) => void;
  onUpdateShapes: (updates: Map<string, Partial<Shape>>) => void;
  onDuplicateShapes: (ids: string[]) => void;
  onDeleteSelectedShapes: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onMirrorHorizontal: (ids: string[]) => void;
  onMirrorVertical: (ids: string[]) => void;
  onZoomAtPoint: (delta: number, pointX: number, pointY: number) => void;
  onSetZoomAtPoint: (startZoom: number, scale: number, centerX: number, centerY: number, startPanX: number, startPanY: number) => void;
  onPan: (panX: number, panY: number) => void;
  onMoveLayer?: (id: string, direction: 'front' | 'back' | 'up' | 'down') => void;
}

type DragMode = 'none' | 'move' | 'resize' | 'rotate';

// Touch gesture constants
const LONG_PRESS_DURATION = 500; // ms
const TAP_THRESHOLD = 10; // pixels of movement allowed for a tap

interface TouchState {
  // Single touch tracking
  startPoint: { x: number; y: number; clientX: number; clientY: number } | null;
  currentPoint: { x: number; y: number } | null;
  touchedShapeId: string | null;
  isDragging: boolean;
  hasMoved: boolean;
  longPressTimer: ReturnType<typeof setTimeout> | null;
  isLongPress: boolean;

  // Multi-touch (pinch/rotate) tracking
  isMultiTouch: boolean;
  startDistance: number;
  startAngle: number;
  startCenter: { x: number; y: number };
  startShapeData: Map<string, { x: number; y: number; size: number; rotation: number }> | null;
  // For canvas zoom when no shapes selected
  startZoom: number;
  startPanX: number;
  startPanY: number;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  shapeId: string | null;
}

interface DragState {
  mode: DragMode;
  shapeId: string;
  startX: number;
  startY: number;
  startShapeX: number;
  startShapeY: number;
  startSize: number;
  startRotation: number;
  resizeCorner: string;
  // Store flip state to compensate for inverted coordinates
  flipX?: boolean;
  flipY?: boolean;
  // For multi-select: store start positions and sizes of all selected shapes
  startPositions?: Map<string, { x: number; y: number }>;
  startShapeData?: Map<string, { x: number; y: number; size: number; rotation: number }>;
  // For multi-select resize/rotate: store the initial bounds
  startBounds?: { x: number; y: number; width: number; height: number };
}

const CANVAS_SIZE = 800;

export function Canvas({
  shapes,
  selectedShapeIds,
  backgroundColor,
  challenge,
  viewport,
  keyMappings,
  onSelectShape,
  onUpdateShape,
  onUpdateShapes,
  onDuplicateShapes,
  onDeleteSelectedShapes,
  onUndo,
  onRedo,
  onMirrorHorizontal,
  onMirrorVertical,
  onZoomAtPoint,
  onSetZoomAtPoint,
  onPan,
  onMoveLayer,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Touch state
  const touchStateRef = useRef<TouchState>({
    startPoint: null,
    currentPoint: null,
    touchedShapeId: null,
    isDragging: false,
    hasMoved: false,
    longPressTimer: null,
    isLongPress: false,
    isMultiTouch: false,
    startDistance: 0,
    startAngle: 0,
    startCenter: { x: 0, y: 0 },
    startShapeData: null,
    startZoom: 1,
    startPanX: 0,
    startPanY: 0,
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    shapeId: null,
  });

  // Get all selected shapes
  const selectedShapes = shapes.filter((s) => selectedShapeIds.has(s.id));
  const hasSelection = selectedShapes.length > 0;
  const hasSingleSelection = selectedShapes.length === 1;
  const singleSelectedShape = hasSingleSelection ? selectedShapes[0] : null;

  // Calculate bounding box for all selected shapes, accounting for rotation
  const getSelectionBounds = useCallback(() => {
    if (selectedShapes.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const shape of selectedShapes) {
      // Get the four corners of the shape's bounding box
      const corners = [
        { x: 0, y: 0 },
        { x: shape.size, y: 0 },
        { x: shape.size, y: shape.size },
        { x: 0, y: shape.size },
      ];

      // Rotation center is at the center of the shape
      const cx = shape.size / 2;
      const cy = shape.size / 2;
      const angleRad = (shape.rotation * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);

      // Rotate each corner around the center and translate to shape position
      for (const corner of corners) {
        const relX = corner.x - cx;
        const relY = corner.y - cy;
        const rotatedX = relX * cos - relY * sin;
        const rotatedY = relX * sin + relY * cos;
        const finalX = shape.x + cx + rotatedX;
        const finalY = shape.y + cy + rotatedY;

        minX = Math.min(minX, finalX);
        minY = Math.min(minY, finalY);
        maxX = Math.max(maxX, finalX);
        maxY = Math.max(maxY, finalY);
      }
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [selectedShapes]);

  const selectionBounds = getSelectionBounds();

  // Convert client coordinates to SVG/canvas coordinates
  // When using viewBox, getScreenCTM already accounts for the viewBox transform
  const getSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      // The viewBox transform is already applied by getScreenCTM
      return { x: svgP.x, y: svgP.y };
    },
    []
  );

  // Get client coordinates relative to the SVG element (for zoom center calculation)
  const getClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      // Return position relative to SVG element, normalized to 0-CANVAS_SIZE range
      return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
        y: ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
      };
    },
    []
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      onSelectShape(null);
    }
  };

  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      e.stopPropagation();
      const shape = shapes.find((s) => s.id === shapeId);
      if (!shape) return;

      const isShiftKey = e.shiftKey;
      const isAlreadySelected = selectedShapeIds.has(shapeId);

      // Handle selection logic
      if (isShiftKey) {
        // Shift+click: toggle selection
        onSelectShape(shapeId, { toggle: true });

        // If we're removing from selection, don't start a drag
        if (isAlreadySelected) {
          return;
        }
      } else if (!isAlreadySelected) {
        // Click on unselected shape without shift: select only this shape
        onSelectShape(shapeId);
      }
      // If already selected without shift, don't change selection (allows dragging multiple)

      // Start drag for move
      const point = getSVGPoint(e.clientX, e.clientY);

      // Calculate which shapes to drag based on the new selection state
      let shapesToDrag: Shape[];
      if (isShiftKey) {
        // Shift+click on unselected: drag all currently selected shapes plus this one
        shapesToDrag = [...selectedShapes, shape];
      } else if (isAlreadySelected) {
        // Clicking on already selected shape: drag all selected
        shapesToDrag = selectedShapes;
      } else {
        // Clicking on unselected shape: drag just this one
        shapesToDrag = [shape];
      }

      const startPositions = new Map<string, { x: number; y: number }>();
      shapesToDrag.forEach(s => {
        startPositions.set(s.id, { x: s.x, y: s.y });
      });

      setDragState({
        mode: 'move',
        shapeId: shape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: shape.x,
        startShapeY: shape.y,
        startSize: shape.size,
        startRotation: shape.rotation,
        resizeCorner: '',
        startPositions,
      });
    },
    [shapes, selectedShapeIds, selectedShapes, getSVGPoint, onSelectShape]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, corner: string) => {
      e.stopPropagation();
      if (!singleSelectedShape) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);
      setDragState({
        mode: 'resize',
        shapeId: singleSelectedShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: singleSelectedShape.x,
        startShapeY: singleSelectedShape.y,
        startSize: singleSelectedShape.size,
        startRotation: singleSelectedShape.rotation,
        resizeCorner: corner,
        flipX: singleSelectedShape.flipX,
        flipY: singleSelectedShape.flipY,
      });
    },
    [singleSelectedShape, getSVGPoint]
  );

  const handleRotateStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (!singleSelectedShape) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);
      setDragState({
        mode: 'rotate',
        shapeId: singleSelectedShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: singleSelectedShape.x,
        startShapeY: singleSelectedShape.y,
        startSize: singleSelectedShape.size,
        startRotation: singleSelectedShape.rotation,
        resizeCorner: '',
        flipX: singleSelectedShape.flipX,
        flipY: singleSelectedShape.flipY,
      });
    },
    [singleSelectedShape, getSVGPoint]
  );

  const handleMoveStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (!hasSelection) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);

      // Store start positions for all selected shapes
      const startPositions = new Map<string, { x: number; y: number }>();
      selectedShapes.forEach(s => {
        startPositions.set(s.id, { x: s.x, y: s.y });
      });

      // Use the first selected shape as reference
      const refShape = selectedShapes[0];

      setDragState({
        mode: 'move',
        shapeId: refShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: refShape.x,
        startShapeY: refShape.y,
        startSize: refShape.size,
        startRotation: refShape.rotation,
        resizeCorner: '',
        startPositions,
      });
    },
    [hasSelection, selectedShapes, getSVGPoint]
  );

  // Multi-select resize handler
  const handleMultiResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, corner: string) => {
      e.stopPropagation();
      if (selectedShapes.length < 2 || !selectionBounds) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);

      // Store start data for all selected shapes
      const startShapeData = new Map<string, { x: number; y: number; size: number; rotation: number }>();
      selectedShapes.forEach(s => {
        startShapeData.set(s.id, { x: s.x, y: s.y, size: s.size, rotation: s.rotation });
      });

      const refShape = selectedShapes[0];

      setDragState({
        mode: 'resize',
        shapeId: refShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: refShape.x,
        startShapeY: refShape.y,
        startSize: refShape.size,
        startRotation: refShape.rotation,
        resizeCorner: corner,
        startShapeData,
        startBounds: { ...selectionBounds },
      });
    },
    [selectedShapes, selectionBounds, getSVGPoint]
  );

  // Multi-select rotate handler
  const handleMultiRotateStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (selectedShapes.length < 2 || !selectionBounds) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const point = getSVGPoint(clientX, clientY);

      // Store start data for all selected shapes
      const startShapeData = new Map<string, { x: number; y: number; size: number; rotation: number }>();
      selectedShapes.forEach(s => {
        startShapeData.set(s.id, { x: s.x, y: s.y, size: s.size, rotation: s.rotation });
      });

      const refShape = selectedShapes[0];

      setDragState({
        mode: 'rotate',
        shapeId: refShape.id,
        startX: point.x,
        startY: point.y,
        startShapeX: refShape.x,
        startShapeY: refShape.y,
        startSize: refShape.size,
        startRotation: refShape.rotation,
        resizeCorner: '',
        startShapeData,
        startBounds: { ...selectionBounds },
      });
    },
    [selectedShapes, selectionBounds, getSVGPoint]
  );

  useEffect(() => {
    if (!dragState || dragState.mode === 'none') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const point = getSVGPoint(e.clientX, e.clientY);

      if (dragState.mode === 'move') {
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        // Move all shapes in startPositions
        if (dragState.startPositions && dragState.startPositions.size > 1) {
          const updates = new Map<string, Partial<Shape>>();
          dragState.startPositions.forEach((startPos, id) => {
            updates.set(id, {
              x: startPos.x + dx,
              y: startPos.y + dy,
            });
          });
          onUpdateShapes(updates);
        } else {
          // Single shape move
          onUpdateShape(dragState.shapeId, {
            x: dragState.startShapeX + dx,
            y: dragState.startShapeY + dy,
          });
        }
      } else if (dragState.mode === 'resize') {
        // Pure screen-space resize logic
        // We completely ignore rotation/flip - just use where the mouse actually is

        // Shape center in screen space
        const centerX = dragState.startShapeX + dragState.startSize / 2;
        const centerY = dragState.startShapeY + dragState.startSize / 2;

        // Where the drag started (the grabbed corner's screen position)
        const grabX = dragState.startX;
        const grabY = dragState.startY;

        // Direction from center to grabbed point (this is the "outward" direction)
        const outDirX = grabX - centerX;
        const outDirY = grabY - centerY;
        const outLen = Math.sqrt(outDirX * outDirX + outDirY * outDirY);

        if (outLen < 1) {
          // Grabbed too close to center, skip
          return;
        }

        // Normalize the outward direction
        const unitOutX = outDirX / outLen;
        const unitOutY = outDirY / outLen;

        // Mouse movement since drag start
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        // Project mouse movement onto the outward direction
        // Positive = moving away from center = enlarge
        // Negative = moving toward center = shrink
        const projection = dx * unitOutX + dy * unitOutY;

        // The anchor is the point opposite the grabbed corner (through center)
        const anchorX = centerX - outDirX;
        const anchorY = centerY - outDirY;

        // Size change: scale by sqrt(2) because corners are on the diagonal
        const sizeDelta = projection * Math.SQRT2;

        // Multi-select resize
        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const maxDimension = Math.max(bounds.width, bounds.height);
          const scale = Math.max(0.1, (maxDimension + sizeDelta) / maxDimension);

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            const relX = startData.x - anchorX;
            const relY = startData.y - anchorY;
            const newX = anchorX + relX * scale;
            const newY = anchorY + relY * scale;
            const newSize = Math.max(20, startData.size * scale);

            updates.set(id, { x: newX, y: newY, size: newSize });
          });
          onUpdateShapes(updates);
        } else {
          // Single shape resize
          const newSize = Math.max(20, dragState.startSize + sizeDelta);

          // Keep anchor fixed, scale the center position relative to anchor
          const ratio = newSize / dragState.startSize;
          const newCenterX = anchorX + (centerX - anchorX) * ratio;
          const newCenterY = anchorY + (centerY - anchorY) * ratio;

          // Convert center to top-left position
          const newX = newCenterX - newSize / 2;
          const newY = newCenterY - newSize / 2;

          onUpdateShape(dragState.shapeId, {
            size: newSize,
            x: newX,
            y: newY,
          });
        }
      } else if (dragState.mode === 'rotate') {
        // Multi-select rotate
        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;

          const startAngle = Math.atan2(
            dragState.startY - centerY,
            dragState.startX - centerX
          );
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

          // For group rotation, use raw angle delta for position changes
          let angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;

          if (e.shiftKey) {
            angleDelta = Math.round(angleDelta / 15) * 15;
          }

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            // Find the actual shape to check its flip state
            const shape = shapes.find(s => s.id === id);
            const shapeFlipX = shape?.flipX ?? false;
            const shapeFlipY = shape?.flipY ?? false;

            // Rotate position around the center of the bounding box (same for all shapes)
            const shapeCenter = {
              x: startData.x + startData.size / 2,
              y: startData.y + startData.size / 2,
            };
            const relX = shapeCenter.x - centerX;
            const relY = shapeCenter.y - centerY;
            const angleRad = (angleDelta * Math.PI) / 180;
            const rotatedX = relX * Math.cos(angleRad) - relY * Math.sin(angleRad);
            const rotatedY = relX * Math.sin(angleRad) + relY * Math.cos(angleRad);
            const newCenterX = centerX + rotatedX;
            const newCenterY = centerY + rotatedY;

            // For the shape's own rotation value, mirrored shapes need inverted delta
            // to visually rotate the same direction as non-mirrored shapes
            const shapeFlipInverts = (shapeFlipX ? 1 : 0) ^ (shapeFlipY ? 1 : 0);
            const shapeRotationDelta = shapeFlipInverts ? -angleDelta : angleDelta;

            updates.set(id, {
              x: newCenterX - startData.size / 2,
              y: newCenterY - startData.size / 2,
              rotation: startData.rotation + shapeRotationDelta,
            });
          });
          onUpdateShapes(updates);
        } else {
          // Single shape rotate
          const draggedShape = shapes.find((s) => s.id === dragState.shapeId);
          if (!draggedShape) return;

          const centerX = draggedShape.x + draggedShape.size / 2;
          const centerY = draggedShape.y + draggedShape.size / 2;

          const startAngle = Math.atan2(
            dragState.startY - centerY,
            dragState.startX - centerX
          );
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

          // For single shape, mirrored shapes need inverted rotation to match visual drag direction
          const flipInvertsRotation = (dragState.flipX ? 1 : 0) ^ (dragState.flipY ? 1 : 0);
          const rotationMult = flipInvertsRotation ? -1 : 1;

          const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI * rotationMult;
          let newRotation = dragState.startRotation + angleDelta;

          if (e.shiftKey) {
            newRotation = Math.round(newRotation / 15) * 15;
          }

          onUpdateShape(dragState.shapeId, { rotation: newRotation });
        }
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragState || e.touches.length !== 1) return;
      e.preventDefault();

      const touch = e.touches[0];
      const point = getSVGPoint(touch.clientX, touch.clientY);

      if (dragState.mode === 'move') {
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;

        if (dragState.startPositions && dragState.startPositions.size > 1) {
          const updates = new Map<string, Partial<Shape>>();
          dragState.startPositions.forEach((startPos, id) => {
            updates.set(id, {
              x: startPos.x + dx,
              y: startPos.y + dy,
            });
          });
          onUpdateShapes(updates);
        } else {
          onUpdateShape(dragState.shapeId, {
            x: dragState.startShapeX + dx,
            y: dragState.startShapeY + dy,
          });
        }
      } else if (dragState.mode === 'resize') {
        const centerX = dragState.startShapeX + dragState.startSize / 2;
        const centerY = dragState.startShapeY + dragState.startSize / 2;
        const grabX = dragState.startX;
        const grabY = dragState.startY;
        const outDirX = grabX - centerX;
        const outDirY = grabY - centerY;
        const outLen = Math.sqrt(outDirX * outDirX + outDirY * outDirY);

        if (outLen < 1) return;

        const unitOutX = outDirX / outLen;
        const unitOutY = outDirY / outLen;
        const dx = point.x - dragState.startX;
        const dy = point.y - dragState.startY;
        const projection = dx * unitOutX + dy * unitOutY;
        const anchorX = centerX - outDirX;
        const anchorY = centerY - outDirY;
        const sizeDelta = projection * Math.SQRT2;

        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const maxDimension = Math.max(bounds.width, bounds.height);
          const scale = Math.max(0.1, (maxDimension + sizeDelta) / maxDimension);

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            const relX = startData.x - anchorX;
            const relY = startData.y - anchorY;
            const newX = anchorX + relX * scale;
            const newY = anchorY + relY * scale;
            const newSize = Math.max(20, startData.size * scale);
            updates.set(id, { x: newX, y: newY, size: newSize });
          });
          onUpdateShapes(updates);
        } else {
          const newSize = Math.max(20, dragState.startSize + sizeDelta);
          const ratio = newSize / dragState.startSize;
          const newCenterX = anchorX + (centerX - anchorX) * ratio;
          const newCenterY = anchorY + (centerY - anchorY) * ratio;
          const newX = newCenterX - newSize / 2;
          const newY = newCenterY - newSize / 2;
          onUpdateShape(dragState.shapeId, { size: newSize, x: newX, y: newY });
        }
      } else if (dragState.mode === 'rotate') {
        if (dragState.startShapeData && dragState.startBounds) {
          const bounds = dragState.startBounds;
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;

          const startAngle = Math.atan2(dragState.startY - centerY, dragState.startX - centerX);
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);
          const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI;

          const updates = new Map<string, Partial<Shape>>();
          dragState.startShapeData.forEach((startData, id) => {
            const shape = shapes.find(s => s.id === id);
            const shapeFlipX = shape?.flipX ?? false;
            const shapeFlipY = shape?.flipY ?? false;

            const shapeCenter = {
              x: startData.x + startData.size / 2,
              y: startData.y + startData.size / 2,
            };
            const relX = shapeCenter.x - centerX;
            const relY = shapeCenter.y - centerY;
            const angleRad = (angleDelta * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const rotatedX = relX * cos - relY * sin;
            const rotatedY = relX * sin + relY * cos;
            const newCenterX = centerX + rotatedX;
            const newCenterY = centerY + rotatedY;

            const shapeFlipInverts = (shapeFlipX ? 1 : 0) ^ (shapeFlipY ? 1 : 0);
            const shapeRotationDelta = shapeFlipInverts ? -angleDelta : angleDelta;

            updates.set(id, {
              x: newCenterX - startData.size / 2,
              y: newCenterY - startData.size / 2,
              rotation: startData.rotation + shapeRotationDelta,
            });
          });
          onUpdateShapes(updates);
        } else {
          const draggedShape = shapes.find((s) => s.id === dragState.shapeId);
          if (!draggedShape) return;

          const centerX = draggedShape.x + draggedShape.size / 2;
          const centerY = draggedShape.y + draggedShape.size / 2;

          const startAngle = Math.atan2(dragState.startY - centerY, dragState.startX - centerX);
          const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);

          const flipInvertsRotation = (dragState.flipX ? 1 : 0) ^ (dragState.flipY ? 1 : 0);
          const rotationMult = flipInvertsRotation ? -1 : 1;

          const angleDelta = ((currentAngle - startAngle) * 180) / Math.PI * rotationMult;
          const newRotation = dragState.startRotation + angleDelta;

          onUpdateShape(dragState.shapeId, { rotation: newRotation });
        }
      }
    };

    const handleTouchEnd = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [dragState, shapes, getSVGPoint, onUpdateShape, onUpdateShapes]);

  // Handle keyboard shortcuts (movement, rotation, undo/redo, duplicate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Check for undo binding
      const undoBinding = keyMappings.undo;
      if (undoBinding && matchesBinding(e, undoBinding)) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Check for redo binding
      const redoBinding = keyMappings.redo;
      if (redoBinding && matchesBinding(e, redoBinding)) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Check for duplicate binding - only when shapes are selected
      const duplicateBinding = keyMappings.duplicate;
      if (duplicateBinding && matchesBinding(e, duplicateBinding)) {
        if (selectedShapes.length > 0) {
          e.preventDefault();
          onDuplicateShapes(selectedShapes.map(s => s.id));
          return;
        }
      }

      // Check for delete binding
      const deleteBinding = keyMappings.delete;
      if (deleteBinding && matchesBinding(e, deleteBinding)) {
        if (selectedShapes.length > 0) {
          e.preventDefault();
          onDeleteSelectedShapes();
          return;
        }
      }

      // Check for mirror horizontal binding
      const mirrorHBinding = keyMappings.mirrorHorizontal;
      if (mirrorHBinding && matchesBinding(e, mirrorHBinding)) {
        if (selectedShapes.length > 0) {
          e.preventDefault();
          onMirrorHorizontal(selectedShapes.map(s => s.id));
          return;
        }
      }

      // Check for mirror vertical binding
      const mirrorVBinding = keyMappings.mirrorVertical;
      if (mirrorVBinding && matchesBinding(e, mirrorVBinding)) {
        if (selectedShapes.length > 0) {
          e.preventDefault();
          onMirrorVertical(selectedShapes.map(s => s.id));
          return;
        }
      }

      // Movement and rotation shortcuts require selected shapes
      if (!hasSelection) return;

      const SMALL_MOVE = 1;
      const LARGE_MOVE = 10;
      const SMALL_ROTATE = 1;
      const LARGE_ROTATE = 15;

      const moveStep = e.shiftKey ? LARGE_MOVE : SMALL_MOVE;
      const rotateStep = e.shiftKey ? LARGE_ROTATE : SMALL_ROTATE;

      let dx = 0;
      let dy = 0;
      let dRotation = 0;

      // Check movement bindings (ignore shift modifier for movement keys)
      const moveUpBinding = keyMappings.moveUp;
      const moveDownBinding = keyMappings.moveDown;
      const moveLeftBinding = keyMappings.moveLeft;
      const moveRightBinding = keyMappings.moveRight;
      const rotateClockwiseBinding = keyMappings.rotateClockwise;
      const rotateCounterClockwiseBinding = keyMappings.rotateCounterClockwise;

      // For movement, we only check the key code (shift is used for step size)
      if (moveUpBinding && e.code === moveUpBinding.key) {
        dy = -moveStep;
      } else if (moveDownBinding && e.code === moveDownBinding.key) {
        dy = moveStep;
      } else if (moveLeftBinding && e.code === moveLeftBinding.key) {
        dx = -moveStep;
      } else if (moveRightBinding && e.code === moveRightBinding.key) {
        dx = moveStep;
      } else if (rotateClockwiseBinding && e.code === rotateClockwiseBinding.key) {
        dRotation = rotateStep;
      } else if (rotateCounterClockwiseBinding && e.code === rotateCounterClockwiseBinding.key) {
        dRotation = -rotateStep;
      } else {
        return;
      }

      e.preventDefault();

      if (dx !== 0 || dy !== 0) {
        // Move all selected shapes
        const updates = new Map<string, Partial<Shape>>();
        selectedShapes.forEach(shape => {
          updates.set(shape.id, {
            x: shape.x + dx,
            y: shape.y + dy,
          });
        });
        onUpdateShapes(updates);
      }

      if (dRotation !== 0) {
        // Rotate all selected shapes
        const updates = new Map<string, Partial<Shape>>();
        selectedShapes.forEach(shape => {
          updates.set(shape.id, {
            rotation: shape.rotation + dRotation,
          });
        });
        onUpdateShapes(updates);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapes, hasSelection, keyMappings, onUpdateShapes, onUndo, onRedo, onDuplicateShapes, onDeleteSelectedShapes, onMirrorHorizontal, onMirrorVertical]);

  // Handle spacebar for panning mode
  useEffect(() => {
    const panBinding = keyMappings.pan;
    const panKey = panBinding?.key || 'Space';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === panKey && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === panKey) {
        setIsSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyMappings.pan]);

  // Handle panning when space is pressed
  useEffect(() => {
    if (!isSpacePressed) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!isSpacePressed) return;
      e.preventDefault();
      setIsPanning(true);
      const point = getClientPoint(e.clientX, e.clientY);
      panStartRef.current = {
        x: point.x,
        y: point.y,
        panX: viewport.panX,
        panY: viewport.panY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !panStartRef.current) return;
      const point = getClientPoint(e.clientX, e.clientY);
      const dx = point.x - panStartRef.current.x;
      const dy = point.y - panStartRef.current.y;
      onPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSpacePressed, isPanning, viewport.panX, viewport.panY, getClientPoint, onPan]);

  // Handle wheel zoom (Ctrl/Cmd + scroll) with non-passive listener to allow preventDefault
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      // Check for Ctrl (Windows/Linux) or Meta/Cmd (Mac)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        // Get position relative to SVG element, normalized to 0-CANVAS_SIZE range
        const point = {
          x: ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE,
          y: ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE,
        };
        // Normalize wheel delta (different browsers have different values)
        const delta = -Math.sign(e.deltaY);
        onZoomAtPoint(delta, point.x, point.y);
      }
    };

    // Add non-passive event listener to allow preventDefault
    svg.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      svg.removeEventListener('wheel', handleWheel);
    };
  }, [onZoomAtPoint]);

  // Helper to get touch point in SVG coordinates
  const getTouchSVGPoint = useCallback(
    (touch: React.Touch | Touch) => {
      const svgPoint = getSVGPoint(touch.clientX, touch.clientY);
      return {
        ...svgPoint,
        clientX: touch.clientX,
        clientY: touch.clientY,
      };
    },
    [getSVGPoint]
  );

  // Helper to get distance between two touches
  const getTouchDistance = useCallback((t1: React.Touch | Touch, t2: React.Touch | Touch) => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Helper to get angle between two touches
  const getTouchAngle = useCallback((t1: React.Touch | Touch, t2: React.Touch | Touch) => {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
  }, []);

  // Helper to get center point between two touches in SVG coordinates
  const getTouchCenter = useCallback(
    (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
      const centerClientX = (t1.clientX + t2.clientX) / 2;
      const centerClientY = (t1.clientY + t2.clientY) / 2;
      return getSVGPoint(centerClientX, centerClientY);
    },
    [getSVGPoint]
  );

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    const state = touchStateRef.current;
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
  }, []);

  // Find shape at touch point
  const findShapeAtPoint = useCallback(
    (x: number, y: number): Shape | null => {
      // Search from top to bottom (highest zIndex first)
      const sortedByZ = [...shapes].sort((a, b) => b.zIndex - a.zIndex);
      for (const shape of sortedByZ) {
        const halfSize = shape.size / 2;
        const centerX = shape.x + halfSize;
        const centerY = shape.y + halfSize;

        // Rotate the test point around the shape center (inverse rotation)
        const angleRad = (-shape.rotation * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const relX = x - centerX;
        const relY = y - centerY;
        const rotatedX = relX * cos - relY * sin + centerX;
        const rotatedY = relX * sin + relY * cos + centerY;

        // Check if point is within shape bounds
        if (
          rotatedX >= shape.x &&
          rotatedX <= shape.x + shape.size &&
          rotatedY >= shape.y &&
          rotatedY <= shape.y + shape.size
        ) {
          return shape;
        }
      }
      return null;
    },
    [shapes]
  );

  // Handle touch start on canvas
  const handleCanvasTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Close context menu if open
      if (contextMenu.isOpen) {
        setContextMenu({ isOpen: false, x: 0, y: 0, shapeId: null });
        return;
      }

      const touches = e.touches;
      const state = touchStateRef.current;

      if (touches.length === 1) {
        // Single touch
        const touch = touches[0];
        const point = getTouchSVGPoint(touch);
        const shape = findShapeAtPoint(point.x, point.y);

        state.startPoint = point;
        state.currentPoint = point;
        state.touchedShapeId = shape?.id || null;
        state.isDragging = false;
        state.hasMoved = false;
        state.isLongPress = false;
        state.isMultiTouch = false;

        // If touching a shape, select it (if not already selected)
        if (shape && !selectedShapeIds.has(shape.id)) {
          onSelectShape(shape.id);
        }

        // Start long press timer
        clearLongPressTimer();
        if (shape) {
          state.longPressTimer = setTimeout(() => {
            if (!state.hasMoved && state.touchedShapeId && state.startPoint) {
              state.isLongPress = true;
              // Trigger haptic feedback if available
              if (navigator.vibrate) {
                navigator.vibrate(50);
              }
              // Open context menu
              setContextMenu({
                isOpen: true,
                x: state.startPoint.clientX,
                y: state.startPoint.clientY,
                shapeId: state.touchedShapeId,
              });
            }
          }, LONG_PRESS_DURATION);
        }
      } else if (touches.length === 2) {
        // Multi-touch (pinch/rotate)
        e.preventDefault();
        clearLongPressTimer();

        const t1 = touches[0];
        const t2 = touches[1];

        state.isMultiTouch = true;
        state.isDragging = false;
        state.startDistance = getTouchDistance(t1, t2);
        state.startAngle = getTouchAngle(t1, t2);
        state.startCenter = getTouchCenter(t1, t2);

        // Store start data for all selected shapes, or store viewport state for canvas zoom
        if (selectedShapes.length > 0) {
          state.startShapeData = new Map();
          selectedShapes.forEach((s) => {
            state.startShapeData!.set(s.id, {
              x: s.x,
              y: s.y,
              size: s.size,
              rotation: s.rotation,
            });
          });
        } else {
          // No shapes selected - prepare for canvas zoom/pan
          state.startShapeData = null;
          state.startZoom = viewport.zoom;
          state.startPanX = viewport.panX;
          state.startPanY = viewport.panY;
        }
      }
    },
    [
      contextMenu.isOpen,
      getTouchSVGPoint,
      findShapeAtPoint,
      selectedShapeIds,
      onSelectShape,
      clearLongPressTimer,
      getTouchDistance,
      getTouchAngle,
      getTouchCenter,
      selectedShapes,
      viewport.zoom,
      viewport.panX,
      viewport.panY,
    ]
  );

  // Handle touch move on canvas
  const handleCanvasTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touches = e.touches;
      const state = touchStateRef.current;

      if (touches.length === 1 && !state.isMultiTouch) {
        const touch = touches[0];
        const point = getTouchSVGPoint(touch);
        const startPoint = state.startPoint;

        if (startPoint) {
          const dx = point.x - startPoint.x;
          const dy = point.y - startPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > TAP_THRESHOLD) {
            state.hasMoved = true;
            clearLongPressTimer();
          }

          // If we have a touched shape and we're moving, drag it
          if (state.touchedShapeId && state.hasMoved && !state.isLongPress) {
            e.preventDefault();

            if (!state.isDragging) {
              state.isDragging = true;
            }

            // Move all selected shapes
            if (selectedShapeIds.has(state.touchedShapeId)) {
              const updates = new Map<string, Partial<Shape>>();
              const prevPoint = state.currentPoint || startPoint;
              const moveDx = point.x - prevPoint.x;
              const moveDy = point.y - prevPoint.y;

              selectedShapes.forEach((shape) => {
                updates.set(shape.id, {
                  x: shape.x + moveDx,
                  y: shape.y + moveDy,
                });
              });
              onUpdateShapes(updates);
            } else {
              // Single shape not in selection
              const shape = shapes.find((s) => s.id === state.touchedShapeId);
              if (shape) {
                const prevPoint = state.currentPoint || startPoint;
                onUpdateShape(state.touchedShapeId, {
                  x: shape.x + (point.x - prevPoint.x),
                  y: shape.y + (point.y - prevPoint.y),
                });
              }
            }
          } else if (!state.touchedShapeId && state.hasMoved) {
            // No shape touched - pan the canvas
            e.preventDefault();
            const clientPoint = getClientPoint(touch.clientX, touch.clientY);
            const startClientPoint = {
              x: ((startPoint.clientX - svgRef.current!.getBoundingClientRect().left) / svgRef.current!.getBoundingClientRect().width) * CANVAS_SIZE,
              y: ((startPoint.clientY - svgRef.current!.getBoundingClientRect().top) / svgRef.current!.getBoundingClientRect().height) * CANVAS_SIZE,
            };
            const panDx = clientPoint.x - startClientPoint.x;
            const panDy = clientPoint.y - startClientPoint.y;
            onPan(viewport.panX + panDx, viewport.panY + panDy);
            state.startPoint = { ...point, clientX: touch.clientX, clientY: touch.clientY };
          }
        }

        state.currentPoint = point;
      } else if (touches.length === 2 && state.isMultiTouch) {
        e.preventDefault();

        const t1 = touches[0];
        const t2 = touches[1];

        const currentDistance = getTouchDistance(t1, t2);
        const currentAngle = getTouchAngle(t1, t2);
        const currentCenter = getTouchCenter(t1, t2);

        // Calculate scale and rotation delta
        const scale = currentDistance / state.startDistance;
        const rotationDelta = ((currentAngle - state.startAngle) * 180) / Math.PI;

        // Apply transformations to selected shapes
        if (state.startShapeData && state.startShapeData.size > 0) {
          const updates = new Map<string, Partial<Shape>>();

          state.startShapeData.forEach((startData, id) => {
            const shape = shapes.find((s) => s.id === id);
            if (!shape) return;

            // Calculate new size
            const newSize = Math.max(20, startData.size * scale);

            // Calculate new position (scale around pinch center)
            const shapeCenterX = startData.x + startData.size / 2;
            const shapeCenterY = startData.y + startData.size / 2;

            // Vector from pinch center to shape center
            const relX = shapeCenterX - state.startCenter.x;
            const relY = shapeCenterY - state.startCenter.y;

            // Rotate this vector
            const angleRad = (rotationDelta * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const rotatedX = relX * cos - relY * sin;
            const rotatedY = relX * sin + relY * cos;

            // Scale and translate to new center
            const newCenterX = currentCenter.x + rotatedX * scale;
            const newCenterY = currentCenter.y + rotatedY * scale;

            // Convert center to top-left position
            const newX = newCenterX - newSize / 2;
            const newY = newCenterY - newSize / 2;

            // Calculate new rotation, accounting for flip
            const flipInverts = (shape.flipX ? 1 : 0) ^ (shape.flipY ? 1 : 0);
            const shapeRotationDelta = flipInverts ? -rotationDelta : rotationDelta;

            updates.set(id, {
              x: newX,
              y: newY,
              size: newSize,
              rotation: startData.rotation + shapeRotationDelta,
            });
          });

          onUpdateShapes(updates);
        } else {
          // No shapes selected - pinch to zoom canvas
          onSetZoomAtPoint(
            state.startZoom,
            scale,
            currentCenter.x,
            currentCenter.y,
            state.startPanX,
            state.startPanY
          );
        }
      }
    },
    [
      getTouchSVGPoint,
      clearLongPressTimer,
      selectedShapeIds,
      selectedShapes,
      shapes,
      onUpdateShape,
      onUpdateShapes,
      getClientPoint,
      viewport.panX,
      viewport.panY,
      onPan,
      onSetZoomAtPoint,
      getTouchDistance,
      getTouchAngle,
      getTouchCenter,
    ]
  );

  // Handle touch end on canvas
  const handleCanvasTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const state = touchStateRef.current;
      clearLongPressTimer();

      if (state.isMultiTouch) {
        // Multi-touch ended
        if (e.touches.length < 2) {
          state.isMultiTouch = false;
          state.startShapeData = null;

          // If one finger remains, reset for potential new single touch
          if (e.touches.length === 1) {
            const touch = e.touches[0];
            const point = getTouchSVGPoint(touch);
            state.startPoint = point;
            state.currentPoint = point;
            state.hasMoved = false;
          }
        }
      } else if (e.touches.length === 0) {
        // All touches ended
        if (!state.hasMoved && !state.isLongPress) {
          // It was a tap
          if (!state.touchedShapeId) {
            // Tap on empty canvas - deselect all
            onSelectShape(null);
          }
          // Tap on shape already handled in touchstart
        }

        // Reset state
        state.startPoint = null;
        state.currentPoint = null;
        state.touchedShapeId = null;
        state.isDragging = false;
        state.hasMoved = false;
        state.isLongPress = false;
      }
    },
    [clearLongPressTimer, getTouchSVGPoint, onSelectShape]
  );

  // Close context menu handler
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, x: 0, y: 0, shapeId: null });
  }, []);

  // Context menu action handlers
  const handleContextMenuDuplicate = useCallback(() => {
    if (selectedShapeIds.size > 0) {
      onDuplicateShapes(Array.from(selectedShapeIds));
    }
  }, [selectedShapeIds, onDuplicateShapes]);

  const handleContextMenuDelete = useCallback(() => {
    onDeleteSelectedShapes();
  }, [onDeleteSelectedShapes]);

  const handleContextMenuMirrorH = useCallback(() => {
    if (selectedShapeIds.size > 0) {
      onMirrorHorizontal(Array.from(selectedShapeIds));
    }
  }, [selectedShapeIds, onMirrorHorizontal]);

  const handleContextMenuMirrorV = useCallback(() => {
    if (selectedShapeIds.size > 0) {
      onMirrorVertical(Array.from(selectedShapeIds));
    }
  }, [selectedShapeIds, onMirrorVertical]);

  const handleContextMenuBringToFront = useCallback(() => {
    if (contextMenu.shapeId && onMoveLayer) {
      onMoveLayer(contextMenu.shapeId, 'front');
    }
  }, [contextMenu.shapeId, onMoveLayer]);

  const handleContextMenuSendToBack = useCallback(() => {
    if (contextMenu.shapeId && onMoveLayer) {
      onMoveLayer(contextMenu.shapeId, 'back');
    }
  }, [contextMenu.shapeId, onMoveLayer]);

  // Sort shapes by zIndex for rendering
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

  // Calculate viewBox based on zoom and pan
  const viewBoxSize = CANVAS_SIZE / viewport.zoom;
  const viewBoxX = -viewport.panX / viewport.zoom;
  const viewBoxY = -viewport.panY / viewport.zoom;

  // Cursor style based on panning state
  const cursorStyle = isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default';

  return (
    <>
    <svg
      ref={svgRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxSize} ${viewBoxSize}`}
      className="border touch-none"
      style={{
        overflow: 'visible',
        cursor: cursorStyle,
        borderColor: 'var(--color-border)',
      }}
      onMouseDown={handleCanvasMouseDown}
      onTouchStart={handleCanvasTouchStart}
      onTouchMove={handleCanvasTouchMove}
      onTouchEnd={handleCanvasTouchEnd}
      onTouchCancel={handleCanvasTouchEnd}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Clip rect for the canvas content (shapes) */}
      <defs>
        <clipPath id="canvas-clip">
          <rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} />
        </clipPath>
      </defs>

      {/* Canvas background rect (for when zoomed out) */}
      <rect
        x={0}
        y={0}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        fill={backgroundColor || '#ffffff'}
        onMouseDown={() => !isSpacePressed && onSelectShape(null)}
      />

      {/* Render shapes clipped to canvas bounds */}
      <g clipPath="url(#canvas-clip)">
        {sortedShapes.map((shape) => (
          <g key={shape.id}>
            <g onMouseDown={(e) => !isSpacePressed && handleShapeMouseDown(e, shape.id)}>
              <ShapeElement
                shape={shape}
                color={challenge.colors[shape.colorIndex]}
                isSelected={selectedShapeIds.has(shape.id)}
              />
            </g>
          </g>
        ))}
      </g>

      {/* Interaction layers - outside clip path for better hit detection */}
      {!isSpacePressed && sortedShapes.map((shape) => (
        <g key={`interaction-${shape.id}`}>
          {/* Render invisible interaction layer for single-selected shape */}
          {hasSingleSelection && selectedShapeIds.has(shape.id) && (
            <TransformInteractionLayer
              shape={shape}
              zoom={viewport.zoom}
              onMoveStart={handleMoveStart}
              onResizeStart={handleResizeStart}
              onRotateStart={handleRotateStart}
            />
          )}
        </g>
      ))}

      {/* Render visible transform UI on top of everything - outside clip path */}
      {hasSingleSelection && singleSelectedShape && (
        <MultiSelectTransformLayer
          shapes={[singleSelectedShape]}
          bounds={selectionBounds!}
          zoom={viewport.zoom}
          showIndividualOutlines={true}
        />
      )}

      {/* Multi-select: interaction layer + visual layer */}
      {selectedShapes.length > 1 && selectionBounds && (
        <>
          {!isSpacePressed && (
            <MultiSelectInteractionLayer
              bounds={selectionBounds}
              zoom={viewport.zoom}
              onResizeStart={handleMultiResizeStart}
              onRotateStart={handleMultiRotateStart}
            />
          )}
          <MultiSelectTransformLayer
            shapes={selectedShapes}
            bounds={selectionBounds}
            zoom={viewport.zoom}
            showIndividualOutlines={true}
          />
        </>
      )}
    </svg>

    {/* Touch context menu */}
    {contextMenu.isOpen && (
      <TouchContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={handleCloseContextMenu}
        onDuplicate={handleContextMenuDuplicate}
        onDelete={handleContextMenuDelete}
        onMirrorHorizontal={handleContextMenuMirrorH}
        onMirrorVertical={handleContextMenuMirrorV}
        onBringToFront={handleContextMenuBringToFront}
        onSendToBack={handleContextMenuSendToBack}
      />
    )}
    </>
  );
}
