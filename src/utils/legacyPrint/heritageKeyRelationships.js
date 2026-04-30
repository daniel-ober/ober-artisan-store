// src/utils/legacyPrint/heritageKeyRelationships.js

const KEY_RELATIONSHIP_DEFINITIONS = [
  {
    id: 'balanced-heritage-center',

    slotKey: 'complex',

    title: 'Balanced Heritage center',

    nodes: ['warmth', 'attack', 'projection', 'control'],

    summary:
      'The drum is reading as a strong all-round Heritage voice: warm, crisp, balanced in projection, attack, and control.',

    relevance: {
      warmth: 0.95,

      attack: 0.9,

      projection: 0.9,

      control: 0.9,
    },

    preferredDirection: {
      warmth: 'center',

      attack: 'center',

      projection: 'center',

      control: 'center',
    },
  },

  {
    id: 'clear-front-edge-lift',

    slotKey: 'simple',

    title: 'Clear front edge with lift',

    nodes: ['attack', 'brightness'],

    summary: 'The drum is reading with a clearer start and more upper edge.',

    relevance: {
      attack: 1,

      brightness: 0.9,
    },

    preferredDirection: {
      attack: 'high',

      brightness: 'high',
    },
  },

  {
    id: 'lively-touch-open-detail',

    slotKey: 'simple',

    title: 'Lively touch with open detail',

    nodes: ['sensitivity', 'brightness'],

    summary:
      'The drum is reading as more responsive under lighter hands, with extra upper detail.',

    relevance: {
      sensitivity: 1,

      brightness: 0.85,
    },

    preferredDirection: {
      sensitivity: 'high',

      brightness: 'high',
    },
  },

  {
    id: 'focused-throw-clean-shape',

    slotKey: 'simple',

    title: 'Focused throw with clean shape',

    nodes: ['attack', 'projection'],

    summary:
      'The drum is reading with a stronger front edge and more outward push.',

    relevance: {
      attack: 1,

      projection: 1,
    },

    preferredDirection: {
      attack: 'high',

      projection: 'high',
    },
  },

  {
    id: 'compact-quick-lean-response',

    slotKey: 'simple',

    title: 'Compact, quick, lean response',

    nodes: ['attack', 'brightness', 'warmth'],

    summary:
      'The drum is reading as quicker and leaner, with less low-mid body and a more immediate response.',

    relevance: {
      attack: 1,

      brightness: 0.75,

      warmth: 0.85,
    },

    preferredDirection: {
      attack: 'high',

      brightness: 'high',

      warmth: 'low',
    },
  },

  {
    id: 'warm-deep-settled-center',

    slotKey: 'simple',

    title: 'Warm, deep settled center',

    nodes: ['warmth', 'sustain'],

    summary:
      'The drum is reading with a fuller center and a longer note bloom.',

    relevance: {
      warmth: 1,

      sustain: 0.9,
    },

    preferredDirection: {
      warmth: 'high',

      sustain: 'high',
    },
  },

  {
    id: 'rounded-body-clear-start',

    slotKey: 'shaped',

    title: 'Rounded body with a clear start',

    nodes: ['attack', 'warmth', 'sustain'],

    summary:
      'The drum is reading with more body and bloom while still keeping enough front edge to speak clearly.',

    relevance: {
      attack: 0.65,

      warmth: 1,

      sustain: 0.9,
    },

    preferredDirection: {
      attack: 'either',

      warmth: 'high',

      sustain: 'high',
    },
  },

  {
    id: 'grounded-body-directed-carry',

    slotKey: 'shaped',

    title: 'Grounded body with directed carry',

    nodes: ['warmth', 'control', 'projection'],

    summary:
      'The drum is reading with body and room presence, but with enough control to keep the note organized.',

    relevance: {
      warmth: 1,

      control: 0.85,

      projection: 0.85,
    },

    preferredDirection: {
      warmth: 'high',

      control: 'high',

      projection: 'high',
    },
  },

  {
    id: 'expressive-blooming-response',

    slotKey: 'shaped',

    title: 'Expressive, blooming response',

    nodes: ['warmth', 'sustain', 'sensitivity'],

    summary:
      'The drum is reading as more expressive and open, with body, bloom, and touch response working together.',

    relevance: {
      warmth: 0.85,

      sustain: 1,

      sensitivity: 1,
    },

    preferredDirection: {
      warmth: 'high',

      sustain: 'high',

      sensitivity: 'high',
    },
  },

  {
    id: 'fast-disciplined-touch-response',

    slotKey: 'shaped',

    title: 'Fast, disciplined touch response',

    nodes: ['attack', 'sensitivity', 'control'],

    summary:
      'The drum is reading as responsive and quick, but with enough control to keep softer detail organized.',

    relevance: {
      attack: 0.9,

      sensitivity: 1,

      control: 0.9,
    },

    preferredDirection: {
      attack: 'high',

      sensitivity: 'high',

      control: 'high',
    },
  },

  {
    id: 'body-blooms-outward',

    slotKey: 'complex',

    title: 'Body that blooms outward',

    nodes: ['warmth', 'sustain', 'projection', 'control'],

    summary:
      'The shell is reading as fuller and more open, with the note developing outward after the strike while still keeping enough shape to remain usable.',

    relevance: {
      warmth: 1,

      sustain: 1,

      projection: 0.85,

      control: 0.45,
    },

    preferredDirection: {
      warmth: 'high',

      sustain: 'high',

      projection: 'high',

      control: 'either',
    },
  },

  {
    id: 'wide-open-heritage-bloom',

    slotKey: 'complex',

    title: 'Wide, open Heritage bloom',

    nodes: ['sustain', 'warmth', 'sensitivity', 'brightness'],

    summary:
      'The drum is reading with a more open note shape, more bloom after the strike, and a freer shell response.',

    relevance: {
      sustain: 1,

      warmth: 0.9,

      sensitivity: 0.75,

      brightness: 0.5,
    },

    preferredDirection: {
      sustain: 'high',

      warmth: 'high',

      sensitivity: 'high',

      brightness: 'either',
    },
  },

  {
    id: 'dark-complex-heritage-bloom',

    slotKey: 'complex',

    title: 'Dark, complex Heritage bloom',

    nodes: ['sustain', 'warmth', 'brightness', 'control'],

    summary:
      'The drum is reading darker and more complex, with longer sustain and overtone character around the shell.',

    relevance: {
      sustain: 1,

      warmth: 0.8,

      brightness: 0.7,

      control: 0.55,
    },

    preferredDirection: {
      sustain: 'high',

      warmth: 'high',

      brightness: 'low',

      control: 'low',
    },
  },

  {
    id: 'shorter-note-firm-response',

    slotKey: 'complex',

    title: 'Shorter note with firm response',

    nodes: ['control', 'sustain', 'attack', 'projection'],

    summary:
      'The drum is reading with a tighter note tail, firmer response, stronger front edge, and enough outward push to keep the note present.',

    relevance: {
      control: 1,

      sustain: 1,

      attack: 0.8,

      projection: 0.55,
    },

    preferredDirection: {
      control: 'high',

      sustain: 'low',

      attack: 'high',

      projection: 'either',
    },
  },

  {
    id: 'dark-contained-shell-shape',

    slotKey: 'complex',

    title: 'Dark, contained shell shape',

    nodes: ['control', 'warmth', 'sustain', 'sensitivity'],

    summary:
      'The drum is reading darker and more contained, with a firmer shell center and less loose bloom around the note.',

    relevance: {
      control: 1,

      warmth: 0.75,

      sustain: 0.8,

      sensitivity: 0.7,
    },

    preferredDirection: {
      control: 'high',

      warmth: 'high',

      sustain: 'low',

      sensitivity: 'low',
    },
  },
];

