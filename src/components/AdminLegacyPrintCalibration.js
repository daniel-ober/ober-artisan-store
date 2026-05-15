// src/components/AdminLegacyPrintCalibration.js

import React, { useEffect, useMemo, useState } from 'react';

import BarChart from './BarChart';

// SpiderChart temporarily disabled here because its animation/axis-position

// effect is causing a maximum update depth loop inside AdminLegacyPrintCalibration.

import VoiceThreadMap from './VoiceThreadMap';

import AdminLegacyPrintSelector from './AdminLegacyPrintSelector';

import LegacyPrintAdminSlider from './LegacyPrintAdminSlider';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../firebaseConfig';

import {
  LEGACYPRINT_NODE_LABELS,
  LEGACYPRINT_NODE_ORDER,
  legacyPrintCalibrationSeed,
} from '../data/legacyPrintCalibrationSeed';

import './AdminLegacyPrintCalibration.css';

const LEGACYPRINT_CALIBRATION_COLLECTION = 'legacyprint_calibrations';

const LEGACYPRINT_ACTIVE_DOC_ID = 'active';

const LEGACYPRINT_DRAFT_DOC_ID = 'draft';

const LEGACYPRINT_TABS = [
  'Overview',

  'Voice Preview',

  'Master Weights',

  'Benchmarks',

  'Config Options',

  'Availability',

  'SoundLegend Builder',

  'FEUZØN Builder',

  'Visibility',

  'Versions',
];

const SELECTOR_FIELDS = [
  {
    key: 'comparisonMode',

    label: 'Comparison Mode',

    source: 'comparisonModes',
  },

  {
    key: 'drumType',

    label: 'Drum Type',

    source: 'drumType',
  },

  {
    key: 'construction',

    label: 'Construction / Ober Line',

    source: 'construction',
  },

  {
    key: 'diameter',

    label: 'Diameter',

    source: 'diameter',
  },

  {
    key: 'depth',

    label: 'Depth',

    source: 'depth',
  },

  {
    key: 'thickness',

    label: 'Thickness',

    source: 'thickness',
  },

  {
    key: 'finish',

    label: 'Finish Type',

    source: 'finish',
  },

  {
    key: 'hoopType',

    label: 'Hoop Type',

    source: 'hoopType',
  },

  {
    key: 'bearingEdge',

    label: 'Bearing Edge',

    source: 'bearingEdge',
  },

  {
    key: 'snareBed',

    label: 'Snare Bed Depth',

    source: 'snareBed',
  },

  {
    key: 'tension',

    label: 'Tension Setting',

    source: 'tension',
  },

  {
    key: 'snareWires',

    label: 'Snare Wire Option',

    source: 'snareWires',
  },

  {
    key: 'batterHead',

    label: 'Batter Head Option',

    source: 'batterHead',
  },

  {
    key: 'resoHead',

    label: 'Reso Head Option',

    source: 'resoHead',
  },
];

const BRAND_FILTER_OPTIONS = [
  'Ober Artisan',

  'Tama',

  'Pearl',

  'Mapex',

  'Gretsch',

  'DW',

  'Ludwig',

  'Yamaha',

  'Sonor',

  'Other',
];

const OBER_LINE_FILTER_OPTIONS = [
  'Ober HERITAGE Stave',

  'Ober FEUZØN Hybrid',

  'Ober SOUNDLEGEND Custom',
];

const SHELL_TYPE_FILTER_OPTIONS = [
  'All',

  'Stave',

  'Hybrid',

  'Steam Bent',

  'Solid',

  'Ply',

  'Metal',

  'Acrylic',

  'Other',
];

const HYBRID_TYPE_OPTIONS = [
  'Stave',

  'Steam Bent',

  'Solid',

  'Ply',

  'Metal',

  'Acrylic',

  'Other',
];

const OBER_SNARE_ONLY_LINES = ['Ober HERITAGE Stave', 'Ober FEUZØN Hybrid'];

const DRUM_TYPE_FILTER_OPTIONS = [
  'Snare',

  'Rack Tom',

  'Floor Tom',

  'Bass Drum',

  'Concert Tom',
];

const DRUM_TYPE_FILTER_OPTIONS_WITH_ALL = ['All', ...DRUM_TYPE_FILTER_OPTIONS];

const CONFIG_CATEGORY_LABELS = {
  drumType: 'Drum Type',

  construction: 'Construction',

  diameter: 'Diameter',

  depth: 'Depth',

  soundLegendDepthFine: 'SoundLegend Fine Depth',

  thickness: 'Thickness',

  finish: 'Finish',

  hoopType: 'Hoop Type',

  bearingEdge: 'Bearing Edge',

  snareBed: 'Snare Bed',

  tension: 'Tension',

  snareWires: 'Snare Wires',

  batterHead: 'Batter Head',

  resoHead: 'Reso Head',
};

const CONFIG_CATEGORY_ORDER = [
  'drumType',

  'construction',

  'diameter',

  'depth',

  'thickness',

  'finish',

  'hoopType',

  'bearingEdge',

  'snareBed',

  'tension',

  'snareWires',

  'batterHead',

  'resoHead',
];

const OBER_SNARE_ONLY_CONSTRUCTIONS = [
  'Ober HERITAGE Stave',

  'Ober FEUZØN Hybrid',

  'Ober SOUNDLEGEND Custom',
];

const CONSTRUCTION_ASSIGNMENT_OPTIONS = [
  'All',

  'Ober HERITAGE Stave',

  'Ober FEUZØN Hybrid',

  'Ober SOUNDLEGEND Custom',

  'Generic Ply Shell',

  'Generic Metal Shell',
];

const DEFAULT_NEW_CONFIG_OPTION = {
  option: '',

  appliesTo: 'All',

  appliesToConstructions: 'All',

  allowedDiameters: 'All',

  allowedDepths: 'All',

  attack: 0,

  brightness: 0,

  projection: 0,

  sustain: 0,

  warmth: 0,

  sensitivity: 0,

  control: 0,

  notes: '',
};

const INITIAL_SELECTOR = {
  comparisonMode: 'Single Drum Type Benchmark',

  drumType: 'Snare',

  construction: 'Ober HERITAGE Stave',

  diameter: '14 in',

  depth: '5.0 in',

  thickness: '15mm Heavy',

  finish: 'Ober Medium Torch',

  hoopType: 'Triple Flange',

  bearingEdge: '45° Inner / Soft Outer Roundover',

  snareBed: 'Standard',

  tension: 'Medium',

  snareWires: '20-strand',

  batterHead: 'Coated 1-ply',

  resoHead: 'Snare Side Clear',
};

const HERITAGE_SNARE_DIAMETERS = ['12 in', '13 in', '14 in'];

const FEUZON_SNARE_DIAMETERS = ['12 in', '13 in', '14 in', '15 in'];

const OBER_SNARE_DEPTHS = [
  '5.0 in',

  '5.5 in',

  '6.0 in',

  '6.5 in',

  '7.0 in',

  '7.5 in',

  '8.0 in',
];

const HERITAGE_THICKNESS_BY_DIAMETER = {
  '12 in': ['7mm Thin', '11mm Medium', '15mm Heavy'],

  '13 in': ['8mm Thin', '12mm Medium', '15mm Heavy'],

  '14 in': [
    '7mm Thin',

    '8mm Thin',

    '11mm Medium',

    '12mm Medium',

    '13mm Heavy',

    '15mm Heavy',
  ],
};

const FEUZON_THICKNESS_OPTIONS = ['10mm Medium', '12mm Thick', '13mm Heavy'];

const OBER_HOOP_OPTIONS = ['Triple Flange', 'Die Cast'];

const FEUZON_BEARING_EDGE_OPTIONS = [
  'Balanced Hybrid Edge',

  'Warm Hybrid Edge',

  'Modern Precision Edge',
];

const SOUNDLEGEND_BEARING_EDGE_OPTIONS = [
  'Balanced Hybrid Edge',

  'Warm Hybrid Edge',

  'Modern Precision Edge',

  '45° Inner / Soft Outer Roundover',
];

const HERITAGE_BEARING_EDGE_OPTIONS = ['45° Inner / Soft Outer Roundover'];

const FEUZON_SNARE_BED_OPTIONS = ['Standard', 'Shallow', 'Deep'];

const SOUNDLEGEND_SNARE_BED_OPTIONS = ['Standard', 'Shallow', 'Deep'];

const HERITAGE_SNARE_BED_OPTIONS = ['Standard'];

const toTitleCase = (value) => {
  return String(value || '')
    .replace(/([A-Z])/g, ' $1')

    .replace(/^./, (char) => char.toUpperCase())

    .trim();
};

const round = (value, places = 2) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return Number(number.toFixed(places));
};

const clamp = (value, min, max) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.max(min, Math.min(max, number));
};

const normalizeText = (value = '') => {
  return String(value || '')
    .toLowerCase()

    .replace(/[øØ]/g, 'o')

    .replace(/[^a-z0-9]+/g, ' ')

    .trim();
};

const isSoundLegendConstruction = (construction = '') => {
  return normalizeText(construction).includes('soundlegend');
};

const isFeuzonConstruction = (construction = '') => {
  return normalizeText(construction).includes('feuzon');
};

const isHeritageConstruction = (construction = '') => {
  return normalizeText(construction).includes('heritage');
};

const isOberSnareOnlyLine = (line = '') => {
  return OBER_SNARE_ONLY_LINES.some(
    (item) => normalizeText(item) === normalizeText(line)
  );
};

const isSoundLegendLine = (line = '') => {
  return normalizeText(line).includes('soundlegend');
};

const getAllowedDrumTypeOptionsForLine = (line = '') => {
  if (isOberSnareOnlyLine(line)) {
    return ['Snare'];
  }

  return DRUM_TYPE_FILTER_OPTIONS;
};

const getRowsForCategory = (calibration, categoryKey) => {
  return calibration?.configOptions?.[categoryKey] || [];
};

const getTypeBenchmark = (calibration, drumType, node) => {
  return (calibration?.typeBenchmarks || []).find(
    (row) => row.drumType === drumType && row.node === node
  );
};

const getMasterWeight = (calibration, node) => {
  return (calibration?.masterWeights || []).find((row) => row.node === node);
};

const getConfigOption = (calibration, categoryKey, option) => {
  return getRowsForCategory(calibration, categoryKey).find(
    (row) => row.option === option
  );
};

const getComparisonMode = (calibration, comparisonMode) => {
  return (
    (calibration?.comparisonModes || []).find(
      (mode) => mode.option === comparisonMode
    ) || calibration?.comparisonModes?.[0]
  );
};

