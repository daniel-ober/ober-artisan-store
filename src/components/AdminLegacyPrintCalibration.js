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

  'Engine Builder',

  'Calibration Tools',

  'Engine View Settings',
];

const LEGACYPRINT_CALIBRATION_TOOL_TABS = [
  'Master Weights',

  'Benchmarks',

  'Config Options',

  'Availability',

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

    label: 'Shell Thickness',

    source: 'thickness',
  },

  {
    key: 'staveCount',

    label: 'Stave Count',

    source: 'staveCount',
  },

   {

    key: 'lugCount',

    label: 'Lug Count',

    source: 'lugCount',

  },

  {

    key: 'soundLegendConstructionType',

    label: 'Construction Type',

    source: 'soundLegendConstructionType',

  },

  {

    key: 'soundLegendWoodSpeciesCount',

    label: 'Wood Species Count',

    source: 'soundLegendWoodSpeciesCount',

  },

  {

    key: 'soundLegendWoodSpeciesPrimary',

    label: 'Primary Wood Species',

    source: 'soundLegendWoodSpeciesPrimary',

  },

  {

    key: 'soundLegendWoodSpeciesSecondary',

    label: 'Secondary Wood Species',

    source: 'soundLegendWoodSpeciesSecondary',

  },

  {

    key: 'soundLegendWoodSpeciesTertiary',

    label: 'Tertiary Wood Species',

    source: 'soundLegendWoodSpeciesTertiary',

  },

  {

    key: 'soundLegendWoodSpeciesQuaternary',

    label: 'Quaternary Wood Species',

    source: 'soundLegendWoodSpeciesQuaternary',

  },

  {

    key: 'soundLegendVeneerExterior',

    label: 'Veneer Exterior',

    source: 'soundLegendVeneerExterior',

  },

  {

    key: 'coreStaveShell',

    label: 'Core Stave Shell',

    source: 'coreStaveShell',

  },

  {
    key: 'steamBentExterior',

    label: 'Paired Exterior Shell',

    source: 'steamBentExterior',
  },

{

  key: 'finish',

  label: 'Finish Design',

  source: 'finish',

},

{

  key: 'finishCoating',

  label: 'Finish / Coating',

  source: 'finishCoating',

},

  {
    key: 'exteriorScorch',

    label: 'Exterior Scorch',

    source: 'exteriorScorch',
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

  {
    key: 'tension',

    label: 'Tension Setting',

    source: 'tension',
  },
];

const NON_OBER_MANUFACTURER_GROUPS = [
  {
    group: 'Corporate / Major Manufacturers',

    makers: [
      'Pearl',

      'Tama',

      'Yamaha',

      'Ludwig',

      'DW',

      'Gretsch',

      'Mapex',

      'Sonor',

      'PDP',

      'Rogers',

      'Slingerland',

      'Premier',

      'Natal',

      'Canopus',

      'Craviotto',
    ],
  },

  {
    group: 'Popular / Boutique Builders',

    makers: [
      'Noble & Cooley',

      'Dunnett',

      'George Way',

      'Keplinger',

      'INDe Drum Lab',

      'Oriollo',

      'Q Drum Co.',

      'C&C Drum Co.',

      'Sugar Percussion',

      'A&F Drum Co.',

      'British Drum Co.',

      'Doc Sweeney',

      'Pork Pie',

      'Spaun',

      'Truth Custom Drums',

      'SJC Custom Drums',
    ],
  },

  {
    group: 'Custom / Independent Builders',

    makers: [
      'Evetts Drums',

      'Unix Drums',

      'Antonio Drums',

      'Hendrix Drums',

      'Stone Custom Drum',

      'Kumu Drums',

      'VK Drums',

      'Outlaw Drums',

      'TreeHouse Custom Drums',

      'Barton Drum Co.',

      'Black Swamp Percussion',

      'Summit Drums',

      'Jenkins-Martin',

      'RBH Drums',

      'Wacco Drums',
    ],
  },
];

const NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER = {
  Pearl: {
    Snare: [
      'Reference One Snare',

      'Masters Maple Complete Snare',

      'Free Floating Maple Snare',

      'Sensitone Brass Snare',

      'Chad Smith Signature Snare',
    ],

    'Rack Tom': ['Masters Maple Complete Rack Tom', 'Reference Pure Rack Tom'],

    'Floor Tom': [
      'Masters Maple Complete Floor Tom',
      'Reference Pure Floor Tom',
    ],

    'Bass Drum': [
      'Masters Maple Complete Bass Drum',
      'Reference Pure Bass Drum',
    ],
  },

  Tama: {
    Snare: [
      'Starphonic Aluminum Snare',

      'S.L.P. G-Maple Snare',

      'S.L.P. Big Black Steel Snare',

      'Starclassic Maple Snare',

      'Bell Brass Snare',
    ],

    'Rack Tom': ['Starclassic Maple Rack Tom', 'Star Walnut Rack Tom'],

    'Floor Tom': ['Starclassic Maple Floor Tom', 'Star Walnut Floor Tom'],

    'Bass Drum': ['Starclassic Maple Bass Drum', 'Star Walnut Bass Drum'],
  },

  Yamaha: {
    Snare: [
      'Recording Custom Aluminum Snare',

      'Recording Custom Brass Snare',

      'Tour Custom Maple Snare',

      'Absolute Hybrid Maple Snare',
    ],

    'Rack Tom': ['Recording Custom Rack Tom', 'Absolute Hybrid Maple Rack Tom'],

    'Floor Tom': [
      'Recording Custom Floor Tom',
      'Absolute Hybrid Maple Floor Tom',
    ],

    'Bass Drum': [
      'Recording Custom Bass Drum',
      'Absolute Hybrid Maple Bass Drum',
    ],
  },

  Ludwig: {
    Snare: [
      'Supraphonic LM400',

      'Supraphonic LM402',

      'Black Beauty',

      'Acrolite',

      'Classic Maple Snare',

      'Legacy Mahogany Snare',
    ],

    'Rack Tom': ['Classic Maple Rack Tom', 'Legacy Mahogany Rack Tom'],

    'Floor Tom': ['Classic Maple Floor Tom', 'Legacy Mahogany Floor Tom'],

    'Bass Drum': ['Classic Maple Bass Drum', 'Legacy Mahogany Bass Drum'],
  },

  DW: {
    Snare: [
      'Collector’s Maple Snare',

      'Collector’s Bell Brass Snare',

      'Performance Series Snare',

      'Jazz Series Snare',

      'Super Solid Snare',
    ],

    'Rack Tom': ['Collector’s Maple Rack Tom', 'Performance Series Rack Tom'],

    'Floor Tom': [
      'Collector’s Maple Floor Tom',
      'Performance Series Floor Tom',
    ],

    'Bass Drum': [
      'Collector’s Maple Bass Drum',
      'Performance Series Bass Drum',
    ],
  },

  Gretsch: {
    Snare: [
      'USA Custom Snare',

      'Brooklyn Snare',

      'Renown Maple Snare',

      'Bell Brass Snare',

      'Solid Aluminum Snare',
    ],

    'Rack Tom': ['USA Custom Rack Tom', 'Brooklyn Rack Tom', 'Renown Rack Tom'],

    'Floor Tom': [
      'USA Custom Floor Tom',
      'Brooklyn Floor Tom',
      'Renown Floor Tom',
    ],

    'Bass Drum': [
      'USA Custom Bass Drum',
      'Brooklyn Bass Drum',
      'Renown Bass Drum',
    ],
  },

  Mapex: {
    Snare: [
      'Black Panther Wraith',

      'Black Panther Cherry Bomb',

      'Black Panther Persuader',

      'Saturn Maple/Walnut Snare',

      'Armory Snare',
    ],

    'Rack Tom': ['Saturn Maple/Walnut Rack Tom', 'Armory Rack Tom'],

    'Floor Tom': ['Saturn Maple/Walnut Floor Tom', 'Armory Floor Tom'],

    'Bass Drum': ['Saturn Maple/Walnut Bass Drum', 'Armory Bass Drum'],
  },

  Sonor: {
    Snare: [
      'SQ2 Maple Snare',

      'SQ1 Birch Snare',

      'Vintage Series Snare',

      'Kompressor Brass Snare',

      'ProLite Snare',
    ],

    'Rack Tom': ['SQ2 Rack Tom', 'SQ1 Rack Tom', 'Vintage Series Rack Tom'],

    'Floor Tom': ['SQ2 Floor Tom', 'SQ1 Floor Tom', 'Vintage Series Floor Tom'],

    'Bass Drum': ['SQ2 Bass Drum', 'SQ1 Bass Drum', 'Vintage Series Bass Drum'],
  },

  default: {
    Snare: [
      'Maple Snare Reference',

      'Birch Snare Reference',

      'Brass Snare Reference',

      'Aluminum Snare Reference',

      'Walnut Snare Reference',
    ],

    'Rack Tom': ['Maple Rack Tom Reference', 'Birch Rack Tom Reference'],

    'Floor Tom': ['Maple Floor Tom Reference', 'Birch Floor Tom Reference'],

    'Bass Drum': ['Maple Bass Drum Reference', 'Birch Bass Drum Reference'],

    'Concert Tom': ['Single-Headed Concert Tom Reference'],
  },
};

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

  lugCount: '8 lug',

  staveCount: '16 staves',

  thickness: '16 staves / 11mm',

  finish: 'Medium Torch',

  finishCoating: '',

  stainOption: '',

  exteriorScorch: '',

  soundLegendConstructionType: 'Stave',

  soundLegendWoodSpeciesCount: '1 Wood Species',

  soundLegendWoodSpeciesPrimary: 'Maple',

  soundLegendWoodSpeciesSecondary: '',

  soundLegendWoodSpeciesTertiary: '',

  soundLegendWoodSpeciesQuaternary: '',

  soundLegendVeneerExterior: '',

  coreStaveShell: '',

  steamBentExterior: '',

  hoopType: 'Triple Flange 2.3mm',

  bearingEdge: '45° inner edge with softened outer roundover',

  snareWires: 'PureSound Custom Pro Steel 20-Strand wires',

  snareBed: 'Standard',

  tension: 'Medium',

  batterHead: 'Remo Coated Ambassador',

  resoHead: 'Remo Ambassador Side',
};

const HERITAGE_FINISH_OPTIONS = ['Light Torch', 'Medium Torch', 'Blackened'];

const FEUZON_FINISH_DESIGN_OPTIONS = [

  'Natural',

  'Full Stain',

  'Faded Stain',

];

const FEUZON_FINISH_COATING_OPTIONS = [

  'Satin',

  'Gloss',

];

const FEUZON_EXTERIOR_SCORCH_OPTIONS = ['Non-Scorched', 'Natural Scorched'];

const FEUZON_STAIN_OPTIONS_BY_EXTERIOR = {
  Maple: ['Smoked Maple', 'Maple Tobacco', 'Blackened Maple'],

  Walnut: ['Dark Walnut', 'Black Walnut', 'Walnut Tobacco'],

  Cherry: ['Aged Cherry', 'Black Cherry', 'Dark Cherry'],
};

const SOUNDLEGEND_CONSTRUCTION_TYPE_OPTIONS = [

  'Stave',

  'Hybrid / FEUZØN',

  'Stave with Veneer',

  'Hybrid / FEUZØN with Veneer',

];

