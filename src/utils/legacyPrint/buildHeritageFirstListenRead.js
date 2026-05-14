// src/utils/legacyPrint/buildHeritageFirstListenRead.js

const AXIS_META = [

  { key: 'attack', label: 'Attack' },

  { key: 'brightness', label: 'Brightness' },

  { key: 'projection', label: 'Projection' },

  { key: 'sustain', label: 'Sustain' },

  { key: 'warmth', label: 'Warmth' },

  { key: 'sensitivity', label: 'Sensitivity' },

  { key: 'control', label: 'Control' },

];

const clamp = (value, min = 0, max = 10) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

const normalizeText = (value = '') => String(value || '').toLowerCase();

const getShellThicknessMm = (spec = {}) => {

  const candidates = [

    spec.shellThicknessMm,

    spec.thicknessMm,

    spec.shellThickness,

    spec.thickness,

  ];

  for (const candidate of candidates) {

    const direct = Number(candidate);

    if (Number.isFinite(direct) && direct > 0) return direct;

    const match = String(candidate || '').match(/(\d+(?:\.\d+)?)\s*mm/i);

    if (match) {

      const parsed = Number(match[1]);

      if (Number.isFinite(parsed) && parsed > 0) return parsed;

    }

  }

  return 10;

};

const getStaveCount = (spec = {}) => {

  const direct = Number(spec.staveCount);

  if (Number.isFinite(direct) && direct > 0) return direct;

  const match = String(spec.staveOption || '').match(/^(\d+)/);

  if (match) return Number(match[1]);

  return 16;

};

const getLugCount = (spec = {}) => {

  const value = Number(spec.lugQuantity || spec.lugs || spec.lugCount);

  if (Number.isFinite(value) && value > 0) return value;

  return 8;

};

const buildFactorScores = (spec = {}) => {

  const width = Number(spec.width || spec.size || spec.diameter || 14);

  const depth = Number(spec.depth || 5.5);

  const thickness = getShellThicknessMm(spec);

  const staveCount = getStaveCount(spec);

  const lugCount = getLugCount(spec);

  const hoop = normalizeText(spec.hoopType);

  const finish = normalizeText(spec.finish || spec.scorchDepth);

  const isDieCast = hoop.includes('die');

  const isTripleFlange = hoop.includes('triple');

  const isLight = finish.includes('light');

  const isBlackened =

    finish.includes('blackened') ||

    finish.includes('black stain') ||

    finish.includes('black stained') ||

    finish.includes('blacked');

  const scores = {

    attack: 0,

    brightness: 0,

    projection: 0,

    sustain: 0,

    warmth: 0,

    sensitivity: 0,

    control: 0,

  };

  // Diameter movement

  if (width <= 12) {

    scores.attack += 1.15;

    scores.brightness += 0.85;

    scores.sensitivity += 0.65;

    scores.control += 0.35;

  } else if (width === 13) {

    scores.attack += 0.45;

    scores.warmth += 0.45;

    scores.projection += 0.35;

    scores.sensitivity += 0.25;

  } else if (width >= 14) {

    scores.warmth += 0.85;

    scores.projection += 0.65;

    scores.control += 0.35;

  }

  // Depth movement

  if (depth <= 5) {

    scores.attack += 1.15;

    scores.brightness += 0.8;

    scores.control += 0.45;

  } else if (depth <= 5.5) {

    scores.attack += 0.65;

    scores.control += 0.45;

    scores.warmth += 0.3;

  } else if (depth <= 6) {

    scores.warmth += 0.55;

    scores.projection += 0.45;

    scores.attack += 0.35;

  } else if (depth <= 6.5) {

    scores.warmth += 0.85;

    scores.projection += 0.65;

    scores.control += 0.35;

  } else if (depth <= 7) {

    scores.warmth += 1.05;

    scores.projection += 0.8;

    scores.sustain += 0.55;

  } else {

    scores.warmth += 1.25;

    scores.sustain += 1.05;

    scores.projection += 0.85;

  }

  // Shell thickness movement

  if (thickness <= 8) {

    scores.warmth += 0.9;

    scores.sustain += 0.85;

    scores.sensitivity += 0.75;

  } else if (thickness <= 11) {

    scores.warmth += 0.45;

    scores.attack += 0.35;

    scores.sensitivity += 0.3;

    scores.control += 0.25;

  } else if (thickness <= 14) {

    scores.control += 0.85;

    scores.attack += 0.75;

    scores.projection += 0.55;

  } else {

    scores.control += 1.05;

    scores.attack += 0.9;

    scores.projection += 0.8;

  }

  // Lug / stave movement

  if (lugCount >= 10) {

    scores.control += 0.65;

    scores.attack += 0.5;

    scores.projection += 0.4;

  } else if (lugCount <= 6) {

    scores.sustain += 0.55;

    scores.sensitivity += 0.45;

    scores.warmth += 0.35;

  }

  if (staveCount <= 12) {

    scores.warmth += 0.4;

    scores.sustain += 0.35;

    scores.sensitivity += 0.25;

  } else if (staveCount >= 20) {

    scores.control += 0.35;

    scores.attack += 0.3;

    scores.projection += 0.25;

  }

  // Hoop movement

  if (isDieCast) {

    scores.control += 0.95;

    scores.attack += 0.65;

    scores.projection += 0.35;

  } else if (isTripleFlange) {

    scores.sustain += 0.35;

    scores.sensitivity += 0.3;

    scores.warmth += 0.25;

  }

  // Finish movement

  if (isBlackened) {

    scores.control += 0.85;

    scores.attack += 0.35;

    scores.brightness += 0.25;

  } else if (isLight) {

    scores.sensitivity += 0.65;

    scores.sustain += 0.45;

    scores.brightness += 0.3;

  } else {

    scores.warmth += 0.25;

    scores.control += 0.2;

  }

  return scores;

};