const getAllowedList = (value = '') => {
  return String(value || '')
    .split(',')

    .map((item) => item.trim())

    .filter(Boolean);
};

const appliesToIncludes = (appliesTo = '', value = '') => {
  const raw = String(appliesTo || '').trim();

  if (!raw || !value) return false;

  if (raw === 'All') return true;

  const normalizedValue = normalizeText(value);

  return getAllowedList(raw)
    .map((item) => normalizeText(item))

    .includes(normalizedValue);
};

const constructionIncludes = (row, construction) => {
  const appliesToConstruction = String(row.appliesToConstructions || '').trim();

  return (
    appliesToConstruction === 'All' ||
    !appliesToConstruction ||
    appliesToIncludes(appliesToConstruction, construction)
  );
};

const getBaseRowsByDrumType = (calibration, categoryKey, drumType) => {
  return getRowsForCategory(calibration, categoryKey).filter((row) => {
    const appliesTo = String(row.appliesTo || '').trim();

    return appliesTo === 'All' || appliesToIncludes(appliesTo, drumType);
  });
};

const getConfigCategoryKeys = (calibration) => {
  const availableKeys = Object.keys(calibration?.configOptions || {});

  return CONFIG_CATEGORY_ORDER.filter((key) => {
    if (key === 'soundLegendDepthFine') return false;

    return availableKeys.includes(key);
  });
};

const getDisplayRowsForConfigCategory = (calibration, categoryKey) => {
  if (categoryKey === 'depth') {
    const standardDepthRows = getRowsForCategory(calibration, 'depth').map(
      (row) => ({
        ...row,

        __categoryKey: 'depth',
      })
    );

    const soundLegendFineRows = getRowsForCategory(
      calibration,

      'soundLegendDepthFine'
    ).map((row) => ({
      ...row,

      __categoryKey: 'soundLegendDepthFine',

      __displayGroup: 'SoundLegend Fine Depth',
    }));

    return [...standardDepthRows, ...soundLegendFineRows].sort((a, b) => {
      return Number.parseFloat(a.option) - Number.parseFloat(b.option);
    });
  }

  return getRowsForCategory(calibration, categoryKey).map((row) => ({
    ...row,

    __categoryKey: categoryKey,
  }));
};

const rowMatchesDrumTypeFilter = (
  row,

  selectedDrumType,

  selectedConstruction
) => {
  const isOberSnareOnlyLine = OBER_SNARE_ONLY_CONSTRUCTIONS.some(
    (construction) =>
      normalizeText(construction) === normalizeText(selectedConstruction)
  );

  if (isOberSnareOnlyLine) {
    return appliesToIncludes(row.appliesTo, 'Snare');
  }

  if (!selectedDrumType || selectedDrumType === 'All') return true;

  const appliesTo = String(row.appliesTo || '').trim();

  if (!appliesTo || appliesTo === 'All') return true;

  return appliesToIncludes(appliesTo, selectedDrumType);
};

const rowMatchesConstructionFilter = (row, selectedConstruction) => {
  if (!selectedConstruction || selectedConstruction === 'All') return true;

  return constructionIncludes(row, selectedConstruction);
};

const buildBlankConfigOption = (categoryKey) => {
  const base = {
    ...DEFAULT_NEW_CONFIG_OPTION,
  };

  if (categoryKey === 'drumType') {
    base.appliesTo = 'All';

    base.appliesToConstructions = 'All';
  }

  if (categoryKey === 'construction') {
    base.appliesTo = 'Snare';

    base.appliesToConstructions = 'All';
  }

  if (categoryKey === 'depth') {
    base.appliesTo = 'Snare';

    base.appliesToConstructions = 'All';
  }

  if (categoryKey === 'finish') {
    base.appliesTo = 'All';

    base.appliesToConstructions = 'All';
  }

  if (
    categoryKey === 'bearingEdge' ||
    categoryKey === 'snareBed' ||
    categoryKey === 'snareWires' ||
    categoryKey === 'batterHead' ||
    categoryKey === 'resoHead'
  ) {
    base.appliesTo = 'Snare';
  }

  return base;
};

const getSelectorOptions = ({ calibration, field, selector }) => {
  const safeCalibration = calibration || legacyPrintCalibrationSeed;

  if (!field) return [];

  if (field.source === 'comparisonModes') {
    return (safeCalibration.comparisonModes || []).map((mode) => mode.option);
  }

  if (field.source === 'drumType') {
    return getRowsForCategory(safeCalibration, 'drumType').map(
      (row) => row.option
    );
  }

  if (field.source === 'construction') {
    if (!selector.drumType) return [];

    return getRowsForCategory(safeCalibration, 'construction')
      .filter((row) => appliesToIncludes(row.appliesTo, selector.drumType))

      .map((row) => row.option);
  }

  if (!selector.drumType || !selector.construction) {
    return [];
  }

  if (field.source === 'diameter') {
    if (
      isHeritageConstruction(selector.construction) &&
      selector.drumType === 'Snare'
    ) {
      return HERITAGE_SNARE_DIAMETERS;
    }

    if (
      isFeuzonConstruction(selector.construction) &&
      selector.drumType === 'Snare'
    ) {
      return FEUZON_SNARE_DIAMETERS;
    }

    return getBaseRowsByDrumType(
      safeCalibration,

      'diameter',

      selector.drumType
    )
      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'depth') {
    if (
      (isHeritageConstruction(selector.construction) ||
        isFeuzonConstruction(selector.construction)) &&
      selector.drumType === 'Snare'
    ) {
      return OBER_SNARE_DEPTHS;
    }

    const standardDepths = getBaseRowsByDrumType(
      safeCalibration,

      'depth',

      selector.drumType
    )
      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);

    const fineDepths = isSoundLegendConstruction(selector.construction)
      ? getBaseRowsByDrumType(
          safeCalibration,

          'soundLegendDepthFine',

          selector.drumType
        ).map((row) => row.option)
      : [];

    return [...standardDepths, ...fineDepths].sort((a, b) => {
      return Number.parseFloat(a) - Number.parseFloat(b);
    });
  }

  if (field.source === 'thickness') {
    if (isHeritageConstruction(selector.construction)) {
      return HERITAGE_THICKNESS_BY_DIAMETER[selector.diameter] || [];
    }

    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_THICKNESS_OPTIONS;
    }

    return getBaseRowsByDrumType(
      safeCalibration,

      'thickness',

      selector.drumType
    )
      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'finish') {
    return getRowsForCategory(safeCalibration, 'finish')
      .filter((row) => {
        const appliesTo = String(row.appliesTo || '').trim();

        return (
          appliesTo === 'All' ||
          appliesToIncludes(appliesTo, selector.construction) ||
          appliesToIncludes(appliesTo, selector.drumType)
        );
      })

      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'hoopType') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction)
    ) {
      return OBER_HOOP_OPTIONS;
    }

    return getBaseRowsByDrumType(
      safeCalibration,

      'hoopType',

      selector.drumType
    )
      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'bearingEdge') {
    if (selector.drumType !== 'Snare') return [];

    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_BEARING_EDGE_OPTIONS;
    }

    if (isSoundLegendConstruction(selector.construction)) {
      return SOUNDLEGEND_BEARING_EDGE_OPTIONS;
    }

    if (isHeritageConstruction(selector.construction)) {
      return HERITAGE_BEARING_EDGE_OPTIONS;
    }

    return getRowsForCategory(safeCalibration, 'bearingEdge')
      .filter((row) => {
        const appliesTo = String(row.appliesTo || '').trim();

        return appliesTo === 'All' || appliesToIncludes(appliesTo, 'Snare');
      })

      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'snareBed') {
    if (selector.drumType !== 'Snare') return [];

    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_SNARE_BED_OPTIONS;
    }

    if (isSoundLegendConstruction(selector.construction)) {
      return SOUNDLEGEND_SNARE_BED_OPTIONS;
    }

    if (isHeritageConstruction(selector.construction)) {
      return HERITAGE_SNARE_BED_OPTIONS;
    }

    return getRowsForCategory(safeCalibration, 'snareBed')
      .filter((row) => {
        const appliesTo = String(row.appliesTo || '').trim();

        return appliesTo === 'All' || appliesToIncludes(appliesTo, 'Snare');
      })

      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'snareWires') {
    if (selector.drumType !== 'Snare') return [];

    return getRowsForCategory(safeCalibration, 'snareWires')
      .filter((row) => appliesToIncludes(row.appliesTo, 'Snare'))

      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  return getBaseRowsByDrumType(
    safeCalibration,

    field.source,

    selector.drumType
  )
    .filter((row) => constructionIncludes(row, selector.construction))

    .map((row) => row.option);
};

const normalizeSelectorForAvailableOptions = (selector, calibration) => {
  const next = { ...selector };

  SELECTOR_FIELDS.forEach((field) => {
    const options = getSelectorOptions({
      calibration,

      field,

      selector: next,
    });

    if (!options.length) {
      next[field.key] = '';

      return;
    }

    if (!options.includes(next[field.key])) {
      next[field.key] = options[0];
    }
  });

  return next;
};

const resolveOptionRow = (calibration, categoryKey, option, selector) => {
  if (categoryKey === 'depth') {
    return (
      getConfigOption(calibration, 'depth', option) ||
      (isSoundLegendConstruction(selector.construction)
        ? getConfigOption(calibration, 'soundLegendDepthFine', option)
        : null)
    );
  }

  return getConfigOption(calibration, categoryKey, option);
};

const getFirstListenWhy = (node) => {
  if (node === 'attack') return 'transient crack and initial stick edge';

  if (node === 'brightness') {
    return 'top-end crack, shell/head clarity, perceived pitch';
  }

  if (node === 'projection') return 'forward carry and room presence';

  if (node === 'sustain') return 'open bloom and pitch decay';

  if (node === 'warmth') return 'low-mid body and roundness';

  if (node === 'sensitivity') {
    return 'ghost-note translation and low-dynamic response';
  }

  return 'focus, dryness, and contained response';
};

const getFirstListenRoleLabel = (index) => {
  if (index === 0) return 'Primary';

  if (index === 1) return 'Secondary';

  return 'Supporting';
};

