import { useState, useEffect, useMemo, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';

import {
  Zap,
  Waves,
  Flame,
  Volume2,
  SunMedium,
  Feather,
  Crosshair,
} from 'lucide-react';

import { db } from '../firebaseConfig';

import { useCart } from '../context/CartContext';

import SpiderChart from './SpiderChart';

import BarChart from './BarChart';

import feuzonSummaries from '../data/feuzonSummaries';

import buildFeuzonVoiceRead from '../data/legacyPrint/buildFeuzonVoiceRead';

import LEGACYPRINT_BENCHMARK_CATALOG from '../data/legacyPrint/benchmarkCatalog';

import './FeuzonProductDetail.css';

import toast from 'react-hot-toast';

const AXIS_META = [
  { key: 'attack', label: 'Attack', icon: 'attack' },

  { key: 'sustain', label: 'Sustain', icon: 'sustain' },

  { key: 'warmth', label: 'Warmth', icon: 'warmth' },

  { key: 'projection', label: 'Projection', icon: 'projection' },

  { key: 'brightness', label: 'Brightness', icon: 'brightness' },

  { key: 'sensitivity', label: 'Sensitivity', icon: 'sensitivity' },

  { key: 'control', label: 'Control', icon: 'control' },
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

const AXIS_COLOR_BY_KEY = {
  attack: '#ff7448',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  projection: '#ffb53a',

  brightness: '#e7d98f',

  sensitivity: '#68d9df',

  control: '#9e8bff',
};

const AXIS_SUBLABELS = {
  attack: 'Quickness',

  sustain: 'Length',

  warmth: 'Body',

  projection: 'Throw',

  brightness: 'Top End',

  sensitivity: 'Response',

  control: 'Focus',
};

const AXIS_INSIGHT_COPY = {
  attack: {
    short: 'Fast front-end response with strong note definition.',

    detail:
      'Compared with the selected benchmark, this FEUZØN configuration speaks quickly and feels confident at the front of the note. Accents come forward with more immediacy and definition.',

    scaleLow:
      'Softer front-end response with less immediate crack. The drum feels rounder and more relaxed at the start of the note than the selected benchmark.',

    scaleHigh:
      'Sharper attack with stronger note definition and quicker front-edge response. The drum feels more immediate, modern, and assertive than the selected benchmark.',
  },

  sustain: {
    short: 'Controlled note length with a measured amount of bloom.',

    detail:
      'Compared with the selected benchmark, this reflects how long the shell wants to hold onto the note. Higher sustain feels broader and more lingering, while lower sustain feels shorter and more contained.',

    scaleLow:
      'Shorter decay and a quicker note exit. The drum feels tighter, drier, and more contained than the selected benchmark.',

    scaleHigh:
      'Longer bloom and more note extension. The shell feels more open, dimensional, and willing to hang in the air than the selected benchmark.',
  },

  warmth: {
    short: 'A fuller, richer body through the center of the voice.',

    detail:
      'Compared with the selected benchmark, this FEUZØN build leans into tonal weight and low-mid richness. It affects how grounded, seasoned, or broad the shell feels under the stick.',

    scaleLow:
      'Leaner body and less low-mid weight. The drum feels clearer, cleaner, and slightly more neutral through the middle than the selected benchmark.',

    scaleHigh:
      'Richer body and a fuller center to the note. The shell feels deeper, broader, and more substantial than the selected benchmark.',
  },

  projection: {
    short: 'Clear outward push with confident room presence.',

    detail:
      'Compared with the selected benchmark, projection reflects how assertively the shell throws the note into the room. It shapes how present the drum feels in live settings and how strongly the note carries.',

    scaleLow:
      'More intimate and less forceful in the room. The shell stays present, but feels more contained and closer to the player than the selected benchmark.',

    scaleHigh:
      'Stronger room presence and more outward push. The note carries farther and feels more commanding than the selected benchmark.',
  },

  brightness: {
    short: 'A measured amount of top-end edge and upper-register cut.',

    detail:
      'Compared with the selected benchmark, brightness controls how much sheen, snap, and upper-register edge sit on top of the drum’s core voice. It affects cut, perceived clarity, and tonal bite.',

    scaleLow:
      'Darker top-end with less snap and less sheen. The shell feels woodier, rounder, and more restrained than the selected benchmark.',

    scaleHigh:
      'More top-end edge, snap, and cut. The drum feels more open, articulate, and able to speak through a mix than the selected benchmark.',
  },

  sensitivity: {
    short: 'Responsive to lighter playing and subtle dynamic detail.',

    detail:
      'Compared with the selected benchmark, sensitivity reflects how easily the shell and wire response open up under lighter hands. It affects ghost notes, lower-dynamic articulation, and softer touch response.',

    scaleLow:
      'Needs a little more input to fully wake up. The drum feels firmer and more centered around medium-to-strong playing than the selected benchmark.',

    scaleHigh:
      'Opens up more easily at lower dynamics. The shell feels more alive under softer touch, ghost notes, and nuanced phrasing than the selected benchmark.',
  },

  control: {
    short: 'Shaped and contained in a way that feels easy to manage.',

    detail:
      'Compared with the selected benchmark, control reflects how organized the note feels. Higher control generally means a more disciplined response, tighter overtone behavior, and easier placement in a mix.',

    scaleLow:
      'More open and less contained. The note feels broader, freer, and a bit less disciplined than the selected benchmark.',

    scaleHigh:
      'Tighter note shape with more organized overtone behavior. The drum feels easier to place, manage, and keep composed than the selected benchmark.',
  },
};

const AXIS_IMPACT_FACTORS = {
  attack: [
    { label: 'Bearing edge', strength: 'strong' },

    { label: 'Hoop type', strength: 'strong' },

    { label: 'Shell depth', strength: 'medium' },

    { label: 'Lug count', strength: 'light' },
  ],

  sustain: [
    { label: 'Hoop type', strength: 'strong' },

    { label: 'Shell depth', strength: 'strong' },

    { label: 'Shell pairing', strength: 'medium' },

    { label: 'Stave thickness', strength: 'light' },
  ],

  warmth: [
    { label: 'Outer / inner shell pairing', strength: 'strong' },

    { label: 'Shell depth', strength: 'strong' },

    { label: 'Bearing edge', strength: 'medium' },

    { label: 'Finish direction', strength: 'light' },
  ],

  projection: [
    { label: 'Shell size', strength: 'strong' },

    { label: 'Shell depth', strength: 'strong' },

    { label: 'Hoop type', strength: 'medium' },

    { label: 'Shell pairing', strength: 'light' },
  ],

  brightness: [
    { label: 'Bearing edge', strength: 'strong' },

    { label: 'Hoop type', strength: 'strong' },

    { label: 'Finish direction', strength: 'medium' },

    { label: 'Shell pairing', strength: 'light' },
  ],

  sensitivity: [
    { label: 'Snare bed depth', strength: 'strong' },

    { label: 'Bearing edge', strength: 'strong' },

    { label: 'Shell depth', strength: 'medium' },

    { label: 'Hoop type', strength: 'light' },
  ],

  control: [
    { label: 'Hoop type', strength: 'strong' },

    { label: 'Bearing edge', strength: 'strong' },

    { label: 'Lug count', strength: 'medium' },

    { label: 'Shell thickness', strength: 'light' },
  ],
};

const DEFAULT_BENCHMARK_FAMILY_ID = 'ober-custom';

const DEFAULT_BENCHMARK_TYPE_ID = 'feuzon-hybrid-reference';

const DEFAULT_BENCHMARK_SIZE_ID = '14x6_0';

const DEFAULT_BENCHMARK_SIZE_LABEL = '14" x 6.0"';

const FEUZON_STANDARD_REFERENCE = {
  series: 'FEUZØN Standard Reference',

  benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,

  benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,

  benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,

  size: '14',

  depth: '6.0',

  lugs: '8',

  staveOption: '16 - 13mm',

  staveQuantity: 16,

  shellThickness: '13mm',

  shellConstruction: 'Steam-bent exterior with voiced stave interior',

  outerShell: 'Maple',

  innerStave: 'Walnut + Birch',

  hoopType: 'Die-Cast',

  hardwareColor: 'Chrome',

  bearingEdge: 'Balanced Hybrid Edge',

  bearingEdgeSpec: '45° Inner / Medium Outer Roundover',

  snareBed: 'Standard',

  finishSystem: 'Natural Gloss',

  scorchStyle: 'scorched',

  finish: 'Natural Scorched Gloss',

  throwOff: 'Trick GS007',

  batterHead: 'Remo Controlled Sound Coated',

  resonantHead: 'Remo Ambassador Hazy Snare Side',

  snareWires: 'PureSound Custom Pro Steel 20-Strand',

  tuning: 'Medium',

  muffling: 'None',
};

const FEUZON_REFERENCE_IMAGE_FALLBACK =
  '/legacyprint-benchmarks/ober-custom/ober-feuzon-maple.png';

const clampRangePosition = (value) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return 3;

  return Math.max(1, Math.min(5, num));
};

const getRangeMarkerLeft = (value) => {
  const clamped = clampRangePosition(value);

  return `${((clamped - 1) / 4) * 100}%`;
};

const getReferenceLabel = (selectedBenchmarkType, selectedBenchmarkSize) => {
  const typeLabel = selectedBenchmarkType?.typeLabel || 'FEUZØN reference drum';

  const sizeLabel = selectedBenchmarkSize?.label
    ? ` (${selectedBenchmarkSize.label})`
    : '';

  return `${typeLabel}${sizeLabel}`;
};

const buildFeuzonReferenceToneSummary = (
  summary,

  selectedBenchmarkType = null,

  selectedBenchmarkSize = null
) => {
  const profile = summary?.profile || {};

  const referenceLabel = getReferenceLabel(
    selectedBenchmarkType,

    selectedBenchmarkSize
  );

  const deltas = {
    attack: Number((Number(profile.attack ?? 5) - 5).toFixed(1)),

    sustain: Number((Number(profile.sustain ?? 5) - 5).toFixed(1)),

    warmth: Number((Number(profile.warmth ?? 5) - 5).toFixed(1)),

    projection: Number((Number(profile.projection ?? 5) - 5).toFixed(1)),

    brightness: Number((Number(profile.brightness ?? 5) - 5).toFixed(1)),

    sensitivity: Number((Number(profile.sensitivity ?? 5) - 5).toFixed(1)),

    control: Number((Number(profile.control ?? 5) - 5).toFixed(1)),
  };

  const phrases = [];

  if (deltas.attack > 0.35) phrases.push('a quicker front edge');
  else if (deltas.attack < -0.35) phrases.push('a rounder front edge');

  if (deltas.warmth > 0.35) phrases.push('a fuller center');
  else if (deltas.warmth < -0.35) phrases.push('a leaner center');

  if (deltas.brightness > 0.35) phrases.push('more top-end edge');
  else if (deltas.brightness < -0.35) phrases.push('a smoother top end');

  if (deltas.sustain > 0.35) phrases.push('a longer note tail');
  else if (deltas.sustain < -0.35) phrases.push('a shorter note tail');

  if (deltas.control > 0.35) phrases.push('more focus');
  else if (deltas.control < -0.35) phrases.push('a more open feel');

  if (deltas.sensitivity > 0.35) phrases.push('more touch response');
  else if (deltas.sensitivity < -0.35) {
    phrases.push('slightly less touch response');
  }

  if (!phrases.length) {
    return `Your current FEUZØN build reads very close to ${referenceLabel}. Use the Reference Drum selectors below to compare against a different benchmark.`;
  }

  const top = phrases.slice(0, 3);

  if (top.length === 1) {
    return `Your current FEUZØN build points toward ${top[0]} compared with ${referenceLabel}. Use the Reference Drum selectors below to compare against a different benchmark.`;
  }

  if (top.length === 2) {
    return `Your current FEUZØN build points toward ${top[0]} and ${top[1]} compared with ${referenceLabel}. Use the Reference Drum selectors below to compare against a different benchmark.`;
  }

  return `Your current FEUZØN build points toward ${top[0]}, ${top[1]}, and ${top[2]} compared with ${referenceLabel}. Use the Reference Drum selectors below to compare against a different benchmark.`;
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
  { label: 'Chrome', value: 'Chrome', description: 'Classic and clean.' },

  {
    label: 'Black Nickel',

    value: 'Black Nickel',

    description: 'Cooler and darker visual lean.',
  },

  {
    label: 'Brass / Gold',

    value: 'Brass/Gold',

    description: 'Richer, warmer premium statement.',
  },
];

const hoopOptions = [
  {
    label: 'Die-Cast',

    value: 'Die-Cast',

    helperText: 'More focused attack, tighter note shape, and added control.',
  },

  {
    label: 'Triple Flange',

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
    { label: 'Smoked Maple', value: 'smoked-maple', fileBase: 'smoked-maple' },

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
    { label: 'Dark Walnut', value: 'dark-walnut', fileBase: 'dark-walnut' },

    { label: 'Black Walnut', value: 'black-walnut', fileBase: 'black-walnut' },

    {
      label: 'Walnut Tobacco',

      value: 'walnut-tobacco',

      fileBase: 'walnut-tobacco',
    },
  ],

  Cherry: [
    { label: 'Aged Cherry', value: 'aged-cherry', fileBase: 'aged-cherry' },

    { label: 'Black Cherry', value: 'black-cherry', fileBase: 'black-cherry' },

    { label: 'Dark Cherry', value: 'dark-cherry', fileBase: 'dark-cherry' },
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

const finishUpchargeMap = {
  'Natural Satin': 0,

  'Natural Gloss': 100,

  'Stained Satin': 100,

  'Stained Gloss': 200,
};

const finishTimelineWeeksMap = {
  'Natural Satin': 0,

  'Natural Gloss': 1,

  'Stained Satin': 1,

  'Stained Gloss': 2,
};

const getFinishTimelineWeeks = (finishSystem) => {
  return finishTimelineWeeksMap[finishSystem] || 0;
};

const getEstimatedDeliveryLabel = (finishSystem) => {
  const addedWeeks = getFinishTimelineWeeks(finishSystem);

  const minWeeks = 7 + addedWeeks;

  const maxWeeks = 10 + addedWeeks;

  return `Estimated delivery: ${minWeeks}–${maxWeeks} weeks`;
};

const normalizeDepthValue = (value) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return String(value || '').trim();

  return num.toFixed(1);
};

const getReadableDelta = (delta) => {
  if (delta === 0) return '';

  if (delta > 0) return `+$${delta}`;

  return `-$${Math.abs(delta)}`;
};

const getDeltaClassName = (delta, isSelected = false) => {
  if (isSelected) return 'is-selected';

  if (delta > 0) return 'is-positive';

  if (delta < 0) return 'is-negative';

  return '';
};

const computeFeuzonPrice = ({
  size,

  depth,

  hardwareColor,

  hoopType,

  finishSystem,
}) => {
  let price = basePrices[String(size)] || 0;

  price += depthPrices[String(size)]?.[normalizeDepthValue(depth)] || 0;

  price += hardwareUpchargeMap[hardwareColor] || 0;

  price += hoopUpchargeMap[hoopType] || 0;

  price += finishUpchargeMap[finishSystem] || 0;

  return price;
};

const getStaveCountLabel = (option = '') => {
  const match = String(option).match(/^(\d+)/);

  return match ? `${match[1]} staves` : option;
};

const getStaveThicknessLabel = (option = '') => {
  const parts = String(option).split(' - ');

  return parts[1] || '';
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

const BENCHMARK_VOICE_RANGE_FALLBACKS = {
  'heritage-oak-reference': 2.9,

  'feuzon-hybrid-reference': 3.35,

  'maple-ply-reference': 3.45,

  'birch-ply-reference': 3.8,

  'oak-ply-reference': 3.15,

  'walnut-ply-reference': 2.3,

  'mahogany-ply-reference': 2.1,

  'brass-reference': 3.75,

  'steel-reference': 4.35,

  'aluminum-reference': 4.05,

  'copper-reference': 3.2,

  'bronze-reference': 3.55,

  'thin-acrylic-reference': 4.7,

  'medium-acrylic-reference': 4.4,

  'thick-acrylic-reference': 4.15,

  'steam-bent-maple-reference': 3.2,

  'steam-bent-mahogany-reference': 2.15,

  'solid-maple-reference': 3.25,

  'solid-walnut-reference': 2.35,

  'solid-oak-reference': 3.05,
};

const BENCHMARK_AXIS_PROFILE_FALLBACKS = {
  'heritage-oak-reference': {
    attack: 6.75,

    sustain: 6.05,

    warmth: 6.85,

    projection: 6.75,

    brightness: 5.7,

    sensitivity: 6.2,

    control: 6.35,
  },

  'feuzon-hybrid-reference': {
    attack: 7.1,

    sustain: 6.32,

    warmth: 6.34,

    projection: 6.92,

    brightness: 6.19,

    sensitivity: 6.42,

    control: 6.48,
  },

  'maple-ply-reference': {
    attack: 7.05,

    sustain: 5.75,

    warmth: 5.75,

    projection: 6.65,

    brightness: 6.95,

    sensitivity: 6.25,

    control: 6.25,
  },

  'birch-ply-reference': {
    attack: 7.35,

    sustain: 5.55,

    warmth: 5.35,

    projection: 7.25,

    brightness: 7.3,

    sensitivity: 6.1,

    control: 6.45,
  },

  'oak-ply-reference': {
    attack: 7.2,

    sustain: 5.9,

    warmth: 6.1,

    projection: 7.35,

    brightness: 6.6,

    sensitivity: 5.95,

    control: 6.55,
  },

  'walnut-ply-reference': {
    attack: 6.35,

    sustain: 6.15,

    warmth: 7.15,

    projection: 6.15,

    brightness: 5.45,

    sensitivity: 6.25,

    control: 6.25,
  },

  'mahogany-ply-reference': {
    attack: 6.15,

    sustain: 6.3,

    warmth: 7.45,

    projection: 5.95,

    brightness: 5.2,

    sensitivity: 6.35,

    control: 6.1,
  },

  'brass-reference': {
    attack: 7.45,

    sustain: 6.65,

    warmth: 6.05,

    projection: 7.55,

    brightness: 7.25,

    sensitivity: 6.5,

    control: 6.35,
  },

  'steel-reference': {
    attack: 7.85,

    sustain: 6.25,

    warmth: 5.25,

    projection: 7.75,

    brightness: 8.15,

    sensitivity: 6.45,

    control: 6.5,
  },

  'aluminum-reference': {
    attack: 7.3,

    sustain: 5.85,

    warmth: 5.55,

    projection: 6.9,

    brightness: 7.75,

    sensitivity: 6.65,

    control: 6.55,
  },

  'copper-reference': {
    attack: 6.85,

    sustain: 6.4,

    warmth: 6.85,

    projection: 6.85,

    brightness: 6.65,

    sensitivity: 6.45,

    control: 6.25,
  },

  'bronze-reference': {
    attack: 7.05,

    sustain: 6.45,

    warmth: 6.55,

    projection: 7.15,

    brightness: 6.95,

    sensitivity: 6.35,

    control: 6.35,
  },

  'thin-acrylic-reference': {
    attack: 7.75,

    sustain: 6.05,

    warmth: 5.15,

    projection: 7.45,

    brightness: 8.25,

    sensitivity: 6.65,

    control: 6.2,
  },

  'medium-acrylic-reference': {
    attack: 7.45,

    sustain: 6.2,

    warmth: 5.35,

    projection: 7.25,

    brightness: 7.95,

    sensitivity: 6.45,

    control: 6.3,
  },

  'thick-acrylic-reference': {
    attack: 7.25,

    sustain: 6.35,

    warmth: 5.55,

    projection: 7.05,

    brightness: 7.65,

    sensitivity: 6.25,

    control: 6.45,
  },

  'steam-bent-maple-reference': {
    attack: 7.0,

    sustain: 6.45,

    warmth: 6.25,

    projection: 6.85,

    brightness: 6.7,

    sensitivity: 6.55,

    control: 6.2,
  },

  'steam-bent-mahogany-reference': {
    attack: 6.25,

    sustain: 6.65,

    warmth: 7.35,

    projection: 6.15,

    brightness: 5.35,

    sensitivity: 6.55,

    control: 6.05,
  },

  'solid-maple-reference': {
    attack: 7.15,

    sustain: 6.15,

    warmth: 6.2,

    projection: 7.0,

    brightness: 6.85,

    sensitivity: 6.2,

    control: 6.55,
  },

  'solid-walnut-reference': {
    attack: 6.45,

    sustain: 6.35,

    warmth: 7.2,

    projection: 6.25,

    brightness: 5.45,

    sensitivity: 6.3,

    control: 6.45,
  },

  'solid-oak-reference': {
    attack: 7.15,

    sustain: 6.1,

    warmth: 6.45,

    projection: 7.25,

    brightness: 6.35,

    sensitivity: 6.05,

    control: 6.65,
  },
};

const parseBenchmarkDimensions = (benchmarkSize) => {
  const label = String(benchmarkSize?.label || '');

  const dimensionMatch = label.match(
    /(\d+(?:\.\d+)?)\s*"?\s*[x×]\s*(\d+(?:\.\d+)?)\s*"?/i
  );

  if (!dimensionMatch) {
    return {
      diameter: null,

      depth: null,

      ratio: null,
    };
  }

  const diameter = Number(dimensionMatch[1]);

  const depth = Number(dimensionMatch[2]);

  return {
    diameter,

    depth,

    ratio:
      Number.isFinite(diameter) && diameter > 0 && Number.isFinite(depth)
        ? depth / diameter
        : null,
  };
};

const getBenchmarkSizeAdjustment = (benchmarkSize) => {
  const { diameter, depth, ratio } = parseBenchmarkDimensions(benchmarkSize);

  if (!diameter || !depth || !ratio) return 0;

  let adjustment = 0;

  adjustment += (14 - diameter) * 0.16;

  adjustment += (6 - depth) * 0.13;

  adjustment += (0.43 - ratio) * 1.25;

  return Math.max(-0.48, Math.min(0.48, adjustment));
};

const buildBenchmarkVoiceRange = (benchmarkType, benchmarkSize) => {
  const profile =
    benchmarkSize?.profile ||
    benchmarkSize?.voiceProfile ||
    benchmarkSize?.scores ||
    benchmarkType?.profile ||
    benchmarkType?.voiceProfile ||
    benchmarkType?.scores ||
    null;

  const hasUsableProfile =
    profile &&
    ['warmth', 'brightness', 'projection', 'attack', 'sustain'].some(
      (key) => profile[key] !== undefined && profile[key] !== null
    );

  const sizeAdjustment = getBenchmarkSizeAdjustment(benchmarkSize);

  if (hasUsableProfile) {
    const warmth = Number(profile.warmth ?? 5);

    const brightness = Number(profile.brightness ?? 5);

    const projection = Number(profile.projection ?? 5);

    const attack = Number(profile.attack ?? 5);

    const sustain = Number(profile.sustain ?? 5);

    const weighted =
      3 +
      (warmth - 5) * -0.75 +
      (sustain - 5) * -0.18 +
      (brightness - 5) * 0.85 +
      (attack - 5) * 0.22 +
      (projection - 5) * 0.18 +
      sizeAdjustment;

    return clampRangePosition(weighted);
  }

  const typeFallback =
    BENCHMARK_VOICE_RANGE_FALLBACKS[benchmarkType?.typeId] ?? 3;

  return clampRangePosition(typeFallback + sizeAdjustment);
};

const buildProjectedVoiceRange = (summary) => {
  const profile = summary?.profile || {};

  const warmth = Number(profile.warmth ?? 7);

  const brightness = Number(profile.brightness ?? 7);

  const projection = Number(profile.projection ?? 7);

  const attack = Number(profile.attack ?? 7);

  const sustain = Number(profile.sustain ?? 7);

  const weighted =
    3 +
    (warmth - 7) * -0.82 +
    (sustain - 7) * -0.14 +
    (brightness - 7) * 0.9 +
    (attack - 7) * 0.2 +
    (projection - 7) * 0.24;

  return clampRangePosition(weighted);
};

const getSelectedBenchmarkProfile = (
  selectedBenchmarkType,

  selectedBenchmarkSize
) => {
  const directProfile =
    selectedBenchmarkSize?.profile ||
    selectedBenchmarkSize?.voiceProfile ||
    selectedBenchmarkSize?.scores ||
    selectedBenchmarkType?.profile ||
    selectedBenchmarkType?.voiceProfile ||
    selectedBenchmarkType?.scores ||
    null;

  if (directProfile) {
    return directProfile;
  }

  const typeId = selectedBenchmarkType?.typeId;

  return BENCHMARK_AXIS_PROFILE_FALLBACKS[typeId] || null;
};

const clampChartValue = (value) => {
  const num = Number(value);

  if (!Number.isFinite(num)) return 5;

  return Math.max(1, Math.min(10, Number(num.toFixed(2))));
};

const buildBenchmarkRelativeFeuzonRead = ({
  voiceRead,

  selectedBenchmarkType,

  selectedBenchmarkSize,
}) => {
  if (!voiceRead) return voiceRead;

  const selectedTypeId = selectedBenchmarkType?.typeId || '';

  const isDefaultFeuzonReference =
    selectedTypeId === DEFAULT_BENCHMARK_TYPE_ID ||
    selectedTypeId === 'feuzon-hybrid-reference';

  if (isDefaultFeuzonReference) {
    return voiceRead;
  }

  const benchmarkProfile = getSelectedBenchmarkProfile(
    selectedBenchmarkType,

    selectedBenchmarkSize
  );

  if (!benchmarkProfile) {
    return voiceRead;
  }

  const currentAbsoluteProfile =
    voiceRead.absoluteProfile || voiceRead.currentAbsoluteProfile || {};

  const nextProfile = AXIS_META.reduce((acc, axis) => {
    const key = axis.key;

    const currentValue = Number(currentAbsoluteProfile[key] ?? 5);

    const benchmarkValue = Number(benchmarkProfile[key] ?? 5);

    const relativeDelta = currentValue - benchmarkValue;

    acc[key] = clampChartValue(5 + relativeDelta);

    return acc;
  }, {});

  return {
    ...voiceRead,

    profile: nextProfile,

    selectedBenchmarkProfile: benchmarkProfile,

    referenceAbsoluteProfile: benchmarkProfile,
  };
};

const MetricIcon = ({ type, color = '#8da2ff', size = 22 }) => {
  const iconProps = {
    size,

    strokeWidth: 2.15,

    color,

    'aria-hidden': true,
  };

  switch (type) {
    case 'attack':
      return <Zap {...iconProps} />;

    case 'sustain':
      return <Waves {...iconProps} />;

    case 'warmth':
      return <Flame {...iconProps} />;

    case 'projection':
      return <Volume2 {...iconProps} />;

    case 'brightness':
      return <SunMedium {...iconProps} />;

    case 'sensitivity':
      return <Feather {...iconProps} />;

    case 'control':
      return <Crosshair {...iconProps} />;

    default:
      return <Zap {...iconProps} />;
  }
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

  const [lugs, setLugs] = useState('6');

  const [staveOption, setStaveOption] = useState('12 - 10mm');

  const [staveQuantities, setStaveQuantities] = useState(['12 - 10mm']);

  const [staveQuantity, setStaveQuantity] = useState(12);

  const [hardwareColor, setHardwareColor] = useState('Chrome');

  const [hoopType, setHoopType] = useState('Triple Flange');

  const [snareBed, setSnareBed] = useState('Standard');

  const [bearingEdge, setBearingEdge] = useState('Balanced Hybrid Edge');

  const [finishSystem, setFinishSystem] = useState('Natural Satin');

  const [stainStyle, setStainStyle] = useState('full-stained');

  const [scorchStyle, setScorchStyle] = useState('scorched');

  const [stainColor, setStainColor] = useState('smoked-maple');

  const [totalPrice, setTotalPrice] = useState(950);

  const [stripePriceId, setStripePriceId] = useState(null);

  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});

  const [buttonText, setButtonText] = useState('Add to Cart');

  const [cartItemId, setCartItemId] = useState(null);

  const [chartView, setChartView] = useState('spider');

  const [openBuilderSection, setOpenBuilderSection] = useState('foundation');

  const [activeAxisKey, setActiveAxisKey] = useState('attack');

  const [showConfigBreakdown, setShowConfigBreakdown] = useState(false);

  const [benchmarkFamilyId, setBenchmarkFamilyId] = useState(
    DEFAULT_BENCHMARK_FAMILY_ID
  );

  const [benchmarkTypeId, setBenchmarkTypeId] = useState(
    DEFAULT_BENCHMARK_TYPE_ID
  );

  const [benchmarkSizeId, setBenchmarkSizeId] = useState(
    DEFAULT_BENCHMARK_SIZE_ID
  );

  const [benchmarkGlowPulseKey, setBenchmarkGlowPulseKey] = useState(0);

  const handleAxisChange = useCallback((nextKey) => {
    if (nextKey) setActiveAxisKey(nextKey);
  }, []);

  const stainColorOptions = useMemo(
    () => stainColorOptionsByWood[outerShell] || [],

    [outerShell]
  );

  useEffect(() => {
    if (finishSystem === 'Natural Gloss' || finishSystem === 'Natural Satin') {
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

    if (finishSystem === 'Natural Gloss' || finishSystem === 'Natural Satin') {
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

  const shellComboNarrative = useMemo(
    () => getShellComboNarrative(outerShell, innerStave),

    [outerShell, innerStave]
  );

  const benchmarkFamilyOptions = useMemo(() => {
    return LEGACYPRINT_BENCHMARK_CATALOG || [];
  }, []);

  const selectedBenchmarkFamily = useMemo(() => {
    return (
      benchmarkFamilyOptions.find(
        (family) => family.familyId === benchmarkFamilyId
      ) || benchmarkFamilyOptions[0]
    );
  }, [benchmarkFamilyOptions, benchmarkFamilyId]);

  const selectedBenchmarkType = useMemo(() => {
    const types = selectedBenchmarkFamily?.benchmarkTypes || [];

    return (
      types.find((type) => type.typeId === benchmarkTypeId) ||
      types.find((type) => type.typeId === 'feuzon-hybrid-reference') ||
      types[0] ||
      null
    );
  }, [selectedBenchmarkFamily, benchmarkTypeId]);

  const selectedBenchmarkSize = useMemo(() => {
    const sizes = selectedBenchmarkType?.presetSizeOptions || [];

    const normalizedDefaultLabel = DEFAULT_BENCHMARK_SIZE_LABEL.replace(
      /\s+/g,

      ''
    ).toLowerCase();

    const fallbackSizeId =
      selectedBenchmarkType?.defaultSizeId ||
      selectedBenchmarkType?.presetSizes?.[0];

    return (
      sizes.find((item) => item.sizeId === benchmarkSizeId) ||
      sizes.find(
        (item) =>
          String(item.label || '')
            .replace(/\s+/g, '')

            .toLowerCase() === normalizedDefaultLabel
      ) ||
      sizes.find((item) => item.sizeId === fallbackSizeId) ||
      sizes[0] ||
      null
    );
  }, [selectedBenchmarkType, benchmarkSizeId]);

  const selectedBenchmarkImagePath = useMemo(() => {
    return (
      selectedBenchmarkSize?.imagePath ||
      selectedBenchmarkType?.imagePath ||
      FEUZON_REFERENCE_IMAGE_FALLBACK
    );
  }, [selectedBenchmarkSize, selectedBenchmarkType]);

  const benchmarkReadBody = useMemo(() => {
    if (
      !selectedBenchmarkFamily ||
      !selectedBenchmarkType ||
      !selectedBenchmarkSize
    ) {
      return 'Choose a reference drum to compare the current FEUZØN build against. The chart and summary show how the selected build differs across the main voice metrics.';
    }

    return `${selectedBenchmarkFamily.familyLabel} benchmark selected. This current build is being compared against the ${selectedBenchmarkType.typeLabel} at ${selectedBenchmarkSize.label}. The chart is reference-relative: center represents the selected benchmark, values above center indicate more emphasis, and values below center indicate less emphasis.`;
  }, [selectedBenchmarkFamily, selectedBenchmarkType, selectedBenchmarkSize]);

  const feuzonHighlights = [
    'Builds starting at $950.',

    'Steam-bent exterior with voiced stave interior.',

    'Fast, articulate, modern Ober response.',

    'Balanced Hybrid, Warm Hybrid, or Modern Precision bearing edge.',

    '12", 13", 14", and 15" build sizes.',

    'Hundreds of FEUZØN core voicing paths.',

    'Die-cast or triple-flange hoop response.',

    'Chrome, Black Nickel, or Brass / Gold hardware.',

    'Natural satin, natural gloss, stained satin, or stained gloss finish systems.',

    'Controlled scorching and torch-tuned stave interior.',

    'Stock Trick GS007 throw-off, Remo heads, and PureSound Custom Pro Steel 20-Strand wires.',
  ];

  const isNaturalFinish =
    finishSystem === 'Natural Gloss' || finishSystem === 'Natural Satin';

  const resolvedStainStyle = isNaturalFinish ? 'natural' : stainStyle;

  const resolvedStainColor = isNaturalFinish ? 'none' : stainColor;

  const foundationSummary = `${size}" x ${depth}" • ${lugs} lugs • ${staveOption}`;

  const shellSummary = `${outerShell} / ${innerStave}`;

  const finishSummary = isNaturalFinish
    ? `${scorchStyle === 'scorched' ? 'Natural Scorched' : 'Non-Scorched'} • ${
        finishSystem === 'Natural Satin' ? 'Natural Satin' : 'Natural Gloss'
      }`
    : `${scorchStyle === 'scorched' ? 'Natural Scorched' : 'Non-Scorched'} • ${
        stainColorOptions.find((item) => item.value === stainColor)?.label ||
        stainColor
      } • ${stainStyle === 'faded-stained' ? 'Faded' : 'Full'} • ${
        finishSystem === 'Stained Satin' ? 'Satin' : 'Gloss'
      }`;

  const responseSummary = `${bearingEdge} • ${snareBed}`;

  const hardwareSummary = `${hoopType} • ${hardwareColor}`;

  const estimatedDeliveryLabel = getEstimatedDeliveryLabel(finishSystem);

  const isFeuzonLowestPreset =
    String(size) === '12' &&
    String(depth) === '5.0' &&
    String(lugs) === '6' &&
    staveOption === '12 - 10mm' &&
    outerShell === 'Maple' &&
    innerStave === 'Walnut + Birch' &&
    hoopType === 'Triple Flange' &&
    hardwareColor === 'Chrome' &&
    bearingEdge === 'Balanced Hybrid Edge' &&
    snareBed === 'Standard' &&
    finishSystem === 'Natural Satin' &&
    scorchStyle === 'scorched';

  const isFeuzonStandardPreset =
    String(size) === '14' &&
    String(depth) === '6.0' &&
    String(lugs) === '8' &&
    staveOption === '16 - 13mm' &&
    outerShell === 'Maple' &&
    innerStave === 'Walnut + Birch' &&
    hoopType === 'Die-Cast' &&
    hardwareColor === 'Chrome' &&
    bearingEdge === 'Balanced Hybrid Edge' &&
    snareBed === 'Standard' &&
    finishSystem === 'Natural Gloss' &&
    scorchStyle === 'scorched';

  const currentBuildPrice = useMemo(() => {
    return computeFeuzonPrice({
      size,

      depth,

      hardwareColor,

      hoopType,

      finishSystem,
    });
  }, [size, depth, hardwareColor, hoopType, finishSystem]);

  const getOptionDeltaMeta = (nextSelections) => {
    const nextPrice = computeFeuzonPrice({
      size: nextSelections.size ?? size,

      depth: nextSelections.depth ?? depth,

      hardwareColor: nextSelections.hardwareColor ?? hardwareColor,

      hoopType: nextSelections.hoopType ?? hoopType,

      finishSystem: nextSelections.finishSystem ?? finishSystem,
    });

    const delta = nextPrice - currentBuildPrice;

    return {
      text: getReadableDelta(delta),

      className: getDeltaClassName(delta),
    };
  };

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

  const activeAxisMeta =
    AXIS_META.find((axis) => axis.key === activeAxisKey) || AXIS_META[0];

  const rawAxisValue =
    selectedDrumSummary?.profile?.[activeAxisKey] != null
      ? Number(selectedDrumSummary.profile[activeAxisKey])
      : 5;

  const activeAxisDeltaValue = Number((rawAxisValue - 5).toFixed(1));

  const activeAxisScore =
    activeAxisDeltaValue > 0
      ? `+${activeAxisDeltaValue.toFixed(1)}`
      : activeAxisDeltaValue.toFixed(1);

  const activeAxisCopy =
    AXIS_INSIGHT_COPY[activeAxisKey] || AXIS_INSIGHT_COPY.attack;

  const activeAxisColor = AXIS_COLOR_BY_KEY[activeAxisKey] || '#8da2ff';

  const activeAxisImpactFactors =
    AXIS_IMPACT_FACTORS[activeAxisKey] || AXIS_IMPACT_FACTORS.attack;

  const currentBuildVoiceRangeSummary = useMemo(() => {
    return buildFeuzonVoiceRead({
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

      benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,

      benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,

      benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,
    });
  }, [
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

    stainColorOptions,
  ]);

  const projectedVoiceRangePosition = useMemo(() => {
    return (
      currentBuildVoiceRangeSummary?.projectedVoiceRangePosition ||
      buildProjectedVoiceRange(currentBuildVoiceRangeSummary)
    );
  }, [currentBuildVoiceRangeSummary]);

  const benchmarkVoiceRangePosition = useMemo(() => {
    return buildBenchmarkVoiceRange(
      selectedBenchmarkType,

      selectedBenchmarkSize
    );
  }, [selectedBenchmarkType, selectedBenchmarkSize]);

  const toneSummaryText = useMemo(() => {
    return buildFeuzonReferenceToneSummary(
      selectedDrumSummary,

      selectedBenchmarkType,

      selectedBenchmarkSize
    );
  }, [selectedDrumSummary, selectedBenchmarkType, selectedBenchmarkSize]);

  const handleBenchmarkFamilyChange = (nextFamilyId) => {
    const nextFamily = benchmarkFamilyOptions.find(
      (family) => family.familyId === nextFamilyId
    );

    if (!nextFamily) return;

    const nextType =
      nextFamily.benchmarkTypes?.find(
        (type) => type.typeId === 'feuzon-hybrid-reference'
      ) ||
      nextFamily.benchmarkTypes?.[0] ||
      null;

    const normalizedDefaultLabel = DEFAULT_BENCHMARK_SIZE_LABEL.replace(
      /\s+/g,

      ''
    ).toLowerCase();

    const nextSize =
      nextType?.presetSizeOptions?.find(
        (item) =>
          String(item.label || '')
            .replace(/\s+/g, '')

            .toLowerCase() === normalizedDefaultLabel
      ) ||
      nextType?.presetSizeOptions?.find(
        (item) => item.sizeId === nextType?.defaultSizeId
      ) ||
      nextType?.presetSizeOptions?.[0] ||
      null;

    setBenchmarkFamilyId(nextFamilyId);

    setBenchmarkTypeId(nextType?.typeId || '');

    setBenchmarkSizeId(nextSize?.sizeId || '');
  };

  const handleBenchmarkTypeChange = (nextTypeId) => {
    const nextType =
      selectedBenchmarkFamily?.benchmarkTypes?.find(
        (type) => type.typeId === nextTypeId
      ) || null;

    if (!nextType) return;

    const normalizedDefaultLabel = DEFAULT_BENCHMARK_SIZE_LABEL.replace(
      /\s+/g,

      ''
    ).toLowerCase();

    const nextSize =
      nextType.presetSizeOptions?.find(
        (item) =>
          String(item.label || '')
            .replace(/\s+/g, '')

            .toLowerCase() === normalizedDefaultLabel
      ) ||
      nextType.presetSizeOptions?.find(
        (item) => item.sizeId === nextType.defaultSizeId
      ) ||
      nextType.presetSizeOptions?.[0] ||
      null;

    setBenchmarkTypeId(nextTypeId);

    setBenchmarkSizeId(nextSize?.sizeId || '');
  };

  const handleBenchmarkSizeChange = (nextSizeId) => {
    setBenchmarkSizeId(nextSizeId);
  };

  const handleResetBenchmark = () => {
    const defaultFamily =
      benchmarkFamilyOptions.find(
        (family) => family.familyId === DEFAULT_BENCHMARK_FAMILY_ID
      ) || benchmarkFamilyOptions[0];

    const defaultType =
      defaultFamily?.benchmarkTypes?.find(
        (type) => type.typeId === DEFAULT_BENCHMARK_TYPE_ID
      ) ||
      defaultFamily?.benchmarkTypes?.[0] ||
      null;

    const normalizedDefaultLabel = DEFAULT_BENCHMARK_SIZE_LABEL.replace(
      /\s+/g,

      ''
    ).toLowerCase();

    const defaultSize =
      defaultType?.presetSizeOptions?.find(
        (item) =>
          String(item.label || '')
            .replace(/\s+/g, '')

            .toLowerCase() === normalizedDefaultLabel
      ) ||
      defaultType?.presetSizeOptions?.find(
        (item) => item.sizeId === defaultType?.defaultSizeId
      ) ||
      defaultType?.presetSizeOptions?.[0] ||
      null;

    setBenchmarkFamilyId(
      defaultFamily?.familyId || DEFAULT_BENCHMARK_FAMILY_ID
    );

    setBenchmarkTypeId(defaultType?.typeId || DEFAULT_BENCHMARK_TYPE_ID);

    setBenchmarkSizeId(defaultSize?.sizeId || DEFAULT_BENCHMARK_SIZE_ID);
  };

  useEffect(() => {
    setBenchmarkGlowPulseKey((prev) => prev + 1);
  }, [benchmarkFamilyId, benchmarkTypeId, benchmarkSizeId]);

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
      Number.isFinite(qtyFromLabel) && qtyFromLabel > 0 ? qtyFromLabel : 12
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
      (hoopUpchargeMap[hoopType] || 0) +
      (finishUpchargeMap[finishSystem] || 0);

    const resolvedStripePriceId = matchedPricing?.stripePriceId || null;

    setTotalPrice(resolvedBasePrice);

    setStripePriceId(resolvedStripePriceId);

    const voiceRead = buildFeuzonVoiceRead({
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

      benchmarkFamilyId,

      benchmarkTypeId,

      benchmarkSizeId,

      selectedBenchmarkType,

      selectedBenchmarkSize,
    });

    const benchmarkRelativeVoiceRead = buildBenchmarkRelativeFeuzonRead({
      voiceRead,

      selectedBenchmarkType,

      selectedBenchmarkSize,
    });

    setSelectedDrumSummary(benchmarkRelativeVoiceRead);
  }, [
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

    stainColorOptions,

    benchmarkFamilyId,

    benchmarkTypeId,

    benchmarkSizeId,

    selectedBenchmarkType,

    selectedBenchmarkSize,
  ]);

  useEffect(() => {
    const matchingItem = cart.find((item) => item.id === currentCartId);

    if (matchingItem) {
      setCartItemId(matchingItem.id);

      setButtonText('In Cart');
    } else {
      setCartItemId(null);

      setButtonText('Add to Cart');
    }
  }, [cart, currentCartId]);

  const applyFeuzonPreset = (preset) => {
    if (preset === 'standard') {
      setSize('14');

      setDepth('6.0');

      setLugs('8');

      setStaveOption('16 - 13mm');

      setStaveQuantity(16);

      setOuterShell('Maple');

      setInnerStave('Walnut + Birch');

      setHoopType('Die-Cast');

      setHardwareColor('Chrome');

      setBearingEdge('Balanced Hybrid Edge');

      setSnareBed('Standard');

      setFinishSystem('Natural Gloss');

      setScorchStyle('scorched');

      setStainStyle('full-stained');

      setStainColor('smoked-maple');

      setOpenBuilderSection('foundation');

      return;
    }

    setSize('12');

    setDepth('5.0');

    setLugs('6');

    setStaveOption('12 - 10mm');

    setStaveQuantity(12);

    setOuterShell('Maple');

    setInnerStave('Walnut + Birch');

    setHoopType('Triple Flange');

    setHardwareColor('Chrome');

    setBearingEdge('Balanced Hybrid Edge');

    setSnareBed('Standard');

    setFinishSystem('Natural Satin');

    setScorchStyle('scorched');

    setStainStyle('full-stained');

    setStainColor('smoked-maple');

    setOpenBuilderSection('foundation');
  };

  const handleSizeSelect = (newSize) => {
    if (newSize === size) return;

    const nextDepth = Object.keys(depthPrices[newSize])[0];

    const nextLugs = lugOptions[newSize][0];

    const nextStaves = staveMapping[newSize]?.[Number(nextLugs)] || [];

    setSize(newSize);

    setDepth(nextDepth);

    setLugs(nextLugs);

    setStaveOption(nextStaves[0] || '');
  };

  const handleDepthSelect = (newDepth) => {
    setDepth(newDepth);
  };

  const handleOuterShellSelect = (newOuterShell) => {
    if (newOuterShell === outerShell) return;

    const nextInnerOptions = shellOptions[newOuterShell] || [];

    setOuterShell(newOuterShell);

    setInnerStave(nextInnerOptions[0] || '');
  };

  const handleInnerStaveSelect = (newInnerStave) => {
    setInnerStave(newInnerStave);
  };

  const handleLugSelect = (newLug) => {
    if (newLug === lugs) return;

    const nextStaves = staveMapping[size]?.[Number(newLug)] || [];

    setLugs(newLug);

    setStaveOption(nextStaves[0] || '');
  };

  const handleStaveSelect = (newStaveOption) => {
    setStaveOption(newStaveOption);
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

      estimatedDelivery: estimatedDeliveryLabel,

      finishUpcharge: finishUpchargeMap[finishSystem] || 0,

      finishAddedWeeks: getFinishTimelineWeeks(finishSystem),

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

      throwOff: FEUZON_STANDARD_REFERENCE.throwOff,

      batterHead: FEUZON_STANDARD_REFERENCE.batterHead,

      resonantHead: FEUZON_STANDARD_REFERENCE.resonantHead,

      snareWireModel: FEUZON_STANDARD_REFERENCE.snareWires,

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

        stainStyle: resolvedStainStyle,

        scorchStyle,

        stainColor: resolvedStainColor,

        throwOff: FEUZON_STANDARD_REFERENCE.throwOff,

        batterHead: FEUZON_STANDARD_REFERENCE.batterHead,

        resonantHead: FEUZON_STANDARD_REFERENCE.resonantHead,

        snareWireModel: FEUZON_STANDARD_REFERENCE.snareWires,

        estimatedDelivery: estimatedDeliveryLabel,

        finishUpcharge: finishUpchargeMap[finishSystem] || 0,

        finishAddedWeeks: getFinishTimelineWeeks(finishSystem),
      },
    };

    try {
      await addToCart(cartItem, cartItem.config);

      toast.success('🛒 Item added to cart!');

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
        <section className="feuzon-intro-section">
          <div className="feuzon-intro-grid">
            <div className="feuzon-product-image-card">
              <div className="feuzon-product-image">
                <img src={productImage} alt="FEUZØN Snare Drum" />
              </div>
            </div>

            <div className="feuzon-overview-card">
              <div className="feuzon-overview-scroll">
                <p className="feuzon-story-lede">Fast. Focused. Alive.</p>

                <p className="feuzon-story-copy">
                  FEUZØN is built for players who want the immediacy of a modern
                  drum, with more depth, complexity, and character beneath the
                  stick.
                </p>

                <p className="feuzon-story-copy">
                  By pairing a steam-bent outer shell with a voiced stave
                  interior, FEUZØN creates a response that feels articulate up
                  front, full through the body, and alive across a wide tuning
                  range.
                </p>

                <p className="feuzon-story-copy">
                  It sits between precision and personality — controlled when
                  needed, expressive when pushed, and visually striking from
                  every angle.
                </p>

                <div className="feuzon-overview-divider" />

                <h3 className="feuzon-overview-subtitle">
                  Key Build Highlights
                </h3>

                <ul className="feuzon-overview-list">
                  {feuzonHighlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <p className="order-to-build-disclaimer">
                  *Each Ober Artisan drum is built to order. The instrument you
                  receive will closely reflect the design shown, but wood
                  figure, stain absorption, scorch response, and exact visual
                  character will vary based on your final configuration.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="feuzon-workspace-section">
          <aside className="feuzon-config-panel feuzon-builder-card">
            <div className="feuzon-builder-head">
              <span className="feuzon-builder-kicker">Build your drum</span>

              <p>
                Builds start at $950. Shape your foundation, build your hybrid
                shell, choose your finish, dial in the response, then refine
                your hardware.
              </p>

              <div className="feuzon-builder-preset-card feuzon-builder-preset-card--guided">
                <div className="feuzon-builder-preset-intro">
                  <span className="feuzon-builder-preset-label">
                    Choose a starting point
                  </span>

                  <p className="feuzon-builder-preset-helper">
                    Pick a starting recipe for your build. Nothing is locked —
                    this only sets the initial size, hoops, finish, and baseline
                    FEUZØN response before you customize below.
                  </p>
                </div>

                <div className="feuzon-builder-preset-actions feuzon-builder-preset-actions--cards">
                  <button
                    type="button"
                    className={`feuzon-builder-preset-button feuzon-builder-preset-button--guided ${
                      isFeuzonLowestPreset ? 'is-active' : ''
                    }`}
                    onClick={() => applyFeuzonPreset('lowest')}
                  >
                    <span className="feuzon-builder-preset-title">
                      Lowest Starting Price
                    </span>

                    <span className="feuzon-builder-preset-price">
                      From $950
                    </span>

                    <span className="feuzon-builder-preset-description">
                      The most affordable FEUZØN foundation: smaller shell,
                      triple-flange hoops, natural satin finish, and a quicker,
                      more open response.
                    </span>

                    <span className="feuzon-builder-preset-best-for">
                      Best for: keeping the entry price low while still shaping
                      the build from there.
                    </span>

                    {isFeuzonLowestPreset && (
                      <small className="feuzon-builder-preset-status">
                        Current starting point
                      </small>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`feuzon-builder-preset-button feuzon-builder-preset-button--guided feuzon-builder-preset-button--standard ${
                      isFeuzonStandardPreset ? 'is-active' : ''
                    }`}
                    onClick={() => applyFeuzonPreset('standard')}
                  >
                    <span className="feuzon-builder-preset-title">
                      FEUZØN Standard Reference
                    </span>

                    <span className="feuzon-builder-preset-price">
                      From $1,450
                    </span>

                    <span className="feuzon-builder-preset-description">
                      Ober’s balanced FEUZØN reference build: 14&quot; ×
                      6.0&quot;, die-cast hoops, natural gloss finish, and the
                      centered voice profile used as the comparison point.
                    </span>

                    <span className="feuzon-builder-preset-best-for">
                      Best for: starting from the default FEUZØN sound before
                      making personal changes.
                    </span>

                    {isFeuzonStandardPreset && (
                      <small className="feuzon-builder-preset-status">
                        Current starting point
                      </small>
                    )}
                  </button>
                </div>

                <p className="feuzon-builder-preset-footnote">
                  You can still change size, shell pairing, finish, hardware,
                  hoops, bearing edge, and snare bed after choosing either
                  starting point.
                </p>
              </div>
            </div>

            <div className="feuzon-builder-sections">
              <div
                className={`feuzon-builder-section ${
                  openBuilderSection === 'foundation'
                    ? 'is-open'
                    : 'is-collapsed'
                }`}
              >
                <button
                  type="button"
                  className={`feuzon-builder-section-toggle ${
                    openBuilderSection === 'foundation' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'foundation' ? '' : 'foundation'
                    )
                  }
                >
                  <div className="feuzon-builder-section-heading">
                    <span className="feuzon-builder-section-step">1</span>

                    <div className="feuzon-builder-section-heading-copy">
                      <h3>Shape Your Foundation</h3>

                      <p>{foundationSummary}</p>
                    </div>
                  </div>

                  <span
                    className="feuzon-builder-section-chevron"
                    aria-hidden="true"
                  >
                    {openBuilderSection === 'foundation' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'foundation' && (
                  <div className="feuzon-builder-section-body">
                    <label>Snare Size (Diameter)</label>

                    <div className="feuzon-option-grid feuzon-option-grid-compact">
                      {Object.keys(basePrices).map((sizeOption) => {
                        const isSelected = size === sizeOption;

                        const deltaMeta = getOptionDeltaMeta({
                          size: sizeOption,
                        });

                        return (
                          <button
                            key={sizeOption}
                            type="button"
                            className={`feuzon-option-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleSizeSelect(sizeOption)}
                          >
                            <span className="feuzon-option-title">
                              {sizeOption}"
                            </span>

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`feuzon-option-meta ${
                                  isSelected
                                    ? 'is-selected'
                                    : deltaMeta.className
                                }`}
                              >
                                {isSelected ? 'Selected' : deltaMeta.text}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <label>Depth</label>

                    <div className="feuzon-option-grid feuzon-option-grid-compact">
                      {Object.keys(depthPrices[size]).map((depthOption) => {
                        const isSelected = depth === depthOption;

                        const deltaMeta = getOptionDeltaMeta({
                          depth: depthOption,
                        });

                        return (
                          <button
                            key={depthOption}
                            type="button"
                            className={`feuzon-option-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleDepthSelect(depthOption)}
                          >
                            <span className="feuzon-option-title">
                              {depthOption}"
                            </span>

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`feuzon-option-meta ${
                                  isSelected
                                    ? 'is-selected'
                                    : deltaMeta.className
                                }`}
                              >
                                {isSelected ? 'Selected' : deltaMeta.text}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <label>Lug Quantity</label>

                    <div className="feuzon-option-grid feuzon-option-grid-compact">
                      {(lugOptions[size] || []).map((lugOption) => {
                        const isSelected = lugs === lugOption;

                        return (
                          <button
                            key={lugOption}
                            type="button"
                            className={`feuzon-option-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleLugSelect(lugOption)}
                          >
                            <span className="feuzon-option-title">
                              {lugOption} Lugs
                            </span>

                            {isSelected && (
                              <span className="feuzon-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <label>Stave Quantity &amp; Shell Thickness</label>

                    <div className="feuzon-option-grid">
                      {staveQuantities.map((option) => {
                        const isSelected = staveOption === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            className={`feuzon-option-tile feuzon-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleStaveSelect(option)}
                          >
                            <span className="feuzon-option-title">
                              {getStaveCountLabel(option)}
                            </span>

                            <span className="feuzon-option-subtitle">
                              {getStaveThicknessLabel(option)}
                            </span>

                            {isSelected && (
                              <span className="feuzon-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="feuzon-builder-next-row">
                      <button
                        type="button"
                        className="feuzon-builder-next-link"
                        onClick={() => setOpenBuilderSection('shell')}
                      >
                        <span className="feuzon-builder-next-link-label">
                          Continue to Shell
                        </span>

                        <span
                          className="feuzon-builder-next-link-arrow"
                          aria-hidden="true"
                        >
                          ↓
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`feuzon-builder-section ${
                  openBuilderSection === 'shell' ? 'is-open' : 'is-collapsed'
                }`}
              >
                <button
                  type="button"
                  className={`feuzon-builder-section-toggle ${
                    openBuilderSection === 'shell' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'shell' ? '' : 'shell'
                    )
                  }
                >
                  <div className="feuzon-builder-section-heading">
                    <span className="feuzon-builder-section-step">2</span>

                    <div className="feuzon-builder-section-heading-copy">
                      <h3>Build Your Hybrid Shell</h3>

                      <p>{shellSummary}</p>
                    </div>
                  </div>

                  <span
                    className="feuzon-builder-section-chevron"
                    aria-hidden="true"
                  >
                    {openBuilderSection === 'shell' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'shell' && (
                  <div className="feuzon-builder-section-body">
                    <label>Exterior Shell (Steam Bent)</label>

                    <div className="feuzon-option-grid">
                      {Object.keys(shellOptions).map((shell) => {
                        const isSelected = outerShell === shell;

                        return (
                          <button
                            key={shell}
                            type="button"
                            className={`feuzon-option-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleOuterShellSelect(shell)}
                          >
                            <span className="feuzon-option-title">{shell}</span>

                            {isSelected && (
                              <span className="feuzon-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <label>Paired Interior Stave Shell</label>

                    <div className="feuzon-option-grid">
                      {(shellOptions[outerShell] || []).map((option) => {
                        const isSelected = innerStave === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            className={`feuzon-option-tile feuzon-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleInnerStaveSelect(option)}
                          >
                            <span className="feuzon-option-title">
                              {option}
                            </span>

                            {isSelected && (
                              <span className="feuzon-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="feuzon-select-helper">
                      {shellComboNarrative}
                    </p>

                    <div className="feuzon-builder-next-row">
                      <button
                        type="button"
                        className="feuzon-builder-next-link"
                        onClick={() => setOpenBuilderSection('finish')}
                      >
                        <span className="feuzon-builder-next-link-label">
                          Continue to Finish
                        </span>

                        <span
                          className="feuzon-builder-next-link-arrow"
                          aria-hidden="true"
                        >
                          ↓
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`feuzon-builder-section ${
                  openBuilderSection === 'finish' ? 'is-open' : 'is-collapsed'
                }`}
              >
                <button
                  type="button"
                  className={`feuzon-builder-section-toggle ${
                    openBuilderSection === 'finish' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'finish' ? '' : 'finish'
                    )
                  }
                >
                  <div className="feuzon-builder-section-heading">
                    <span className="feuzon-builder-section-step">3</span>

                    <div className="feuzon-builder-section-heading-copy">
                      <h3>Choose Your Finish</h3>

                      <p>{finishSummary}</p>
                    </div>
                  </div>

                  <span
                    className="feuzon-builder-section-chevron"
                    aria-hidden="true"
                  >
                    {openBuilderSection === 'finish' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'finish' && (
                  <div className="feuzon-builder-section-body">
                    <label>Exterior Scorch</label>

                    <div className="feuzon-option-grid">
                      {scorchOptions.map((option) => {
                        const isSelected = scorchStyle === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`feuzon-option-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => setScorchStyle(option.value)}
                          >
                            <span className="feuzon-option-title">
                              {option.label}
                            </span>

                            {isSelected && (
                              <span className="feuzon-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="feuzon-select-helper">
                      Choose whether the exterior stays cleaner and more
                      restrained or leans further into FEUZØN’s scorched visual
                      character.
                    </p>

                    <label>Finish Direction</label>

                    <div className="feuzon-option-grid">
                      <button
                        type="button"
                        className={`feuzon-option-tile feuzon-option-tile-detail ${
                          isNaturalFinish ? 'is-selected' : ''
                        }`}
                        onClick={() => setFinishSystem('Natural Satin')}
                      >
                        <span className="feuzon-option-title">Natural</span>

                        <span className="feuzon-option-subtitle">
                          Keep the shell closer to its raw wood and torch
                          character.
                        </span>

                        {(() => {
                          const deltaMeta = getOptionDeltaMeta({
                            finishSystem:
                              finishSystem === 'Natural Satin'
                                ? 'Natural Satin'
                                : 'Natural Gloss',
                          });

                          return (
                            (isNaturalFinish || deltaMeta.text) && (
                              <span
                                className={`feuzon-option-meta ${
                                  isNaturalFinish
                                    ? 'is-selected'
                                    : deltaMeta.className
                                }`}
                              >
                                {isNaturalFinish ? 'Selected' : deltaMeta.text}
                              </span>
                            )
                          );
                        })()}
                      </button>

                      <button
                        type="button"
                        className={`feuzon-option-tile feuzon-option-tile-detail ${
                          !isNaturalFinish ? 'is-selected' : ''
                        }`}
                        onClick={() => setFinishSystem('Stained Gloss')}
                      >
                        <span className="feuzon-option-title">Stained</span>

                        <span className="feuzon-option-subtitle">
                          Add a richer stained finish with more visual
                          direction.
                        </span>

                        {(() => {
                          const deltaMeta = getOptionDeltaMeta({
                            finishSystem:
                              finishSystem === 'Stained Satin'
                                ? 'Stained Satin'
                                : 'Stained Gloss',
                          });

                          return (
                            (!isNaturalFinish || deltaMeta.text) && (
                              <span
                                className={`feuzon-option-meta ${
                                  !isNaturalFinish
                                    ? 'is-selected'
                                    : deltaMeta.className
                                }`}
                              >
                                {!isNaturalFinish ? 'Selected' : deltaMeta.text}
                              </span>
                            )
                          );
                        })()}
                      </button>
                    </div>

                    {!isNaturalFinish && (
                      <>
                        <label>Stain Color</label>

                        <div className="feuzon-finish-swatch-grid">
                          {stainColorOptions.map((option) => {
                            const preview =
                              FEUZON_SWATCHES?.[outerShell]?.['full-stained']?.[
                                option.value
                              ]?.[scorchStyle] || null;

                            const isSelected = stainColor === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                className={`feuzon-finish-swatch-button ${
                                  isSelected ? 'is-selected' : ''
                                }`}
                                onClick={() => setStainColor(option.value)}
                              >
                                <span className="feuzon-finish-swatch-image">
                                  {preview ? (
                                    <img src={preview} alt={option.label} />
                                  ) : null}
                                </span>

                                <span className="feuzon-finish-swatch-overlay" />

                                <span className="feuzon-finish-swatch-content">
                                  <span className="feuzon-finish-swatch-title">
                                    {option.label}
                                  </span>

                                  {isSelected && (
                                    <span className="feuzon-finish-swatch-meta">
                                      Selected
                                    </span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <label>Stain Style</label>

                        <div className="feuzon-finish-swatch-grid">
                          {stainStyleOptions.map((option) => {
                            const preview =
                              FEUZON_SWATCHES?.[outerShell]?.[option.value]?.[
                                stainColor
                              ]?.[scorchStyle] || null;

                            const isSelected = stainStyle === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                className={`feuzon-finish-swatch-button ${
                                  isSelected ? 'is-selected' : ''
                                }`}
                                onClick={() => setStainStyle(option.value)}
                              >
                                <span className="feuzon-finish-swatch-image">
                                  {preview ? (
                                    <img src={preview} alt={option.label} />
                                  ) : null}
                                </span>

                                <span className="feuzon-finish-swatch-overlay" />

                                <span className="feuzon-finish-swatch-content">
                                  <span className="feuzon-finish-swatch-title">
                                    {option.label}
                                  </span>

                                  {isSelected && (
                                    <span className="feuzon-finish-swatch-meta">
                                      Selected
                                    </span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <label>Final Finish</label>

                    <div className="feuzon-option-grid">
                      {(isNaturalFinish
                        ? [
                            {
                              label: 'Natural Gloss',

                              value: 'Natural Gloss',

                              helperText:
                                'More polished, reflective, and vivid while staying natural.',
                            },

                            {
                              label: 'Natural Satin',

                              value: 'Natural Satin',

                              helperText:
                                'Softer sheen with a more organic, understated natural look.',
                            },
                          ]
                        : [
                            {
                              label: 'Gloss',

                              value: 'Stained Gloss',

                              helperText:
                                'Richer depth, more pop, and stronger reflectivity.',
                            },

                            {
                              label: 'Satin',

                              value: 'Stained Satin',

                              helperText:
                                'Softer sheen with a moodier, more understated look.',
                            },
                          ]
                      ).map((option) => {
                        const isSelected = finishSystem === option.value;

                        const deltaMeta = getOptionDeltaMeta({
                          finishSystem: option.value,
                        });

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`feuzon-option-tile feuzon-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => setFinishSystem(option.value)}
                          >
                            <span className="feuzon-option-title">
                              {option.label}
                            </span>

                            <span className="feuzon-option-subtitle">
                              {option.helperText}
                            </span>

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`feuzon-option-meta ${
                                  isSelected
                                    ? 'is-selected'
                                    : deltaMeta.className
                                }`}
                              >
                                {isSelected ? 'Selected' : deltaMeta.text}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {swatchPreviewImage && (
                      <div className="feuzon-swatch-preview-wrap">
                        <div className="feuzon-swatch-preview">
                          <img
                            src={swatchPreviewImage}
                            alt="Selected FEUZØN finish swatch"
                          />
                        </div>

                        <p className="feuzon-swatch-disclaimer">
                          This preview is a general finish reference. Final
                          appearance may vary based on wood figure, stain
                          absorption, scorch response, lighting, and the unique
                          character of each shell. We’ll aim to get your drum as
                          close as possible to the selected preview.
                        </p>
                      </div>
                    )}

                    <div className="feuzon-builder-next-row">
                      <button
                        type="button"
                        className="feuzon-builder-next-link"
                        onClick={() => setOpenBuilderSection('response')}
                      >
                        <span className="feuzon-builder-next-link-label">
                          Continue to Response
                        </span>

                        <span
                          className="feuzon-builder-next-link-arrow"
                          aria-hidden="true"
                        >
                          ↓
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`feuzon-builder-section ${
                  openBuilderSection === 'response' ? 'is-open' : 'is-collapsed'
                }`}
              >
                <button
                  type="button"
                  className={`feuzon-builder-section-toggle ${
                    openBuilderSection === 'response' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'response' ? '' : 'response'
                    )
                  }
                >
                  <div className="feuzon-builder-section-heading">
                    <span className="feuzon-builder-section-step">4</span>

                    <div className="feuzon-builder-section-heading-copy">
                      <h3>Dial In the Response</h3>

                      <p>{responseSummary}</p>
                    </div>
                  </div>

                  <span
                    className="feuzon-builder-section-chevron"
                    aria-hidden="true"
                  >
                    {openBuilderSection === 'response' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'response' && (
                  <div className="feuzon-builder-section-body">
                    <label>Bearing Edge</label>

                    <div className="feuzon-option-grid">
                      {bearingEdgeOptions.map((option) => {
                        const isSelected = bearingEdge === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`feuzon-option-tile feuzon-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => setBearingEdge(option.value)}
                          >
                            <span className="feuzon-option-title">
                              {option.label}
                            </span>

                            <span className="feuzon-option-subtitle">
                              {option.spec}
                            </span>

                            {isSelected && (
                              <span className="feuzon-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="feuzon-select-helper">
                      <strong>{selectedBearingEdgeMeta.spec}</strong> —{' '}
                      {selectedBearingEdgeMeta.helperText}
                    </p>

                    <label>Snare Bed Depth</label>

                    <div className="feuzon-option-grid">
                      {snareBedOptions.map((option) => {
                        const isSelected = snareBed === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`feuzon-option-tile feuzon-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => setSnareBed(option.value)}
                          >
                            <span className="feuzon-option-title">
                              {option.label}
                            </span>

                            <span className="feuzon-option-subtitle">
                              {option.helperText}
                            </span>

                            {isSelected && (
                              <span className="feuzon-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="feuzon-select-helper">
                      {selectedSnareBedMeta.helperText}
                    </p>

                    <div className="feuzon-builder-next-row">
                      <button
                        type="button"
                        className="feuzon-builder-next-link"
                        onClick={() => setOpenBuilderSection('hardware')}
                      >
                        <span className="feuzon-builder-next-link-label">
                          Continue to Hardware
                        </span>

                        <span
                          className="feuzon-builder-next-link-arrow"
                          aria-hidden="true"
                        >
                          ↓
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`feuzon-builder-section ${
                  openBuilderSection === 'hardware' ? 'is-open' : 'is-collapsed'
                }`}
              >
                <button
                  type="button"
                  className={`feuzon-builder-section-toggle ${
                    openBuilderSection === 'hardware' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'hardware' ? '' : 'hardware'
                    )
                  }
                >
                  <div className="feuzon-builder-section-heading">
                    <span className="feuzon-builder-section-step">5</span>

                    <div className="feuzon-builder-section-heading-copy">
                      <h3>Refine Your Hardware</h3>

                      <p>{hardwareSummary}</p>
                    </div>
                  </div>

                  <span
                    className="feuzon-builder-section-chevron"
                    aria-hidden="true"
                  >
                    {openBuilderSection === 'hardware' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'hardware' && (
                  <div className="feuzon-builder-section-body">
                    <label>Hoop Type</label>

                    <div className="feuzon-option-grid">
                      {hoopOptions.map((option) => {
                        const isSelected = hoopType === option.value;

                        const deltaMeta = getOptionDeltaMeta({
                          hoopType: option.value,
                        });

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`feuzon-option-tile feuzon-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => setHoopType(option.value)}
                          >
                            <span className="feuzon-option-title">
                              {option.label}
                            </span>

                            <span className="feuzon-option-subtitle">
                              {option.helperText}
                            </span>

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`feuzon-option-meta ${
                                  isSelected
                                    ? 'is-selected'
                                    : deltaMeta.className
                                }`}
                              >
                                {isSelected ? 'Selected' : deltaMeta.text}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <label>Hardware Finish</label>

                    <div className="feuzon-option-grid">
                      {hardwareOptions.map((option) => {
                        const isSelected = hardwareColor === option.value;

                        const deltaMeta = getOptionDeltaMeta({
                          hardwareColor: option.value,
                        });

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`feuzon-option-tile feuzon-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => setHardwareColor(option.value)}
                          >
                            <span className="feuzon-option-title">
                              {option.label}
                            </span>

                            <span className="feuzon-option-subtitle">
                              {option.description}
                            </span>

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`feuzon-option-meta ${
                                  isSelected
                                    ? 'is-selected'
                                    : deltaMeta.className
                                }`}
                              >
                                {isSelected ? 'Selected' : deltaMeta.text}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="feuzon-select-helper">
                      The standard FEUZØN reference uses Remo Controlled Sound
                      Coated batter, Remo Ambassador Hazy Snare Side, and
                      PureSound Custom Pro Steel 20-Strand wires.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="feuzon-config-breakdown-shell">
              <div className="feuzon-config-breakdown-header">
                <span className="feuzon-config-breakdown-kicker">
                  Current Configuration
                </span>
              </div>

              <div className="feuzon-config-selection-list">
                <div className="feuzon-config-selection-row">
                  <span className="feuzon-config-selection-label">
                    Foundation
                  </span>

                  <span className="feuzon-config-selection-value">
                    {size}" × {depth}" • {lugs} lugs •{' '}
                    {getStaveCountLabel(staveOption)} •{' '}
                    {getStaveThicknessLabel(staveOption)}
                  </span>
                </div>

                <div className="feuzon-config-selection-row">
                  <span className="feuzon-config-selection-label">Shell</span>

                  <span className="feuzon-config-selection-value">
                    {outerShell} / {innerStave}
                  </span>
                </div>

                <div className="feuzon-config-selection-row">
                  <span className="feuzon-config-selection-label">Finish</span>

                  <span className="feuzon-config-selection-value">
                    {finishSummary}
                  </span>
                </div>

                <div className="feuzon-config-selection-row">
                  <span className="feuzon-config-selection-label">
                    Bearing Edge
                  </span>

                  <span className="feuzon-config-selection-value">
                    {bearingEdge} • {selectedBearingEdgeMeta.spec}
                  </span>
                </div>

                <div className="feuzon-config-selection-row">
                  <span className="feuzon-config-selection-label">
                    Snare Bed
                  </span>

                  <span className="feuzon-config-selection-value">
                    {snareBed}
                  </span>
                </div>

                <div className="feuzon-config-selection-row">
                  <span className="feuzon-config-selection-label">
                    Hardware
                  </span>

                  <span className="feuzon-config-selection-value">
                    {hoopType} • {hardwareColor} •{' '}
                    {FEUZON_STANDARD_REFERENCE.throwOff}
                  </span>
                </div>

                <div className="feuzon-config-selection-row">
                  <span className="feuzon-config-selection-label">
                    Heads / Wires
                  </span>

                  <span className="feuzon-config-selection-value">
                    {FEUZON_STANDARD_REFERENCE.batterHead} •{' '}
                    {FEUZON_STANDARD_REFERENCE.resonantHead} •{' '}
                    {FEUZON_STANDARD_REFERENCE.snareWires}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={`feuzon-config-breakdown-toggle feuzon-config-breakdown-toggle--minimal ${
                  showConfigBreakdown ? 'is-open' : ''
                }`}
                onClick={() => setShowConfigBreakdown((prev) => !prev)}
              >
                <span className="feuzon-config-breakdown-toggle-text">
                  {showConfigBreakdown
                    ? 'Hide pricing detail'
                    : 'View pricing detail'}
                </span>

                <span className="feuzon-config-breakdown-toggle-state">
                  {showConfigBreakdown ? '−' : '+'}
                </span>
              </button>

              {showConfigBreakdown && (
                <div className="feuzon-config-breakdown-panel feuzon-config-breakdown-panel--minimal">
                  <div className="feuzon-config-breakdown-lines">
                    <div className="feuzon-config-breakdown-line">
                      <span>Base shell</span>

                      <strong>{formatCurrency(basePrices[size] || 0)}</strong>
                    </div>

                    {(depthPrices[size]?.[normalizeDepthValue(depth)] || 0) >
                      0 && (
                      <div className="feuzon-config-breakdown-line">
                        <span>Depth: {depth}"</span>

                        <strong>
                          (+{depthPrices[size][normalizeDepthValue(depth)]})
                        </strong>
                      </div>
                    )}

                    {hardwareUpchargeMap[hardwareColor] > 0 && (
                      <div className="feuzon-config-breakdown-line">
                        <span>Hardware: {hardwareColor}</span>

                        <strong>(+{hardwareUpchargeMap[hardwareColor]})</strong>
                      </div>
                    )}

                    {hoopUpchargeMap[hoopType] !== 0 && (
                      <div className="feuzon-config-breakdown-line">
                        <span>Hoops: {hoopType}</span>

                        <strong>
                          {hoopUpchargeMap[hoopType] > 0
                            ? `(+${hoopUpchargeMap[hoopType]})`
                            : `(-${Math.abs(hoopUpchargeMap[hoopType])})`}
                        </strong>
                      </div>
                    )}

                    {finishUpchargeMap[finishSystem] > 0 && (
                      <div className="feuzon-config-breakdown-line">
                        <span>Finish: {finishSystem}</span>

                        <strong>(+{finishUpchargeMap[finishSystem]})</strong>
                      </div>
                    )}

                    {getFinishTimelineWeeks(finishSystem) > 0 && (
                      <div className="feuzon-config-breakdown-line">
                        <span>Finish timeline</span>

                        <strong>
                          +{getFinishTimelineWeeks(finishSystem)} week
                          {getFinishTimelineWeeks(finishSystem) > 1 ? 's' : ''}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="feuzon-price-stack">
              {/* <span className="feuzon-price-starting-label">
                Builds starting at $950
              </span> */}

              <p className="feuzon-detail-price">
                {formatCurrency(totalPrice)}
              </p>
            </div>

            <p className="delivery-time">{estimatedDeliveryLabel}</p>

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
          </aside>

          <section className="feuzon-voice-panel feuzon-voice-read-card feuzon-voice-read-card--reworked">
            <div className="feuzon-voice-read-header feuzon-voice-read-header--polished">
              <span className="feuzon-summary-kicker">
                Ober LegacyPrint™ Voice Comparison
              </span>

              <p className="feuzon-read-summary feuzon-read-summary--wide">
                Compare your current FEUZØN build against a reference drum to
                see how its response shifts across the core sound metrics.
              </p>
            </div>

            <div className="feuzon-voice-read-flow">
              <div className="feuzon-reference-card-shell">
                <div className="feuzon-reference-card-head">
                  <span className="feuzon-summary-kicker">Reference Drum</span>

                  <p className="feuzon-chart-reference-subcopy">
                    Choose the drum you want this FEUZØN build compared against.
                    The builder opens at the lowest starting configuration,
                    while the FEUZØN standard reference uses a 14&quot; ×
                    6.0&quot; Maple / Walnut + Birch hybrid benchmark with 16
                    staves, 8 lugs, Die-Cast hoops, Chrome hardware, Balanced
                    Hybrid Edge, Standard snare bed, Natural Scorched Gloss
                    finish, Remo Controlled Sound Coated batter, Remo Ambassador
                    Hazy Snare Side, and PureSound Custom Pro Steel 20-Strand
                    wires.
                  </p>
                </div>

                <div
                  className="feuzon-benchmark-read feuzon-benchmark-read--glow"
                  key={benchmarkGlowPulseKey}
                >
                  <div className="feuzon-benchmark-hero feuzon-benchmark-hero--refined">
                    <div className="feuzon-benchmark-hero-image-shell">
                      <img
                        src={
                          selectedBenchmarkImagePath ||
                          FEUZON_REFERENCE_IMAGE_FALLBACK
                        }
                        alt={
                          selectedBenchmarkType?.typeLabel
                            ? `${selectedBenchmarkType.typeLabel} reference drum`
                            : 'Selected reference drum'
                        }
                        className="feuzon-benchmark-hero-image"
                        onError={(e) => {
                          e.currentTarget.src = FEUZON_REFERENCE_IMAGE_FALLBACK;
                        }}
                      />
                    </div>

                    <div className="feuzon-benchmark-hero-copy">
                      <div className="feuzon-benchmark-hero-copy-top">
                        <span className="feuzon-benchmark-pill">
                          Selected Reference
                        </span>

                        <h4 className="feuzon-benchmark-hero-title">
                          {selectedBenchmarkType?.typeLabel || 'Reference Drum'}

                          {selectedBenchmarkSize?.label
                            ? ` • ${selectedBenchmarkSize.label}`
                            : ''}
                        </h4>

                        <p className="feuzon-benchmark-hero-description">
                          {selectedBenchmarkType?.shortDescription ||
                            'Reference drum selected for tonal comparison.'}
                        </p>

                        <p className="feuzon-benchmark-hero-body">
                          {benchmarkReadBody}
                        </p>
                      </div>
                    </div>

                    <div className="feuzon-benchmark-selector-panel">
                      <div className="feuzon-benchmark-selector-stack feuzon-benchmark-selector-stack--hero">
                        <div className="feuzon-benchmark-selector-group">
                          <label className="feuzon-benchmark-selector-label">
                            Reference Family
                          </label>

                          <select
                            className="feuzon-benchmark-selector"
                            value={selectedBenchmarkFamily?.familyId || ''}
                            onChange={(e) =>
                              handleBenchmarkFamilyChange(e.target.value)
                            }
                          >
                            {benchmarkFamilyOptions.map((family) => (
                              <option
                                key={family.familyId}
                                value={family.familyId}
                              >
                                {family.familyLabel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="feuzon-benchmark-selector-group">
                          <label className="feuzon-benchmark-selector-label">
                            Reference Drum
                          </label>

                          <select
                            className="feuzon-benchmark-selector"
                            value={selectedBenchmarkType?.typeId || ''}
                            onChange={(e) =>
                              handleBenchmarkTypeChange(e.target.value)
                            }
                          >
                            {(
                              selectedBenchmarkFamily?.benchmarkTypes || []
                            ).map((type) => (
                              <option key={type.typeId} value={type.typeId}>
                                {type.typeLabel}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="feuzon-benchmark-selector-group">
                          <label className="feuzon-benchmark-selector-label">
                            Reference Size
                          </label>

                          <select
                            className="feuzon-benchmark-selector"
                            value={selectedBenchmarkSize?.sizeId || ''}
                            onChange={(e) =>
                              handleBenchmarkSizeChange(e.target.value)
                            }
                          >
                            {(
                              selectedBenchmarkType?.presetSizeOptions || []
                            ).map((sizeOption) => (
                              <option
                                key={sizeOption.sizeId}
                                value={sizeOption.sizeId}
                              >
                                {sizeOption.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="feuzon-benchmark-selector-reset-row">
                        <button
                          type="button"
                          className="feuzon-benchmark-reset-button"
                          onClick={handleResetBenchmark}
                        >
                          Reset to FEUZØN Standard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="feuzon-voice-comparison-shell">
                <div className="feuzon-voice-support-grid feuzon-voice-support-grid--top">
                  <div className="feuzon-tone-summary-card feuzon-tone-summary-card--stacked feuzon-tone-summary-card--polished">
                    <div
                      className="feuzon-tone-summary-icon"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M5 12h3l2-4 3 8 2-4h4" />
                      </svg>
                    </div>

                    <div className="feuzon-tone-summary-copy">
                      <span className="feuzon-summary-kicker">
                        Tone Summary
                      </span>

                      <p>{toneSummaryText}</p>

                      <p className="feuzon-tone-summary-helper">
                        This summary shifts as your build and selected reference
                        drum change.
                      </p>
                    </div>
                  </div>

                  <div className="feuzon-voice-range-card feuzon-voice-range-card--polished">
                    <div className="feuzon-voice-range-head">
                      <span className="feuzon-summary-kicker">
                        Overall Voice Range
                      </span>

                      <p className="feuzon-voice-range-intro">
                        This shows where each drum generally sits across the
                        tonal spectrum — from warmer fundamental body to
                        brighter upper-register presence.
                      </p>
                    </div>

                    <div className="feuzon-voice-range-scale">
                      <div className="feuzon-voice-range-labels">
                        <div className="feuzon-voice-range-stop">
                          <span className="feuzon-voice-range-stop-title">
                            Warm / Full
                          </span>

                          <span className="feuzon-voice-range-stop-sub">
                            80–180 Hz · Lower body
                          </span>
                        </div>

                        <div className="feuzon-voice-range-stop">
                          <span className="feuzon-voice-range-stop-title">
                            Balanced
                          </span>

                          <span className="feuzon-voice-range-stop-sub">
                            180–350 Hz · Low-mid
                          </span>
                        </div>

                        <div className="feuzon-voice-range-stop">
                          <span className="feuzon-voice-range-stop-title">
                            Presence
                          </span>

                          <span className="feuzon-voice-range-stop-sub">
                            350 Hz–1.2 kHz · Mid
                          </span>
                        </div>

                        <div className="feuzon-voice-range-stop">
                          <span className="feuzon-voice-range-stop-title">
                            Crisp / Cutting
                          </span>

                          <span className="feuzon-voice-range-stop-sub">
                            1.2–4 kHz · Upper-mid
                          </span>
                        </div>

                        <div className="feuzon-voice-range-stop">
                          <span className="feuzon-voice-range-stop-title">
                            Bright / Airy
                          </span>

                          <span className="feuzon-voice-range-stop-sub">
                            4–10 kHz · Highs
                          </span>
                        </div>
                      </div>

                      <div
                        className="feuzon-voice-range-track"
                        aria-label="Overall voice range from warm and full to bright and airy"
                      >
                        <div className="feuzon-voice-range-track-line" />

                        <div
                          className="feuzon-voice-range-marker feuzon-voice-range-marker--current"
                          style={{
                            left: getRangeMarkerLeft(
                              projectedVoiceRangePosition
                            ),
                          }}
                        >
                          <span className="feuzon-voice-range-marker-label">
                            Build
                          </span>
                        </div>

                        <div
                          className="feuzon-voice-range-marker feuzon-voice-range-marker--reference"
                          style={{
                            left: getRangeMarkerLeft(
                              benchmarkVoiceRangePosition
                            ),
                          }}
                        >
                          <span className="feuzon-voice-range-marker-label">
                            Ref
                          </span>
                        </div>
                      </div>

                      <div className="feuzon-voice-range-footer">
                        <span>Darker / thicker body</span>

                        <span>Brighter / more articulate edge</span>
                      </div>

                      <div className="feuzon-voice-range-legend">
                        <span className="feuzon-voice-range-legend-item">
                          <span className="feuzon-voice-range-dot feuzon-voice-range-dot--current" />
                          Current Build
                        </span>

                        <span className="feuzon-voice-range-legend-item">
                          <span className="feuzon-voice-range-dot feuzon-voice-range-dot--reference" />
                          Selected Reference
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="feuzon-chart-top-shell feuzon-chart-top-shell--polished">
                  <div className="feuzon-chart-title-shell">
                    <span className="feuzon-chart-eyebrow">
                      Voice comparison
                    </span>

                    <h4 className="feuzon-chart-title">
                      Current Build vs Reference Drum
                    </h4>

                    <p className="feuzon-chart-title-subcopy">
                      Hover or click a metric to explore how this build shifts
                      against your selected reference drum.
                    </p>

                    <div
                      className="feuzon-chart-view-switch feuzon-chart-view-switch--inline"
                      role="tablist"
                      aria-label="Chart view"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={chartView === 'spider'}
                        className={`feuzon-chart-icon-toggle ${
                          chartView === 'spider' ? 'is-active' : ''
                        }`}
                        onClick={() => setChartView('spider')}
                        title="Spider chart"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <polygon points="12 3.5 19 8 16.5 17.5 7.5 17.5 5 8 12 3.5" />

                          <polygon points="12 7 15.8 9.4 14.5 14.8 9.5 14.8 8.2 9.4 12 7" />

                          <line x1="12" y1="3.5" x2="12" y2="20" />

                          <line x1="5" y1="8" x2="19" y2="8" />

                          <line x1="7.5" y1="17.5" x2="16.5" y2="17.5" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-selected={chartView === 'bars'}
                        className={`feuzon-chart-icon-toggle ${
                          chartView === 'bars' ? 'is-active' : ''
                        }`}
                        onClick={() => setChartView('bars')}
                        title="Bar chart"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <line x1="4" y1="20" x2="20" y2="20" />

                          <rect x="5.5" y="11.5" width="3" height="8" rx="1" />

                          <rect x="10.5" y="8.5" width="3" height="11" rx="1" />

                          <rect x="15.5" y="5.5" width="3" height="14" rx="1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="feuzon-chart-wrap feuzon-chart-wrap--voice-read feuzon-chart-wrap--simple">
                  <div className="feuzon-chart-stage">
                    {chartView === 'spider' ? (
                      <SpiderChart
                        data={chartValues}
                        labels={AXIS_META}
                        pointColors={AXIS_POINT_COLORS}
                        activeKey={activeAxisKey}
                        onAxisChange={handleAxisChange}
                      />
                    ) : (
                      <BarChart
                        data={chartBarData}
                        activeKey={activeAxisKey}
                        onAxisChange={handleAxisChange}
                        activeColor={activeAxisColor}
                      />
                    )}
                  </div>
                </div>

                <div
                  className="feuzon-axis-insight-panel"
                  style={{
                    '--axis-accent': activeAxisColor,
                  }}
                >
                  <div className="feuzon-axis-insight-panel-head">
                    <div className="feuzon-axis-insight-panel-title-group">
                      <span className="feuzon-summary-kicker">
                        Metric Insight
                      </span>

                      <div className="feuzon-axis-insight-panel-title-row">
                        <span className="feuzon-axis-insight-panel-icon">
                          <MetricIcon
                            type={activeAxisMeta.icon}
                            color={activeAxisColor}
                            size={20}
                          />
                        </span>

                        <div className="feuzon-axis-insight-panel-title-copy">
                          <h4>{activeAxisMeta.label}</h4>

                          <span>{AXIS_SUBLABELS[activeAxisMeta.key]}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`feuzon-axis-insight-score-pill ${
                        activeAxisDeltaValue > 0
                          ? 'is-positive'
                          : activeAxisDeltaValue < 0
                            ? 'is-negative'
                            : 'is-neutral'
                      }`}
                    >
                      {activeAxisScore}
                    </span>
                  </div>

                  <div className="feuzon-axis-insight-panel-body">
                    <div className="feuzon-axis-insight-main-copy">
                      <p className="feuzon-axis-insight-short">
                        {activeAxisCopy.short}
                      </p>

                      <p className="feuzon-axis-insight-detail">
                        {activeAxisCopy.detail}
                      </p>

                      <p className="feuzon-axis-insight-scale-read">
                        <strong>Lower / closer to center:</strong>{' '}
                        {activeAxisCopy.scaleLow}
                      </p>

                      <p className="feuzon-axis-insight-scale-read">
                        <strong>Higher / farther outward:</strong>{' '}
                        {activeAxisCopy.scaleHigh}
                      </p>
                    </div>

                    <div className="feuzon-axis-impact-panel">
                      <span className="feuzon-axis-impact-label">
                        Voice contributors
                      </span>

                      <div className="feuzon-axis-impact-list">
                        {activeAxisImpactFactors.map((factor) => (
                          <div
                            key={factor.label}
                            className={`feuzon-axis-impact-row is-${factor.strength}`}
                          >
                            <span className="feuzon-axis-impact-name">
                              {factor.label}
                            </span>

                            <span className="feuzon-axis-impact-strength">
                              <span className="feuzon-axis-impact-dot" />

                              <span className="feuzon-axis-impact-text">
                                {factor.strength === 'strong'
                                  ? 'High'
                                  : factor.strength === 'medium'
                                    ? 'Medium'
                                    : 'Light'}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
};

export default FeuzonProductDetail;
