import React, { useState, useEffect, useMemo } from 'react';

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

import heritageSummaries from '../data/heritageSummaries';

import { useCart } from '../context/CartContext';

import SpiderChart from './SpiderChart';

import BarChart from './BarChart';

import './HeritageProductDetail.css';

import toast from 'react-hot-toast';

import LEGACYPRINT_BENCHMARK_CATALOG from '../data/legacyPrint/benchmarkCatalog';

import buildHeritageVoiceRead from '../utils/legacyPrint/buildHeritageVoiceRead';

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
  // Ober Custom

  'heritage-oak-reference': 2.9,

  'feuzon-hybrid-reference': 3.35,

  // Ply

  'maple-ply-reference': 3.45,

  'birch-ply-reference': 3.8,

  'oak-ply-reference': 3.15,

  'walnut-ply-reference': 2.3,

  'mahogany-ply-reference': 2.1,

  // Metal

  'brass-reference': 3.75,

  'steel-reference': 4.35,

  'aluminum-reference': 4.05,

  'copper-reference': 3.2,

  'bronze-reference': 3.55,

  // Acrylic

  'thin-acrylic-reference': 4.7,

  'medium-acrylic-reference': 4.4,

  'thick-acrylic-reference': 4.15,

  // Solid / steam-bent

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
    return `Your current build selections would likely sound very close to ${referenceLabel}. To compare this build against another reference drum, use the Reference Drum selectors above.`;
  }

  const topPhrases = phrases.slice(0, 3);

  if (topPhrases.length === 1) {
    return `Your current build selections would likely produce ${topPhrases[0]} compared with ${referenceLabel}. To compare this build against another reference drum, use the Reference Drum selectors above.`;
  }

  if (topPhrases.length === 2) {
    return `Your current build selections would likely produce ${topPhrases[0]} and ${topPhrases[1]} compared with ${referenceLabel}. To compare this build against another reference drum, use the Reference Drum selectors above.`;
  }

  return `Your current build selections would likely produce ${topPhrases[0]}, ${topPhrases[1]}, and ${topPhrases[2]} compared with ${referenceLabel}. To compare this build against another reference drum, use the Reference Drum selectors above.`;
};

