import React, { useState, useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { doc, getDoc } from 'firebase/firestore';

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

const AXIS_COLOR_BY_KEY = {
  attack: '#ff7448',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  projection: '#ffb53a',

  brightness: '#e7d98f',

  sensitivity: '#68d9df',

  control: '#9e8bff',
};

const AXIS_INSIGHT_COPY = {
  attack: {
    lower: {
      short:
        'A rounder, softer front edge with less immediate attack emphasis.',

      detail:
        'Compared with the selected benchmark, this configuration speaks with a more relaxed note start. Strokes feel less sharp at the front, and the drum leans a little more laid-back under the stick.',
    },

    higher: {
      short: 'Fast front-end response with stronger note definition.',

      detail:
        'Compared with the selected benchmark, this configuration speaks more quickly and feels more assertive at the front of the note. Rimshots, accents, and tighter sticking come forward with more immediacy.',
    },
  },

  sustain: {
    lower: {
      short: 'A shorter, tighter note shape with less bloom after the strike.',

      detail:
        'Compared with the selected benchmark, this configuration lets the note get out of the way a bit faster. The tail feels more contained and less lingering.',
    },

    higher: {
      short: 'A longer note shape with more bloom and musical hang.',

      detail:
        'Compared with the selected benchmark, this configuration holds onto the note longer and lets the shell speak with more openness through the tail.',
    },
  },

  warmth: {
    lower: {
      short: 'A leaner, cleaner center with less low-mid body emphasis.',

      detail:
        'Compared with the selected benchmark, this configuration feels a little less weighted through the middle of the voice. The drum comes across cleaner and less body-forward.',
    },

    higher: {
      short: 'A fuller, richer center with more body in the voice.',

      detail:
        'Compared with the selected benchmark, this configuration leans more into tonal weight and low-mid fullness. The drum feels deeper and more grounded.',
    },
  },

  projection: {
    lower: {
      short: 'A more intimate room presence with less outward push.',

      detail:
        'Compared with the selected benchmark, this configuration feels a little more contained in how it throws into the room. It can read more studio-leaning and less forceful at distance.',
    },

    higher: {
      short: 'Clear outward push with stronger room presence.',

      detail:
        'Compared with the selected benchmark, this configuration throws the note more confidently and keeps its shape as it leaves the shell.',
    },
  },

  brightness: {
    lower: {
      short: 'A darker, smoother top-end with less upper-register emphasis.',

      detail:
        'Compared with the selected benchmark, this configuration keeps the top more restrained. The note feels less sharp on top and more rounded overall.',
    },

    higher: {
      short: 'More top-end clarity, edge, and upper-register cut.',

      detail:
        'Compared with the selected benchmark, this configuration carries more sheen and snap above the core note, helping it feel more present on top.',
    },
  },

  sensitivity: {
    lower: {
      short: 'Less reactive to lighter touch and subtle dynamic detail.',

      detail:
        'Compared with the selected benchmark, this configuration asks for a little more input before softer articulation fully comes alive.',
    },

    higher: {
      short: 'More reactive to lighter touch and dynamic nuance.',

      detail:
        'Compared with the selected benchmark, this configuration responds more easily to ghost notes, lighter phrasing, and softer hands.',
    },
  },

  control: {
    lower: {
      short: 'A more open, freer note shape with less containment emphasis.',

      detail:
        'Compared with the selected benchmark, this configuration feels less tightly managed. The note spreads more naturally, breathes a bit more, and feels less contained through the decay.',
    },

    higher: {
      short: 'A more shaped, contained, and managed note response.',

      detail:
        'Compared with the selected benchmark, this configuration feels more focused and disciplined through the body and decay of the note. Overtones stay more contained, and the overall response comes across more guided and controlled.',
    },
  },
};

const AXIS_SCALE_READ_COPY = {
  attack: {
    lower:
      'Negative values mean this build feels rounder and less immediate at the front of the note than the selected benchmark.',

    center:
      'Zero means this build lands very close to the selected benchmark for front-end note shape and immediacy.',

    higher:
      'Positive values mean this build feels quicker, firmer, and more defined at the front of the note than the selected benchmark.',
  },

  sustain: {
    lower:
      'Negative values mean this build decays faster and feels tighter through the tail than the selected benchmark.',

    center:
      'Zero means this build lands very close to the selected benchmark for note length and bloom.',

    higher:
      'Positive values mean this build holds onto the note longer and blooms more openly than the selected benchmark.',
  },

  warmth: {
    lower:
      'Negative values mean this build feels leaner, cleaner, and less low-mid weighted than the selected benchmark.',

    center:
      'Zero means this build lands very close to the selected benchmark for tonal body and center weight.',

    higher:
      'Positive values mean this build feels fuller, richer, and more body-forward than the selected benchmark.',
  },

  projection: {
    lower:
      'Negative values mean this build feels more intimate and less outward-pushing than the selected benchmark.',

    center:
      'Zero means this build lands very close to the selected benchmark for room throw and outward presence.',

    higher:
      'Positive values mean this build throws more confidently and feels bigger in the room than the selected benchmark.',
  },

  brightness: {
    lower:
      'Negative values mean this build feels darker, smoother, and less top-forward than the selected benchmark.',

    center:
      'Zero means this build lands very close to the selected benchmark for upper-register presence and edge.',

    higher:
      'Positive values mean this build feels clearer, sharper, and more top-forward than the selected benchmark.',
  },

  sensitivity: {
    lower:
      'Negative values mean this build asks for a little more input before lighter detail fully comes alive compared with the selected benchmark.',

    center:
      'Zero means this build lands very close to the selected benchmark for low-dynamic response and touch.',

    higher:
      'Positive values mean this build responds more easily to ghost notes, lighter phrasing, and softer hands than the selected benchmark.',
  },

  control: {
    lower:
      'Negative values mean this build feels more open, freer, and less tightly contained than the selected benchmark.',

    center:
      'Zero means this build lands very close to the selected benchmark for note discipline and containment.',

    higher:
      'Positive values mean this build feels more shaped, contained, and managed than the selected benchmark.',
  },
};

const HERITAGE_BENCHMARK_READ = {
  title: 'How Heritage LegacyPrint™ scoring works',

  body: 'These scores are benchmark-relative. A 5.0 represents the Heritage reference drum: a 14" x 5.5" Northern Red Oak stave shell with 16 staves, ~10mm shell thickness, 8 lugs, Triple Flange hoops, a 45° inner edge with softened outer roundover, Medium Torch finish, and a neutral baseline head / wire setup. Scores above or below 5.0 show how this configuration shifts relative to that specific Heritage benchmark.',
};

const DEFAULT_BENCHMARK_FAMILY_ID = 'ober-custom';

const DEFAULT_BENCHMARK_TYPE_ID = 'heritage-oak-reference';

const DEFAULT_BENCHMARK_SIZE_ID = '14x5_5';

const formatCurrency = (value) => `$${Number(value || 0).toFixed(0)}`;

const HERITAGE_STANDARD_BEARING_EDGE =
  '45° inner bearing edge with softened outer roundover';

const HERITAGE_STANDARD_SNARE_BED = 'Standard';

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

  const [headBrand, setHeadBrand] = useState('Remo');

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
    setSize('12');

    setDepth('5.0');

    setLugs('8');

    setStaveOption('16 - 10mm');

    setHardwareColor('Chrome');

    setHoopType('Triple Flange');

    setScorchDepth('Medium Torch');

    setOpenBuilderSection('construction');

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
      sizes.find((size) => size.sizeId === benchmarkSizeId) ||
      sizes.find((size) => size.sizeId === fallbackSizeId) ||
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

  const benchmarkReadTitle = useMemo(() => {
    if (!selectedBenchmarkType || !selectedBenchmarkSize) {
      return HERITAGE_BENCHMARK_READ.title;
    }

    return `Benchmark Comparison • ${selectedBenchmarkType.typeLabel} • ${selectedBenchmarkSize.label}`;
  }, [selectedBenchmarkType, selectedBenchmarkSize]);

  const benchmarkReadBody = useMemo(() => {
    if (
      !selectedBenchmarkFamily ||
      !selectedBenchmarkType ||
      !selectedBenchmarkSize
    ) {
      return HERITAGE_BENCHMARK_READ.body;
    }

    return `${selectedBenchmarkFamily.familyLabel} benchmark selected. You are comparing this current Heritage configuration against the ${selectedBenchmarkType.typeLabel} benchmark at ${selectedBenchmarkSize.label}. This benchmark acts as the center reference for the read, so values above center indicate more emphasis than that selected benchmark, and values below center indicate less emphasis than that selected benchmark.`;
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

    'Craftsman-selected PureSound snare wires.',

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
    return AXIS_META.map(({ key }) =>
      selectedDrumSummary?.profile?.[key] != null
        ? Number(selectedDrumSummary.profile[key])
        : 5
    );
  }, [selectedDrumSummary]);

  const chartBarData = useMemo(() => {
    return AXIS_META.reduce((acc, axis) => {
      acc[axis.key] =
        selectedDrumSummary?.profile?.[axis.key] != null
          ? Number(selectedDrumSummary.profile[axis.key])
          : 5;

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

  const configurationBreakdown = useMemo(() => {
    const items = [];

    const basePrice = basePrices[size] || 0;

    items.push({
      label: `${size}" base shell`,

      delta: basePrice,

      isBase: true,
    });

    const depthDelta = depthPrices[size]?.[normalizeDepthKey(depth)] || 0;

    if (depthDelta !== 0) {
      items.push({
        label: `Depth: ${depth}"`,

        delta: depthDelta,
      });
    }

    if (hasReRingFromStaveOption(staveOption)) {
      items.push({
        label: 'Re-rings required',

        delta: reRingCost,
      });
    }

    const hardwareDelta = hardwareUpchargeMap[hardwareColor] || 0;

    if (hardwareDelta !== 0) {
      items.push({
        label: `Hardware: ${hardwareColor}`,

        delta: hardwareDelta,
      });
    }

    const hoopDelta = hoopUpchargeMap[hoopType] || 0;

    if (hoopDelta !== 0) {
      items.push({
        label: `Hoops: ${hoopType}`,

        delta: hoopDelta,
      });
    }

    return items;
  }, [size, depth, staveOption, hardwareColor, hoopType]);

  const configurationSummaryLine = useMemo(() => {
    return [
      `${size}" x ${depth}"`,

      `${lugs} lugs`,

      `${getStaveCountLabel(staveOption)}`,

      getStaveThicknessLabel(staveOption),

      'Northern Red Oak',

      hoopType,

      hardwareColor,

      scorchDepth,

      '45° inner / strong outer roundover',

      'Standard snare bed',
    ]

      .filter(Boolean)

      .join(' • ');
  }, [size, depth, lugs, staveOption, hoopType, hardwareColor, scorchDepth]);

  const craftsmenPicks = useMemo(() => {
    const picksByBrand = {
      Remo: {
        batterHead: 'Remo Controlled Sound Coated',

        resonantHead: 'Remo Ambassador Snare Side',

        snareWires: 'PureSound Custom Pro 20-Strand',

        studioMicPairing: 'Shure SM57 top + KM184 shell-side room support',
      },

      Evans: {
        batterHead: 'Evans UV1 Coated',

        resonantHead: 'Evans Snare Side 300',

        snareWires: 'PureSound Custom Pro 20-Strand',

        studioMicPairing:
          'Shure SM57 top + small diaphragm condenser for articulation',
      },

      Aquarian: {
        batterHead: 'Aquarian Texture Coated',

        resonantHead: 'Aquarian Classic Clear Snare Side',

        snareWires: 'PureSound Custom Pro 20-Strand',

        studioMicPairing: 'Dynamic top mic + warm condenser room capture',
      },
    };

    return (
      picksByBrand[headBrand] || {
        batterHead: 'Remo Controlled Sound Coated',

        resonantHead: 'Remo Ambassador Snare Side',

        snareWires: 'PureSound Custom Pro 20-Strand',

        studioMicPairing: 'Shure SM57 top + KM184 shell-side room support',
      }
    );
  }, [headBrand]);

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

  const activeAxisCopySet =
    AXIS_INSIGHT_COPY[activeAxisKey] || AXIS_INSIGHT_COPY.attack;

  const activeAxisCopy =
    activeAxisDeltaValue >= 0
      ? activeAxisCopySet.higher
      : activeAxisCopySet.lower;

  const activeAxisScaleRead =
    AXIS_SCALE_READ_COPY[activeAxisKey] || AXIS_SCALE_READ_COPY.attack;

  const activeAxisColor = AXIS_COLOR_BY_KEY[activeAxisKey] || '#d6b277';

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

      snareWireModel: 'Craftsman-selected PureSound',

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

        snareWireModel: 'Craftsman-selected PureSound',
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
      nextStaves.find((s) => !s.includes('Re-Rings')) || nextStaves[0] || '';

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
      nextStaves.find((s) => !s.includes('Re-Rings')) || nextStaves[0] || '';

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
                <p className="heritage-story-lede">
                  The Heritage line carries the most rooted side of the Ober
                  voice — warm, seasoned, tactile, and timeless.
                </p>

                <p className="heritage-story-copy">
                  Built around Northern Red Oak stave construction and shaped
                  with a classic bearing-edge profile, HERITAGE is designed for
                  players who want organic feel, grounded body, and a drum that
                  sounds deeply played-in from the first stroke.
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
                Build your Heritage in three guided steps: shape your
                foundation, choose your finish, then refine your hardware.
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

                    <div className="heritage-option-grid heritage-option-grid-compact">
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

                    <div className="heritage-option-grid heritage-option-grid-compact">
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

                    <div className="heritage-option-grid">
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
                      PureSound snare wires are selected by the craftsman to fit
                      the build.
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

          {/* <section className="heritage-config-info-card">

    <div className="heritage-config-info-head">

      <span className="heritage-summary-kicker">Build Character</span>

      <h3>Configuration context</h3>

    </div>

    <div className="heritage-config-support heritage-config-support--standalone">

      <div className="heritage-voice-read-item heritage-voice-read-item--grouped">

        <span className="heritage-summary-label">Musical Fit</span>

        <div className="heritage-voice-read-pair-list">

          <div className="heritage-voice-read-pair-row">

            <span className="heritage-voice-read-mini-label">

              Primary Genre

            </span>

            <span className="heritage-summary-value">

              {selectedDrumSummary?.primaryGenre}

            </span>

          </div>

          <div className="heritage-voice-read-pair-row">

            <span className="heritage-voice-read-mini-label">

              Secondary Lanes

            </span>

            <span className="heritage-summary-value">

              {Array.isArray(selectedDrumSummary?.secondaryGenres)

                ? selectedDrumSummary.secondaryGenres.join(' • ')

                : ''}

            </span>

          </div>

        </div>

      </div>

      <div className="heritage-voice-read-item heritage-voice-read-item--grouped">

        <span className="heritage-summary-label">Studio / Use Case</span>

        <div className="heritage-voice-read-pair-list">

          <div className="heritage-voice-read-pair-row">

            <span className="heritage-voice-read-mini-label">

              Craftsman’s Studio Mic Pairing

            </span>

            <span className="heritage-summary-value">

              {selectedDrumSummary?.recordingMic}

            </span>

          </div>

          <div className="heritage-voice-read-pair-row">

            <span className="heritage-voice-read-mini-label">

              Playing Situation

            </span>

            <span className="heritage-summary-value">

              {selectedDrumSummary?.playingSituation}

            </span>

          </div>

        </div>

      </div>

      <div className="heritage-voice-read-item heritage-voice-read-item--grouped">

        <span className="heritage-summary-label">Feel / Visual Lean</span>

        <p className="heritage-source-build-feature-copy">

          {selectedDrumSummary?.feelRead}

        </p>

      </div>

    </div>

  </section> */}

          <section className="heritage-voice-panel heritage-voice-read-card heritage-voice-read-card--reworked">
            <div className="heritage-voice-read-header">
              <span className="heritage-summary-kicker">
                LegacyPrint™ Voice Comparison
              </span>

              <p className="heritage-read-summary">
                Compare your current Heritage build against a reference drum to
                see how its response shifts across the core sound metrics.
              </p>
            </div>

            <div className="heritage-chart-reference-shell heritage-chart-reference-shell--top">
              <div className="heritage-chart-reference-head">
                <span className="heritage-summary-kicker">Reference Drum</span>

                <p className="heritage-chart-reference-subcopy">
                  Choose the drum you want this build compared against. By
                  default, this comparison starts from the Heritage standard
                  reference: 14&quot; × 5.5&quot;, Northern Red Oak stave shell,
                  16 staves, 8 lugs, Triple Flange hoops, 45° inner edge with
                  softened outer roundover, and Medium Torch finish.
                </p>
              </div>

              <div
                className="heritage-benchmark-read heritage-benchmark-read--glow"
                key={benchmarkGlowPulseKey}
              >
                <div className="heritage-benchmark-hero">
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
                          onChange={(e) =>
                            handleBenchmarkSizeChange(e.target.value)
                          }
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

            <div className="heritage-chart-wrap heritage-chart-wrap--voice-read heritage-chart-wrap--benchmark-linked">
              <div className="heritage-chart-top-shell">
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

              <div className="heritage-chart-stage">
                {chartView === 'spider' ? (
                  <SpiderChart
                    data={chartValues}
                    labels={AXIS_META.map((axis) => axis.label)}
                    pointColors={AXIS_POINT_COLORS}
                    activeKey={activeAxisKey}
                    onAxisChange={handleAxisChange}
                    pulseKey={benchmarkGlowPulseKey}
                  />
                ) : (
                  <div className="heritage-bar-chart-connector-shell">
                    <div className="heritage-bar-chart-connector-line" />

                    <BarChart
                      data={chartBarData}
                      activeKey={activeAxisKey}
                      onAxisChange={handleAxisChange}
                      activeColor={activeAxisColor}
                      pulseKey={benchmarkGlowPulseKey}
                    />
                  </div>
                )}
              </div>

              <div
                className="heritage-axis-insight-card heritage-axis-insight-card--inside-chart"
                style={{
                  borderColor: `${activeAxisColor}44`,

                  boxShadow: `0 0 0 1px ${activeAxisColor}22, 0 0 28px ${activeAxisColor}18`,
                }}
              >
                <div className="heritage-axis-insight-head">
                  <div>
                    <span
                      className="heritage-axis-insight-kicker"
                      style={{ color: activeAxisColor }}
                    >
                      Metric Insight
                    </span>

                    <h4>{activeAxisMeta.label}</h4>
                  </div>

                  <div
                    className="heritage-axis-insight-score"
                    style={{
                      color: activeAxisColor,

                      borderColor: `${activeAxisColor}44`,

                      boxShadow: `0 0 18px ${activeAxisColor}16`,
                    }}
                  >
                    {activeAxisScore}
                  </div>
                </div>

                <p className="heritage-axis-insight-short">
                  {activeAxisCopy.short}
                </p>

                <p className="heritage-axis-insight-detail">
                  {activeAxisCopy.detail}
                </p>

                <details className="heritage-axis-insight-scale-read">
                  <summary className="heritage-axis-insight-scale-summary">
                    How to read this metric
                  </summary>

                  <div className="heritage-axis-insight-scale-body">
                    <p className="heritage-axis-insight-scale-copy">
                      <strong>Less than reference:</strong> This build leans
                      lower on {activeAxisMeta.label.toLowerCase()} than your
                      selected reference drum.
                    </p>

                    <p className="heritage-axis-insight-scale-copy">
                      <strong>At reference:</strong> This build lands very close
                      to your selected reference drum on{' '}
                      {activeAxisMeta.label.toLowerCase()}.
                    </p>

                    <p className="heritage-axis-insight-scale-copy">
                      <strong>More than reference:</strong> This build leans
                      higher on {activeAxisMeta.label.toLowerCase()} than your
                      selected reference drum.
                    </p>
                  </div>
                </details>
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