const buildVoicePreview = (selector, calibration) => {
  const comparisonMode = getComparisonMode(
    calibration,

    selector.comparisonMode
  );

  const configDifferentialFactor =
    comparisonMode?.configDifferentialFactor || 1;

  const categorySelections = [
    ['drumType', selector.drumType],

    ['construction', selector.construction],

    ['diameter', selector.diameter],

    ['depth', selector.depth],

    ['thickness', selector.thickness],

    ['finish', selector.finish],

    ['hoopType', selector.hoopType],

    ['bearingEdge', selector.bearingEdge],

    ['snareBed', selector.snareBed],

    ['tension', selector.tension],

    ['snareWires', selector.snareWires],

    ['batterHead', selector.batterHead],

    ['resoHead', selector.resoHead],
  ];

  const playerValues = {};

  const firstListenRows = [];

  LEGACYPRINT_NODE_ORDER.forEach((node) => {
    const benchmark = getTypeBenchmark(calibration, selector.drumType, node);

    const master = getMasterWeight(calibration, node);

    const neutral = benchmark?.neutral ?? 5;

    const typeFirstListenMultiplier = benchmark?.firstListenMultiplier ?? 1;

    const playerMultiplier = master?.playerAnalysisMultiplier ?? 1;

    const masterFirstListenMultiplier = master?.firstListenMultiplier ?? 1;

    const movementMultiplier = master?.movementMultiplier ?? 1;

    const configMovement = categorySelections.reduce(
      (sum, [categoryKey, option]) => {
        const row = resolveOptionRow(
          calibration,

          categoryKey,

          option,

          selector
        );

        return sum + Number(row?.[node] || 0);
      },

      0
    );

    const adjustedMovement = configMovement * configDifferentialFactor;

    const playerValue = clamp(
      neutral + adjustedMovement * playerMultiplier,

      0,

      10
    );

    const rawMovement = Math.max(0, playerValue - neutral);

    const firstListenScore =
      rawMovement *
      typeFirstListenMultiplier *
      masterFirstListenMultiplier *
      movementMultiplier *
      1.45;

    playerValues[node] = round(playerValue, 2);

    firstListenRows.push({
      node,

      label: LEGACYPRINT_NODE_LABELS[node],

      playerValue: round(playerValue, 2),

      neutral,

      rawMovement: round(rawMovement, 2),

      typeFirstListenMultiplier,

      masterFirstListenMultiplier,

      movementMultiplier,

      firstListenScore: round(firstListenScore, 2),

      why: getFirstListenWhy(node),
    });
  });

  const sortedFirstListenRows = [...firstListenRows].sort(
    (a, b) => b.firstListenScore - a.firstListenScore
  );

  const firstListenTop = sortedFirstListenRows.slice(0, 3);

  const firstListenNodes = firstListenTop.map((row) => row.node);

  const firstListenProfile = LEGACYPRINT_NODE_ORDER.reduce((acc, node) => {
    acc[node] = 3.25;

    return acc;
  }, {});

  const strongestFirstListenScore = Math.max(
    firstListenTop[0]?.firstListenScore || 0,

    0.1
  );

  firstListenTop.forEach((row, index) => {
    const rankFloor = index === 0 ? 7.35 : index === 1 ? 6.55 : 5.95;

    const relativeStrength = clamp(
      row.firstListenScore / strongestFirstListenScore,

      0,

      1
    );

    const modeSpread =
      comparisonMode?.option === 'All Drum Type Comparison' ? 0.78 : 1.08;

    firstListenProfile[row.node] = round(
      clamp(
        rankFloor + row.firstListenScore * modeSpread + relativeStrength * 0.42,

        5.5,

        9.35
      ),

      2
    );
  });

  const strongestPlayerNode = [...LEGACYPRINT_NODE_ORDER].sort(
    (a, b) => playerValues[b] - playerValues[a]
  )[0];

  const centerHz = estimateCenterHz(selector);

  const hzLow = Math.round(centerHz * 0.88);

  const hzHigh = Math.round(centerHz * 1.18);

  return {
    comparisonMode,

    configDifferentialFactor,

    playerValues,

    spiderValues: LEGACYPRINT_NODE_ORDER.map((node) => playerValues[node]),

    firstListenRows,

    firstListenTop,

    firstListenNodes,

    firstListenProfile,

    firstListenThread: {
      id: `admin-first-listen-${comparisonMode?.option || 'mode'}-${firstListenNodes.join('-')}`,

      slotKey: 'simple',

      visualMode: 'triangle',

      title: firstListenTop.map((row) => row.label).join(' / '),

      nodes: firstListenNodes,

      score: firstListenTop[0]?.firstListenScore || 1,

      summary: `The drum is reading first as ${firstListenTop

        .map((row) => row.label.toLowerCase())

        .join(', ')}.`,
    },

    firstListenTitle: `${firstListenTop

      .map((row) => row.label)

      .join(' / ')} first impression`,

    firstListenDescription: `The drum is reading first as ${firstListenTop

      .map((row) => row.label.toLowerCase())

      .join(
        ', '
      )}. This First Listen read is movement-aware and benchmarked for the selected drum type.`,

    playerAnalysisTitle: `${LEGACYPRINT_NODE_LABELS[strongestPlayerNode]} led player feel`,

    playerAnalysisDescription: `A fuller build-and-feel read showing how this ${selector.drumType} responds across the seven LegacyPrint™ voice nodes. Strongest benchmarked node: ${LEGACYPRINT_NODE_LABELS[strongestPlayerNode]}.`,

    tuning: {
      centerHz,

      hzLow,

      hzHigh,

      noteWindow: getNoteWindow(centerHz),

      rangeLabel: `Current Range ${hzLow}–${hzHigh} Hz ${getNoteWindow(
        centerHz
      )} nearest note window`,
    },
  };
};

const estimateCenterHz = (selector) => {
  const diameter = Number.parseFloat(selector.diameter) || 14;

  const depth = Number.parseFloat(selector.depth) || 6;

  const tension =
    selector.tension === 'High' ? 1.12 : selector.tension === 'Low' ? 0.84 : 1;

  const drumTypeBase =
    selector.drumType === 'Snare'
      ? 347
      : selector.drumType === 'Rack Tom'
        ? 190
        : selector.drumType === 'Floor Tom'
          ? 110
          : selector.drumType === 'Bass Drum'
            ? 58
            : 160;

  const diameterFactor = 14 / diameter;

  const depthFactor = 6 / depth;

  return Math.round(drumTypeBase * diameterFactor * depthFactor * tension);
};

const getNoteWindow = (hz) => {
  if (hz >= 390) return 'F4+';

  if (hz >= 293) return 'D4–F4';

  if (hz >= 246) return 'B3–D4';

  if (hz >= 196) return 'G3–B3';

  if (hz >= 146) return 'D3–F#3';

  if (hz >= 98) return 'G2–B2';

  return 'E1–A2';
};

const LegacyPrintStatCard = ({ label, value, detail }) => (
  <div className="legacyprint-admin-stat">
    <span>{label}</span>

    <strong>{value}</strong>

    {detail && <small>{detail}</small>}
  </div>
);

const BuilderColumn = ({ title, items = [], limit = 12 }) => {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div>
      <h4>{title}</h4>

      {safeItems.slice(0, limit).map((option) => (
        <span key={option}>{option}</span>
      ))}

      {safeItems.length > limit && (
        <span className="legacyprint-builder-more">
          +{safeItems.length - limit} more
        </span>
      )}
    </div>
  );
};

const AdminNumberInput = ({ value, onChange, step = '0.01' }) => (
  <input
    type="number"
    step={step}
    value={Number.isFinite(Number(value)) ? value : 0}
    className="legacyprint-admin-weight-input"
    onChange={(event) => onChange(Number(event.target.value))}
  />
);

const getDefaultBenchmarkRow = ({ drumType, node }) => {
  return legacyPrintCalibrationSeed.typeBenchmarks.find(
    (row) => row.drumType === drumType && row.node === node
  );
};

const getDefaultConfigRow = ({ categoryKey, option }) => {
  const rows = legacyPrintCalibrationSeed.configOptions?.[categoryKey] || [];

  return rows.find((row) => row.option === option);
};

const getNodeValueMeaning = ({ node, value }) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return 'No modeled movement.';

  if (number <= -0.35) {
    return `${LEGACYPRINT_NODE_LABELS[node]} is being strongly reduced by this option.`;
  }

  if (number <= -0.12) {
    return `${LEGACYPRINT_NODE_LABELS[node]} is being moderately reduced by this option.`;
  }

  if (number < 0) {
    return `${LEGACYPRINT_NODE_LABELS[node]} is being slightly softened by this option.`;
  }

  if (number === 0) {
    return `${LEGACYPRINT_NODE_LABELS[node]} stays neutral for this option.`;
  }

  if (number < 0.12) {
    return `${LEGACYPRINT_NODE_LABELS[node]} is being slightly emphasized by this option.`;
  }

  if (number < 0.35) {
    return `${LEGACYPRINT_NODE_LABELS[node]} is being moderately emphasized by this option.`;
  }

  return `${LEGACYPRINT_NODE_LABELS[node]} is being strongly emphasized by this option.`;
};

const getBenchmarkMeaning = ({ key, value }) => {
  const number = Number(value);

  if (key === 'minExpected') {
    return `Lowest expected usable range: ${number.toFixed(1)}.`;
  }

  if (key === 'neutral') {
    return `Center/normal benchmark point: ${number.toFixed(1)}.`;
  }

  if (key === 'maxExpected') {
    return `Highest expected usable range: ${number.toFixed(1)}.`;
  }

  if (key === 'firstListenMultiplier') {
    if (number < 0.85) return 'Less likely to surface early in First Listen.';

    if (number > 1.15) return 'More likely to surface early in First Listen.';

    return 'Mostly neutral First Listen behavior.';
  }

  return '';
};

const rebalanceMasterWeightGroup = ({
  rows,

  changedNode,

  weightKey,

  nextValue,

  total = 7,
}) => {
  const clampedNextValue = clamp(Number(nextValue), 0.25, 1.75);

  const otherRows = rows.filter((row) => row.node !== changedNode);

  const remainingTotal = Math.max(0, total - clampedNextValue);

  const currentOtherTotal = otherRows.reduce(
    (sum, row) => sum + Number(row[weightKey] || 0),

    0
  );

  const evenFallback = otherRows.length
    ? round(remainingTotal / otherRows.length, 2)
    : 0;

  const nextRows = rows.map((row) => {
    if (row.node === changedNode) {
      return {
        ...row,

        [weightKey]: round(clampedNextValue, 2),
      };
    }

    const currentValue = Number(row[weightKey] || 0);

    const adjustedValue =
      currentOtherTotal > 0
        ? round((currentValue / currentOtherTotal) * remainingTotal, 2)
        : evenFallback;

    return {
      ...row,

      [weightKey]: clamp(adjustedValue, 0.25, 1.75),
    };
  });

  const roundedTotal = nextRows.reduce(
    (sum, row) => sum + Number(row[weightKey] || 0),

    0
  );

  const correction = round(total - roundedTotal, 2);

  if (Math.abs(correction) >= 0.01) {
    const correctionTarget = nextRows.find((row) => row.node !== changedNode);

    if (correctionTarget) {
      correctionTarget[weightKey] = clamp(
        round(Number(correctionTarget[weightKey] || 0) + correction, 2),

        0.25,

        1.75
      );
    }
  }

  return nextRows;
};

