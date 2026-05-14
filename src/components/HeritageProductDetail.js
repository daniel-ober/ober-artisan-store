import React, { useState, useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';

import VoiceThreadMap from './VoiceThreadMap';

import {
  Zap,
  Waves,
  Flame,
  Volume2,
  SunMedium,
  Feather,
  Crosshair,
  Lock,
} from 'lucide-react';

import toast from 'react-hot-toast';

import { db } from '../firebaseConfig';

import LEGACYPRINT_BENCHMARK_CATALOG from '../data/legacyPrint/benchmarkCatalog';

import { useCart } from '../context/CartContext';

import buildHeritageVoiceRead from '../utils/legacyPrint/buildHeritageVoiceRead';

import buildVoiceThreadReadout from '../utils/legacyPrint/buildVoiceThreadReadout';

import './HeritageProductDetail.css';

const AXIS_META = [
  { key: 'attack', label: 'Attack', icon: 'attack' },

  { key: 'brightness', label: 'Brightness', icon: 'brightness' },

  { key: 'projection', label: 'Projection', icon: 'projection' },

  { key: 'sustain', label: 'Sustain', icon: 'sustain' },

  { key: 'warmth', label: 'Warmth', icon: 'warmth' },

  { key: 'sensitivity', label: 'Sensitivity', icon: 'sensitivity' },

  { key: 'control', label: 'Control', icon: 'control' },
];

const AXIS_COLOR_BY_KEY = {
  attack: '#ff7448',

  brightness: '#e7d98f',

  projection: '#ffb53a',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  sensitivity: '#68d9df',

  control: '#9e8bff',
};

const AXIS_SUBLABELS = {
  attack: 'Strike',

  brightness: 'Clarity',

  projection: 'Carry',

  sustain: 'Bloom',

  warmth: 'Body',

  sensitivity: 'Touch',

  control: 'Refinement',
};

const AXIS_IMPACT_FACTORS = {
  attack: [
    { label: 'Hoop type', strength: 'strong' },

    { label: 'Bearing edge', strength: 'strong' },

    { label: 'Shell depth', strength: 'medium' },

    { label: 'Lug count', strength: 'light' },
  ],

  sustain: [
    { label: 'Hoop type', strength: 'strong' },

    { label: 'Shell depth', strength: 'strong' },

    { label: 'Shell thickness', strength: 'medium' },

    { label: 'Lug count', strength: 'light' },
  ],

  warmth: [
    { label: 'Shell size', strength: 'strong' },

    { label: 'Wood / shell recipe', strength: 'strong' },

    { label: 'Shell thickness', strength: 'medium' },

    { label: 'Finish intensity', strength: 'light' },
  ],

  projection: [
    { label: 'Shell size', strength: 'strong' },

    { label: 'Depth', strength: 'strong' },

    { label: 'Hoop type', strength: 'medium' },

    { label: 'Shell construction', strength: 'light' },
  ],

  brightness: [
    { label: 'Bearing edge', strength: 'strong' },

    { label: 'Hoop type', strength: 'strong' },

    { label: 'Shell thickness', strength: 'medium' },

    { label: 'Finish intensity', strength: 'light' },
  ],

  sensitivity: [
    { label: 'Snare response setup', strength: 'strong' },

    { label: 'Bearing edge', strength: 'strong' },

    { label: 'Shell depth', strength: 'medium' },

    { label: 'Hoop type', strength: 'light' },
  ],

  control: [
    { label: 'Hoop type', strength: 'strong' },

    { label: 'Lug count', strength: 'strong' },

    { label: 'Shell thickness', strength: 'medium' },

    { label: 'Bearing edge', strength: 'light' },
  ],
};

const BASE_LEGACYPRINT_TABS = [
  {
    key: 'firstListen',

    label: 'First Listen',
  },

  {
    key: 'playerAnalysis',

    label: 'Player Analysis',
  },

  {
    key: 'legacyTuning',

    label: 'LegacyTuning™',
  },

  {
    key: 'legacyPrintRead',

    label: 'LegacyPrint™ Analysis',
  },
];

const REFERENCE_SETUP_TAB = {
  key: 'referenceSetup',

  label: 'Reference Setup',
};

const DISCOVERY_LEGACYPRINT_TAB = {
  key: 'discovery',

  label: 'Discovery',

  locked: true,
};

const COMPARE_INTRO_STORAGE_KEY = 'heritageLegacyPrintCompareIntroSeen';

const LEGACY_TUNING_DISPLAY_MIN_HZ = 55;

const LEGACY_TUNING_DISPLAY_MAX_HZ = 430;

const getLegacyTuningRangeBounds = (position) => {
  const center = Number(position || 3);

  const width = 0.42;

  return {
    start: Math.max(1, center - width),

    end: Math.min(5, center + width),

    center,
  };
};

const getLegacyTuningHzRange = (range) => {
  const mapPositionToHz = (position) => {
    const clamped = Math.max(1, Math.min(5, Number(position || 3)));

    return (
      LEGACY_TUNING_DISPLAY_MIN_HZ +
      ((clamped - 1) / 4) *
        (LEGACY_TUNING_DISPLAY_MAX_HZ - LEGACY_TUNING_DISPLAY_MIN_HZ)
    );
  };

  const startHz = Math.round(mapPositionToHz(range.start));

  const endHz = Math.round(mapPositionToHz(range.end));

  return `${startHz}–${endHz} Hz`;
};

const NOTE_NAMES = [
  'C',

  'C#',

  'D',

  'D#',

  'E',

  'F',

  'F#',

  'G',

  'G#',

  'A',

  'A#',

  'B',
];

const frequencyToNearestNote = (frequency) => {
  const hz = Number(frequency);

  if (!Number.isFinite(hz) || hz <= 0) return null;

  const midi = Math.round(69 + 12 * Math.log2(hz / 440));

  const noteIndex = ((midi % 12) + 12) % 12;

  const octave = Math.floor(midi / 12) - 1;

  return `${NOTE_NAMES[noteIndex]}${octave}`;
};

const parseHzRange = (rangeText = '') => {
  const matches = String(rangeText).match(/\d+/g);

  if (!matches || matches.length < 2) {
    return {
      startHz: null,

      endHz: null,
    };
  }

  return {
    startHz: Number(matches[0]),

    endHz: Number(matches[1]),
  };
};

const getNearestNoteWindow = (rangeText = '') => {
  const { startHz, endHz } = parseHzRange(rangeText);

  const startNote = frequencyToNearestNote(startHz);

  const endNote = frequencyToNearestNote(endHz);

  if (!startNote || !endNote) return '—';

  return `${startNote}–${endNote}`;
};

const getUniversalProfileFromSummary = (summary = {}) => {
  return (
    summary?.universalProfile ||
    summary?.universalVoiceRead?.profile ||
    summary?.profile ||
    {}
  );
};

const getUniversalReadsFromSummary = (summary = {}) => {
  return summary?.universalVoiceRead?.reads || {};
};

const getReferenceLabel = (selectedBenchmarkType, selectedBenchmarkSize) => {
  const typeLabel =
    selectedBenchmarkType?.typeLabel || 'Heritage reference drum';

  const sizeLabel = selectedBenchmarkSize?.label
    ? ` (${selectedBenchmarkSize.label})`
    : '';

  return `${typeLabel}${sizeLabel}`;
};

const buildProjectedVoiceRange = (summary) => {
  const profile = getUniversalProfileFromSummary(summary);

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
    (projection - 5) * 0.18;

  return Math.max(1, Math.min(5, weighted));
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
      (projection - 5) * 0.18;

    return Math.max(1, Math.min(5, weighted));
  }

  const typeFallback =
    BENCHMARK_VOICE_RANGE_FALLBACKS[benchmarkType?.typeId] ?? 3;

  const sizeLabel = String(benchmarkSize?.label || '');

  const depthMatch = sizeLabel.match(/x\s*(\d+(?:\.\d+)?)/i);

  const depth = depthMatch ? Number(depthMatch[1]) : null;

  let sizeAdjustment = 0;

  if (depth) {
    if (depth <= 5) {
      sizeAdjustment = 0.08;
    } else if (depth >= 7) {
      sizeAdjustment = -0.08;
    }
  }

  return Math.max(1, Math.min(5, typeFallback + sizeAdjustment));
};

const buildCurrentBuildToneSummary = (summary) => {
  const profile = getUniversalProfileFromSummary(summary);

  const values = {
    attack: Number(profile.attack ?? 5),

    sustain: Number(profile.sustain ?? 5),

    warmth: Number(profile.warmth ?? 5),

    projection: Number(profile.projection ?? 5),

    brightness: Number(profile.brightness ?? 5),

    sensitivity: Number(profile.sensitivity ?? 5),

    control: Number(profile.control ?? 5),
  };

  const phrases = [];

  if (values.warmth >= 5.6) phrases.push('a fuller, body-forward center');
  else if (values.warmth <= 4.4) phrases.push('a leaner center');

  if (values.attack >= 5.6) phrases.push('a quicker front edge');
  else if (values.attack <= 4.4) phrases.push('a rounder front edge');

  if (values.sustain >= 5.6) phrases.push('a longer bloom after the strike');
  else if (values.sustain <= 4.4) phrases.push('a shorter, tighter note tail');

  if (values.projection >= 5.6) phrases.push('more outward push');
  else if (values.projection <= 4.4) phrases.push('a more intimate room feel');

  if (values.brightness >= 5.6) phrases.push('more top-end clarity');
  else if (values.brightness <= 4.4) phrases.push('a darker upper edge');

  if (values.sensitivity >= 5.6) phrases.push('more touch response');
  else if (values.sensitivity <= 4.4) phrases.push('a firmer playing feel');

  if (values.control >= 5.6) phrases.push('a more focused note shape');
  else if (values.control <= 4.4) phrases.push('a more open note shape');

  const topPhrases = phrases.slice(0, 3);

  if (!topPhrases.length) {
    return 'This Heritage configuration stays close to the center of the line: grounded, familiar, and balanced without one voice trait taking over.';
  }

  if (topPhrases.length === 1) {
    return `This Heritage configuration leans toward ${topPhrases[0]} while staying inside the rooted Heritage voice.`;
  }

  if (topPhrases.length === 2) {
    return `This Heritage configuration leans toward ${topPhrases[0]} and ${topPhrases[1]} while staying inside the rooted Heritage voice.`;
  }

  return `This Heritage configuration leans toward ${topPhrases[0]}, ${topPhrases[1]}, and ${topPhrases[2]} while staying inside the rooted Heritage voice.`;
};

const buildToneSummary = (
  summary,

  selectedBenchmarkType = null,

  selectedBenchmarkSize = null
) => {
  const profile = getUniversalProfileFromSummary(summary);

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

  if (deltas.warmth > 0.35) phrases.push('a fuller center');
  else if (deltas.warmth < -0.35) phrases.push('a leaner center');

  if (deltas.brightness > 0.35) phrases.push('more top-end edge');
  else if (deltas.brightness < -0.35) phrases.push('a smoother top end');

  if (deltas.attack > 0.35) phrases.push('a quicker front edge');
  else if (deltas.attack < -0.35) phrases.push('a rounder front edge');

  if (deltas.sustain > 0.35) phrases.push('a longer note tail');
  else if (deltas.sustain < -0.35) phrases.push('a shorter note tail');

  if (deltas.control > 0.35) phrases.push('more focus');
  else if (deltas.control < -0.35) phrases.push('a more open feel');

  if (deltas.sensitivity > 0.35) phrases.push('more touch response');
  else if (deltas.sensitivity < -0.35)
    phrases.push('slightly less touch response');

  if (!phrases.length) {
    return `This Heritage configuration sits very close to ${referenceLabel}. The selected reference is acting as the benchmark, so small movements show where this build adds or reduces emphasis.`;
  }

  const topPhrases = phrases.slice(0, 3);

  if (topPhrases.length === 1) {
    return `Compared with ${referenceLabel}, this Heritage configuration leans toward ${topPhrases[0]}.`;
  }

  if (topPhrases.length === 2) {
    return `Compared with ${referenceLabel}, this Heritage configuration leans toward ${topPhrases[0]} and ${topPhrases[1]}.`;
  }

  return `Compared with ${referenceLabel}, this Heritage configuration leans toward ${topPhrases[0]}, ${topPhrases[1]}, and ${topPhrases[2]}.`;
};

const AXIS_INSIGHT_COPY = {
  attack: {
    short: 'How quickly the drum responds when it is hit.',

    detail:
      'Attack is the very beginning of the sound — the first snap, tap, or rounded response you hear when the stick touches the head. In this Heritage build, it describes whether the drum starts the note quickly and clearly, or more softly and rounded.',

    scaleLow:
      'A lower attack read means the first moment of the sound is rounder, softer, and less sharp. The drum feels a little more relaxed at the start of the hit.',

    scaleHigh:
      'A higher attack read means the first moment of the sound is quicker, clearer, and more defined. The drum feels more immediate when it is played.',
  },

  sustain: {
    short: 'How long the sound keeps going after the hit.',

    detail:
      'Sustain is what remains after the first strike. It describes whether the note fades quickly or continues to bloom, ring, and open up after the drum is hit.',

    scaleLow:
      'A lower sustain read means the sound fades sooner. The drum feels tighter, shorter, and more contained.',

    scaleHigh:
      'A higher sustain read means the sound lasts longer. The drum feels more open, blooming, and resonant after the hit.',
  },

  warmth: {
    short: 'How full, woody, and body-rich the drum feels.',

    detail:
      'Warmth is the body of the drum sound — the lower, fuller, woodier part that makes a snare feel grounded instead of thin, sharp, or glassy.',

    scaleLow:
      'A lower warmth read means the drum feels leaner, cleaner, and less full in the body of the sound.',

    scaleHigh:
      'A higher warmth read means the drum has more body, wood character, and low-mid fullness. The sound feels deeper and more grounded.',
  },

  projection: {
    short: 'How far forward the drum feels in the room or mix.',

    detail:
      'Projection is about carry and presence. It can feel louder, but it is not just volume. A drum with more projection feels more forward, more present, and easier to notice in a room or recording.',

    scaleLow:
      'A lower projection read means the drum feels more close, intimate, or tucked-in. It may sit nearer to the player instead of jumping forward.',

    scaleHigh:
      'A higher projection read means the drum carries outward more strongly. It feels more present, forward, and easier to hear in a room or mix.',
  },

  brightness: {
    short: 'How much crisp top-end snap and clarity you hear.',

    detail:
      'Brightness is the upper edge of the sound — the snap, crack, sheen, and clarity that help the drum cut through. It is what makes a snare feel crisp or darker on top.',

    scaleLow:
      'A lower brightness read means the top of the sound feels darker, smoother, and less sharp.',

    scaleHigh:
      'A higher brightness read means the drum has more crispness, snap, and upper-edge clarity.',
  },

  sensitivity: {
    short: 'How easily the drum responds to light playing.',

    detail:
      'Sensitivity describes how much detail the drum gives back when it is played softly. A more sensitive drum reacts more easily to ghost notes, lighter strokes, and small changes in touch.',

    scaleLow:
      'A lower sensitivity read means the drum may need a little more energy before it fully opens up.',

    scaleHigh:
      'A higher sensitivity read means the drum responds more easily to lighter playing and reveals more detail at softer dynamics.',
  },

  control: {
    short: 'How focused and organized the sound feels.',

    detail:
      'Control describes how neatly the drum holds its sound together. It is not about the drum being physically controlled — it is about whether the note feels focused, tidy, and easy to place instead of wide, messy, or overly ringy.',

    scaleLow:
      'A lower control read means the drum feels more open, wider, and less contained. Some players may hear this as more natural spread.',

    scaleHigh:
      'A higher control read means the note feels more focused, organized, and easier to place in a song, room, or recording.',
  },
};

const DEFAULT_BENCHMARK_FAMILY_ID = 'ober-custom';

const DEFAULT_BENCHMARK_TYPE_ID = 'heritage-oak-reference';

const DEFAULT_BENCHMARK_SIZE_ID = '14x5_5';

