import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// Types
// =============================================================================

type ShapeType =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'rightTriangle'
  | 'isoscelesTriangle'
  | 'diamond'
  | 'trapezoid'
  | 'parallelogram'
  | 'kite'
  | 'heptagon'
  | 'cross'
  | 'arrow'
  | 'semicircle'
  | 'quarterCircle'
  | 'ellipse'
  | 'blade'
  | 'lens'
  | 'arch'
  | 'drop'
  | 'shard'
  | 'wedge'
  | 'fan'
  | 'hook'
  | 'wave'
  | 'crescent'
  | 'pill'
  | 'splinter'
  | 'chunk'
  | 'fang'
  | 'claw'
  | 'fin'
  | 'thorn'
  | 'slant'
  | 'notch'
  | 'spike'
  | 'bulge'
  | 'scoop'
  | 'ridge';

interface ShapeData {
  type: ShapeType;
  name: string;
  svg: string;
}

interface DailyChallenge {
  date: string;
  colors: [string, string];
  shapes: [ShapeData, ShapeData];
}

interface ChallengeRow {
  id: string;
  challenge_date: string;
  color_1: string;
  color_2: string;
  shape_1: string;
  shape_2: string;
  shape_1_svg: string | null;
  shape_2_svg: string | null;
  shape_1_name: string | null;
  shape_2_name: string | null;
  created_at: string;
}

// =============================================================================
// Shape Data
// =============================================================================

const SHAPE_NAMES: Record<ShapeType, string> = {
  circle: 'Circle',
  square: 'Square',
  triangle: 'Triangle',
  pentagon: 'Pentagon',
  hexagon: 'Hexagon',
  star: 'Star',
  rightTriangle: 'Right Triangle',
  isoscelesTriangle: 'Isosceles Triangle',
  diamond: 'Diamond',
  trapezoid: 'Trapezoid',
  parallelogram: 'Parallelogram',
  kite: 'Kite',
  heptagon: 'Heptagon',
  cross: 'Cross',
  arrow: 'Arrow',
  semicircle: 'Semicircle',
  quarterCircle: 'Quarter Circle',
  ellipse: 'Ellipse',
  blade: 'Blade',
  lens: 'Lens',
  arch: 'Arch',
  drop: 'Drop',
  shard: 'Shard',
  wedge: 'Wedge',
  fan: 'Fan',
  hook: 'Hook',
  wave: 'Wave',
  crescent: 'Crescent',
  pill: 'Pill',
  splinter: 'Splinter',
  chunk: 'Chunk',
  fang: 'Fang',
  claw: 'Claw',
  fin: 'Fin',
  thorn: 'Thorn',
  slant: 'Slant',
  notch: 'Notch',
  spike: 'Spike',
  bulge: 'Bulge',
  scoop: 'Scoop',
  ridge: 'Ridge',
};

const ALL_SHAPES: ShapeType[] = Object.keys(SHAPE_NAMES) as ShapeType[];

// =============================================================================
// SVG Path Generation (normalized to 100x100 viewBox)
// =============================================================================

