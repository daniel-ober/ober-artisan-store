// src/utils/legacyPrint/adminSliderMeta.js

export const NODE_SLIDER_META = {

  attack: {

    label: 'Attack',

    leftLabel: 'Softer / rounder front edge',

    rightLabel: 'Sharper / faster front edge',

    negativeMeaning: 'reduces the immediacy and crack of the first hit',

    positiveMeaning: 'increases the speed, crack, and definition of the first hit',

    plainMeaning:

      'Attack controls how quickly and clearly the drum speaks at the front of the note.',

  },

  brightness: {

    label: 'Brightness',

    leftLabel: 'Darker / smoother',

    rightLabel: 'Brighter / more cutting',

    negativeMeaning: 'pulls back upper-register snap, edge, and perceived pitch',

    positiveMeaning: 'adds more top-end clarity, cut, and perceived pitch',

    plainMeaning:

      'Brightness controls how much upper-register edge, snap, and clarity sit on top of the drum.',

  },

  projection: {

    label: 'Projection',

    leftLabel: 'More intimate / contained',

    rightLabel: 'More forward / room-filling',

    negativeMeaning: 'keeps the drum closer, less forceful, and less outward in the room',

    positiveMeaning: 'pushes the note farther outward with more presence and carry',

    plainMeaning:

      'Projection controls how strongly the drum throws its voice into the room.',

  },

  sustain: {

    label: 'Sustain',

    leftLabel: 'Shorter / drier',

    rightLabel: 'Longer / more open',

    negativeMeaning: 'shortens the note tail and tightens the decay',

    positiveMeaning: 'extends the bloom and lets the shell hold the note longer',

    plainMeaning:

      'Sustain controls how long the drum holds onto the note after the initial hit.',

  },

  warmth: {

    label: 'Warmth',

    leftLabel: 'Leaner / clearer',

    rightLabel: 'Fuller / warmer',

    negativeMeaning: 'reduces low-mid body, roundness, and shell fullness',

    positiveMeaning: 'adds body, roundness, and low-mid weight',

    plainMeaning:

      'Warmth controls how full, round, and grounded the center of the drum feels.',

  },

  sensitivity: {

    label: 'Sensitivity',

    leftLabel: 'Firmer / less touch response',

    rightLabel: 'More responsive / touch-sensitive',

    negativeMeaning: 'requires more input before the drum opens up',

    positiveMeaning: 'opens up more easily under ghost notes, softer strokes, and lighter touch',

    plainMeaning:

      'Sensitivity controls how easily the drum responds to lighter playing and subtle dynamics.',

  },

  control: {

    label: 'Control',

    leftLabel: 'More open / less contained',

    rightLabel: 'More focused / organized',

    negativeMeaning: 'lets the note spread more freely with less containment',

    positiveMeaning: 'tightens the note shape and improves focus',

    plainMeaning:

      'Control describes how organized, contained, and easy to place the drum feels.',

  },

};

export const MASTER_WEIGHT_META = {

  playerAnalysisMultiplier: {

    label: 'Player Analysis',

    leftLabel: 'Less influence in full read',

    rightLabel: 'More influence in full read',

    plainMeaning:

      'Controls how strongly this node affects the full seven-node Player Analysis profile.',

  },

  firstListenMultiplier: {

    label: 'First Listen',

    leftLabel: 'Less likely to surface early',

    rightLabel: 'More likely to surface early',

    plainMeaning:

      'Controls how easily this node becomes one of the first traits the listener notices.',

  },

  movementMultiplier: {

    label: 'Movement',

    leftLabel: 'Smaller response shifts',

    rightLabel: 'Larger response shifts',

    plainMeaning:

      'Controls how dramatically this node reacts when configuration options push it up or down.',

  },

};

export const getSliderIntensityLabel = (value = 0, mode = 'config') => {

  const number = Number(value);

  if (!Number.isFinite(number)) {

    return 'Neutral';

  }

  const abs = Math.abs(number);

  if (mode === 'master') {

    if (number < 0.7) return 'Strongly restrained';

    if (number < 0.9) return 'Slightly restrained';

    if (number > 1.15) return 'Strongly emphasized';

    if (number > 1.02) return 'Slightly emphasized';

    return 'Neutral';

  }

  if (abs < 0.01) return 'Neutral';

  if (abs < 0.11) return number > 0 ? 'Slight increase' : 'Slight reduction';

  if (abs < 0.26) return number > 0 ? 'Moderate increase' : 'Moderate reduction';

  if (abs < 0.51) return number > 0 ? 'Strong increase' : 'Strong reduction';

  return number > 0 ? 'Major increase' : 'Major reduction';

};

export const getConfigSliderInterpretation = ({ node, value, optionLabel }) => {

  const meta = NODE_SLIDER_META[node];

  if (!meta) return '';

  const number = Number(value);

  if (!Number.isFinite(number) || Math.abs(number) < 0.01) {

    return `${optionLabel} is currently neutral for ${meta.label}.`;

  }

  const intensity = getSliderIntensityLabel(number, 'config').toLowerCase();

  const directionText = number > 0 ? meta.positiveMeaning : meta.negativeMeaning;

  return `${optionLabel} creates a ${intensity} in ${meta.label}. In plain terms, it ${directionText}.`;

};

export const getMasterSliderInterpretation = ({ node, value, weightKey }) => {

  const nodeMeta = NODE_SLIDER_META[node];

  const weightMeta = MASTER_WEIGHT_META[weightKey];

  if (!nodeMeta || !weightMeta) return '';

  const number = Number(value);

  if (!Number.isFinite(number)) {

    return `${nodeMeta.label} is using the default ${weightMeta.label} behavior.`;

  }

  const intensity = getSliderIntensityLabel(number, 'master');

  if (intensity === 'Neutral') {

    return `${nodeMeta.label} is neutral in ${weightMeta.label}. It is not being meaningfully boosted or restrained.`;

  }

  if (number > 1.02) {

    return `${nodeMeta.label} is ${intensity.toLowerCase()} in ${weightMeta.label}. This makes ${nodeMeta.label.toLowerCase()} more likely to shape the resulting read.`;

  }

  return `${nodeMeta.label} is ${intensity.toLowerCase()} in ${weightMeta.label}. This keeps ${nodeMeta.label.toLowerCase()} from overpowering the resulting read.`;

};