const buildTitle = (nodes = []) => {

  const signature = nodes.join('|');

  const titleMap = {

    'attack|brightness|control': 'quick defined stick start',

    'attack|control|projection': 'defined stick start with forward shape',

    'attack|projection|warmth': 'clear body with forward response',

    'warmth|projection|sustain': 'fuller wood body with longer bloom',

    'warmth|sustain|projection': 'fuller wood body with longer bloom',

    'warmth|projection|control': 'fuller wood body with organized response',

    'warmth|control|projection': 'fuller wood body with organized response',

    'sensitivity|warmth|sustain': 'touch-open shell response with bloom',

    'control|attack|projection': 'focused response with clean throw',

    'control|projection|attack': 'focused response with clean throw',

    'projection|attack|control': 'forward stick presence with control',

  };

  return titleMap[signature] || `${nodes.join(', ')} shaped first impression`;

};

const readByNode = {

  attack: 'How quickly and clearly the stick speaks at the front of the note.',

  brightness: 'How much upper-edge clarity and crispness comes through first.',

  projection: 'How far forward the drum feels in the room or mix.',

  sustain: 'How much bloom and tail remain after the initial hit.',

  warmth: 'How full, woody, and body-rich the drum feels.',

  sensitivity: 'How easily the shell responds to lighter touch and smaller dynamics.',

  control: 'How focused and organized the sound feels.',

};

export default function buildHeritageFirstListenRead({

  profile = {},

  spec = {},

} = {}) {

  const factorScores = buildFactorScores(spec);

  const ranked = AXIS_META.map((axis) => {

    const value = Number(profile?.[axis.key] ?? 5);

    const profileDistance = Math.abs(value - 5);

    const factorScore = Number(factorScores[axis.key] || 0);

    const blendedScore = profileDistance * 1.15 + factorScore * 0.85;

    return {

      ...axis,

      value,

      score: blendedScore,

      factorScore,

      profileDistance,

    };

  }).sort((a, b) => {

    if (b.score !== a.score) return b.score - a.score;

    if (b.factorScore !== a.factorScore) return b.factorScore - a.factorScore;

    return b.value - a.value;

  });

  const topNodes = ranked.slice(0, 3);

  const nodes = topNodes.map((item) => item.key);

  return {

    title: buildTitle(nodes),

    nodes,

    visualProfile: profile,

    summary: `The first impression is being shaped by ${topNodes

      .map((item) => item.label.toLowerCase())

      .join(', ')} in this configuration.`,

    nodeReads: topNodes.map((item, index) => ({

      key: item.key,

      label: item.label,

      rank: index + 1,

      value: Number.isFinite(item.value) ? Number(item.value.toFixed(2)) : 5,

      read: readByNode[item.key],

    })),

  };

}