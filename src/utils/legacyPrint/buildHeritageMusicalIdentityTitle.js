// src/utils/legacyPrint/buildHeritageMusicalIdentityTitle.js

const TITLE_BANK = {

  diameter: {

    12: [

      'Compact',

      'Small-Bore',

      'Tight-Radius',

      'Sidecar',

      'Focused Miniature',

      'Close-Mic',

      'Pocket-Sized',

      'Narrow-Room',

      'Small-Frame',

      'Lean Shell',

    ],

    13: [

      'Middle-Weight',

      'Studio-Mid',

      'Balanced Side',

      'Transitional',

      'Session-Mid',

      'Room-Ready',

      'Centered-Mid',

      'Versatile',

      'Bridge-Voice',

      'Responsive Midline',

    ],

    14: [

      'Full-Size',

      'Backbeat',

      'Room-Anchor',

      'Centerline',

      'Heritage',

      'Big-Room',

      'Foundation',

      'Wide-Body',

      'Session-Anchor',

      'Full-Frame',

    ],

  },

  depth: {

    shallow: [

      'Quick Strike',

      'Dry Front',

      'Fast Exit',

      'Short Fuse',

      'Immediate Edge',

      'Close-Mic Crack',

      'Tight Response',

      'Lean Bite',

      'Quick-Note',

      'Front-Edge',

    ],

    balanced: [

      'Balanced Center',

      'Honest Room',

      'Natural Pocket',

      'Classic Center',

      'Steady Backbeat',

      'Warm Centerline',

      'Grounded Middle',

      'No-Drama Voice',

      'Familiar Seat',

      'Even-Handed Core',

    ],

    mediumDeep: [

      'Pocket Weight',

      'Rounded Body',

      'Low-Mid Pull',

      'Mature Chamber',

      'Warm Frame',

      'Fuller Seat',

      'Weighted Center',

      'Room Body',

      'Shell-First Push',

      'Composed Bloom',

    ],

    deep: [

      'Deep Chamber',

      'Low-Mid Story',

      'Extended Bloom',

      'Slow Fire',

      'Long Tail',

      'Heavy Air',

      'Wide Fundamental',

      'Chambered Backbeat',

      'Deep Pocket',

      'Low-End Witness',

    ],

  },

  shell: {

    standard16x10: [

      'Heritage Center',

      'Oak Center',

      'Shell-First Compass',

      'Classic Stave Core',

      'Seasoned Oak Voice',

      'Rooted Oak Frame',

      'Benchmark Spine',

      'Honest Oak Story',

      'Natural Stave Seat',

      'Grounded Oak Read',

    ],

    thick20x12: [

      'Focused Oak Authority',

      'Thick-Shell Driver',

      'Controlled Stave Weight',

      'High-Lug Statement',

      'Dense Oak Frame',

      'Locked-In Center',

      'Studio-Controlled Core',

      'Heavy Rimline Voice',

      'Firm Oak Architecture',

      'Concentrated Backbeat',

    ],

    thin10x7: [

      'Thin-Shell Witness',

      'Reinforced Low-Mid Voice',

      'Dark Complex Bloom',

      'Old-Soul Chamber',

      'Supported Thin-Shell Story',

      'Re-Ring Resonance',

      'Flexible Oak Memory',

      'Breathing Thin-Shell Core',

      'Reinforced Bloom Pocket',

      'Open-Shell Confession',

    ],

    thin12x8: [

      'Compact Re-Ring Voice',

      'Supported Small-Shell Core',

      'Small Chamber Authority',

      'Reinforced Studio Pocket',

      'Compact Oak Weight',

      'Small-Bore Foundation',

      'Tight Shell Memory',

      'Focused Re-Ring Body',

      'Miniature Low-Mid Engine',

      'Supported Side Voice',

    ],

  },

  finish: {

    light: [

      'Open-Grain',

      'Golden',

      'Clear Flame',

      'Airy Oak',

      'Light-Touched',

      'Bright-Room',

      'Open Oak',

      'Natural Flame',

      'Clean Grain',

      'Light-Burn',

    ],

    medium: [

      'Burnished',

      'Seasoned',

      'Smoked',

      'Warm-Torch',

      'Played-In',

      'Ambered',

      'Workshop',

      'Rooted',

      'Classic-Torch',

      'Oak-Fired',

    ],

    blackened: [

      'Blackened',

      'Charred',

      'Shadowed',

      'Smoke-Wrapped',

      'Dark-Torch',

      'Ash-Toned',

      'Low-Light',

      'Burnt-Edge',

      'Charcoal',

      'Dark-Fire',

    ],

  },

  hoop: {

    triple: [

      'Open',

      'Breathing',

      'Room',

      'Blooming',

      'Classic',

      'Wide',

      'Loose-Edged',

      'Natural',

      'Air-Moving',

      'Shell-Open',

    ],

    diecast: [

      'Focused',

      'Controlled',

      'Studio',

      'Locked-In',

      'Tightened',

      'Framed',

      'Disciplined',

      'Precise',

      'Rim-Defined',

      'Held',

    ],

  },

  hardware: {

    chrome: [

      'Clean',

      'Classic',

      'Honest',

      'Polished',

      'Straightforward',

      'Clear',

      'Workhorse',

      'Unforced',

      'Bright-Metal',

      'Traditional',

    ],

    blackNickel: [

      'Modern Shadow',

      'Dark Metal',

      'Smoked Hardware',

      'Low-Light Metal',

      'Studio Shadow',

      'Refined Dark',

      'Black-Nickel',

      'Modern-Edge',

      'Shadow Trim',

      'Darkened Crown',

    ],

    brassGold: [

      'Brass-Touched',

      'Gold-Crowned',

      'Ceremonial',

      'Collector',

      'Warm-Metal',

      'Burnished Crown',

      'Statement Hardware',

      'Golden Trim',

      'Vintage-Ceremony',

      'Refined Crown',

    ],

  },

  role: [

    'Storyteller',

    'Compass',

    'Authority',

    'Narrator',

    'Anchor',

    'Voice',

    'Statement',

    'Witness',

    'Driver',

    'Closer',

    'Translator',

    'Centerpiece',

    'Memory',

    'Confession',

    'Foundation',

    'Room Marker',

    'Pocket Drum',

    'Session Voice',

    'Backbeat',

    'Character',

  ],

};