const HERITAGE_STANDARD_REFERENCE = {
  series: 'HERITAGE Standard Reference',

  benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,

  benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,

  benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,

  size: '14',

  depth: '5.5',

  lugs: '8',

  staveOption: '16 - 11mm',

  staveQuantity: 16,

  shellThickness: '11mm',

  shellConstruction: 'Northern Red Oak stave shell',

  primaryWood: 'Northern Red Oak',

  hoopType: 'Triple Flange',

  hardwareColor: 'Chrome',

  bearingEdge: '45° inner bearing edge with softened outer roundover',

  snareBed: 'Standard',

  finish: 'Medium Torch',

  throwOff: 'Trick GS007',

  batterHead: 'Remo Ambassador Coated',

  resonantHead: 'Remo Ambassador Hazy Snare Side',

  snareWires: 'PureSound Custom Pro Steel 20-Strand',

  tuning: 'Medium',

  muffling: 'None',
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(0)}`;

const HERITAGE_STANDARD_BEARING_EDGE = HERITAGE_STANDARD_REFERENCE.bearingEdge;

const HERITAGE_STANDARD_SNARE_BED = HERITAGE_STANDARD_REFERENCE.snareBed;

const HERITAGE_VOICE_READ_HARDWARE_COLOR =
  HERITAGE_STANDARD_REFERENCE.hardwareColor;

const HERITAGE_FINISH_SWATCHES = {
  'Light Torch': '/swatches/heritage/light.png',

  'Medium Torch': '/swatches/heritage/medium.png',

  Blackened: '/swatches/heritage/blackened.png',
};

const basePrices = { 12: 850, 13: 950, 14: 1050 };

const reRingCost = 150;

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
};

const staveOptions = {
  12: ['16 - 13mm', '12 - 8mm + $150 (Re-Rings Required)'],

  13: ['16 - 12mm'],

  14: ['20 - 15mm', '16 - 11mm', '10 - 7mm + $150 (Re-Rings Required)'],
};

const lugOptions = {
  12: ['8', '6'],

  13: ['8'],

  14: ['8', '10'],
};

const SHELL_RECIPE_LUG_RULES = {
  '12|16 - 13mm': ['8'],

  '12|12 - 8mm + $150 (Re-Rings Required)': ['6'],

  '13|16 - 12mm': ['8'],

  '14|20 - 15mm': ['10'],

  '14|16 - 11mm': ['8'],

  '14|10 - 7mm + $150 (Re-Rings Required)': ['10'],
};

const getShellRecipeKey = (selectedSize, selectedStaveOption) => {
  return `${String(selectedSize)}|${String(selectedStaveOption)}`;
};

const getAvailableStaveOptions = (selectedSize) => {
  return staveOptions[String(selectedSize)] || [];
};

const getAvailableLugsForShellRecipe = (selectedSize, selectedStaveOption) => {
  return (
    SHELL_RECIPE_LUG_RULES[
      getShellRecipeKey(selectedSize, selectedStaveOption)
    ] ||
    lugOptions[String(selectedSize)] ||
    []
  );
};

const isLugAvailableForShellRecipe = ({
  selectedSize,

  selectedStaveOption,

  lugOption,
}) => {
  return getAvailableLugsForShellRecipe(
    selectedSize,

    selectedStaveOption
  ).includes(String(lugOption));
};

const getUnavailableLugReason = ({
  selectedSize,

  selectedStaveOption,

  lugOption,
}) => {
  const availableLugs = getAvailableLugsForShellRecipe(
    selectedSize,

    selectedStaveOption
  );

  if (!availableLugs.length || availableLugs.includes(String(lugOption))) {
    return '';
  }

  const thickness = getStaveThicknessLabel(selectedStaveOption);

  const staveCount = getStaveCountLabel(selectedStaveOption);

  return `Only available as ${availableLugs.join(
    ' or '
  )}-lug for this ${thickness} / ${staveCount} shell. Stave shells need the lug pattern to match the shell’s thickness, stave count, and tension spread so the head loads evenly around the drum.`;
};

const hardwareOptions = [
  {
    label: 'Chrome',

    value: 'Chrome',

    upcharge: 0,

    description: 'Classic and clean.',
  },

  {
    label: 'Black Nickel',

    value: 'Black Nickel',

    upcharge: 50,

    description: 'Slightly darker, more modern feel.',
  },

  {
    label: 'Brass / Gold',

    value: 'Brass/Gold',

    upcharge: 150,

    description: 'Richer, warmer visual statement.',
  },
];

const hoopOptions = [
  {
    label: 'Triple Flange',

    value: 'Triple Flange',

    upcharge: 0,

    description: 'More open and classic.',
  },

  {
    label: 'Die-Cast',

    value: 'Die-Cast',

    upcharge: 100,

    description: 'Tighter response and more focus.',
  },
];

const scorchOptions = ['Light Torch', 'Medium Torch', 'Blackened'];

const hardwareUpchargeMap = {
  Chrome: 0,

  'Black Nickel': 50,

  'Brass/Gold': 150,
};

const hoopUpchargeMap = {
  'Triple Flange': 0,

  'Die-Cast': 100,
};

const hasReRingFromStaveOption = (option = '') => {
  const text = String(option);

  return (
    text.includes('Re-Rings') ||
    text.includes('Re-rings') ||
    text.includes('Re Rings') ||
    text.includes('+$150') ||
    text.includes('+ $150')
  );
};

const getStaveCountLabel = (option = '') => {
  const match = String(option).match(/^(\d+)/);

  return match ? `${match[1]} stave` : option;
};

const getStaveThicknessLabel = (option = '') => {
  const cleaned = String(option).replace(' + $150 (Re-Rings Required)', '');

  const parts = cleaned.split(' - ');

  return parts[1] || '';
};

const LEGACY_TUNING_MODE = {
  BARE_SHELL: 'bare-shell',

  DRESSED: 'dressed',
};

const parseStaveOptionMeta = (option = '') => {
  const staveMatch = String(option).match(/^(\d+)/);

  const thicknessMatch = String(option).match(/(\d+(?:\.\d+)?)mm/i);

  return {
    staveCount: staveMatch ? Number(staveMatch[1]) : null,

    thicknessMm: thicknessMatch ? Number(thicknessMatch[1]) : null,

    hasReRings: hasReRingFromStaveOption(option),
  };
};

const clampLegacyTuningHz = (value) => {
  const hz = Number(value);

  if (!Number.isFinite(hz)) return 180;

  return Math.max(70, Math.min(420, hz));
};

const getHeritageBareShellCenterHz = ({
  size,

  depth,

  staveOption,

  scorchDepth,
}) => {
  const diameter = Number(size) || 14;

  const shellDepth = Number(depth) || 5.5;

  const { staveCount, thicknessMm, hasReRings } =
    parseStaveOptionMeta(staveOption);

  let hz = 185;

  hz += (14 - diameter) * 18;

  hz += (6 - shellDepth) * 18;

  hz += ((thicknessMm || 11) - 11) * 13;

  hz += ((staveCount || 16) - 16) * 4;

  if (hasReRings) {
    hz -= 6;
  }

  if (scorchDepth === 'Light Torch') {
    hz += 8;
  }

  if (scorchDepth === 'Medium Torch') {
    hz += 0;
  }

  if (scorchDepth === 'Blackened') {
    hz -= 10;
  }

  const isThinReRingPath = hasReRings && Number(thicknessMm || 11) <= 8;

  const isDeepThinFourteen =
    diameter >= 14 && shellDepth >= 6.5 && isThinReRingPath;

  if (isDeepThinFourteen) {
    hz += 18;
  }

  if (isDeepThinFourteen && shellDepth >= 7.5) {
    hz += 6;
  }

  if (isDeepThinFourteen && scorchDepth === 'Blackened') {
    hz += 6;
  }

  return clampLegacyTuningHz(Math.round(hz));
};

const getHeritageDressedCenterHz = ({
  size,

  depth,

  staveOption,

  scorchDepth,

  hoopType,
}) => {
  const bareCenter = getHeritageBareShellCenterHz({
    size,

    depth,

    staveOption,

    scorchDepth,
  });

  let dressedCenter = bareCenter * 1.15;

  if (hoopType === 'Die-Cast') {
    dressedCenter += 12;
  }

  if (hoopType === 'Triple Flange') {
    dressedCenter -= 4;
  }

  return clampLegacyTuningHz(Math.round(dressedCenter));
};

const getLegacyTuningHzRangeFromCenter = (
  centerHz,

  mode = LEGACY_TUNING_MODE.BARE_SHELL
) => {
  const center = clampLegacyTuningHz(centerHz);

  const spread = mode === LEGACY_TUNING_MODE.BARE_SHELL ? 18 : 28;

  const startHz = clampLegacyTuningHz(Math.round(center - spread));

  const endHz = clampLegacyTuningHz(Math.round(center + spread));

  return {
    startHz,

    endHz,

    centerHz: center,

    label: `${startHz}–${endHz} Hz`,
  };
};

const getLegacyTuningScalePositionFromHz = (hz) => {
  const value = clampLegacyTuningHz(hz);

  const position =
    1 +
    ((value - LEGACY_TUNING_DISPLAY_MIN_HZ) /
      (LEGACY_TUNING_DISPLAY_MAX_HZ - LEGACY_TUNING_DISPLAY_MIN_HZ)) *
      4;

  return Math.max(1, Math.min(5, position));
};

const getLegacyTuningRangeBoundsFromHz = ({ startHz, endHz, centerHz }) => {
  return {
    start: getLegacyTuningScalePositionFromHz(startHz),

    end: getLegacyTuningScalePositionFromHz(endHz),

    center: getLegacyTuningScalePositionFromHz(centerHz),
  };
};

const getReadableDelta = (delta) => {
  if (delta === 0) return '';

  if (delta > 0) return `+$${delta}`;

  return `-$${Math.abs(delta)}`;
};

const getDeltaClassName = (delta) => {
  if (delta > 0) return 'is-positive';

  if (delta < 0) return 'is-negative';

  return 'is-neutral';
};

const normalizeDepthKey = (value) => {
  const n = Number(value);

  return Number.isFinite(n) ? n.toFixed(1) : String(value);
};

const CHART_CENTER = 5;

const CHART_MIN = 0;

const CHART_MAX = 10;

const getDisplayMetricValue = (rawValue) => {
  const distanceFromCenter = rawValue - CHART_CENTER;

  const absDistance = Math.abs(distanceFromCenter);

  if (absDistance === 0) return rawValue;

  const amplifiedDistance =
    absDistance < 0.6
      ? absDistance * 1.42
      : absDistance < 1.2
        ? 0.6 * 1.42 + (absDistance - 0.6) * 1.24
        : 0.6 * 1.42 + 0.6 * 1.24 + (absDistance - 1.2) * 1.05;

  const nextValue =
    CHART_CENTER + Math.sign(distanceFromCenter) * amplifiedDistance;

  return Math.max(CHART_MIN, Math.min(CHART_MAX, nextValue));
};

const computeHeritagePrice = ({
  size,

  depth,

  staveOption,

  hardwareColor,

  hoopType,
}) => {
  let price = basePrices[size] || 0;

  price += depthPrices[size]?.[normalizeDepthKey(depth)] || 0;

  if (hasReRingFromStaveOption(staveOption)) price += reRingCost;

  price += hardwareUpchargeMap[hardwareColor] || 0;

  price += hoopUpchargeMap[hoopType] || 0;

  return price;
};

const MetricIcon = ({ type, color = '#d6b277', size = 22 }) => {
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

const renderThreadNodeIcons = (nodes = []) => {
  return (
    <span className="heritage-thread-node-icon-list" aria-label="Thread nodes">
      {nodes.map((nodeKey) => {
        const axis = AXIS_META.find((axisItem) => axisItem.key === nodeKey);

        const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

        return (
          <span
            key={nodeKey}
            className="heritage-thread-node-icon-chip"
            style={{ '--thread-node-color': color }}
            title={axis?.label || nodeKey}
            aria-label={axis?.label || nodeKey}
          >
            <MetricIcon type={axis?.icon || nodeKey} color={color} size={16} />
          </span>
        );
      })}
    </span>
  );
};

const renderThreadNodeLabelList = (nodes = []) => {
  return (
    <span className="heritage-thread-card-node-list">
      {nodes.map((nodeKey) => {
        const axis = AXIS_META.find((axisItem) => axisItem.key === nodeKey);

        const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

        return (
          <span
            key={nodeKey}
            className="heritage-thread-card-node-item"
            style={{ '--axis-color': color }}
          >
            <MetricIcon type={axis?.icon || nodeKey} color={color} size={13} />

            <span>{axis?.label || nodeKey}</span>
          </span>
        );
      })}
    </span>
  );
};

const FIRST_TELL_NODE_COPY = {
  attack:
    'How quickly the drum responds when it is hit — from softer and rounder to quicker and more defined.',

  brightness:
    'How much crisp top-end detail you hear — from darker and smoother to clearer and snappier.',

  projection:
    'How forward the drum feels in the room or mix — not just louder, but easier to notice and carry outward.',

  sustain:
    'How long the sound keeps going after the hit — from short and tight to more open and ringing.',

  warmth:
    'How full, woody, and body-rich the center of the sound feels — from lean and clean to deeper and rounder.',

  sensitivity:
    'How easily the drum responds to lighter playing — especially soft notes, ghost notes, and small changes in touch.',

  control:
    'How focused and organized the sound feels — less wide or ringy, more shaped and easy to place.',
};

const renderFirstTellNodeList = (nodes = [], nodeReads = []) => {
  const readByKey = nodeReads.reduce((acc, item) => {
    if (item?.key) acc[item.key] = item;

    return acc;
  }, {});

  return (
    <div className="heritage-firsttell-node-list">
      <p className="heritage-firsttell-node-list-title">
        What you’re most likely to notice first:
        <span>
          These are the most noticeable traits in the first impression — not
          always the loudest, best, or most extreme parts of the drum.
        </span>
      </p>

      <div className="heritage-firsttell-node-items">
        {nodes.map((nodeKey) => {
          const axis = AXIS_META.find((item) => item.key === nodeKey);

          const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

          const nodeRead = readByKey[nodeKey];

          return (
            <div
              key={nodeKey}
              className="heritage-firsttell-node-item"
              style={{ '--axis-color': color }}
              title={nodeRead?.definition || FIRST_TELL_NODE_COPY[nodeKey]}
            >
              <MetricIcon
                type={axis?.icon || nodeKey}
                color={color}
                size={18}
              />

              <strong>{axis?.label || nodeKey}</strong>

              <span>
                {nodeRead?.read ||
                  FIRST_TELL_NODE_COPY[nodeKey] ||
                  'A core part of the first impression.'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getCanonicalDominantNodes = ({
  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,
}) => {
  return getDominantVoiceNodes({
    profile,

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,
  });
};

const renderOptionGuideCopy = (guide) => {
  if (!guide) return null;

  return (
    <>
      <span className="heritage-option-guide-title">{guide.title}</span>

      <span className="heritage-option-guide-copy">{guide.body}</span>
    </>
  );
};

const getThreadColorVars = (nodes = []) => {
  const colors = nodes

    .map((nodeKey) => AXIS_COLOR_BY_KEY[nodeKey])

    .filter(Boolean);

  const fallback = '#d6b277';

  return {
    '--thread-accent': colors[0] || fallback,

    '--thread-accent-2': colors[1] || colors[0] || fallback,

    '--thread-accent-3': colors[2] || colors[1] || colors[0] || fallback,

    '--thread-accent-4':
      colors[3] || colors[2] || colors[1] || colors[0] || fallback,
  };
};

const getVoiceReadLabel = (slotKey) => {
  if (slotKey === 'simple') return 'First Tell';

  if (slotKey === 'shaped') return 'Player Read';

  return 'LegacyPrint™';
};

const VoiceMapping_READ_COPY = {
  simple: {
    kicker: 'First Listen',

    titleFallback: 'First Listen',

    typeLabel: 'First Listen',

    visualMode: 'triangle',

    intro:
      'The immediate sound impression: what your ear notices first when the drum speaks.',
  },

  shaped: {
    kicker: 'Player Analysis',

    titleFallback: 'Player Analysis',

    typeLabel: 'Player Analysis',

    visualMode: 'spider',

    intro:
      'A fuller build-and-feel read showing how this drum responds across the seven LegacyPrint™ voice nodes.',
  },
};

const getVoiceMappingReadCopy = (slotKey = '') => {
  return VoiceMapping_READ_COPY[slotKey] || VoiceMapping_READ_COPY.simple;
};

const getVoiceMappingVariantForSlot = (slotKey = '') => {
  if (slotKey === 'simple') return 'firstTell';

  return 'player';
};

const getVoiceMappingDisplayTitle = ({
  relationship,

  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,
}) => {
  if (relationship?.slotKey === 'simple') {
    return getFirstTellDisplayTitle({
      profile,

      size,

      depth,

      lugs,

      staveOption,

      hoopType,

      scorchDepth,
    });
  }

  return relationship?.title || 'VoiceMapping Read';
};

const getNormalizedFirstTellDepthKey = (value) => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return String(value || '');
  }

  return numberValue.toFixed(1);
};

const getFirstTellSpecMeta = ({
  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,
}) => {
  const sizeNumber = Number(size);

  const depthNumber = Number(depth);

  const lugNumber = Number(lugs);

  const thicknessLabel = getStaveThicknessLabel(staveOption);

  const thicknessNumber = Number(String(thicknessLabel).replace('mm', ''));

  const hasReRings = hasReRingFromStaveOption(staveOption);

  return {
    sizeNumber: Number.isFinite(sizeNumber) ? sizeNumber : 14,

    depthNumber: Number.isFinite(depthNumber) ? depthNumber : 5.5,

    lugNumber: Number.isFinite(lugNumber) ? lugNumber : 8,

    thicknessNumber: Number.isFinite(thicknessNumber) ? thicknessNumber : 10,

    thicknessLabel,

    hasReRings,

    isDeep: Number(depthNumber) >= 7,

    isVeryDeep: Number(depthNumber) >= 7.5,

    isShallow: Number(depthNumber) <= 5.5,

    isCompact: Number(sizeNumber) <= 12,

    isMiddle: Number(sizeNumber) === 13,

    isFullSize: Number(sizeNumber) >= 14,

    isDieCast: hoopType === 'Die-Cast',

    isTripleFlange: hoopType === 'Triple Flange',

    isBlackened: scorchDepth === 'Blackened',

    isLightTorch: scorchDepth === 'Light Torch',

    isMediumTorch: scorchDepth === 'Medium Torch',

    isThinShell: Number(thicknessNumber) <= 8,

    isVeryThinShell: Number(thicknessNumber) <= 7,

    isThickShell: Number(thicknessNumber) >= 12,

    isTenLug: Number(lugNumber) >= 10,

    isSixLug: Number(lugNumber) <= 6,
  };
};

const HERITAGE_FIRST_TELL_DEPTH_MAP = {
  12: {
    '5.0': ['attack', 'brightness', 'sensitivity'],

    5.5: ['attack', 'sensitivity', 'brightness'],

    '6.0': ['attack', 'sensitivity', 'control'],

    6.5: ['attack', 'control', 'sensitivity'],

    '7.0': ['projection', 'attack', 'control'],

    7.5: ['projection', 'sustain', 'control'],

    '8.0': ['projection', 'sustain', 'warmth'],
  },

  13: {
    '5.0': ['attack', 'brightness', 'control'],

    5.5: ['attack', 'control', 'brightness'],

    '6.0': ['attack', 'projection', 'warmth'],

    6.5: ['projection', 'warmth', 'attack'],

    '7.0': ['projection', 'warmth', 'sustain'],

    7.5: ['sustain', 'projection', 'warmth'],

    '8.0': ['sustain', 'projection', 'warmth'],
  },

  14: {
    '5.0': ['attack', 'warmth', 'control'],

    5.5: ['warmth', 'attack', 'control'],

    '6.0': ['warmth', 'projection', 'attack'],

    6.5: ['warmth', 'projection', 'control'],

    '7.0': ['warmth', 'projection', 'sustain'],

    7.5: ['warmth', 'sustain', 'projection'],

    '8.0': ['warmth', 'sustain', 'projection'],
  },
};

const FIRST_TELL_RULES = [
  {
    id: 'compact-5-diecast',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 5 &&
      meta.depthNumber < 5.5 &&
      meta.isDieCast,

    title: 'Tight snap with locked-in edge',

    nodes: ['attack', 'control', 'brightness'],
  },

  {
    id: 'compact-5-5-diecast',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 5.5 &&
      meta.depthNumber < 6 &&
      meta.isDieCast,

    title: 'Fast touch with firmer shape',

    nodes: ['attack', 'sensitivity', 'control'],
  },

  {
    id: 'compact-5-open',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 5 &&
      meta.depthNumber < 5.5 &&
      meta.isTripleFlange,

    title: 'Quick side-snare snap',

    nodes: ['attack', 'brightness', 'sensitivity'],
  },

  {
    id: 'compact-5-5-open',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 5.5 &&
      meta.depthNumber < 6 &&
      meta.isTripleFlange,

    title: 'Fast touch with open response',

    nodes: ['attack', 'sensitivity', 'brightness'],
  },

  {
    id: 'middle-5-diecast',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 5 &&
      meta.depthNumber < 5.5 &&
      meta.isDieCast,

    title: 'Quick alternate snap with clean control',

    nodes: ['attack', 'control', 'brightness'],
  },

  {
    id: 'middle-5-5-diecast',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 5.5 &&
      meta.depthNumber < 6 &&
      meta.isDieCast,

    title: 'Balanced alternate voice with focused touch',

    nodes: ['attack', 'control', 'warmth'],
  },

  {
    id: 'middle-5-open',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 5 &&
      meta.depthNumber < 5.5 &&
      meta.isTripleFlange,

    title: 'Quick alternate voice with clear edge',

    nodes: ['attack', 'brightness', 'control'],
  },

  {
    id: 'middle-5-5-open',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 5.5 &&
      meta.depthNumber < 6 &&
      meta.isTripleFlange,

    title: 'Balanced alternate touch with open center',

    nodes: ['attack', 'warmth', 'sensitivity'],
  },

  {
    id: 'full-5-diecast',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 5 &&
      meta.depthNumber < 5.5 &&
      meta.isDieCast,

    title: 'Quick main-snare body with clean control',

    nodes: ['attack', 'control', 'warmth'],
  },

  {
    id: 'full-5-5-diecast',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 5.5 &&
      meta.depthNumber < 6 &&
      meta.isDieCast,

    title: 'Classic body with focused response',

    nodes: ['warmth', 'attack', 'control'],
  },

  {
    id: 'full-5-open',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 5 &&
      meta.depthNumber < 5.5 &&
      meta.isTripleFlange,

    title: 'Quick main-snare body with open edge',

    nodes: ['attack', 'warmth', 'brightness'],
  },

  {
    id: 'full-5-5-open',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 5.5 &&
      meta.depthNumber < 6 &&
      meta.isTripleFlange,

    title: 'Classic Heritage center with open response',

    nodes: ['warmth', 'attack', 'sensitivity'],
  },

  {
    id: 'compact-6-diecast',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 6 &&
      meta.depthNumber < 6.5 &&
      meta.isDieCast,

    title: 'Quick focus with added body',

    nodes: ['attack', 'control', 'projection'],
  },

  {
    id: 'compact-6-5-diecast',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 6.5 &&
      meta.depthNumber < 7 &&
      meta.isDieCast,

    title: 'Compact punch with clean control',

    nodes: ['control', 'projection', 'attack'],
  },

  {
    id: 'compact-6-open',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 6 &&
      meta.depthNumber < 6.5 &&
      meta.isTripleFlange,

    title: 'Quick response with added breath',

    nodes: ['attack', 'sensitivity', 'projection'],
  },

  {
    id: 'compact-6-5-open',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 6.5 &&
      meta.depthNumber < 7 &&
      meta.isTripleFlange,

    title: 'Compact body with open response',

    nodes: ['attack', 'projection', 'sensitivity'],
  },

  {
    id: 'middle-6-diecast',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 6 &&
      meta.depthNumber < 6.5 &&
      meta.isDieCast,

    title: 'Balanced center with clean control',

    nodes: ['control', 'attack', 'warmth'],
  },

  {
    id: 'middle-6-5-diecast',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 6.5 &&
      meta.depthNumber < 7 &&
      meta.isDieCast,

    title: 'Warm alternate voice with focused shape',

    nodes: ['warmth', 'control', 'projection'],
  },

  {
    id: 'middle-6-open',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 6 &&
      meta.depthNumber < 6.5 &&
      meta.isTripleFlange,

    title: 'Balanced body with open carry',

    nodes: ['warmth', 'attack', 'projection'],
  },

  {
    id: 'middle-6-5-open',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 6.5 &&
      meta.depthNumber < 7 &&
      meta.isTripleFlange,

    title: 'Warm alternate body with natural bloom',

    nodes: ['warmth', 'projection', 'sustain'],
  },

  {
    id: 'full-6-diecast',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 6 &&
      meta.depthNumber < 6.5 &&
      meta.isDieCast,

    title: 'Warm body with clean focus',

    nodes: ['warmth', 'control', 'attack'],
  },

  {
    id: 'full-6-5-diecast',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 6.5 &&
      meta.depthNumber < 7 &&
      meta.isDieCast,

    title: 'Fuller body with focused room push',

    nodes: ['warmth', 'projection', 'control'],
  },

  {
    id: 'full-6-open',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 6 &&
      meta.depthNumber < 6.5 &&
      meta.isTripleFlange,

    title: 'Added body with open response',

    nodes: ['warmth', 'attack', 'projection'],
  },

  {
    id: 'full-6-5-open',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 6.5 &&
      meta.depthNumber < 7 &&
      meta.isTripleFlange,

    title: 'Fuller main voice with open carry',

    nodes: ['warmth', 'projection', 'sustain'],
  },

  {
    id: 'compact-8-diecast',

    test: (meta) => meta.isCompact && meta.depthNumber >= 8 && meta.isDieCast,

    title: 'Compact depth with locked-in punch',

    nodes: ['control', 'projection', 'attack'],
  },

  {
    id: 'compact-7-5-diecast',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 7.5 &&
      meta.depthNumber < 8 &&
      meta.isDieCast,

    title: 'Compact body with focused throw',

    nodes: ['projection', 'control', 'attack'],
  },

  {
    id: 'compact-7-diecast',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 7 &&
      meta.depthNumber < 7.5 &&
      meta.isDieCast,

    title: 'Controlled compact depth',

    nodes: ['control', 'attack', 'projection'],
  },

  {
    id: 'compact-8-open',

    test: (meta) =>
      meta.isCompact && meta.depthNumber >= 8 && meta.isTripleFlange,

    title: 'Compact depth with open bloom',

    nodes: ['projection', 'sustain', 'warmth'],
  },

  {
    id: 'compact-7-5-open',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 7.5 &&
      meta.depthNumber < 8 &&
      meta.isTripleFlange,

    title: 'Compact room push with open response',

    nodes: ['projection', 'warmth', 'sustain'],
  },

  {
    id: 'compact-7-open',

    test: (meta) =>
      meta.isCompact &&
      meta.depthNumber >= 7 &&
      meta.depthNumber < 7.5 &&
      meta.isTripleFlange,

    title: 'Compact depth with lively response',

    nodes: ['attack', 'projection', 'sensitivity'],
  },

  {
    id: 'middle-8-diecast',

    test: (meta) => meta.isMiddle && meta.depthNumber >= 8 && meta.isDieCast,

    title: 'Deep alternate voice with shaped control',

    nodes: ['warmth', 'control', 'projection'],
  },

  {
    id: 'middle-7-5-diecast',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 7.5 &&
      meta.depthNumber < 8 &&
      meta.isDieCast,

    title: 'Warm alternate body with focused push',

    nodes: ['warmth', 'projection', 'control'],
  },

  {
    id: 'middle-7-diecast',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 7 &&
      meta.depthNumber < 7.5 &&
      meta.isDieCast,

    title: 'Warm center with clean control',

    nodes: ['warmth', 'control', 'attack'],
  },

  {
    id: 'middle-8-open',

    test: (meta) =>
      meta.isMiddle && meta.depthNumber >= 8 && meta.isTripleFlange,

    title: 'Full alternate voice with extended bloom',

    nodes: ['sustain', 'warmth', 'projection'],
  },

  {
    id: 'middle-7-5-open',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 7.5 &&
      meta.depthNumber < 8 &&
      meta.isTripleFlange,

    title: 'Deep alternate bloom with room presence',

    nodes: ['warmth', 'sustain', 'projection'],
  },

  {
    id: 'middle-7-open',

    test: (meta) =>
      meta.isMiddle &&
      meta.depthNumber >= 7 &&
      meta.depthNumber < 7.5 &&
      meta.isTripleFlange,

    title: 'Warm alternate body with open carry',

    nodes: ['warmth', 'projection', 'sustain'],
  },

  {
    id: 'full-8-diecast',

    test: (meta) => meta.isFullSize && meta.depthNumber >= 8 && meta.isDieCast,

    title: 'Maximum body with focused control',

    nodes: ['warmth', 'control', 'projection'],
  },

  {
    id: 'full-7-5-diecast',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 7.5 &&
      meta.depthNumber < 8 &&
      meta.isDieCast,

    title: 'Big body with focused room push',

    nodes: ['warmth', 'projection', 'control'],
  },

  {
    id: 'full-7-diecast',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 7 &&
      meta.depthNumber < 7.5 &&
      meta.isDieCast,

    title: 'Deep warmth with clear presence',

    nodes: ['warmth', 'control', 'attack'],
  },

  {
    id: 'full-8-open',

    test: (meta) =>
      meta.isFullSize && meta.depthNumber >= 8 && meta.isTripleFlange,

    title: 'Maximum depth with extended bloom',

    nodes: ['sustain', 'warmth', 'projection'],
  },

  {
    id: 'full-7-5-open',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 7.5 &&
      meta.depthNumber < 8 &&
      meta.isTripleFlange,

    title: 'Big warmth with longer room bloom',

    nodes: ['warmth', 'sustain', 'projection'],
  },

  {
    id: 'full-7-open',

    test: (meta) =>
      meta.isFullSize &&
      meta.depthNumber >= 7 &&
      meta.depthNumber < 7.5 &&
      meta.isTripleFlange,

    title: 'Deep warmth with open carry',

    nodes: ['warmth', 'projection', 'sustain'],
  },

  {
    id: 'blackened-deep',

    test: (meta) => meta.isDeep && meta.isBlackened && !meta.isVeryDeep,

    title: 'Dark, deep controlled body',

    nodes: ['warmth', 'control', 'projection'],
  },

  {
    id: 'blackened-shallow',

    test: (meta) => meta.isShallow && meta.isBlackened,

    title: 'Dry snap with dark control',

    nodes: ['attack', 'control', 'brightness'],
  },

  {
    id: 'light-torch-thin',

    test: (meta) => meta.isThinShell && meta.isLightTorch,

    title: 'Open touch with woody bloom',

    nodes: ['sensitivity', 'sustain', 'warmth'],
  },

  {
    id: 'thin-shell-re-rings',

    test: (meta) => meta.isThinShell && meta.hasReRings,

    title: 'Responsive shell with supported bloom',

    nodes: ['sensitivity', 'warmth', 'sustain'],
  },

  {
    id: 'very-thin-14',

    test: (meta) => meta.isFullSize && meta.isVeryThinShell,

    title: 'Open, breathing Heritage body',

    nodes: ['warmth', 'sustain', 'sensitivity'],
  },

  {
    id: 'compact-medium-thick-diecast',

    test: (meta) =>
      meta.isCompact &&
      !meta.isDeep &&
      !meta.isShallow &&
      meta.isDieCast &&
      meta.thicknessNumber >= 12,

    title: 'Focused punch with clean shape',

    nodes: ['control', 'attack', 'projection'],
  },

  {
    id: 'thick-shell-diecast',

    test: (meta) =>
      meta.isDieCast && meta.thicknessNumber >= 13 && !meta.isMiddle,

    title: 'Focused power with clean shape',

    nodes: ['projection', 'control', 'attack'],
  },

  {
    id: 'thick-shell-open-hoop',

    test: (meta) =>
      meta.isThickShell &&
      meta.isTripleFlange &&
      !meta.isCompact &&
      !meta.isMiddle &&
      !meta.isShallow,

    title: 'Strong shell voice with open carry',

    nodes: ['projection', 'attack', 'warmth'],
  },

  {
    id: 'ten-lug-diecast',

    test: (meta) => meta.isTenLug && meta.isDieCast,

    title: 'Precise throw with locked-in shape',

    nodes: ['control', 'projection', 'attack'],
  },

  {
    id: 'ten-lug-open-hoop',

    test: (meta) => meta.isTenLug && meta.isTripleFlange,

    title: 'Clear throw with controlled openness',

    nodes: ['projection', 'control', 'brightness'],
  },

  {
    id: 'six-lug-thin',

    test: (meta) => meta.isSixLug && meta.isThinShell,

    title: 'Open touch with organic response',

    nodes: ['sensitivity', 'sustain', 'warmth'],
  },

  {
    id: 'compact-shallow-diecast',

    test: (meta) => meta.isCompact && meta.isShallow && meta.isDieCast,

    title: 'Tight snap with clean control',

    nodes: ['attack', 'control', 'brightness'],
  },

  {
    id: 'compact-shallow-open',

    test: (meta) => meta.isCompact && meta.isShallow && meta.isTripleFlange,

    title: 'Quick, open side-snare snap',

    nodes: ['attack', 'brightness', 'sensitivity'],
  },

  {
    id: 'middle-blackened-diecast-center',

    test: (meta) =>
      meta.isMiddle &&
      !meta.isDeep &&
      !meta.isShallow &&
      meta.isDieCast &&
      meta.isBlackened,

    title: 'Dark balanced center with clean control',

    nodes: ['control', 'warmth', 'attack'],
  },

  {
    id: 'medium-center-diecast',

    test: (meta) =>
      !meta.isDeep && !meta.isShallow && meta.isDieCast && !meta.isThickShell,

    title: 'Settled center with clean control',

    nodes: ['warmth', 'control', 'attack'],
  },
];

const getBaseFirstTellDepthNodes = ({ size, depth }) => {
  const sizeKey = String(size);

  const depthKey = getNormalizedFirstTellDepthKey(depth);

  return (
    HERITAGE_FIRST_TELL_DEPTH_MAP[sizeKey]?.[depthKey] || [
      'warmth',

      'attack',

      'control',
    ]
  );
};

const getFirstTellProfilePriority = (profile = {}) => {
  return AXIS_META.map(({ key }) => {
    const value = Number(profile?.[key] ?? 5);

    return {
      key,

      distance: Math.abs(value - 5),

      value,
    };
  })

    .sort((a, b) => {
      if (b.distance !== a.distance) return b.distance - a.distance;

      return b.value - a.value;
    })

    .map((item) => item.key);
};

const mergeFirstTellNodes = (...nodeGroups) => {
  const merged = [];

  nodeGroups.flat().forEach((nodeKey) => {
    if (!nodeKey || merged.includes(nodeKey)) return;

    merged.push(nodeKey);
  });

  return merged.slice(0, 3);
};

const getProfileValue = (profile = {}, key, fallback = 5) => {
  const value = Number(profile?.[key]);

  return Number.isFinite(value) ? value : fallback;
};

const getProfileDistanceFromCenter = (profile = {}, key) => {
  return Math.abs(getProfileValue(profile, key) - 5);
};

const getStrongestProfileNodes = (profile = {}, limit = 3) => {
  return AXIS_META.map(({ key }) => ({
    key,

    value: getProfileValue(profile, key),

    distance: getProfileDistanceFromCenter(profile, key),
  }))

    .sort((a, b) => {
      if (b.distance !== a.distance) return b.distance - a.distance;

      return b.value - a.value;
    })

    .slice(0, limit)

    .map((item) => item.key);
};

const shouldDeprioritizeFirstTellNode = (profile = {}, nodeKey) => {
  const value = getProfileValue(profile, nodeKey);

  if (nodeKey === 'warmth' && value < 5) return true;

  if (nodeKey === 'sensitivity' && value < 5) return true;

  if (nodeKey === 'sustain' && value < 5) return true;

  return false;
};

const reconcileFirstTellNodesWithProfile = ({
  nodes = [],

  profile = {},

  meta,
}) => {
  const strongestProfileNodes = getStrongestProfileNodes(profile, 7);

  const correctedNodes = [];

  nodes.forEach((nodeKey) => {
    if (!nodeKey) return;

    if (shouldDeprioritizeFirstTellNode(profile, nodeKey)) return;

    correctedNodes.push(nodeKey);
  });

  strongestProfileNodes.forEach((nodeKey) => {
    if (correctedNodes.includes(nodeKey)) return;

    const value = getProfileValue(profile, nodeKey);

    if (nodeKey === 'attack' && value >= 5.35) correctedNodes.push(nodeKey);

    if (nodeKey === 'projection' && value >= 5.35) correctedNodes.push(nodeKey);

    if (nodeKey === 'control' && value >= 5.35) correctedNodes.push(nodeKey);

    if (nodeKey === 'warmth' && value >= 5.35) correctedNodes.push(nodeKey);

    if (nodeKey === 'sustain' && value >= 5.35 && !meta?.isDieCast) {
      correctedNodes.push(nodeKey);
    }

    if (
      nodeKey === 'sensitivity' &&
      value >= 5.35 &&
      !meta?.isDieCast &&
      meta?.isThinShell
    ) {
      correctedNodes.push(nodeKey);
    }
  });

  strongestProfileNodes.forEach((nodeKey) => {
    if (!correctedNodes.includes(nodeKey)) {
      correctedNodes.push(nodeKey);
    }
  });

  return correctedNodes.slice(0, 3);
};

const reconcileFirstTellTitleWithProfile = ({ title = '' }) => {
  return title || 'Classic Heritage first tell';
};

const getDominantVoiceNodes = ({
  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,
}) => {
  const curated = getCuratedFirstTell({
    profile,

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,
  });

  return {
    title: curated.title,

    nodes: curated.nodes,

    summary: curated.summary,

    ruleId: curated.ruleId,

    profileNodes: curated.nodes,

    curatedNodes: curated.nodes,

    scores: curated.nodes.map((key, index) => ({
      key,

      value: getProfileValue(profile, key),

      delta: Number((getProfileValue(profile, key) - 5).toFixed(3)),

      distance: getProfileDistanceFromCenter(profile, key),

      score: 10 - index,
    })),
  };
};

const getCuratedFirstTell = ({

  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,

}) => {

  const meta = getFirstTellSpecMeta({

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,

  });

  const diameterKey = String(size);

  const depthKey = getNormalizedFirstTellDepthKey(depth);

  const score = {

    attack: 0,

    brightness: 0,

    projection: 0,

    sustain: 0,

    warmth: 0,

    sensitivity: 0,

    control: 0,

  };

  const add = (nodeKey, amount) => {

    score[nodeKey] += amount;

  };

  /**

   * Diameter behavior

   */

  if (meta.isCompact) {

    add('attack', 1.35);

    add('brightness', 1.05);

    add('sensitivity', 0.75);

    add('control', 0.45);

    add('projection', -0.25);

    add('warmth', -0.55);

    add('sustain', -0.45);

  }

  if (meta.isMiddle) {

    add('attack', 0.45);

    add('brightness', 0.25);

    add('control', 0.25);

    add('projection', 0.35);

    add('warmth', 0.45);

    add('sustain', 0.18);

  }

  if (meta.isFullSize) {

    add('warmth', 1.15);

    add('projection', 0.65);

    add('sustain', 0.35);

    add('attack', -0.25);

    add('brightness', -0.18);

  }

  /**

   * Depth behavior

   */

  if (meta.depthNumber <= 5) {

    add('attack', 1.45);

    add('brightness', 1);

    add('control', 0.45);

    add('warmth', -0.35);

    add('sustain', -0.55);

  } else if (meta.depthNumber <= 5.5) {

    add('attack', 0.95);

    add('brightness', 0.55);

    add('control', 0.35);

    add('warmth', 0.15);

    add('sustain', -0.28);

  } else if (meta.depthNumber <= 6) {

    add('attack', 0.35);

    add('warmth', 0.55);

    add('projection', 0.4);

    add('control', 0.15);

    add('sustain', 0.08);

  } else if (meta.depthNumber <= 6.5) {

    add('warmth', 0.85);

    add('projection', 0.55);

    add('control', 0.28);

    add('attack', 0.15);

    add('sustain', 0.18);

  } else if (meta.depthNumber < 7.5) {

    add('warmth', 1.15);

    add('projection', 0.78);

    add('sustain', 0.45);

    add('control', 0.22);

    add('attack', -0.22);

    add('brightness', -0.22);

  } else if (meta.depthNumber < 8) {

    add('warmth', 1.28);

    add('projection', 0.86);

    add('sustain', 0.72);

    add('control', 0.12);

    add('attack', -0.38);

    add('brightness', -0.35);

  } else {

    add('warmth', 1.42);

    add('sustain', 1.08);

    add('projection', 0.84);

    add('control', 0);

    add('attack', -0.55);

    add('brightness', -0.5);

    add('sensitivity', -0.12);

  }

  /**

   * Shell / lug behavior

   */

  if (meta.isThinShell) {

    add('sensitivity', 1.05);

    add('sustain', 0.85);

    add('warmth', 0.45);

    add('control', -0.45);

    add('attack', -0.18);

  }

  if (meta.isThickShell) {

    add('control', 0.9);

    add('attack', 0.65);

    add('projection', 0.65);

    add('sustain', -0.38);

    add('sensitivity', -0.28);

  }

if (meta.isThickShell) {

    add('control', 0.55);

    add('projection', 0.45);

    add('attack', 0.28);

    add('sustain', -0.2);

  }

  if (meta.isSixLug) {

    add('sensitivity', 0.7);

    add('sustain', 0.55);

    add('warmth', 0.28);

    add('control', -0.38);

  }

  if (meta.isTenLug) {

    add('control', 0.8);

    add('attack', 0.45);

    add('projection', 0.45);

    add('sustain', -0.28);

  }

  if (meta.hasReRings) {

    add('control', 0.22);

    add('warmth', 0.12);

    add('sustain', -0.08);

  }

  /**

   * Hoop behavior

   */

  if (meta.isDieCast) {

    add('control', 1.1);

    add('attack', 0.58);

    add('projection', 0.28);

    add('sustain', -0.65);

    add('sensitivity', -0.22);

  }

  if (meta.isTripleFlange) {

    add('sustain', 0.45);

    add('sensitivity', 0.28);

    add('brightness', 0.18);

    add('control', -0.25);

  }

  /**

   * Finish behavior

   */

  if (meta.isLightTorch) {

    add('sensitivity', 0.68);

    add('sustain', 0.48);

    add('brightness', 0.28);

    add('control', -0.22);

  }

  if (meta.isMediumTorch) {

    add('warmth', 0.25);

    add('control', 0.12);

  }

  if (meta.isBlackened) {

    add('control', 1);

    add('brightness', -0.65);

    add('sensitivity', -0.55);

    add('sustain', meta.isVeryDeep ? -0.25 : -0.55);

    add('warmth', 0.28);

    add('attack', meta.isShallow ? 0.32 : -0.08);

  }

  /**

   * Blend in actual profile movement, but do not let tiny profile changes

   * create random node popping.

   */

  AXIS_META.forEach(({ key }) => {

    const value = getProfileValue(profile, key);

    const delta = value - 5;

    score[key] += delta * 0.9;

    if (value >= 5.45) {

      score[key] += 0.28;

    }

    if (value <= 4.75) {

      score[key] -= 0.38;

    }

  });

  /**

   * Guardrails for common bad jumps.

   */

  if (meta.isCompact && meta.isThickShell && !meta.isThinShell) {

    score.control = Math.max(score.control, score.projection + 0.08);

    if (meta.depthNumber < 8) {

      score.sustain -= 0.35;

    }

  }

  if (meta.isCompact && meta.depthNumber >= 8 && meta.isThickShell) {

    score.warmth = Math.max(score.warmth, score.projection - 0.18);

    score.control = Math.max(score.control, score.projection - 0.12);

    score.sustain -= 0.25;

  }

  if (meta.isMiddle && meta.depthNumber >= 6.5 && meta.depthNumber < 7.5) {

    score.warmth = Math.max(score.warmth, score.projection + 0.12);

    score.sustain = Math.min(score.sustain, score.projection - 0.12);

  }

  if (meta.isMiddle && meta.depthNumber >= 7.5 && meta.depthNumber < 8) {

    score.sustain = Math.max(score.sustain, score.control + 0.2);

    score.projection = Math.max(score.projection, score.control + 0.1);

  }

  if (meta.isMiddle && meta.depthNumber >= 8) {

    score.sustain = Math.max(score.sustain, score.projection + 0.18);

    score.warmth = Math.max(score.warmth, score.control + 0.18);

    score.control = Math.min(score.control, score.projection - 0.08);

  }

  if (meta.isFullSize && meta.depthNumber >= 7) {

    score.warmth = Math.max(score.warmth, score.projection + 0.18);

    score.attack -= 0.25;

    score.brightness -= 0.18;

  }

  if (meta.isFullSize && meta.depthNumber >= 8) {

    score.sustain = Math.max(score.sustain, score.projection + 0.08);

    score.warmth = Math.max(score.warmth, score.sustain + 0.04);

  }

  /**

   * Final ranking.

   */

  const nodes = AXIS_META.map(({ key }) => ({

    key,

    score: score[key],

    value: getProfileValue(profile, key),

  }))

    .sort((a, b) => {

      if (b.score !== a.score) return b.score - a.score;

      return b.value - a.value;

    })

    .slice(0, 3)

    .map((item) => item.key);

  const signature = nodes.join('|');

  const titleMap = {

    'attack|brightness|control': 'Quick compact focus',

    'attack|brightness|sensitivity': 'Quick open side-snare snap',

    'attack|control|brightness': 'Dry snap with clean control',

    'attack|control|projection': 'Focused punch with clean throw',

    'attack|projection|warmth': 'Clear body with forward response',

    'control|attack|projection': 'Focused response with clean throw',

    'control|projection|attack': 'Compact focused punch',

    'control|projection|warmth': 'Maximum compact depth',

    'control|warmth|projection': 'Maximum compact depth',

    'projection|control|attack': 'Compact body with focused throw',

    'projection|control|warmth': 'Compact body with focused throw',

    'projection|sustain|warmth': 'Deep alternate bloom with focused carry',

    'projection|warmth|control': 'Warm alternate body with room presence',

    'projection|warmth|sustain': 'Deep alternate bloom with room presence',

    'sensitivity|sustain|warmth': 'Open touch with woody bloom',

    'sensitivity|warmth|sustain': 'Open touch with woody bloom',

    'sustain|projection|warmth': 'Maximum alternate bloom',

    'sustain|warmth|control': 'Maximum alternate bloom',

    'sustain|warmth|projection': 'Maximum depth with extended bloom',

    'warmth|attack|control': 'Classic Heritage center',

    'warmth|control|attack': 'Warm alternate body',

    'warmth|control|projection': 'Warm body with focused room push',

    'warmth|projection|attack': 'Fuller main voice',

    'warmth|projection|control': 'Warm body with focused room push',

    'warmth|projection|sustain': 'Deep warmth with open carry',

    'warmth|sustain|projection': 'Big main voice with longer room bloom',

  };

  let title = titleMap[signature] || 'Heritage first listen';

  /**

   * Final title overrides.

   *

   * These prevent small-but-real config moves from collapsing into the same

   * generic title when the top three nodes stay similar.

   */

  if (meta.isCompact) {

    if (meta.depthNumber <= 5) {

      title = meta.isDieCast ? 'Quick compact focus' : 'Quick compact snap';

    } else if (meta.depthNumber <= 5.5) {

      title = meta.isDieCast

        ? 'Focused compact touch'

        : 'Fast compact touch';

    } else if (meta.depthNumber <= 6) {

      title = 'Compact punch with added body';

    } else if (meta.depthNumber <= 6.5) {

      title = 'Compact focused punch';

    } else if (meta.depthNumber < 7.5) {

      title = 'Controlled compact depth';

    } else if (meta.depthNumber < 8) {

      title = 'Compact body with focused throw';

    } else {

      title = meta.isThinShell

        ? 'Maximum compact bloom'

        : 'Maximum compact depth';

    }

  }

  if (meta.isMiddle) {

    if (meta.depthNumber <= 5) {

      title = 'Quick alternate voice with clear edge';

    } else if (meta.depthNumber <= 5.5) {

      title = 'Balanced alternate touch';

    } else if (meta.depthNumber <= 6) {

      title = 'Balanced alternate body';

    } else if (meta.depthNumber <= 6.5) {

      title = 'Warm alternate body';

    } else if (meta.depthNumber < 7.5) {

      title = 'Warm alternate body with room presence';

    } else if (meta.depthNumber < 8) {

      title = 'Deep alternate bloom with focused carry';

    } else {

      title = 'Maximum alternate bloom';

    }

  }

  if (meta.isFullSize) {

    if (meta.depthNumber <= 5) {

      title = 'Quick main-snare body';

    } else if (meta.depthNumber <= 5.5) {

      title = 'Classic Heritage center';

    } else if (meta.depthNumber <= 6) {

      title = 'Warm body with clear room push';

    } else if (meta.depthNumber <= 6.5) {

      title = 'Fuller main voice';

    } else if (meta.depthNumber < 7.5) {

      title = 'Deep main voice with open body';

    } else if (meta.depthNumber < 8) {

      title = 'Big main voice with longer room bloom';

    } else {

      title = 'Maximum main-snare depth';

    }

  }

 if (meta.isThickShell && meta.isTenLug && meta.isFullSize) {

    if (meta.depthNumber <= 5) {

      title = 'Quick focused power';

    } else if (meta.depthNumber <= 5.5) {

      title = 'Classic focused snap';

    } else if (meta.depthNumber <= 6) {

      title = 'Focused body with clear attack';

    } else if (meta.depthNumber <= 6.5) {

      title = 'Focused main voice with added weight';

    } else if (meta.depthNumber < 7.5) {

      title = 'Deep focused body';

    } else if (meta.depthNumber < 8) {

      title = 'Big focused body with shaped bloom';

    } else {

      title = 'Maximum focused depth';

    }

  }

  if (meta.isThinShell && meta.isSixLug && meta.isCompact) {

    if (meta.depthNumber <= 5) {

      title = 'Quick open side-snare response';

    } else if (meta.depthNumber <= 5.5) {

      title = 'Open compact touch';

    } else if (meta.depthNumber <= 6) {

      title = 'Responsive compact body';

    } else if (meta.depthNumber <= 6.5) {

      title = 'Open compact bloom';

    } else if (meta.depthNumber < 7.5) {

      title = 'Deep compact breath';

    } else if (meta.depthNumber < 8) {

      title = 'Deep compact bloom';

    } else {

      title = 'Maximum compact bloom';

    }

  }

  const buildSizePhrase = `${diameterKey}" × ${depthKey.replace('.0', '')}"`;

  let summary = '';

  if (meta.isCompact) {

    if (meta.depthNumber <= 5.5) {

      summary = `This ${buildSizePhrase} build reads as a quick compact Heritage voice. The smaller diameter keeps the first impression fast and articulate, while the selected shell recipe shapes how focused or open the note feels.`;

    } else if (meta.depthNumber < 7) {

      summary = `This ${buildSizePhrase} build adds body to the compact voice without turning into a wide main-snare sound. It should feel punchy, present, and controlled under the hands.`;

    } else if (meta.depthNumber < 8) {

      summary = `This ${buildSizePhrase} build moves into deeper compact territory. The extra depth adds more body and throw, but the 12" diameter keeps the footprint tighter and quicker than the larger Heritage paths.`;

    } else {

      summary = `This ${buildSizePhrase} build is the deepest compact Heritage voice. It gains more body and weight than the 7.5" path, but the smaller diameter keeps it contained, punchy, and tighter than the 13" or 14" maximum-depth builds.`;

    }

  } else if (meta.isMiddle) {

    if (meta.depthNumber <= 5.5) {

      summary = `This ${buildSizePhrase} build reads as a quicker alternate voice: tighter and more compact than a 14", but with more body than the 12" side-snare paths.`;

    } else if (meta.depthNumber < 7) {

      summary = `This ${buildSizePhrase} build reads as a balanced alternate snare with more warmth and body than the shallow paths while still keeping the tighter footprint of a 13" drum.`;

    } else if (meta.depthNumber < 7.5) {

      summary = `This ${buildSizePhrase} build adds room presence and deeper body to the alternate voice. It should feel fuller than the shallower 13" paths, but still more controlled and compact than the 7.5" and 8" versions.`;

    } else if (meta.depthNumber < 8) {

      summary = `This ${buildSizePhrase} build moves into a deeper alternate-snare pocket: stronger carry, longer bloom, and more body than the 7" version while still staying tighter than the 14" main voice.`;

    } else {

      summary = `This ${buildSizePhrase} build reads as the deepest alternate Heritage voice. Compared with the 7.5" path, it shifts farther into bloom, body, and a more settled shape while staying tighter and less wide than a 14" maximum-depth main snare.`;

    }

  } else {

    if (meta.depthNumber <= 5.5) {

      summary = `This ${buildSizePhrase} build keeps the familiar 14" main-snare center but brings the response forward. The first impression should feel quicker, clearer, and tighter than the deeper Heritage paths.`;

    } else if (meta.depthNumber < 7) {

      summary = `This ${buildSizePhrase} build adds body and room push while staying familiar as a main snare. It should feel fuller than the shallow paths without fully moving into deep-shell bloom.`;

    } else if (meta.depthNumber < 7.5) {

      summary = `This ${buildSizePhrase} build moves into a deeper main-snare voice. The body is wider and lower than the 6.5" build, with stronger room presence, but the bloom has not fully taken over the first impression yet.`;

    } else if (meta.depthNumber < 8) {

      summary = `This ${buildSizePhrase} build reads as a big main-snare voice with stronger body, more room push, and a longer note shape than the 7" path. It starts moving toward deeper bloom, but still keeps more forward movement than the full 8" build.`;

    } else {

      summary = `This ${buildSizePhrase} build reads as the deepest Heritage main-snare voice in this range. Compared with the 7.5" path, it keeps the same big-body character but shifts farther into slower bloom, broader warmth, and a more physical room shape.`;

    }

  }

  if (meta.isDieCast) {

    summary +=

      ' Die-cast hoops tighten the response and add more focus around the note.';

  }

  if (meta.isLightTorch) {

    summary +=

      ' Light Torch keeps the read more open, natural, and touch-sensitive.';

  }

  if (meta.isMediumTorch) {

    summary +=

      ' Medium Torch keeps the read closer to the centered Heritage character: seasoned, warm, and balanced.';

  }

  if (meta.isBlackened) {

    summary +=

      ' Blackened darkens the upper edge and pulls the response toward a drier, more controlled finished character.';

  }

  return {

    title,

    nodes,

    summary,

    ruleId: `score-first-listen-${diameterKey}-${depthKey}-${meta.thicknessLabel}-${lugs}-${hoopType}-${scorchDepth}`,

  };

};