const clampNumber = (value, fallback = 0) => {
  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;
};

const includesText = (value = '', needle = '') => {
  return String(value || '')
    .toLowerCase()
    .includes(needle.toLowerCase());
};

const getProfileDelta = (profile = {}, axis) => {
  return clampNumber(profile?.[axis], 5) - 5;
};

const getSpec = (summary = {}) => {
  return summary?.currentSpec || {};
};

const getDepthBand = (depth) => {
  const value = clampNumber(depth, 5.5);

  if (value <= 5.0) return 'extraShallow';

  if (value <= 5.5) return 'shallow';

  if (value <= 6.0) return 'medium';

  if (value <= 6.5) return 'mediumDeep';

  if (value <= 7.0) return 'deep';

  if (value <= 7.5) return 'veryDeep';

  return 'extraDeep';
};

const getSpecBias = (relationshipId, summary = {}) => {
  const spec = getSpec(summary);

  const width = clampNumber(spec.width, 14);

  const depth = clampNumber(spec.depth, 5.5);

  const lugQuantity = clampNumber(spec.lugQuantity, 8);

  const shellThicknessMm = clampNumber(spec.shellThicknessMm, 10);

  const depthBand = getDepthBand(depth);

  const isCompact = width <= 12;

  const isMediumDiameter = width === 13;

  const isLarge = width >= 14;

  const isTenLug = lugQuantity >= 10;

  const isThinShell = shellThicknessMm <= 8;

  const isThickShell = shellThicknessMm >= 12;

  const hoopType = String(spec.hoopType || '');

  const finish = String(spec.finish || '');

  const reRings = String(spec.reRings || 'None');

  const isDieCast = includesText(hoopType, 'die');

  const isTripleFlange = includesText(hoopType, 'triple');

  const isLightFinish = includesText(finish, 'light');

  const isBlackenedFinish =
    includesText(finish, 'blackened') ||
    includesText(finish, 'black stain') ||
    includesText(finish, 'black stained');

  const isMediumFinish = !isLightFinish && !isBlackenedFinish;

  const hasReRings =
    reRings.trim() !== '' &&
    reRings.toLowerCase() !== 'none' &&
    reRings.toLowerCase() !== 'no';

  let bias = 0;

  switch (relationshipId) {
    case 'compact-quick-lean-response':
      if (isCompact) bias += 2.2;

      if (depthBand === 'extraShallow') bias += 1.5;

      if (depthBand === 'shallow') bias += 1.0;

      if (isLightFinish) bias += 0.35;

      if (isThinShell) bias += 0.25;

      break;

    case 'clear-front-edge-lift':
      if (depthBand === 'extraShallow') bias += 1.0;

      if (depthBand === 'shallow') bias += 0.75;

      if (isCompact) bias += 0.6;

      if (isLightFinish) bias += 0.55;

      if (isTripleFlange) bias += 0.2;

      break;

    case 'lively-touch-open-detail':
      if (isLightFinish) bias += 1.25;

      if (isTripleFlange) bias += 0.45;

      if (!hasReRings) bias += 0.25;

      if (depthBand === 'shallow') bias += 0.35;

      break;

    case 'focused-throw-clean-shape':
      if (isTenLug) bias += 0.95;

      if (isDieCast) bias += 0.9;

      if (depthBand === 'medium') bias += 0.35;

      if (depthBand === 'mediumDeep') bias += 0.45;

      if (isLarge) bias += 0.2;

      break;

    case 'warm-deep-settled-center':
      if (depthBand === 'deep') bias += 1.1;

      if (depthBand === 'veryDeep') bias += 1.45;

      if (depthBand === 'extraDeep') bias += 1.8;

      if (isMediumDiameter || isLarge) bias += 0.35;

      if (isTripleFlange) bias += 0.25;

      if (isMediumFinish) bias += 0.2;

      break;

    case 'rounded-body-clear-start':
      if (depthBand === 'medium') bias += 1.1;

      if (depthBand === 'mediumDeep') bias += 1.75;

      if (isMediumDiameter) bias += 0.45;

      if (isMediumFinish) bias += 0.35;

      if (isTripleFlange) bias += 0.2;

      if (hasReRings && isThinShell) bias -= 0.9;

      break;

    case 'grounded-body-directed-carry':
      if (depthBand === 'deep') bias += 1.9;

      if (depthBand === 'veryDeep') bias += 0.65;

      if (isMediumDiameter || isLarge) bias += 0.45;

      if (isDieCast) bias += 0.5;

      if (isTenLug) bias += 0.35;

      break;

    case 'expressive-blooming-response':
      if (depthBand === 'mediumDeep') bias += 0.55;

      if (depthBand === 'deep') bias += 0.95;

      if (depthBand === 'veryDeep') bias += 1.15;

      if (isLightFinish) bias += 0.85;

      if (isTripleFlange) bias += 0.45;

      break;

    case 'fast-disciplined-touch-response':
      if (isDieCast) bias += 1.0;

      if (isTenLug) bias += 0.7;

      if (depthBand === 'extraShallow' || depthBand === 'shallow') {
        bias += 0.45;
      }

      if (isLightFinish) bias += 0.25;

      break;

    case 'body-blooms-outward':
      if (depthBand === 'deep') bias += 1.2;

      if (depthBand === 'veryDeep') bias += 1.35;

      if (isLarge) bias += 0.55;

      if (isMediumDiameter) bias += 0.35;

      if (isTripleFlange) bias += 0.35;

      if (isMediumFinish) bias += 0.25;

      break;

    case 'wide-open-heritage-bloom':
      if (depthBand === 'veryDeep') bias += 1.0;

      if (depthBand === 'extraDeep') bias += 0.9;

      if (isTripleFlange) bias += 0.65;

      if (isLightFinish) bias += 0.75;

      if (!hasReRings) bias += 0.25;

      break;

    case 'dark-complex-heritage-bloom':
      if (hasReRings && isThinShell) bias += 1.45;

      if (isTripleFlange) bias += 0.45;

      if (isLightFinish) bias += 0.35;

      if (depthBand === 'mediumDeep') bias += 0.35;

      if (depthBand === 'deep') bias += 0.55;

      break;

    case 'shorter-note-firm-response':
      if (isDieCast) bias += 1.35;

      if (isTenLug) bias += 0.8;

      if (hasReRings) bias += 0.85;

      if (isThickShell) bias += 0.45;

      if (isBlackenedFinish) bias += 0.45;

      break;

    case 'dark-contained-shell-shape':
      if (isBlackenedFinish) bias += 2.0;

      if (isDieCast) bias += 0.65;

      if (hasReRings) bias += 0.55;

      if (isTenLug) bias += 0.3;

      break;

    default:
      break;
  }

  return bias;
};