const TITLE_PATTERNS = [

  ({ finish, depth, role }) => `${finish} ${depth} ${role}`,

  ({ depth, shell }) => `${depth}, ${shell}`,

  ({ hoop, depth, role }) => `${hoop} ${depth} ${role}`,

  ({ hardware, shell }) => `${hardware} ${shell}`,

  ({ finish, shell }) => `${finish} ${shell}`,

  ({ diameter, depth }) => `${diameter} ${depth}`,

  ({ depth, hoop }) => `${depth}, ${hoop} Frame`,

  ({ finish, hoop, role }) => `${finish} ${hoop} ${role}`,

  ({ shell, role }) => `${shell} ${role}`,

  ({ hardware, depth, role }) => `${hardware} ${depth} ${role}`,

  ({ diameter, shell }) => `${diameter} ${shell}`,

  ({ finish, diameter, role }) => `${finish} ${diameter} ${role}`,

];

const SPECIAL_REFERENCE_TITLES = {

  '14|5.5|8|16|10|Triple Flange|Chrome|Medium Torch':

    'Balanced Heritage Center',

  '14|5.0|8|16|10|Triple Flange|Chrome|Medium Torch':

    'Warm Center, Quick Edges',

  '14|8.0|8|16|10|Triple Flange|Chrome|Medium Torch':

    'Deep Chamber Storyteller',

  '12|8.0|8|16|10|Triple Flange|Chrome|Medium Torch':

    'Small Shell, Deep Voice',

  '14|5.5|10|20|12|Die-Cast|Chrome|Medium Torch':

    'Focused Oak Authority',

  '14|5.5|10|10|7|Triple Flange|Chrome|Medium Torch':

    'Thin-Shell Low-Mid Witness',

};

const clampIndex = (value, length) => {

  if (!length) return 0;

  return Math.abs(Number(value || 0)) % length;

};

const hashString = (value = '') => {

  const str = String(value || '');

  let hash = 2166136261;

  for (let i = 0; i < str.length; i += 1) {

    hash ^= str.charCodeAt(i);

    hash = Math.imul(hash, 16777619);

  }

  return hash >>> 0;

};

const normalizeNumber = (value, fallback = 0) => {

  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;

};

const parseStaveOption = (staveOption = '') => {

  const raw = String(staveOption || '');

  const staveMatch = raw.match(/^(\d+)/);

  const thicknessMatch = raw.match(/-\s*(\d+(?:\.\d+)?)mm/i);

  return {

    staveCount: staveMatch ? Number(staveMatch[1]) : null,

    shellThicknessMm: thicknessMatch ? Number(thicknessMatch[1]) : null,

  };

};

const normalizeHardware = (hardwareColor = '') => {

  const value = String(hardwareColor || '').toLowerCase();

  if (value.includes('black')) return 'blackNickel';

  if (value.includes('brass') || value.includes('gold')) return 'brassGold';

  return 'chrome';

};

const normalizeHoop = (hoopType = '') => {

  const value = String(hoopType || '').toLowerCase();

  if (value.includes('die')) return 'diecast';

  return 'triple';

};

const normalizeFinish = (finish = '') => {

  const value = String(finish || '').toLowerCase();

  if (value.includes('light')) return 'light';

  if (value.includes('black')) return 'blackened';

  return 'medium';

};

const getDepthBand = (depth) => {

  const value = normalizeNumber(depth, 5.5);

  if (value <= 5) return 'shallow';

  if (value <= 5.5) return 'balanced';

  if (value <= 6.5) return 'mediumDeep';

  return 'deep';

};