const SOUNDLEGEND_WOOD_SPECIES_OPTIONS = [

  'Maple',

  'Birch',

  'Oak',

  'Walnut',

  'Cherry',

  'Mahogany',

  'Ash',

  'Padauk',

  'Bubinga',

  'Wenge',

  'Zebrawood',

  'Purpleheart',

  'Poplar',

  'Sapele',

];

const SOUNDLEGEND_VENEER_EXTERIOR_OPTIONS = [

  'Mappa Burl',

  'Waterfall Bubinga',

  'Quilted Maple',

  'Flamed Maple',

  'Walnut Burl',

  'Olive Ash Burl',

  'Birdseye Maple',

  'Curly Walnut',

  'Macassar Ebony',

  'Zebrawood',

];

const getAllowedSoundLegendSpeciesCountOptions = (staveCount = '') => {

  const count = Number.parseInt(staveCount, 10);

  if ([6, 12, 24].includes(count)) {

    return ['1 Wood Species', '2 Wood Species', '3 Wood Species'];

  }

  return ['1 Wood Species', '2 Wood Species', '4 Wood Species'];

};

const getSoundLegendSpeciesCountNumber = (value = '') => {

  return Number.parseInt(value, 10) || 1;

};

const soundLegendTypeUsesHybridShell = (constructionType = '') => {

  return normalizeText(constructionType).includes('hybrid');

};

const soundLegendTypeUsesVeneer = (constructionType = '') => {

  return normalizeText(constructionType).includes('veneer');

};

const SOUNDLEGEND_FINISH_DESIGN_OPTIONS = [

  'Natural',

  'Full Stain',

  'Faded Stain',

  'Spray Solid',

  'Spray Fade',

];

const SOUNDLEGEND_FINISH_COATING_OPTIONS = [

  'Satin',

  'PolyGloss',

];

const SOUNDLEGEND_SCORCH_DEPTH_OPTIONS = [
  'Non-Scorched',

  'Light Scorched',

  'Medium Scorched',

  'Blackened',
];

const SOUNDLEGEND_SCORCH_DESIGN_OPTIONS = [
  'Faded Scorched Top Half',

  'Faded Scorched Bottom Half',

  'Faded Scorched Top and Bottom',

  'Faded Scorched Middle',
];

const SOUNDLEGEND_VENEER_FINISH_OPTIONS = [
  'Sprayed Satin',

  'Sprayed Gloss',

  'Stained Satin',

  'Stained Gloss',

  'Natural Satin',

  'PolyGloss',
];

const SOUNDLEGEND_ACRYLIC_ACCENT_OPTIONS = [
  'No Acrylic Accent',

  'Acrylic Accent 1 Color',

  'Acrylic Accent 2 Colors',

  'Acrylic Accent 3 Colors',
];

const SOUNDLEGEND_HOOP_OPTIONS = [
  'Triple Flange 1.6mm',

  'Triple Flange 2.3mm',

  'Triple Flange 3.0mm',

  'Die-Cast',

  'S-Hoop',

  'Single Flange 1.6mm',

  'Single Flange 2.3mm',

  'Wood Hoop',
];

const LEGACYPRINT_BEARING_EDGE_OPTIONS = [
  '45° inner edge with softened outer roundover',

  'Balanced Hybrid Edge',

  'Warm Hybrid Edge',

  'Modern Precision Edge',

  '45° Single Edge',

  '45° Double Edge',

  '30° Roundover',

  'Full Roundover',

  'Baseball Bat Roundover',

  'Vintage Roundover',

  'Sharp Modern 45°',

  'Reverse 45°',

  'Dual 45°',

  'Flat / No Edge',

  'Rounded Outer Countercut',
];

const HERITAGE_SNARE_DIAMETERS = ['12 in', '13 in', '14 in'];

const FEUZON_SNARE_DIAMETERS = ['12 in', '13 in', '14 in', '15 in'];

const FEUZON_CORE_STAVE_OPTIONS = [
  'Walnut + Birch',

  'Oak + Cherry',

  'Birch + Maple',

  'Maple + Bubinga',

  'Mahogany + Cherry',

  'Walnut + Padauk',

  'Oak + Wenge',

  'Zebrawood + Mahogany',

  'Padauk + Ash',
];

const FEUZON_STEAMBENT_EXTERIOR_OPTIONS = ['Maple', 'Walnut', 'Cherry'];

const SOUNDLEGEND_SNARE_DIAMETERS = [
  '10 in',
  '12 in',
  '13 in',
  '14 in',
  '15 in',
];

const SOUNDLEGEND_BUILD_OPTIONS_BY_DIAMETER_AND_THICKNESS = {
  '10 in': {
    '6mm': [{ lugCount: '6 lug', staveCount: '6 staves' }],

    '7mm': [{ lugCount: '6 lug', staveCount: '6 staves' }],

    '8mm': [
      { lugCount: '6 lug', staveCount: '6 staves' },

      { lugCount: '6 lug', staveCount: '12 staves' },
    ],

    '9mm': [
      { lugCount: '6 lug', staveCount: '6 staves' },

      { lugCount: '6 lug', staveCount: '12 staves' },
    ],

    '10mm': [{ lugCount: '6 lug', staveCount: '12 staves' }],

    '11mm': [{ lugCount: '6 lug', staveCount: '12 staves' }],

    '12mm': [{ lugCount: '6 lug', staveCount: '12 staves' }],
  },

  '12 in': {
    '6mm': [{ lugCount: '6 lug', staveCount: '6 staves' }],

    '7mm': [
      { lugCount: '6 lug', staveCount: '6 staves' },

      { lugCount: '6 lug', staveCount: '12 staves' },
    ],

    '8mm': [
      { lugCount: '6 lug', staveCount: '12 staves' },

      { lugCount: '8 lug', staveCount: '8 staves' },
    ],

    '9mm': [
      { lugCount: '6 lug', staveCount: '12 staves' },

      { lugCount: '8 lug', staveCount: '8 staves' },

      { lugCount: '8 lug', staveCount: '16 staves' },
    ],

    '10mm': [
      { lugCount: '8 lug', staveCount: '8 staves' },

      { lugCount: '8 lug', staveCount: '16 staves' },
    ],

    '11mm': [
      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '8 lug', staveCount: '24 staves' },
    ],

    '12mm': [
      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '8 lug', staveCount: '24 staves' },
    ],

    '13mm': [
      { lugCount: '8 lug', staveCount: '24 staves' },

      { lugCount: '8 lug', staveCount: '32 staves' },
    ],

    '14mm': [{ lugCount: '8 lug', staveCount: '32 staves' }],
  },

  '13 in': {
    '6mm': [{ lugCount: '8 lug', staveCount: '8 staves' }],

    '7mm': [{ lugCount: '8 lug', staveCount: '8 staves' }],

    '8mm': [
      { lugCount: '8 lug', staveCount: '8 staves' },

      { lugCount: '8 lug', staveCount: '16 staves' },
    ],

    '9mm': [{ lugCount: '8 lug', staveCount: '16 staves' }],

    '10mm': [
      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '8 lug', staveCount: '24 staves' },
    ],

    '11mm': [
      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '8 lug', staveCount: '24 staves' },
    ],

    '12mm': [
      { lugCount: '8 lug', staveCount: '24 staves' },

      { lugCount: '8 lug', staveCount: '32 staves' },
    ],

    '13mm': [{ lugCount: '8 lug', staveCount: '32 staves' }],

    '14mm': [{ lugCount: '8 lug', staveCount: '32 staves' }],
  },

  '14 in': {
    '6mm': [
      { lugCount: '8 lug', staveCount: '8 staves' },

      { lugCount: '10 lug', staveCount: '10 staves' },
    ],

    '7mm': [
      { lugCount: '8 lug', staveCount: '8 staves' },

      { lugCount: '10 lug', staveCount: '10 staves' },
    ],

    '8mm': [
      { lugCount: '8 lug', staveCount: '8 staves' },

      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '10 lug', staveCount: '10 staves' },
    ],

    '9mm': [
      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '10 lug', staveCount: '10 staves' },

      { lugCount: '10 lug', staveCount: '20 staves' },
    ],

    '10mm': [
      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '8 lug', staveCount: '24 staves' },

      { lugCount: '10 lug', staveCount: '20 staves' },
    ],

    '11mm': [
      { lugCount: '8 lug', staveCount: '24 staves' },

      { lugCount: '10 lug', staveCount: '20 staves' },

      { lugCount: '10 lug', staveCount: '30 staves' },
    ],

    '12mm': [
      { lugCount: '8 lug', staveCount: '24 staves' },

      { lugCount: '8 lug', staveCount: '32 staves' },

      { lugCount: '10 lug', staveCount: '30 staves' },
    ],

    '13mm': [
      { lugCount: '8 lug', staveCount: '32 staves' },

      { lugCount: '10 lug', staveCount: '30 staves' },

      { lugCount: '10 lug', staveCount: '40 staves' },
    ],

    '14mm': [
      { lugCount: '8 lug', staveCount: '32 staves' },

      { lugCount: '10 lug', staveCount: '40 staves' },
    ],

    '15mm': [{ lugCount: '10 lug', staveCount: '40 staves' }],
  },

  '15 in': {
    '6mm': [{ lugCount: '8 lug', staveCount: '8 staves' }],

    '7mm': [
      { lugCount: '8 lug', staveCount: '8 staves' },

      { lugCount: '10 lug', staveCount: '10 staves' },
    ],

    '8mm': [
      { lugCount: '8 lug', staveCount: '8 staves' },

      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '10 lug', staveCount: '10 staves' },
    ],

    '9mm': [
      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '10 lug', staveCount: '10 staves' },

      { lugCount: '10 lug', staveCount: '20 staves' },
    ],

    '10mm': [
      { lugCount: '8 lug', staveCount: '16 staves' },

      { lugCount: '8 lug', staveCount: '24 staves' },

      { lugCount: '10 lug', staveCount: '20 staves' },
    ],

    '11mm': [
      { lugCount: '8 lug', staveCount: '24 staves' },

      { lugCount: '10 lug', staveCount: '20 staves' },

      { lugCount: '10 lug', staveCount: '30 staves' },
    ],

    '12mm': [
      { lugCount: '8 lug', staveCount: '24 staves' },

      { lugCount: '8 lug', staveCount: '32 staves' },

      { lugCount: '10 lug', staveCount: '30 staves' },
    ],

    '13mm': [
      { lugCount: '8 lug', staveCount: '32 staves' },

      { lugCount: '10 lug', staveCount: '30 staves' },

      { lugCount: '10 lug', staveCount: '40 staves' },
    ],

    '14mm': [
      { lugCount: '8 lug', staveCount: '32 staves' },

      { lugCount: '10 lug', staveCount: '40 staves' },
    ],

    '15mm': [{ lugCount: '10 lug', staveCount: '40 staves' }],

    '16mm': [{ lugCount: '10 lug', staveCount: '40 staves' }],
  },
};

const HERITAGE_BUILD_OPTIONS_BY_DIAMETER_AND_THICKNESS = {
  '12 in': {
    '8mm': [{ lugCount: '6 lug', staveCount: '12 staves' }],

    '13mm': [{ lugCount: '8 lug', staveCount: '16 staves' }],
  },

  '13 in': {
    '12mm': [{ lugCount: '8 lug', staveCount: '16 staves' }],
  },

  '14 in': {
    '7mm': [{ lugCount: '10 lug', staveCount: '10 staves' }],

    '11mm': [{ lugCount: '8 lug', staveCount: '16 staves' }],

    '15mm': [{ lugCount: '10 lug', staveCount: '20 staves' }],
  },
};