const getFirstTellDisplayTitle = ({
  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,
}) => {
  const dominant = getDominantVoiceNodes({
    profile,

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,
  });

  return dominant.title || 'First Tell';
};

const getLockedFirstTellDepthNodes = ({
  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,
}) => {
  return getCanonicalDominantNodes({
    profile,

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,
  }).nodes;
};

const getFirstTellTriangleNodes = ({
  relationship = {},

  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,
}) => {
  return getLockedFirstTellDepthNodes({
    relationship,

    profile,

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,
  });
};

const getVoiceMappingVisualThread = ({
  relationship = {},

  profile = {},

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  scorchDepth,
}) => {
  if (!relationship) return null;

  const VoiceMappingVariant = getVoiceMappingVariantForSlot(
    relationship.slotKey
  );

  const relationshipNodes = Array.isArray(relationship.nodes)
    ? relationship.nodes.filter(Boolean)
    : [];

  const visualNodes =
    VoiceMappingVariant === 'firstTell'
      ? getLockedFirstTellDepthNodes({
          profile,

          size,

          depth,

          lugs,

          staveOption,

          hoopType,

          scorchDepth,
        })
      : relationshipNodes;

  return {
    ...relationship,

    id: `${relationship.id || 'voice-read'}-${VoiceMappingVariant}-visual`,

    nodes: visualNodes,

    title:
      VoiceMappingVariant === 'firstTell'
        ? getFirstTellDisplayTitle({
            profile,

            size,

            depth,

            lugs,

            staveOption,

            hoopType,

            scorchDepth,
          })
        : relationship.title,
  };
};

