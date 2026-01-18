import type { DailyChallenge, ShapeType, ChallengeShapeData } from '../types';
import { getShapeSVGData, SHAPE_NAMES } from './shapeHelpers';

// =============================================================================
// Daily Word Data
// =============================================================================

// Pre-shuffled order array (365 indices for each day of the year)
const WORDS_ORDER = [129,287,332,123,25,208,347,43,156,234,138,2,169,198,292,204,169,113,120,352,19,55,280,179,158,239,329,156,316,359,195,300,82,284,345,185,232,251,324,291,152,282,211,20,305,280,191,170,84,222,297,174,11,41,59,319,259,39,335,96,310,60,81,163,222,63,168,33,150,126,169,17,320,297,46,294,351,54,216,361,48,44,272,331,115,233,260,263,176,56,350,109,337,285,119,289,32,222,203,57,54,22,144,65,69,316,73,251,131,12,172,232,133,281,141,66,219,263,355,40,134,347,92,121,300,92,110,175,121,65,307,213,223,58,343,360,304,18,216,156,188,335,41,237,18,352,346,62,353,121,116,2,338,243,169,200,109,184,120,151,23,192,181,23,199,306,200,329,219,59,44,281,19,169,258,162,322,267,144,183,321,318,129,331,139,328,290,33,358,6,44,258,350,241,285,260,81,296,223,35,9,148,155,332,321,204,314,19,95,330,356,17,39,16,30,286,68,6,23,253,118,210,144,90,315,199,294,142,126,321,236,133,240,70,333,271,339,317,347,349,267,36,53,308,345,88,287,65,256,324,215,193,94,329,341,188,1,278,239,264,280,303,40,48,198,188,167,302,25,94,248,288,230,148,223,103,291,251,11,295,79,221,336,224,23,288,152,82,251,3,44,328,169,123,32,266,175,9,166,22,343,57,117,153,85,309,25,55,296,168,282,212,269,284,344,224,210,323,60,162,326,317,162,315,45,230,160,300,216,232,216,270,271,139,129,159,53,76,312,270,209,246,204,163,22,118,103,319,337,305,122,269,8,36,233,143,205,99,318,43,257,297,131,13,242];

// Word list (indexed by WORDS_ORDER)
const WORDS_LIST = ["society","stillness","loose","life","rest","faint","right","formula","sick","poetic","wholesome","operation","power","long","reliable","exercise","compulsory","mold","form","hazy","command","spaceship","bent","physique","wakeful","credit","hard","complete","compulsion","motion","cloudy","question","beginning","stalemate","grade","one","submission","cognition","passive","breakdown","eternity","sensible","frozen","blow","hand","royalty","darkness","stifle","sympathy","clock","confusion","flavour","share","sympathy","anatomy","sour","disarray","elevator","alight","easy","renewable","closure","food","motivation","dimension","shadowy","microchip","dreary","run","extract","commotion","grim","nutshell","bedtime","cryptic","wise","airy","cosmos","hush","smother","watchful","scene","respectful","call","temporal","phase","sky","voice","drama","turbulence","extinct","start","bill","healthy","march","disorder","formal","ablaze","sanity","affection","detachment","debate","taste","identity","reshaping","density","violence","relief","midpoint","storage","hypocrite","importance","fairness","feathery","lift","resort","melancholy","arena","goal","frenzy","content","generation","class","way","rate","richness","counteract","randomness","quietly","timeline","solid","luminance","road","impasse","implosion","stealth","ignite","slick","circuit","scope","terrible","stasis","forcibly","rule","force","astro","deep","build","stagnance","juncture","stark","optimism","sad","plan","creepy","murmur","robust","enforce","structure","proportion","fibre","duration","careful","redaction","roundness","idle","read","disruption","jamming","substance","efficient","arcane","evil","vista","digest","interval","fashion","fair","seat","stir","wisdom","heart","minutes","gridlock","deafening","perfect","morph","tank","whisper","bid","motorcycle","present","temper","unnatural","dependable","trend","supply","period","valuable","soft","conduct","arch","blind","motionless","history","gesture","showtime","jazz","box","fuel","remnant","emptiness","outer","overview","dim","steady","illuminate","bring","within","newsletter","script","zip","electrical","side","skin","sturdy","frame","posture","dismount","relax","air","self","speak","collection","shuttle","lifetime","isolation","noise","touch","shift","help","mood","spooky","volume","point","chatter","walk","secrecy","oil","geometry","tissue","footprint","portrait","special","equation","potential","fear","limit","happy","value","age","clean","concrete","gravity","evening","courage","nutrition","gap","electric","sand","film","digit","void","fabric","brief","masses","serial","silent","window","wedge","magnetism","hammer","health","carpet","freeze","after","shady","earth","travel","clear","person","land","perfection","epoch","plane","existence","week","disorder","crisis","status","wilderness","segment","floor","fiasco","curvature","sense","channels","region","pull","prepare","flimsy","logic","muscle","moody","tongue","connection","might","zone","surface","fold","wild","expression","mix","spark","world","gag","project","stamina","clip","sink","weather","dominance","turn","shock","grain","tough","contour","fall","concealed","priority","hook","satellite","round","storm","forge","discussion","second","powerful","serenity","figure","height","madness","time","soul","cloud","distance","momentum","excitement","blur","perception","drive","squeeze","shut","blurry","friendly","swing"];

// =============================================================================
// Shape Data Helpers
// =============================================================================