const FEUZON_BUILD_OPTIONS_BY_DIAMETER_AND_THICKNESS = {
  '12 in': {
    '10mm': [{ lugCount: '6 lug', staveCount: '12 staves' }],

    '13mm': [{ lugCount: '8 lug', staveCount: '16 staves' }],
  },

  '13 in': {
    '13mm': [{ lugCount: '8 lug', staveCount: '16 staves' }],
  },

  '14 in': {
    '13mm': [{ lugCount: '8 lug', staveCount: '16 staves' }],

    '14mm': [{ lugCount: '10 lug', staveCount: '20 staves' }],
  },

  '15 in': {
    '12mm': [{ lugCount: '8 lug', staveCount: '16 staves' }],
  },
};

const getBuildOptionsForConstruction = (construction) => {
  if (isHeritageConstruction(construction)) {
    return HERITAGE_BUILD_OPTIONS_BY_DIAMETER_AND_THICKNESS;
  }

  if (isFeuzonConstruction(construction)) {
    return FEUZON_BUILD_OPTIONS_BY_DIAMETER_AND_THICKNESS;
  }

  if (isSoundLegendConstruction(construction)) {
    return SOUNDLEGEND_BUILD_OPTIONS_BY_DIAMETER_AND_THICKNESS;
  }

  return {};
};

const getThicknessOptionsForBuild = (construction, diameter) => {
  const buildOptions = getBuildOptionsForConstruction(construction);

  return Object.keys(buildOptions[diameter] || {});
};

const getLugOptionsForBuild = (construction, diameter, thickness) => {
  const buildOptions = getBuildOptionsForConstruction(construction);

  const rows = buildOptions[diameter]?.[thickness] || [];

  return Array.from(new Set(rows.map((row) => row.lugCount)));
};

const getStaveOptionsForBuild = (
  construction,

  diameter,

  thickness,

  lugCount
) => {
  const buildOptions = getBuildOptionsForConstruction(construction);

  const rows = buildOptions[diameter]?.[thickness] || [];

  return rows

    .filter((row) => row.lugCount === lugCount)

    .map((row) => row.staveCount);
};

const buildThicknessLabel = (staveCount, thickness) => {
  if (!staveCount || !thickness) return thickness || '';

  return `${staveCount} / ${thickness}`;
};

const getDefaultBuildForDiameter = (construction, diameter = '14 in') => {
  const thicknessOptions = getThicknessOptionsForBuild(construction, diameter);

  const preferredThickness = isHeritageConstruction(construction)
    ? '11mm'
    : isFeuzonConstruction(construction)
      ? '13mm'
      : diameter === '10 in'
        ? '10mm'
        : diameter === '12 in'
          ? '10mm'
          : diameter === '13 in'
            ? '10mm'
            : diameter === '14 in'
              ? '12mm'
              : diameter === '15 in'
                ? '12mm'
                : thicknessOptions[Math.floor(thicknessOptions.length / 2)];

  const thickness = thicknessOptions.includes(preferredThickness)
    ? preferredThickness
    : thicknessOptions[Math.floor(thicknessOptions.length / 2)] || '';

  const lugCount =
    getLugOptionsForBuild(construction, diameter, thickness)[0] || '';

  const staveCount =
    getStaveOptionsForBuild(construction, diameter, thickness, lugCount)[0] ||
    '';

  return {
    thickness,

    lugCount,

    staveCount,
  };
};

const SOUNDLEGEND_SNARE_DEPTHS = [
  '4.0 in',

  '4.5 in',

  '5.0 in',

  '5.5 in',

  '6.0 in',

  '6.5 in',

  '7.0 in',

  '7.5 in',

  '8.0 in',
];

const OBER_SNARE_DEPTHS = [
  '5.0 in',

  '5.5 in',

  '6.0 in',

  '6.5 in',

  '7.0 in',

  '7.5 in',

  '8.0 in',
];

const FEUZON_SNARE_DEPTHS = [
  '5.0 in',

  '5.5 in',

  '6.0 in',

  '6.5 in',

  '7.0 in',

  '7.5 in',

  '8.0 in',
];

const HERITAGE_THICKNESS_BY_DIAMETER = {
  '12 in': ['12 staves / 8mm', '16 staves / 13mm'],

  '13 in': ['16 staves / 12mm'],

  '14 in': ['10 staves / 7mm', '16 staves / 11mm', '20 staves / 15mm'],
};

const FEUZON_STAVE_OPTIONS_BY_DIAMETER = {
  '12 in': ['12 staves / 10mm', '16 staves / 13mm'],

  '13 in': ['16 staves / 13mm'],

  '14 in': ['16 staves / 13mm', '20 staves / 14mm'],

  '15 in': ['16 staves / 12mm'],
};

const OBER_HOOP_OPTIONS = ['Triple Flange', 'Die-Cast'];

const FEUZON_HOOP_OPTIONS = ['Triple Flange', 'Die-Cast'];

const HERITAGE_BEARING_EDGE_OPTIONS = [
  '45° inner edge with softened outer roundover',
];

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

const HERITAGE_SNARE_BED_OPTIONS = ['Standard snare beds'];

const FEUZON_SNARE_BED_OPTIONS = ['Standard', 'Shallow', 'Deep'];

const SOUNDLEGEND_SNARE_BED_OPTIONS = ['Standard', 'Shallow', 'Deep'];

const FEUZON_SNARE_WIRE_OPTIONS = [
  'PureSound Custom Pro Steel 20-Strand wires',
];

const HERITAGE_SNARE_BATTER_HEAD_OPTIONS = ['Remo Coated Ambassador'];

const HERITAGE_SNARE_RESO_HEAD_OPTIONS = ['Remo Ambassador Side'];

const FEUZON_SNARE_BATTER_HEAD_OPTIONS = ['Remo Coated Ambassador'];

const FEUZON_SNARE_RESO_HEAD_OPTIONS = ['Remo Ambassador Side'];

const SOUNDLEGEND_SNARE_BATTER_HEAD_OPTIONS = [
  'Remo Coated Ambassador',

  'Remo Coated Vintage Ambassador',

  'Remo Controlled Sound Reverse Dot',

  'Remo Powerstroke 3 Coated',

  'Evans HD Dry',

  'Evans Genera Dry',

  'Evans UV1 Coated',

  'Aquarian Texture Coated',

  'Aquarian Hi-Energy',
];

