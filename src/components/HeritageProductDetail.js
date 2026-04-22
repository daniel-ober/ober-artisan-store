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
    short: 'Fast front-end response with strong note definition.',

    detail:
      'This configuration speaks quickly and feels confident at the front of the note. Rimshots, accents, and tighter sticking come forward with more immediacy.',
  },

  sustain: {
    short: 'Controlled note length with a measured amount of bloom.',

    detail:
      'This build holds onto the note long enough to feel musical, but not so long that it gets away from you. It shapes a tail that feels usable rather than excessive.',
  },

  warmth: {
    short: 'A fuller, richer body through the center of the voice.',

    detail:
      'This configuration leans into depth and tonal weight. It gives the drum a more grounded center, helping strokes feel rounder and more seasoned.',
  },

  projection: {
    short: 'Clear outward push with confident room presence.',

    detail:
      'This build throws the note forward well and keeps its shape as it leaves the shell. It helps the drum feel present in the room without losing identity.',
  },

  brightness: {
    short: 'A measured amount of top-end edge and upper-register cut.',

    detail:
      'This controls how much sheen and upper snap sit on top of the drum’s core voice. Higher readings feel more open and cutting, while lower readings stay darker and more restrained.',
  },

  sensitivity: {
    short: 'Responsive to lighter playing and subtle dynamic detail.',

    detail:
      'This configuration reacts well to softer hands, lighter ghosting, and nuanced articulation. It rewards a more expressive touch and stays alive under lower playing pressure.',
  },

  control: {
    short: 'Shaped and contained in a way that feels easy to manage.',

    detail:
      'This build keeps the note organized and easier to place. Overtones feel more intentional, the response feels more disciplined, and the drum stays composed under stronger playing.',
  },
};

const AXIS_SCALE_READ_COPY = {
  attack: {
    lower:
      'Softer front-end response with a more relaxed note start. Strokes feel less immediate, and the drum may come across as rounder or more laid-back under the stick.',

    higher:
      'Faster front-end response with stronger note definition. Accents speak more quickly, the attack feels more assertive, and the drum cuts forward with greater immediacy.',
  },

  sustain: {
    lower:
      'Shorter note length with less bloom after the strike. The drum feels drier, more contained, and easier to keep tight in denser playing situations.',

    higher:
      'Longer note length with more bloom and hang after the strike. The drum feels more open, more resonant, and more likely to let the shell’s voice linger in the room.',
  },

  warmth: {
    lower:
      'Leaner low-mid body and less tonal weight in the center of the note. The drum may feel cleaner or more neutral, but with less of that deep, seasoned fullness.',

    higher:
      'Richer low-mid body and a fuller center to the note. The drum feels deeper, more grounded, and more substantial in a way that can feel bigger and more mature.',
  },

  projection: {
    lower:
      'Less outward push into the room, with a more contained sense of volume and spread. The drum may feel more intimate, controlled, or studio-friendly at lower projection levels.',

    higher:
      'Stronger outward push and clearer room presence. The drum carries more confidently, feels bigger in the space, and is more likely to hold its identity at a distance.',
  },

  brightness: {
    lower:
      'Darker top-end with less snap and less upper-register edge riding above the core note. The drum feels smoother, warmer, and more restrained on top.',

    higher:
      'More upper-register cut, sheen, and snap above the core voice. The drum feels more open, more present, and more likely to cut through with top-end clarity.',
  },

  sensitivity: {
    lower:
      'Less reaction to lighter touch and softer playing detail. The drum may ask for a firmer hand before ghost notes, brushes, or quieter articulation fully come alive.',

    higher:
      'Greater response to lighter touch, subtle phrasing, and lower playing pressure. The drum feels more alive under the hands and more rewarding in nuanced, dynamic playing.',
  },

  control: {
    lower:
      'A more open and less contained note shape, with more natural spread in the response. The drum may feel freer and more expressive, but less disciplined under heavier playing.',

    higher:
      'A more shaped, contained, and easier-to-manage note. The response feels more disciplined, overtones feel more intentional, and the drum stays composed more easily.',
  },
};

const clampAxis = (value) => {
  const num = Number(value || 0);

  if (Number.isNaN(num)) return 5;

  return Math.max(4, Math.min(10, Number(num.toFixed(2))));
};

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
  12: { 6: ['12 - 8mm'], 8: ['16 - 10mm'] },

  13: { 8: ['16 - 10mm'] },

  14: {
    8: ['16 - 10mm'],

    10: ['20 - 12mm', '10 - 7mm + $150 (Re-Rings Required)'],
  },
};