export function getRelationshipScore(relationship, profile = {}, summary = {}) {
  const relevance = relationship.relevance || {};

  const preferredDirection = relationship.preferredDirection || {};

  const profileScore = Object.entries(relevance).reduce(
    (score, [axis, weight]) => {
      const delta = getProfileDelta(profile, axis);

      const direction = preferredDirection[axis] || 'either';

      let movement = Math.abs(delta);

      if (direction === 'high') {
        movement = Math.max(0, delta);
      }

      if (direction === 'low') {
        movement = Math.max(0, -delta);
      }

      if (direction === 'center') {
        movement = Math.max(0, 0.85 - Math.abs(delta));
      }

      return score + movement * clampNumber(weight, 0);
    },

    0
  );

  const mismatchPenalty = Object.entries(relevance).reduce(
    (penalty, [axis, weight]) => {
      const delta = getProfileDelta(profile, axis);

      const direction = preferredDirection[axis] || 'either';

      const numericWeight = clampNumber(weight, 0);

      if (direction === 'high' && delta < -0.3) {
        return penalty + (Math.abs(delta) + 0.55) * numericWeight * 2.1;
      }

      if (direction === 'low' && delta > 0.3) {
        return penalty + (Math.abs(delta) + 0.55) * numericWeight * 2.1;
      }

      return penalty;
    },

    0
  );

  const specBias = getSpecBias(relationship.id, summary);

  return Number(
    Math.max(0, profileScore + specBias - mismatchPenalty).toFixed(4)
  );
}

export function buildKeyRelationships(summary = {}) {
  const profile = summary?.profile || {};

  const ranked = KEY_RELATIONSHIP_DEFINITIONS.map((relationship) => ({
    ...relationship,

    score: getRelationshipScore(relationship, profile, summary),
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    return String(a.id).localeCompare(String(b.id));
  });

  const usedSlots = new Set();

  const slotted = ranked.filter((relationship) => {
    if (usedSlots.has(relationship.slotKey)) return false;

    usedSlots.add(relationship.slotKey);

    return true;
  });

  return slotted.slice(0, 3);
}

export function getPrimaryKeyRelationship(summary = {}) {
  return buildKeyRelationships(summary)[0] || null;
}

export default buildKeyRelationships;