const SOUNDLEGEND_SNARE_RESO_HEAD_OPTIONS = [
  'Remo Ambassador Side',

  'Remo Ambassador Hazy Snare Side',

  'Remo Diplomat Snare Side',

  'Remo Emperor Snare Side',

  'Evans Snare Side 200',

  'Evans Snare Side 300',

  'Evans Snare Side 500',

  'Evans Orchestral 300',

  'Aquarian Classic Clear Snare Side',

  'Aquarian Hi-Performance Snare Side',
];

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
  if (isOberSnareOnlyLine(line) || isSoundLegendLine(line)) {
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
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return ['Snare'];
    }

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

    if (
      isSoundLegendConstruction(selector.construction) &&
      selector.drumType === 'Snare'
    ) {
      return SOUNDLEGEND_SNARE_DIAMETERS;
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
      isHeritageConstruction(selector.construction) &&
      selector.drumType === 'Snare'
    ) {
      return OBER_SNARE_DEPTHS;
    }

    if (
      isFeuzonConstruction(selector.construction) &&
      selector.drumType === 'Snare'
    ) {
      return FEUZON_SNARE_DEPTHS;
    }

    if (
      isSoundLegendConstruction(selector.construction) &&
      selector.drumType === 'Snare'
    ) {
      return SOUNDLEGEND_SNARE_DEPTHS;
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

  if (field.source === 'lugCount') {
    if (
      selector.drumType === 'Snare' &&
      (isHeritageConstruction(selector.construction) ||
        isFeuzonConstruction(selector.construction) ||
        isSoundLegendConstruction(selector.construction))
    ) {
      return getLugOptionsForBuild(
        selector.construction,

        selector.diameter,

        selector.thickness
      );
    }

    return [];
  }

  if (field.source === 'staveCount') {
    if (
      selector.drumType === 'Snare' &&
      (isHeritageConstruction(selector.construction) ||
        isFeuzonConstruction(selector.construction) ||
        isSoundLegendConstruction(selector.construction))
    ) {
      return getStaveOptionsForBuild(
        selector.construction,

        selector.diameter,

        selector.thickness,

        selector.lugCount
      );
    }

    return [];
  }

  if (field.source === 'thickness') {
    if (
      selector.drumType === 'Snare' &&
      (isHeritageConstruction(selector.construction) ||
        isFeuzonConstruction(selector.construction) ||
        isSoundLegendConstruction(selector.construction))
    ) {
      return getThicknessOptionsForBuild(
        selector.construction,

        selector.diameter
      );
    }

    return getBaseRowsByDrumType(
      safeCalibration,

      'thickness',

      selector.drumType
    )
      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'soundLegendConstructionType') {

    if (!isSoundLegendConstruction(selector.construction)) {

      return [];

    }

    return SOUNDLEGEND_CONSTRUCTION_TYPE_OPTIONS;

  }

  if (field.source === 'soundLegendWoodSpeciesCount') {

    if (!isSoundLegendConstruction(selector.construction)) {

      return [];

    }

    return getAllowedSoundLegendSpeciesCountOptions(selector.staveCount);

  }

  if (

    field.source === 'soundLegendWoodSpeciesPrimary' ||

    field.source === 'soundLegendWoodSpeciesSecondary' ||

    field.source === 'soundLegendWoodSpeciesTertiary' ||

    field.source === 'soundLegendWoodSpeciesQuaternary'

  ) {

    if (!isSoundLegendConstruction(selector.construction)) {

      return [];

    }

    const speciesCount = getSoundLegendSpeciesCountNumber(

      selector.soundLegendWoodSpeciesCount

    );

    if (

      field.source === 'soundLegendWoodSpeciesSecondary' &&

      speciesCount < 2

    ) {

      return [];

    }

    if (

      field.source === 'soundLegendWoodSpeciesTertiary' &&

      speciesCount < 3

    ) {

      return [];

    }

    if (

      field.source === 'soundLegendWoodSpeciesQuaternary' &&

      speciesCount < 4

    ) {

      return [];

    }

    return SOUNDLEGEND_WOOD_SPECIES_OPTIONS;

  }

  if (field.source === 'soundLegendVeneerExterior') {

    if (!isSoundLegendConstruction(selector.construction)) {

      return [];

    }

    if (!soundLegendTypeUsesVeneer(selector.soundLegendConstructionType)) {

      return [];

    }

    return SOUNDLEGEND_VENEER_EXTERIOR_OPTIONS;

  }

  if (field.source === 'finish') {

    if (isHeritageConstruction(selector.construction)) {

      return HERITAGE_FINISH_OPTIONS;

    }

    if (isFeuzonConstruction(selector.construction)) {

      return FEUZON_FINISH_DESIGN_OPTIONS;

    }

    if (isSoundLegendConstruction(selector.construction)) {

      return SOUNDLEGEND_FINISH_DESIGN_OPTIONS;

    }

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

    if (field.source === 'finishCoating') {

    if (isHeritageConstruction(selector.construction)) {

      return [];

    }

    if (isFeuzonConstruction(selector.construction)) {

      return FEUZON_FINISH_COATING_OPTIONS;

    }

    if (isSoundLegendConstruction(selector.construction)) {

      return SOUNDLEGEND_FINISH_COATING_OPTIONS;

    }

    return [];

  }

  if (field.source === 'stainOption') {
    if (!isFeuzonConstruction(selector.construction)) {
      return [];
    }

    if (!['Full Stain', 'Faded Stain'].includes(selector.finish)) {
      return [];
    }

    return FEUZON_STAIN_OPTIONS_BY_EXTERIOR[selector.steamBentExterior] || [];
  }

  if (field.source === 'exteriorScorch') {
    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_EXTERIOR_SCORCH_OPTIONS;
    }

    return [];
  }

  if (field.source === 'coreStaveShell') {

    if (isFeuzonConstruction(selector.construction)) {

      return FEUZON_CORE_STAVE_OPTIONS;

    }

    if (

      isSoundLegendConstruction(selector.construction) &&

      soundLegendTypeUsesHybridShell(selector.soundLegendConstructionType)

    ) {

      return FEUZON_CORE_STAVE_OPTIONS;

    }

    return [];

  }

  if (field.source === 'steamBentExterior') {

    if (isFeuzonConstruction(selector.construction)) {

      return FEUZON_STEAMBENT_EXTERIOR_OPTIONS;

    }

    if (

      isSoundLegendConstruction(selector.construction) &&

      soundLegendTypeUsesHybridShell(selector.soundLegendConstructionType)

    ) {

      return FEUZON_STEAMBENT_EXTERIOR_OPTIONS;

    }

    return [];

  }

  if (field.source === 'hoopType') {
    if (isHeritageConstruction(selector.construction)) {
      return ['Triple Flange 2.3mm', 'Die-Cast'];
    }

    if (isFeuzonConstruction(selector.construction)) {
      return ['Triple Flange 2.3mm', 'Die-Cast'];
    }

    if (isSoundLegendConstruction(selector.construction)) {
      return SOUNDLEGEND_HOOP_OPTIONS;
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

    if (isHeritageConstruction(selector.construction)) {
      return HERITAGE_BEARING_EDGE_OPTIONS;
    }

    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_BEARING_EDGE_OPTIONS;
    }

    if (isSoundLegendConstruction(selector.construction)) {
      return LEGACYPRINT_BEARING_EDGE_OPTIONS;
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

    if (isHeritageConstruction(selector.construction)) {
      return HERITAGE_SNARE_BED_OPTIONS;
    }

    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_SNARE_BED_OPTIONS;
    }

    if (isSoundLegendConstruction(selector.construction)) {
      return SOUNDLEGEND_SNARE_BED_OPTIONS;
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

    if (isHeritageConstruction(selector.construction)) {
      return ['PureSound Custom Pro Steel 20-Strand wires'];
    }

    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_SNARE_WIRE_OPTIONS;
    }

    return getRowsForCategory(safeCalibration, 'snareWires')
      .filter((row) => appliesToIncludes(row.appliesTo, 'Snare'))

      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'batterHead') {
    if (selector.drumType !== 'Snare') return [];

    if (isHeritageConstruction(selector.construction)) {
      return HERITAGE_SNARE_BATTER_HEAD_OPTIONS;
    }

    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_SNARE_BATTER_HEAD_OPTIONS;
    }

    if (isSoundLegendConstruction(selector.construction)) {
      return SOUNDLEGEND_SNARE_BATTER_HEAD_OPTIONS;
    }

    return getRowsForCategory(safeCalibration, 'batterHead')
      .filter((row) => appliesToIncludes(row.appliesTo, selector.drumType))

      .filter((row) => constructionIncludes(row, selector.construction))

      .map((row) => row.option);
  }

  if (field.source === 'resoHead') {
    if (selector.drumType !== 'Snare') return [];

    if (isHeritageConstruction(selector.construction)) {
      return HERITAGE_SNARE_RESO_HEAD_OPTIONS;
    }

    if (isFeuzonConstruction(selector.construction)) {
      return FEUZON_SNARE_RESO_HEAD_OPTIONS;
    }

    if (isSoundLegendConstruction(selector.construction)) {
      return SOUNDLEGEND_SNARE_RESO_HEAD_OPTIONS;
    }

    return getRowsForCategory(safeCalibration, 'resoHead')
      .filter((row) => appliesToIncludes(row.appliesTo, selector.drumType))

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

const getThicknessFallbackLabel = (option = '') => {
  const match = String(option || '').match(/(\d+(?:\.\d+)?)mm/i);

  return match ? `${match[1]}mm` : option;
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

  if (categoryKey === 'thickness') {
    return (
      getConfigOption(calibration, 'thickness', option) ||
      getConfigOption(
        calibration,
        'thickness',
        getThicknessFallbackLabel(option)
      )
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

    ['finishCoating', selector.finishCoating],

    ['stainOption', selector.stainOption],

    ['exteriorScorch', selector.exteriorScorch],

    ['soundLegendConstructionType', selector.soundLegendConstructionType],

    [

      'soundLegendWoodSpeciesCount',

      selector.soundLegendWoodSpeciesCount,

    ],

    [

      'soundLegendWoodSpeciesPrimary',

      selector.soundLegendWoodSpeciesPrimary,

    ],

    [

      'soundLegendWoodSpeciesSecondary',

      selector.soundLegendWoodSpeciesSecondary,

    ],

    [

      'soundLegendWoodSpeciesTertiary',

      selector.soundLegendWoodSpeciesTertiary,

    ],

    [

      'soundLegendWoodSpeciesQuaternary',

      selector.soundLegendWoodSpeciesQuaternary,

    ],

    ['soundLegendVeneerExterior', selector.soundLegendVeneerExterior],

    ['coreStaveShell', selector.coreStaveShell],

    ['steamBentExterior', selector.steamBentExterior],

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

  lockedNodes = [],

  total = 7,
}) => {
  const safeRows = Array.isArray(rows) ? rows.map((row) => ({ ...row })) : [];

  const minValue = 0.25;

  const maxValue = 1.75;

  const lockedSet = new Set(lockedNodes || []);

  if (!safeRows.length) return safeRows;

  if (lockedSet.has(changedNode)) {
    return safeRows;
  }

  const changedRow = safeRows.find((row) => row.node === changedNode);

  if (!changedRow) {
    return safeRows;
  }

  const lockedTotal = safeRows.reduce((sum, row) => {
    if (!lockedSet.has(row.node)) return sum;

    return sum + clamp(Number(row[weightKey] || 0), minValue, maxValue);
  }, 0);

  const otherUnlockedRows = safeRows.filter((row) => {
    if (row.node === changedNode) return false;

    return !lockedSet.has(row.node);
  });

  const minOtherTotal = otherUnlockedRows.length * minValue;

  const maxOtherTotal = otherUnlockedRows.length * maxValue;

  const minChangedValue = Math.max(
    minValue,

    total - lockedTotal - maxOtherTotal
  );

  const maxChangedValue = Math.min(
    maxValue,

    total - lockedTotal - minOtherTotal
  );

  const changedValue = clamp(
    Number(nextValue),

    minChangedValue,

    maxChangedValue
  );

  let remainingTotal = total - lockedTotal - changedValue;

  const nextRows = safeRows.map((row) => {
    if (lockedSet.has(row.node)) {
      return {
        ...row,

        [weightKey]: round(
          clamp(Number(row[weightKey] || 0), minValue, maxValue),
          2
        ),
      };
    }

    if (row.node === changedNode) {
      return {
        ...row,

        [weightKey]: round(changedValue, 2),
      };
    }

    return {
      ...row,

      [weightKey]: null,
    };
  });

  let adjustableNodes = otherUnlockedRows.map((row) => row.node);

  while (adjustableNodes.length) {
    const evenValue = remainingTotal / adjustableNodes.length;

    if (evenValue < minValue) {
      adjustableNodes.forEach((node) => {
        const row = nextRows.find((item) => item.node === node);

        if (row) {
          row[weightKey] = minValue;
        }
      });

      remainingTotal = 0;

      break;
    }

    if (evenValue > maxValue) {
      adjustableNodes.forEach((node) => {
        const row = nextRows.find((item) => item.node === node);

        if (row) {
          row[weightKey] = maxValue;
        }
      });

      remainingTotal = 0;

      break;
    }

    adjustableNodes.forEach((node) => {
      const row = nextRows.find((item) => item.node === node);

      if (row) {
        row[weightKey] = evenValue;
      }
    });

    remainingTotal = 0;

    break;
  }

  let roundedRows = nextRows.map((row) => ({
    ...row,

    [weightKey]: round(
      clamp(Number(row[weightKey] || minValue), minValue, maxValue),

      2
    ),
  }));

  let roundedTotal = round(
    roundedRows.reduce((sum, row) => sum + Number(row[weightKey] || 0), 0),

    2
  );

  let correction = round(total - roundedTotal, 2);

  for (let pass = 0; pass < 20 && Math.abs(correction) >= 0.01; pass += 1) {
    const correctionTarget = roundedRows.find((row) => {
      if (row.node === changedNode) return false;

      if (lockedSet.has(row.node)) return false;

      const value = Number(row[weightKey] || 0);

      if (correction > 0) return value < maxValue;

      return value > minValue;
    });

    if (!correctionTarget) break;

    roundedRows = roundedRows.map((row) => {
      if (row.node !== correctionTarget.node) return row;

      return {
        ...row,

        [weightKey]: round(
          clamp(Number(row[weightKey] || 0) + correction, minValue, maxValue),

          2
        ),
      };
    });

    roundedTotal = round(
      roundedRows.reduce((sum, row) => sum + Number(row[weightKey] || 0), 0),

      2
    );

    correction = round(total - roundedTotal, 2);
  }

  return roundedRows;
};

const getMasterWeightInfluenceValue = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return 0;

  return round(((numericValue - 1) / 0.75) * 100, 0);
};

const getMasterWeightDisplayValue = ({ value, displayMode }) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return '0';

  if (displayMode === 'influence') {
    const influence = getMasterWeightInfluenceValue(numericValue);

    return influence > 0 ? `+${influence}` : `${influence}`;
  }

  if (displayMode === 'share') {
    return `${round((numericValue / 7) * 100, 1)}%`;
  }

  return round(numericValue, 2);
};

const getMasterWeightDisplayLabel = ({ value, displayMode }) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return 'Neutral';

  if (displayMode === 'influence') {
    const influence = getMasterWeightInfluenceValue(numericValue);

    if (influence < -20) return 'Cut';

    if (influence > 20) return 'Boost';

    return 'Neutral';
  }

  if (displayMode === 'share') {
    if (numericValue < 1) return 'Below Avg';

    if (numericValue > 1) return 'Above Avg';

    return 'Avg';
  }

  if (numericValue < 0.92) return 'Cut';

  if (numericValue > 1.08) return 'Boost';

  return 'Center';
};