const lugOptions = {
  12: ['6', '8'],

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

  const [showSourceBuildRead, setShowSourceBuildRead] = useState(false);

  const [headBrand, setHeadBrand] = useState('Remo');

  const handleAxisChange = React.useCallback((nextKey) => {
    if (nextKey) setActiveAxisKey(nextKey);
  }, []);

  const productImage = useMemo(() => {
    return product?.images?.[0] || '/resized-logos/heritage-placeholder.png';
  }, [product]);

  const heritageHighlights = [
    'Northern Red Oak stave shell construction.',

    'Grounded, warm, seasoned Ober voice.',

    '45° inner edge with softened outer roundover.',

    '12", 13", and 14" build sizes.',

    '36 core Heritage voicing paths.',

    'Triple flange or die-cast response.',

    'Chrome, Black Nickel, or Brass / Gold hardware.',

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

  const buildLegacyVoiceRead = ({
    size: currentSize,

    depth: currentDepth,

    lugs: currentLugs,

    staveOption: currentStaveOption,

    hardwareColor: currentHardwareColor,

    hoopType: currentHoopType,

    scorchDepth: currentScorchDepth,

    heritageSummaryMatch,
  }) => {
    const numericSize = Number(currentSize || 12);

    const numericDepth = Number(currentDepth || 5);

    const hasReRing = hasReRingFromStaveOption(currentStaveOption);

    let profile = {
      attack: 7.6,

      sustain: 7.4,

      warmth: 8.4,

      projection: 7.8,

      brightness: 6.4,

      sensitivity: 7.4,

      control: 7.9,
    };

    if (numericDepth <= 5.5) {
      profile.attack += 0.2;

      profile.sustain -= 0.8;

      profile.sensitivity += 0.25;

      profile.control += 0.2;
    }

    if (numericDepth >= 6.5) {
      profile.sustain += 0.6;

      profile.warmth += 0.4;

      profile.projection += 0.3;

      profile.attack -= 0.1;
    }

    if (numericDepth >= 7) {
      profile.sustain += 0.4;

      profile.warmth += 0.35;

      profile.projection += 0.35;

      profile.sensitivity -= 0.15;
    }

    if (numericSize === 13) {
      profile.warmth += 0.25;

      profile.projection += 0.25;
    }

    if (numericSize === 14) {
      profile.warmth += 0.65;

      profile.projection += 0.75;

      profile.brightness -= 0.2;
    }

    if (currentLugs === '10') {
      profile.control += 0.45;

      profile.attack += 0.15;

      profile.sustain -= 0.15;

      profile.sensitivity -= 0.1;
    }

    if (hasReRing) {
      profile.control += 0.55;

      profile.projection += 0.2;

      profile.sustain += 0.1;
    }

    if (currentHoopType === 'Die-Cast') {
      profile.attack += 0.45;

      profile.control += 0.6;

      profile.brightness += 0.2;

      profile.sustain -= 0.35;

      profile.sensitivity -= 0.1;
    } else {
      profile.sustain += 0.15;

      profile.sensitivity += 0.1;
    }

    if (currentScorchDepth === 'Light Torch') {
      profile.brightness += 0.25;

      profile.attack += 0.1;

      profile.warmth -= 0.1;
    }

    if (currentScorchDepth === 'Medium Torch') {
      profile.warmth += 0.2;

      profile.control += 0.1;
    }

    if (currentScorchDepth === 'Blackened') {
      profile.warmth += 0.5;

      profile.control += 0.35;

      profile.brightness -= 0.35;

      profile.attack -= 0.1;
    }

    if (currentHardwareColor === 'Black Nickel') {
      profile.control += 0.1;

      profile.brightness += 0.05;
    }

    if (currentHardwareColor === 'Brass/Gold') {
      profile.warmth += 0.15;
    }

    profile.sensitivity += 0.2;

    profile.control += 0.12;

    profile = {
      attack: clampAxis(profile.attack),

      sustain: clampAxis(profile.sustain),

      warmth: clampAxis(profile.warmth),

      projection: clampAxis(profile.projection),

      brightness: clampAxis(profile.brightness),

      sensitivity: clampAxis(profile.sensitivity),

      control: clampAxis(profile.control),
    };

    const quickerBuild = numericDepth <= 5.5 && currentHoopType === 'Die-Cast';

    const deeperBuild = numericDepth >= 7;

    const darkerBuild =
      currentScorchDepth === 'Blackened' ||
      currentHardwareColor === 'Brass/Gold';

    let summary =
      'A balanced Heritage configuration with grounded warmth, natural body, and a classic response that stays tactile under the stick.';

    if (quickerBuild) {
      summary =
        'A quicker, tighter Heritage configuration with a more immediate response, shorter bloom, and a focused classic voice.';
    } else if (deeperBuild && darkerBuild) {
      summary =
        'A deeper, darker Heritage build with stronger body, richer low-mid bloom, and a more seasoned response under the stick.';
    } else if (deeperBuild) {
      summary =
        'A fuller Heritage configuration with deeper bloom, stronger body, and a broad, grounded voice that feels planted and mature.';
    }

    let primaryGenre = 'Roots • Session • Soul';

    if (numericDepth <= 5.5) primaryGenre = 'Jazz • Funk • Session';

    if (numericDepth >= 6.5) {
      primaryGenre = 'Americana • Rock • Singer-Songwriter';
    }

    if (numericDepth >= 7 && currentHoopType === 'Die-Cast') {
      primaryGenre = 'Alternative • Rock • Cinematic Session';
    }

    let recordingMic = 'Warm, natural overhead or close-mic pairing';

    if (numericSize <= 12) {
      recordingMic = 'Small-diaphragm condenser for articulation and balance';
    }

    if (numericSize >= 14 && numericDepth >= 6.5) {
      recordingMic = 'Ribbon or fuller-bodied condenser for weight and tone';
    }

    let playingSituation =
      'A balanced Heritage response with natural openness, strong body, and tactile rebound.';

    if (currentHoopType === 'Die-Cast') {
      playingSituation =
        'A more focused Heritage response with stronger note shape, quicker containment, and added front-end definition.';
    }

    let feelRead =
      'A clean, timeless configuration that keeps the focus on shell character and natural response.';

    if (currentHardwareColor === 'Black Nickel') {
      feelRead =
        'A slightly more modern visual lean wrapped around an otherwise classic Heritage voice.';
    }

    if (currentHardwareColor === 'Brass/Gold') {
      feelRead =
        'A richer, more elevated visual presentation that complements the warmer, more seasoned side of the Heritage line.';
    }

    if (currentScorchDepth === 'Blackened') {
      feelRead =
        'A darker, more dramatic finish direction that leans moodier and more heavily seasoned without losing the line’s classic identity.';
    }

    let secondaryGenres = ['Singer-Songwriter', 'Soul', 'Session Work'];

    if (currentHoopType === 'Die-Cast') {
      secondaryGenres = ['Alternative', 'Pop Session', 'Modern Roots'];
    }

    if (
      heritageSummaryMatch &&
      typeof heritageSummaryMatch.highlightedCharacteristics === 'string' &&
      heritageSummaryMatch.highlightedCharacteristics.trim()
    ) {
      summary = heritageSummaryMatch.highlightedCharacteristics;
    }

    return {
      highlightedCharacteristics: summary,

      primaryGenre,

      recordingMic,

      playingSituation,

      feelRead,

      secondaryGenres,

      profile,
    };
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

  const sourceBuildRead = useMemo(() => {
    const staveRead = `${staveOption}`;

    const hardwareRead =
      hardwareColor === 'Brass/Gold' ? 'Brass / Gold' : hardwareColor;

    return `${size}" x ${depth}" • ${lugs} lugs • ${staveRead} • Northern Red Oak • ${hardwareRead} • ${hoopType} • ${HERITAGE_STANDARD_SNARE_BED} snare bed • ${scorchDepth} exterior • ${HERITAGE_STANDARD_BEARING_EDGE} • Craftsman-selected PureSound wires`;
  }, [size, depth, lugs, staveOption, hardwareColor, hoopType, scorchDepth]);

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

  const activeAxisScore =
    selectedDrumSummary?.profile?.[activeAxisKey] != null
      ? Number(selectedDrumSummary.profile[activeAxisKey]).toFixed(1)
      : '5.0';

  const activeAxisCopy =
    AXIS_INSIGHT_COPY[activeAxisKey] || AXIS_INSIGHT_COPY.attack;

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

    const staveParts = staveOption.split(' - ');

    const staveThickness =
      staveParts[1]?.replace(' + $150 (Re-Rings Required)', '') || '';

    const lugCount = `${lugs} Lugs`;

    const generatedKey = `${size}" - Base Price: $${basePrices[size]}-${depth}"-${lugCount}-${staveThickness}`;

    const heritageSummaryMatch = heritageSummaries[generatedKey] || null;

    setSelectedDrumSummary(
      buildLegacyVoiceRead({
        size,

        depth,

        lugs,

        staveOption,

        hardwareColor,

        hoopType,

        scorchDepth,

        heritageSummaryMatch,
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

    const nextDepth = Object.keys(depthPrices[newSize])[0];

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
        <div className="heritage-product-content">
          <div className="heritage-product-visuals">
            <div className="heritage-product-image-card">
              <div className="heritage-product-image">
                <img src={productImage} alt="HERITAGE Snare Drum" />
              </div>
            </div>

            <div className="heritage-overview-card">
              <div className="heritage-overview-mark" />

              <p className="heritage-story-lede">
                The Heritage line carries the most rooted side of the Ober voice
                — warm, seasoned, tactile, and timeless.
              </p>

              <p className="heritage-story-copy">
                Built around Northern Red Oak stave construction and shaped with
                a classic bearing-edge profile, HERITAGE is designed for players
                who want organic feel, grounded body, and a drum that sounds
                deeply played-in from the first stroke.
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
                receive will closely reflect the design shown, but natural wood
                grain, torching, and exact visual character will vary based on
                your final configuration.
              </p>
            </div>
          </div>

          <aside className="heritage-builder-card">
            <div className="heritage-builder-head">
              <span className="heritage-builder-kicker">Build your drum</span>

              <h2>Configure Heritage</h2>

              <p>
                Build your Heritage in three guided steps: shape your
                foundation, choose your finish, then refine your hardware.
              </p>
            </div>

            <div className="heritage-builder-sections">
              <div className="heritage-builder-section">
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

                    <div>
                      <h3>Shape Your Foundation</h3>

                      <p>{constructionSummary}</p>
                    </div>
                  </div>

                  <span className="heritage-builder-section-chevron">
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

                        return (
                          <button
                            key={lugOption}
                            type="button"
                            className={`heritage-option-tile ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            onClick={() => handleLugSelect(lugOption)}
                          >
                            <span className="heritage-option-title">
                              {lugOption} Lugs
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

                    <label>Stave Quantity &amp; Shell Thickness</label>

                    <div className="heritage-option-grid">
                      {(staveOptions[size]?.[lugs] || []).map((option) => {
                        const isSelected = staveOption === option;

                        const deltaMeta = getOptionDeltaMeta({
                          staveOption: option,
                        });

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
                              {getStaveThicknessLabel(option)}

                              {hasReRingFromStaveOption(option)
                                ? ' • Re-Rings required'
                                : ''}
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

                    <div className="heritage-builder-next-row">
                      <button
                        type="button"
                        className="heritage-builder-next-button"
                        onClick={() => setOpenBuilderSection('finish')}
                      >
                        Continue to Finish
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="heritage-builder-section">
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

                    <div>
                      <h3>Choose Your Finish</h3>

                      <p>{finishSummary}</p>
                    </div>
                  </div>

                  <span className="heritage-builder-section-chevron">
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
                        className="heritage-builder-next-button"
                        onClick={() => setOpenBuilderSection('hardware')}
                      >
                        Continue to Hardware
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="heritage-builder-section">
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

                    <div>
                      <h3>Refine Your Hardware</h3>

                      <p>{hardwareSummary}</p>
                    </div>
                  </div>

                  <span className="heritage-builder-section-chevron">
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
                      Heritage uses a standard snare bed and a fixed
                      Heritage-standard bearing edge to keep the line grounded,
                      consistent, and unmistakably classic.
                    </p>

                    <p className="heritage-select-helper">
                      PureSound snare wires are selected by the craftsman to fit
                      the build.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="heritage-purchase-block">
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
            </div>
          </aside>
        </div>

        <section className="heritage-summary-band heritage-summary-band--voice-read">
          <div className="heritage-voice-read-card">
            <div className="heritage-chart-head heritage-chart-head--voice-read">
              <div>
                <span className="heritage-summary-kicker">
                  Ober LegacyPrint™ Voice Read
                </span>

                <h3>Configuration snapshot</h3>

                <p className="heritage-read-summary">
                  {selectedDrumSummary?.highlightedCharacteristics}
                </p>
              </div>

              <div className="heritage-chart-toggle">
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

            <div className="heritage-voice-read-split">
              <div className="heritage-voice-read-chart-column">
                <div className="heritage-chart-wrap heritage-chart-wrap--voice-read">
                  {chartView === 'spider' ? (
                    <SpiderChart
                      data={chartValues}
                      labels={AXIS_META.map((axis) => axis.label)}
                      pointColors={AXIS_POINT_COLORS}
                      activeKey={activeAxisKey}
                      onAxisChange={handleAxisChange}
                    />
                  ) : (
                    <BarChart
                      data={chartBarData}
                      min={4}
                      activeKey={activeAxisKey}
                      onAxisChange={handleAxisChange}
                      activeColor={activeAxisColor}
                    />
                  )}
                </div>

                <div
                  className="heritage-axis-insight-card"
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

                  <div className="heritage-axis-insight-scale-read">
                    <span className="heritage-axis-insight-scale-label">
                      How to read this metric
                    </span>

                    <p className="heritage-axis-insight-scale-copy">
                      <strong>Lower / closer to center:</strong>{' '}
                      {activeAxisScaleRead.lower}
                    </p>

                    <p className="heritage-axis-insight-scale-copy">
                      <strong>Higher / farther outward:</strong>{' '}
                      {activeAxisScaleRead.higher}
                    </p>
                  </div>
                </div>
              </div>

              <div className="heritage-voice-read-info-column">
                <div className="heritage-voice-read-stack">
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
                    <span className="heritage-summary-label">
                      Studio / Use Case
                    </span>

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
                    <span className="heritage-summary-label">
                      Feel / Visual Lean
                    </span>

                    <p className="heritage-source-build-feature-copy">
                      {selectedDrumSummary?.feelRead}
                    </p>
                  </div>

                  <div className="heritage-voice-read-item heritage-voice-read-item--grouped">
                    <span className="heritage-summary-label">
                      Ober Craftsman’s Picks
                    </span>

                    <div
                      className="heritage-head-brand-toggle"
                      role="group"
                      aria-label="Head brand"
                    >
                      {['Remo', 'Evans', 'Aquarian'].map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          className={`heritage-head-brand-button ${
                            headBrand === brand ? 'is-active' : ''
                          }`}
                          onClick={() => setHeadBrand(brand)}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>

                    <div className="heritage-voice-read-pair-list">
                      <div className="heritage-voice-read-pair-row">
                        <span className="heritage-voice-read-mini-label">
                          Batter Head
                        </span>

                        <span className="heritage-summary-value">
                          {craftsmenPicks.batterHead}
                        </span>
                      </div>

                      <div className="heritage-voice-read-pair-row">
                        <span className="heritage-voice-read-mini-label">
                          Resonant Head
                        </span>

                        <span className="heritage-summary-value">
                          {craftsmenPicks.resonantHead}
                        </span>
                      </div>

                      <div className="heritage-voice-read-pair-row">
                        <span className="heritage-voice-read-mini-label">
                          PureSound Wires
                        </span>

                        <span className="heritage-summary-value">
                          {craftsmenPicks.snareWires}
                        </span>
                      </div>

                      <div className="heritage-voice-read-pair-row">
                        <span className="heritage-voice-read-mini-label">
                          Studio Mic Pairing
                        </span>

                        <span className="heritage-summary-value">
                          {craftsmenPicks.studioMicPairing}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="heritage-source-build-shell">
                  <button
                    type="button"
                    className={`heritage-source-build-toggle ${
                      showSourceBuildRead ? 'is-open' : ''
                    }`}
                    onClick={() => setShowSourceBuildRead((prev) => !prev)}
                  >
                    <div className="heritage-source-build-toggle-main">
                      {/* <span
                        className="heritage-source-build-eye"
                        aria-hidden="true"
                      >
                        👁
                      </span> */}

                      <div>
                        <span className="heritage-source-build-label">
                          Based on Your Selections
                        </span>

                        <span className="heritage-source-build-subcopy">
                          View the build inputs currently shaping this
                          LegacyPrint™ read.
                        </span>
                      </div>
                    </div>

                    <span className="heritage-source-build-toggle-state">
                      {showSourceBuildRead ? 'Hide' : 'View'}
                    </span>
                  </button>

                  {showSourceBuildRead && (
                    <div className="heritage-source-build-panel">
                      <p className="heritage-source-build-read">
                        {sourceBuildRead}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HeritageProductDetail;