function getPolygonPoints(sides: number, offsetAngle: number = 0): string {
  const points: string[] = [];
  const angleStep = (2 * Math.PI) / sides;
  const radius = 50;
  const center = 50;

  for (let i = 0; i < sides; i++) {
    const angle = angleStep * i + offsetAngle - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return points.join(' ');
}

function polygonToPath(points: string): string {
  const coords = points.split(' ').map(p => p.split(',').map(Number));
  if (coords.length === 0) return '';
  const [first, ...rest] = coords;
  return `M ${first[0]},${first[1]} ${rest.map(([x, y]) => `L ${x},${y}`).join(' ')} Z`;
}

function getShapeSVG(type: ShapeType): string {
  const size = 100;
  const half = size / 2;

  switch (type) {
    case 'circle':
      return `M ${half},0 A ${half},${half} 0 1 1 ${half},${size} A ${half},${half} 0 1 1 ${half},0 Z`;
    case 'square':
      return `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`;
    case 'triangle':
      return polygonToPath(getPolygonPoints(3));
    case 'pentagon':
      return polygonToPath(getPolygonPoints(5));
    case 'hexagon':
      return polygonToPath(getPolygonPoints(6));
    case 'heptagon':
      return polygonToPath(getPolygonPoints(7));
    case 'star': {
      const coords: string[] = [];
      const outerRadius = 50;
      const innerRadius = outerRadius * 0.4;
      const points = 5;
      const angleStep = Math.PI / points;
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = angleStep * i - Math.PI / 2;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        coords.push(`${x},${y}`);
      }
      return polygonToPath(coords.join(' '));
    }
    case 'rightTriangle':
      return `M 0,${size} L ${size},${size} L 0,0 Z`;
    case 'isoscelesTriangle':
      return `M ${half},0 L ${size},${size} L 0,${size} Z`;
    case 'diamond':
      return `M ${half},0 L ${size},${half} L ${half},${size} L 0,${half} Z`;
    case 'trapezoid': {
      const inset = size * 0.2;
      return `M ${inset},0 L ${size - inset},0 L ${size},${size} L 0,${size} Z`;
    }
    case 'parallelogram': {
      const skew = size * 0.25;
      return `M ${skew},0 L ${size},0 L ${size - skew},${size} L 0,${size} Z`;
    }
    case 'kite': {
      const widthOffset = size * 0.35;
      const topHeight = size * 0.3;
      return `M ${half},0 L ${half + widthOffset},${topHeight} L ${half},${size} L ${half - widthOffset},${topHeight} Z`;
    }
    case 'cross': {
      const armWidth = size / 3;
      const inner1 = armWidth;
      const inner2 = armWidth * 2;
      return `M ${inner1},0 L ${inner2},0 L ${inner2},${inner1} L ${size},${inner1} L ${size},${inner2} L ${inner2},${inner2} L ${inner2},${size} L ${inner1},${size} L ${inner1},${inner2} L 0,${inner2} L 0,${inner1} L ${inner1},${inner1} Z`;
    }
    case 'arrow': {
      const shaftWidth = size * 0.35;
      const headStart = size * 0.5;
      const centerY = half;
      const halfShaft = shaftWidth / 2;
      return `M 0,${centerY - halfShaft} L ${headStart},${centerY - halfShaft} L ${headStart},0 L ${size},${centerY} L ${headStart},${size} L ${headStart},${centerY + halfShaft} L 0,${centerY + halfShaft} Z`;
    }
    case 'semicircle':
      return `M 0,${size} A ${half},${half} 0 0 1 ${size},${size} L 0,${size} Z`;
    case 'quarterCircle':
      return `M 0,0 L ${size},0 A ${size},${size} 0 0 1 0,${size} L 0,0 Z`;
    case 'ellipse':
      return `M ${half},${half - size/3} A ${half},${size/3} 0 1 1 ${half},${half + size/3} A ${half},${size/3} 0 1 1 ${half},${half - size/3} Z`;
    case 'blade': {
      const controlOffset = size * 0.5;
      return `M ${half},0 Q ${size + controlOffset * 0.5},${size * 0.35} ${half},${size} Q ${-controlOffset * 0.5},${size * 0.65} ${half},0 Z`;
    }
    case 'lens': {
      const radius = size * 0.7;
      return `M 0,${half} A ${radius},${radius} 0 0 1 ${size},${half} A ${radius},${radius} 0 0 1 0,${half} Z`;
    }
    case 'arch': {
      const archWidth = size * 0.3;
      const innerWidth = size - archWidth * 2;
      const innerRadius = innerWidth / 2;
      const outerRadius = half;
      return `M 0,${size} L 0,${size * 0.4} A ${outerRadius},${outerRadius} 0 0 1 ${size},${size * 0.4} L ${size},${size} L ${size - archWidth},${size} L ${size - archWidth},${size * 0.4 + archWidth * 0.5} A ${innerRadius},${innerRadius} 0 0 0 ${archWidth},${size * 0.4 + archWidth * 0.5} L ${archWidth},${size} Z`;
    }
    case 'drop':
      return `M ${half},0 C ${size * 0.9},${size * 0.4} ${size * 0.9},${size * 0.7} ${half},${size} C ${size * 0.1},${size * 0.7} ${size * 0.1},${size * 0.4} ${half},0 Z`;
    case 'shard':
      return polygonToPath(`${size * 0.2},0 ${size * 0.9},${size * 0.15} ${size},${size * 0.6} ${half},${size} 0,${size * 0.7} ${size * 0.1},${size * 0.3}`);
    case 'wedge':
      return polygonToPath(`${half},0 ${size},${size * 0.3} ${size * 0.8},${size} ${size * 0.2},${size} 0,${half}`);
    case 'fan':
      return `M ${size * 0.1},${size} Q ${size * 0.1},${half} ${half},${size * 0.1} L ${size},0 Q ${size * 0.6},${size * 0.4} ${size * 0.9},${size} Z`;
    case 'hook':
      return `M ${size * 0.3},0 L ${half},0 Q ${size},0 ${size},${size * 0.4} Q ${size},${size * 0.7} ${size * 0.6},${size * 0.7} L ${size * 0.6},${size} L ${size * 0.3},${size} L ${size * 0.3},${half} Q ${size * 0.3},${size * 0.2} ${size * 0.6},${size * 0.2} Q ${size * 0.75},${size * 0.2} ${size * 0.75},${size * 0.4} Q ${size * 0.75},${half} ${size * 0.6},${half} L ${size * 0.3},${half} Z`;
    case 'wave':
      return `M 0,${half} Q ${size * 0.25},${size * 0.2} ${half},${half} Q ${size * 0.75},${size * 0.8} ${size},${half} L ${size},${size * 0.8} Q ${size * 0.75},${size} ${half},${size * 0.8} Q ${size * 0.25},${size * 0.6} 0,${size * 0.8} Z`;
    case 'crescent': {
      const r = size * 0.4;
      const cy = half;
      const top = cy - r;
      const bottom = cy + r;
      const leftX = size * 0.3;
      const rightX = half;
      return `M ${half},${top} Q ${leftX - r * 0.8},${cy} ${half},${bottom} Q ${rightX + r * 0.3},${cy} ${half},${top} Z`;
    }
    case 'pill': {
      const r = size * 0.2;
      return `M ${r},0 L ${size - r},0 A ${r},${r} 0 0 1 ${size - r},${r * 2} L ${r},${r * 2} A ${r},${r} 0 0 1 ${r},0 Z`;
    }
    case 'splinter':
      return polygonToPath(`${size * 0.4},0 ${size * 0.6},0 ${size * 0.8},${size * 0.3} ${size},${size} ${size * 0.7},${size * 0.6} ${size * 0.3},${size * 0.8} 0,${size * 0.4}`);
    case 'chunk':
      return polygonToPath(`${size * 0.1},${size * 0.1} ${size * 0.6},0 ${size},${size * 0.2} ${size * 0.9},${size * 0.7} ${size * 0.6},${size} ${size * 0.2},${size * 0.9} 0,${half}`);
    case 'fang':
      return `M ${size * 0.3},0 L ${size * 0.7},0 L ${half},${size} Q ${size * 0.2},${size * 0.6} ${size * 0.3},0 Z`;
    case 'claw':
      return `M ${size * 0.2},${size} L ${half},${size} L ${size * 0.6},${size * 0.7} Q ${size * 0.9},${size * 0.3} ${half},0 Q ${size * 0.3},${size * 0.2} ${size * 0.35},${half} L ${size * 0.2},${size} Z`;
    case 'fin':
      return `M 0,${size} L ${size * 0.3},${size * 0.7} L ${size * 0.2},${size * 0.2} L ${size * 0.8},0 Q ${size},${size * 0.4} ${size * 0.7},${size} Z`;
    case 'thorn':
      return `M ${half},0 Q ${size * 0.8},${size * 0.3} ${size * 0.7},${size * 0.6} L ${size * 0.9},${size} L ${size * 0.1},${size} L ${size * 0.3},${size * 0.6} Q ${size * 0.2},${size * 0.3} ${half},0 Z`;
    case 'slant':
      return `M ${size * 0.3},0 L ${size},0 L ${size * 0.7},${size} L 0,${size} Q ${size * 0.1},${half} ${size * 0.3},0 Z`;
    case 'notch':
      return `M 0,0 L ${size},0 L ${size},${size * 0.6} Q ${half},${size * 0.4} 0,${size * 0.6} L 0,0 Z`;
    case 'spike':
      return `M ${half},0 L ${size * 0.7},${size * 0.6} Q ${size * 0.8},${size} ${half},${size} Q ${size * 0.2},${size} ${size * 0.3},${size * 0.6} L ${half},0 Z`;
    case 'bulge':
      return `M ${size * 0.2},0 L ${size * 0.8},0 L ${size},${size * 0.3} Q ${size * 0.9},${size * 0.7} ${size * 0.7},${size} L ${size * 0.3},${size} Q ${size * 0.1},${size * 0.7} 0,${size * 0.3} L ${size * 0.2},0 Z`;
    case 'scoop':
      return `M 0,${size * 0.2} L ${size * 0.3},0 L ${size * 0.7},0 L ${size},${size * 0.2} L ${size * 0.9},${half} Q ${half},${size * 1.1} ${size * 0.1},${half} L 0,${size * 0.2} Z`;
    case 'ridge':
      return `M 0,${size * 0.4} L ${size * 0.25},${size * 0.1} L ${half},${size * 0.3} L ${size * 0.75},${size * 0.1} L ${size},${size * 0.4} Q ${size * 0.8},${size} ${half},${size} Q ${size * 0.2},${size} 0,${size * 0.4} Z`;
    default:
      return `M 0,0 L ${size},0 L ${size},${size} L 0,${size} Z`;
  }
}

