import React, { useState, useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';

import { db } from '../firebaseConfig';

import { useCart } from '../context/CartContext';

import SpiderChart from './SpiderChart';

import BarChart from './BarChart';

import feuzonSummaries from '../data/feuzonSummaries';

import './FeuzonProductDetail.css';

import toast from 'react-hot-toast';

const AXIS_META = [
  { key: 'attack', label: 'Attack' },

  { key: 'sustain', label: 'Sustain' },

  { key: 'warmth', label: 'Warmth' },

  { key: 'projection', label: 'Projection' },

  { key: 'brightness', label: 'Brightness' },

  { key: 'sensitivity', label: 'Sensitivity' },

  { key: 'control', label: 'Control' },
];

const AXIS_POINT_COLORS = [
  '#ff7448',

  '#4d86ff',

  '#c1682e',

  '#ffb53a',

  '#e7d98f',

  '#68d9df',

  '#9e8bff',
];

const clampAxis = (value) => {
  const num = Number(value || 0);

  if (Number.isNaN(num)) return 5;

  return Math.max(4, Math.min(10, Number(num.toFixed(2))));
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(0)}`;

const basePrices = {
  12: 1050,

  13: 1150,

  14: 1250,

  15: 1350,
};

const depthPrices = {
  12: {
    '5.0': 0,

    5.5: 50,

    '6.0': 100,

    6.5: 150,

    '7.0': 200,

    7.5: 250,

    '8.0': 300,
  },

  13: {
    '5.0': 0,

    5.5: 50,

    '6.0': 100,

    6.5: 150,

    '7.0': 200,

    7.5: 250,

    '8.0': 300,
  },

  14: {
    '5.0': 0,

    5.5: 50,

    '6.0': 100,

    6.5: 150,

    '7.0': 200,

    7.5: 250,

    '8.0': 300,
  },

  15: {
    '5.0': 0,

    5.5: 50,

    '6.0': 100,

    6.5: 150,

    '7.0': 200,

    7.5: 250,

    '8.0': 300,
  },
};

const lugOptions = {
  12: ['6', '8'],

  13: ['8'],

  14: ['8', '10'],

  15: ['10'],
};

const staveMapping = {
  12: {
    6: ['12 - 10mm'],

    8: ['16 - 13mm'],
  },

  13: {
    8: ['16 - 13mm'],
  },

  14: {
    8: ['16 - 13mm'],

    10: ['20 - 14mm'],
  },

  15: {
    10: ['20 - 14mm'],
  },
};

const shellOptions = {
  Maple: ['Walnut + Birch', 'Oak + Cherry', 'Maple + Bubinga'],

  Walnut: ['Mahogany + Cherry', 'Walnut + Padauk', 'Oak + Wenge'],

  Cherry: ['Birch + Maple', 'Zebrawood + Mahogany', 'Padauk + Ash'],
};

const hardwareOptions = [
  { label: 'Chrome', value: 'Chrome' },

  { label: 'Black Nickel (+$50)', value: 'Black Nickel' },

  { label: 'Brass / Gold (+$150)', value: 'Brass/Gold' },
];

const hoopOptions = [
  {
    label: 'Die-Cast (Recommended)',

    value: 'Die-Cast',

    helperText: 'More focused attack, tighter note shape, and added control.',
  },

  {
    label: 'Triple Flange (-$100)',

    value: 'Triple Flange',

    helperText:
      'A more open feel with broader shell bloom and slightly looser response.',
  },
];

const bearingEdgeOptions = [
  {
    label: 'Balanced Hybrid Edge',

    value: 'Balanced Hybrid Edge',

    spec: '45° Inner / Medium Outer Roundover',

    helperText:
      'Best all-around FEUZØN voice. Balanced attack, body, and musical control.',
  },

  {
    label: 'Warm Hybrid Edge',

    value: 'Warm Hybrid Edge',

    spec: '30° Inner / Full Outer Roundover',

    helperText: 'Warmer and woodier with a broader, more shell-forward note.',
  },

  {
    label: 'Modern Precision Edge',

    value: 'Modern Precision Edge',

    spec: 'Double 45°',

    helperText:
      'Fastest and brightest option. Quicker articulation, stronger cut, and tighter definition.',
  },
];

const snareBedOptions = [
  {
    label: 'Standard',

    value: 'Standard',

    helperText:
      'Most balanced and versatile overall. The easiest all-around FEUZØN response.',
  },

  {
    label: 'Shallow',

    value: 'Shallow',

    helperText:
      'Slightly drier and firmer with less wire spread and a tighter feel.',
  },

  {
    label: 'Deep',

    value: 'Deep',

    helperText:
      'More snare engagement and lighter-touch sensitivity, especially at lower dynamics.',
  },
];

const finishSystemOptions = [
  {
    label: 'Natural Gloss',

    value: 'Natural Gloss',

    helperText:
      'Lets the exterior wood and natural scorch speak most directly with a polished gloss finish.',
  },

  {
    label: 'Stained Satin',

    value: 'Stained Satin',

    helperText:
      'A darker, moodier finish with a softer sheen and slightly more understated look.',
  },

  {
    label: 'Stained Gloss',

    value: 'Stained Gloss',

    helperText:
      'A richer stained finish with added depth, pop, and visual reflectivity.',
  },
];

const stainStyleOptions = [
  { label: 'Full Stain', value: 'full-stained' },

  { label: 'Faded Stain', value: 'faded-stained' },
];

const scorchOptions = [
  { label: 'Non-Scorched', value: 'non-scorched' },

  { label: 'Natural Scorched', value: 'scorched' },
];

const stainColorOptionsByWood = {
  Maple: [
    {
      label: 'Smoked Maple',

      value: 'smoked-maple',

      fileBase: 'smoked-maple',
    },

    {
      label: 'Maple Tobacco',

      value: 'maple-tobacco',

      fileBase: 'maple-tobacco',
    },

    {
      label: 'Blackened Maple',

      value: 'blackened-maple',

      fileBase: 'blackened-maple',
    },
  ],

  Walnut: [
    {
      label: 'Dark Walnut',

      value: 'dark-walnut',

      fileBase: 'dark-walnut',
    },

    {
      label: 'Black Walnut',

      value: 'black-walnut',

      fileBase: 'black-walnut',
    },

    {
      label: 'Walnut Tobacco',

      value: 'walnut-tobacco',

      fileBase: 'walnut-tobacco',
    },
  ],

  Cherry: [
    {
      label: 'Aged Cherry',

      value: 'aged-cherry',

      fileBase: 'aged-cherry',
    },

    {
      label: 'Black Cherry',

      value: 'black-cherry',

      fileBase: 'black-cherry',
    },

    {
      label: 'Dark Cherry',

      value: 'dark-cherry',

      fileBase: 'dark-cherry',
    },
  ],
};

const FEUZON_SWATCHES = {
  Maple: {
    Natural: {
      'non-scorched':
        '/swatches/feuzon/maple/non-scorched/natural/no-stain-no-scorch.png',

      scorched: '/swatches/feuzon/maple/scorched/natural/no-stain-scorched.png',
    },

    'full-stained': {
      'smoked-maple': {
        'non-scorched':
          '/swatches/feuzon/maple/non-scorched/full-stained/smoked-maple.png',

        scorched:
          '/swatches/feuzon/maple/scorched/full-stained/smoked-maple.png',
      },

      'maple-tobacco': {
        'non-scorched':
          '/swatches/feuzon/maple/non-scorched/full-stained/maple-tobacco.png',

        scorched:
          '/swatches/feuzon/maple/scorched/full-stained/maple-tobacco.png',
      },

      'blackened-maple': {
        'non-scorched':
          '/swatches/feuzon/maple/non-scorched/full-stained/blackened-maple.png',

        scorched:
          '/swatches/feuzon/maple/scorched/full-stained/blackened-maple.png',
      },
    },

    'faded-stained': {
      'smoked-maple': {
        'non-scorched':
          '/swatches/feuzon/maple/non-scorched/faded-stained/smoked-maple.png',

        scorched:
          '/swatches/feuzon/maple/scorched/faded-stained/smoked-maple-fade.png',
      },

      'maple-tobacco': {
        'non-scorched':
          '/swatches/feuzon/maple/non-scorched/faded-stained/maple-tobacco.png',

        scorched:
          '/swatches/feuzon/maple/scorched/faded-stained/maple-tobacco-fade.png',
      },

      'blackened-maple': {
        'non-scorched':
          '/swatches/feuzon/maple/non-scorched/faded-stained/blackened-maple.png',

        scorched:
          '/swatches/feuzon/maple/scorched/faded-stained/blackened-maple-fade.png',
      },
    },
  },

  Walnut: {
    Natural: {
      'non-scorched':
        '/swatches/feuzon/walnut/non-scorched/natural/no-stain-no-scorch.png',

      scorched:
        '/swatches/feuzon/walnut/scorched/natural/no-stain-scorched.png',
    },

    'full-stained': {
      'dark-walnut': {
        'non-scorched':
          '/swatches/feuzon/walnut/non-scorched/full-stained/dark-walnut.png',

        scorched:
          '/swatches/feuzon/walnut/scorched/full-stained/dark-walnut.png',
      },

      'black-walnut': {
        'non-scorched':
          '/swatches/feuzon/walnut/non-scorched/full-stained/black-walnut.png',

        scorched:
          '/swatches/feuzon/walnut/scorched/full-stained/black-walnut.png',
      },

      'walnut-tobacco': {
        'non-scorched':
          '/swatches/feuzon/walnut/non-scorched/full-stained/walnut-tobacco.png',

        scorched:
          '/swatches/feuzon/walnut/scorched/full-stained/walnut-tobacco.png',
      },
    },

    'faded-stained': {
      'dark-walnut': {
        'non-scorched':
          '/swatches/feuzon/walnut/non-scorched/faded-stained/dark-walnut.png',

        scorched:
          '/swatches/feuzon/walnut/scorched/faded-stained/dark-walnut-fade.png',
      },

      'black-walnut': {
        'non-scorched':
          '/swatches/feuzon/walnut/non-scorched/faded-stained/black-walnut.png',

        scorched:
          '/swatches/feuzon/walnut/scorched/faded-stained/black-walnut-fade.png',
      },

      'walnut-tobacco': {
        'non-scorched':
          '/swatches/feuzon/walnut/non-scorched/faded-stained/walnut-tobacco.png',

        scorched:
          '/swatches/feuzon/walnut/scorched/faded-stained/walnut-tobacco-fade.png',
      },
    },
  },

  Cherry: {
    Natural: {
      'non-scorched':
        '/swatches/feuzon/cherry/non-scorched/natural/no-stain-no-scorch.png',

      scorched:
        '/swatches/feuzon/cherry/scorched/natural/no-stain-scorched.png',
    },

    'full-stained': {
      'aged-cherry': {
        'non-scorched':
          '/swatches/feuzon/cherry/non-scorched/full-stained/aged-cherry.png',

        scorched:
          '/swatches/feuzon/cherry/scorched/full-stained/aged-cherry.png',
      },

      'black-cherry': {
        'non-scorched':
          '/swatches/feuzon/cherry/non-scorched/full-stained/black-cherry.png',

        scorched:
          '/swatches/feuzon/cherry/scorched/full-stained/black-cherry.png',
      },

      'dark-cherry': {
        'non-scorched':
          '/swatches/feuzon/cherry/non-scorched/full-stained/dark-cherry.png',

        scorched:
          '/swatches/feuzon/cherry/scorched/full-stained/dark-cherry.png',
      },
    },

    'faded-stained': {
      'aged-cherry': {
        'non-scorched':
          '/swatches/feuzon/cherry/non-scorched/faded-stained/aged-cherry.png',

        scorched:
          '/swatches/feuzon/cherry/scorched/faded-stained/aged-cherry-fade.png',
      },

      'black-cherry': {
        'non-scorched':
          '/swatches/feuzon/cherry/non-scorched/faded-stained/black-cherry.png',

        scorched:
          '/swatches/feuzon/cherry/scorched/faded-stained/black-cherry-fade.png',
      },

      'dark-cherry': {
        'non-scorched':
          '/swatches/feuzon/cherry/non-scorched/faded-stained/dark-cherry.png',

        scorched:
          '/swatches/feuzon/cherry/scorched/faded-stained/dark-cherry-fade.png',
      },
    },
  },
};

const hardwareUpchargeMap = {
  Chrome: 0,

  'Black Nickel': 50,

  'Brass/Gold': 150,
};

const hoopUpchargeMap = {
  'Die-Cast': 0,

  'Triple Flange': -100,
};

const bearingEdgeSpecMap = {
  'Balanced Hybrid Edge': '45° Inner / Medium Outer Roundover',

  'Warm Hybrid Edge': '30° Inner / Full Outer Roundover',

  'Modern Precision Edge': 'Double 45°',
};

const normalizeDepthValue = (value) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return String(value || '').trim();

  return num.toFixed(1);
};

const buildFeuzonCartId = ({
  stripePriceId,
  size,
  depth,
  lugs,
  staveQuantity,
  outerShell,
  innerStave,
  hardwareColor,
  hoopType,
  snareBed,
  bearingEdge,
  finishSystem,
  stainStyle,
  scorchStyle,
  stainColor,
}) =>
  [
    'feuzon',
    stripePriceId || 'fallback',
    size,
    depth,
    lugs,
    staveQuantity,
    outerShell,
    innerStave,
    hardwareColor,
    hoopType,
    snareBed,
    bearingEdge,
    finishSystem,
    stainStyle,
    scorchStyle,
    stainColor,
  ]
    .map((part) => String(part || '').replace(/\s+/g, '-'))
    .join('-');

const getBearingEdgeMeta = (value) =>
  bearingEdgeOptions.find((option) => option.value === value) ||
  bearingEdgeOptions[0];

const getSnareBedMeta = (value) =>
  snareBedOptions.find((option) => option.value === value) ||
  snareBedOptions[0];

const getHoopMeta = (value) =>
  hoopOptions.find((option) => option.value === value) || hoopOptions[0];

const getFinishSystemMeta = (value) =>
  finishSystemOptions.find((option) => option.value === value) ||
  finishSystemOptions[0];

const getShellComboNarrative = (outerShell, innerStave) => {
  const comboMap = {
    Maple: {
      'Walnut + Birch':
        'Maple keeps the outer shell articulate and fast, while Walnut + Birch adds low-mid body and balanced internal focus.',

      'Oak + Cherry':
        'Maple keeps the attack clean, while Oak + Cherry adds density, punch, and a warmer wood center.',

      'Maple + Bubinga':
        'A more immediate maple-forward voice, reinforced by Bubinga for added weight and authority.',
    },

    Walnut: {
      'Mahogany + Cherry':
        'Walnut leans darker and richer, while Mahogany + Cherry deepens warmth and vintage-style fullness.',

      'Walnut + Padauk':
        'A richer outer voice with a firmer, more projected inner response and stronger note shape.',

      'Oak + Wenge':
        'A dense, authoritative pairing built for stronger projection, darker tone, and added control.',
    },

    Cherry: {
      'Birch + Maple':
        'Cherry adds warmth and musical sweetness, while Birch + Maple keeps the interior articulate and balanced.',

      'Zebrawood + Mahogany':
        'Cherry keeps the note musical and broad while Zebrawood + Mahogany adds texture, weight, and complexity.',

      'Padauk + Ash':
        'A lively outer shell with a more aggressive inner response and added crack through the center hit.',
    },
  };

  return (
    comboMap?.[outerShell]?.[innerStave] ||
    `${outerShell} exterior paired with ${innerStave} interior for a layered hybrid response.`
  );
};

const buildFeuzonVoiceRead = ({
  size,

  depth,

  lugs,

  staveOption,

  outerShell,

  innerStave,

  hardwareColor,

  hoopType,

  snareBed,

  bearingEdge,

  finishSystem,

  scorchStyle,

  stainStyle,

  stainColor,

  summaryMatch,
}) => {
  const numericSize = Number(size || 12);

  const numericDepth = Number(depth || 5);

  let profile = {
    attack: 8.0,

    sustain: 8.1,

    warmth: 7.8,

    projection: 8.4,

    brightness: 7.2,

    sensitivity: 7.6,

    control: 7.2,
  };

  if (numericDepth <= 5.5) {
    profile.attack += 0.35;

    profile.sensitivity += 0.35;

    profile.sustain -= 0.4;

    profile.control += 0.1;
  }

  if (numericDepth >= 6.5) {
    profile.sustain += 0.45;

    profile.warmth += 0.25;

    profile.projection += 0.25;
  }

  if (numericDepth >= 7) {
    profile.sustain += 0.3;

    profile.warmth += 0.25;

    profile.attack -= 0.05;
  }

  if (numericSize === 13) {
    profile.projection += 0.15;

    profile.warmth += 0.1;
  }

  if (numericSize === 14) {
    profile.warmth += 0.35;

    profile.projection += 0.45;

    profile.brightness -= 0.15;
  }

  if (numericSize === 15) {
    profile.warmth += 0.5;

    profile.projection += 0.6;

    profile.sustain += 0.25;

    profile.brightness -= 0.2;
  }

  if (String(lugs) === '10') {
    profile.control += 0.35;

    profile.attack += 0.15;

    profile.sensitivity -= 0.1;
  }

  if (outerShell === 'Walnut') {
    profile.warmth += 0.22;

    profile.brightness -= 0.1;
  }

  if (outerShell === 'Cherry') {
    profile.warmth += 0.14;

    profile.sustain += 0.12;
  }

  if (innerStave.includes('Birch')) {
    profile.attack += 0.12;

    profile.control += 0.08;
  }

  if (innerStave.includes('Oak')) {
    profile.projection += 0.16;

    profile.control += 0.12;
  }

  if (innerStave.includes('Mahogany')) {
    profile.warmth += 0.16;

    profile.sustain += 0.08;
  }

  if (innerStave.includes('Padauk')) {
    profile.attack += 0.12;

    profile.projection += 0.16;
  }

  if (innerStave.includes('Wenge')) {
    profile.control += 0.16;

    profile.brightness -= 0.08;
  }

  if (innerStave.includes('Bubinga')) {
    profile.projection += 0.18;

    profile.warmth += 0.1;
  }

  if (hoopType === 'Die-Cast') {
    profile.attack += 0.45;

    profile.control += 0.55;

    profile.sustain -= 0.2;
  } else {
    profile.sustain += 0.25;

    profile.sensitivity += 0.15;

    profile.control -= 0.15;
  }

  if (bearingEdge === 'Balanced Hybrid Edge') {
    profile.attack += 0.1;

    profile.control += 0.15;

    profile.warmth += 0.1;
  }

  if (bearingEdge === 'Warm Hybrid Edge') {
    profile.warmth += 0.4;

    profile.sustain += 0.2;

    profile.brightness -= 0.25;

    profile.control -= 0.05;
  }

  if (bearingEdge === 'Modern Precision Edge') {
    profile.attack += 0.35;

    profile.brightness += 0.25;

    profile.control += 0.25;

    profile.sustain -= 0.1;
  }

  if (snareBed === 'Shallow') {
    profile.control += 0.25;

    profile.sensitivity -= 0.25;
  }

  if (snareBed === 'Deep') {
    profile.sensitivity += 0.45;

    profile.attack += 0.1;

    profile.control -= 0.1;
  }

  if (scorchStyle === 'scorched') {
    profile.warmth += 0.1;

    profile.control += 0.05;
  }

  if (finishSystem === 'Stained Satin') {
    profile.warmth += 0.06;

    profile.control += 0.04;
  }

  if (finishSystem === 'Stained Gloss') {
    profile.projection += 0.04;
  }

  profile.brightness += 0.12;

  profile.attack += 0.08;

  if (hardwareColor === 'Black Nickel') {
    profile.control += 0.1;
  }

  if (hardwareColor === 'Brass/Gold') {
    profile.warmth += 0.15;
  }

  profile = {
    attack: clampAxis(profile.attack),

    sustain: clampAxis(profile.sustain),

    warmth: clampAxis(profile.warmth),

    projection: clampAxis(profile.projection),

    brightness: clampAxis(profile.brightness),

    sensitivity: clampAxis(profile.sensitivity),

    control: clampAxis(profile.control),
  };

  let highlightedCharacteristics =
    'A hybrid FEUZØN voice with articulate front-end response, layered body, and modern note shape that still carries depth under the stick.';

  if (numericDepth <= 5.5 && hoopType === 'Die-Cast') {
    highlightedCharacteristics =
      'A quicker FEUZØN configuration with strong front-end definition, sharper articulation, and a tighter modern crack.';
  } else if (numericDepth >= 6.5) {
    highlightedCharacteristics =
      'A deeper FEUZØN build with broader body, richer shell bloom, and more dimensional weight through the full note.';
  } else if (snareBed === 'Deep') {
    highlightedCharacteristics =
      'A more touch-responsive FEUZØN setup with added snare sensitivity and lively ghost-note behavior without losing center impact.';
  }

  if (bearingEdge === 'Warm Hybrid Edge') {
    highlightedCharacteristics =
      'A warmer, broader FEUZØN direction with more shell note, softer front-edge feel, and a more seasoned response.';
  }

  if (bearingEdge === 'Modern Precision Edge') {
    highlightedCharacteristics =
      'A tighter, faster FEUZØN direction with stronger articulation, brighter cut, and a more modern precision feel.';
  }

  let primaryGenre = 'Alternative / session / modern roots';

  if (numericDepth <= 5.5) primaryGenre = 'Pop / funk / session';

  if (numericDepth >= 6.5) primaryGenre = 'Rock / alternative / cinematic';

  if (numericDepth >= 7 && String(lugs) === '10') {
    primaryGenre = 'Rock / modern worship / cinematic session';
  }

  let recordingMic = 'Balanced condenser or dynamic / condenser blend';

  if (numericDepth <= 5.5) {
    recordingMic = 'Condenser-forward setup for articulation and snap';
  }

  if (numericDepth >= 6.5) {
    recordingMic = 'Dynamic + fuller condenser pairing for body and note shape';
  }

  let playingSituation =
    'A balanced FEUZØN response with layered shell tone, strong center impact, and broad tuning flexibility.';

  if (hoopType === 'Die-Cast') {
    playingSituation =
      'A more focused FEUZØN response with stronger attack, quicker note shape, and firmer containment.';
  }

  if (snareBed === 'Deep') {
    playingSituation =
      'A more touch-responsive FEUZØN setup that opens up more easily at lower dynamics while staying defined in the center.';
  }

  let feelRead =
    'A hybrid-shell build that leans modern, articulate, and dimensional without giving up body.';

  if (hardwareColor === 'Brass/Gold') {
    feelRead =
      'A richer visual lean with a slightly warmer, more elevated overall character.';
  }

  if (bearingEdge === 'Warm Hybrid Edge') {
    feelRead =
      'A warmer, more wood-forward FEUZØN direction with a broader and more seasoned feel under the stick.';
  }

  if (bearingEdge === 'Modern Precision Edge') {
    feelRead =
      'A tighter, more modern FEUZØN direction with quicker articulation and stronger front-end definition.';
  }

  if (finishSystem === 'Stained Satin') {
    feelRead =
      'A darker, more understated finish direction that leans moodier and more organic.';
  }

  if (finishSystem === 'Stained Gloss') {
    feelRead =
      'A richer stained presentation with stronger visual depth and a more polished look.';
  }

  let secondaryGenres = ['Modern country', 'Session work', 'Alt-pop'];

  if (numericDepth >= 6.5) {
    secondaryGenres = ['Alternative rock', 'Modern worship', 'Cinematic'];
  }

  if (numericDepth <= 5.5) {
    secondaryGenres = ['Neo-soul', 'Pop session', 'Funk'];
  }

  if (
    summaryMatch &&
    typeof summaryMatch.highlightedCharacteristics === 'string' &&
    summaryMatch.highlightedCharacteristics.trim()
  ) {
    highlightedCharacteristics = summaryMatch.highlightedCharacteristics;
  }

  if (summaryMatch?.primaryGenre) primaryGenre = summaryMatch.primaryGenre;

  if (summaryMatch?.recordingMic) recordingMic = summaryMatch.recordingMic;

  if (summaryMatch?.playingSituation)
    playingSituation = summaryMatch.playingSituation;

  if (Array.isArray(summaryMatch?.secondaryGenres)) {
    secondaryGenres = summaryMatch.secondaryGenres;
  }

  const finishRead =
    finishSystem === 'Natural Gloss'
      ? 'Natural gloss'
      : `${stainColor || 'Stained'} ${stainStyle === 'faded-stained' ? 'faded' : 'full'} ${finishSystem === 'Stained Satin' ? 'satin' : 'gloss'}`;

  return {
    highlightedCharacteristics,

    primaryGenre,

    recordingMic,

    playingSituation,

    feelRead,

    secondaryGenres,

    profile,

    specRead: `${size}" x ${depth}" • ${lugs} lugs • ${staveOption} • ${outerShell} / ${innerStave} • ${hardwareColor} • ${hoopType} • ${snareBed} snare bed • ${scorchStyle === 'scorched' ? 'Natural scorched' : 'Non-scorched'} exterior • ${finishRead} • Trick GS007 • ${bearingEdgeSpecMap[bearingEdge] || bearingEdge} • PureSound wires chosen by craftsman • Remo Controlled Sound Coated batter • Remo Ambassador Snare Side`,
  };
};

const FeuzonProductDetail = () => {
  const navigate = useNavigate();

  const { addToCart, removeFromCart, cart } = useCart();

  const [product, setProduct] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [size, setSize] = useState('12');

  const [depth, setDepth] = useState('5.0');

  const [outerShell, setOuterShell] = useState('Maple');

  const [innerStave, setInnerStave] = useState('Walnut + Birch');

  const [lugs, setLugs] = useState('8');

  const [staveOption, setStaveOption] = useState('');

  const [staveQuantities, setStaveQuantities] = useState([]);

  const [staveQuantity, setStaveQuantity] = useState(16);

  const [hardwareColor, setHardwareColor] = useState('Chrome');

  const [hoopType, setHoopType] = useState('Die-Cast');

  const [snareBed, setSnareBed] = useState('Standard');

  const [bearingEdge, setBearingEdge] = useState('Balanced Hybrid Edge');

  const [finishSystem, setFinishSystem] = useState('Natural Gloss');

  const [stainStyle, setStainStyle] = useState('full-stained');

  const [scorchStyle, setScorchStyle] = useState('scorched');

  const [stainColor, setStainColor] = useState('smoked-maple');

  const finishTorchDepth = 'Natural Toasted / Torch-Tuned';

  const throwOff = 'Trick GS007';

  const batterHead = 'Remo Controlled Sound Coated';

  const snareSideHead = 'Remo Ambassador Snare Side';

  const [totalPrice, setTotalPrice] = useState(1050);

  const [stripePriceId, setStripePriceId] = useState(null);

  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});

  const [productInCart, setProductInCart] = useState(false);

  const [buttonText, setButtonText] = useState('Add to Cart');

  const [cartItemId, setCartItemId] = useState(null);

  const [chartView, setChartView] = useState('spider');

  const [openBuilderSection, setOpenBuilderSection] = useState('construction');

  const stainColorOptions = useMemo(
    () => stainColorOptionsByWood[outerShell] || [],

    [outerShell]
  );

  useEffect(() => {
    if (finishSystem === 'Natural Gloss') {
      return;
    }

    const currentOptions = stainColorOptionsByWood[outerShell] || [];

    if (!currentOptions.find((option) => option.value === stainColor)) {
      setStainColor(currentOptions[0]?.value || '');
    }
  }, [outerShell, finishSystem, stainColor]);

  const swatchPreviewImage = useMemo(() => {
    const shellGroup = FEUZON_SWATCHES[outerShell];

    if (!shellGroup) return null;

    if (finishSystem === 'Natural Gloss') {
      return shellGroup.Natural?.[scorchStyle] || null;
    }

    return shellGroup?.[stainStyle]?.[stainColor]?.[scorchStyle] || null;
  }, [outerShell, finishSystem, stainStyle, scorchStyle, stainColor]);

  const productImage =
    'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Ffeuzon%2F67c255d1-a9ca-4f5d-80af-ddeee6a424e1_IMG_6133-1.webp?alt=media&token=25abd621-5194-42d1-aad1-46804156ada5';

  const selectedBearingEdgeMeta = useMemo(
    () => getBearingEdgeMeta(bearingEdge),

    [bearingEdge]
  );

  const selectedSnareBedMeta = useMemo(
    () => getSnareBedMeta(snareBed),

    [snareBed]
  );

  const selectedHoopMeta = useMemo(() => getHoopMeta(hoopType), [hoopType]);

  const selectedFinishSystemMeta = useMemo(
    () => getFinishSystemMeta(finishSystem),

    [finishSystem]
  );

  const shellComboNarrative = useMemo(
    () => getShellComboNarrative(outerShell, innerStave),

    [outerShell, innerStave]
  );

  const feuzonHighlights = [
    'Steam-bent exterior with voiced stave interior.',

    'Fast, articulate, modern Ober response.',

    'Balanced Hybrid, Warm Hybrid, or Modern Precision bearing edge.',

    '12", 13", 14", and 15" build sizes.',

    'Hundreds of FEUZØN core voicing paths.',

    'Die-cast or triple-flange hoop response.',

    'Chrome, Black Nickel, or Brass / Gold hardware.',

    'Natural gloss, stained satin, or stained gloss finish systems.',

    'Controlled scorching and torch-tuned stave interior.',

    'Trick GS007 throw-off and craftsman-selected PureSound wires.',
  ];

  const resolvedStainStyle =
    finishSystem === 'Natural Gloss' ? 'natural' : stainStyle;

  const resolvedStainColor =
    finishSystem === 'Natural Gloss' ? 'none' : stainColor;

  const constructionSummary = `${size}" x ${depth}" • ${outerShell} / ${innerStave} • ${staveOption}`;

  const finishSummary =
    finishSystem === 'Natural Gloss'
      ? `${finishSystem} • ${scorchStyle === 'scorched' ? 'Natural Scorched' : 'Non-Scorched'}`
      : `${finishSystem} • ${stainStyle === 'faded-stained' ? 'Faded' : 'Full'} • ${stainColor}`;

  const hardwareSummary = `${hardwareColor} • ${hoopType} • ${bearingEdge} • ${snareBed}`;

  const currentCartId = useMemo(
    () =>
      buildFeuzonCartId({
        stripePriceId,

        size,

        depth,

        lugs,

        staveQuantity,

        outerShell,

        innerStave,

        hardwareColor,

        hoopType,

        snareBed,

        bearingEdge,

        finishSystem,

        stainStyle: resolvedStainStyle,

        scorchStyle,

        stainColor: resolvedStainColor,
      }),

    [
      stripePriceId,

      size,

      depth,

      lugs,

      staveQuantity,

      outerShell,

      innerStave,

      hardwareColor,

      hoopType,

      snareBed,

      bearingEdge,

      finishSystem,

      resolvedStainStyle,

      scorchStyle,

      resolvedStainColor,
    ]
  );

  const chartValues = useMemo(
    () =>
      AXIS_META.map(({ key }) =>
        selectedDrumSummary?.profile?.[key] != null
          ? Number(selectedDrumSummary.profile[key])
          : 5
      ),

    [selectedDrumSummary]
  );

  const chartBarData = useMemo(
    () =>
      AXIS_META.reduce((acc, axis) => {
        acc[axis.key] =
          selectedDrumSummary?.profile?.[axis.key] != null
            ? Number(selectedDrumSummary.profile[axis.key])
            : 5;

        return acc;
      }, {}),

    [selectedDrumSummary]
  );

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);

      try {
        const productRef = doc(db, 'products', 'feuzon');

        const snap = await getDoc(productRef);

        if (snap.exists()) {
          setProduct(snap.data());
        } else {
          console.error('❌ Product doc not found: products/feuzon');
        }
      } catch (err) {
        console.error('❌ Error fetching feuzon product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, []);

  useEffect(() => {
    const validLugs = lugOptions[size] || [];

    if (!validLugs.includes(lugs)) {
      setLugs(validLugs[0] || '8');
    }
  }, [size, lugs]);

  useEffect(() => {
    const validDepths = Object.keys(depthPrices[size] || {});

    if (!validDepths.includes(depth)) {
      setDepth(validDepths[0] || '5.0');
    }
  }, [size, depth]);

  useEffect(() => {
    const innerOptions = shellOptions[outerShell] || [];

    if (!innerOptions.includes(innerStave)) {
      setInnerStave(innerOptions[0] || '');
    }
  }, [outerShell, innerStave]);

  useEffect(() => {
    const options = staveMapping[size]?.[Number(lugs)] || [];

    setStaveQuantities(options);

    if (!options.includes(staveOption)) {
      setStaveOption(options[0] || '');
    }
  }, [size, lugs, staveOption]);

  useEffect(() => {
    const qtyFromLabel = Number(
      String(staveOption || '')
        .split(' - ')[0]
        .replace(/\D/g, '')
    );

    setStaveQuantity(
      Number.isFinite(qtyFromLabel) && qtyFromLabel > 0 ? qtyFromLabel : 16
    );
  }, [staveOption]);

  useEffect(() => {
    const normalizedSize = String(size).trim();

    const normalizedDepth = normalizeDepthValue(depth);

    const list = feuzonSummaries?.pricingOptions || [];

    const matchedPricing =
      list.find(
        (o) =>
          String(o.size).trim() === normalizedSize &&
          String(o.depth).trim() === normalizedDepth &&
          String(o.lugQuantity) === String(lugs)
      ) ||
      list.find(
        (o) =>
          String(o.size).trim() === normalizedSize &&
          String(o.depth).trim() === normalizedDepth
      ) ||
      list.find((o) => String(o.size).trim() === normalizedSize);

    const summaryBasePrice =
      matchedPricing?.price ??
      (basePrices[normalizedSize] || 0) +
        (depthPrices[normalizedSize]?.[normalizedDepth] || 0);

    const resolvedBasePrice =
      summaryBasePrice +
      (hardwareUpchargeMap[hardwareColor] || 0) +
      (hoopUpchargeMap[hoopType] || 0);

    const resolvedStripePriceId = matchedPricing?.stripePriceId || null;

    setTotalPrice(resolvedBasePrice);

    setStripePriceId(resolvedStripePriceId);

    const formattedSize = `${size}"`;

    const formattedDepth = `${depth}"`;

    const formattedBasePrice = `$${resolvedBasePrice}`;

    const formattedLugs = `${lugs} Lugs`;

    const formattedOuterShell = outerShell.trim();

    const formattedInnerStave = innerStave.trim();

    const staveParts = String(staveOption || '').split(' - ');

    const formattedStaveQuantity = staveParts[0]?.trim() || `${staveQuantity}`;

    const formattedStaveThickness = staveParts[1]?.trim() || '';

    const generatedKey = `${formattedSize} - Base Price: ${formattedBasePrice}-${formattedDepth}-${formattedLugs}-${formattedStaveQuantity} - ${formattedStaveThickness}-${formattedOuterShell}-${formattedInnerStave}`;

    const normalizeKey = (key) =>
      String(key || '')
        .toLowerCase()

        .replace(/\s+/g, ' ')

        .trim();

    const availableKeys = Object.keys(feuzonSummaries || {}).filter(
      (key) => key !== 'pricingOptions'
    );

    let summaryMatch = null;

    const exactMatchIndex = availableKeys

      .map(normalizeKey)

      .indexOf(normalizeKey(generatedKey));

    if (exactMatchIndex !== -1) {
      summaryMatch = feuzonSummaries[availableKeys[exactMatchIndex]];
    } else {
      const closestMatchKey = availableKeys.find((key) => {
        const normalizedKey = normalizeKey(key);

        return (
          normalizedKey.includes(formattedSize.toLowerCase()) &&
          normalizedKey.includes(String(resolvedBasePrice))
        );
      });

      if (closestMatchKey) {
        summaryMatch = feuzonSummaries[closestMatchKey];
      }
    }

    setSelectedDrumSummary(
      buildFeuzonVoiceRead({
        size,

        depth,

        lugs,

        staveOption,

        outerShell,

        innerStave,

        hardwareColor,

        hoopType,

        snareBed,

        bearingEdge,

        finishSystem,

        scorchStyle,

        stainStyle,

        stainColor:
          stainColorOptions.find((item) => item.value === stainColor)?.label ||
          stainColor,

        summaryMatch,
      })
    );
  }, [
    size,

    depth,

    lugs,

    staveOption,

    staveQuantity,

    outerShell,

    innerStave,

    hardwareColor,

    hoopType,

    snareBed,

    bearingEdge,

    finishSystem,

    scorchStyle,

    stainStyle,

    stainColor,

    stainColorOptions,
  ]);

  useEffect(() => {
    const matchingItem = cart.find((item) => item.id === currentCartId);

    if (matchingItem) {
      setProductInCart(true);

      setCartItemId(matchingItem.id);

      setButtonText('In Cart');
    } else {
      setProductInCart(false);

      setCartItemId(null);

      setButtonText('Add to Cart');
    }
  }, [cart, currentCartId]);

  const handleSizeChange = (e) => {
    const newSize = e.target.value;

    setSize(newSize);

    setDepth(Object.keys(depthPrices[newSize])[0]);

    const nextLugs = lugOptions[newSize][0];

    setLugs(nextLugs);

    const nextStaves = staveMapping[newSize]?.[Number(nextLugs)] || [];

    setStaveOption(nextStaves[0] || '');
  };

  const handleDepthChange = (e) => {
    setDepth(e.target.value);
  };

  const handleLugChange = (e) => {
    const newLug = e.target.value;

    setLugs(newLug);

    const nextStaves = staveMapping[size]?.[Number(newLug)] || [];

    setStaveOption(nextStaves[0] || '');
  };

  const handleStaveChange = (e) => {
    setStaveOption(e.target.value);
  };

  const handleAddToCart = async () => {
    if (!product) {
      toast.error('❌ Product data not loaded yet.');

      return;
    }

    if (product.status !== 'active' && !product.isPreOrder) {
      toast.error('❌ This drum is currently unavailable.');

      return;
    }

    const cartItem = {
      id: currentCartId,

      productId: 'feuzon',

      name: 'FEUZØN',

      category: 'artisan',

      stripePriceId: stripePriceId || '',

      price: totalPrice,

      quantity: 1,

      image: productImage,

      images: [productImage],

      size,

      depth,

      lugQuantity: lugs,

      staveQuantity,

      outerShell,

      innerStave,

      hardwareColor,

      hoopType,

      snareBed,

      bearingEdge,

      finishSystem,

      stainStyle: resolvedStainStyle,

      scorchStyle,

      stainColor: resolvedStainColor,

      finishTorchDepth,

      throwOff,

      batterHead,

      snareSideHead,

      config: {
        series: 'FEUZØN',

        size,

        depth,

        lugQuantity: lugs,

        staveQuantity,

        outerShell,

        innerStave,

        hardwareColor,

        hoopType,

        snareBed,

        bearingEdge,

        finishSystem,

        stainStyle,

        scorchStyle,

        stainColor,

        finishTorchDepth,

        throwOff,

        batterHead,

        snareSideHead,
      },
    };

    try {
      await addToCart(cartItem, cartItem);

      toast.success('🛒 Item added to cart!');

      setProductInCart(true);

      setCartItemId(currentCartId);

      setButtonText('In Cart');
    } catch (error) {
      console.error('❌ Error adding to cart:', error);

      toast.error('❌ Failed to add item to cart.');
    }
  };

  const handleRemoveFromCart = async () => {
    try {
      await removeFromCart(cartItemId || currentCartId);

      toast.success('🗑️ Item removed from cart.');

      setProductInCart(false);

      setCartItemId(null);

      setButtonText('Add to Cart');
    } catch (error) {
      console.error('❌ Error removing item:', error);

      toast.error('❌ Failed to remove item.');
    }
  };

  return (
    <div className="feuzon-product-detail">
      <img
        src="/resized-logos/feuzon-white.png"
        alt="FEUZØN Series"
        className="feuzon-header-image"
      />

      <div className="feuzon-hero-shell">
        <div className="feuzon-layout-top">
          <div className="feuzon-left-column">
            <div className="feuzon-product-image-card">
              <div className="feuzon-product-image">
                <img src={productImage} alt="FEUZØN Snare Drum" />
              </div>
            </div>

<div className="feuzon-overview-card">

  <p className="feuzon-story-lede">

    FEUZØN is built for players who want the immediacy and focus of a

    modern drum, but with more depth, complexity, and character beneath

    the stick.

  </p>

  <div className="feuzon-overview-copy">

    <p className="feuzon-story-copy">

      By pairing a steam-bent outer shell with a voiced stave interior,

      FEUZØN creates a distinctive response that feels articulate up

      front, full through the body, and alive across a wide tuning range.

    </p>

    <p className="feuzon-story-copy">

      It sits confidently between precision and personality — controlled

      when needed, expressive when pushed, and visually striking from

      every angle.

    </p>

  </div>

  <div className="feuzon-overview-divider" />

  <h3 className="feuzon-overview-highlights-title">

    Key Build Highlights

  </h3>

  <ul className="feuzon-overview-highlights">

    {feuzonHighlights.map((item) => (

      <li key={item}>{item}</li>

    ))}

  </ul>

  <p className="order-to-build-disclaimer feuzon-overview-disclaimer">

    *Each Ober Artisan drum is built to order. The instrument you

    receive will closely reflect the design shown, but wood figure,

    stain absorption, scorch response, and exact visual character will

    vary based on your final configuration.

  </p>

</div>
          </div>

          <aside className="feuzon-builder-card">
            <div className="feuzon-builder-head">
              <span className="feuzon-builder-kicker">Build your drum</span>

              <h2>Configure FEUZØN</h2>

              <p>
                Build your FEUZØN in three guided steps: select your
                construction, choose your finish, then refine hardware and
                response.
              </p>
            </div>

            <div className="feuzon-builder-sections">
              <div className="feuzon-builder-section">
                <button
                  type="button"
                  className={`feuzon-builder-section-toggle ${openBuilderSection === 'construction' ? 'is-open' : ''}`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'construction'
                        ? ''
                        : 'construction'
                    )
                  }
                >
                  <div className="feuzon-builder-section-heading">
                    <span className="feuzon-builder-section-step">1</span>

                    <div>
                      <h3>Select your construction</h3>

                      <p>{constructionSummary}</p>
                    </div>
                  </div>

                  <span className="feuzon-builder-section-chevron">
                    {openBuilderSection === 'construction' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'construction' && (
                  <div className="feuzon-builder-section-body">
                    <label htmlFor="size">Snare Size (Diameter)</label>

                    <select id="size" value={size} onChange={handleSizeChange}>
                      {Object.keys(basePrices).map((sizeOption) => (
                        <option key={sizeOption} value={sizeOption}>
                          {sizeOption}" - Base Price: ${basePrices[sizeOption]}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="depth">Depth</label>

                    <select
                      id="depth"
                      value={depth}
                      onChange={handleDepthChange}
                    >
                      {Object.keys(depthPrices[size]).map((depthOption) => (
                        <option key={depthOption} value={depthOption}>
                          {depthOption}"{' '}
                          {depthPrices[size][depthOption] > 0
                            ? `+ $${depthPrices[size][depthOption]}`
                            : ''}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="outerShell">
                      Exterior Shell (Steam Bent)
                    </label>

                    <select
                      id="outerShell"
                      value={outerShell}
                      onChange={(e) => setOuterShell(e.target.value)}
                    >
                      {Object.keys(shellOptions).map((shell) => (
                        <option key={shell} value={shell}>
                          {shell}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="innerStave">Interior Shell (Stave)</label>

                    <select
                      id="innerStave"
                      value={innerStave}
                      onChange={(e) => setInnerStave(e.target.value)}
                    >
                      {(shellOptions[outerShell] || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <p className="feuzon-select-helper">
                      {shellComboNarrative}
                    </p>

                    <label htmlFor="lugs">Lug Quantity</label>

                    <select id="lugs" value={lugs} onChange={handleLugChange}>
                      {(lugOptions[size] || []).map((lugOption) => (
                        <option key={lugOption} value={lugOption}>
                          {lugOption} Lugs
                        </option>
                      ))}
                    </select>

                    <label htmlFor="staves">
                      Stave Quantity &amp; Shell Thickness
                    </label>

                    <select
                      id="staves"
                      value={staveOption}
                      onChange={handleStaveChange}
                    >
                      {staveQuantities.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <div className="feuzon-builder-next-row">
                      <button
                        type="button"
                        className="feuzon-builder-next-button"
                        onClick={() => setOpenBuilderSection('finish')}
                      >
                        Continue to Finish
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="feuzon-builder-section">
                <button
                  type="button"
                  className={`feuzon-builder-section-toggle ${openBuilderSection === 'finish' ? 'is-open' : ''}`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'finish' ? '' : 'finish'
                    )
                  }
                >
                  <div className="feuzon-builder-section-heading">
                    <span className="feuzon-builder-section-step">2</span>

                    <div>
                      <h3>Choose your finish</h3>

                      <p>{finishSummary}</p>
                    </div>
                  </div>

                  <span className="feuzon-builder-section-chevron">
                    {openBuilderSection === 'finish' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'finish' && (
                  <div className="feuzon-builder-section-body">
                    <label htmlFor="finishSystem">Finish System</label>

                    <select
                      id="finishSystem"
                      value={finishSystem}
                      onChange={(e) => setFinishSystem(e.target.value)}
                    >
                      {finishSystemOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <p className="feuzon-select-helper">
                      {selectedFinishSystemMeta.helperText}
                    </p>

                    {finishSystem !== 'Natural Gloss' && (
                      <>
                        <label htmlFor="stainStyle">Stain Style</label>

                        <select
                          id="stainStyle"
                          value={stainStyle}
                          onChange={(e) => setStainStyle(e.target.value)}
                        >
                          {stainStyleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <label htmlFor="stainColor">Stain Color</label>

                        <select
                          id="stainColor"
                          value={stainColor}
                          onChange={(e) => setStainColor(e.target.value)}
                        >
                          {stainColorOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </>
                    )}

                    <label htmlFor="scorchStyle">Exterior Scorch</label>

                    <select
                      id="scorchStyle"
                      value={scorchStyle}
                      onChange={(e) => setScorchStyle(e.target.value)}
                    >
                      {scorchOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <p className="feuzon-select-helper">
                      Choose whether the exterior stays cleaner and more
                      restrained or leans further into FEUZØN’s scorched visual
                      character.
                    </p>

                    {swatchPreviewImage && (
                      <div className="feuzon-swatch-preview">
                        <img
                          src={swatchPreviewImage}
                          alt="Selected FEUZØN finish swatch"
                        />
                      </div>
                    )}

                    <p className="feuzon-swatch-disclaimer">
                      This preview is a general finish reference. Final
                      appearance may vary based on wood figure, stain
                      absorption, scorch response, lighting, and the unique
                      character of each shell. We’ll aim to get your drum as
                      close as possible to the selected preview.
                    </p>

                    <div className="feuzon-builder-next-row">
                      <button
                        type="button"
                        className="feuzon-builder-next-button"
                        onClick={() => setOpenBuilderSection('hardware')}
                      >
                        Continue to Hardware
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="feuzon-builder-section">
                <button
                  type="button"
                  className={`feuzon-builder-section-toggle ${openBuilderSection === 'hardware' ? 'is-open' : ''}`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'hardware' ? '' : 'hardware'
                    )
                  }
                >
                  <div className="feuzon-builder-section-heading">
                    <span className="feuzon-builder-section-step">3</span>

                    <div>
                      <h3>Choose your hardware & response</h3>

                      <p>{hardwareSummary}</p>
                    </div>
                  </div>

                  <span className="feuzon-builder-section-chevron">
                    {openBuilderSection === 'hardware' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'hardware' && (
                  <div className="feuzon-builder-section-body">
                    <label htmlFor="hardwareColor">Hardware Finish</label>

                    <select
                      id="hardwareColor"
                      value={hardwareColor}
                      onChange={(e) => setHardwareColor(e.target.value)}
                    >
                      {hardwareOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="hoopType">Hoop Type</label>

                    <select
                      id="hoopType"
                      value={hoopType}
                      onChange={(e) => setHoopType(e.target.value)}
                    >
                      {hoopOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <p className="feuzon-select-helper">
                      {selectedHoopMeta.helperText}
                    </p>

                    <label htmlFor="bearingEdge">Bearing Edge</label>

                    <select
                      id="bearingEdge"
                      value={bearingEdge}
                      onChange={(e) => setBearingEdge(e.target.value)}
                    >
                      {bearingEdgeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <p className="feuzon-select-helper">
                      <strong>{selectedBearingEdgeMeta.spec}</strong> —{' '}
                      {selectedBearingEdgeMeta.helperText}
                    </p>

                    <label htmlFor="snareBed">Snare Bed Depth</label>

                    <select
                      id="snareBed"
                      value={snareBed}
                      onChange={(e) => setSnareBed(e.target.value)}
                    >
                      {snareBedOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <p className="feuzon-select-helper">
                      {selectedSnareBedMeta.helperText}
                    </p>

                    <p className="feuzon-select-helper">
                      PureSound wires are selected by the craftsman to best fit
                      the build.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="feuzon-purchase-block">
              <p className="feuzon-detail-price">
                {formatCurrency(totalPrice)}
              </p>

              <p className="delivery-time">Estimated delivery: 7–10 weeks</p>

              {buttonText === 'In Cart' ? (
                <div className="artisan-cart-hover-container">
                  <button className="artisan-in-cart-button" disabled>
                    ✔ In Cart
                  </button>

                  <div className="artisan-cart-hover-options">
                    <span onClick={() => navigate('/cart')}>View Cart</span>

                    <span onClick={handleRemoveFromCart}>Remove</span>
                  </div>
                </div>
              ) : (
                <button
                  className="artisan-add-to-cart-button"
                  onClick={handleAddToCart}
                  disabled={isLoading || !product}
                  title={isLoading ? 'Loading...' : ''}
                >
                  Add to Cart
                </button>
              )}
            </div>
          </aside>
        </div>

        <section className="feuzon-summary-band">
          <div className="feuzon-read-card">
            <span className="feuzon-summary-kicker">
              Ober LegacyPrint™ Voice Read
            </span>

            <h3>Configuration snapshot</h3>

            <p className="feuzon-read-summary">
              {selectedDrumSummary?.highlightedCharacteristics}
            </p>

            <div className="feuzon-summary-grid">
              <div className="feuzon-summary-item">
                <span className="feuzon-summary-label">Primary Genre</span>

                <span className="feuzon-summary-value">
                  {selectedDrumSummary?.primaryGenre}
                </span>
              </div>

              <div className="feuzon-summary-item">
                <span className="feuzon-summary-label">Suggested Mic Lean</span>

                <span className="feuzon-summary-value">
                  {selectedDrumSummary?.recordingMic}
                </span>
              </div>

              <div className="feuzon-summary-item feuzon-summary-item-wide">
                <span className="feuzon-summary-label">Playing Situation</span>

                <span className="feuzon-summary-value">
                  {selectedDrumSummary?.playingSituation}
                </span>
              </div>

              <div className="feuzon-summary-item feuzon-summary-item-wide">
                <span className="feuzon-summary-label">Feel / Visual Lean</span>

                <span className="feuzon-summary-value">
                  {selectedDrumSummary?.feelRead}
                </span>
              </div>

              <div className="feuzon-summary-item feuzon-summary-item-wide">
                <span className="feuzon-summary-label">Secondary Lanes</span>

                <span className="feuzon-summary-value">
                  {Array.isArray(selectedDrumSummary?.secondaryGenres)
                    ? selectedDrumSummary.secondaryGenres.join(' • ')
                    : ''}
                </span>
              </div>

              <div className="feuzon-summary-item feuzon-summary-item-wide">
                <span className="feuzon-summary-label">Build Spec Read</span>

                <span className="feuzon-summary-value">
                  {selectedDrumSummary?.specRead}
                </span>
              </div>
            </div>
          </div>

          <div className="feuzon-chart-card">
            <div className="feuzon-chart-head">
              <div>
                <span className="feuzon-summary-kicker">Profile</span>

                <h3>Sound behavior</h3>
              </div>

              <div className="feuzon-chart-toggle">
                <button
                  type="button"
                  className={chartView === 'spider' ? 'is-active' : ''}
                  onClick={() => setChartView('spider')}
                >
                  Spider
                </button>

                <button
                  type="button"
                  className={chartView === 'bars' ? 'is-active' : ''}
                  onClick={() => setChartView('bars')}
                >
                  Bars
                </button>
              </div>
            </div>

            <div className="feuzon-chart-wrap">
              {chartView === 'spider' ? (
                <SpiderChart
                  data={chartValues}
                  labels={AXIS_META.map((axis) => axis.label)}
                  pointColors={AXIS_POINT_COLORS}
                />
              ) : (
                <BarChart data={chartBarData} min={4} />
              )}
            </div>

            <div className="feuzon-axis-summary">
              {AXIS_META.map((axis) => (
                <div key={axis.key} className="feuzon-axis-chip">
                  <span>{axis.label}</span>

                  <strong>
                    {selectedDrumSummary?.profile?.[axis.key] != null
                      ? Number(selectedDrumSummary.profile[axis.key]).toFixed(1)
                      : '5.0'}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeuzonProductDetail;
