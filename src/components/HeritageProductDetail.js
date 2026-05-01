import React, { useState, useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';

import VoiceThreadMap from './VoiceThreadMap';

import buildHeritageMusicalIdentityTitle from '../utils/legacyPrint/buildHeritageMusicalIdentityTitle';

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

import heritageSummaries from '../data/heritageSummaries';

import LEGACYPRINT_BENCHMARK_CATALOG from '../data/legacyPrint/benchmarkCatalog';

import { useCart } from '../context/CartContext';

import SpiderChart from './SpiderChart';

import buildHeritageVoiceRead from '../utils/legacyPrint/buildHeritageVoiceRead';

import buildVoiceThreadReadout from '../utils/legacyPrint/buildVoiceThreadReadout';

import { buildKeyRelationships } from '../utils/legacyPrint/heritageKeyRelationships';

import {
  runHeritageVoiceReadTestMatrix,
  runOneHeritageVoiceReadTest,
} from '../utils/legacyPrint/runHeritageVoiceReadTestMatrix';

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

const AXIS_POINT_COLORS = [
  '#ff7448',
  '#e7d98f',
  '#ffb53a',
  '#4d86ff',
  '#c1682e',
  '#68d9df',
  '#9e8bff',
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
    key: 'voiceRead',
    label: 'VoiceMap™',
  },
  {
    key: 'relationships',
    label: 'Voice Threads',
  },
  {
    key: 'legacyTuning',
    label: 'LegacyTuning™',
  },
  {
    key: 'legacyPrintRead',
    label: 'LegacyPrint™ Read',
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

    if (clamped <= 2) {
      return 80 + ((clamped - 1) / 1) * (180 - 80);
    }

    if (clamped <= 3) {
      return 180 + ((clamped - 2) / 1) * (350 - 180);
    }

    if (clamped <= 4) {
      return 350 + ((clamped - 3) / 1) * (1200 - 350);
    }

    return 1200 + ((clamped - 4) / 1) * (4000 - 1200);
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

const getReferenceLabel = (selectedBenchmarkType, selectedBenchmarkSize) => {
  const typeLabel =
    selectedBenchmarkType?.typeLabel || 'Heritage reference drum';

  const sizeLabel = selectedBenchmarkSize?.label
    ? ` (${selectedBenchmarkSize.label})`
    : '';

  return `${typeLabel}${sizeLabel}`;
};

const buildProjectedVoiceRange = (summary) => {
  const profile = summary?.profile || {};

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
  const profile = summary?.profile || {};

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
    short: 'How quickly the note speaks at the front edge.',
    detail:
      'Attack is the first thing the stick gives back to the player. In this Heritage build, it describes how immediate, rounded, crisp, or assertive the drum feels at the start of the note.',
    scaleLow:
      'A lower attack read means the note starts rounder and softer. The drum feels less sharp at the front edge and more relaxed under the stick.',
    scaleHigh:
      'A higher attack read means the note starts quicker and more defined. The drum feels more immediate, articulate, and assertive on the first strike.',
  },
  sustain: {
    short: 'How long the note blooms after the strike.',
    detail:
      'Sustain describes how much the shell wants to hold onto the note after impact. It is the length, openness, and bloom that follow the first hit.',
    scaleLow:
      'A lower sustain read means the note exits sooner. The drum feels tighter, shorter, and more contained.',
    scaleHigh:
      'A higher sustain read means the note hangs longer. The shell feels more open and willing to bloom after the strike.',
  },
  warmth: {
    short: 'How much body and low-mid weight sit in the voice.',
    detail:
      'Warmth is the center of the drum — the woodiness, body, and low-mid richness that make the shell feel grounded instead of sharp or glassy.',
    scaleLow:
      'A lower warmth read means a leaner center with less low-mid body. The drum feels cleaner, tighter, or more direct.',
    scaleHigh:
      'A higher warmth read means more body in the center of the note. The shell feels fuller, deeper, and more grounded.',
  },
  projection: {
    short: 'How confidently the drum pushes into the room.',
    detail:
      'Projection describes how strongly the drum carries outward. It is not just volume — it is the way the note moves through a room or mix.',
    scaleLow:
      'A lower projection read means the drum feels more intimate and closer to the player.',
    scaleHigh:
      'A higher projection read means stronger room presence and more outward push. The note carries farther and feels more commanding.',
  },
  brightness: {
    short: 'How much upper-register clarity sits on top.',
    detail:
      'Brightness is the top edge of the sound: snap, sheen, cut, and upper-register clarity. It affects how easily the drum speaks through a mix.',
    scaleLow:
      'A lower brightness read means a darker top end with less sheen. The drum feels woodier and more restrained.',
    scaleHigh:
      'A higher brightness read means more top-end edge, snap, and cut. The drum feels clearer and more articulate.',
  },
  sensitivity: {
    short: 'How easily the drum responds to lighter touch.',
    detail:
      'Sensitivity describes how much the shell and snare response open up under lighter hands, ghost notes, soft playing, and dynamic nuance.',
    scaleLow:
      'A lower sensitivity read means the drum wants a little more input before it fully wakes up.',
    scaleHigh:
      'A higher sensitivity read means the drum opens more easily at lower dynamics and reveals more detail under softer touch.',
  },
  control: {
    short: 'How shaped and manageable the note feels.',
    detail:
      'Control describes how organized the note feels through overtone behavior, decay, and focus. It is the difference between open spread and composed shape.',
    scaleLow:
      'A lower control read means the drum feels more open, wider, and less contained.',
    scaleHigh:
      'A higher control read means the note feels tighter, more organized, and easier to place.',
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
  staveOption: '16 - 10mm',
  staveQuantity: 16,
  shellThickness: '10mm',
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
  12: {
    6: ['12 - 8mm + $150 (Re-Rings Required)'],
    8: ['16 - 10mm'],
  },
  13: { 8: ['16 - 10mm'] },
  14: {
    8: ['16 - 10mm'],
    10: ['20 - 12mm', '10 - 7mm + $150 (Re-Rings Required)'],
  },
};

const lugOptions = {
  12: ['8', '6'],
  13: ['8'],
  14: ['8', '10'],
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

const hasReRingFromStaveOption = (option = '') =>
  String(option).includes('Re-Rings') || String(option).includes('+ $150');

const getStaveCountLabel = (option = '') => {
  const match = String(option).match(/^(\d+)/);

  return match ? `${match[1]} staves` : option;
};

const getStaveThicknessLabel = (option = '') => {
  const cleaned = String(option).replace(' + $150 (Re-Rings Required)', '');

  const parts = cleaned.split(' - ');

  return parts[1] || '';
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

const HeritageProductDetail = () => {
  const navigate = useNavigate();

  const { addToCart, removeFromCart, cart } = useCart();

  const [size, setSize] = useState('12');

  const [depth, setDepth] = useState('5.0');

  const [lugs, setLugs] = useState('8');

  const [staveOption, setStaveOption] = useState('16 - 10mm');

  const [hardwareColor, setHardwareColor] = useState('Chrome');

  const [hoopType, setHoopType] = useState('Triple Flange');

  const [scorchDepth, setScorchDepth] = useState('Medium Torch');

  const [totalPrice, setTotalPrice] = useState(850);

  const [isLoading, setIsLoading] = useState(true);

  const [product, setProduct] = useState(null);

  const [buttonText, setButtonText] = useState('Add to Cart');

  const [cartItemId, setCartItemId] = useState(null);

  const [legacyPrintTab, setLegacyPrintTab] = useState('voiceRead');

  const [isCompareModeEnabled, setIsCompareModeEnabled] = useState(false);

  const [showCompareIntro, setShowCompareIntro] = useState(false);

  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});

  const [openBuilderSection, setOpenBuilderSection] = useState('construction');

  const [activeAxisKey, setActiveAxisKey] = useState('attack');

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
          '/legacyprint-benchmarks/ply/ply-mohogany.png',
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

  const hardwareSummary = `${hardwareColor} • ${hoopType} • ${HERITAGE_STANDARD_SNARE_BED} bed`;

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
      hardwareColor,
      hoopType,
      scorchDepth,
      benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,
      benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,
      benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,
    });
  }, [size, depth, lugs, staveOption, hardwareColor, hoopType, scorchDepth]);

  const activeVoiceSummary = useMemo(() => {
    return isCompareModeEnabled
      ? selectedDrumSummary
      : currentBuildVoiceRangeSummary;
  }, [
    isCompareModeEnabled,
    selectedDrumSummary,
    currentBuildVoiceRangeSummary,
  ]);

  const activeBuildSignature = useMemo(() => {
    return [
      size,
      depth,
      lugs,
      staveOption,
      hoopType,
      hardwareColor,
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
    hardwareColor,
    scorchDepth,
    isCompareModeEnabled,
    benchmarkFamilyId,
    benchmarkTypeId,
    benchmarkSizeId,
  ]);

  const chartValues = useMemo(() => {
    return AXIS_META.map(({ key }) => {
      const rawValue =
        activeVoiceSummary?.profile?.[key] != null
          ? Number(activeVoiceSummary.profile[key])
          : 5;

      return getDisplayMetricValue(rawValue);
    });
  }, [activeVoiceSummary]);

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

  const projectedVoiceRangePosition = useMemo(() => {
    return buildProjectedVoiceRange(currentBuildVoiceRangeSummary);
  }, [currentBuildVoiceRangeSummary]);

  const legacyTuningRange = useMemo(() => {
    return getLegacyTuningRangeBounds(projectedVoiceRangePosition);
  }, [projectedVoiceRangePosition]);

  const legacyTuningHzRange = useMemo(() => {
    return getLegacyTuningHzRange(legacyTuningRange);
  }, [legacyTuningRange]);

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
    activeVoiceSummary?.profile?.[activeAxisKey] != null
      ? Number(activeVoiceSummary.profile[activeAxisKey])
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
    const relationships = buildKeyRelationships(activeVoiceSummary);

    const threadSlotOrder = {
      simple: 0,
      shaped: 1,
      complex: 2,
    };

    return relationships.slice(0, 3).sort((a, b) => {
      const aOrder = threadSlotOrder[a.slotKey] ?? 99;

      const bOrder = threadSlotOrder[b.slotKey] ?? 99;

      if (aOrder !== bOrder) return aOrder - bOrder;

      return Number(b.score || 0) - Number(a.score || 0);
    });
  }, [activeVoiceSummary]);

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
      profile: activeVoiceSummary?.profile || {},
      sourceBuildRead: activeVoiceSummary?.sourceBuildRead || '',
    });
  }, [activeThread, activeVoiceSummary]);

  const musicalIdentityTitle = useMemo(() => {

  return buildHeritageMusicalIdentityTitle({

    size,

    depth,

    lugs,

    staveOption,

    hoopType,

    hardwareColor,

    scorchDepth,

    currentSpec: activeVoiceSummary?.currentSpec || {},

  });

}, [

  size,

  depth,

  lugs,

  staveOption,

  hoopType,

  hardwareColor,

  scorchDepth,

  activeVoiceSummary,

]);

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
      setLegacyPrintTab('voiceRead');
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
    if (process.env.NODE_ENV !== 'development') return;

    window.runHeritageVoiceReadTestMatrix = runHeritageVoiceReadTestMatrix;

    window.runOneHeritageVoiceReadTest = runOneHeritageVoiceReadTest;

    console.info(
      'LegacyPrint test helpers ready: runHeritageVoiceReadTestMatrix(), runOneHeritageVoiceReadTest({...})'
    );
  }, []);

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
        hardwareColor,
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
    hardwareColor,
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

      setStaveOption('16 - 10mm');

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

    setStaveOption('16 - 10mm');

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

    const matchedPricingOption = heritageSummaries.pricingOptions.find(
      (option) =>
        option.size === size &&
        option.depth === depth &&
        option.reRing === hasReRing
    );

    if (!matchedPricingOption) {
      console.error('❌ No matching pricing option found.');

      toast.error('Could not match this configuration.');

      return;
    }

    const newCartItemId = generateCartItemId({
      stripePriceId: matchedPricingOption.stripePriceId,
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

    const nextLugs = lugOptions[newSize][0];

    const nextStaves = staveOptions[newSize]?.[nextLugs] || [];

    const nextStaveOption =
      nextStaves.find((item) => !item.includes('Re-Rings')) ||
      nextStaves[0] ||
      '';

    setSize(newSize);

    setDepth(nextDepth);

    setLugs(nextLugs);

    setStaveOption(nextStaveOption);
  };

  const handleDepthSelect = (newDepth) => {
    setDepth(newDepth);
  };

  const handleLugSelect = (newLug) => {
    if (newLug === lugs) return;

    const nextStaves = staveOptions[size]?.[newLug] || [];

    const nextStaveOption =
      nextStaves.find((item) => !item.includes('Re-Rings')) ||
      nextStaves[0] ||
      '';

    setLugs(newLug);

    setStaveOption(nextStaveOption);
  };

  const handleStaveSelect = (option) => {
    setStaveOption(option);
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
    const topRelationship = keyRelationships[0];

    return (
      <div className="heritage-legacyprint-summary-card">
        <div className="heritage-legacyprint-summary-head">
          <span className="heritage-summary-kicker heritage-summary-kicker--voiceprint">
            <img
              src="/legacyprint-benchmarks/legacyprint-icon.png"
              alt=""
              className="heritage-summary-kicker-icon"
              aria-hidden="true"
            />
            LegacyPrint™ Summary
          </span>

          <h4>Current build analysis</h4>

          <p>
            A plain-language read of this Heritage configuration across
            VoiceMap™, LegacyTuning™, and Voice Threads.
          </p>
        </div>

        <div className="heritage-legacyprint-summary-grid">
          <article className="heritage-legacyprint-summary-section">
            <span>VoiceMap™ Read</span>

            <p>{toneSummaryText}</p>
          </article>

          <article className="heritage-legacyprint-summary-section">
            <span>LegacyTuning™ Zone</span>

            <p>
              This build is currently reading in the {legacyTuningHzRange}{' '}
              range, with a nearest note window around{' '}
              {currentNearestNoteWindow}. That places the drum inside the
              broader resonance zone where the shell is likely to feel most
              balanced before final craftsman tuning.
            </p>
          </article>

          {topRelationship && (
            <article className="heritage-legacyprint-summary-section">
              <span>Strongest Voice Thread</span>

              <p>
                <strong>{topRelationship.title}.</strong>{' '}
                {topRelationship.summary}
              </p>
            </article>
          )}

          <article className="heritage-legacyprint-summary-section heritage-legacyprint-summary-section--takeaway">
            <span>Craftsman Takeaway</span>

            <p>
              This read is a build-direction guide, not a final verdict. The
              finished drum still has to be tuned, played, heard, and allowed to
              show where its final pocket lives.
            </p>
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

              <strong>{legacyTuningHzRange}</strong>

              <em>{currentNearestNoteWindow} nearest note window</em>
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
                Warm / Full
              </span>

              <span className="heritage-voice-range-stop-sub">
                80–180 Hz · Lower body
              </span>
            </div>

            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">Balanced</span>

              <span className="heritage-voice-range-stop-sub">
                180–350 Hz · Low-mid
              </span>
            </div>

            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">Presence</span>

              <span className="heritage-voice-range-stop-sub">
                350 Hz–1.2 kHz · Mid
              </span>
            </div>

            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">
                Crisp / Cutting
              </span>

              <span className="heritage-voice-range-stop-sub">
                1.2–4 kHz · Upper-mid
              </span>
            </div>

            <div className="heritage-voice-range-stop">
              <span className="heritage-voice-range-stop-title">
                Bright / Airy
              </span>

              <span className="heritage-voice-range-stop-sub">
                4–10 kHz · Highs
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
            <span>Darker / thicker body</span>

            <span>Brighter / more articulate edge</span>
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

  const renderComparisonChart = () => {
    return (
      <div className="heritage-chart-module">
        <div className="heritage-chart-module-head">
          <div className="heritage-chart-module-copy">
            <span className="heritage-chart-eyebrow">
              {isCompareModeEnabled ? 'VoiceMap™ Compare' : 'VoiceMap™'}
            </span>

            <h4 className="heritage-chart-title">
              {isCompareModeEnabled
                ? 'Current build vs reference'
                : 'Current build voice shape'}
            </h4>

            <p className="heritage-chart-title-subcopy">
              {isCompareModeEnabled
                ? 'Shows how this Heritage build shifts against your selected listening benchmark across the seven Voice Nodes.'
                : 'Shows the current Heritage configuration across the seven Voice Nodes.'}
            </p>
          </div>
        </div>

        <div className="heritage-chart-wrap heritage-chart-wrap--voice-read heritage-chart-wrap--simple heritage-chart-wrap--compare-enabled">
          <div className="heritage-chart-stage">
            <SpiderChart
              data={chartValues}
              labels={AXIS_META}
              pointColors={AXIS_POINT_COLORS}
              activeKey={activeAxisKey}
              onAxisChange={handleAxisChange}
              mode={isCompareModeEnabled ? 'compare' : 'standalone'}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderVoiceMapNodeInsight = () => {
    return (
      <div
        className="heritage-voicemap-node-insight"
        style={{
          '--axis-accent': activeAxisColor,
        }}
      >
        <div className="heritage-voicemap-node-insight-head">
          <div className="heritage-voicemap-node-title-row">
            <span className="heritage-voicemap-node-icon">
              <MetricIcon
                type={activeAxisMeta.icon}
                color={activeAxisColor}
                size={19}
              />
            </span>

            <div>
              <span className="heritage-summary-kicker">Active Voice Node</span>

              <h4>
                {activeAxisMeta.label}

                <em>{AXIS_SUBLABELS[activeAxisMeta.key]}</em>
              </h4>
            </div>
          </div>

          <span
            className={`heritage-voicemap-node-shift ${
              activeAxisDeltaValue > 0
                ? 'is-positive'
                : activeAxisDeltaValue < 0
                  ? 'is-negative'
                  : 'is-neutral'
            }`}
          >
            Shift {activeAxisScore}
          </span>
        </div>

        <div className="heritage-voicemap-node-insight-body">
          <div className="heritage-voicemap-node-copy">
            <p className="heritage-voicemap-node-short">
              {activeAxisCopy.short}
            </p>

            <p>{activeAxisCopy.detail}</p>
          </div>

          <div className="heritage-voicemap-node-contributors">
            <span>Primary contributors</span>

            <div className="heritage-voicemap-node-contributor-list">
              {activeAxisImpactFactors.map((factor) => (
                <span
                  key={factor.label}
                  className={`heritage-voicemap-node-contributor is-${factor.strength}`}
                >
                  {factor.label}

                  <em>
                    {factor.strength === 'strong'
                      ? 'High'
                      : factor.strength === 'medium'
                        ? 'Medium'
                        : 'Light'}
                  </em>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const visibleLegacyPrintTabs = useMemo(() => {
    return [
      ...BASE_LEGACYPRINT_TABS,
      ...(isCompareModeEnabled ? [REFERENCE_SETUP_TAB] : []),
      DISCOVERY_LEGACYPRINT_TAB,
    ];
  }, [isCompareModeEnabled]);

  const renderLegacyPrintPanel = () => {
    if (legacyPrintTab === 'voiceRead') {
      return (
        <div
          className={`heritage-legacyprint-panel heritage-legacyprint-panel--voice-read ${
            isCompareModeEnabled ? 'is-compare-mode' : 'is-standalone-mode'
          }`}
        >
          <div className="heritage-voice-comparison-shell heritage-voice-comparison-shell--voice-read">
            {renderComparisonChart()}

            {renderVoiceMapNodeInsight()}
          </div>
        </div>
      );
    }

    if (legacyPrintTab === 'legacyTuning') {
      return (
        <div className="heritage-legacyprint-panel heritage-legacyprint-panel--legacy-tuning">
          <div className="heritage-chart-top-shell heritage-chart-top-shell--polished">
            <div className="heritage-chart-title-shell">
              <span className="heritage-chart-eyebrow">LegacyTuning™</span>

              <h4 className="heritage-chart-title">Natural resonance lane</h4>

              <p className="heritage-chart-title-subcopy">
                This view shows where the shell naturally wants to sit: darker
                and fuller on one side, brighter and more articulate on the
                other.
              </p>
            </div>
          </div>

          {renderVoiceRangeCard()}
        </div>
      );
    }

    if (legacyPrintTab === 'relationships') {
      const activeReadout = activeVoiceThreadReadout;

      const voiceShiftText = (() => {
        const profile = activeVoiceSummary?.profile || {};

        const sizeLabel = `${size}x${depth}`;

        const shifts = [
          { label: 'attack', value: profile.attack },

          { label: 'projection', value: profile.projection },

          { label: 'control', value: profile.control },

          { label: 'sustain', value: profile.sustain },

          { label: 'warmth', value: profile.warmth },

          { label: 'brightness', value: profile.brightness },

          { label: 'sensitivity', value: profile.sensitivity },
        ]

          .filter((item) => Number.isFinite(Number(item.value)))

          .map((item) => ({
            ...item,

            delta: Number(item.value) - 5,
          }))

          .filter((item) => Math.abs(item.delta) >= 0.12)

          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

          .slice(0, 3)

          .map((item) => {
            const direction = item.delta > 0 ? 'more' : 'less';

            return `${direction} ${item.label}`;
          });

        if (!shifts.length) return '';

        return `${sizeLabel} keeps the same main thread, but shifts toward ${shifts.join(
          ', '
        )}.`;
      })();

      return (
        <div className="heritage-legacyprint-panel heritage-legacyprint-panel--relationships heritage-thread-reference heritage-thread-single-read">
          <div className="heritage-thread-reference-head">
            <span className="heritage-chart-eyebrow">Voice Threads</span>

            <h4 className="heritage-chart-title">Current Voice Thread read</h4>

            <p className="heritage-chart-title-subcopy">
              A Voice Thread is a simple way to describe how a few parts of the
              drum’s voice are working together. It gives you one useful
              listening angle for the build in front of you.
            </p>
          </div>

          <div
            className="heritage-thread-single-selector"
            aria-label="Current Voice Thread selector"
          >
            {keyRelationships.map((relationship) => {
              const isActive = selectedThreadId === relationship.id;

              const cardReadout = buildVoiceThreadReadout({
                thread: relationship,

                profile: activeVoiceSummary?.profile || {},

                sourceBuildRead: activeVoiceSummary?.sourceBuildRead || '',
              });

              return (
                <button
                  key={`${activeBuildSignature}-${relationship.id}-selector`}
                  type="button"
                  className={`heritage-thread-single-selector-button ${
                    isActive ? 'is-active' : ''
                  }`}
                  onClick={() => handleThreadSelect(relationship.id)}
                  style={getThreadColorVars(relationship.nodes)}
                >
                  <span className="heritage-thread-single-selector-kicker">
                   {relationship.slotKey === 'simple'

  ? 'First Tell'

  : relationship.slotKey === 'shaped'

    ? 'Player Read'

    : 'Musical Identity'}
                  </span>

                  <strong>

  {relationship.slotKey === 'complex'

    ? musicalIdentityTitle

    : relationship.title}

</strong>

                  <em>{cardReadout.intensityLabel} read</em>
                </button>
              );
            })}
          </div>

          {activeThread && activeReadout && (
            <article
              key={`${activeBuildSignature}-${activeThread.id}-single-read`}
              className="heritage-thread-single-read-panel"
              style={getThreadColorVars(activeThread.nodes)}
            >
              <div className="heritage-thread-single-read-visual">
                <VoiceThreadMap
                  activeThread={activeThread}
                  strengthScore={activeThread.score}
                  profile={activeVoiceSummary?.profile || {}}
                  sourceBuildRead={activeVoiceSummary?.sourceBuildRead || ''}
                  currentSpec={activeVoiceSummary?.currentSpec || {}}
                  input={{
                    size,

                    depth,

                    lugs,

                    staveOption,

                    hoopType,

                    hardwareColor,

                    scorchDepth,
                  }}
                />
              </div>

              <div className="heritage-thread-single-read-content">
                <div className="heritage-thread-single-read-head">
                  <div>
                    <span className="heritage-summary-kicker">
                      Ober voice read
                    </span>

                    <h4>

  {activeThread.slotKey === 'complex'

    ? musicalIdentityTitle

    : activeThread.title}

</h4>

                    <p className="heritage-thread-single-read-type">
                  {activeThread.slotKey === 'simple'

  ? 'First Tell'

  : activeThread.slotKey === 'shaped'

    ? 'Player Read'

    : 'Musical Identity'}{' '}

/ {activeReadout.intensityLabel} read
                    </p>
                  </div>

                  <div className="heritage-thread-read-icons">
                    {renderThreadNodeIcons(activeThread.nodes)}
                  </div>
                </div>

                <p className="heritage-thread-single-read-lede">
                  {activeThread.summary}
                </p>

                <div className="heritage-thread-single-meta-grid">
                  <span>
                    <strong>Pattern</strong>

                    {activeReadout.shapeLabel}
                  </span>

                  <span>
                    <strong>Hand feel</strong>

                    {activeReadout.intensityLabel}
                  </span>

                  <span>
                    <strong>Voice nodes</strong>

                    {activeReadout.nodeLabels}
                  </span>
                </div>

                <div className="heritage-thread-axis-delta-list heritage-thread-axis-delta-list--single">
                  {(activeThread.nodes || []).map((nodeKey) => {
                    const axis = AXIS_META.find((item) => item.key === nodeKey);

                    const rawValue = Number(
                      activeVoiceSummary?.profile?.[nodeKey] ?? 5
                    );

                    const delta = Number((rawValue - 5).toFixed(2));

                    const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;

                    const color = AXIS_COLOR_BY_KEY[nodeKey] || '#d6b277';

                    return (
                      <div
                        key={nodeKey}
                        className={`heritage-thread-axis-delta-line ${
                          delta > 0
                            ? 'is-positive'
                            : delta < 0
                              ? 'is-negative'
                              : 'is-neutral'
                        }`}
                        style={{ '--axis-color': color }}
                      >
                        <span>{axis?.label || nodeKey}</span>

                        <strong>{deltaLabel}</strong>
                      </div>
                    );
                  })}
                </div>

                {voiceShiftText && (
                  <p className="heritage-voice-shift-readout heritage-voice-shift-readout--single">
                    <strong>Voice shift</strong>

                    {voiceShiftText}
                  </p>
                )}

                <div className="heritage-thread-listening-note heritage-thread-listening-note--single">
                  <section>
                    <span>At the kit</span>

                    <p>{activeReadout.whatThreadIsTellingUs}</p>
                  </section>

                  <section>
                    <span>Bench note</span>

                    <p>{activeReadout.whyItMatters}</p>
                  </section>

                  <section>
                    <span>Good for</span>

                    <p>{activeReadout.howToUseThis}</p>
                  </section>

                  <section>
                    <span>Keep in mind</span>

                    <p>{activeReadout.trustNote}</p>
                  </section>
                </div>
              </div>
            </article>
          )}
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
              reference sounds, Voice Nodes, Voice Threads, and build priorities
              into a guided voicing direction.
            </p>

            <p>
              Available for SoundLegend artists and LegacyPartner accounts.
              SoundLegend artists also unlock deeper VoiceMap, VoiceRange, Story
              Workbench, consultation history, and the living story behind the
              drum.
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
                    <label>Snare Size (Diameter)</label>

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

                    <label>Depth</label>

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

                    <label>Lug Quantity</label>

                    <div className="heritage-option-grid heritage-option-grid-compact">
                      {lugOptions[size].map((lugOption) => {
                        const isSelected = lugs === lugOption;

                        const requiresReRingsForThisLugChoice =
                          String(size) === '12' && String(lugOption) === '6';

                        return (
                          <button
                            key={lugOption}
                            type="button"
                            className={`heritage-option-tile heritage-option-tile-detail ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleLugSelect(lugOption)}
                          >
                            <span className="heritage-option-title">
                              {lugOption} Lugs
                            </span>

                            {requiresReRingsForThisLugChoice && (
                              <span className="heritage-option-subtitle">
                                Re-rings required
                              </span>
                            )}

                            {(isSelected ||
                              requiresReRingsForThisLugChoice) && (
                              <span
                                className={`heritage-option-meta ${
                                  isSelected ? 'is-selected' : 'is-positive'
                                }`}
                              >
                                {isSelected
                                  ? requiresReRingsForThisLugChoice
                                    ? 'Selected • +$150'
                                    : 'Selected'
                                  : '+$150'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <label>Stave Quantity &amp; Shell Thickness</label>

                    <div className="heritage-option-grid">
                      {(staveOptions[size]?.[lugs] || []).map((option) => {
                        const isSelected = staveOption === option;

                        const deltaMeta = getOptionDeltaMeta({
                          staveOption: option,
                        });

                        const requiresReRings =
                          hasReRingFromStaveOption(option);

                        const isImplicitReRingPath =
                          String(size) === '12' &&
                          String(lugs) === '6' &&
                          (staveOptions[size]?.[lugs] || []).length === 1;

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
                              {getStaveCountLabel(option)}
                            </span>

                            <span className="heritage-option-subtitle">
                              {thicknessLabel}

                              {requiresReRings ? ' • Re-Rings required' : ''}
                            </span>

                            {!isImplicitReRingPath &&
                              (isSelected || deltaMeta.text) && (
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

                            {isImplicitReRingPath && isSelected && (
                              <span className="heritage-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
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
                    <label>Finish Scorch Depth</label>

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

                            {isSelected && (
                              <span className="heritage-option-meta is-selected">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="heritage-select-helper">
                      Heritage uses a standard snare bed and a fixed 45° inner
                      bearing edge with a softened outer roundover to keep the
                      line grounded, consistent, and unmistakably classic.
                    </p>

                    <p className="heritage-swatch-disclaimer">
                      Swatches are a general visual guide. Final Heritage finish
                      character can vary based on wood grain, natural
                      absorption, torch response, and the unique behavior of
                      each shell.
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
                    <label>Hardware Finish</label>

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

                            <span className="heritage-option-subtitle">
                              {option.description}
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

                    <label>Hoop Type</label>

                    <div className="heritage-option-grid">
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

                            <span className="heritage-option-subtitle">
                              {option.description}
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

                    <p className="heritage-select-helper">
                      Heritage uses standard snare beds and a fixed
                      Heritage-standard bearing edge to keep the line grounded,
                      consistent, and unmistakably classic.
                    </p>

                    <p className="heritage-select-helper">
                      The standard Heritage reference uses Remo Ambassador
                      Coated batter, Remo Ambassador Hazy Snare Side, and
                      PureSound Custom Pro Steel 20-Strand wires.
                    </p>

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
                    {size}" × {depth}" • {lugs} lugs •{' '}
                    {getStaveCountLabel(staveOption)} •{' '}
                    {getStaveThicknessLabel(staveOption)}
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
                      src="/legacyprint-benchmarks/legacyprint-icon.png"
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
