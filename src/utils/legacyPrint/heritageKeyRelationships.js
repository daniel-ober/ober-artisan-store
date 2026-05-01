// src/utils/legacyPrint/heritageKeyRelationships.js

import {
  buildVoiceThreadFingerprint,
  getComplexThreadVisualSignature,
} from './voiceThreadGeometry.js';

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
    id: 'balanced-first-impression',
    slotKey: 'simple',
    title: 'Balanced first impression',
    nodes: ['attack', 'warmth'],
    summary:

      'The drum is reading close to the Heritage center, with the first hit balancing front edge and body instead of leaning hard in one direction.',
    relevance: {
      attack: 0.85,
      warmth: 0.85,
      projection: 0.55,
      control: 0.45,
    },
    preferredDirection: {
      attack: 'center',
      warmth: 'center',
      projection: 'center',
      control: 'center',
    },
  },
  {
    id: 'centered-heritage-feel',
    slotKey: 'shaped',
    title: 'Centered Heritage feel',
    nodes: ['attack', 'warmth', 'control'],
    summary:

      'The drum is reading as a centered Heritage feel: enough front edge, enough body, and enough control without one behavior dominating.',
    relevance: {
      attack: 0.75,
      warmth: 0.85,
      control: 0.75,
      sustain: 0.45,
    },
    preferredDirection: {
      attack: 'center',
      warmth: 'center',
      control: 'center',
      sustain: 'center',
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
    id: 'bright-present-throw',
    slotKey: 'shaped',
    title: 'Bright, present throw',
    nodes: ['attack', 'brightness', 'projection'],
    summary:

      'The drum is reading with a more immediate top edge and enough outward push to feel present in the room.',
    relevance: {
      attack: 0.85,
      brightness: 0.95,
      projection: 0.9,
    },
    preferredDirection: {
      attack: 'high',
      brightness: 'high',
      projection: 'high',
    },
  },
  {
    id: 'controlled-dry-articulation',
    slotKey: 'shaped',
    title: 'Controlled, dry articulation',
    nodes: ['attack', 'brightness', 'control'],
    summary:

      'The drum is reading with a clearer front edge, less loose bloom, and a more organized top-end response.',
    relevance: {
      attack: 0.8,
      brightness: 0.75,
      control: 1,
    },
    preferredDirection: {
      attack: 'high',
      brightness: 'either',
      control: 'high',
    },
  },
  {
    id: 'wide-room-open-touch',
    slotKey: 'shaped',
    title: 'Wide room with open touch',
    nodes: ['projection', 'sustain', 'sensitivity'],
    summary:

      'The drum is reading as more open in the room, with bloom and touch response carrying the note past the first strike.',
    relevance: {
      projection: 0.8,
      sustain: 0.9,
      sensitivity: 0.8,
    },
    preferredDirection: {
      projection: 'high',
      sustain: 'high',
      sensitivity: 'high',
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
      warmth: 0.85,
      sustain: 0.9,
      projection: 0.45,
      control: 0.25,
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
      sustain: 0.95,
      warmth: 0.75,
      sensitivity: 0.5,
      brightness: 0.35,
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
  {
    id: 'lean-dry-articulate-pocket',
    slotKey: 'complex',
    title: 'Lean, dry articulate pocket',
    nodes: ['attack', 'brightness', 'warmth', 'sustain'],
    summary:

      'The drum is reading with a quick front edge, a leaner body, and a shorter controlled note path that keeps articulation close to the player.',
    relevance: {
      attack: 0.95,
      brightness: 0.85,
      warmth: 0.9,
      sustain: 0.75,
    },
    preferredDirection: {
      attack: 'high',
      brightness: 'high',
      warmth: 'low',
      sustain: 'low',
    },
  },
  {
    id: 'deep-body-open-bloom',
    slotKey: 'complex',
    title: 'Deep body with open bloom',
    nodes: ['sustain', 'warmth', 'attack', 'control'],
    summary:

      'The drum is reading with deeper body and a more open note path, while still keeping enough front edge and control to remain shaped.',
    relevance: {
      sustain: 0.9,
      warmth: 1,
      attack: 0.35,
      control: 0.35,
    },
    preferredDirection: {
      sustain: 'high',
      warmth: 'high',
      attack: 'either',
      control: 'either',
    },
  },
  {
    id: 'focused-crack-held-center',
    slotKey: 'complex',
    title: 'Focused crack with held center',
    nodes: ['attack', 'projection', 'control', 'brightness'],
    summary:

      'The drum is reading with stronger crack, more outward placement, and a held-together center that keeps the top edge controlled.',
    relevance: {
      attack: 0.95,
      projection: 0.8,
      control: 0.95,
      brightness: 0.65,
    },
    preferredDirection: {
      attack: 'high',
      projection: 'high',
      control: 'high',
      brightness: 'either',
    },
  },
  {
    id: 'touch-sensitive-open-shell',
    slotKey: 'complex',
    title: 'Touch-sensitive open shell',
    nodes: ['sensitivity', 'sustain', 'warmth', 'projection'],
    summary:

      'The drum is reading as open and responsive, with touch, body, bloom, and carry working together instead of one trait dominating.',
    relevance: {
      sensitivity: 1,
      sustain: 0.85,
      warmth: 0.75,
      projection: 0.5,
    },
    preferredDirection: {
      sensitivity: 'high',
      sustain: 'high',
      warmth: 'high',
      projection: 'either',
    },
  },
];

const AXES = [
  'attack',
  'brightness',
  'projection',
  'sustain',
  'warmth',
  'sensitivity',
  'control',
];

const SLOT_ORDER = {
  simple: 0,
  shaped: 1,
  complex: 2,
};

const clampNumber = (value, fallback = 0) => {
  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;
};

const includesText = (value = '', needle = '') => {
  return String(value || '').toLowerCase().includes(needle.toLowerCase());
};

const getProfileDelta = (profile = {}, axis) => {
  return clampNumber(profile?.[axis], 5) - 5;
};

const parseSpecFromSourceBuildRead = (sourceBuildRead = '') => {
  const text = String(sourceBuildRead || '');

  const sizeMatch = text.match(/(\d+(?:\.\d+)?)["”]?\s*x\s*(\d+(?:\.\d+)?)/i);

  const lugMatch = text.match(/(\d+)\s*lugs?/i);

  const staveMatch = text.match(/(\d+)\s*staves?/i);

  const thicknessMatch = text.match(/(\d+(?:\.\d+)?)\s*mm\s*shell/i);

  const lower = text.toLowerCase();

  const hoopType = lower.includes('die-cast')

    ? 'Die-Cast'

    : lower.includes('triple flange')

      ? 'Triple Flange'

      : '';

  const finish = lower.includes('blackened')

    ? 'Blackened'

    : lower.includes('light torch')

      ? 'Light Torch'

      : lower.includes('medium torch')

        ? 'Medium Torch'

        : '';

  const hasReRings =

    lower.includes('re-ring') ||

    lower.includes('re rings') ||

    lower.includes('rerings');

  return {
    width: sizeMatch ? Number(sizeMatch[1]) : undefined,
    depth: sizeMatch ? Number(sizeMatch[2]) : undefined,
    lugQuantity: lugMatch ? Number(lugMatch[1]) : undefined,
    staveCount: staveMatch ? Number(staveMatch[1]) : undefined,
    staveQuantity: staveMatch ? Number(staveMatch[1]) : undefined,
    shellThicknessMm: thicknessMatch ? Number(thicknessMatch[1]) : undefined,
    hoopType,
    finish,
    reRings: hasReRings ? 'Standard' : 'None',
  };
};

const getSpec = (summary = {}) => {
  const explicitSpec = summary?.currentSpec || summary?.spec || summary?.input || {};

  const parsedSpec = parseSpecFromSourceBuildRead(summary?.sourceBuildRead);

  return {
    ...parsedSpec,
    ...explicitSpec,
    width:

      explicitSpec.width ??

      explicitSpec.size ??

      explicitSpec.diameter ??

      parsedSpec.width,
    depth: explicitSpec.depth ?? parsedSpec.depth,
    lugQuantity:

      explicitSpec.lugQuantity ?? explicitSpec.lugs ?? parsedSpec.lugQuantity,
    staveCount:

      explicitSpec.staveCount ??

      explicitSpec.staveQuantity ??

      explicitSpec.staves ??

      parsedSpec.staveCount,
    staveQuantity:

      explicitSpec.staveQuantity ??

      explicitSpec.staveCount ??

      explicitSpec.staves ??

      parsedSpec.staveQuantity,
    shellThicknessMm:

      explicitSpec.shellThicknessMm ??

      explicitSpec.shellThickness ??

      explicitSpec.thicknessMm ??

      explicitSpec.thickness ??

      parsedSpec.shellThicknessMm,
    hoopType: explicitSpec.hoopType ?? explicitSpec.hoops ?? parsedSpec.hoopType,
    finish: explicitSpec.finish ?? explicitSpec.scorchDepth ?? parsedSpec.finish,
    reRings:

      explicitSpec.reRings ?? explicitSpec.reRing ?? parsedSpec.reRings,
    hardwareColor:

      explicitSpec.hardwareColor ??

      explicitSpec.hardwareFinish ??

      explicitSpec.hardware ??

      parsedSpec.hardwareColor,
  };
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

const buildSpecSignature = (summary = {}) => {
  const spec = getSpec(summary);

  const profile = summary?.profile || {};

  return [
    `w:${spec.width ?? ''}`,
    `d:${spec.depth ?? ''}`,
    `l:${spec.lugQuantity ?? ''}`,
    `s:${spec.staveCount ?? spec.staveQuantity ?? ''}`,
    `t:${spec.shellThicknessMm ?? ''}`,
    `hoop:${spec.hoopType ?? ''}`,
    `finish:${spec.finish ?? ''}`,
    `rings:${spec.reRings ?? ''}`,
    ...AXES.map((axis) => {
      const value = clampNumber(profile?.[axis], 5);

      return `${axis}:${value.toFixed(2)}`;
    }),
  ].join('|');
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
    case 'balanced-first-impression':

      if (depthBand === 'shallow') bias += 0.14;

      if (depthBand === 'medium') bias += 0.18;

      if (isMediumFinish) bias += 0.14;

      if (isTripleFlange) bias += 0.1;

      if (!hasReRings) bias += 0.06;

      if (isCompact && depthBand === 'extraShallow') bias -= 0.18;

      if (isDieCast || isBlackenedFinish || isTenLug || isThickShell) bias -= 0.12;

      break;

    case 'centered-heritage-feel':

      if (depthBand === 'shallow') bias += 0.12;

      if (depthBand === 'medium') bias += 0.16;

      if (depthBand === 'mediumDeep') bias += 0.1;

      if (isMediumFinish) bias += 0.14;

      if (isTripleFlange) bias += 0.08;

      if (!hasReRings) bias += 0.05;

      if (isCompact && depthBand === 'extraShallow') bias -= 0.14;

      if (isDieCast || isBlackenedFinish || isTenLug || isThickShell) bias -= 0.1;

      break;

    case 'compact-quick-lean-response':

      if (isCompact) bias += 0.88;

      if (depthBand === 'extraShallow') bias += 0.58;

      if (depthBand === 'shallow') bias += 0.36;

      if (isLightFinish) bias += 0.14;

      if (isThinShell) bias += 0.1;

      break;

    case 'clear-front-edge-lift':

      if (depthBand === 'extraShallow') bias += 0.42;

      if (depthBand === 'shallow') bias += 0.28;

      if (isCompact) bias += 0.22;

      if (isLightFinish) bias += 0.2;

      if (isTripleFlange) bias += 0.08;

      break;

    case 'lively-touch-open-detail':

      if (isLightFinish) bias += 0.46;

      if (isTripleFlange) bias += 0.18;

      if (!hasReRings) bias += 0.1;

      if (depthBand === 'shallow') bias += 0.12;

      break;

    case 'focused-throw-clean-shape':

      if (isTenLug) bias += 0.42;

      if (isDieCast) bias += 0.46;

      if (depthBand === 'medium') bias += 0.14;

      if (depthBand === 'mediumDeep') bias += 0.24;

      if (depthBand === 'deep') bias += 0.16;

      if (isLarge) bias += 0.1;

      if (isThickShell) bias += 0.16;

      if (isBlackenedFinish) bias += 0.08;

      break;

    case 'warm-deep-settled-center':

      if (depthBand === 'deep') bias += 0.44;

      if (depthBand === 'veryDeep') bias += 0.62;

      if (depthBand === 'extraDeep') bias += 0.78;

      if (isCompact && depthBand === 'veryDeep') bias += 0.08;

      if (isMediumDiameter) bias += 0.08;

      if (isLarge) bias += 0.06;

      if (isTripleFlange) bias += 0.08;

      if (isMediumFinish) bias += 0.08;

      break;

    case 'rounded-body-clear-start':

      if (depthBand === 'medium') bias += 0.34;

      if (depthBand === 'mediumDeep') bias += 0.5;

      if (depthBand === 'deep') bias += 0.22;

      if (isMediumDiameter) bias += 0.12;

      if (isLarge) bias += 0.08;

      if (isMediumFinish) bias += 0.12;

      if (isTripleFlange) bias += 0.1;

      if (hasReRings && isThinShell) bias -= 0.2;

      break;

    case 'grounded-body-directed-carry':

      if (depthBand === 'deep') bias += 0.44;

      if (depthBand === 'veryDeep') bias += 0.36;

      if (depthBand === 'extraDeep') bias += 0.32;

      if (isMediumDiameter) bias += 0.1;

      if (isLarge) bias += 0.18;

      if (isDieCast) bias += 0.18;

      if (isTenLug) bias += 0.14;

      break;

    case 'expressive-blooming-response':

      if (depthBand === 'mediumDeep') bias += 0.14;

      if (depthBand === 'deep') bias += 0.24;

      if (depthBand === 'veryDeep') bias += 0.34;

      if (isLightFinish) bias += 0.32;

      if (isTripleFlange) bias += 0.14;

      break;

    case 'bright-present-throw':

      if (isLightFinish) bias += 0.16;

      if (isTripleFlange) bias += 0.08;

      if (depthBand === 'medium') bias += 0.12;

      if (depthBand === 'mediumDeep') bias += 0.1;

      if (isDieCast) bias += 0.12;

      break;

    case 'controlled-dry-articulation':

      if (isDieCast) bias += 0.28;

      if (isBlackenedFinish) bias += 0.24;

      if (isTenLug) bias += 0.14;

      if (depthBand === 'shallow') bias += 0.08;

      break;

    case 'wide-room-open-touch':

      if (depthBand === 'deep') bias += 0.16;

      if (depthBand === 'veryDeep') bias += 0.24;

      if (depthBand === 'extraDeep') bias += 0.3;

      if (isTripleFlange) bias += 0.16;

      if (isLightFinish) bias += 0.12;

      break;

    case 'fast-disciplined-touch-response':

      if (isDieCast) bias += 0.34;

      if (isTenLug) bias += 0.22;

      if (depthBand === 'extraShallow' || depthBand === 'shallow') {
        bias += 0.14;
      }

      if (isLightFinish) bias += 0.08;

      break;

    case 'body-blooms-outward':

      if (depthBand === 'deep') bias += 0.14;

      if (depthBand === 'veryDeep') bias += 0.24;

      if (depthBand === 'extraDeep') bias += 0.34;

      if (isLarge) bias += 0.08;

      if (isMediumDiameter) bias += 0.04;

      if (isTripleFlange) bias += 0.06;

      if (isMediumFinish) bias += 0.06;

      if (isDieCast || isTenLug || hasReRings) bias -= 0.14;

      break;

    case 'wide-open-heritage-bloom':

      if (depthBand === 'veryDeep') bias += 0.32;

      if (depthBand === 'extraDeep') bias += 0.34;

      if (isTripleFlange) bias += 0.14;

      if (isLightFinish) bias += 0.28;

      if (!hasReRings) bias += 0.08;

      if (depthBand === 'deep' && isMediumFinish) bias -= 0.08;

      break;

    case 'dark-complex-heritage-bloom':

      if (hasReRings && isThinShell) bias += 0.5;

      if (isTripleFlange) bias += 0.14;

      if (isLightFinish) bias += 0.12;

      if (depthBand === 'mediumDeep') bias += 0.1;

      if (depthBand === 'deep') bias += 0.14;

      break;

    case 'shorter-note-firm-response':

      if (isDieCast) bias += 0.46;

      if (isTenLug) bias += 0.28;

      if (hasReRings) bias += 0.26;

      if (isThickShell) bias += 0.16;

      if (isBlackenedFinish) bias += 0.18;

      break;

    case 'dark-contained-shell-shape':

      if (isBlackenedFinish) bias += 0.58;

      if (isDieCast) bias += 0.22;

      if (hasReRings) bias += 0.16;

      if (isTenLug) bias += 0.1;

      break;

    case 'lean-dry-articulate-pocket':

      if (isCompact) bias += 0.34;

      if (depthBand === 'extraShallow') bias += 0.34;

      if (depthBand === 'shallow') bias += 0.22;

      if (isLightFinish) bias += 0.12;

      if (isBlackenedFinish) bias += 0.12;

      if (isDieCast) bias += 0.1;

      break;

    case 'deep-body-open-bloom':

      if (depthBand === 'deep') bias += 0.26;

      if (depthBand === 'veryDeep') bias += 0.46;

      if (depthBand === 'extraDeep') bias += 0.58;

      if (isLarge) bias += 0.16;

      if (isTripleFlange) bias += 0.12;

      if (isMediumFinish) bias += 0.12;

      break;

    case 'focused-crack-held-center':

      if (isDieCast) bias += 0.34;

      if (isTenLug) bias += 0.32;

      if (isThickShell) bias += 0.24;

      if (isBlackenedFinish) bias += 0.18;

      if (depthBand === 'mediumDeep') bias += 0.1;

      break;

    case 'touch-sensitive-open-shell':

      if (isLightFinish) bias += 0.28;

      if (isTripleFlange) bias += 0.16;

      if (depthBand === 'mediumDeep') bias += 0.08;

      if (depthBand === 'deep') bias += 0.14;

      if (!hasReRings) bias += 0.08;

      break;

    default:

      break;
  }

  return bias;
};

const getProfileMovementTotal = (profile = {}) => {
  return AXES.reduce((sum, axis) => {
    return sum + Math.abs(getProfileDelta(profile, axis));
  }, 0);
};

const getProfileSpread = (profile = {}) => {
  const values = AXES.map((axis) => clampNumber(profile?.[axis], 5));

  return Math.max(...values) - Math.min(...values);
};

export function getRelationshipScore(relationship, profile = {}, summary = {}) {
  const relevance = relationship.relevance || {};

  const preferredDirection = relationship.preferredDirection || {};

  const profileMovementTotal = getProfileMovementTotal(profile);

  const profileSpread = getProfileSpread(profile);

  const isBalancedCenter = relationship.id === 'balanced-heritage-center';

  if (isBalancedCenter) {
    const centerScore = Object.entries(relevance).reduce(
      (score, [axis, weight]) => {
        const delta = Math.abs(getProfileDelta(profile, axis));

        const closeness = Math.max(0, 0.42 - delta);

        return score + closeness * clampNumber(weight, 0);
      },
      0
    );

    const tooMuchMovementPenalty =

      profileMovementTotal > 1.0 ? (profileMovementTotal - 1.0) * 1.4 : 0;

    const tooMuchSpreadPenalty =

      profileSpread > 0.62 ? (profileSpread - 0.62) * 1.8 : 0;

    const specBias = getSpecBias(relationship.id, summary) * 0.35;

    return Number(
      Math.max(
        0,
        centerScore + specBias - tooMuchMovementPenalty - tooMuchSpreadPenalty
      ).toFixed(4)
    );
  }

  const profileScore = Object.entries(relevance).reduce(
    (score, [axis, weight]) => {
      const delta = getProfileDelta(profile, axis);

      const direction = preferredDirection[axis] || 'either';

      const numericWeight = clampNumber(weight, 0);

      let movement = Math.abs(delta);

      if (direction === 'high') {
        movement = Math.max(0, delta);
      }

      if (direction === 'low') {
        movement = Math.max(0, -delta);
      }

      if (direction === 'center') {
        movement = Math.max(0, 0.42 - Math.abs(delta));
      }

      if (direction === 'either') {
        movement = Math.abs(delta) * 0.72;
      }

      return score + movement * numericWeight;
    },
    0
  );

  const mismatchPenalty = Object.entries(relevance).reduce(
    (penalty, [axis, weight]) => {
      const delta = getProfileDelta(profile, axis);

      const direction = preferredDirection[axis] || 'either';

      const numericWeight = clampNumber(weight, 0);

      if (direction === 'high' && delta < -0.12) {
        return penalty + (Math.abs(delta) + 0.14) * numericWeight * 1.9;
      }

      if (direction === 'low' && delta > 0.12) {
        return penalty + (Math.abs(delta) + 0.14) * numericWeight * 1.9;
      }

      if (direction === 'center' && Math.abs(delta) > 0.46) {
        return penalty + (Math.abs(delta) - 0.46) * numericWeight * 1.25;
      }

      return penalty;
    },
    0
  );

  const rawSpecBias = getSpecBias(relationship.id, summary);

  /**

   * Important:

   * The new weighted VoiceMap is the source of truth.

   * Spec bias is now only a tie-breaker / gentle nudge.

   */

  const specBias = rawSpecBias * 0.42;

  const movementConfidence =

    profileMovementTotal < 0.55 ? 0.76 : profileMovementTotal < 1.15 ? 0.9 : 1;

  return Number(
    Math.max(0, profileScore * movementConfidence + specBias - mismatchPenalty).toFixed(4)
  );
}

const attachRelationshipVisualFingerprint = (relationship, summary = {}) => {
  if (!relationship) {
    return relationship;
  }

  const profile = summary?.profile || {};

  const spec = getSpec(summary);

  const specSignature = buildSpecSignature(summary);

  const visualSeed = [
    relationship.slotKey || 'slot',
    relationship.id || 'relationship',
    relationship.title || '',
    Array.isArray(relationship.nodes) ? relationship.nodes.join('-') : '',
    specSignature,
  ].join('|');

  const visualThread = {
    ...relationship,
    sourceSpec: spec,
    currentSpec: spec,
    spec,
    specSignature: visualSeed,
    visualSignature: visualSeed,
    fingerprint: visualSeed,
  };

  const visualFingerprint =

    relationship.slotKey === 'complex'

      ? getComplexThreadVisualSignature({
          thread: visualThread,
          profile,
        })

      : buildVoiceThreadFingerprint({
          thread: visualThread,
          profile,
        });

  const visualSignatureHash =

    visualFingerprint?.visualSignature ||

    visualFingerprint?.signatureHash ||

    String(visualFingerprint?.visualHash || '') ||

    visualSeed;

  return {
    ...relationship,
    sourceSpec: spec,
    currentSpec: spec,
    spec,
    specSignature: visualSeed,
    visualSignature: visualSignatureHash,
    visualSignatureHash,
    visualFingerprint,
    uniqueBenchShapeKey: `${relationship.slotKey}|${relationship.id}|${visualSignatureHash}`,
  };
};

export function buildKeyRelationships(summary = {}) {
  const profile = summary?.profile || {};

  const ranked = KEY_RELATIONSHIP_DEFINITIONS.map((relationship) => ({
    ...relationship,
    score: getRelationshipScore(relationship, profile, summary),
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    return String(a.id).localeCompare(String(b.id));
  });

  const bySlot = {
    simple: ranked

      .filter((relationship) => relationship.slotKey === 'simple')

      .sort((a, b) => b.score - a.score),
    shaped: ranked

      .filter((relationship) => relationship.slotKey === 'shaped')

      .sort((a, b) => b.score - a.score),
    complex: ranked

      .filter((relationship) => relationship.slotKey === 'complex')

      .sort((a, b) => b.score - a.score),
  };

  /**

   * Always return one First Read, one Feel Read, and one Bench Read.

   * HeritageProductDetail will render them in slot order.

   */

  return [bySlot.simple[0], bySlot.shaped[0], bySlot.complex[0]]

    .filter(Boolean)

    .map((relationship) => attachRelationshipVisualFingerprint(relationship, summary))

    .sort((a, b) => {
      const aOrder = SLOT_ORDER[a.slotKey] ?? 99;

      const bOrder = SLOT_ORDER[b.slotKey] ?? 99;

      if (aOrder !== bOrder) return aOrder - bOrder;

      return Number(b.score || 0) - Number(a.score || 0);
    });
}

export function getPrimaryKeyRelationship(summary = {}) {
  return buildKeyRelationships(summary)[0] || null;
}

export default buildKeyRelationships;