function createShapeData(type: ShapeType): ShapeData {
  return {
    type,
    name: SHAPE_NAMES[type],
    svg: getShapeSVG(type),
  };
}

// =============================================================================
// Random Generation Utilities
// =============================================================================

function seededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateColor(random: () => number): string {
  const hue = Math.floor(random() * 360);
  const saturation = 50 + Math.floor(random() * 40);
  const lightness = 35 + Math.floor(random() * 35);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function colorDistance(color1: string, color2: string): number {
  const parseHSL = (hsl: string) => {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return { h: 0, s: 0, l: 0 };
    return {
      h: parseInt(match[1]),
      s: parseInt(match[2]),
      l: parseInt(match[3]),
    };
  };

  const c1 = parseHSL(color1);
  const c2 = parseHSL(color2);

  let hueDiff = Math.abs(c1.h - c2.h);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;

  return Math.sqrt(
    Math.pow(hueDiff * 2, 2) +
    Math.pow((c1.l - c2.l) * 1.5, 2) +
    Math.pow((c1.s - c2.s) * 0.5, 2)
  );
}

function generateDistinctColors(random: () => number): [string, string] {
  const minDistance = 80;
  let attempts = 0;

  while (attempts < 100) {
    const color1 = generateColor(random);
    const color2 = generateColor(random);
    if (colorDistance(color1, color2) >= minDistance) {
      return [color1, color2];
    }
    attempts++;
  }

  const hue = Math.floor(random() * 360);
  const sat = 60 + Math.floor(random() * 30);
  return [`hsl(${hue}, ${sat}%, 45%)`, `hsl(${(hue + 180) % 360}, ${sat}%, 55%)`];
}

function generateShapes(random: () => number): [ShapeType, ShapeType] {
  const shuffled = [...ALL_SHAPES].sort(() => random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

// =============================================================================
// Smart Randomness - Avoid repeating recent challenges
// =============================================================================

interface PreviousChallenge {
  shapes: [ShapeType, ShapeType];
  colors: [string, string];
}

function haveSameShapes(
  shapes1: [ShapeType, ShapeType],
  shapes2: [ShapeType, ShapeType]
): boolean {
  const set1 = new Set(shapes1);
  const set2 = new Set(shapes2);
  return shapes1.every((s) => set2.has(s)) && shapes2.every((s) => set1.has(s));
}

function areSimilarColors(color1: string, color2: string): boolean {
  return colorDistance(color1, color2) < 40;
}

function haveSimilarColors(
  colors1: [string, string],
  colors2: [string, string]
): boolean {
  const match1 = areSimilarColors(colors1[0], colors2[0]) && areSimilarColors(colors1[1], colors2[1]);
  const match2 = areSimilarColors(colors1[0], colors2[1]) && areSimilarColors(colors1[1], colors2[0]);
  return match1 || match2;
}

function isTooSimilarToAny(
  candidate: { shapes: [ShapeType, ShapeType]; colors: [string, string] },
  previousChallenges: PreviousChallenge[]
): boolean {
  for (const prev of previousChallenges) {
    if (haveSameShapes(candidate.shapes, prev.shapes) && haveSimilarColors(candidate.colors, prev.colors)) {
      return true;
    }
  }
  return false;
}

function generateChallengeWithSmartRandomness(
  dateStr: string,
  previousChallenges: PreviousChallenge[]
): DailyChallenge {
  const baseSeed = dateToSeed(dateStr);

  for (let attempt = 0; attempt < 50; attempt++) {
    const random = seededRandom(baseSeed + attempt * 1000003);
    const colors = generateDistinctColors(random);
    const shapes = generateShapes(random);

    if (!isTooSimilarToAny({ shapes, colors }, previousChallenges)) {
      return {
        date: dateStr,
        colors,
        shapes: [createShapeData(shapes[0]), createShapeData(shapes[1])],
      };
    }
  }

  // Fallback - use first attempt
  const random = seededRandom(baseSeed);
  const colors = generateDistinctColors(random);
  const shapes = generateShapes(random);
  return {
    date: dateStr,
    colors,
    shapes: [createShapeData(shapes[0]), createShapeData(shapes[1])],
  };
}

// =============================================================================
// Database Helpers
// =============================================================================

function getDateBefore(dateStr: string, daysBefore: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return d.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function rowToChallenge(row: ChallengeRow): DailyChallenge {
  const shape1Type = row.shape_1 as ShapeType;
  const shape2Type = row.shape_2 as ShapeType;

  return {
    date: row.challenge_date,
    colors: [row.color_1, row.color_2],
    shapes: [
      {
        type: shape1Type,
        name: row.shape_1_name || SHAPE_NAMES[shape1Type],
        svg: row.shape_1_svg || getShapeSVG(shape1Type),
      },
      {
        type: shape2Type,
        name: row.shape_2_name || SHAPE_NAMES[shape2Type],
        svg: row.shape_2_svg || getShapeSVG(shape2Type),
      },
    ],
  };
}

function rowToPreviousChallenge(row: ChallengeRow): PreviousChallenge {
  return {
    shapes: [row.shape_1 as ShapeType, row.shape_2 as ShapeType],
    colors: [row.color_1, row.color_2],
  };
}

// =============================================================================
// Main Logic
// =============================================================================

async function fetchOrCreateChallenge(
  supabase: ReturnType<typeof createClient>,
  date: string
): Promise<DailyChallenge> {
  const today = getTodayDate();

  // Don't create challenges for future dates
  if (date > today) {
    throw new Error(`Cannot create challenge for future date: ${date}`);
  }

  // 1. Check if challenge already exists
  const { data: existing } = await supabase
    .from('challenges')
    .select('*')
    .eq('challenge_date', date)
    .single();

  if (existing) {
    return rowToChallenge(existing as ChallengeRow);
  }

  // 2. Fetch previous 3 days from DB (whatever exists)
  const previousDates = [1, 2, 3].map((i) => getDateBefore(date, i));
  const { data: previousRows } = await supabase
    .from('challenges')
    .select('*')
    .in('challenge_date', previousDates);

  const previousChallenges: PreviousChallenge[] = (previousRows || []).map(
    (row: ChallengeRow) => rowToPreviousChallenge(row)
  );

  // 3. Generate challenge avoiding similar recent ones
  const challenge = generateChallengeWithSmartRandomness(date, previousChallenges);

  // 4. Save to database
  const { error: insertError } = await supabase
    .from('challenges')
    .upsert(
      {
        challenge_date: challenge.date,
        color_1: challenge.colors[0],
        color_2: challenge.colors[1],
        shape_1: challenge.shapes[0].type,
        shape_2: challenge.shapes[1].type,
        shape_1_svg: challenge.shapes[0].svg,
        shape_2_svg: challenge.shapes[1].svg,
        shape_1_name: challenge.shapes[0].name,
        shape_2_name: challenge.shapes[1].name,
      },
      { onConflict: 'challenge_date', ignoreDuplicates: true }
    );

  // Race condition - fetch the winner
  if (insertError) {
    const { data: winner } = await supabase
      .from('challenges')
      .select('*')
      .eq('challenge_date', date)
      .single();

    if (winner) {
      return rowToChallenge(winner as ChallengeRow);
    }
  }

  return challenge;
}

// Read-only batch fetch - does NOT create missing challenges
// Used by Calendar to show historical data
async function fetchExistingChallenges(
  supabase: ReturnType<typeof createClient>,
  dates: string[]
): Promise<DailyChallenge[]> {
  if (dates.length === 0) {
    return [];
  }

  // Just fetch what exists - don't create anything
  const { data: existing } = await supabase
    .from('challenges')
    .select('*')
    .in('challenge_date', dates);

  return ((existing as ChallengeRow[]) || []).map((row) => rowToChallenge(row));
}

// =============================================================================
// Edge Function Handler
// =============================================================================

interface ChallengeRequest {
  date?: string;
  dates?: string[];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let requestData: ChallengeRequest = {};
    if (req.method === 'POST') {
      requestData = await req.json();
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      const date = url.searchParams.get('date');
      const dates = url.searchParams.get('dates');
      if (date) requestData.date = date;
      if (dates) requestData.dates = dates.split(',');
    }

    // Batch request
    if (requestData.dates && requestData.dates.length > 0) {
      for (const date of requestData.dates) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return new Response(
            JSON.stringify({ error: `Invalid date format: ${date}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const challenges = await fetchExistingChallenges(supabaseAdmin, requestData.dates);
      return new Response(JSON.stringify({ challenges }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single date request
    const targetDate = requestData.date || getTodayDate();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return new Response(JSON.stringify({ error: 'Invalid date format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const challenge = await fetchOrCreateChallenge(supabaseAdmin, targetDate);

    return new Response(JSON.stringify(challenge), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