function createShapeData(type: ShapeType): ChallengeShapeData {
  const svgData = getShapeSVGData(type, 100);
  let svg: string;

  if (svgData.element === 'path') {
    svg = svgData.props.d as string;
  } else if (svgData.element === 'polygon') {
    const points = (svgData.props.points as string).split(' ').map(p => p.split(',').map(Number));
    const [first, ...rest] = points;
    svg = `M ${first[0]},${first[1]} ${rest.map(([x, y]) => `L ${x},${y}`).join(' ')} Z`;
  } else if (svgData.element === 'rect') {
    const { x, y, width, height } = svgData.props as { x: number; y: number; width: number; height: number };
    svg = `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`;
  } else if (svgData.element === 'ellipse') {
    const { cx, cy, rx, ry } = svgData.props as { cx: number; cy: number; rx: number; ry: number };
    svg = `M ${cx},${cy - ry} A ${rx},${ry} 0 1 1 ${cx},${cy + ry} A ${rx},${ry} 0 1 1 ${cx},${cy - ry} Z`;
  } else {
    svg = 'M 0,0 L 100,0 L 100,100 L 0,100 Z';
  }

  return { type, name: SHAPE_NAMES[type], svg };
}

// =============================================================================
// Random Generation
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

function parseHSL(hsl: string): { h: number; s: number; l: number } {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return { h: 0, s: 0, l: 0 };
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3]),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const c1 = parseHSL(color1);
  const c2 = parseHSL(color2);
  const rgb1 = hslToRgb(c1.h, c1.s, c1.l);
  const rgb2 = hslToRgb(c2.h, c2.s, c2.l);
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function colorDistance(color1: string, color2: string): number {
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
  const minContrastRatio = 3.0; // WCAG AA for large graphical objects
  const minHueDiff = 30; // Ensure colors look distinctly different

  for (let i = 0; i < 100; i++) {
    const color1 = generateColor(random);
    const color2 = generateColor(random);

    // Check perceptual distance
    if (colorDistance(color1, color2) < minDistance) continue;

    // Check WCAG contrast ratio
    if (getContrastRatio(color1, color2) < minContrastRatio) continue;

    // Check hue difference to avoid colors that look too similar
    const c1 = parseHSL(color1);
    const c2 = parseHSL(color2);
    let hueDiff = Math.abs(c1.h - c2.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;
    if (hueDiff < minHueDiff) continue;

    return [color1, color2];
  }

  // Fallback: generate complementary colors with good contrast
  const hue = Math.floor(random() * 360);
  const sat = 60 + Math.floor(random() * 30);
  // Use significantly different lightness values to ensure contrast
  return [`hsl(${hue}, ${sat}%, 35%)`, `hsl(${(hue + 180) % 360}, ${sat}%, 65%)`];
}

const ALL_SHAPES: ShapeType[] = [
  'circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star',
  'rightTriangle', 'isoscelesTriangle', 'diamond', 'trapezoid',
  'parallelogram', 'kite', 'heptagon', 'cross', 'arrow',
  'semicircle', 'quarterCircle', 'ellipse', 'blade', 'lens',
  'arch', 'drop', 'shard', 'wedge', 'fan', 'hook', 'wave',
  'crescent', 'pill', 'splinter', 'chunk', 'fang', 'claw',
  'fin', 'thorn', 'slant', 'notch', 'spike', 'bulge', 'scoop', 'ridge',
];

function generateShapes(random: () => number): [ShapeType, ShapeType] {
  const shuffled = [...ALL_SHAPES].sort(() => random() - 0.5);
  return [shuffled[0], shuffled[1]]; // here you can return specific shapes for testing, but you need to throw an error in the fetch function in useDailyChallenge to trigger this (and reset local storage)
}

// =============================================================================
// Daily Word Utilities
// =============================================================================

/**
 * Get the daily word for a given date.
 * Uses day of year to index into the shuffled order array.
 */
export function getWordForDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)); // 1-365
  const orderIndex = (dayOfYear - 1) % WORDS_ORDER.length;
  return WORDS_LIST[WORDS_ORDER[orderIndex]];
}

// =============================================================================
// Date Utilities (exported for use elsewhere)
// All dates use UTC to ensure consistency across timezones
// =============================================================================

export function getTodayDateUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString().split('T')[0];
}

export function getYesterdayDateUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
    .toISOString().split('T')[0];
}

export function getTwoDaysAgoDateUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2))
    .toISOString().split('T')[0];
}

// =============================================================================
// Challenge Generation (client-side fallback only)
// The server generates the actual challenges - this is used when offline
// =============================================================================

const challengeCache = new Map<string, DailyChallenge>();

export function generateDailyChallenge(dateStr: string): DailyChallenge {
  const cached = challengeCache.get(dateStr);
  if (cached) return cached;

  const seed = dateToSeed(dateStr);
  const random = seededRandom(seed);

  const challenge: DailyChallenge = {
    date: dateStr,
    colors: generateDistinctColors(random),
    shapes: [
      createShapeData(generateShapes(random)[0]),
      createShapeData(generateShapes(random)[1]),
    ],
    word: getWordForDate(dateStr),
  };

  // Re-generate shapes with fresh random to match server behavior
  const random2 = seededRandom(seed);
  generateDistinctColors(random2); // consume same random calls as colors
  const shapes = generateShapes(random2);
  challenge.shapes = [createShapeData(shapes[0]), createShapeData(shapes[1])];

  challengeCache.set(dateStr, challenge);
  return challenge;
}

export function getTodayChallenge(): DailyChallenge {
  return generateDailyChallenge(getTodayDateUTC());
}