const BUILDER_GUIDANCE = {
  diameter: {
    label: 'Snare Size',

    question: 'What role do you want this snare to play?',

    helper:
      'Diameter shapes the drum’s pitch center and overall personality. Smaller drums tend to feel quicker, tighter, and more cutting. Larger drums tend to feel fuller, wider, and more familiar as a main snare voice.',
  },

  depth: {
    label: 'Depth',

    question: 'How much body do you want behind the hit?',

    helper:
      'Depth changes how much air the shell moves. Shallower depths usually feel faster, drier, and more articulate. Deeper drums add body, bloom, lower weight, and more room presence.',
  },

  shellThickness: {
    label: 'Shell Thickness',

    question: 'Do you want the shell to breathe or stay focused?',

    helper:
      'Shell thickness affects how freely the drum opens up. Thinner shells tend to feel more responsive, woody, and open. Thicker shells tend to feel more focused, controlled, and powerful.',
  },

  lugQuantity: {
    label: 'Lug Quantity',

    question: 'How much control do you want in the tuning feel?',

    helper:
      'Lug count affects tension spread, tuning stability, and how shaped the note feels. Fewer lugs can feel more open and organic. More lugs usually give more control, focus, and tuning precision.',
  },

  finish: {
    label: 'Finish Scorch Depth',

    question: 'How seasoned do you want the drum to feel?',

    helper:
      'Torch depth shapes the visual age, dryness, and finished character of the drum. Lighter scorch feels more open and natural. Deeper scorch feels darker, drier, and more visually dramatic.',
  },

  hoopType: {
    label: 'Hoop Type',

    question: 'Do you want the drum to open up or lock in?',

    helper:
      'Hoop choice changes how the head responds under the stick. Triple flange hoops keep the drum more open and familiar. Die-cast hoops add focus, control, and a tighter rim feel.',
  },

  hardwareFinish: {
    label: 'Hardware Finish',

    question: 'What visual voice should frame the shell?',

    helper:
      'Hardware finish does not lead the sound, but it strongly shapes the drum’s visual personality. Choose the finish that best supports the shell’s final character.',
  },
};

const SIZE_GUIDE_COPY = {
  12: {
    title: 'Quick / tight side snare',

    body: 'Best when you want a higher, faster voice with extra cut and less low-end spread.',
  },

  13: {
    title: 'Balanced alternate voice',

    body: 'Tighter than a 14", but still full enough to work as a main or auxiliary snare.',
  },

  14: {
    title: 'Full main snare voice',

    body: 'The classic foundation. Widest, most familiar Heritage body and center.',
  },
};

const DEPTH_GUIDE_COPY = {
  '5.0': {
    title: 'Fast / articulate',

    body: 'Quick response, less air, tighter body, and a cleaner front edge.',
  },

  5.5: {
    title: 'Classic center',

    body: 'A familiar all-purpose depth with balanced body, response, and control.',
  },

  '6.0': {
    title: 'Added body',

    body: 'More shell behind the note while still staying responsive and versatile.',
  },

  6.5: {
    title: 'Fuller main voice',

    body: 'A stronger low-mid center with more bloom and room presence.',
  },

  '7.0': {
    title: 'Deep / weighty',

    body: 'More air, body, and depth for a broader, more grounded hit.',
  },

  7.5: {
    title: 'Big room feel',

    body: 'A deeper shell voice with more bloom, spread, and physical presence.',
  },

  '8.0': {
    title: 'Maximum depth',

    body: 'The fullest Heritage depth: big body, slower bloom, and serious weight.',
  },
};

const SHELL_THICKNESS_GUIDE_COPY = {
  '15mm': {
    title: 'Focused / powerful',

    body: 'The stiffest Heritage path: more projection, control, and a stronger shaped note.',
  },

  '13mm': {
    title: 'Compact / focused',

    body: 'A slightly thicker 12" shell path that keeps the smaller drum quick while adding focus and body.',
  },

  '12mm': {
    title: 'Balanced alternate',

    body: 'A stable 13" shell path with good focus, response, and enough body for an alternate main voice.',
  },

  '11mm': {
    title: 'Balanced Heritage core',

    body: 'The standard 14" Heritage center: woody, stable, responsive, and familiar.',
  },

  '8mm': {
    title: 'Open / responsive',

    body: 'More shell movement and touch response with re-rings for support.',
  },

  '7mm': {
    title: 'Thin / expressive',

    body: 'The most open and breathing shell path, supported by re-rings.',
  },
};

const LUG_GUIDE_COPY = {
  6: {
    title: 'Open / organic',

    body: 'Less hardware tension around the head for a looser, more breathing feel.',
  },

  8: {
    title: 'Classic balance',

    body: 'The familiar middle ground: stable tuning, open response, and easy control.',
  },

  10: {
    title: 'Precise / controlled',

    body: 'More tension points for tighter tuning control and a more focused note.',
  },
};

const FINISH_GUIDE_COPY = {
  'Light Torch': {
    title: 'Open / natural',

    body: 'Keeps more of the raw oak character visible, lighter, and more organic.',
  },

  'Medium Torch': {
    title: 'Seasoned Heritage center',

    body: 'The standard voice: warm, aged, balanced, and unmistakably Heritage.',
  },

  Blackened: {
    title: 'Dark / dry / dramatic',

    body: 'The boldest visual character with a drier, more controlled finished feel.',
  },
};

const HOOP_GUIDE_COPY = {
  'Triple Flange': {
    title: 'Open / classic',

    body: 'More familiar rim feel, more spread, and a little more natural openness.',
  },

  'Die-Cast': {
    title: 'Focused / locked-in',

    body: 'Tighter response, stronger rim definition, and more controlled overtones.',
  },
};

const HARDWARE_GUIDE_COPY = {
  Chrome: {
    title: 'Clean / timeless',

    body: 'Classic, bright, and neutral. Lets the shell stay visually center stage.',
  },

  'Black Nickel': {
    title: 'Modern / darker',

    body: 'Adds a slightly moodier frame without overpowering the wood character.',
  },

  'Brass/Gold': {
    title: 'Warm / premium',

    body: 'A richer visual statement with a more elevated custom-shop feel.',
  },
};

const buildFirstTellSummary = ({
  visualNodes = [],

  activeThread,

  activeReadout,

  profile = {},
}) => {
  const nodeLabels = visualNodes

    .map((nodeKey) => AXIS_META.find((axis) => axis.key === nodeKey)?.label)

    .filter(Boolean);

  const hasWarmth = visualNodes.includes('warmth');

  const hasSustain = visualNodes.includes('sustain');

  const hasProjection = visualNodes.includes('projection');

  const hasAttack = visualNodes.includes('attack');

  const hasBrightness = visualNodes.includes('brightness');

  const hasSensitivity = visualNodes.includes('sensitivity');

  const hasControl = visualNodes.includes('control');

  const warmth = getProfileValue(profile, 'warmth');

  const sustain = getProfileValue(profile, 'sustain');

  const projection = getProfileValue(profile, 'projection');

  const attack = getProfileValue(profile, 'attack');

  const brightness = getProfileValue(profile, 'brightness');

  const sensitivity = getProfileValue(profile, 'sensitivity');

  const control = getProfileValue(profile, 'control');

  if (hasControl && hasProjection && hasAttack) {
    return 'The drum is reading with stronger front-edge definition, more outward push, and a cleaner, more organized note shape.';
  }

  if (hasWarmth && hasProjection && hasControl) {
    return 'The drum is reading with a fuller body, stronger room presence, and enough organization to keep the note shaped and usable.';
  }

  if (hasWarmth && hasSustain && hasProjection) {
    return 'The drum is reading with more body, longer bloom, and broader room shape while still keeping the Heritage voice grounded.';
  }

  if (hasAttack && hasBrightness && hasControl) {
    return 'The drum is reading as drier, quicker, and more controlled, with a clearer edge and a more contained response.';
  }

  if (hasAttack && hasBrightness) {
    return 'The drum is reading with a quicker front edge and clearer top-end response — immediate, articulate, and easy to notice right away.';
  }

  if (hasAttack && hasSensitivity) {
    return 'The drum is reading with a fast first response and a more touch-sensitive feel — quick under the stick without losing musical nuance.';
  }

  if (hasSensitivity && hasSustain && hasWarmth) {
    return 'The drum is reading as open, touch-sensitive, and woody, with more shell movement and a more breathing response under the hands.';
  }

  if (hasSensitivity && hasControl && hasWarmth) {
    return 'The drum is reading with a breathing shell feel, darker body, and more controlled edges around the note.';
  }

  if (projection >= 5.5 && control >= 5.5 && attack >= 5.5) {
    return 'The drum is reading with projected attack and firm control — clear, present, and more shaped than open or blooming.';
  }

  if (warmth >= 5.5 && sustain >= 5.5) {
    return 'The drum is reading with a fuller center and a longer, controlled note bloom — musical sustain, not loose ring.';
  }

  if (nodeLabels.length) {
    return `The drum is reading first through ${nodeLabels

      .map((label) => label.toLowerCase())

      .join(
        ', '
      )} — the strongest traits your ear is likely to notice before reading the full VoiceMapping.`;
  }

  return activeThread?.summary || activeReadout?.whatThreadIsTellingUs || '';
};

