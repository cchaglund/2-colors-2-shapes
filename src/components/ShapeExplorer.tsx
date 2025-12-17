import type { ShapeType } from '../types';
import { getShapeSVGData, SHAPE_NAMES } from '../utils/shapeHelpers';

const SHAPE_TYPES: ShapeType[] = [
  'circle',
  'square',
  'triangle',
  'pentagon',
  'hexagon',
  'star',
  // Sophisticated shapes
  'rightTriangle',
  'isoscelesTriangle',
  'diamond',
  'trapezoid',
  'parallelogram',
  'kite',
  'heptagon',
  'cross',
  'arrow',
  'semicircle',
  'quarterCircle',
  'ellipse',
  'blade',
  'lens',
  'arch',
  'drop',
  // Irregular abstract shapes
  'shard',
  'wedge',
  'fan',
  'hook',
  'wave',
  'crescent',
  'pill',
  'splinter',
  'chunk',
  // Mixed straight/curved shapes
  'fang',
  'claw',
  'fin',
  'thorn',
  'slant',
  'notch',
  'spike',
  'bulge',
  'scoop',
  'ridge',
];
const SAMPLE_SIZE = 100;

interface ShapePreviewProps {
  type: ShapeType;
  size: number;
}

function ShapePreview({ type, size }: ShapePreviewProps) {
  const { element, props } = getShapeSVGData(type, size);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {element === 'ellipse' && <ellipse {...props} fill="#000" />}
      {element === 'rect' && <rect {...props} fill="#000" />}
      {element === 'polygon' && <polygon {...props} fill="#000" />}
      {element === 'path' && <path {...props} fill="#000" />}
    </svg>
  );
}

export function ShapeExplorer() {
  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Shape Explorer
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Developer tool showing all available shape types. Access via{' '}
            <code
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              ?explorer
            </code>{' '}
            URL parameter or{' '}
            <code
              className="px-2 py-1 rounded text-xs"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              VITE_SHAPE_EXPLORER=true
            </code>{' '}
            environment variable.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {SHAPE_TYPES.map((type) => (
            <div
              key={type}
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {SHAPE_NAMES[type]}
                </h2>

                <div
                  className="p-3 rounded"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <ShapePreview type={type} size={SAMPLE_SIZE} />
                </div>

                <div className="text-center">
                  <code
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    type: '{type}'
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer
          className="mt-8 pt-6 border-t text-center text-sm"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          <p>
            Total shapes available: <strong>{SHAPE_TYPES.length}</strong>
          </p>
          <p className="mt-2">
            <a
              href="/"
              className="underline hover:no-underline"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Return to main app
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