const AXIS_INSIGHT_COPY = {
  attack: {
    short: 'Fast front-end response with stronger note definition.',

    detail:
      'Compared with the selected benchmark, this Heritage configuration speaks with a firmer front edge and a little more immediacy at the start of the note.',

    scaleLow:
      'Softer front-end response with less immediate crack. The drum feels rounder and more relaxed at the start of the note than the selected benchmark.',

    scaleHigh:
      'Sharper attack with stronger note definition and quicker front-edge response. The drum feels more immediate and assertive than the selected benchmark.',
  },

  sustain: {
    short: 'A controlled note tail with a measured amount of bloom.',

    detail:
      'Compared with the selected benchmark, this reflects how long the shell wants to hold onto the note after the strike and how much openness sits in the decay.',

    scaleLow:
      'Shorter decay and a quicker note exit. The drum feels tighter and more contained than the selected benchmark.',

    scaleHigh:
      'Longer bloom and more note extension. The shell feels more open and willing to hang in the air than the selected benchmark.',
  },

  warmth: {
    short: 'A fuller, richer center through the body of the note.',

    detail:
      'Compared with the selected benchmark, this Heritage build leans more into tonal weight and low-mid richness, affecting how grounded and seasoned the shell feels.',

    scaleLow:
      'Leaner body and less low-mid weight. The drum feels cleaner and a little less body-forward than the selected benchmark.',

    scaleHigh:
      'Richer body and a fuller center to the note. The shell feels deeper, broader, and more substantial than the selected benchmark.',
  },

  projection: {
    short: 'Clear outward push with confident room presence.',

    detail:
      'Compared with the selected benchmark, projection reflects how assertively this shell throws the note into the room and how strongly it carries.',

    scaleLow:
      'More intimate and less forceful in the room. The shell feels more contained and closer to the player than the selected benchmark.',

    scaleHigh:
      'Stronger room presence and more outward push. The note carries farther and feels more commanding than the selected benchmark.',
  },

  brightness: {
    short: 'A measured amount of top-end edge and upper-register cut.',

    detail:
      'Compared with the selected benchmark, brightness shapes how much sheen, snap, and upper-register clarity sit on top of the drum’s core voice.',

    scaleLow:
      'Darker top-end with less snap and less sheen. The shell feels woodier, rounder, and more restrained than the selected benchmark.',

    scaleHigh:
      'More top-end edge, snap, and cut. The drum feels more articulate and able to speak through a mix than the selected benchmark.',
  },

  sensitivity: {
    short: 'Responsive to lighter playing and subtle dynamic detail.',

    detail:
      'Compared with the selected benchmark, sensitivity reflects how easily the shell and wire response open up under lighter hands, ghost notes, and softer touch.',

    scaleLow:
      'Needs a little more input to fully wake up. The drum feels firmer and more centered around medium-to-strong playing than the selected benchmark.',

    scaleHigh:
      'Opens up more easily at lower dynamics. The shell feels more alive under softer touch and nuanced phrasing than the selected benchmark.',
  },

  control: {
    short: 'Shaped and contained in a way that feels easy to manage.',

    detail:
      'Compared with the selected benchmark, control reflects how organized and disciplined the note feels through overtone behavior and decay.',

    scaleLow:
      'More open and less contained. The note feels broader, freer, and a bit less disciplined than the selected benchmark.',

    scaleHigh:
      'Tighter note shape with more organized overtone behavior. The drum feels easier to place and keep composed than the selected benchmark.',
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

  const [chartView, setChartView] = useState('spider');

  const [selectedDrumSummary, setSelectedDrumSummary] = useState({});

  const [openBuilderSection, setOpenBuilderSection] = useState('construction');

  const [activeAxisKey, setActiveAxisKey] = useState('attack');

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
      return 'These scores are benchmark-relative. A centered read reflects the selected reference drum, and movement above or below center shows how your current build shifts against it.';
    }

    return `${selectedBenchmarkFamily.familyLabel} benchmark selected. This Heritage build is being compared against the ${selectedBenchmarkType.typeLabel} reference at ${selectedBenchmarkSize.label}. The chart is reference-relative: center represents the selected benchmark, values above center indicate more emphasis, and values below center indicate less emphasis.`;
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

  const chartValues = useMemo(() => {
    return AXIS_META.map(({ key }) => {
      const rawValue =
        selectedDrumSummary?.profile?.[key] != null
          ? Number(selectedDrumSummary.profile[key])
          : 5;

      return getDisplayMetricValue(rawValue);
    });
  }, [selectedDrumSummary]);

  const chartBarData = useMemo(() => {
    return AXIS_META.reduce((acc, axis) => {
      const rawValue =
        selectedDrumSummary?.profile?.[axis.key] != null
          ? Number(selectedDrumSummary.profile[axis.key])
          : 5;

      acc[axis.key] = getDisplayMetricValue(rawValue);

      return acc;
    }, {});
  }, [selectedDrumSummary]);

  const currentBuildPrice = useMemo(() => {
    return computeHeritagePrice({
      size,

      depth,

      staveOption,

      hardwareColor,

      hoopType,
    });
  }, [size, depth, staveOption, hardwareColor, hoopType]);

  const toneSummaryText = useMemo(() => {
    return buildToneSummary(
      selectedDrumSummary,

      selectedBenchmarkType,

      selectedBenchmarkSize
    );
  }, [selectedDrumSummary, selectedBenchmarkType, selectedBenchmarkSize]);

  const currentBuildVoiceRangeSummary = useMemo(() => {
    return buildHeritageVoiceRead({
      size,

      depth,

      lugs,

      staveOption,

      hardwareColor,

      hoopType,

      scorchDepth,

      // Keep this locked so the BUILD dot does not move when reference changes.

      benchmarkFamilyId: DEFAULT_BENCHMARK_FAMILY_ID,

      benchmarkTypeId: DEFAULT_BENCHMARK_TYPE_ID,

      benchmarkSizeId: DEFAULT_BENCHMARK_SIZE_ID,
    });
  }, [size, depth, lugs, staveOption, hardwareColor, hoopType, scorchDepth]);

  const projectedVoiceRangePosition = useMemo(() => {
    return buildProjectedVoiceRange(currentBuildVoiceRangeSummary);
  }, [currentBuildVoiceRangeSummary]);

  const benchmarkVoiceRangePosition = useMemo(() => {
    return buildBenchmarkVoiceRange(
      selectedBenchmarkType,
      selectedBenchmarkSize
    );
  }, [selectedBenchmarkType, selectedBenchmarkSize]);

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

  const activeAxisColor = AXIS_COLOR_BY_KEY[activeAxisKey] || '#d6b277';

  const activeAxisImpactFactors =
    AXIS_IMPACT_FACTORS[activeAxisKey] || AXIS_IMPACT_FACTORS.attack;

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

  const getDeltaClassName = (delta, isSelected = false) => {
    if (isSelected) return 'is-selected';

    if (delta > 0) return 'is-positive';

    if (delta < 0) return 'is-negative';

    return '';
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

              {/* <div className="heritage-builder-preset-card">
                <span className="heritage-builder-preset-label">
                  Start from
                </span>

                <div className="heritage-builder-preset-actions">
                  <button
                    type="button"
                    className="heritage-builder-preset-button"
                    onClick={() => applyHeritagePreset('lowest')}
                  >
                    Lowest Price
                  </button>

                  <button
                    type="button"
                    className="heritage-builder-preset-button heritage-builder-preset-button--standard"
                    onClick={() => applyHeritagePreset('standard')}
                  >
                    HERITAGE Standard
                  </button>
                </div>
              </div> */}
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
                            onClick={() => setScorchDepth(option)}
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
                            onClick={() => setHardwareColor(option.value)}
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
                            onClick={() => setHoopType(option.value)}
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

          <section className="heritage-voice-panel heritage-voice-read-card heritage-voice-read-card--reworked">
            <div className="heritage-voice-read-header heritage-voice-read-header--polished">
              <span className="heritage-summary-kicker">
                LegacyPrint™ Voice Comparison
              </span>

              <p className="heritage-read-summary heritage-read-summary--wide">
                Compare your current Heritage build against a reference drum to
                see how its response shifts across the core sound metrics.
              </p>
            </div>

            <div className="heritage-voice-read-flow">
              <div className="heritage-reference-card-shell">
                <div className="heritage-reference-card-head">
                  <span className="heritage-summary-kicker">
                    Reference Drum
                  </span>

                  <p className="heritage-chart-reference-subcopy">
                    Choose the drum you want this build compared against. By
                    default, HERITAGE starts from a 14&quot; × 5.5&quot;
                    Northern Red Oak stave reference with 16 staves, 8 lugs,
                    Triple Flange hoops, Chrome hardware, a 45° inner edge with
                    softened outer roundover, Standard snare bed, Medium Torch
                    finish, Remo Ambassador Coated batter, Remo Ambassador Hazy
                    Snare Side, and PureSound Custom Pro Steel 20-Strand wires.
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
                              <option
                                key={family.familyId}
                                value={family.familyId}
                              >
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

                        <div className="heritage-benchmark-selector-group">
                          <label className="heritage-benchmark-selector-label">
                            Reference Size
                          </label>

                          <select
                            className="heritage-benchmark-selector"
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

              <div className="heritage-voice-comparison-shell">
                <div className="heritage-voice-support-grid heritage-voice-support-grid--top">
                  <div className="heritage-tone-summary-card heritage-tone-summary-card--stacked heritage-tone-summary-card--polished">
                    <div
                      className="heritage-tone-summary-icon"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M5 12h3l2-4 3 8 2-4h4" />
                      </svg>
                    </div>

                    <div className="heritage-tone-summary-copy">
                      <span className="heritage-summary-kicker">
                        Tone Summary
                      </span>

                      <p>{toneSummaryText}</p>

                      <p className="heritage-tone-summary-helper">
                        This summary shifts as your build and selected reference
                        drum change.
                      </p>
                    </div>
                  </div>

                  <div className="heritage-voice-range-card heritage-voice-range-card--polished">
                    <div className="heritage-voice-range-head">
                      <span className="heritage-summary-kicker">
                        Overall Voice Range
                      </span>

                      <p className="heritage-voice-range-intro">
                        This shows where each drum generally sits across the
                        tonal spectrum — from warmer fundamental body to
                        brighter upper-register presence.
                      </p>
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
                          <span className="heritage-voice-range-stop-title">
                            Balanced
                          </span>

                          <span className="heritage-voice-range-stop-sub">
                            180–350 Hz · Low-mid
                          </span>
                        </div>

                        <div className="heritage-voice-range-stop">
                          <span className="heritage-voice-range-stop-title">
                            Presence
                          </span>

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
                        className="heritage-voice-range-track"
                        aria-label="Overall voice range from warm and full to bright and airy"
                      >
                        <div className="heritage-voice-range-track-line" />

                        <div
                          className="heritage-voice-range-marker heritage-voice-range-marker--current"
                          style={{
                            left: `${((projectedVoiceRangePosition - 1) / 4) * 100}%`,
                          }}
                        >
                          <span className="heritage-voice-range-marker-label">
                            Build
                          </span>
                        </div>

                        <div
                          className="heritage-voice-range-marker heritage-voice-range-marker--reference"
                          style={{
                            left: `${((benchmarkVoiceRangePosition - 1) / 4) * 100}%`,
                          }}
                        >
                          <span className="heritage-voice-range-marker-label">
                            Ref
                          </span>
                        </div>
                      </div>

                      <div className="heritage-voice-range-footer">
                        <span>Darker / thicker body</span>

                        <span>Brighter / more articulate edge</span>
                      </div>

                      <div className="heritage-voice-range-legend">
                        <span className="heritage-voice-range-legend-item">
                          <span className="heritage-voice-range-dot heritage-voice-range-dot--current" />
                          Current Build
                        </span>

                        <span className="heritage-voice-range-legend-item">
                          <span className="heritage-voice-range-dot heritage-voice-range-dot--reference" />
                          Selected Reference
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="heritage-chart-top-shell heritage-chart-top-shell--polished">
                  <div className="heritage-chart-title-shell">
                    <span className="heritage-chart-eyebrow">
                      Voice comparison
                    </span>

                    <h4 className="heritage-chart-title">
                      Current Build vs Reference Drum
                    </h4>

                    <p className="heritage-chart-title-subcopy">
                      Hover or click a metric to explore how this build shifts
                      against your selected reference drum.
                    </p>

                    <div
                      className="heritage-chart-view-switch heritage-chart-view-switch--inline"
                      role="tablist"
                      aria-label="Chart view"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={chartView === 'spider'}
                        className={`heritage-chart-icon-toggle ${
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
                        className={`heritage-chart-icon-toggle ${
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

                <div className="heritage-chart-wrap heritage-chart-wrap--voice-read heritage-chart-wrap--simple">
                  <div className="heritage-chart-stage">
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
                      />
                    )}
                  </div>
                </div>

                <div
                  className="heritage-axis-insight-panel"
                  style={{
                    '--axis-accent': activeAxisColor,
                  }}
                >
                  <div className="heritage-axis-insight-panel-head">
                    <div className="heritage-axis-insight-panel-title-group">
                      <span className="heritage-summary-kicker">
                        Metric Insight
                      </span>

                      <div className="heritage-axis-insight-panel-title-row">
                        <span className="heritage-axis-insight-panel-icon">
                          <MetricIcon
                            type={activeAxisMeta.icon}
                            color={activeAxisColor}
                            size={20}
                          />
                        </span>

                        <div className="heritage-axis-insight-panel-title-copy">
                          <h4>{activeAxisMeta.label}</h4>

                          <span>{AXIS_SUBLABELS[activeAxisMeta.key]}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`heritage-axis-insight-score-pill ${
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

                  <div className="heritage-axis-insight-panel-body">
                    <div className="heritage-axis-insight-main-copy">
                      <p className="heritage-axis-insight-short">
                        {activeAxisCopy.short}
                      </p>

                      <p className="heritage-axis-insight-detail">
                        {activeAxisCopy.detail}
                      </p>

                      <p className="heritage-axis-insight-scale-read">
                        <strong>Lower / closer to center:</strong>{' '}
                        {activeAxisCopy.scaleLow}
                      </p>

                      <p className="heritage-axis-insight-scale-read">
                        <strong>Higher / farther outward:</strong>{' '}
                        {activeAxisCopy.scaleHigh}
                      </p>
                    </div>

                    <div className="heritage-axis-impact-panel">
                      <span className="heritage-axis-impact-label">
                        Voice contributors
                      </span>

                      <div className="heritage-axis-impact-list">
                        {activeAxisImpactFactors.map((factor) => (
                          <div
                            key={factor.label}
                            className={`heritage-axis-impact-row is-${factor.strength}`}
                          >
                            <span className="heritage-axis-impact-name">
                              {factor.label}
                            </span>

                            <span className="heritage-axis-impact-strength">
                              <span className="heritage-axis-impact-dot" />

                              <span className="heritage-axis-impact-text">
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