const MasterWeightKnob = ({
  node,

  weightKey,

  value,

  displayMode,

  isLocked,

  onChange,

  onToggleLock,
}) => {
  const min = 0.25;

  const max = 1.75;

  const center = 1;

  const numericValue = clamp(Number(value), min, max);

  const percent = (numericValue - min) / (max - min);

  const angle = -135 + percent * 270;

  const isCentered = Math.abs(numericValue - center) < 0.005;

  const updateFromClientY = (clientY, startY, startValue) => {
    const delta = startY - clientY;

    const nextValue = clamp(startValue + delta * 0.01, min, max);

    const snappedValue =
      Math.abs(nextValue - center) < 0.035 ? center : nextValue;

    onChange(round(snappedValue, 2));
  };

  const handlePointerDown = (event) => {
    if (isLocked) return;

    event.preventDefault();

    const startY = event.clientY;

    const startValue = numericValue;

    const handlePointerMove = (moveEvent) => {
      updateFromClientY(moveEvent.clientY, startY, startValue);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);

      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);

    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleWheel = (event) => {
    if (isLocked) return;

    const direction = event.deltaY > 0 ? -1 : 1;

    const nextValue = clamp(numericValue + direction * 0.03, min, max);

    const snappedValue =
      Math.abs(nextValue - center) < 0.025 ? center : nextValue;

    onChange(round(snappedValue, 2));
  };

  const displayValue = getMasterWeightDisplayValue({
    value: numericValue,

    displayMode,
  });

  const behavior = getMasterWeightDisplayLabel({
    value: numericValue,

    displayMode,
  });

  return (
    <div
      className={`legacyprint-master-knob-cell ${
        isLocked ? 'is-locked' : ''
      } ${isCentered ? 'is-centered' : ''}`}
    >
      <button
        type="button"
        className={`legacyprint-master-knob ${node}`}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        disabled={isLocked}
        title="Drag up/down or scroll to adjust"
      >
        <span className="legacyprint-master-knob-track" />

        <span
          className="legacyprint-master-knob-indicator"
          style={{ transform: `rotate(${angle}deg)` }}
        />

        <span className="legacyprint-master-knob-center-dot" />
      </button>

      <strong>{displayValue}</strong>

      <small>
        {isCentered
          ? displayMode === 'influence'
            ? '0'
            : displayMode === 'share'
              ? '14.3%'
              : 'Center'
          : behavior}
      </small>

      <button
        type="button"
        className={`legacyprint-master-lock-icon ${
          isLocked ? 'is-locked' : ''
        }`}
        onClick={onToggleLock}
        title={isLocked ? 'Unlock node' : 'Lock node'}
      >
        {isLocked ? 'Locked' : 'Editable'}
      </button>
    </div>
  );
};

const normalizeAllMasterWeightRows = (masterWeights = []) => {
  return [
    'firstListenMultiplier',
    'playerAnalysisMultiplier',
    'movementMultiplier',
  ].reduce(
    (rows, weightKey) => {
      const currentTotal = rows.reduce(
        (sum, row) => sum + Number(row[weightKey] || 0),

        0
      );

      if (Math.abs(currentTotal - 7) < 0.01) {
        return rows;
      }

      return rebalanceMasterWeightGroup({
        rows,

        changedNode: rows[0]?.node || 'attack',

        weightKey,

        nextValue: rows[0]?.[weightKey] || 1,

        lockedNodes: [],

        total: 7,
      });
    },

    masterWeights.map((row) => ({ ...row }))
  );
};

const CALIBRATION_HELPER_SECTIONS = [
  {
    title: 'Overview',

    summary:
      'Use this as the health check for the calibration system. It shows where the current calibration is coming from, whether there are unsaved changes, and how much of the engine is currently covered.',

    useWhen:
      'Start here when checking whether the active engine, draft, versions, and option coverage are in a healthy state.',
  },

  {
    title: 'Voice Preview',

    summary:
      'Use this to test the live result of the calibration. Change drum type, construction, size, finish, hoop, heads, wires, and tuning to see how the engine reads the build.',

    useWhen:
      'Use this after changing Config Options, Benchmarks, or Master Weights to confirm the output feels musically correct.',
  },

  {
    title: 'Master Weights',

    summary:
      'Use this to shape how each read layer interprets the same drum data. First Listen controls what surfaces first, Player Analysis controls the full seven-node read, and Movement controls how strongly node changes are allowed to show.',

    useWhen:
      'Use this only when a read layer feels globally biased across many builds. Do not use it to fix one specific drum configuration.',
  },

  {
    title: 'Benchmarks',

    summary:
      'Use this to define what is normal for each drum type. These values tell the engine what a snare, rack tom, floor tom, bass drum, or concert tom should generally expect for each node.',

    useWhen:
      'Use this when a whole drum type feels off — for example, snares always reading too low in attack or floor toms reading too high in brightness.',
  },

  {
    title: 'Config Options',

    summary:
      'Use this to tune the actual acoustic impact of each selectable build option. This is where diameter, depth, shell thickness, finish, hoop type, bearing edge, wires, heads, and other choices add or reduce attack, brightness, projection, sustain, warmth, sensitivity, and control.',

    useWhen:
      'Use this first when a specific option sounds wrong. Example: Die Cast hoops should add control and attack while reducing sustain.',
  },

  {
    title: 'Availability',

    summary:
      'Use this to confirm selector rules and option availability. This section previews whether the right options appear for the selected drum type, construction, diameter, depth, and Ober line.',

    useWhen:
      'Use this when dropdowns are showing the wrong choices or a build path allows something it should not.',
  },

  {
    title: 'SoundLegend Builder',

    summary:
      'Use this to manage the broad custom-build vocabulary for SoundLegend. This includes supported makers, corporate references, shell types, drum types, woods, veneers, metals, acrylics, hybrid types, and Ober line rules.',

    useWhen:
      'Use this when expanding the custom builder beyond Ober-only builds or adding reference materials for broader comparison logic.',
  },

  {
    title: 'FEUZØN Builder',

    summary:
      'Use this to manage the FEUZØN-specific hybrid shell vocabulary, especially interior core options and steam-bent exterior options.',

    useWhen:
      'Use this when refining FEUZØN construction choices or adding/removing valid hybrid pairings.',
  },

  {
    title: 'Visibility',

    summary:
      'Use this to control which LegacyPrint features are visible to public users, SoundLegend artists, LegacyPrint partners, and admins.',

    useWhen:
      'Use this when deciding which read layers or tools should be public, locked, partner-only, or admin-only.',
  },

  {
    title: 'Versions',

    summary:
      'Use this to review saved calibration snapshots. Publishing active creates a timestamped version so previous calibration states can be tracked.',

    useWhen:
      'Use this before or after publishing major calibration changes so you can confirm a version snapshot exists.',
  },
];