const getShellKey = ({ width, lugQuantity, staveCount, shellThicknessMm }) => {

  if (width <= 12 && lugQuantity <= 6) return 'thin12x8';

  if (staveCount === 10 || shellThicknessMm <= 7) return 'thin10x7';

  if (staveCount === 20 || shellThicknessMm >= 12) return 'thick20x12';

  return 'standard16x10';

};

const getSpecValue = (spec = {}, keys = [], fallback = '') => {

  for (const key of keys) {

    if (spec[key] !== undefined && spec[key] !== null && spec[key] !== '') {

      return spec[key];

    }

  }

  return fallback;

};

const normalizeSpec = ({

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  hardwareColor,

  scorchDepth,

  currentSpec = {},

} = {}) => {

  const parsed = parseStaveOption(staveOption);

  const width = normalizeNumber(

    getSpecValue(currentSpec, ['width', 'size', 'diameter'], size),

    14

  );

  const resolvedDepth = normalizeNumber(

    getSpecValue(currentSpec, ['depth'], depth),

    5.5

  );

  const lugQuantity = normalizeNumber(

    getSpecValue(currentSpec, ['lugQuantity', 'lugs'], lugs),

    8

  );

  const staveCount = normalizeNumber(

    getSpecValue(

      currentSpec,

      ['staveCount', 'staveQuantity', 'staves'],

      parsed.staveCount

    ),

    16

  );

  const shellThicknessMm = normalizeNumber(

    getSpecValue(

      currentSpec,

      ['shellThicknessMm', 'thicknessMm', 'shellThickness', 'thickness'],

      parsed.shellThicknessMm

    ),

    10

  );

  return {

    width,

    depth: resolvedDepth,

    lugQuantity,

    staveCount,

    shellThicknessMm,

    hoopType: getSpecValue(currentSpec, ['hoopType', 'hoops'], hoopType),

    hardwareColor: getSpecValue(

      currentSpec,

      ['hardwareColor', 'hardwareFinish', 'hardware'],

      hardwareColor

    ),

    scorchDepth: getSpecValue(

      currentSpec,

      ['finish', 'scorchDepth'],

      scorchDepth

    ),

  };

};

const titleCase = (value = '') => {

  return String(value || '')

    .replace(/\s+/g, ' ')

    .trim()

    .replace(/\b\w/g, (char) => char.toUpperCase());

};

const cleanTitle = (value = '') => {

  return titleCase(

    String(value || '')

      .replace(/\bThe\s+/gi, '')

      .replace(/\s+,/g, ',')

      .replace(/\s{2,}/g, ' ')

      .trim()

  );

};

export function buildHeritageMusicalIdentityTitle(input = {}) {

  const spec = normalizeSpec(input);

  const depthBand = getDepthBand(spec.depth);

  const finishKey = normalizeFinish(spec.scorchDepth);

  const hoopKey = normalizeHoop(spec.hoopType);

  const hardwareKey = normalizeHardware(spec.hardwareColor);

  const shellKey = getShellKey(spec);

  const signature = [

    spec.width,

    spec.depth,

    spec.lugQuantity,

    spec.staveCount,

    spec.shellThicknessMm,

    spec.hoopType,

    spec.hardwareColor,

    spec.scorchDepth,

  ].join('|');

  if (SPECIAL_REFERENCE_TITLES[signature]) {

    return SPECIAL_REFERENCE_TITLES[signature];

  }

  const hash = hashString(signature);

  const diameterWords = TITLE_BANK.diameter[spec.width] || TITLE_BANK.diameter[14];

  const depthWords = TITLE_BANK.depth[depthBand] || TITLE_BANK.depth.balanced;

  const shellWords = TITLE_BANK.shell[shellKey] || TITLE_BANK.shell.standard16x10;

  const finishWords = TITLE_BANK.finish[finishKey] || TITLE_BANK.finish.medium;

  const hoopWords = TITLE_BANK.hoop[hoopKey] || TITLE_BANK.hoop.triple;

  const hardwareWords = TITLE_BANK.hardware[hardwareKey] || TITLE_BANK.hardware.chrome;

  const roleWords = TITLE_BANK.role;

  const parts = {

    diameter: diameterWords[clampIndex(hash, diameterWords.length)],

    depth: depthWords[clampIndex(hash >> 2, depthWords.length)],

    shell: shellWords[clampIndex(hash >> 4, shellWords.length)],

    finish: finishWords[clampIndex(hash >> 6, finishWords.length)],

    hoop: hoopWords[clampIndex(hash >> 8, hoopWords.length)],

    hardware: hardwareWords[clampIndex(hash >> 10, hardwareWords.length)],

    role: roleWords[clampIndex(hash >> 12, roleWords.length)],

  };

  const pattern = TITLE_PATTERNS[clampIndex(hash >> 14, TITLE_PATTERNS.length)];

  return cleanTitle(pattern(parts));

}

export default buildHeritageMusicalIdentityTitle;