const HeritageProductDetail = () => {
  const navigate = useNavigate();

  const { addToCart, removeFromCart, cart } = useCart();

  const [size, setSize] = useState('12');

  const [depth, setDepth] = useState('5.0');

  const [lugs, setLugs] = useState('8');

  const [staveOption, setStaveOption] = useState('16 - 13mm');

  const [hardwareColor, setHardwareColor] = useState('Chrome');

  const [hoopType, setHoopType] = useState('Triple Flange');

  const [scorchDepth, setScorchDepth] = useState('Medium Torch');

  const [totalPrice, setTotalPrice] = useState(850);

  const [isLoading, setIsLoading] = useState(true);

  const [product, setProduct] = useState(null);

  const [buttonText, setButtonText] = useState('Add to Cart');

  const [cartItemId, setCartItemId] = useState(null);

  const [legacyTuningMode, setLegacyTuningMode] = useState(
    LEGACY_TUNING_MODE.BARE_SHELL
  );

  const [legacyPrintTab, setLegacyPrintTab] = useState('firstListen');

  const [isCompareModeEnabled, setIsCompareModeEnabled] = useState(false);

  const [showCompareIntro, setShowCompareIntro] = useState(false);

  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});

  const [openBuilderSection, setOpenBuilderSection] = useState('construction');

  const [activeAxisKey, setActiveAxisKey] = useState('attack');

  const [lugHelperPulseKey, setLugHelperPulseKey] = useState(0);

  const [activeThreadSelection, setActiveThreadSelection] = useState({
    id: '',

    slotKey: '',
  });

  const [showConfigBreakdown, setShowConfigBreakdown] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);

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

  const confirmStartOverBuild = () => {
    applyHeritagePreset('lowest');

    setShowConfigBreakdown(false);

    setShowResetModal(false);
  };

  const handleResetBenchmark = () => {
    setBenchmarkFamilyId(DEFAULT_BENCHMARK_FAMILY_ID);

    setBenchmarkTypeId(DEFAULT_BENCHMARK_TYPE_ID);

    setBenchmarkSizeId(DEFAULT_BENCHMARK_SIZE_ID);
  };

  const handleAxisChange = React.useCallback((nextKey) => {
    if (nextKey) setActiveAxisKey(nextKey);
  }, []);

  const productImage = useMemo(() => {
    return product?.images?.[0] || '/resized-logos/heritage-placeholder.png';
  }, [product]);

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
      types.find((type) => type.typeId === benchmarkTypeId) || types[0] || null
    );
  }, [selectedBenchmarkFamily, benchmarkTypeId]);

  const selectedBenchmarkSize = useMemo(() => {
    const sizes = selectedBenchmarkType?.presetSizeOptions || [];

    const fallbackSizeId =
      selectedBenchmarkType?.defaultSizeId ||
      selectedBenchmarkType?.presetSizes?.[0];

    return (
      sizes.find((item) => item.sizeId === benchmarkSizeId) ||
      sizes.find((item) => item.sizeId === fallbackSizeId) ||
      sizes[0] ||
      null
    );
  }, [selectedBenchmarkType, benchmarkSizeId]);

  const selectedBenchmarkImagePath = useMemo(() => {
    if (!selectedBenchmarkFamily || !selectedBenchmarkType) {
      return '/legacyprint-benchmarks/ply/ply-maple.png';
    }

    const familyId = selectedBenchmarkFamily.familyId;

    const typeId = selectedBenchmarkType.typeId;

    const IMAGE_MAP = {
      ply: {
        'maple-ply-reference': '/legacyprint-benchmarks/ply/ply-maple.png',

        'birch-ply-reference': '/legacyprint-benchmarks/ply/ply-birch.png',

        'oak-ply-reference': '/legacyprint-benchmarks/ply/ply-oak.png',

        'walnut-ply-reference': '/legacyprint-benchmarks/ply/ply-walnut.png',

        'mahogany-ply-reference':
          '/legacyprint-benchmarks/ply/ply-mahogany.png',
      },

      metal: {
        'brass-reference': '/legacyprint-benchmarks/metal/metal-brass.png',

        'steel-reference': '/legacyprint-benchmarks/metal/metal-steel.png',

        'aluminum-reference':
          '/legacyprint-benchmarks/metal/metal-aluminum.png',

        'copper-reference': '/legacyprint-benchmarks/metal/metal-copper.png',

        'bronze-reference': '/legacyprint-benchmarks/metal/metal-bronze.png',
      },

      acrylic: {
        'thin-acrylic-reference':
          '/legacyprint-benchmarks/acrylic/acrylic-clear.png',

        'medium-acrylic-reference':
          '/legacyprint-benchmarks/acrylic/acrylic-clear.png',

        'thick-acrylic-reference':
          '/legacyprint-benchmarks/acrylic/acrylic-clear.png',
      },

      'ober-custom': {
        'heritage-oak-reference':
          '/legacyprint-benchmarks/ober-custom/ober-heritage-oak.png',

        'feuzon-hybrid-reference':
          '/legacyprint-benchmarks/ober-custom/ober-feuzon-maple.png',
      },

      'solid-steambent': {
        'steam-bent-maple-reference':
          '/legacyprint-benchmarks/solid-steambent/solid-steam-maple.png',

        'steam-bent-mahogany-reference':
          '/legacyprint-benchmarks/solid-steambent/solid-steam-mahogany.png',

        'solid-maple-reference':
          '/legacyprint-benchmarks/solid-steambent/solid-steam-maple.png',

        'solid-walnut-reference':
          '/legacyprint-benchmarks/solid-steambent/solid-steam-walnut.png',

        'solid-oak-reference':
          '/legacyprint-benchmarks/solid-steambent/solid-steam-oak.png',
      },
    };

    return (
      IMAGE_MAP[familyId]?.[typeId] ||
      '/legacyprint-benchmarks/ply/ply-maple.png'
    );
  }, [selectedBenchmarkFamily, selectedBenchmarkType]);

  const benchmarkReadBody = useMemo(() => {
    if (
      !selectedBenchmarkFamily ||
      !selectedBenchmarkType ||
      !selectedBenchmarkSize
    ) {
      return 'Choose a familiar reference drum to use as your listening anchor. Once Compare mode is enabled, this build will be read against that selected benchmark.';
    }

    return `${selectedBenchmarkFamily.familyLabel} benchmark selected. This Heritage build is being compared against the ${selectedBenchmarkType.typeLabel} reference at ${selectedBenchmarkSize.label}. In Compare mode, the selected reference becomes the listening anchor for the chart and tone summary.`;
  }, [selectedBenchmarkFamily, selectedBenchmarkType, selectedBenchmarkSize]);

  const heritageHighlights = [
    'Northern Red Oak stave shell construction.',

    'Grounded, warm, seasoned Ober voice.',

    '45° inner edge with softened outer roundover.',

    'Standard snare beds.',

    '12", 13", and 14" build sizes.',

    '36 core Heritage voicing paths.',

    'Vintage double-ended tube lugs.',

    'Triple flange or die-cast response.',

    'Chrome, Black Nickel, or Brass / Gold hardware.',

    'Stock Trick GS007 throw-off.',

    'Controlled torching shapes visual character and resonance.',

    'PureSound Custom Pro Steel 20-Strand wires.',

    'Estimated delivery: 6–8 weeks.',
  ];

  const generateCartItemId = (option) => {
    const normalizedStave = String(option.staveQuantity).trim();

    const normalizedHardware = String(option.hardwareColor)
      .toLowerCase()

      .replace(/\s+/g, '-');

    const normalizedHoops = String(option.hoopType)
      .toLowerCase()

      .replace(/\s+/g, '-');

    const normalizedScorch = String(option.scorchDepth)
      .toLowerCase()

      .replace(/\s+/g, '-');

    const priceId = option.stripePriceId ?? '';

    return `${priceId}-${option.size}-${option.depth}-${String(
      option.reRing
    )}-${option.lugQuantity}-${normalizedStave}-${normalizedHardware}-${normalizedHoops}-${normalizedScorch}`;
  };

  const constructionSummary = `${size}" x ${depth}" • ${lugs} lugs • ${staveOption}`;

  const finishSummary = `${scorchDepth}`;

  const hardwareSummary = `${hoopType} • ${hardwareColor} • Trick GS007 throw-off`;

  const currentBuildPrice = useMemo(() => {
    return computeHeritagePrice({
      size,

      depth,

      staveOption,

      hardwareColor,

      hoopType,
    });
  }, [size, depth, staveOption, hardwareColor, hoopType]);

  const currentBuildVoiceRangeSummary = useMemo(() => {
    return buildHeritageVoiceRead({
      size,

      depth,

      lugs,

      staveOption,

      hardwareColor: HERITAGE_VOICE_READ_HARDWARE_COLOR,

      hoopType,

      scorchDepth,

      benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,

      benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,

      benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,
    });
  }, [size, depth, lugs, staveOption, hoopType, scorchDepth]);

  const activeVoiceSummary = useMemo(() => {
    return isCompareModeEnabled
      ? selectedDrumSummary
      : currentBuildVoiceRangeSummary;
  }, [
    isCompareModeEnabled,

    selectedDrumSummary,

    currentBuildVoiceRangeSummary,
  ]);

  const activeUniversalVoiceRead =
    activeVoiceSummary?.universalVoiceRead || null;

  const activeUniversalProfile = useMemo(() => {
    return getUniversalProfileFromSummary(activeVoiceSummary);
  }, [activeVoiceSummary]);

  const activeFirstListenRead = useMemo(() => {
    return activeVoiceSummary?.firstListen || {};
  }, [activeVoiceSummary]);

  

  const activeUniversalReads = useMemo(() => {
    return getUniversalReadsFromSummary(activeVoiceSummary);
  }, [activeVoiceSummary]);

  const activeBuildSignature = useMemo(() => {
    return [
      size,

      depth,

      lugs,

      staveOption,

      hoopType,

      scorchDepth,

      isCompareModeEnabled ? 'compare' : 'standalone',

      isCompareModeEnabled ? benchmarkFamilyId : DEFAULT_BENCHMARK_FAMILY_ID,

      isCompareModeEnabled ? benchmarkTypeId : DEFAULT_BENCHMARK_TYPE_ID,

      isCompareModeEnabled ? benchmarkSizeId : DEFAULT_BENCHMARK_SIZE_ID,
    ].join('|');
  }, [
    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,

    isCompareModeEnabled,

    benchmarkFamilyId,

    benchmarkTypeId,

    benchmarkSizeId,
  ]);

  const chartValues = useMemo(() => {
    return AXIS_META.map(({ key }) => {
      const rawValue =
        activeUniversalProfile?.[key] != null
          ? Number(activeUniversalProfile[key])
          : 5;

      return getDisplayMetricValue(rawValue);
    });
  }, [activeUniversalProfile]);

  const toneSummaryText = useMemo(() => {
    if (isCompareModeEnabled) {
      return buildToneSummary(
        selectedDrumSummary,

        selectedBenchmarkType,

        selectedBenchmarkSize
      );
    }

    return buildCurrentBuildToneSummary(currentBuildVoiceRangeSummary);
  }, [
    isCompareModeEnabled,

    selectedDrumSummary,

    currentBuildVoiceRangeSummary,

    selectedBenchmarkType,

    selectedBenchmarkSize,
  ]);

  const legacyTuningCenterHz = useMemo(() => {
    if (legacyTuningMode === LEGACY_TUNING_MODE.DRESSED) {
      return getHeritageDressedCenterHz({
        size,

        depth,

        staveOption,

        scorchDepth,

        hoopType,
      });
    }

    return getHeritageBareShellCenterHz({
      size,

      depth,

      staveOption,

      scorchDepth,
    });
  }, [size, depth, staveOption, scorchDepth, hoopType, legacyTuningMode]);

  const legacyTuningHzMeta = useMemo(() => {
    return getLegacyTuningHzRangeFromCenter(
      legacyTuningCenterHz,

      legacyTuningMode
    );
  }, [legacyTuningCenterHz, legacyTuningMode]);

  const legacyTuningRange = useMemo(() => {
    return getLegacyTuningRangeBoundsFromHz(legacyTuningHzMeta);
  }, [legacyTuningHzMeta]);

  const legacyTuningHzRange = legacyTuningHzMeta.label;

  const benchmarkVoiceRangePosition = useMemo(() => {
    return buildBenchmarkVoiceRange(
      selectedBenchmarkType,

      selectedBenchmarkSize
    );
  }, [selectedBenchmarkType, selectedBenchmarkSize]);

  const benchmarkLegacyTuningRange = useMemo(() => {
    return getLegacyTuningRangeBounds(benchmarkVoiceRangePosition);
  }, [benchmarkVoiceRangePosition]);

  const benchmarkLegacyTuningHzRange = useMemo(() => {
    return getLegacyTuningHzRange(benchmarkLegacyTuningRange);
  }, [benchmarkLegacyTuningRange]);

  const currentNearestNoteWindow = useMemo(() => {
    return getNearestNoteWindow(legacyTuningHzRange);
  }, [legacyTuningHzRange]);

  const referenceNearestNoteWindow = useMemo(() => {
    return getNearestNoteWindow(benchmarkLegacyTuningHzRange);
  }, [benchmarkLegacyTuningHzRange]);

  const activeAxisMeta =
    AXIS_META.find((axis) => axis.key === activeAxisKey) || AXIS_META[0];

  const rawAxisValue =
    activeUniversalProfile?.[activeAxisKey] != null
      ? Number(activeUniversalProfile[activeAxisKey])
      : 5;

  const activeAxisDeltaValue = Number((rawAxisValue - 5).toFixed(1));

  const activeAxisScore =
    activeAxisDeltaValue > 0
      ? `+${activeAxisDeltaValue.toFixed(1)}`
      : activeAxisDeltaValue.toFixed(1);

  const activeAxisCopy =
    AXIS_INSIGHT_COPY[activeAxisKey] || AXIS_INSIGHT_COPY.attack;

  const activeAxisColor = AXIS_COLOR_BY_KEY[activeAxisKey] || '#d6b277';

  const activeAxisImpactFactors =
    AXIS_IMPACT_FACTORS[activeAxisKey] || AXIS_IMPACT_FACTORS.attack;

  const keyRelationships = useMemo(() => {
    const visualSummary = activeVoiceSummary || {};

    const profile = activeUniversalProfile || {};

    const meta = getFirstTellSpecMeta({
      size,

      depth,

      lugs,

      staveOption,

      hoopType,

      scorchDepth,
    });

    const dominantVoiceNodes = getDominantVoiceNodes({
      profile,

      size,

      depth,

      lugs,

      staveOption,

      hoopType,

      scorchDepth,
    });

    const firstListen = activeFirstListenRead || {};

    const canonicalNodes =
      Array.isArray(firstListen.nodes) && firstListen.nodes.length
        ? firstListen.nodes
        : dominantVoiceNodes.nodes || [];

    const canonicalTitle =
      firstListen.title || dominantVoiceNodes.title || 'Universal first listen';

    const simpleScore = visualSummary?.simpleThreadScore || 1;

    const shapedScore = visualSummary?.shapedThreadScore || simpleScore || 1;

    const getCanonicalPlayerTitle = () => {
      if (meta.isCompact && meta.depthNumber >= 8) {
        return 'Compact maximum depth with focused punch';
      }

      if (meta.isCompact && meta.depthNumber >= 7.5) {
        return 'Compact depth with stronger room push';
      }

      if (meta.isCompact && meta.depthNumber >= 7) {
        return 'Controlled compact depth with tight focus';
      }

      if (meta.isMiddle && meta.depthNumber >= 8) {
        return 'Full alternate voice with extended bloom';
      }

      if (meta.isMiddle && meta.depthNumber >= 7.5) {
        return 'Deep alternate voice with longer room bloom';
      }

      if (meta.isMiddle && meta.depthNumber >= 7) {
        return 'Warm alternate body with room presence';
      }

      if (meta.isFullSize && meta.depthNumber >= 8) {
        return 'Maximum depth with broad shell bloom';
      }

      if (meta.isFullSize && meta.depthNumber >= 7.5) {
        return 'Big main voice with longer room bloom';
      }

      if (meta.isFullSize && meta.depthNumber >= 7) {
        return 'Deep main voice with open body';
      }

      if (
        canonicalNodes.includes('attack') &&
        canonicalNodes.includes('brightness') &&
        canonicalNodes.includes('sensitivity')
      ) {
        return 'Quick, open touch response';
      }

      if (
        canonicalNodes.includes('attack') &&
        canonicalNodes.includes('brightness') &&
        canonicalNodes.includes('warmth')
      ) {
        return 'Quick, lean articulate response';
      }

      if (
        canonicalNodes.includes('warmth') &&
        canonicalNodes.includes('sustain') &&
        canonicalNodes.includes('projection')
      ) {
        return 'Deep warmth with open bloom';
      }

      if (
        canonicalNodes.includes('warmth') &&
        canonicalNodes.includes('projection') &&
        canonicalNodes.includes('control')
      ) {
        return 'Warm body with focused room push';
      }

      if (
        canonicalNodes.includes('attack') &&
        canonicalNodes.includes('projection') &&
        canonicalNodes.includes('control')
      ) {
        return 'Focused power with clean shape';
      }

      if (
        canonicalNodes.includes('sensitivity') &&
        canonicalNodes.includes('sustain') &&
        canonicalNodes.includes('warmth')
      ) {
        return 'Open touch with woody bloom';
      }

      if (
        canonicalNodes.includes('control') &&
        canonicalNodes.includes('attack') &&
        canonicalNodes.includes('brightness')
      ) {
        return 'Dry snap with controlled edge';
      }

      return canonicalTitle;
    };

    const getCanonicalPlayerSummary = () => {
      if (meta.isCompact && meta.depthNumber >= 8) {
        return 'This 12" build is reading as a compact deep snare rather than a huge main voice. The extra depth adds punch, low-center weight, and stronger room push, but the smaller diameter keeps the response tighter, quicker, and more focused than the 13" or 14" deep paths.';
      }

      if (meta.isCompact && meta.depthNumber >= 7.5) {
        return 'This 12" build is moving into a deeper compact voice: more body and room presence than the 7" path, but still controlled and punch-focused. It should feel bigger under the stick without losing the smaller drum’s quick identity.';
      }

      if (meta.isCompact && meta.depthNumber >= 7) {
        return 'This 12" build is reading with added depth and control while still staying tight and compact. The extra shell depth gives it more push than the shallower paths, but the voice remains focused rather than wide.';
      }

      if (meta.isMiddle && meta.depthNumber >= 8) {
        return 'This 13" build is reading as a full alternate voice with extended bloom. It carries more body and lower room shape than the 7.5" path, while still staying tighter and more compact than a 14" maximum-depth main snare.';
      }

      if (meta.isMiddle && meta.depthNumber >= 7.5) {
        return 'This 13" build is reading with a deeper alternate-snare body: longer bloom, more room presence, and more physical weight than the 7" path. It should feel broad and expressive without becoming as wide as the 14" deep builds.';
      }

      if (meta.isMiddle && meta.depthNumber >= 7) {
        return 'This 13" build is reading with warm body and added room presence. It should feel fuller than the shallower alternate voices, while still keeping enough definition and control to stay versatile.';
      }

      if (meta.isFullSize && meta.depthNumber >= 8) {
        return 'This 14" build is reading with the deepest Heritage body in this range: slower air movement, wider shell bloom, and a more physical low-center response. Compared with the 7.5" path, this should feel less quick and more settled, with the room shape becoming a bigger part of the voice.';
      }

      if (meta.isFullSize && meta.depthNumber >= 7.5) {
        return 'This 14" build is reading with a big main-snare feel and a longer body shape, but still holding more immediacy than the full 8" depth. It should feel broad, weighted, and physical without fully moving into the maximum-depth bloom.';
      }

      if (meta.isFullSize && meta.depthNumber >= 7) {
        return 'This 14" build is reading with deeper main-snare body and stronger room presence. It adds more low-center weight than the 6.5" path while still keeping enough front-edge definition for a usable main voice.';
      }

      if (
        canonicalNodes.includes('attack') &&
        canonicalNodes.includes('brightness') &&
        canonicalNodes.includes('sensitivity')
      ) {
        return 'The drum is reading as quick, articulate, and responsive, with a clear first edge and enough openness to keep the side-snare feel lively.';
      }

      if (
        canonicalNodes.includes('warmth') &&
        canonicalNodes.includes('sustain') &&
        canonicalNodes.includes('projection')
      ) {
        return 'The drum is reading with more body, longer bloom, and a broader room shape while still keeping the Heritage voice grounded.';
      }

      if (
        canonicalNodes.includes('warmth') &&
        canonicalNodes.includes('projection') &&
        canonicalNodes.includes('control')
      ) {
        return 'The drum is reading with a fuller body, stronger room presence, and enough organization to keep the note shaped and usable.';
      }

      if (
        canonicalNodes.includes('attack') &&
        canonicalNodes.includes('projection') &&
        canonicalNodes.includes('control')
      ) {
        return 'The drum is reading with stronger front-edge definition, more outward push, and a cleaner, more organized note shape.';
      }

      if (
        canonicalNodes.includes('sensitivity') &&
        canonicalNodes.includes('sustain') &&
        canonicalNodes.includes('warmth')
      ) {
        return 'The drum is reading as open, touch-sensitive, and woody, with more shell movement and a more breathing response under the hands.';
      }

      if (
        canonicalNodes.includes('control') &&
        canonicalNodes.includes('attack') &&
        canonicalNodes.includes('brightness')
      ) {
        return 'The drum is reading as drier, quicker, and more controlled, with a clearer edge and a more contained response.';
      }

      return 'The drum is reading through the same core traits as the First Listen, but with a fuller view of how the voice works under the hands.';
    };

    return [
      {
        id: 'first-listen-canonical',

        slotKey: 'simple',

        title: canonicalTitle,

        nodes: canonicalNodes,

        score: simpleScore,

        summary:
          dominantVoiceNodes.summary ||
          firstListen.summary ||
          'The first listen read: the three traits your ear is most likely to notice before digging into the full player analysis.',
        ruleId: dominantVoiceNodes.ruleId,
      },

      {
        id: 'player-analysis-canonical',

        slotKey: 'shaped',

        title: getCanonicalPlayerTitle(),

        nodes: AXIS_META.map((axis) => axis.key),

        score: shapedScore,

        summary: getCanonicalPlayerSummary(),

        ruleId: dominantVoiceNodes.ruleId,
      },
    ];
  }, [
    activeVoiceSummary,

    activeUniversalProfile,

    activeFirstListenRead,

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,
  ]);

  const selectedThreadId = useMemo(() => {
    if (!keyRelationships.length) return '';

    const selectedByExactId = keyRelationships.find(
      (relationship) => relationship.id === activeThreadSelection.id
    );

    if (selectedByExactId) {
      return selectedByExactId.id;
    }

    const selectedBySlot = keyRelationships.find(
      (relationship) => relationship.slotKey === activeThreadSelection.slotKey
    );

    if (selectedBySlot) {
      return selectedBySlot.id;
    }

    return keyRelationships[0].id;
  }, [keyRelationships, activeThreadSelection]);

  const activeThread = useMemo(() => {
    return (
      keyRelationships.find(
        (relationship) => relationship.id === selectedThreadId
      ) ||
      keyRelationships[0] ||
      null
    );
  }, [keyRelationships, selectedThreadId]);

  const activeVoiceThreadReadout = useMemo(() => {
    if (!activeThread) return null;

    return buildVoiceThreadReadout({
      thread: activeThread,

      profile: activeUniversalProfile,

      sourceBuildRead: activeVoiceSummary?.sourceBuildRead || '',
    });
  }, [activeThread, activeVoiceSummary, activeUniversalProfile]);

  const getOptionDeltaMeta = (nextSelections) => {
    const nextPrice = computeHeritagePrice({
      size: nextSelections.size ?? size,

      depth: nextSelections.depth ?? depth,

      staveOption: nextSelections.staveOption ?? staveOption,

      hardwareColor: nextSelections.hardwareColor ?? hardwareColor,

      hoopType: nextSelections.hoopType ?? hoopType,
    });

    const delta = nextPrice - currentBuildPrice;

    return {
      text: getReadableDelta(delta),

      className: getDeltaClassName(delta),
    };
  };

  const handleBenchmarkFamilyChange = (nextFamilyId) => {
    const nextFamily = benchmarkFamilyOptions.find(
      (family) => family.familyId === nextFamilyId
    );

    if (!nextFamily) return;

    const nextType = nextFamily.benchmarkTypes?.[0] || null;

    const nextSizeId =
      nextType?.defaultSizeId || nextType?.presetSizes?.[0] || '';

    setBenchmarkFamilyId(nextFamilyId);

    setBenchmarkTypeId(nextType?.typeId || '');

    setBenchmarkSizeId(nextSizeId);
  };

  const handleBenchmarkTypeChange = (nextTypeId) => {
    const nextType =
      selectedBenchmarkFamily?.benchmarkTypes?.find(
        (type) => type.typeId === nextTypeId
      ) || null;

    if (!nextType) return;

    const nextSizeId =
      nextType.defaultSizeId || nextType.presetSizes?.[0] || '';

    setBenchmarkTypeId(nextTypeId);

    setBenchmarkSizeId(nextSizeId);
  };

  const handleBenchmarkSizeChange = (nextSizeId) => {
    setBenchmarkSizeId(nextSizeId);
  };

  const handleRequestCompareMode = () => {
    const hasSeenIntro =
      localStorage.getItem(COMPARE_INTRO_STORAGE_KEY) === 'true';

    if (hasSeenIntro) {
      setIsCompareModeEnabled(true);

      return;
    }

    setShowCompareIntro(true);
  };

  const handleEnableCompareMode = () => {
    localStorage.setItem(COMPARE_INTRO_STORAGE_KEY, 'true');

    setShowCompareIntro(false);

    setIsCompareModeEnabled(true);
  };

  const handleDisableCompareMode = () => {
    setIsCompareModeEnabled(false);

    if (legacyPrintTab === 'referenceSetup') {
      setLegacyPrintTab('playerAnalysis');
    }
  };

  const handleThreadSelect = (relationshipId) => {
    const selectedRelationship = keyRelationships.find(
      (relationship) => relationship.id === relationshipId
    );

    setActiveThreadSelection({
      id: relationshipId,

      slotKey: selectedRelationship?.slotKey || '',
    });
  };

  useEffect(() => {
    setBenchmarkGlowPulseKey((prev) => prev + 1);
  }, [benchmarkFamilyId, benchmarkTypeId, benchmarkSizeId]);

  useEffect(() => {
    const fetchProductStatus = async () => {
      setIsLoading(true);

      try {
        const productRef = doc(db, 'products', 'heritage');

        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          setProduct(productSnap.data());
        } else {
          console.error('❌ Product doc not found: products/heritage');
        }
      } catch (error) {
        console.error('❌ Error fetching product status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductStatus();
  }, []);

  useEffect(() => {
    setTotalPrice(currentBuildPrice);

    setSelectedDrumSummary(
      buildHeritageVoiceRead({
        size,

        depth,

        lugs,

        staveOption,

        hardwareColor: HERITAGE_VOICE_READ_HARDWARE_COLOR,

        hoopType,

        scorchDepth,

        benchmarkFamilyId,

        benchmarkTypeId,

        benchmarkSizeId,
      })
    );
  }, [
    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    scorchDepth,

    currentBuildPrice,

    benchmarkFamilyId,

    benchmarkTypeId,

    benchmarkSizeId,
  ]);

  useEffect(() => {
    const hasReRing = hasReRingFromStaveOption(staveOption);

    const normalizedStave = staveOption.split(' - ')[0].trim();

    const normalizedHardware = hardwareColor.toLowerCase().replace(/\s+/g, '-');

    const normalizedHoops = hoopType.toLowerCase().replace(/\s+/g, '-');

    const normalizedScorch = scorchDepth.toLowerCase().replace(/\s+/g, '-');

    const matchingItem = cart.find((item) => {
      const iSize = item.size || item.config?.size;

      const iDepth = item.depth || item.config?.depth;

      const iLugs = item.lugQuantity || item.config?.lugQuantity;

      const iStave = item.staveQuantity || item.config?.staveQuantity;

      const iHardware = (item.hardwareColor || item.config?.hardwareColor || '')

        .toLowerCase()

        .replace(/\s+/g, '-');

      const iHoops = (item.hoopType || item.config?.hoopType || '')

        .toLowerCase()

        .replace(/\s+/g, '-');

      const iScorch = (item.scorchDepth || item.config?.scorchDepth || '')

        .toLowerCase()

        .replace(/\s+/g, '-');

      return (
        String(iSize) === String(size) &&
        String(iDepth) === String(depth) &&
        Boolean(item.reRing) === Boolean(hasReRing) &&
        String(iLugs) === String(lugs) &&
        String(iStave).trim() === normalizedStave &&
        iHardware === normalizedHardware &&
        iHoops === normalizedHoops &&
        iScorch === normalizedScorch
      );
    });

    if (matchingItem) {
      setCartItemId(matchingItem.id);

      setButtonText('In Cart');
    } else {
      setCartItemId(null);

      setButtonText('Add to Cart');
    }
  }, [
    cart,

    size,

    depth,

    staveOption,

    lugs,

    hardwareColor,

    hoopType,

    scorchDepth,
  ]);

  const applyHeritagePreset = (preset) => {
    if (preset === 'standard') {
      setSize('14');

      setDepth('5.5');

      setLugs('8');

      setStaveOption('16 - 11mm');

      setHardwareColor('Chrome');

      setHoopType('Triple Flange');

      setScorchDepth('Medium Torch');

      setOpenBuilderSection('construction');

      setShowConfigBreakdown(false);

      return;
    }

    setSize('12');

    setDepth('5.0');

    setLugs('8');

    setStaveOption('16 - 13mm');

    setHardwareColor('Chrome');

    setHoopType('Triple Flange');

    setScorchDepth('Medium Torch');

    setOpenBuilderSection('construction');

    setShowConfigBreakdown(false);
  };

  const handleReviewBuild = () => {
    setOpenBuilderSection('');
  };

  const handleAddToCart = async () => {
    if (!size || !depth) {
      console.error('❌ Missing selection: Size or Depth not chosen');

      return;
    }

    if (!product) {
      toast.error('❌ Product data not loaded yet.');

      return;
    }

    if (product.status !== 'active' && !product.isPreOrder) {
      toast.error('❌ This drum is currently unavailable.');

      return;
    }

    const hasReRing = hasReRingFromStaveOption(staveOption);

    const newCartItemId = generateCartItemId({
      stripePriceId: '',

      size,

      depth,

      reRing: hasReRing,

      lugQuantity: lugs,

      staveQuantity: staveOption.split(' - ')[0],

      hardwareColor,

      hoopType,

      scorchDepth,
    });

    const cartItem = {
      id: newCartItemId,

      productId: 'heritage',

      name: 'HERITAGE',

      size,

      depth,

      reRing: hasReRing,

      lugQuantity: lugs,

      staveQuantity: staveOption.split(' - ')[0],

      price: totalPrice,

      stripePriceId: null,

      quantity: 1,

      images: [productImage],

      category: 'artisan',

      hardwareColor,

      hoopType,

      snareBedDepth: HERITAGE_STANDARD_SNARE_BED,

      bearingEdge: HERITAGE_STANDARD_BEARING_EDGE,

      scorchDepth,

      snareWireModel: HERITAGE_STANDARD_REFERENCE.snareWires,

      batterHead: HERITAGE_STANDARD_REFERENCE.batterHead,

      resonantHead: HERITAGE_STANDARD_REFERENCE.resonantHead,

      config: {
        series: 'HERITAGE',

        size,

        depth,

        reRing: hasReRing,

        lugQuantity: lugs,

        staveQuantity: staveOption.split(' - ')[0],

        hardwareColor,

        hoopType,

        snareBedDepth: HERITAGE_STANDARD_SNARE_BED,

        bearingEdge: HERITAGE_STANDARD_BEARING_EDGE,

        scorchDepth,

        snareWireModel: HERITAGE_STANDARD_REFERENCE.snareWires,

        batterHead: HERITAGE_STANDARD_REFERENCE.batterHead,

        resonantHead: HERITAGE_STANDARD_REFERENCE.resonantHead,
      },
    };

    await addToCart(cartItem, cartItem.config);

    toast.success('🛒 Item added to cart!');

    setCartItemId(newCartItemId);

    setButtonText('In Cart');
  };

  const handleRemoveFromCart = () => {
    if (cartItemId) {
      removeFromCart(cartItemId);

      toast.success('🗑️ Item removed from cart.');
    }
  };

  const handleSizeSelect = (newSize) => {
    if (newSize === size) return;

    const availableDepths = Object.keys(depthPrices[newSize] || {});

    const nextDepth = availableDepths.includes(String(depth))
      ? String(depth)
      : availableDepths[0];

    const nextStaves = getAvailableStaveOptions(newSize);

    const nextStaveOption =
      nextStaves.find((item) => item === '16 - 11mm') ||
      nextStaves.find((item) => item === '16 - 13mm') ||
      nextStaves.find((item) => item === '16 - 12mm') ||
      nextStaves.find((item) => !hasReRingFromStaveOption(item)) ||
      nextStaves[0] ||
      '';

    const nextLugs =
      getAvailableLugsForShellRecipe(newSize, nextStaveOption)[0] ||
      lugOptions[newSize]?.[0] ||
      '';

    setSize(newSize);

    setDepth(nextDepth);

    setStaveOption(nextStaveOption);

    setLugs(nextLugs);
  };

  const handleDepthSelect = (newDepth) => {
    setDepth(newDepth);
  };

  const handleLugSelect = (newLug) => {
    if (newLug === lugs) return;

    const isAvailable = isLugAvailableForShellRecipe({
      selectedSize: size,

      selectedStaveOption: staveOption,

      lugOption: newLug,
    });

    if (!isAvailable) {
      toast.error(
        getUnavailableLugReason({
          selectedSize: size,

          selectedStaveOption: staveOption,

          lugOption: newLug,
        }) || 'That lug count is not available for this shell recipe.'
      );

      return;
    }

    setLugs(newLug);
  };

  const handleStaveSelect = (option) => {
    const availableLugs = getAvailableLugsForShellRecipe(size, option);

    const nextLugs = availableLugs.includes(String(lugs))
      ? String(lugs)
      : availableLugs[0] || lugs;

    setStaveOption(option);

    setLugs(nextLugs);
  };

  const renderReferenceSelectorPanel = () => {
    return (
      <div className="heritage-reference-card-shell">
        <div className="heritage-reference-card-head">
          <span className="heritage-summary-kicker">Reference Drum</span>

          <p className="heritage-chart-reference-subcopy">
            Choose the drum you want this build compared against. By default,
            HERITAGE starts from a 14&quot; × 5.5&quot; Northern Red Oak stave
            reference with 16 staves, 8 lugs, Triple Flange hoops, Chrome
            hardware, a 45° inner edge with softened outer roundover, Standard
            snare bed, Medium Torch finish, Remo Ambassador Coated batter, Remo
            Ambassador Hazy Snare Side, and PureSound Custom Pro Steel 20-Strand
            wires.
          </p>
        </div>

        <div
          className="heritage-benchmark-read heritage-benchmark-read--glow"
          key={benchmarkGlowPulseKey}
        >
          <div className="heritage-benchmark-hero heritage-benchmark-hero--refined">
            <div className="heritage-benchmark-hero-image-shell">
              <img
                src={selectedBenchmarkImagePath}
                alt={
                  selectedBenchmarkType?.typeLabel
                    ? `${selectedBenchmarkType.typeLabel} reference drum`
                    : 'Selected reference drum'
                }
                className="heritage-benchmark-hero-image"
              />
            </div>

            <div className="heritage-benchmark-hero-copy">
              <div className="heritage-benchmark-hero-copy-top">
                <span className="heritage-benchmark-pill">
                  Selected Reference
                </span>

                <h4 className="heritage-benchmark-hero-title">
                  {selectedBenchmarkType?.typeLabel || 'Reference Drum'}

                  {selectedBenchmarkSize?.label
                    ? ` • ${selectedBenchmarkSize.label}`
                    : ''}
                </h4>

                <p className="heritage-benchmark-hero-description">
                  {selectedBenchmarkType?.shortDescription ||
                    'Reference drum selected for tonal comparison.'}
                </p>

                <p className="heritage-benchmark-hero-body">
                  {benchmarkReadBody}
                </p>
              </div>
            </div>

            <div className="heritage-benchmark-selector-panel">
              <div className="heritage-benchmark-selector-stack heritage-benchmark-selector-stack--hero">
                <div className="heritage-benchmark-selector-group">
                  <label className="heritage-benchmark-selector-label">
                    Reference Family
                  </label>

                  <select
                    className="heritage-benchmark-selector"
                    value={selectedBenchmarkFamily?.familyId || ''}
                    onChange={(e) =>
                      handleBenchmarkFamilyChange(e.target.value)
                    }
                  >
                    {benchmarkFamilyOptions.map((family) => (
                      <option key={family.familyId} value={family.familyId}>
                        {family.familyLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="heritage-benchmark-selector-group">
                  <label className="heritage-benchmark-selector-label">
                    Reference Drum
                  </label>

                  <select
                    className="heritage-benchmark-selector"
                    value={selectedBenchmarkType?.typeId || ''}
                    onChange={(e) => handleBenchmarkTypeChange(e.target.value)}
                  >
                    {(selectedBenchmarkFamily?.benchmarkTypes || []).map(
                      (type) => (
                        <option key={type.typeId} value={type.typeId}>
                          {type.typeLabel}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="heritage-benchmark-selector-group">
                  <label className="heritage-benchmark-selector-label">
                    Reference Size
                  </label>

                  <select
                    className="heritage-benchmark-selector"
                    value={selectedBenchmarkSize?.sizeId || ''}
                    onChange={(e) => handleBenchmarkSizeChange(e.target.value)}
                  >
                    {(selectedBenchmarkType?.presetSizeOptions || []).map(
                      (sizeOption) => (
                        <option
                          key={sizeOption.sizeId}
                          value={sizeOption.sizeId}
                        >
                          {sizeOption.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="heritage-benchmark-selector-reset-row">
                <button
                  type="button"
                  className="heritage-benchmark-reset-button"
                  onClick={handleResetBenchmark}
                >
                  Reset to Heritage Standard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLegacyPrintSummaryCard = () => {
    const firstListenRelationship = keyRelationships.find(
      (relationship) => relationship.slotKey === 'simple'
    );

    const playerAnalysisRelationship = keyRelationships.find(
      (relationship) => relationship.slotKey === 'shaped'
    );

    const constructionRead =
      activeUniversalReads?.shellConstruction?.label ||
      activeUniversalVoiceRead?.reads?.shellConstruction?.label;

    const materialRead =
      activeUniversalReads?.shellMaterial?.label ||
      activeUniversalVoiceRead?.reads?.shellMaterial?.label;

    const thicknessRead =
      activeUniversalReads?.shellThickness?.label ||
      activeUniversalVoiceRead?.reads?.shellThickness?.label;

    const tuningRead = activeUniversalReads?.tuning;

    const tuningWindow =
      tuningRead?.tuningWindow || activeUniversalVoiceRead?.meta?.tuningWindow;

    const tuningSummary = tuningRead?.summary;

    return (
      <div className="heritage-legacyprint-summary-card heritage-legacyprint-summary-card--simple">
        <div className="heritage-legacyprint-summary-head heritage-legacyprint-summary-head--minimal">
          <span className="heritage-VoiceMapping-read-kicker">
            LegacyPrint™ Analysis
          </span>

          <p>
            {toneSummaryText} First Listen, Player Analysis, and LegacyTuning™
            turn that blueprint into a practical read of how this drum starts,
            responds, carries, and settles.
          </p>
        </div>

        <div className="heritage-legacyprint-summary-flow">
          {(constructionRead || materialRead || thicknessRead) && (
            <article className="heritage-legacyprint-summary-read">
              <span>Build Read</span>

              <div>
                <strong>
                  {[constructionRead, materialRead, thicknessRead]

                    .filter(Boolean)

                    .join(' • ')}
                </strong>

                <p>
                  {activeUniversalReads?.shellConstruction?.summary ||
                    activeUniversalReads?.shellThickness?.summary ||
                    'The universal engine is reading the construction, material, shell thickness, edge, hardware, heads, tuning, and finish as separate acoustic inputs before shaping the final profile.'}
                </p>
              </div>
            </article>
          )}

          {firstListenRelationship && (
            <article className="heritage-legacyprint-summary-read">
              <span>First Listen</span>

              <div>
                <strong>{firstListenRelationship.title}.</strong>

                <p>
                  The immediate ear read — the traits most likely to stand out
                  before deeper feel, response, and tuning context come into
                  focus.
                </p>
              </div>
            </article>
          )}

          {playerAnalysisRelationship && (
            <article className="heritage-legacyprint-summary-read">
              <span>Player Analysis</span>

              <div>
                <strong>{playerAnalysisRelationship.title}.</strong>

                <p>
                  {playerAnalysisRelationship.summary} Use this as the fuller
                  under-the-hands read once response, placement, and behavior
                  begin working together.
                </p>
              </div>
            </article>
          )}

          <article className="heritage-legacyprint-summary-read">
            <span>LegacyTuning™ Zone</span>

            <div>
              <strong>
                {tuningWindow?.min && tuningWindow?.max
                  ? `${tuningWindow.min}–${tuningWindow.max} Hz · ${tuningWindow.nearestNoteWindow}`
                  : `${legacyTuningHzRange} · ${currentNearestNoteWindow}`}
              </strong>

              <p>
                {tuningSummary ||
                  'The broader resonance lane where the shell is likely to feel balanced before heads, wires, hardware, and final craftsman tuning decide the finished pocket.'}
              </p>
            </div>
          </article>

          <article className="heritage-legacyprint-summary-read heritage-legacyprint-summary-read--takeaway">
            <span>Craftsman Takeaway</span>

            <div>
              <p>
                Treat this as build-direction guidance, not a final verdict. The
                finished drum still has to be tuned, played, heard, and allowed
                to show where its final pocket lives.
              </p>
            </div>
          </article>
        </div>
      </div>
    );
  };

  const renderVoiceRangeCard = () => {
    const normalizedRangeStart = Math.min(
      Number(legacyTuningRange.start) || 1,

      Number(legacyTuningRange.end) || 1
    );

    const normalizedRangeEnd = Math.max(
      Number(legacyTuningRange.start) || 1,

      Number(legacyTuningRange.end) || 1
    );

    const normalizedBenchmarkRangeStart = Math.min(
      Number(benchmarkLegacyTuningRange.start) || 1,

      Number(benchmarkLegacyTuningRange.end) || 1
    );

    const normalizedBenchmarkRangeEnd = Math.max(
      Number(benchmarkLegacyTuningRange.start) || 1,

      Number(benchmarkLegacyTuningRange.end) || 1
    );

    const rangeStartPercent = ((normalizedRangeStart - 1) / 4) * 100;

    const rangeEndPercent = ((normalizedRangeEnd - 1) / 4) * 100;

    const rangeWidthPercent = Math.max(0, rangeEndPercent - rangeStartPercent);

    const benchmarkRangeStartPercent =
      ((normalizedBenchmarkRangeStart - 1) / 4) * 100;

    const benchmarkRangeEndPercent =
      ((normalizedBenchmarkRangeEnd - 1) / 4) * 100;

    const benchmarkRangeWidthPercent = Math.max(
      0,

      benchmarkRangeEndPercent - benchmarkRangeStartPercent
    );

    const universalTuningWindow = activeUniversalReads?.tuning?.tuningWindow;

    const displayedTuningHzRange =
      universalTuningWindow?.min && universalTuningWindow?.max
        ? `${universalTuningWindow.min}–${universalTuningWindow.max} Hz`
        : legacyTuningHzRange;

    const displayedNearestNoteWindow =
      universalTuningWindow?.nearestNoteWindow || currentNearestNoteWindow;

    return (
      <div
        className={`heritage-voice-range-card heritage-voice-range-card--polished ${
          isCompareModeEnabled
            ? 'heritage-voice-range-card--range-compare'
            : 'heritage-voice-range-card--single-range'
        }`}
      >
        <div className="heritage-voice-range-head">
          <span className="heritage-summary-kicker">LegacyTuning™ Zone</span>

          <p className="heritage-voice-range-intro">
            LegacyTuning™ starts with a broader Zone — the resonance area where
            this shell naturally wants to live. The measured Range shows the
            current frequency span inside that Zone. The Pocket is the final
            craftsman-read decision: the place where the shell opens up, settles
            in, and tells us it is ready.
          </p>

          <div
            className={`heritage-voice-range-readout-grid ${
              isCompareModeEnabled ? 'is-compare-mode' : ''
            }`}
          >
            <div className="heritage-voice-range-readout heritage-voice-range-readout--current">
              <span>Current Range</span>

              <strong>{displayedTuningHzRange}</strong>

              <em>{displayedNearestNoteWindow} nearest note window</em>
            </div>

            {isCompareModeEnabled && (
              <div className="heritage-voice-range-readout heritage-voice-range-readout--reference">
                <span>Reference Range</span>

                <strong>{benchmarkLegacyTuningHzRange}</strong>

                <em>{referenceNearestNoteWindow} nearest note window</em>
              </div>
            )}
          </div>
        </div>

        <div className="heritage-voice-range-scale">
          <div className="heritage-voice-range-labels">
            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">
                Low / Breathing
              </span>

              <span className="heritage-voice-range-stop-sub">
                55–120 Hz · Loose body
              </span>
            </div>

            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">
                Warm / Full
              </span>

              <span className="heritage-voice-range-stop-sub">
                120–190 Hz · Lower shell
              </span>
            </div>

            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">Balanced</span>

              <span className="heritage-voice-range-stop-sub">
                190–280 Hz · Core zone
              </span>
            </div>

            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">
                Focused / Present
              </span>

              <span className="heritage-voice-range-stop-sub">
                280–360 Hz · Upper shell
              </span>
            </div>

            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">
                Tight / Bright
              </span>

              <span className="heritage-voice-range-stop-sub">
                360–430 Hz · Stiff response
              </span>
            </div>
          </div>

          <div
            className={`heritage-voice-range-track ${
              isCompareModeEnabled ? 'heritage-voice-range-track--compare' : ''
            }`}
            aria-label="LegacyTuning Zone from warm and full to bright and airy"
          >
            <div className="heritage-voice-range-track-line" />

            <div
              className="heritage-voice-range-band heritage-voice-range-band--current"
              style={{
                left: `${rangeStartPercent}%`,

                width: `${rangeWidthPercent}%`,
              }}
            >
              <span className="heritage-voice-range-band-label">
                Current Build
              </span>
            </div>

            <div
              className="heritage-voice-range-range-cap heritage-voice-range-range-cap--start"
              style={{
                left: `${rangeStartPercent}%`,
              }}
            />

            <div
              className="heritage-voice-range-range-cap heritage-voice-range-range-cap--end"
              style={{
                left: `${rangeEndPercent}%`,
              }}
            />

            {isCompareModeEnabled && (
              <>
                <div
                  className="heritage-voice-range-band heritage-voice-range-band--reference"
                  style={{
                    left: `${benchmarkRangeStartPercent}%`,

                    width: `${benchmarkRangeWidthPercent}%`,
                  }}
                >
                  <span className="heritage-voice-range-band-label">
                    Reference
                  </span>
                </div>

                <div
                  className="heritage-voice-range-range-cap heritage-voice-range-range-cap--reference-start"
                  style={{
                    left: `${benchmarkRangeStartPercent}%`,
                  }}
                />

                <div
                  className="heritage-voice-range-range-cap heritage-voice-range-range-cap--reference-end"
                  style={{
                    left: `${benchmarkRangeEndPercent}%`,
                  }}
                />
              </>
            )}
          </div>

          <div className="heritage-voice-range-footer">
            <span>Lower / more breathing shell response</span>

            <span>Higher / tighter shell response</span>
          </div>

          <div className="heritage-voice-range-legend">
            <span className="heritage-voice-range-legend-item">
              <span className="heritage-voice-range-dot heritage-voice-range-dot--range" />
              Current Build Range
            </span>

            {isCompareModeEnabled && (
              <span className="heritage-voice-range-legend-item">
                <span className="heritage-voice-range-dot heritage-voice-range-dot--reference-range" />
                Reference Range
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderVoiceMappingReadExperience = (targetSlotKey = 'simple') => {
    const scopedThread =
      keyRelationships.find(
        (relationship) => relationship.slotKey === targetSlotKey
      ) ||
      keyRelationships[0] ||
      null;

    if (!scopedThread) {
      return null;
    }

    const activeReadout = buildVoiceThreadReadout({
      thread: scopedThread,

      profile: activeUniversalProfile,

      sourceBuildRead: activeVoiceSummary?.sourceBuildRead || '',
    });

    if (!activeReadout) {
      return null;
    }

    const activeThread = scopedThread;

    const firstListen = activeFirstListenRead || {};

    const readCopy = getVoiceMappingReadCopy(activeThread.slotKey);

    const VoiceMappingVariant = getVoiceMappingVariantForSlot(
      activeThread.slotKey
    );

    const isFirstTell = VoiceMappingVariant === 'firstTell';

    const isPlayerRead = VoiceMappingVariant === 'player';

    const fallbackDisplayTitle = getVoiceMappingDisplayTitle({
      relationship: activeThread,

      profile: activeUniversalProfile,

      size,

      depth,

      lugs,

      staveOption,

      hoopType,

      scorchDepth,
    });

    const firstTellKeys =
      isFirstTell &&
      Array.isArray(firstListen.nodes) &&
      firstListen.nodes.length
        ? firstListen.nodes
        : getFirstTellTriangleNodes({
            relationship: activeThread,

            profile: activeUniversalProfile,

            size,

            depth,

            lugs,

            staveOption,

            hoopType,

            scorchDepth,
          });

    const baseVisualThread = getVoiceMappingVisualThread({
      relationship: activeThread,

      profile: activeUniversalProfile,

      size,

      depth,

      lugs,

      staveOption,

      hoopType,

      scorchDepth,
    });

    const visualThread =
      isFirstTell && baseVisualThread
        ? {
            ...baseVisualThread,

            nodes: firstTellKeys,

            title:
              firstListen.title ||
              baseVisualThread.title ||
              activeThread.title ||
              'First Listen',
          }
        : baseVisualThread;

    const visualNodes = visualThread?.nodes || [];

    const dominantNodeKeys =
      isFirstTell && Array.isArray(firstTellKeys) ? firstTellKeys : visualNodes;

    const firstTellTitle =
      firstListen.title ||
      getFirstTellDisplayTitle({
        profile: activeUniversalProfile,

        size,

        depth,

        lugs,

        staveOption,

        hoopType,

        scorchDepth,
      });

    const displayTitle = isFirstTell ? firstTellTitle : fallbackDisplayTitle;

    const resolvedDisplayTitle = isFirstTell ? firstTellTitle : displayTitle;

    const firstTellPrimaryNode = visualNodes[0] || firstTellKeys[0] || 'attack';

    const firstTellPrimaryColor =
      AXIS_COLOR_BY_KEY[firstTellPrimaryNode] || AXIS_COLOR_BY_KEY.attack;

    const visualNodeLabels = visualNodes

      .map(
        (nodeKey) =>
          AXIS_META.find((axis) => axis.key === nodeKey)?.label || nodeKey
      )

      .join(', ');

    const firstTellSummary =
      firstListen.summary ||
      buildFirstTellSummary({
        visualNodes,

        activeThread,

        activeReadout,

        profile: activeUniversalProfile,
      });

    const voiceMapDisplayProfile = (() => {
      const baseProfile = activeUniversalProfile || {};

      const meta = getFirstTellSpecMeta({
        size,

        depth,

        lugs,

        staveOption,

        hoopType,

        scorchDepth,
      });

      if (!isFirstTell) {
        return baseProfile;
      }

      if (firstListen.visualProfile) {
        return firstListen.visualProfile;
      }

      const depthNumber = Number(depth);

      const nextProfile = {
        attack: 3.05,

        brightness: 3.05,

        projection: 3.05,

        sustain: 3.05,

        warmth: 3.05,

        sensitivity: 3.05,

        control: 3.05,
      };

      const visualNodeSet = new Set(visualNodes);

      const diameterBias = {
        attack: 0,

        brightness: 0,

        projection: 0,

        sustain: 0,

        warmth: 0,

        sensitivity: 0,

        control: 0,
      };

      if (meta.isCompact) {
        diameterBias.attack += 1.05;

        diameterBias.brightness += 0.78;

        diameterBias.sensitivity += 0.58;

        diameterBias.control += 0.28;

        diameterBias.projection -= 0.42;

        diameterBias.warmth -= 0.95;

        diameterBias.sustain -= 0.8;
      }

      if (meta.isMiddle) {
        diameterBias.attack += 0.28;

        diameterBias.brightness += 0.18;

        diameterBias.projection += 0.18;

        diameterBias.sustain += 0.18;

        diameterBias.warmth += 0.32;

        diameterBias.sensitivity += 0.08;
      }

      if (meta.isFullSize) {
        diameterBias.warmth += 1.18;

        diameterBias.sustain += 0.72;

        diameterBias.projection += 0.52;

        diameterBias.control += 0.08;

        diameterBias.attack -= 0.62;

        diameterBias.brightness -= 0.42;

        diameterBias.sensitivity -= 0.22;
      }

      const depthBias = {
        attack: 0,

        brightness: 0,

        projection: 0,

        sustain: 0,

        warmth: 0,

        sensitivity: 0,

        control: 0,
      };

      if (depthNumber <= 5.5) {
        depthBias.attack += 0.95;

        depthBias.brightness += 0.68;

        depthBias.sensitivity += 0.35;

        depthBias.control += 0.08;

        depthBias.projection -= 0.28;

        depthBias.warmth -= 0.55;

        depthBias.sustain -= 0.95;
      }

      if (depthNumber >= 6 && depthNumber < 6.5) {
        depthBias.warmth += 0.38;

        depthBias.projection += 0.22;

        depthBias.attack += 0.08;

        depthBias.sustain += 0.06;
      }

      if (depthNumber >= 6.5 && depthNumber < 7) {
        depthBias.warmth += 0.58;

        depthBias.projection += 0.42;

        depthBias.sustain += 0.18;

        depthBias.attack -= 0.12;

        depthBias.brightness -= 0.08;
      }

      if (depthNumber >= 7 && depthNumber < 7.5) {
        depthBias.warmth += 0.88;

        depthBias.projection += 0.68;

        depthBias.sustain += 0.42;

        depthBias.attack -= 0.42;

        depthBias.brightness -= 0.32;
      }

      if (depthNumber >= 7.5 && depthNumber < 8) {
        depthBias.warmth += 1.12;

        depthBias.sustain += 0.86;

        depthBias.projection += 0.78;

        depthBias.attack -= 0.62;

        depthBias.brightness -= 0.48;

        depthBias.sensitivity -= 0.12;
      }

      if (depthNumber >= 8) {
        depthBias.sustain += 1.35;

        depthBias.warmth += 1.22;

        depthBias.projection += 0.92;

        depthBias.attack -= 0.82;

        depthBias.brightness -= 0.62;

        depthBias.sensitivity -= 0.24;
      }

      const shellBias = {
        attack: 0,

        brightness: 0,

        projection: 0,

        sustain: 0,

        warmth: 0,

        sensitivity: 0,

        control: 0,
      };

      if (meta.isThinShell) {
        shellBias.sensitivity += 0.92;

        shellBias.sustain += 0.78;

        shellBias.warmth += 0.38;

        shellBias.control -= 0.42;

        shellBias.projection -= 0.18;
      }

      if (meta.isThickShell) {
        shellBias.projection += 0.82;

        shellBias.control += 0.62;

        shellBias.attack += 0.32;

        shellBias.sustain -= 0.36;

        shellBias.sensitivity -= 0.26;
      }

      if (meta.isTenLug) {
        shellBias.control += 0.88;

        shellBias.projection += 0.38;

        shellBias.attack += 0.28;

        shellBias.sustain -= 0.28;
      }

      if (meta.isSixLug) {
        shellBias.sensitivity += 0.72;

        shellBias.sustain += 0.48;

        shellBias.control -= 0.42;
      }

      const hoopBias = {
        attack: 0,

        brightness: 0,

        projection: 0,

        sustain: 0,

        warmth: 0,

        sensitivity: 0,

        control: 0,
      };

      if (meta.isDieCast) {
        hoopBias.control += 1.08;

        hoopBias.attack += 0.48;

        hoopBias.projection += 0.22;

        hoopBias.sustain -= 0.72;

        hoopBias.sensitivity -= 0.24;
      }

      if (meta.isTripleFlange) {
        hoopBias.sustain += 0.58;

        hoopBias.sensitivity += 0.28;

        hoopBias.brightness += 0.22;

        hoopBias.control -= 0.34;
      }

      const finishBias = {
        attack: 0,

        brightness: 0,

        projection: 0,

        sustain: 0,

        warmth: 0,

        sensitivity: 0,

        control: 0,
      };

      if (meta.isLightTorch) {
        finishBias.sensitivity += 0.48;

        finishBias.sustain += 0.42;

        finishBias.brightness += 0.28;

        finishBias.control -= 0.22;
      }

      if (meta.isMediumTorch) {
        finishBias.warmth += 0.2;

        finishBias.control += 0.1;
      }

      if (meta.isBlackened) {
        finishBias.control += 1.02;

        finishBias.warmth += 0.38;

        finishBias.brightness -= 0.72;

        finishBias.sensitivity -= 0.52;

        finishBias.sustain -= meta.isVeryDeep ? 0.24 : 0.58;

        finishBias.attack += meta.isShallow ? 0.28 : -0.12;
      }

      AXIS_META.forEach(({ key }) => {
        const baseValue = Number(baseProfile?.[key] ?? 5);

        const shapedValue =
          baseValue +
          diameterBias[key] +
          depthBias[key] +
          shellBias[key] +
          hoopBias[key] +
          finishBias[key];

        nextProfile[key] = Math.max(2.35, Math.min(7.25, shapedValue));
      });

      /**

   * This is the important fix:

   * highlighted First Listen nodes now get different target ceilings

   * based on diameter + depth, instead of every shared node set getting

   * the same triangle.

   */

      const diameterTargetMultiplier = meta.isCompact
        ? 0.86
        : meta.isMiddle
          ? 0.94
          : 1.06;

      const depthTargetMultiplier =
        depthNumber >= 8
          ? 1.08
          : depthNumber >= 7.5
            ? 1.04
            : depthNumber >= 7
              ? 1
              : depthNumber <= 5.5
                ? 0.94
                : 0.97;

      const nodeTargetBase = {
        attack: meta.isCompact ? 8.9 : meta.isMiddle ? 7.95 : 7.35,

        brightness: meta.isCompact ? 8.3 : meta.isMiddle ? 7.45 : 6.85,

        projection: meta.isCompact ? 7.45 : meta.isMiddle ? 8.05 : 8.75,

        sustain: meta.isCompact ? 7.05 : meta.isMiddle ? 8.1 : 9.05,

        warmth: meta.isCompact ? 6.95 : meta.isMiddle ? 8.2 : 9.35,

        sensitivity: meta.isCompact ? 8.25 : meta.isMiddle ? 7.45 : 6.85,

        control: meta.isCompact ? 8.35 : meta.isMiddle ? 8.05 : 7.85,
      };

      if (meta.isDieCast) {
        nodeTargetBase.control += 0.8;

        nodeTargetBase.attack += 0.3;

        nodeTargetBase.sustain -= 0.65;
      }

      if (meta.isTripleFlange) {
        nodeTargetBase.sustain += 0.65;

        nodeTargetBase.sensitivity += 0.22;

        nodeTargetBase.control -= 0.35;
      }

      if (meta.isLightTorch) {
        nodeTargetBase.sensitivity += 0.5;

        nodeTargetBase.sustain += 0.38;

        nodeTargetBase.brightness += 0.24;
      }

      if (meta.isBlackened) {
        nodeTargetBase.control += 0.95;

        nodeTargetBase.brightness -= 0.78;

        nodeTargetBase.sensitivity -= 0.55;

        nodeTargetBase.sustain -= meta.isVeryDeep ? 0.28 : 0.62;
      }

      if (meta.isThinShell) {
        nodeTargetBase.sensitivity += 0.75;

        nodeTargetBase.sustain += 0.58;

        nodeTargetBase.control -= 0.35;
      }

      if (meta.isThickShell) {
        nodeTargetBase.projection += 0.58;

        nodeTargetBase.control += 0.42;

        nodeTargetBase.sustain -= 0.24;
      }

      AXIS_META.forEach(({ key }) => {
        if (!visualNodeSet.has(key)) {
          nextProfile[key] = Math.min(4.35, nextProfile[key]);
        }
      });

      visualNodes.forEach((nodeKey, index) => {
        const rankDrop = index === 0 ? 0 : index === 1 ? 0.78 : 1.42;

        const target =
          nodeTargetBase[nodeKey] *
            diameterTargetMultiplier *
            depthTargetMultiplier -
          rankDrop;

        nextProfile[nodeKey] = Math.max(
          0,

          Math.min(10, Math.max(nextProfile[nodeKey], target))
        );
      });

      /**

   * Final diameter guardrails.

   * These force 13" and 14" paths to separate visually even when

   * they share warmth / projection / control as the top nodes.

   */

      if (meta.isCompact) {
        nextProfile.attack = Math.max(nextProfile.attack, 6.95);

        nextProfile.brightness = Math.max(nextProfile.brightness, 5.95);

        nextProfile.warmth = Math.min(
          nextProfile.warmth,

          depthNumber >= 8 ? 7.65 : 6.85
        );

        nextProfile.sustain = Math.min(
          nextProfile.sustain,

          depthNumber >= 8 ? 7.35 : 6.65
        );
      }

      if (meta.isMiddle) {
        nextProfile.warmth = Math.max(nextProfile.warmth, 7.15);

        nextProfile.projection = Math.max(nextProfile.projection, 6.75);

        nextProfile.sustain = Math.max(
          nextProfile.sustain,

          depthNumber >= 7 ? 6.35 : 5.8
        );

        nextProfile.attack = Math.min(nextProfile.attack, 7.65);
      }

      if (meta.isFullSize) {
        nextProfile.warmth = Math.max(nextProfile.warmth, 8.15);

        nextProfile.projection = Math.max(nextProfile.projection, 7.25);

        if (depthNumber >= 7) {
          nextProfile.sustain = Math.max(nextProfile.sustain, 7.35);

          nextProfile.attack = Math.min(nextProfile.attack, 6.85);

          nextProfile.brightness = Math.min(nextProfile.brightness, 6.2);
        }

        if (depthNumber >= 8) {
          nextProfile.warmth = Math.max(nextProfile.warmth, 9.25);

          nextProfile.sustain = Math.max(nextProfile.sustain, 8.55);

          nextProfile.projection = Math.max(nextProfile.projection, 8.05);
        }
      }

      if (meta.isBlackened) {
        nextProfile.control = Math.max(nextProfile.control, 7.85);

        nextProfile.brightness = Math.min(nextProfile.brightness, 4.35);

        nextProfile.sensitivity = Math.min(nextProfile.sensitivity, 4.95);

        if (!meta.isVeryDeep) {
          nextProfile.sustain = Math.min(nextProfile.sustain, 6.85);
        }
      }

      if (meta.isLightTorch) {
        nextProfile.sensitivity = Math.max(nextProfile.sensitivity, 6.35);

        nextProfile.sustain = Math.max(nextProfile.sustain, 6.05);
      }

      return nextProfile;
    })();

    return (
      <div className="heritage-legacyprint-panel heritage-legacyprint-panel--relationships heritage-thread-reference heritage-thread-single-read heritage-VoiceMapping-read-experience">
        <div className="heritage-VoiceMapping-read-intro">
          <div className="heritage-VoiceMapping-read-intro-copy">
            <span className="heritage-VoiceMapping-read-kicker">
              {isFirstTell ? 'First Listen' : 'Player Analysis'}
            </span>

            {isFirstTell ? (
              <p>
                A quick first-impression read of the traits your ear is most
                likely to notice first. Use it as the starting point before
                feel, response, tuning, and final room behavior add more
                context.
              </p>
            ) : (
              <p>
                A fuller seven-node read of how this HERITAGE build behaves
                under the hands. Use it as shared listening language — Compare
                can anchor the read, but the final call still comes from the
                drum in the room.
              </p>
            )}
          </div>
        </div>

        <article
          key={`${activeBuildSignature}-${activeThread.id}-VoiceMapping-read`}
          className={`heritage-thread-single-read-panel heritage-VoiceMapping-read-panel heritage-VoiceMapping-read-panel--${activeThread.slotKey}`}
          style={getThreadColorVars(visualNodes)}
        >
          <div className="heritage-thread-single-read-visual heritage-VoiceMapping-read-visual">
            <div
              className={`heritage-VoiceMapping-relationship-graph-shell heritage-VoiceMapping-relationship-graph-shell--${VoiceMappingVariant}`}
              style={{
                '--first-tell-primary-color': firstTellPrimaryColor,
              }}
            >
              <VoiceThreadMap
                activeThread={visualThread}
                compact={false}
                strengthScore={activeThread.score}
                profile={voiceMapDisplayProfile}
                sourceBuildRead={activeVoiceSummary?.sourceBuildRead || ''}
                currentSpec={activeVoiceSummary?.currentSpec || {}}
                input={{
                  size,

                  depth,

                  lugs,

                  staveOption,

                  hoopType,

                  hardwareColor: HERITAGE_VOICE_READ_HARDWARE_COLOR,

                  scorchDepth,
                }}
                displayMode="VoiceMapping"
                readVariant={VoiceMappingVariant}
                firstTellKeys={firstTellKeys}
                dominantNodeKeys={dominantNodeKeys}
              />
            </div>
          </div>

          <div className="heritage-thread-single-read-content">
            <div className="heritage-thread-single-read-head">
              <div>
                <span className="heritage-summary-kicker heritage-summary-kicker--read-title">
                  {isFirstTell ? (
                    <>
                      First Listen{' '}
                      <em>Basic sound — what the ear catches first</em>
                    </>
                  ) : (
                    <>
                      Player Analysis{' '}
                      <em>Build voice + feel under the hands</em>
                    </>
                  )}
                </span>

                <h4>{resolvedDisplayTitle}</h4>
              </div>

              <div className="heritage-thread-read-icons heritage-thread-read-icons--bare">
                {renderThreadNodeIcons(visualNodes)}
              </div>
            </div>

            {!isFirstTell && (
              <p className="heritage-thread-single-read-lede">
                {readCopy.intro}
              </p>
            )}

            <p className="heritage-thread-single-read-lede heritage-thread-single-read-lede--summary">
              {isFirstTell ? firstTellSummary : activeThread.summary}
            </p>

            {activeThread.slotKey !== 'simple' && (
              <div className="heritage-thread-single-meta-grid">
                <span>
                  <strong>Read type</strong>

                  {readCopy.typeLabel}
                </span>

                <span>
                  <strong>Visual</strong>

                  {isFirstTell
                    ? 'First Listen triangle'
                    : 'Seven-node player analysis'}
                </span>

                <span>
                  <strong>Voice nodes</strong>

                  {visualNodeLabels}
                </span>
              </div>
            )}

            {isFirstTell &&
              renderFirstTellNodeList(
                visualNodes,

                firstListen?.nodeReads || []
              )}

            {null}
          </div>
        </article>
      </div>
    );
  };

  const visibleLegacyPrintTabs = useMemo(() => {
    return [...BASE_LEGACYPRINT_TABS, DISCOVERY_LEGACYPRINT_TAB];
  }, []);

  const renderLegacyPrintPanel = () => {
    if (legacyPrintTab === 'firstListen') {
      return renderVoiceMappingReadExperience('simple');
    }

    if (legacyPrintTab === 'playerAnalysis') {
      return renderVoiceMappingReadExperience('shaped');
    }

    if (legacyPrintTab === 'legacyTuning') {
      return (
        <div className="heritage-legacyprint-panel heritage-legacyprint-panel--legacy-tuning">
          <div className="heritage-chart-top-shell heritage-chart-top-shell--polished">
            <div className="heritage-chart-title-shell heritage-chart-title-shell--compact-legacytuning">
              <span className="heritage-chart-eyebrow">LegacyTuning™</span>

              <p className="heritage-chart-title-subcopy">
                This view estimates the shell’s natural resonance window — the
                lane where the drum wants to live before the final
                craftsman-read settles the voice.
              </p>
            </div>
          </div>

          {renderVoiceRangeCard()}
        </div>
      );
    }

    if (legacyPrintTab === 'legacyPrintRead') {
      return (
        <div className="heritage-legacyprint-panel heritage-legacyprint-panel--read">
          {renderLegacyPrintSummaryCard()}
        </div>
      );
    }

    if (legacyPrintTab === 'referenceSetup') {
      return (
        <div className="heritage-legacyprint-panel heritage-legacyprint-panel--reference-setup">
          <div className="heritage-chart-top-shell heritage-chart-top-shell--polished">
            <div className="heritage-chart-title-shell">
              <span className="heritage-chart-eyebrow">Reference Setup</span>

              <h4 className="heritage-chart-title">
                Choose your listening benchmark
              </h4>

              <p className="heritage-chart-title-subcopy">
                This reference drum becomes the anchor for Compare mode. The
                Voicing Engine will show how your current Heritage build moves
                against that selected benchmark.
              </p>
            </div>
          </div>

          {renderReferenceSelectorPanel()}
        </div>
      );
    }

    if (legacyPrintTab === 'discovery') {
      return (
        <div className="heritage-legacyprint-panel heritage-legacyprint-panel--locked">
          <div className="heritage-locked-workbench-card">
            <div className="heritage-locked-workbench-icon">
              <Lock size={24} />
            </div>

            <span className="heritage-summary-kicker">
              LegacyPrint™ Discovery Workbench{' '}
            </span>

            <h4>Go deeper than product selection.</h4>

            <p>
              Discovery Workbench maps player intent, genre, feel, touch,
              reference sounds, Voice Nodes, Voice Threading, and build
              priorities into a guided voicing direction.
            </p>

            <p>
              Available for SoundLegend artists and LegacyPartner accounts.
              SoundLegend artists also unlock deeper VoiceMapping, VoiceRange,
              Story Workbench, consultation history, and the living story behind
              the drum.
            </p>

            <button
              type="button"
              className="heritage-benchmark-reset-button"
              onClick={() => navigate('/artisan-shop/soundlegend')}
            >
              Explore SoundLegend
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="heritage-product-detail">
      <img
        src="/resized-logos/heritage-white.png"
        alt="HERITAGE Series"
        className="heritage-header-image"
      />

      <div className="heritage-hero-shell">
        <section className="heritage-intro-section">
          <div className="heritage-intro-grid">
            <div className="heritage-product-image-card">
              <div className="heritage-product-image">
                <img src={productImage} alt="HERITAGE Snare Drum" />
              </div>
            </div>

            <div className="heritage-overview-card">
              <div className="heritage-overview-scroll">
                <p className="heritage-story-lede">Rooted. Warm. Timeless.</p>

                <p className="heritage-story-copy">
                  HERITAGE carries the most grounded side of the Ober voice:
                  seasoned, tactile, and deeply organic.
                </p>

                <p className="heritage-story-copy">
                  Built around Northern Red Oak stave construction and shaped
                  with a classic bearing-edge profile, it is made for players
                  who want natural feel, warm body, and a drum that sounds
                  played-in from the first stroke.
                </p>

                <div className="heritage-overview-divider" />

                <h3 className="heritage-overview-subtitle">
                  Key Build Highlights
                </h3>

                <ul className="heritage-overview-list">
                  {heritageHighlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <p className="order-to-build-disclaimer">
                  *Each Ober Artisan drum is built to order. The instrument you
                  receive will closely reflect the design shown, but natural
                  wood grain, torching, and exact visual character will vary
                  based on your final configuration.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="heritage-workspace-section">
          <aside className="heritage-config-panel heritage-builder-card">
            <div className="heritage-builder-head">
              <span className="heritage-builder-kicker">Build your drum</span>

              <p>
                Builds start at $850. Shape your foundation, choose your finish,
                then refine your hardware.
              </p>
            </div>

            <div className="heritage-builder-sections">
              <div
                className={`heritage-builder-section ${
                  openBuilderSection === 'construction'
                    ? 'is-open'
                    : 'is-collapsed'
                }`}
              >
                <button
                  type="button"
                  className={`heritage-builder-section-toggle ${
                    openBuilderSection === 'construction' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'construction'
                        ? ''
                        : 'construction'
                    )
                  }
                >
                  <div className="heritage-builder-section-heading">
                    <span className="heritage-builder-section-step">1</span>

                    <div className="heritage-builder-section-heading-copy">
                      <h3>Shape Your Foundation</h3>

                      <p>{constructionSummary}</p>
                    </div>
                  </div>

                  <span
                    className="heritage-builder-section-chevron"
                    aria-hidden="true"
                  >
                    {openBuilderSection === 'construction' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'construction' && (
                  <div className="heritage-builder-section-body">
                    <div className="heritage-builder-field-intro">
                      <label>Snare Size</label>

                      <strong>{BUILDER_GUIDANCE.diameter.question}</strong>

                      <p>{BUILDER_GUIDANCE.diameter.helper}</p>
                    </div>

                    <div className="heritage-option-grid heritage-option-grid-compact heritage-option-grid--size">
                      {Object.keys(basePrices).map((sizeOption) => {
                        const isSelected = size === sizeOption;

                        const deltaMeta = getOptionDeltaMeta({
                          size: sizeOption,
                        });

                        return (
                          <button
                            key={sizeOption}
                            type="button"
                            className={`heritage-option-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleSizeSelect(sizeOption)}
                          >
                            <span className="heritage-option-title">
                              {sizeOption}"
                            </span>

                            <span className="heritage-option-guide-title">
                              {SIZE_GUIDE_COPY[sizeOption]?.title}
                            </span>

                            <span className="heritage-option-guide-copy">
                              {SIZE_GUIDE_COPY[sizeOption]?.body}
                            </span>

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`heritage-option-meta ${
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

                    <div className="heritage-builder-field-intro">
                      <label>Depth</label>

                      <strong>{BUILDER_GUIDANCE.depth.question}</strong>

                      <p>{BUILDER_GUIDANCE.depth.helper}</p>
                    </div>

                    <div className="heritage-option-grid heritage-option-grid-compact heritage-option-grid--depth">
                      {Object.keys(depthPrices[size]).map((depthOption) => {
                        const isSelected = depth === depthOption;

                        const deltaMeta = getOptionDeltaMeta({
                          depth: depthOption,
                        });

                        return (
                          <button
                            key={depthOption}
                            type="button"
                            className={`heritage-option-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleDepthSelect(depthOption)}
                          >
                            <span className="heritage-option-title">
                              {depthOption}"
                            </span>

                            {renderOptionGuideCopy(
                              DEPTH_GUIDE_COPY[depthOption]
                            )}

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`heritage-option-meta ${
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

                    <div className="heritage-builder-field-intro">
                      <label>Shell Thickness</label>

                      <strong>
                        {BUILDER_GUIDANCE.shellThickness.question}
                      </strong>

                      <p>{BUILDER_GUIDANCE.shellThickness.helper}</p>
                    </div>

                    <div className="heritage-option-grid">
                      {getAvailableStaveOptions(size).map((option) => {
                        const isSelected = staveOption === option;

                        const deltaMeta = getOptionDeltaMeta({
                          staveOption: option,
                        });

                        const requiresReRings =
                          hasReRingFromStaveOption(option);

                        const thicknessLabel = getStaveThicknessLabel(option);

                        return (
                          <button
                            key={option}
                            type="button"
                            className={`heritage-option-tile heritage-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleStaveSelect(option)}
                          >
                            <span className="heritage-option-title">
                              {thicknessLabel}
                            </span>

                            <span className="heritage-option-subtitle">
                              {getStaveCountLabel(option)}

                              {requiresReRings ? ' • Re-Rings required' : ''}
                            </span>

                            {renderOptionGuideCopy(
                              SHELL_THICKNESS_GUIDE_COPY[thicknessLabel]
                            )}

                            {(isSelected ||
                              deltaMeta.text ||
                              requiresReRings) && (
                              <span
                                className={`heritage-option-meta ${
                                  isSelected
                                    ? 'is-selected'
                                    : deltaMeta.className || 'is-positive'
                                }`}
                              >
                                {isSelected
                                  ? requiresReRings
                                    ? 'Selected • +$150'
                                    : 'Selected'
                                  : requiresReRings
                                    ? '+$150'
                                    : deltaMeta.text}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="heritage-builder-field-intro">
                      <label>Lug Quantity</label>

                      <strong>{BUILDER_GUIDANCE.lugQuantity.question}</strong>

                      <p>{BUILDER_GUIDANCE.lugQuantity.helper}</p>
                    </div>

                    <div className="heritage-option-grid heritage-option-grid-compact">
                      {lugOptions[size].map((lugOption) => {
                        const isSelected = lugs === lugOption;

                        const isAvailable = isLugAvailableForShellRecipe({
                          selectedSize: size,

                          selectedStaveOption: staveOption,

                          lugOption,
                        });

                        const matchingShellForThisLug =
                          getAvailableStaveOptions(size).find((option) =>
                            getAvailableLugsForShellRecipe(
                              size,

                              option
                            ).includes(String(lugOption))
                          );

                        const matchingShellLabel = matchingShellForThisLug
                          ? `${getStaveThicknessLabel(matchingShellForThisLug)} / ${getStaveCountLabel(
                              matchingShellForThisLug
                            )}`
                          : '';

                        return (
                          <button
                            key={lugOption}
                            type="button"
                            className={`heritage-option-tile heritage-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            } ${!isAvailable ? 'is-disabled' : ''}`}
                            onClick={() => {
                              if (!isAvailable) {
                                setLugHelperPulseKey((prev) => prev + 1);

                                return;
                              }

                              handleLugSelect(lugOption);
                            }}
                          >
                            <span className="heritage-option-title">
                              {lugOption} Lugs
                            </span>

                            {!isAvailable && matchingShellLabel && (
                              <span className="heritage-option-subtitle">
                                Available with {matchingShellLabel}
                              </span>
                            )}

                            {isAvailable &&
                              renderOptionGuideCopy(LUG_GUIDE_COPY[lugOption])}

                            {isSelected && (
                              <span className="heritage-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p
                      key={lugHelperPulseKey}
                      className={`heritage-shell-lug-helper ${
                        lugHelperPulseKey > 0 ? 'is-pulsing' : ''
                      }`}
                    >
                      Lug count is matched to the selected shell recipe for even
                      head tension, stable tuning, and proper stave-shell
                      response.
                      <span className="heritage-shell-lug-info-wrap">
                        <button
                          type="button"
                          className="heritage-shell-lug-info-button"
                          aria-label="Why lug count is matched to shell recipe"
                          onClick={(event) => {
                            event.stopPropagation();

                            event.currentTarget.blur();
                          }}
                        >
                          ?
                        </button>

                        <span
                          className="heritage-shell-lug-tooltip"
                          role="tooltip"
                        >
                          Thinner or lower-stave shells flex and breathe
                          differently than thicker, higher-stave shells.
                          Matching the lug count to the shell recipe helps the
                          head pull evenly around the drum, keeps tension
                          balanced across the stave joints, and protects the
                          intended Heritage voice.
                        </span>
                      </span>
                    </p>

                    <div className="heritage-builder-note-card heritage-builder-note-card--foundation">
                      <span>Heritage-standard edge profile</span>

                      <p>
                        Heritage comes with a fixed 45° inner bearing edge and a
                        softened outer roundover to keep the line grounded,
                        consistent, and unmistakably classic.
                      </p>

                      <p>
                        Standard snare beds are included as part of the Heritage
                        voice, giving each build a familiar response while
                        preserving the shell-first character of the drum.
                      </p>
                    </div>

                    <div className="heritage-builder-next-row">
                      <button
                        type="button"
                        className="heritage-builder-next-link"
                        onClick={() => setOpenBuilderSection('finish')}
                      >
                        <span className="heritage-builder-next-link-label">
                          Continue to Finish
                        </span>

                        <span
                          className="heritage-builder-next-link-arrow"
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
                className={`heritage-builder-section ${
                  openBuilderSection === 'finish' ? 'is-open' : 'is-collapsed'
                }`}
              >
                <button
                  type="button"
                  className={`heritage-builder-section-toggle ${
                    openBuilderSection === 'finish' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'finish' ? '' : 'finish'
                    )
                  }
                >
                  <div className="heritage-builder-section-heading">
                    <span className="heritage-builder-section-step">2</span>

                    <div className="heritage-builder-section-heading-copy">
                      <h3>Choose Your Finish</h3>

                      <p>{finishSummary}</p>
                    </div>
                  </div>

                  <span
                    className="heritage-builder-section-chevron"
                    aria-hidden="true"
                  >
                    {openBuilderSection === 'finish' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'finish' && (
                  <div className="heritage-builder-section-body">
                    <div className="heritage-builder-field-intro">
                      <label>{BUILDER_GUIDANCE.finish.label}</label>

                      <strong>{BUILDER_GUIDANCE.finish.question}</strong>

                      <p>{BUILDER_GUIDANCE.finish.helper}</p>
                    </div>

                    <div className="heritage-finish-swatch-grid">
                      {scorchOptions.map((option) => {
                        const isSelected = scorchDepth === option;

                        const swatchSrc = HERITAGE_FINISH_SWATCHES[option];

                        return (
                          <button
                            key={option}
                            type="button"
                            className={`heritage-finish-swatch-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => {
                              setScorchDepth(option);
                            }}
                          >
                            <span className="heritage-finish-swatch-image-wrap">
                              <img
                                src={swatchSrc}
                                alt={`${option} Heritage finish swatch`}
                                className="heritage-finish-swatch-image"
                              />
                            </span>

                            <span className="heritage-finish-swatch-label">
                              {option}
                            </span>

                            {renderOptionGuideCopy(FINISH_GUIDE_COPY[option])}

                            {isSelected && (
                              <span className="heritage-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="heritage-builder-note-card heritage-builder-note-card--torchtune">
                      <span>Ober TorchTune™ process</span>

                      <p>
                        Heritage finishes are not just cosmetic. Each shell is
                        finished through Ober’s controlled TorchTune™ process,
                        where scorch depth, wood grain, absorption, and shell
                        behavior are handled by eye, ear, and feel.
                      </p>

                      <button
                        type="button"
                        className="heritage-builder-inline-link"
                        onClick={() => navigate('/our-craft')}
                      >
                        Learn more about TorchTune™
                      </button>
                    </div>

                    <p className="heritage-swatch-disclaimer heritage-swatch-disclaimer--subtle">
                      Swatches are visual references only. Final finish
                      character will vary with wood grain, natural absorption,
                      torch response, and the unique behavior of each shell.
                    </p>

                    <div className="heritage-builder-next-row">
                      <button
                        type="button"
                        className="heritage-builder-next-link"
                        onClick={() => setOpenBuilderSection('hardware')}
                      >
                        <span className="heritage-builder-next-link-label">
                          Continue to Hardware
                        </span>

                        <span
                          className="heritage-builder-next-link-arrow"
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
                className={`heritage-builder-section ${
                  openBuilderSection === 'hardware' ? 'is-open' : 'is-collapsed'
                }`}
              >
                <button
                  type="button"
                  className={`heritage-builder-section-toggle ${
                    openBuilderSection === 'hardware' ? 'is-open' : ''
                  }`}
                  onClick={() =>
                    setOpenBuilderSection(
                      openBuilderSection === 'hardware' ? '' : 'hardware'
                    )
                  }
                >
                  <div className="heritage-builder-section-heading">
                    <span className="heritage-builder-section-step">3</span>

                    <div className="heritage-builder-section-heading-copy">
                      <h3>Refine Your Hardware</h3>

                      <p>{hardwareSummary}</p>
                    </div>
                  </div>

                  <span
                    className="heritage-builder-section-chevron"
                    aria-hidden="true"
                  >
                    {openBuilderSection === 'hardware' ? '−' : '+'}
                  </span>
                </button>

                {openBuilderSection === 'hardware' && (
                  <div className="heritage-builder-section-body">
                    <div className="heritage-builder-field-intro">
                      <label>{BUILDER_GUIDANCE.hoopType.label}</label>

                      <strong>{BUILDER_GUIDANCE.hoopType.question}</strong>

                      <p>{BUILDER_GUIDANCE.hoopType.helper}</p>
                    </div>

                    <div className="heritage-option-grid heritage-option-grid--hoop-type">
                      {hoopOptions.map((option) => {
                        const isSelected = hoopType === option.value;

                        const deltaMeta = getOptionDeltaMeta({
                          hoopType: option.value,
                        });

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`heritage-option-tile heritage-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => {
                              setHoopType(option.value);
                            }}
                          >
                            <span className="heritage-option-title">
                              {option.label}
                            </span>

                            {renderOptionGuideCopy(
                              HOOP_GUIDE_COPY[option.value]
                            )}

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`heritage-option-meta ${
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

                    <div className="heritage-builder-field-intro">
                      <label>{BUILDER_GUIDANCE.hardwareFinish.label}</label>

                      <strong>
                        {BUILDER_GUIDANCE.hardwareFinish.question}
                      </strong>

                      <p>{BUILDER_GUIDANCE.hardwareFinish.helper}</p>
                    </div>

                    <div className="heritage-option-grid heritage-option-grid--hardware-finish">
                      {hardwareOptions.map((option) => {
                        const isSelected = hardwareColor === option.value;

                        const deltaMeta = getOptionDeltaMeta({
                          hardwareColor: option.value,
                        });

                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`heritage-option-tile heritage-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => {
                              setHardwareColor(option.value);
                            }}
                          >
                            <span className="heritage-option-title">
                              {option.label}
                            </span>

                            {renderOptionGuideCopy(
                              HARDWARE_GUIDE_COPY[option.value]
                            )}

                            {(isSelected || deltaMeta.text) && (
                              <span
                                className={`heritage-option-meta ${
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

                    <div className="heritage-builder-note-card heritage-builder-note-card--hardware">
                      <span>Stock Heritage hardware package</span>

                      <p>
                        Every Heritage build comes stock with the Trick GS007
                        throw-off, Remo Ambassador Coated batter head, Remo
                        Ambassador Hazy Snare Side, and PureSound Custom Pro
                        Steel 20-Strand wires.
                      </p>

                      <p>
                        Hoop choice shapes response first. Hardware finish
                        shapes the visual voice last.
                      </p>
                    </div>

                    <div className="heritage-builder-next-row heritage-builder-next-row--review">
                      <button
                        type="button"
                        className="heritage-builder-next-link heritage-builder-next-link--review"
                        onClick={handleReviewBuild}
                      >
                        <span className="heritage-builder-next-link-label">
                          Review Your Build
                        </span>

                        <span
                          className="heritage-builder-next-link-arrow"
                          aria-hidden="true"
                        >
                          ↓
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="heritage-builder-reset-row">
              <button
                type="button"
                className="heritage-builder-reset-button"
                onClick={() => setShowResetModal(true)}
              >
                Start Over
              </button>
            </div>

            <div className="heritage-config-breakdown-shell">
              <div className="heritage-config-breakdown-header">
                <span className="heritage-config-breakdown-kicker">
                  Current Configuration
                </span>
              </div>

              <div className="heritage-config-selection-list">
                <div className="heritage-config-selection-row">
                  <span className="heritage-config-selection-label">
                    Foundation
                  </span>

                  <span className="heritage-config-selection-value">
                    {size}" × {depth}" • {getStaveThicknessLabel(staveOption)} •{' '}
                    {getStaveCountLabel(staveOption)} • {lugs} lugs
                  </span>
                </div>

                <div className="heritage-config-selection-row">
                  <span className="heritage-config-selection-label">
                    Finish
                  </span>

                  <span className="heritage-config-selection-value">
                    {scorchDepth}
                  </span>
                </div>

                <div className="heritage-config-selection-row">
                  <span className="heritage-config-selection-label">
                    Hardware
                  </span>

                  <span className="heritage-config-selection-value">
                    {hardwareColor} • {hoopType}
                  </span>
                </div>

                <div className="heritage-config-selection-row">
                  <span className="heritage-config-selection-label">
                    Bearing Edge
                  </span>

                  <span className="heritage-config-selection-value">
                    {HERITAGE_STANDARD_BEARING_EDGE}
                  </span>
                </div>

                <div className="heritage-config-selection-row">
                  <span className="heritage-config-selection-label">
                    Snare Bed
                  </span>

                  <span className="heritage-config-selection-value">
                    {HERITAGE_STANDARD_SNARE_BED}
                  </span>
                </div>

                <div className="heritage-config-selection-row">
                  <span className="heritage-config-selection-label">
                    Heads / Wires
                  </span>

                  <span className="heritage-config-selection-value">
                    {HERITAGE_STANDARD_REFERENCE.batterHead} •{' '}
                    {HERITAGE_STANDARD_REFERENCE.resonantHead} •{' '}
                    {HERITAGE_STANDARD_REFERENCE.snareWires}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={`heritage-config-breakdown-toggle heritage-config-breakdown-toggle--minimal ${
                  showConfigBreakdown ? 'is-open' : ''
                }`}
                onClick={() => setShowConfigBreakdown((prev) => !prev)}
              >
                <span className="heritage-config-breakdown-toggle-text">
                  {showConfigBreakdown
                    ? 'Hide pricing detail'
                    : 'View pricing detail'}
                </span>

                <span className="heritage-config-breakdown-toggle-state">
                  {showConfigBreakdown ? '−' : '+'}
                </span>
              </button>

              {showConfigBreakdown && (
                <div className="heritage-config-breakdown-panel heritage-config-breakdown-panel--minimal">
                  <div className="heritage-config-breakdown-lines">
                    <div className="heritage-config-breakdown-line">
                      <span>Base shell</span>

                      <strong>{formatCurrency(basePrices[size] || 0)}</strong>
                    </div>

                    {(depthPrices[size]?.[normalizeDepthKey(depth)] || 0) >
                      0 && (
                      <div className="heritage-config-breakdown-line">
                        <span>Depth: {depth}"</span>

                        <strong>{`(+${depthPrices[size][normalizeDepthKey(depth)]})`}</strong>
                      </div>
                    )}

                    {hardwareUpchargeMap[hardwareColor] > 0 && (
                      <div className="heritage-config-breakdown-line">
                        <span>Hardware: {hardwareColor}</span>

                        <strong>{`(+${hardwareUpchargeMap[hardwareColor]})`}</strong>
                      </div>
                    )}

                    {hoopUpchargeMap[hoopType] > 0 && (
                      <div className="heritage-config-breakdown-line">
                        <span>Hoops: {hoopType}</span>

                        <strong>{`(+${hoopUpchargeMap[hoopType]})`}</strong>
                      </div>
                    )}

                    {hasReRingFromStaveOption(staveOption) && (
                      <div className="heritage-config-breakdown-line">
                        <span>Re-rings</span>

                        <strong>{`(+${reRingCost})`}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="heritage-detail-price">
              {formatCurrency(totalPrice)}
            </p>

            <p className="delivery-time">Estimated delivery: 6–8 weeks</p>

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

          <section
            className={`heritage-voice-panel heritage-voice-read-card heritage-voice-read-card--reworked ${
              isCompareModeEnabled ? 'is-compare-mode' : 'is-standalone-mode'
            }`}
          >
            <div className="heritage-voice-read-header heritage-voice-read-header--polished heritage-voice-read-header--with-compare">
              <div className="heritage-voice-read-header-copy">
                <div className="heritage-voice-read-header-topline">
                  <span className="heritage-summary-kicker heritage-summary-kicker--legacyprint-engine">
                    <img
                      src="/legacyprint-benchmarks/ober-legacyprint-7-node-neon-all-connections-transparent.png"
                      alt=""
                      className="heritage-legacyprint-engine-icon"
                      aria-hidden="true"
                    />
                    LegacyPrint™ Voicing Engine
                  </span>

                  <div className="heritage-compare-header-cluster">
                    <button
                      type="button"
                      className={`heritage-compare-toggle heritage-compare-toggle--header ${
                        isCompareModeEnabled ? 'is-active' : ''
                      }`}
                      onClick={
                        isCompareModeEnabled
                          ? handleDisableCompareMode
                          : handleRequestCompareMode
                      }
                    >
                      {isCompareModeEnabled ? 'Compare On' : 'Enable Compare'}
                    </button>

                    {isCompareModeEnabled && (
                      <button
                        type="button"
                        className="heritage-compare-reference-chip"
                        onClick={() => setLegacyPrintTab('referenceSetup')}
                      >
                        <span>Reference</span>

                        <strong>
                          {selectedBenchmarkType?.typeLabel || 'Reference Drum'}

                          {selectedBenchmarkSize?.label
                            ? ` • ${selectedBenchmarkSize.label}`
                            : ''}
                        </strong>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="heritage-legacyprint-nav-row">
              <div
                className="heritage-legacyprint-tabs"
                role="tablist"
                aria-label="LegacyPrint Voicing Engine sections"
              >
                {visibleLegacyPrintTabs.map((tab) => {
                  const isActive = legacyPrintTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`heritage-legacyprint-tab ${
                        isActive ? 'is-active' : ''
                      } ${tab.locked ? 'is-locked' : ''}`}
                      onClick={() => setLegacyPrintTab(tab.key)}
                    >
                      <span>{tab.label}</span>

                      {tab.locked && <Lock size={13} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="heritage-voice-read-flow">
              {renderLegacyPrintPanel()}
            </div>
          </section>
        </section>
      </div>

      {showCompareIntro && (
        <div
          className="heritage-reset-modal-backdrop"
          onClick={() => setShowCompareIntro(false)}
        >
          <div
            className="heritage-compare-intro-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="heritage-reset-modal-header">
              <span className="heritage-reset-modal-kicker">
                Benchmark Compare
              </span>

              <button
                type="button"
                className="heritage-reset-modal-close"
                onClick={() => setShowCompareIntro(false)}
                aria-label="Close compare explanation"
              >
                ×
              </button>
            </div>

            <h4>Use a reference drum as your listening anchor.</h4>

            <p>
              Compare mode is optional. It lets you choose a drum you already
              know, then shows how this Heritage build shifts against that
              reference.
            </p>

            <p>
              When Compare is enabled, the charts and tone summary become
              benchmark-relative. When Compare is off, the Voicing Engine
              describes the current Ober build on its own.
            </p>

            <div className="heritage-reset-modal-actions">
              <button
                type="button"
                className="heritage-reset-modal-cancel"
                onClick={() => setShowCompareIntro(false)}
              >
                Maybe Later
              </button>

              <button
                type="button"
                className="heritage-reset-modal-confirm"
                onClick={handleEnableCompareMode}
              >
                Enable Compare
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div
          className="heritage-reset-modal-backdrop"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="heritage-reset-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="heritage-reset-modal-header">
              <span className="heritage-reset-modal-kicker">Start Over</span>

              <button
                type="button"
                className="heritage-reset-modal-close"
                onClick={() => setShowResetModal(false)}
                aria-label="Close start over dialog"
              >
                ×
              </button>
            </div>

            <p className="heritage-reset-modal-text">
              Are you sure? This will clear your current build configuration and
              return the builder to its default starting point.
            </p>

            <div className="heritage-reset-modal-actions">
              <button
                type="button"
                className="heritage-reset-modal-cancel"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="heritage-reset-modal-confirm"
                onClick={confirmStartOverBuild}
              >
                Yes, Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeritageProductDetail;