const AdminLegacyPrintCalibration = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  const [activeCalibrationToolTab, setActiveCalibrationToolTab] =
    useState('Master Weights');

  const [showCalibrationHelper, setShowCalibrationHelper] = useState(false);

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

  const [masterWeightDisplayMode, setMasterWeightDisplayMode] =
    useState('multiplier');

  const [lockedMasterWeights, setLockedMasterWeights] = useState({
    playerAnalysisMultiplier: [],

    firstListenMultiplier: [],

    movementMultiplier: [],
  });

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

  const [selectedNonOberMakerGroup, setSelectedNonOberMakerGroup] = useState(
    'Corporate / Major Manufacturers'
  );

  const [selectedNonOberMaker, setSelectedNonOberMaker] = useState('Pearl');

  const [selectedNonOberDrumType, setSelectedNonOberDrumType] =
    useState('Snare');

  const [selectedNonOberModel, setSelectedNonOberModel] = useState('');

  const ENGINE_LINE_OPTIONS = [
    {
      key: 'heritage',

      label: 'HERITAGE',

      construction: 'Ober HERITAGE Stave',

      description: 'Ober stave shell reference builder.',
    },

    {
      key: 'feuzon',

      label: 'FEUZØN',

      construction: 'Ober FEUZØN Hybrid',

      description: 'Ober hybrid shell reference builder.',
    },

    {
      key: 'soundlegend',

      label: 'SOUNDLEGEND',

      construction: 'Ober SOUNDLEGEND Custom',

      description: 'Full custom Ober / artist-led builder.',
    },

    {
      key: 'nonOber',

      label: 'Non-Ober / Reference',

      construction: 'Generic Ply Shell',

      description: 'External reference drums, comparisons, and education.',
    },
  ];

  const PREVIEW_READ_TABS = ['First Listen', 'Player Analysis', 'LegacyTuning'];

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
            setDraftCalibration({
              ...activeData.calibration,

              masterWeights: normalizeAllMasterWeightRows(
                activeData.calibration.masterWeights
              ),
            });

            setCalibrationSourceLabel('Firestore Active');

            setHasUnsavedChanges(false);

            return;
          }
        }

        const draftSnap = await getDoc(draftRef);

        if (draftSnap.exists()) {
          const draftData = draftSnap.data();

          if (isMounted && draftData?.calibration) {
            setDraftCalibration({
              ...draftData.calibration,

              masterWeights: normalizeAllMasterWeightRows(
                draftData.calibration.masterWeights
              ),
            });

            setCalibrationSourceLabel('Firestore Draft');

            setHasUnsavedChanges(false);

            return;
          }
        }

        if (isMounted) {
          setDraftCalibration({
            ...legacyPrintCalibrationSeed,

            masterWeights: normalizeAllMasterWeightRows(
              legacyPrintCalibrationSeed.masterWeights
            ),
          });
          setCalibrationSourceLabel('Local Seed');

          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Failed loading LegacyPrint calibration:', error);

        if (isMounted) {
          setDraftCalibration({
            ...legacyPrintCalibrationSeed,

            masterWeights: normalizeAllMasterWeightRows(
              legacyPrintCalibrationSeed.masterWeights
            ),
          });

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

        lockedNodes: lockedMasterWeights[key] || [],

        total: 7,
      }),
    }));
  };

  const toggleMasterWeightLock = ({ node, weightKey }) => {
    setLockedMasterWeights((current) => {
      const currentLockedNodes = current[weightKey] || [];

      const nextLockedNodes = currentLockedNodes.includes(node)
        ? currentLockedNodes.filter((item) => item !== node)
        : [...currentLockedNodes, node];

      return {
        ...current,

        [weightKey]: nextLockedNodes,
      };
    });
  };

  const isMasterWeightLocked = ({ node, weightKey }) => {
    return (lockedMasterWeights[weightKey] || []).includes(node);
  };

  const getMasterWeightLabel = (key) => {
    if (key === 'playerAnalysisMultiplier') return 'Player Analysis';

    if (key === 'firstListenMultiplier') return 'First Listen';

    if (key === 'movementMultiplier') return 'Movement';

    return key;
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

  const handleEngineLineChange = (lineOption) => {
    const isNonOber = lineOption.key === 'nonOber';

    setSelector((current) => {
      const nextSelector = {
        ...current,

        construction: lineOption.construction,

        drumType:
          lineOption.key === 'heritage' ||
          lineOption.key === 'feuzon' ||
          lineOption.key === 'soundlegend'
            ? 'Snare'
            : current.drumType || 'Snare',
      };

      if (lineOption.key === 'soundlegend') {
        const defaults = getDefaultBuildForDiameter(
          lineOption.construction,

          '14 in'
        );

        return {
          ...nextSelector,

          diameter: '14 in',

          depth: '6.5 in',

          thickness: defaults.thickness,

          lugCount: defaults.lugCount,

          staveCount: defaults.staveCount,

                  finish: 'Natural',

          finishCoating: 'Satin',

          stainOption: '',

          exteriorScorch: '',

          soundLegendConstructionType: 'Stave',

          soundLegendWoodSpeciesCount: '1 Wood Species',

          soundLegendWoodSpeciesPrimary: 'Maple',

          soundLegendWoodSpeciesSecondary: '',

          soundLegendWoodSpeciesTertiary: '',

          soundLegendWoodSpeciesQuaternary: '',

          soundLegendVeneerExterior: '',

          coreStaveShell: '',

          steamBentExterior: '',

          hoopType: 'Triple Flange 2.3mm',

          bearingEdge: 'Balanced Hybrid Edge',

          snareBed: 'Standard',

          tension: 'Medium',

          snareWires: 'PureSound Custom Pro Steel 20-Strand wires',

          batterHead: 'Remo Coated Ambassador',

          resoHead: 'Remo Ambassador Side',
        };
      }

      if (lineOption.key === 'heritage') {
        const defaults = getDefaultBuildForDiameter(
          lineOption.construction,

          '14 in'
        );

        return {
          ...nextSelector,

          diameter: '14 in',

          depth: '5.0 in',

          thickness: defaults.thickness,

          lugCount: defaults.lugCount,

          staveCount: defaults.staveCount,

                  finish: 'Medium Torch',

          finishCoating: '',

          stainOption: '',

          exteriorScorch: '',

          coreStaveShell: '',

          steamBentExterior: '',

          hoopType: 'Triple Flange 2.3mm',

          bearingEdge: '45° inner edge with softened outer roundover',

          snareBed: 'Standard snare beds',

          tension: 'Medium',

          snareWires: 'PureSound Custom Pro Steel 20-Strand wires',

          batterHead: 'Remo Coated Ambassador',

          resoHead: 'Remo Ambassador Side',
        };
      }

      if (lineOption.key === 'feuzon') {
        const defaults = getDefaultBuildForDiameter(
          lineOption.construction,

          '14 in'
        );

        return {
          ...nextSelector,

          diameter: '14 in',

          depth: '5.0 in',

          thickness: defaults.thickness,

          lugCount: defaults.lugCount,

          staveCount: defaults.staveCount,

                   finish: 'Natural',

          finishCoating: 'Satin',

          stainOption: '',

          exteriorScorch: 'Non-Scorched',

          coreStaveShell: 'Walnut + Birch',

          steamBentExterior: 'Maple',

          hoopType: 'Triple Flange 2.3mm',

          bearingEdge: 'Balanced Hybrid Edge',

          snareBed: 'Standard',

          tension: 'Medium',

          snareWires: 'PureSound Custom Pro Steel 20-Strand wires',

          batterHead: 'Remo Coated Ambassador',

          resoHead: 'Remo Ambassador Side',
        };
      }

      return nextSelector;
    });

    if (isNonOber) {
      setSelectedNonOberMakerGroup('Corporate / Major Manufacturers');

      setSelectedNonOberMaker('Pearl');

      setSelectedNonOberDrumType('Snare');

      setSelectedNonOberModel('');
    }

    setActivePreviewRead('First Listen');
  };

  const handleSelectorChange = (key, value) => {
    setSelector((current) => {
      const next = {
        ...current,

        [key]: value,
      };

      const isOberBuildPath =
        next.drumType === 'Snare' &&
        (isHeritageConstruction(next.construction) ||
          isFeuzonConstruction(next.construction) ||
          isSoundLegendConstruction(next.construction));

      if (!isOberBuildPath) {
        return next;
      }

            if (key === 'soundLegendConstructionType') {

        if (!isSoundLegendConstruction(next.construction)) {

          return next;

        }

        const usesHybridShell = soundLegendTypeUsesHybridShell(value);

        const usesVeneer = soundLegendTypeUsesVeneer(value);

        return {

          ...next,

          coreStaveShell: usesHybridShell ? next.coreStaveShell || FEUZON_CORE_STAVE_OPTIONS[0] : '',

          steamBentExterior: usesHybridShell

            ? next.steamBentExterior || FEUZON_STEAMBENT_EXTERIOR_OPTIONS[0]

            : '',

          soundLegendVeneerExterior: usesVeneer

            ? next.soundLegendVeneerExterior ||

              SOUNDLEGEND_VENEER_EXTERIOR_OPTIONS[0]

            : '',

        };

      }

      if (key === 'soundLegendWoodSpeciesCount') {

        if (!isSoundLegendConstruction(next.construction)) {

          return next;

        }

        const speciesCount = getSoundLegendSpeciesCountNumber(value);

        return {

          ...next,

          soundLegendWoodSpeciesPrimary:

            next.soundLegendWoodSpeciesPrimary ||

            SOUNDLEGEND_WOOD_SPECIES_OPTIONS[0],

          soundLegendWoodSpeciesSecondary:

            speciesCount >= 2

              ? next.soundLegendWoodSpeciesSecondary ||

                SOUNDLEGEND_WOOD_SPECIES_OPTIONS[1]

              : '',

          soundLegendWoodSpeciesTertiary:

            speciesCount >= 3

              ? next.soundLegendWoodSpeciesTertiary ||

                SOUNDLEGEND_WOOD_SPECIES_OPTIONS[2]

              : '',

          soundLegendWoodSpeciesQuaternary:

            speciesCount >= 4

              ? next.soundLegendWoodSpeciesQuaternary ||

                SOUNDLEGEND_WOOD_SPECIES_OPTIONS[3]

              : '',

        };

      }

        if (key === 'finish') {

        if (

          (isFeuzonConstruction(next.construction) ||

            isSoundLegendConstruction(next.construction)) &&

          !['Full Stain', 'Faded Stain'].includes(value)

        ) {

          return {

            ...next,

            stainOption: '',

          };

        }

        if (

          isFeuzonConstruction(next.construction) &&

          ['Full Stain', 'Faded Stain'].includes(value)

        ) {

          const stainOptions =

            FEUZON_STAIN_OPTIONS_BY_EXTERIOR[next.steamBentExterior] || [];

          return {

            ...next,

            stainOption: stainOptions[0] || '',

          };

        }

        return next;

      }

      if (key === 'steamBentExterior') {
        if (
          isFeuzonConstruction(next.construction) &&
          ['Full Stain', 'Faded Stain'].includes(next.finish)
        ) {
          const stainOptions = FEUZON_STAIN_OPTIONS_BY_EXTERIOR[value] || [];

          return {
            ...next,

            stainOption: stainOptions[0] || '',
          };
        }

        return next;
      }

          if (key === 'diameter') {

        const defaults = getDefaultBuildForDiameter(next.construction, value);

        const allowedSpeciesCounts = getAllowedSoundLegendSpeciesCountOptions(

          defaults.staveCount

        );

        const nextSpeciesCount = allowedSpeciesCounts.includes(

          next.soundLegendWoodSpeciesCount

        )

          ? next.soundLegendWoodSpeciesCount

          : allowedSpeciesCounts[0];

        return {

          ...next,

          thickness: defaults.thickness,

          staveCount: defaults.staveCount,

          lugCount: defaults.lugCount,

          soundLegendWoodSpeciesCount: isSoundLegendConstruction(

            next.construction

          )

            ? nextSpeciesCount

            : next.soundLegendWoodSpeciesCount,

        };

      }

         if (key === 'thickness') {

        const buildOptions = getBuildOptionsForConstruction(next.construction);

        const rows = buildOptions[next.diameter]?.[value] || [];

        const nextStaveCount = rows[0]?.staveCount || '';

        const nextLugCount =

          rows.find((row) => row.staveCount === nextStaveCount)?.lugCount || '';

        const allowedSpeciesCounts =

          getAllowedSoundLegendSpeciesCountOptions(nextStaveCount);

        const nextSpeciesCount = allowedSpeciesCounts.includes(

          next.soundLegendWoodSpeciesCount

        )

          ? next.soundLegendWoodSpeciesCount

          : allowedSpeciesCounts[0];

        return {

          ...next,

          staveCount: nextStaveCount,

          lugCount: nextLugCount,

          soundLegendWoodSpeciesCount: isSoundLegendConstruction(

            next.construction

          )

            ? nextSpeciesCount

            : next.soundLegendWoodSpeciesCount,

        };

      }

         if (key === 'staveCount') {

        const buildOptions = getBuildOptionsForConstruction(next.construction);

        const rows = buildOptions[next.diameter]?.[next.thickness] || [];

        const nextLugCount =

          rows.find((row) => row.staveCount === value)?.lugCount || '';

        const allowedSpeciesCounts =

          getAllowedSoundLegendSpeciesCountOptions(value);

        const nextSpeciesCount = allowedSpeciesCounts.includes(

          next.soundLegendWoodSpeciesCount

        )

          ? next.soundLegendWoodSpeciesCount

          : allowedSpeciesCounts[0];

        return {

          ...next,

          lugCount: nextLugCount,

          soundLegendWoodSpeciesCount: isSoundLegendConstruction(

            next.construction

          )

            ? nextSpeciesCount

            : next.soundLegendWoodSpeciesCount,

        };

      }

      if (key === 'lugCount') {
        return next;
      }

      return next;
    });
  };

  const resetDraft = () => {
    setDraftCalibration({
      ...legacyPrintCalibrationSeed,

      masterWeights: normalizeAllMasterWeightRows(
        legacyPrintCalibrationSeed.masterWeights
      ),
    });

    setSelector(INITIAL_SELECTOR);

    setLockedMasterWeights({
      firstListenMultiplier: [],

      playerAnalysisMultiplier: [],

      movementMultiplier: [],
    });

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

      const versionRef = doc(db, LEGACYPRINT_CALIBRATION_COLLECTION, versionId);

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

  const getEngineSelectorFields = () => {
    const selectedLineKey = getSelectedEngineLineKey();

    if (selectedLineKey === 'heritage') {
      return SELECTOR_FIELDS.filter((field) => {
        return ![
          'drumType',

          'construction',

          'exteriorScorch',

          'coreStaveShell',

          'steamBentExterior',
        ].includes(field.key);
      });
    }

    if (selectedLineKey === 'feuzon') {
      return SELECTOR_FIELDS.filter((field) => {
        return !['drumType', 'construction'].includes(field.key);
      });
    }

    if (selectedLineKey === 'soundlegend') {
      return SELECTOR_FIELDS.filter((field) => {
        return !['drumType', 'construction'].includes(field.key);
      });
    }

    return SELECTOR_FIELDS;
  };

  const getSelectedEngineLineKey = () => {
    if (isHeritageConstruction(safeSelector.construction)) return 'heritage';

    if (isFeuzonConstruction(safeSelector.construction)) return 'feuzon';

    if (isSoundLegendConstruction(safeSelector.construction)) {
      return 'soundlegend';
    }

    return 'nonOber';
  };

  const getNonOberAvailableModels = () => {
    const makerData =
      NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER[selectedNonOberMaker] ||
      NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER.default;

    return makerData[selectedNonOberDrumType] || [];
  };

  const renderNonOberReferenceBuilder = () => {
    const selectedGroup =
      NON_OBER_MANUFACTURER_GROUPS.find(
        (group) => group.group === selectedNonOberMakerGroup
      ) || NON_OBER_MANUFACTURER_GROUPS[0];

    const availableModels = getNonOberAvailableModels();

    return (
      <div className="legacyprint-non-ober-builder">
        <div className="legacyprint-preview-card-heading">
          <p>Reference Builder</p>

          <h4>Non-Ober Artisan / Manufacturer Reference</h4>
        </div>

        <p className="legacyprint-preview-description">
          This placeholder reference path will let the LegacyPrint™ engine
          compare or model popular non-Ober drums by maker, drum type, shell
          family, and known reference behavior.
        </p>

        <div className="legacyprint-non-ober-stage">
          <div className="legacyprint-non-ober-stage-heading">
            <span>Step 1</span>

            <strong>Select manufacturer group</strong>
          </div>

          <div className="legacyprint-engine-line-grid">
            {NON_OBER_MANUFACTURER_GROUPS.map((group) => (
              <button
                key={group.group}
                type="button"
                className={`legacyprint-engine-line-card ${
                  selectedNonOberMakerGroup === group.group ? 'active' : ''
                }`}
                onClick={() => {
                  setSelectedNonOberMakerGroup(group.group);

                  setSelectedNonOberMaker(group.makers[0]);

                  setSelectedNonOberModel('');
                }}
              >
                <strong>{group.group}</strong>

                <span>{group.makers.length} makers available</span>
              </button>
            ))}
          </div>
        </div>

        <div className="legacyprint-non-ober-stage">
          <div className="legacyprint-non-ober-stage-heading">
            <span>Step 2</span>

            <strong>Select manufacturer</strong>
          </div>

          <div className="legacyprint-builder-pill-grid">
            {selectedGroup.makers.map((maker) => (
              <button
                key={maker}
                type="button"
                className={selectedNonOberMaker === maker ? 'active' : ''}
                onClick={() => {
                  setSelectedNonOberMaker(maker);

                  setSelectedNonOberModel('');
                }}
              >
                {maker}
              </button>
            ))}
          </div>
        </div>

        <div className="legacyprint-non-ober-stage">
          <div className="legacyprint-non-ober-stage-heading">
            <span>Step 3</span>

            <strong>Select drum type</strong>
          </div>

          <div className="legacyprint-builder-pill-grid">
            {DRUM_TYPE_FILTER_OPTIONS.map((drumType) => (
              <button
                key={drumType}
                type="button"
                className={selectedNonOberDrumType === drumType ? 'active' : ''}
                onClick={() => {
                  setSelectedNonOberDrumType(drumType);

                  setSelectedNonOberModel('');

                  handleSelectorChange('drumType', drumType);
                }}
              >
                {drumType}
              </button>
            ))}
          </div>
        </div>

        <div className="legacyprint-non-ober-stage">
          <div className="legacyprint-non-ober-stage-heading">
            <span>Step 4</span>

            <strong>Popular placeholder models</strong>
          </div>

          <div className="legacyprint-non-ober-model-grid">
            {availableModels.map((model) => (
              <button
                key={model}
                type="button"
                className={selectedNonOberModel === model ? 'active' : ''}
                onClick={() => setSelectedNonOberModel(model)}
              >
                <strong>{model}</strong>

                <span>
                  {selectedNonOberMaker} / {selectedNonOberDrumType}
                </span>
              </button>
            ))}
          </div>

          {!availableModels.length && (
            <div className="legacyprint-admin-note neutral">
              <strong>No placeholder models yet</strong>

              <span>
                This maker does not have seeded models for this drum type yet.
              </span>
            </div>
          )}
        </div>

        {selectedNonOberModel && (
          <div className="legacyprint-admin-note">
            <strong>Selected reference model</strong>

            <span>
              {selectedNonOberMaker} / {selectedNonOberDrumType} /{' '}
              {selectedNonOberModel}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderEngineLineSelector = () => {
    const selectedLineKey = getSelectedEngineLineKey();

    return (
      <div className="legacyprint-engine-line-selector">
        <div className="legacyprint-engine-line-selector-heading">
          <p className="legacyprint-admin-overline">Start Here</p>

          <h4>Choose the voicing path</h4>

          <span>
            Select an Ober line or use the non-Ober reference path before
            choosing drum size, shell details, response options, and read views.
          </span>
        </div>

        <div className="legacyprint-engine-line-grid">
          {ENGINE_LINE_OPTIONS.map((lineOption) => {
            const isActive = selectedLineKey === lineOption.key;

            return (
              <button
                key={lineOption.key}
                type="button"
                className={`legacyprint-engine-line-card ${
                  isActive ? 'active' : ''
                }`}
                onClick={() => handleEngineLineChange(lineOption)}
              >
                <strong>{lineOption.label}</strong>

                <span>{lineOption.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
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

          lugs: safeSelector.lugCount,

          staveOption: safeSelector.thickness,

          hoopType: safeSelector.hoopType,

          hardwareColor: '',

          scorchDepth: safeSelector.finish || safeSelector.exteriorScorch || '',
        }}
        currentSpec={{
          size: safeSelector.diameter,

          diameter: safeSelector.diameter,

          depth: safeSelector.depth,

          lugCount: safeSelector.lugCount,

          staveCount: safeSelector.staveCount,

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
        HERITAGE is a snare-only Ober line. Use the builder controls to select
        diameter, depth, shell thickness, finish, hoop type, tuning, wires, and
        heads.
      </p>
    </div>
  );

  const renderSelectedLineBuilderPreview = () => {
    const selectedLineKey = getSelectedEngineLineKey();

    if (selectedLineKey === 'nonOber') {
      return (
        <div className="legacyprint-preview-card legacyprint-preview-card--builder">
          {renderNonOberReferenceBuilder()}
        </div>
      );
    }

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
      {showCalibrationHelper && (
        <section className="legacyprint-calibration-helper-panel">
          <div className="legacyprint-calibration-helper-heading">
            <div>
              <p className="legacyprint-admin-overline">Calibration guide</p>

              <h3>How to use the LegacyPrint™ engine builder</h3>

              <p>
                This tool controls the calibration layer that makes the
                LegacyPrint™ engine. Work from specific acoustic inputs first,
                then use global weighting only when the overall read behavior
                needs adjustment.
              </p>
            </div>

            <button
              type="button"
              className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
              onClick={() => setShowCalibrationHelper(false)}
            >
              Close
            </button>
          </div>

          <div className="legacyprint-calibration-helper-grid">
            {CALIBRATION_HELPER_SECTIONS.map((section) => (
              <article
                key={section.title}
                className="legacyprint-calibration-helper-card"
              >
                <h4>{section.title}</h4>

                <p>{section.summary}</p>

                <small>{section.useWhen}</small>
              </article>
            ))}
          </div>

          <div className="legacyprint-calibration-helper-footer">
            <strong>Recommended workflow:</strong>

            <span>
              Config Options → Benchmarks → Voice Preview → Master Weights →
              Save Draft → Publish Active.
            </span>
          </div>
        </section>
      )}

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
                  LegacyPrint™ Calibration
                </p>

                <h3>Voicing Engine Control Center</h3>

                <p className="legacyprint-admin-section-subcopy">
                  This is the admin control center for how the LegacyPrint™
                  Voicing Engine interprets drum builds. Use it to test real
                  configurations, adjust the calibration model, manage saved
                  versions, and control which read layers are visible across the
                  site.
                </p>
              </div>

              <div className="legacyprint-admin-overview-actions">
                <button
                  type="button"
                  className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                  onClick={() =>
                    setShowCalibrationHelper((current) => !current)
                  }
                >
                  {showCalibrationHelper
                    ? 'Hide How-To'
                    : 'How To Use This Tool'}
                </button>
              </div>
            </div>

            {showCalibrationHelper && (
              <div className="legacyprint-overview-howto-panel">
                <div>
                  <p className="legacyprint-admin-overline">
                    How to use this tool
                  </p>

                  <h4>Build first. Calibrate second.</h4>

                  <p>
                    Start in Engine Builder and choose a real drum
                    configuration. Check First Listen, Player Analysis, and
                    LegacyTuning. If the result feels wrong, move into
                    Calibration Tools and adjust the specific part of the model
                    that caused the issue.
                  </p>
                </div>

                <div className="legacyprint-overview-workflow-list">
                  <span>
                    <strong>1. Engine Builder</strong>
                    Test Ober lines or non-Ober reference drums against the live
                    engine.
                  </span>

                  <span>
                    <strong>2. Config Options</strong>
                    Adjust how specific choices like depth, thickness, finish,
                    hoops, heads, wires, and edges affect the seven voice nodes.
                  </span>

                  <span>
                    <strong>3. Benchmarks</strong>
                    Tune the expected range for an entire drum type, like snare,
                    rack tom, floor tom, bass drum, or concert tom.
                  </span>

                  <span>
                    <strong>4. Master Weights</strong>
                    Adjust global behavior only when a read layer feels broadly
                    biased.
                  </span>

                  <span>
                    <strong>5. Save / Publish</strong>
                    Save Draft while testing. Publish Active only when the
                    calibration is ready for the live engine.
                  </span>
                </div>
              </div>
            )}

            <div className="legacyprint-overview-intro-grid">
              <article className="legacyprint-overview-intro-card legacyprint-overview-intro-card--primary">
                <p className="legacyprint-admin-overline">What this controls</p>

                <h4>The seven-node voice model</h4>

                <p>
                  LegacyPrint™ reads every selected build across attack,
                  brightness, projection, sustain, warmth, sensitivity, and
                  control. This dashboard manages the calibration data behind
                  those scores.
                </p>
              </article>

              <article className="legacyprint-overview-intro-card">
                <p className="legacyprint-admin-overline">Main workflow</p>

                <h4>Use the builder as the test bench</h4>

                <p>
                  The Engine Builder is where you test real configurations.
                  Calibration Tools are where you correct the underlying model
                  when the read does not match the expected acoustic behavior.
                </p>
              </article>

              <article className="legacyprint-overview-intro-card">
                <p className="legacyprint-admin-overline">Current state</p>

                <h4>
                  {hasUnsavedChanges
                    ? 'Draft has unsaved changes'
                    : calibrationSourceLabel}
                </h4>

                <p>
                  The cards below show the active calibration source, current
                  version, option coverage, benchmark coverage, and saved
                  version status.
                </p>
              </article>
            </div>

            <div className="legacyprint-admin-grid">
              <LegacyPrintStatCard
                label="Calibration Source"
                value={
                  isLoadingCalibration
                    ? 'Loading'
                    : calibrationSourceLabel || 'Local Seed'
                }
                detail={
                  hasUnsavedChanges
                    ? 'Draft has unsaved local changes'
                    : 'Current working calibration'
                }
              />

              <LegacyPrintStatCard
                label="Active Version"
                value={
                  draftCalibration.version?.label || 'Untitled Calibration'
                }
                detail={
                  draftCalibration.version?.updatedAt ||
                  'No timestamp available'
                }
              />

              <LegacyPrintStatCard
                label="Config Options"
                value={configOptionCount}
                detail="Across all selector tables"
              />

              <LegacyPrintStatCard
                label="Benchmark Rows"
                value={draftCalibration.typeBenchmarks?.length || 0}
                detail="5 drum types × 7 voice nodes"
              />
            </div>

            <div className="legacyprint-admin-grid legacyprint-admin-grid--compact">
              <LegacyPrintStatCard
                label="Voice Nodes"
                value={LEGACYPRINT_NODE_ORDER.length}
                detail="Attack, brightness, projection, sustain, warmth, sensitivity, control"
              />

              <LegacyPrintStatCard
                label="Drum Types"
                value={
                  new Set(
                    (draftCalibration.typeBenchmarks || []).map(
                      (row) => row.drumType
                    )
                  ).size
                }
                detail="Snare, toms, bass, and concert tom coverage"
              />

              <LegacyPrintStatCard
                label="Fine Depth"
                value="SoundLegend Only"
                detail="0.25 in depth increments"
              />

              <LegacyPrintStatCard
                label="Saved Versions"
                value={savedVersions.length}
                detail={
                  savedVersions.length
                    ? 'Loaded from Firestore snapshots'
                    : 'Refresh from Versions tab'
                }
              />
            </div>

            <div className="legacyprint-admin-overview-split">
              <div className="legacyprint-admin-note">
                <strong>Recommended calibration order</strong>

                <span>
                  Engine Builder → Config Options → Benchmarks → Master Weights
                  → Save Draft → Publish Active.
                </span>
              </div>

              <div className="legacyprint-admin-note neutral">
                <strong>System checklist</strong>

                <ul className="legacyprint-admin-checklist">
                  <li>
                    <span>✓</span>

                    <strong>Firestore source loaded</strong>
                  </li>

                  <li>
                    <span>✓</span>

                    <strong>Draft save enabled</strong>
                  </li>

                  <li>
                    <span>✓</span>

                    <strong>Publish creates active + version snapshot</strong>
                  </li>

                  <li className="pending">
                    <span>•</span>

                    <strong>Version revert controls coming next</strong>
                  </li>

                  <li className="pending">
                    <span>•</span>

                    <strong>Visibility editing controls coming next</strong>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Engine Builder' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">
                  Live voicing engine
                </p>

                <h3>Engine Builder</h3>
              </div>

              {/* <button

  type="button"

  className="legacyprint-admin-status-dot legacyprint-admin-status-dot--button"

  onClick={() => {

    handleSelectorChange(

      'comparisonMode',

      safeSelector.comparisonMode === 'Single Drum Type Benchmark'

        ? 'All Drum Type Comparison'

        : 'Single Drum Type Benchmark'

    );

  }}

  title="Toggle comparison mode"

>

  {preview.comparisonMode?.option}

</button> */}
            </div>

            {renderEngineLineSelector()}

            <div className="legacyprint-preview-layout">
              <AdminLegacyPrintSelector
                selectorFields={getEngineSelectorFields()}
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
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Calibration Tools' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">Engine calibration</p>

                <h3>Calibration Tools</h3>

                <p className="legacyprint-admin-section-subcopy">
                  Adjust the math, benchmarks, option behavior, rule logic, and
                  saved calibration versions that make the LegacyPrint™ engine
                  behave correctly.
                </p>
              </div>
            </div>

            <div className="legacyprint-subtabs" role="tablist">
              {LEGACYPRINT_CALIBRATION_TOOL_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={activeCalibrationToolTab === tab ? 'active' : ''}
                  onClick={() => setActiveCalibrationToolTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="legacyprint-calibration-tool-panel">
              {activeCalibrationToolTab === 'Master Weights' && (
                <section className="legacyprint-admin-section">
                  <div className="legacyprint-admin-section-heading">
                    <div>
                      <p className="legacyprint-admin-overline">
                        Global multipliers
                      </p>

                      <h3>Master Weights</h3>

                      <p className="legacyprint-admin-section-subcopy">
                        Each row controls one read layer. Every row should total
                        7.00 across the seven voice nodes. Lock any node you
                        want to preserve, then edit another value — only the
                        unlocked nodes in that row will rebalance.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="legacyprint-admin-button secondary legacyprint-admin-button--dark"
                      onClick={() => {
                        updateDraftCalibration((current) => ({
                          ...current,

                          masterWeights: normalizeAllMasterWeightRows(
                            legacyPrintCalibrationSeed.masterWeights
                          ),
                        }));

                        setLockedMasterWeights({
                          playerAnalysisMultiplier: [],

                          firstListenMultiplier: [],

                          movementMultiplier: [],
                        });
                      }}
                    >
                      Reset Master Weights
                    </button>
                  </div>

                  <div className="legacyprint-master-display-toggle">
                    <span>Display Values</span>

                    <div>
                      <button
                        type="button"
                        className={
                          masterWeightDisplayMode === 'multiplier'
                            ? 'active'
                            : ''
                        }
                        onClick={() => setMasterWeightDisplayMode('multiplier')}
                      >
                        Multiplier
                      </button>

                      <button
                        type="button"
                        className={
                          masterWeightDisplayMode === 'influence'
                            ? 'active'
                            : ''
                        }
                        onClick={() => setMasterWeightDisplayMode('influence')}
                      >
                        Influence
                      </button>

                      <button
                        type="button"
                        className={
                          masterWeightDisplayMode === 'share' ? 'active' : ''
                        }
                        onClick={() => setMasterWeightDisplayMode('share')}
                      >
                        Share
                      </button>
                    </div>

                    <small>
                      Influence shows each node as a -100 to +100 bias around
                      neutral. Share shows each node as part of the row total.
                    </small>
                  </div>

                  <div className="legacyprint-master-matrix-wrap">
                    <table className="legacyprint-master-matrix">
                      <thead>
                        <tr>
                          <th>Read Layer</th>

                          {LEGACYPRINT_NODE_ORDER.map((node) => (
                            <th key={node}>
                              <span
                                className={`legacyprint-master-node-dot ${node}`}
                              />

                              {LEGACYPRINT_NODE_LABELS[node]}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {[
                          'firstListenMultiplier',

                          'playerAnalysisMultiplier',

                          'movementMultiplier',
                        ].map((weightKey) => {
                          return (
                            <tr key={weightKey}>
                              <td className="legacyprint-master-layer-cell">
                                <strong>
                                  {getMasterWeightLabel(weightKey)}
                                </strong>

                                <small>
                                  {weightKey === 'playerAnalysisMultiplier'
                                    ? 'Full seven-node player read'
                                    : weightKey === 'firstListenMultiplier'
                                      ? 'What surfaces first'
                                      : 'How strongly node movement is allowed to show'}
                                </small>
                              </td>

                              {LEGACYPRINT_NODE_ORDER.map((node) => {
                                const row = (
                                  draftCalibration.masterWeights || []
                                ).find((item) => item.node === node);

                                const value = Number(row?.[weightKey] || 0);

                                const isLocked = isMasterWeightLocked({
                                  node,
                                  weightKey,
                                });

                                return (
                                  <td
                                    key={`${weightKey}-${node}`}
                                    className={
                                      isLocked
                                        ? 'legacyprint-master-cell--locked'
                                        : ''
                                    }
                                  >
                                    <MasterWeightKnob
                                      node={node}
                                      weightKey={weightKey}
                                      value={value}
                                      displayMode={masterWeightDisplayMode}
                                      isLocked={isLocked}
                                      onChange={(nextValue) =>
                                        updateMasterWeightGroupValue({
                                          node,

                                          key: weightKey,

                                          value: nextValue,
                                        })
                                      }
                                      onToggleLock={() =>
                                        toggleMasterWeightLock({
                                          node,

                                          weightKey,
                                        })
                                      }
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="legacyprint-master-notes-grid">
                    {(draftCalibration.masterWeights || []).map((row) => (
                      <label
                        key={row.node}
                        className="legacyprint-master-note-row"
                      >
                        <span>
                          <span
                            className={`legacyprint-master-node-dot ${row.node}`}
                          />
                          {LEGACYPRINT_NODE_LABELS[row.node]} Notes
                        </span>

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
                    ))}
                  </div>

                  <div className="legacyprint-admin-note neutral legacyprint-master-helper-note">
                    <strong>How this works</strong>

                    <span>
                      A neutral read layer would be 1.00 per node for a total of
                      7.00. Values below 1.00 restrain a node. Values above 1.00
                      emphasize it. Locked cells stay fixed while unlocked cells
                      absorb the rebalance.
                    </span>
                  </div>
                </section>
              )}
              {activeCalibrationToolTab === 'Benchmarks' && (
                <section className="legacyprint-admin-section">
                  <div className="legacyprint-admin-section-heading">
                    <div>
                      <p className="legacyprint-admin-overline">
                        Drum type calibration
                      </p>

                      <h3>Type Benchmarks</h3>

                      <p className="legacyprint-admin-section-subcopy legacyprint-admin-section-subcopy--dark">
                        These sliders define the expected voice range for each
                        drum type. Min, Neutral, and Max shape the Player
                        Analysis scale. First Listen Multiplier controls how
                        easily that node rises to the surface in the first
                        impression.
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

              {activeCalibrationToolTab === 'Config Options' && (
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
                          className={
                            activeConfigCategory === key ? 'active' : ''
                          }
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
                                  const isChecked =
                                    configHybridTypes.includes(type);

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
                          {getAllowedDrumTypeOptionsForLine(
                            configLineFilter
                          ).map((drumType) => (
                            <option key={drumType} value={drumType}>
                              {drumType}
                            </option>
                          ))}
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
                          <p className="legacyprint-admin-overline">
                            New Option
                          </p>

                          <h4>
                            Add to{' '}
                            {CONFIG_CATEGORY_LABELS[activeConfigCategory]}
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
                              {CONSTRUCTION_ASSIGNMENT_OPTIONS.map(
                                (construction) => (
                                  <option
                                    key={construction}
                                    value={construction}
                                  >
                                    {construction}
                                  </option>
                                )
                              )}
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
                              <th key={node}>
                                {LEGACYPRINT_NODE_LABELS[node]}
                              </th>
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
                                <td>
                                  {row.__displayGroup || 'Standard Depth'}
                                </td>
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
                                colSpan={
                                  activeConfigCategory === 'depth' ? 14 : 13
                                }
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
              {activeCalibrationToolTab === 'Availability' && (
                <section className="legacyprint-admin-section">
                  <div className="legacyprint-admin-section-heading">
                    <div>
                      <p className="legacyprint-admin-overline">
                        Rules preview
                      </p>

                      <h3>Availability</h3>
                    </div>
                  </div>

                  <div className="legacyprint-admin-note">
                    <strong>Rule model loaded</strong>

                    <span>
                      Diameter, depth, finish, shell thickness, hoop, bearing
                      edge, snare bed, snare wire, and construction controls now
                      filter from the selected drum type, construction,
                      diameter, and depth.
                    </span>
                  </div>
                </section>
              )}

              {activeCalibrationToolTab === 'Versions' && (
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
                      {isLoadingVersions
                        ? 'Loading Versions...'
                        : 'Refresh Versions'}
                    </button>
                  </div>

                  <div className="legacyprint-admin-note neutral">
                    <strong>Saved Firestore snapshots</strong>

                    <span>
                      Publish Active creates timestamped version documents
                      inside legacyprint_calibrations. Click Refresh Versions to
                      load them here.
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
                              {version.calibration?.version?.source ||
                                'Firestore'}
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
          </section>
        )}

        {activeTab === 'Engine View Settings' && (
          <section className="legacyprint-admin-section">
            <div className="legacyprint-admin-section-heading">
              <div>
                <p className="legacyprint-admin-overline">
                  Read layer visibility
                </p>

                <h3>Engine View Settings</h3>
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
      </div>
    </div>
  );
};

export default AdminLegacyPrintCalibration;