const AdminLegacyPrintCalibration = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  const [draftCalibration, setDraftCalibration] = useState(
    legacyPrintCalibrationSeed
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isLoadingCalibration, setIsLoadingCalibration] = useState(true);

  const [isSavingCalibration, setIsSavingCalibration] = useState(false);

  const [calibrationSourceLabel, setCalibrationSourceLabel] =
    useState('Local Seed');

  const [savedVersions, setSavedVersions] = useState([]);

  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  const [selector, setSelector] = useState(INITIAL_SELECTOR);

  const safeSelector = useMemo(() => {
    return normalizeSelectorForAvailableOptions(selector, draftCalibration);
  }, [selector, draftCalibration]);

  const [activeAxis, setActiveAxis] = useState('attack');

  const [activeConfigCategory, setActiveConfigCategory] = useState('depth');

  const [activePreviewRead, setActivePreviewRead] = useState('First Listen');

  const [benchmarkDrumTypeFilter, setBenchmarkDrumTypeFilter] = useState('All');

  const [showAddConfigOption, setShowAddConfigOption] = useState(false);

  const [newConfigOption, setNewConfigOption] = useState(
    buildBlankConfigOption('depth')
  );

  const [configBrandFilter, setConfigBrandFilter] = useState('Ober Artisan');

  const [configLineFilter, setConfigLineFilter] = useState(
    'Ober HERITAGE Stave'
  );

  const [configShellTypeFilter, setConfigShellTypeFilter] = useState('Stave');

  const [configHybridTypes, setConfigHybridTypes] = useState(['Stave']);

  const [configDrumTypeFilter, setConfigDrumTypeFilter] = useState('Snare');

  const PREVIEW_READ_TABS = [
    'First Listen',

    'Player Analysis',

    'LegacyTuning',

    'Builder',
  ];

  useEffect(() => {
    let isMounted = true;

    const loadCalibration = async () => {
      setIsLoadingCalibration(true);

      try {
        const activeRef = doc(
          db,

          LEGACYPRINT_CALIBRATION_COLLECTION,

          LEGACYPRINT_ACTIVE_DOC_ID
        );

        const draftRef = doc(
          db,

          LEGACYPRINT_CALIBRATION_COLLECTION,

          LEGACYPRINT_DRAFT_DOC_ID
        );

        const activeSnap = await getDoc(activeRef);

        if (activeSnap.exists()) {
          const activeData = activeSnap.data();

          if (isMounted && activeData?.calibration) {
            setDraftCalibration(activeData.calibration);

            setCalibrationSourceLabel('Firestore Active');

            setHasUnsavedChanges(false);

            return;
          }
        }

        const draftSnap = await getDoc(draftRef);

        if (draftSnap.exists()) {
          const draftData = draftSnap.data();

          if (isMounted && draftData?.calibration) {
            setDraftCalibration(draftData.calibration);

            setCalibrationSourceLabel('Firestore Draft');

            setHasUnsavedChanges(false);

            return;
          }
        }

        if (isMounted) {
          setDraftCalibration(legacyPrintCalibrationSeed);

          setCalibrationSourceLabel('Local Seed');

          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Failed loading LegacyPrint calibration:', error);

        if (isMounted) {
          setDraftCalibration(legacyPrintCalibrationSeed);

          setCalibrationSourceLabel('Local Seed Fallback');
        }
      } finally {
        if (isMounted) {
          setIsLoadingCalibration(false);
        }
      }
    };

    loadCalibration();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'Versions') {
      loadSavedVersions();
    }
  }, [activeTab]);

  const preview = useMemo(() => {
    return buildVoicePreview(safeSelector, draftCalibration);
  }, [safeSelector, draftCalibration]);

  const configOptionCount = Object.values(
    draftCalibration.configOptions || {}
  ).reduce((sum, rows) => sum + rows.length, 0);

  const benchmarkDrumTypeOptions = useMemo(() => {
    const drumTypes = Array.from(
      new Set(
        (draftCalibration.typeBenchmarks || []).map((row) => row.drumType)
      )
    );

    return ['All', ...drumTypes];
  }, [draftCalibration]);

  const filteredBenchmarkRows = useMemo(() => {
    if (benchmarkDrumTypeFilter === 'All') {
      return draftCalibration.typeBenchmarks || [];
    }

    return (draftCalibration.typeBenchmarks || []).filter(
      (row) => row.drumType === benchmarkDrumTypeFilter
    );
  }, [draftCalibration, benchmarkDrumTypeFilter]);

  const configCategoryKeys = useMemo(() => {
    return getConfigCategoryKeys(draftCalibration);
  }, [draftCalibration]);

  const activeConfigDisplayRows = useMemo(() => {
    return getDisplayRowsForConfigCategory(
      draftCalibration,

      activeConfigCategory
    ).filter((row) => {
      const selectedLine = configLineFilter;

      if (configBrandFilter === 'Ober Artisan') {
        if (isOberSnareOnlyLine(selectedLine)) {
          return (
            appliesToIncludes(row.appliesTo, 'Snare') &&
            rowMatchesConstructionFilter(row, selectedLine)
          );
        }

        if (isSoundLegendLine(selectedLine)) {
          const drumTypeMatches = rowMatchesDrumTypeFilter(
            row,

            configDrumTypeFilter,

            selectedLine
          );

          const lineMatches = rowMatchesConstructionFilter(row, selectedLine);

          return drumTypeMatches && lineMatches;
        }
      }

      return rowMatchesDrumTypeFilter(
        row,

        configDrumTypeFilter,

        selectedLine
      );
    });
  }, [
    draftCalibration,

    activeConfigCategory,

    configBrandFilter,

    configLineFilter,

    configShellTypeFilter,

    configHybridTypes,

    configDrumTypeFilter,
  ]);

  const updateDraftCalibration = (updater) => {
    setDraftCalibration((current) => updater(current));

    setHasUnsavedChanges(true);
  };

  const updateMasterWeightValue = ({ node, key, value }) => {
    updateDraftCalibration((current) => ({
      ...current,

      masterWeights: current.masterWeights.map((row) =>
        row.node === node ? { ...row, [key]: value } : row
      ),
    }));
  };

  const updateMasterWeightGroupValue = ({ node, key, value }) => {
    updateDraftCalibration((current) => ({
      ...current,

      masterWeights: rebalanceMasterWeightGroup({
        rows: current.masterWeights,

        changedNode: node,

        weightKey: key,

        nextValue: value,

        total: 7,
      }),
    }));
  };

  const updateBenchmarkValue = ({ drumType, node, key, value }) => {
    updateDraftCalibration((current) => ({
      ...current,

      typeBenchmarks: current.typeBenchmarks.map((row) =>
        row.drumType === drumType && row.node === node
          ? { ...row, [key]: value }
          : row
      ),
    }));
  };

  const resetBenchmarkRow = ({ drumType, node }) => {
    const defaultRow = getDefaultBenchmarkRow({ drumType, node });

    if (!defaultRow) return;

    updateDraftCalibration((current) => ({
      ...current,

      typeBenchmarks: current.typeBenchmarks.map((row) =>
        row.drumType === drumType && row.node === node
          ? {
              ...row,

              minExpected: defaultRow.minExpected,

              neutral: defaultRow.neutral,

              maxExpected: defaultRow.maxExpected,

              firstListenMultiplier: defaultRow.firstListenMultiplier,

              context: defaultRow.context,
            }
          : row
      ),
    }));
  };

  const resetAllBenchmarks = () => {
    updateDraftCalibration((current) => ({
      ...current,

      typeBenchmarks: legacyPrintCalibrationSeed.typeBenchmarks,
    }));
  };

  const resetConfigRow = ({ categoryKey, option }) => {
    const defaultRow = getDefaultConfigRow({ categoryKey, option });

    if (!defaultRow) return;

    updateDraftCalibration((current) => {
      const rows = current.configOptions?.[categoryKey] || [];

      return {
        ...current,

        configOptions: {
          ...current.configOptions,

          [categoryKey]: rows.map((row) =>
            row.option === option
              ? {
                  ...row,

                  ...defaultRow,
                }
              : row
          ),
        },
      };
    });
  };

  const resetAllConfigOptions = () => {
    updateDraftCalibration((current) => ({
      ...current,

      configOptions: legacyPrintCalibrationSeed.configOptions,
    }));
  };

  const updateConfigOptionValue = ({ categoryKey, option, key, value }) => {
    updateDraftCalibration((current) => {
      const rows = current.configOptions?.[categoryKey] || [];

      return {
        ...current,

        configOptions: {
          ...current.configOptions,

          [categoryKey]: rows.map((row) =>
            row.option === option ? { ...row, [key]: value } : row
          ),
        },
      };
    });
  };

  const addConfigOption = () => {
    const cleanOption = String(newConfigOption.option || '').trim();

    if (!cleanOption) {
      window.alert('Add an option name first.');

      return;
    }

    const targetCategory =
      activeConfigCategory === 'depth' &&
      isSoundLegendConstruction(newConfigOption.appliesToConstructions)
        ? 'soundLegendDepthFine'
        : activeConfigCategory;

    updateDraftCalibration((current) => {
      const existingRows = current.configOptions?.[targetCategory] || [];

      const alreadyExists = existingRows.some(
        (row) => normalizeText(row.option) === normalizeText(cleanOption)
      );

      if (alreadyExists) {
        window.alert('That option already exists in this section.');

        return current;
      }

      return {
        ...current,

        configOptions: {
          ...current.configOptions,

          [targetCategory]: [
            ...existingRows,

            {
              ...newConfigOption,

              option: cleanOption,
            },
          ],
        },
      };
    });

    setNewConfigOption(buildBlankConfigOption(activeConfigCategory));

    setShowAddConfigOption(false);
  };

  const handleSelectorChange = (key, value) => {
    setSelector((current) => ({
      ...current,

      [key]: value,
    }));
  };

  const resetDraft = () => {
    setDraftCalibration(legacyPrintCalibrationSeed);

    setSelector(INITIAL_SELECTOR);

    setCalibrationSourceLabel('Local Seed Reset');

    setHasUnsavedChanges(true);
  };

  const saveDraft = async () => {
    setIsSavingCalibration(true);

    try {
      const draftRef = doc(
        db,

        LEGACYPRINT_CALIBRATION_COLLECTION,

        LEGACYPRINT_DRAFT_DOC_ID
      );

      await setDoc(
        draftRef,

        {
          calibration: draftCalibration,

          status: 'draft',

          updatedAt: serverTimestamp(),
        },

        { merge: true }
      );

      setCalibrationSourceLabel('Firestore Draft');

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed saving LegacyPrint draft:', error);

      window.alert('Failed saving LegacyPrint draft. Check console.');
    } finally {
      setIsSavingCalibration(false);
    }
  };

  const loadSavedVersions = async () => {
    setIsLoadingVersions(true);

    try {
      const versionsRef = collection(db, LEGACYPRINT_CALIBRATION_COLLECTION);

      const versionsQuery = query(versionsRef, orderBy('updatedAt', 'desc'));

      const snapshot = await getDocs(versionsQuery);

      const versions = snapshot.docs

        .map((docSnap) => ({
          id: docSnap.id,

          ...docSnap.data(),
        }))

        .filter((item) => item.status === 'version');

      setSavedVersions(versions);
    } catch (error) {
      console.error('Failed loading LegacyPrint versions:', error);

      window.alert('Failed loading LegacyPrint versions. Check console.');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const publishActive = async () => {
    setIsSavingCalibration(true);

    try {
      const activeRef = doc(
        db,

        LEGACYPRINT_CALIBRATION_COLLECTION,

        LEGACYPRINT_ACTIVE_DOC_ID
      );

      const draftRef = doc(
        db,

        LEGACYPRINT_CALIBRATION_COLLECTION,

        LEGACYPRINT_DRAFT_DOC_ID
      );

      const versionId = `version-${Date.now()}`;

      const versionRef = doc(
        db,

        LEGACYPRINT_CALIBRATION_COLLECTION,

        versionId
      );

      const publishedPayload = {
        calibration: {
          ...draftCalibration,

          version: {
            ...(draftCalibration.version || {}),

            label: draftCalibration.version?.label || versionId,

            updatedAt: new Date().toISOString(),
          },
        },

        status: 'active',

        publishedAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      };

      await setDoc(activeRef, publishedPayload, { merge: true });

      await setDoc(draftRef, {
        ...publishedPayload,

        status: 'draft-synced-to-active',
      });

      await setDoc(versionRef, {
        ...publishedPayload,

        status: 'version',

        versionId,
      });

      setDraftCalibration(publishedPayload.calibration);

      setCalibrationSourceLabel('Firestore Active');

      setHasUnsavedChanges(false);

      await loadSavedVersions();
    } catch (error) {
      console.error('Failed publishing LegacyPrint calibration:', error);

      window.alert('Failed publishing LegacyPrint calibration. Check console.');
    } finally {
      setIsSavingCalibration(false);
    }
  };

  const renderFirstListenTriangle = () => (
    <div className="legacyprint-admin-first-triangle-shell">
      <VoiceThreadMap
        key={[
          safeSelector.comparisonMode,

          safeSelector.drumType,

          safeSelector.construction,

          safeSelector.diameter,

          safeSelector.depth,

          safeSelector.thickness,

          safeSelector.finish,

          safeSelector.hoopType,

          safeSelector.bearingEdge,

          safeSelector.snareBed,

          safeSelector.tension,

          safeSelector.snareWires,

          safeSelector.batterHead,

          safeSelector.resoHead,

          preview.firstListenNodes.join('-'),

          LEGACYPRINT_NODE_ORDER.map(
            (node) => preview.firstListenProfile[node]
          ).join('-'),
        ].join('|')}
        activeThread={preview.firstListenThread}
        strengthScore={preview.firstListenThread.score}
        profile={preview.firstListenProfile}
        input={{
          size: safeSelector.diameter,

          depth: safeSelector.depth,

          lugs: '',

          staveOption: safeSelector.thickness,

          hoopType: safeSelector.hoopType,

          hardwareColor: '',

          scorchDepth: safeSelector.finish,
        }}
        currentSpec={{
          size: safeSelector.diameter,

          diameter: safeSelector.diameter,

          depth: safeSelector.depth,

          hoopType: safeSelector.hoopType,

          finish: safeSelector.finish,

          thicknessMm: safeSelector.thickness,

          bearingEdge: safeSelector.bearingEdge,

          snareBed: safeSelector.snareBed,
        }}
        displayMode="VoiceMapping"
        readVariant="firstTell"
        firstTellKeys={preview.firstListenNodes}
      />
    </div>
  );

  const renderSoundLegendBuilderPanel = ({ embedded = false } = {}) => {
    const builder = draftCalibration.soundLegendBuilder || {};

    const brands = builder.brands || {};

    const veneerExteriors = builder.veneerExteriors || {};

    const woodSpecies = builder.woodSpecies || {};

    const oberLineRules = builder.oberLineRules || {};

    return (
      <section
        className={`legacyprint-admin-section ${
          embedded ? 'legacyprint-admin-section--embedded-builder' : ''
        }`}
      >
        {!embedded && (
          <div className="legacyprint-admin-section-heading">
            <div>
              <p className="legacyprint-admin-overline">
                Custom shell constructor
              </p>

              <h3>SoundLegend Builder</h3>
            </div>
          </div>
        )}

        {embedded && (
          <div className="legacyprint-preview-card-heading">
            <p>Selected Line Builder</p>

            <h4>SoundLegend Builder</h4>
          </div>
        )}

        <div className="legacyprint-soundlegend-builder-blueprint">
          <div className="legacyprint-builder-grid legacyprint-builder-grid--soundlegend">
            <LegacyPrintStatCard
              label="Custom Makers"
              value={brands.customMakers?.length || 0}
              detail="Independent / artisan builders"
            />

            <LegacyPrintStatCard
              label="Corporations"
              value={brands.corporations?.length || 0}
              detail="Reference brand comparisons"
            />

            <LegacyPrintStatCard
              label="Shell Types"
              value={builder.shellTypes?.length || 0}
              detail="Stave, hybrid, metal, acrylic, ply"
            />

            <LegacyPrintStatCard
              label="Drum Types"
              value={builder.drumTypes?.length || 0}
              detail="SoundLegend custom supports full kit types"
            />
          </div>

          <div className="legacyprint-two-column-list legacyprint-two-column-list--soundlegend">
            <BuilderColumn title="Custom Makers" items={brands.customMakers} />

            <BuilderColumn
              title="Corporate / Reference Brands"
              items={brands.corporations}
            />

            <BuilderColumn title="Ober Lines" items={builder.oberLines} />

            <BuilderColumn title="Shell Types" items={builder.shellTypes} />

            <BuilderColumn
              title="Hybrid Type Options"
              items={builder.hybridTypeOptions}
            />

            <BuilderColumn title="Drum Types" items={builder.drumTypes} />

            <BuilderColumn
              title="Standard Woods"
              items={woodSpecies.standard}
            />

            <BuilderColumn
              title="Dense / Focused Woods"
              items={woodSpecies.denseAndFocused}
            />

            <BuilderColumn
              title="Warm / Dark Woods"
              items={woodSpecies.warmAndDark}
            />

            <BuilderColumn
              title="Bright / Articulate Woods"
              items={woodSpecies.brightAndArticulate}
            />

            <BuilderColumn title="Metal Shells" items={builder.metalShells} />

            <BuilderColumn
              title="Acrylic Shells"
              items={builder.acrylicShells}
            />

            <BuilderColumn title="Ply Shells" items={builder.plyShells} />

            <BuilderColumn
              title="Steam-Bent Shells"
              items={builder.steamBentShells}
            />

            <BuilderColumn title="Solid Shells" items={builder.solidShells} />

            <BuilderColumn
              title="Standard Veneers"
              items={veneerExteriors.standard}
            />

            <BuilderColumn
              title="Figured Veneers"
              items={veneerExteriors.figured}
            />

            <BuilderColumn
              title="Exotic Veneers"
              items={veneerExteriors.exotic}
            />

            <BuilderColumn
              title="FEUZØN Core Pairings"
              items={builder.feuzonCorePairings}
            />

            <BuilderColumn
              title="FEUZØN Steam-Bent Exteriors"
              items={builder.feuzonSteamBentExteriors}
            />
          </div>

          <div className="legacyprint-admin-rule-grid">
            {Object.entries(oberLineRules).map(([lineName, rule]) => (
              <div key={lineName} className="legacyprint-admin-rule-card">
                <span className="legacyprint-admin-overline">Line Rule</span>

                <h4>{lineName}</h4>

                <p>{rule.notes}</p>

                <div>
                  <strong>Allowed Drum Types</strong>

                  <small>{rule.allowedDrumTypes?.join(', ')}</small>
                </div>

                <div>
                  <strong>Allowed Shell Types</strong>

                  <small>{rule.allowedShellTypes?.join(', ')}</small>
                </div>

                {rule.defaultHybridTypes?.length > 0 && (
                  <div>
                    <strong>Default Hybrid Types</strong>

                    <small>{rule.defaultHybridTypes.join(' + ')}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderFeuzonBuilderPanel = ({ embedded = false } = {}) => {
    const builder = draftCalibration.feuzonBuilder || {};

    return (
      <section
        className={`legacyprint-admin-section ${
          embedded ? 'legacyprint-admin-section--embedded-builder' : ''
        }`}
      >
        {!embedded && (
          <div className="legacyprint-admin-section-heading">
            <div>
              <p className="legacyprint-admin-overline">Hybrid shell builder</p>

              <h3>FEUZØN Builder</h3>
            </div>
          </div>
        )}

        {embedded && (
          <div className="legacyprint-preview-card-heading">
            <p>Selected Line Builder</p>

            <h4>FEUZØN Builder</h4>
          </div>
        )}

        <div className="legacyprint-two-column-list">
          <BuilderColumn
            title="Core Interior"
            items={builder.interiorCoreOptions}
          />

          <BuilderColumn
            title="Steam-Bent Exterior"
            items={builder.exteriorOptions}
          />
        </div>
      </section>
    );
  };

  const renderHeritageBuilderPreview = () => (
    <div className="legacyprint-preview-card legacyprint-preview-card--builder">
      <div className="legacyprint-preview-card-heading">
        <p>Selected Line Builder</p>

        <h4>HERITAGE Stave Builder</h4>
      </div>

      <p className="legacyprint-preview-description">
        HERITAGE uses the standard selector controls for diameter, depth, shell
        thickness, finish, hoop type, tension, wires, and heads.
      </p>
    </div>
  );

  const renderSelectedLineBuilderPreview = () => {
    if (isSoundLegendConstruction(safeSelector.construction)) {
      return (
        <div className="legacyprint-preview-card legacyprint-preview-card--builder">
          {renderSoundLegendBuilderPanel({ embedded: true })}
        </div>
      );
    }

    if (isFeuzonConstruction(safeSelector.construction)) {
      return (
        <div className="legacyprint-preview-card legacyprint-preview-card--builder">
          {renderFeuzonBuilderPanel({ embedded: true })}
        </div>
      );
    }

    if (isHeritageConstruction(safeSelector.construction)) {
      return renderHeritageBuilderPreview();
    }

    return null;
  };

  return (
    <div className="legacyprint-admin-tool">
      <div className="legacyprint-admin-hero">
        <div>
          <p className="legacyprint-admin-kicker">LegacyPrint™ Calibration</p>

          <h2>Voicing Engine Control Center</h2>

          <p>
            Manage calibration weights, drum-type benchmarks, construction
            rules, SoundLegend shell options, availability logic, visibility
            controls, and saved calibration versions.
          </p>
        </div>

        <div className="legacyprint-admin-hero-actions">
          <button
            type="button"
            className="legacyprint-admin-button secondary"
            onClick={resetDraft}
            disabled={isLoadingCalibration || isSavingCalibration}
          >
            Reset Draft
          </button>

          <button
            type="button"
            className="legacyprint-admin-button secondary"
            onClick={saveDraft}
            disabled={isLoadingCalibration || isSavingCalibration}
          >
            {isSavingCalibration ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="legacyprint-admin-button primary"
            onClick={publishActive}
            disabled={isLoadingCalibration || isSavingCalibration}
          >
            {isSavingCalibration ? 'Publishing...' : 'Publish Active'}
          </button>
        </div>
      </div>

      <div className="legacyprint-admin-tabs" role="tablist">
        {LEGACYPRINT_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`legacyprint-admin-tab ${
              activeTab === tab ? 'active' : ''
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="legacyprint-admin-panel">
        {activeTab === 'Overview' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">
                  Calibration overview
                </p>

                <h3>Editable calibration draft is loaded.</h3>
              </div>

              <span className="legacyprint-admin-status-dot">
                {isLoadingCalibration
                  ? 'Loading calibration...'
                  : hasUnsavedChanges
                    ? 'Unsaved draft changes'
                    : calibrationSourceLabel}
              </span>
            </div>

            <div className="legacyprint-admin-grid">
              <LegacyPrintStatCard
                label="Active Version"
                value={draftCalibration.version.label}
                detail={draftCalibration.version.updatedAt}
              />

              <LegacyPrintStatCard
                label="Config Options"
                value={configOptionCount}
                detail="Across all selector categories"
              />

              <LegacyPrintStatCard
                label="Benchmark Rows"
                value={draftCalibration.typeBenchmarks.length}
                detail="Drum type × seven nodes"
              />

              <LegacyPrintStatCard
                label="Fine Depth"
                value="SoundLegend Only"
                detail="0.25 in depth increments"
              />
            </div>

            <div className="legacyprint-admin-overview-split">
              <div className="legacyprint-admin-note">
                <strong>Editable draft mode</strong>

                <span>
                  Master Weights, Type Benchmarks, and Config Options can now be
                  edited locally. Voice Preview reads directly from this draft.
                </span>
              </div>

              <div className="legacyprint-admin-note neutral">
                <strong>Firestore calibration source</strong>

                <span>
                  Current source: {calibrationSourceLabel}. Save Draft writes to
                  legacyprint_calibrations/draft. Publish Active writes to
                  active, syncs the draft, and creates a timestamped version
                  snapshot.
                </span>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Voice Preview' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">
                  Live calibration test
                </p>

                <h3>Voice Preview</h3>
              </div>

              <span className="legacyprint-admin-status-dot">
                {preview.comparisonMode?.option}
              </span>
            </div>

            <div className="legacyprint-preview-layout">
              <AdminLegacyPrintSelector
                selectorFields={SELECTOR_FIELDS}
                calibration={draftCalibration}
                selector={safeSelector}
                getSelectorOptions={getSelectorOptions}
                onSelectorChange={handleSelectorChange}
              />

              <div className="legacyprint-preview-main">
                <div className="legacyprint-preview-read-tabs" role="tablist">
                  {PREVIEW_READ_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`legacyprint-preview-read-tab ${
                        activePreviewRead === tab ? 'active' : ''
                      }`}
                      onClick={() => setActivePreviewRead(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activePreviewRead === 'First Listen' && (
                  <div className="legacyprint-preview-card dark legacyprint-preview-card--first-listen-map">
                    <div className="legacyprint-preview-card-heading">
                      <p>First Listen</p>

                      <h4>{preview.firstListenTitle}</h4>
                    </div>

                    {renderFirstListenTriangle()}

                    <div className="legacyprint-first-listen-list">
                      {preview.firstListenTop.map((row, index) => (
                        <div key={row.node} className="legacyprint-first-row">
                          <span>{index + 1}</span>

                          <strong>{row.label}</strong>

                          <em>{getFirstListenRoleLabel(index)}</em>

                          <small>{row.why}</small>
                        </div>
                      ))}
                    </div>

                    <p className="legacyprint-preview-description">
                      {preview.firstListenDescription}
                    </p>
                  </div>
                )}

                {activePreviewRead === 'Player Analysis' && (
                  <>
                    <div className="legacyprint-chart-grid legacyprint-chart-grid--compact">
                      <div className="legacyprint-preview-card">
                        <div className="legacyprint-preview-card-heading">
                          <p>Current Build</p>

                          <h4>Live Node Scores</h4>
                        </div>

                        <div className="legacyprint-node-readout legacyprint-node-readout--buttons">
                          {LEGACYPRINT_NODE_ORDER.map((node) => (
                            <button
                              key={node}
                              type="button"
                              className={`legacyprint-node-score-button ${
                                activeAxis === node ? 'active' : ''
                              }`}
                              onClick={() => setActiveAxis(node)}
                            >
                              <small>{LEGACYPRINT_NODE_LABELS[node]}</small>

                              <strong>{preview.playerValues[node]}</strong>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="legacyprint-chart-card">
                        <BarChart
                          data={preview.playerValues}
                          activeKey={activeAxis}
                          onAxisChange={setActiveAxis}
                          compact
                          mode="standalone"
                        />
                      </div>
                    </div>

                    <div className="legacyprint-preview-card">
                      <div className="legacyprint-preview-card-heading">
                        <p>Player Analysis</p>

                        <h4>{preview.playerAnalysisTitle}</h4>
                      </div>

                      <p className="legacyprint-preview-description">
                        {preview.playerAnalysisDescription}
                      </p>
                    </div>
                  </>
                )}

                {activePreviewRead === 'LegacyTuning' && (
                  <div className="legacyprint-preview-card">
                    <div className="legacyprint-preview-card-heading">
                      <p>LegacyTuning</p>

                      <h4>{preview.tuning.rangeLabel}</h4>
                    </div>

                    <div className="legacyprint-tuning-grid">
                      <span>
                        <small>Hz Window</small>

                        <strong>
                          {preview.tuning.hzLow}–{preview.tuning.hzHigh} Hz
                        </strong>
                      </span>

                      <span>
                        <small>Center Hz</small>

                        <strong>{preview.tuning.centerHz}</strong>
                      </span>

                      <span>
                        <small>Nearest Note</small>

                        <strong>{preview.tuning.noteWindow}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {activePreviewRead === 'Builder' &&
                  renderSelectedLineBuilderPreview()}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Master Weights' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">Global multipliers</p>

                <h3>Master Weights</h3>

                <p className="legacyprint-admin-section-subcopy">
                  These sliders are balanced as grouped weights. Each multiplier
                  group totals 7.00 across the seven nodes, so raising one node
                  lowers the others proportionally.
                </p>
              </div>

              <button
                type="button"
                className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                onClick={() => {
                  updateDraftCalibration((current) => ({
                    ...current,

                    masterWeights: legacyPrintCalibrationSeed.masterWeights,
                  }));
                }}
              >
                Reset Master Weights
              </button>
            </div>

            <div className="legacyprint-master-weight-summary">
              {[
                'playerAnalysisMultiplier',
                'firstListenMultiplier',
                'movementMultiplier',
              ].map((weightKey) => {
                const total = draftCalibration.masterWeights.reduce(
                  (sum, row) => sum + Number(row[weightKey] || 0),

                  0
                );

                const label =
                  weightKey === 'playerAnalysisMultiplier'
                    ? 'Player Analysis'
                    : weightKey === 'firstListenMultiplier'
                      ? 'First Listen'
                      : 'Movement';

                return (
                  <span key={weightKey}>
                    <small>{label}</small>

                    <strong>{round(total, 2)} / 7.00</strong>
                  </span>
                );
              })}
            </div>

            <div className="legacyprint-master-weight-grid">
              {draftCalibration.masterWeights.map((row) => (
                <div key={row.node} className="legacyprint-master-weight-card">
                  <div className="legacyprint-master-weight-card-head">
                    <div>
                      <span className="legacyprint-admin-overline">
                        Voice Node
                      </span>

                      <h4>{LEGACYPRINT_NODE_LABELS[row.node]}</h4>
                    </div>

                    <button
                      type="button"
                      className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                      onClick={() => {
                        const defaultRow =
                          legacyPrintCalibrationSeed.masterWeights.find(
                            (item) => item.node === row.node
                          );

                        if (!defaultRow) return;

                        updateDraftCalibration((current) => ({
                          ...current,

                          masterWeights: current.masterWeights.map((item) =>
                            item.node === row.node
                              ? {
                                  ...item,

                                  playerAnalysisMultiplier:
                                    defaultRow.playerAnalysisMultiplier,

                                  firstListenMultiplier:
                                    defaultRow.firstListenMultiplier,

                                  movementMultiplier:
                                    defaultRow.movementMultiplier,

                                  notes: defaultRow.notes,
                                }
                              : item
                          ),
                        }));
                      }}
                    >
                      Reset Node
                    </button>
                  </div>

                  <div className="legacyprint-master-weight-slider-stack">
                    <LegacyPrintAdminSlider
                      node={row.node}
                      mode="master"
                      weightKey="playerAnalysisMultiplier"
                      value={row.playerAnalysisMultiplier}
                      min={0.25}
                      max={1.75}
                      step={0.01}
                      onChange={(value) =>
                        updateMasterWeightGroupValue({
                          node: row.node,

                          key: 'playerAnalysisMultiplier',

                          value,
                        })
                      }
                    />

                    <LegacyPrintAdminSlider
                      node={row.node}
                      mode="master"
                      weightKey="firstListenMultiplier"
                      value={row.firstListenMultiplier}
                      min={0.25}
                      max={1.75}
                      step={0.01}
                      onChange={(value) =>
                        updateMasterWeightGroupValue({
                          node: row.node,

                          key: 'firstListenMultiplier',

                          value,
                        })
                      }
                    />

                    <LegacyPrintAdminSlider
                      node={row.node}
                      mode="master"
                      weightKey="movementMultiplier"
                      value={row.movementMultiplier}
                      min={0.25}
                      max={1.75}
                      step={0.01}
                      onChange={(value) =>
                        updateMasterWeightGroupValue({
                          node: row.node,

                          key: 'movementMultiplier',

                          value,
                        })
                      }
                    />
                  </div>

                  <label className="legacyprint-master-weight-note">
                    <span>Internal Notes</span>

                    <input
                      type="text"
                      value={row.notes || ''}
                      className="legacyprint-admin-notes-input"
                      onChange={(event) =>
                        updateMasterWeightValue({
                          node: row.node,

                          key: 'notes',

                          value: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        )}
        {activeTab === 'Benchmarks' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">
                  Drum type calibration
                </p>

                <h3>Type Benchmarks</h3>

                <p className="legacyprint-admin-section-subcopy legacyprint-admin-section-subcopy--dark">
                  These sliders define the expected voice range for each drum
                  type. Min, Neutral, and Max shape the Player Analysis scale.
                  First Listen Multiplier controls how easily that node rises to
                  the surface in the first impression.
                </p>
              </div>

              <div className="legacyprint-admin-filter-row">
                <label>
                  <span>Drum Type</span>

                  <select
                    value={benchmarkDrumTypeFilter}
                    onChange={(event) =>
                      setBenchmarkDrumTypeFilter(event.target.value)
                    }
                  >
                    {benchmarkDrumTypeOptions.map((drumType) => (
                      <option key={drumType} value={drumType}>
                        {drumType}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                  onClick={resetAllBenchmarks}
                >
                  Reset Benchmarks
                </button>
              </div>
            </div>

            <div className="legacyprint-benchmark-card-grid">
              {filteredBenchmarkRows.map((row) => (
                <div
                  key={`${row.drumType}-${row.node}`}
                  className="legacyprint-benchmark-card"
                >
                  <div className="legacyprint-benchmark-card-head">
                    <div>
                      <span className="legacyprint-admin-overline">
                        {row.drumType}
                      </span>

                      <h4>{LEGACYPRINT_NODE_LABELS[row.node]}</h4>
                    </div>

                    <button
                      type="button"
                      className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                      onClick={() =>
                        resetBenchmarkRow({
                          drumType: row.drumType,

                          node: row.node,
                        })
                      }
                    >
                      Reset Row
                    </button>
                  </div>

                  <div className="legacyprint-benchmark-slider-grid">
                    <LegacyPrintAdminSlider
                      node={row.node}
                      mode="benchmark"
                      weightKey="minExpected"
                      value={row.minExpected}
                      min={0}
                      max={10}
                      step={0.1}
                      onChange={(value) =>
                        updateBenchmarkValue({
                          drumType: row.drumType,

                          node: row.node,

                          key: 'minExpected',

                          value,
                        })
                      }
                    />

                    <LegacyPrintAdminSlider
                      node={row.node}
                      mode="benchmark"
                      weightKey="neutral"
                      value={row.neutral}
                      min={0}
                      max={10}
                      step={0.1}
                      onChange={(value) =>
                        updateBenchmarkValue({
                          drumType: row.drumType,

                          node: row.node,

                          key: 'neutral',

                          value,
                        })
                      }
                    />

                    <LegacyPrintAdminSlider
                      node={row.node}
                      mode="benchmark"
                      weightKey="maxExpected"
                      value={row.maxExpected}
                      min={0}
                      max={10}
                      step={0.1}
                      onChange={(value) =>
                        updateBenchmarkValue({
                          drumType: row.drumType,

                          node: row.node,

                          key: 'maxExpected',

                          value,
                        })
                      }
                    />

                    <LegacyPrintAdminSlider
                      node={row.node}
                      mode="benchmark"
                      weightKey="firstListenMultiplier"
                      value={row.firstListenMultiplier}
                      min={0.4}
                      max={1.6}
                      step={0.01}
                      onChange={(value) =>
                        updateBenchmarkValue({
                          drumType: row.drumType,

                          node: row.node,

                          key: 'firstListenMultiplier',

                          value,
                        })
                      }
                    />
                  </div>

                  <div className="legacyprint-benchmark-meta">
                    <span>
                      {getBenchmarkMeaning({
                        key: 'minExpected',

                        value: row.minExpected,
                      })}
                    </span>

                    <span>
                      {getBenchmarkMeaning({
                        key: 'neutral',

                        value: row.neutral,
                      })}
                    </span>

                    <span>
                      {getBenchmarkMeaning({
                        key: 'maxExpected',

                        value: row.maxExpected,
                      })}
                    </span>

                    <span>
                      {getBenchmarkMeaning({
                        key: 'firstListenMultiplier',

                        value: row.firstListenMultiplier,
                      })}
                    </span>
                  </div>

                  <label className="legacyprint-master-weight-note">
                    <span>Context</span>

                    <input
                      type="text"
                      value={row.context || ''}
                      className="legacyprint-admin-notes-input"
                      onChange={(event) =>
                        updateBenchmarkValue({
                          drumType: row.drumType,

                          node: row.node,

                          key: 'context',

                          value: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'Config Options' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">
                  Selector value tables
                </p>

                <h3>Config Options</h3>
              </div>

              <button
                type="button"
                className="legacyprint-admin-button primary"
                onClick={() => {
                  setNewConfigOption(
                    buildBlankConfigOption(activeConfigCategory)
                  );

                  setShowAddConfigOption((current) => !current);
                }}
              >
                {showAddConfigOption ? 'Cancel Add' : 'Add Config Option'}
              </button>
              <button
                type="button"
                className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                onClick={resetAllConfigOptions}
              >
                Reset Config
              </button>
            </div>

            <div className="legacyprint-config-shell">
              <div className="legacyprint-config-tabs">
                {configCategoryKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={activeConfigCategory === key ? 'active' : ''}
                    onClick={() => {
                      setActiveConfigCategory(key);

                      setNewConfigOption(buildBlankConfigOption(key));

                      setShowAddConfigOption(false);
                    }}
                  >
                    {CONFIG_CATEGORY_LABELS[key] || toTitleCase(key)}
                  </button>
                ))}
              </div>

              <div className="legacyprint-admin-config-toolbar">
                <label>
                  <span>Brand</span>

                  <select
                    value={configBrandFilter}
                    onChange={(event) => {
                      const nextBrand = event.target.value;

                      setConfigBrandFilter(nextBrand);

                      if (nextBrand === 'Ober Artisan') {
                        setConfigLineFilter('Ober HERITAGE Stave');
                        setConfigShellTypeFilter('Stave');
                        setConfigDrumTypeFilter('Snare');
                        setConfigHybridTypes(['Stave']);
                      } else {
                        setConfigLineFilter('');
                        setConfigShellTypeFilter('All');
                        setConfigDrumTypeFilter('Snare');
                        setConfigHybridTypes([]);
                      }
                    }}
                  >
                    {BRAND_FILTER_OPTIONS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </label>

                {configBrandFilter === 'Ober Artisan' && (
                  <label>
                    <span>Line</span>

                    <select
                      value={configLineFilter}
                      onChange={(event) => {
                        const nextLine = event.target.value;

                        setConfigLineFilter(nextLine);

                        if (nextLine === 'Ober HERITAGE Stave') {
                          setConfigShellTypeFilter('Stave');
                          setConfigDrumTypeFilter('Snare');
                          setConfigHybridTypes(['Stave']);
                        }

                        if (nextLine === 'Ober FEUZØN Hybrid') {
                          setConfigShellTypeFilter('Hybrid');
                          setConfigDrumTypeFilter('Snare');
                          setConfigHybridTypes(['Stave', 'Steam Bent']);
                        }

                        if (nextLine === 'Ober SOUNDLEGEND Custom') {
                          setConfigShellTypeFilter('All');
                          setConfigDrumTypeFilter('Snare');
                          setConfigHybridTypes([]);
                        }
                      }}
                    >
                      {OBER_LINE_FILTER_OPTIONS.map((line) => (
                        <option key={line} value={line}>
                          {line
                            .replace('Ober HERITAGE Stave', 'HERITAGE')
                            .replace('Ober FEUZØN Hybrid', 'FEUZØN')
                            .replace(
                              'Ober SOUNDLEGEND Custom',
                              'SOUNDLEGEND Custom'
                            )}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {configLineFilter === 'Ober SOUNDLEGEND Custom' && (
                  <>
                    <label>
                      <span>Shell Type</span>

                      <select
                        value={configShellTypeFilter}
                        onChange={(event) => {
                          const nextShellType = event.target.value;

                          setConfigShellTypeFilter(nextShellType);

                          if (nextShellType === 'Hybrid') {
                            setConfigHybridTypes(['Stave', 'Steam Bent']);
                          } else {
                            setConfigHybridTypes([]);
                          }
                        }}
                      >
                        {SHELL_TYPE_FILTER_OPTIONS.map((shellType) => (
                          <option key={shellType} value={shellType}>
                            {shellType}
                          </option>
                        ))}
                      </select>
                    </label>

                    {configShellTypeFilter === 'Hybrid' && (
                      <div className="legacyprint-config-filter-group legacyprint-config-filter-group--wide">
                        <span>Hybrid Type</span>

                        <div className="legacyprint-config-check-row">
                          {HYBRID_TYPE_OPTIONS.map((type) => {
                            const isChecked = configHybridTypes.includes(type);

                            return (
                              <button
                                key={type}
                                type="button"
                                className={`legacyprint-config-check-button ${
                                  isChecked ? 'is-active' : ''
                                }`}
                                onClick={() => {
                                  setConfigHybridTypes((current) => {
                                    if (current.includes(type)) {
                                      return current.filter(
                                        (item) => item !== type
                                      );
                                    }

                                    return [...current, type];
                                  });
                                }}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <label>
                  <span>Drum Type</span>

                  <select
                    value={configDrumTypeFilter}
                    onChange={(event) =>
                      setConfigDrumTypeFilter(event.target.value)
                    }
                    disabled={isOberSnareOnlyLine(configLineFilter)}
                  >
                    {getAllowedDrumTypeOptionsForLine(configLineFilter).map(
                      (drumType) => (
                        <option key={drumType} value={drumType}>
                          {drumType}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <button
                  type="button"
                  className="legacyprint-admin-button secondary"
                  onClick={() => {
                    setConfigBrandFilter('Ober Artisan');
                    setConfigLineFilter('Ober HERITAGE Stave');
                    setConfigShellTypeFilter('Stave');
                    setConfigDrumTypeFilter('Snare');
                    setConfigHybridTypes(['Stave']);
                  }}
                >
                  Reset Filters
                </button>
              </div>
              {showAddConfigOption && (
                <div className="legacyprint-admin-add-config-panel">
                  <div className="legacyprint-admin-add-config-heading">
                    <p className="legacyprint-admin-overline">New Option</p>

                    <h4>
                      Add to {CONFIG_CATEGORY_LABELS[activeConfigCategory]}
                    </h4>
                  </div>

                  <div className="legacyprint-admin-add-config-grid">
                    <label>
                      <span>Option Name</span>

                      <input
                        type="text"
                        value={newConfigOption.option}
                        onChange={(event) =>
                          setNewConfigOption((current) => ({
                            ...current,

                            option: event.target.value,
                          }))
                        }
                        placeholder="Example: Satin Black, Deep Hybrid Edge, 26-strand"
                      />
                    </label>

                    <label>
                      <span>Applies To Drum Type</span>

                      <select
                        value={newConfigOption.appliesTo}
                        onChange={(event) =>
                          setNewConfigOption((current) => ({
                            ...current,

                            appliesTo: event.target.value,
                          }))
                        }
                      >
                        {DRUM_TYPE_FILTER_OPTIONS_WITH_ALL.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Assigned Construction / Line</span>

                      <select
                        value={newConfigOption.appliesToConstructions}
                        onChange={(event) =>
                          setNewConfigOption((current) => ({
                            ...current,

                            appliesToConstructions: event.target.value,
                          }))
                        }
                      >
                        {CONSTRUCTION_ASSIGNMENT_OPTIONS.map((construction) => (
                          <option key={construction} value={construction}>
                            {construction}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Allowed Diameters</span>

                      <input
                        type="text"
                        value={newConfigOption.allowedDiameters}
                        onChange={(event) =>
                          setNewConfigOption((current) => ({
                            ...current,

                            allowedDiameters: event.target.value,
                          }))
                        }
                        placeholder="All or 12 in,13 in,14 in"
                      />
                    </label>

                    <label>
                      <span>Allowed Depths</span>

                      <input
                        type="text"
                        value={newConfigOption.allowedDepths}
                        onChange={(event) =>
                          setNewConfigOption((current) => ({
                            ...current,

                            allowedDepths: event.target.value,
                          }))
                        }
                        placeholder="All or 5.0 in,5.5 in,6.0 in"
                      />
                    </label>

                    <label className="legacyprint-admin-add-config-notes">
                      <span>Notes</span>

                      <input
                        type="text"
                        value={newConfigOption.notes}
                        onChange={(event) =>
                          setNewConfigOption((current) => ({
                            ...current,

                            notes: event.target.value,
                          }))
                        }
                        placeholder="Short internal note"
                      />
                    </label>
                  </div>

                  <div className="legacyprint-admin-add-config-nodes">
                    {LEGACYPRINT_NODE_ORDER.map((node) => (
                      <label key={node}>
                        <span>{LEGACYPRINT_NODE_LABELS[node]}</span>

                        <AdminNumberInput
                          value={newConfigOption[node]}
                          onChange={(value) =>
                            setNewConfigOption((current) => ({
                              ...current,

                              [node]: value,
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>

                  <div className="legacyprint-admin-add-config-actions">
                    <button
                      type="button"
                      className="legacyprint-admin-button secondary"
                      onClick={() => {
                        setNewConfigOption(
                          buildBlankConfigOption(activeConfigCategory)
                        );

                        setShowAddConfigOption(false);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="legacyprint-admin-button primary"
                      onClick={addConfigOption}
                    >
                      Add Option
                    </button>
                  </div>
                </div>
              )}

              <div className="legacyprint-admin-table-wrap">
                <table className="legacyprint-admin-table">
                  <thead>
                    <tr>
                      <th>Option</th>

                      <th>Applies To</th>

                      <th>Assigned Line</th>

                      {activeConfigCategory === 'depth' && <th>Group</th>}

                      {LEGACYPRINT_NODE_ORDER.map((node) => (
                        <th key={node}>{LEGACYPRINT_NODE_LABELS[node]}</th>
                      ))}

                      <th>Reset</th>

                      <th>Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {activeConfigDisplayRows.map((row) => (
                      <tr key={`${row.__categoryKey}-${row.option}`}>
                        <td>{row.option}</td>

                        <td>
                          <input
                            type="text"
                            value={row.appliesTo || 'All'}
                            className="legacyprint-admin-notes-input legacyprint-admin-small-input"
                            onChange={(event) =>
                              updateConfigOptionValue({
                                categoryKey: row.__categoryKey,

                                option: row.option,

                                key: 'appliesTo',

                                value: event.target.value,
                              })
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            value={row.appliesToConstructions || 'All'}
                            className="legacyprint-admin-notes-input"
                            onChange={(event) =>
                              updateConfigOptionValue({
                                categoryKey: row.__categoryKey,

                                option: row.option,

                                key: 'appliesToConstructions',

                                value: event.target.value,
                              })
                            }
                          />
                        </td>

                        {activeConfigCategory === 'depth' && (
                          <td>{row.__displayGroup || 'Standard Depth'}</td>
                        )}

                        {LEGACYPRINT_NODE_ORDER.map((node) => (
                          <td
                            key={node}
                            className="legacyprint-config-slider-cell"
                          >
                            <LegacyPrintAdminSlider
                              node={node}
                              mode="config"
                              weightKey={node}
                              value={row[node]}
                              min={-1.25}
                              max={1.25}
                              step={0.01}
                              compact
                              onChange={(value) =>
                                updateConfigOptionValue({
                                  categoryKey: row.__categoryKey,

                                  option: row.option,

                                  key: node,

                                  value,
                                })
                              }
                            />

                            <small className="legacyprint-config-slider-meaning">
                              {getNodeValueMeaning({
                                node,

                                value: row[node],
                              })}
                            </small>
                          </td>
                        ))}

                        <td>
                          <button
                            type="button"
                            className="legacyprint-admin-button secondary legacyprint-admin-button--dark legacyprint-admin-table-button"
                            onClick={() =>
                              resetConfigRow({
                                categoryKey: row.__categoryKey,

                                option: row.option,
                              })
                            }
                          >
                            Reset
                          </button>
                        </td>

                        <td>
                          <input
                            type="text"
                            value={row.notes || row.examples || ''}
                            className="legacyprint-admin-notes-input"
                            onChange={(event) =>
                              updateConfigOptionValue({
                                categoryKey: row.__categoryKey,

                                option: row.option,

                                key: 'notes',

                                value: event.target.value,
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}

                    {!activeConfigDisplayRows.length && (
                      <tr>
                        <td
                          colSpan={activeConfigCategory === 'depth' ? 14 : 13}
                        >
                          No config options match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Availability' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">Rules preview</p>

                <h3>Availability</h3>
              </div>
            </div>

            <div className="legacyprint-admin-note">
              <strong>Rule model loaded</strong>

              <span>
                Diameter, depth, finish, shell thickness, hoop, bearing edge,
                snare bed, snare wire, and construction controls now filter from
                the selected drum type, construction, diameter, and depth.
              </span>
            </div>
          </section>
        )}

        {activeTab === 'SoundLegend Builder' && renderSoundLegendBuilderPanel()}

        {activeTab === 'FEUZØN Builder' && renderFeuzonBuilderPanel()}

        {activeTab === 'Visibility' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">Access control</p>

                <h3>Visibility</h3>
              </div>
            </div>

            <div className="legacyprint-admin-table-wrap">
              <table className="legacyprint-admin-table">
                <thead>
                  <tr>
                    <th>Feature</th>

                    <th>Public</th>

                    <th>SL Artists</th>

                    <th>Partners</th>

                    <th>Admin</th>
                  </tr>
                </thead>

                <tbody>
                  {draftCalibration.visibilityRules.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>

                      <td>{row.public ? 'Visible' : 'Hidden'}</td>

                      <td>{row.soundLegendArtists ? 'Visible' : 'Hidden'}</td>

                      <td>{row.legacyPrintPartners ? 'Visible' : 'Hidden'}</td>

                      <td>{row.admin ? 'Visible' : 'Hidden'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'Versions' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">Snapshots</p>

                <h3>Versions</h3>
              </div>

              <button
                type="button"
                className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                onClick={loadSavedVersions}
                disabled={isLoadingVersions}
              >
                {isLoadingVersions ? 'Loading Versions...' : 'Refresh Versions'}
              </button>
            </div>

            <div className="legacyprint-admin-note neutral">
              <strong>Saved Firestore snapshots</strong>

              <span>
                Publish Active creates timestamped version documents inside
                legacyprint_calibrations. Click Refresh Versions to load them
                here.
              </span>
            </div>

            <div className="legacyprint-admin-table-wrap">
              <table className="legacyprint-admin-table">
                <thead>
                  <tr>
                    <th>Version ID</th>

                    <th>Status</th>

                    <th>Label</th>

                    <th>Updated</th>

                    <th>Source</th>
                  </tr>
                </thead>

                <tbody>
                  {savedVersions.map((version) => (
                    <tr key={version.id}>
                      <td>{version.id}</td>

                      <td>{version.status || 'version'}</td>

                      <td>
                        {version.calibration?.version?.label ||
                          version.versionId}
                      </td>

                      <td>
                        {version.updatedAt?.toDate
                          ? version.updatedAt.toDate().toLocaleString()
                          : version.calibration?.version?.updatedAt || ''}
                      </td>

                      <td>
                        {version.calibration?.version?.source || 'Firestore'}
                      </td>
                    </tr>
                  ))}

                  {!savedVersions.length && (
                    <tr>
                      <td colSpan={5}>
                        No versions loaded yet. Click Refresh Versions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminLegacyPrintCalibration;
