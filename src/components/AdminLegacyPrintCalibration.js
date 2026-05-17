// src/components/AdminLegacyPrintCalibration.js

import React, { useEffect, useMemo, useState } from 'react';

import BarChart from './BarChart';

import { getFunctions, httpsCallable } from 'firebase/functions';

import SnareReferenceResourceManager from './SnareReferenceResourceManager';

import './SnareReferenceResourceManager.css';

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
  updateDoc,
  startAfter,
  limit,
} from 'firebase/firestore';

import { db } from '../firebaseConfig';

import SnareReferenceEditor from './SnareReferenceEditor';

import {
  LEGACYPRINT_NODE_LABELS,
  LEGACYPRINT_NODE_ORDER,
  legacyPrintCalibrationSeed,
} from '../data/legacyPrintCalibrationSeed';

import {
  getReferenceCompanyTypes,
  getReferenceCompaniesByType,
  getReferenceLines,
  getReferenceModels,
} from '../data/legacyPrint/referenceDrums/referenceDrumSelectors';

import {
  REFERENCE_LINE_ACCESS,
  REFERENCE_LINE_BUCKET_LABELS,
  REFERENCE_LINE_STATUS,
  REFERENCE_LINE_STATUS_ORDER,
} from '../data/legacyPrint/referenceDrums/referenceLineStatus';

import './AdminLegacyPrintCalibration.css';

const LEGACYPRINT_CALIBRATION_COLLECTION = 'legacyprint_calibrations';

const SNARE_REFERENCE_DRUMS_COLLECTION = 'snareReferenceDrums';

const LEGACYPRINT_ACTIVE_DOC_ID = 'active';

const LEGACYPRINT_DRAFT_DOC_ID = 'draft';

const LEGACYPRINT_TABS = [
  'Overview',

  'Engine Builder',

  'Calibration Tools',

  'Engine Resources',

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
    key: 'nonOberCompanyType',

    label: 'Company Type',

    source: 'nonOberCompanyType',
  },

  {
    key: 'nonOberCompanyName',

    label: 'Company / Builder',

    source: 'nonOberCompanyName',
  },

  {
    key: 'nonOberLineName',

    label: 'Line / Series',

    source: 'nonOberLineName',
  },

  {
    key: 'nonOberModelName',

    label: 'Model / Shell Reference',

    source: 'nonOberModelName',
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
    key: 'lugCount',

    label: 'Lug Count',

    source: 'lugCount',
  },

  {
    key: 'staveCount',

    label: 'Stave Count',

    source: 'staveCount',
  },

  {
    key: 'nonOberBaselineConstruction',

    label: 'Baseline Construction',

    source: 'nonOberBaselineConstruction',
  },

  {
    key: 'nonOberMaterial',

    label: 'Material',

    source: 'nonOberMaterial',
  },

  {
    key: 'nonOberThicknessGroup',

    label: 'Thickness Range',

    source: 'nonOberThicknessGroup',
  },

  {
    key: 'nonOberLineSoundFocus',

    label: 'Line Sound Focus',

    source: 'nonOberLineSoundFocus',
  },

  {
    key: 'nonOberPlyLayupStyle',

    label: 'Ply Layup Style',

    source: 'nonOberPlyLayupStyle',
  },

  {
    key: 'nonOberReinforcementRings',

    label: 'Reinforcement Rings',

    source: 'nonOberReinforcementRings',
  },

  {
    key: 'nonOberBeadedShell',

    label: 'Beaded Shell',

    source: 'nonOberBeadedShell',
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

const NON_OBER_MODEL_OPTIONS_BY_COMPANY_AND_LINE = {
  Tama: {
    'STAR Maple': {
      Snare: ['STAR Maple Snare'],

      'Rack Tom': ['STAR Maple Rack Tom'],

      'Floor Tom': ['STAR Maple Floor Tom'],

      'Bass Drum': ['STAR Maple Bass Drum'],

      'Overall Kit / Line Sound': ['STAR Maple Full Kit Reference'],
    },

    'STAR Walnut': {
      Snare: ['STAR Walnut Snare'],

      'Rack Tom': ['STAR Walnut Rack Tom'],

      'Floor Tom': ['STAR Walnut Floor Tom'],

      'Bass Drum': ['STAR Walnut Bass Drum'],

      'Overall Kit / Line Sound': ['STAR Walnut Full Kit Reference'],
    },

    'STAR Bubinga': {
      Snare: ['STAR Bubinga Snare'],

      'Rack Tom': ['STAR Bubinga Rack Tom'],

      'Floor Tom': ['STAR Bubinga Floor Tom'],

      'Bass Drum': ['STAR Bubinga Bass Drum'],

      'Overall Kit / Line Sound': ['STAR Bubinga Full Kit Reference'],
    },

    'STAR Reserve': {
      Snare: ['STAR Reserve Snare'],

      'Overall Kit / Line Sound': ['STAR Reserve Snare Reference'],
    },

    Starclassic: {
      Snare: ['Starclassic General Snare Reference'],

      'Rack Tom': ['Starclassic General Rack Tom Reference'],

      'Floor Tom': ['Starclassic General Floor Tom Reference'],

      'Bass Drum': ['Starclassic General Bass Drum Reference'],

      'Overall Kit / Line Sound': ['Starclassic Full Line Reference'],
    },

    'Starclassic Maple': {
      Snare: ['Starclassic Maple Snare'],

      'Rack Tom': ['Starclassic Maple Rack Tom'],

      'Floor Tom': ['Starclassic Maple Floor Tom'],

      'Bass Drum': ['Starclassic Maple Bass Drum'],

      'Overall Kit / Line Sound': ['Starclassic Maple Full Kit Reference'],
    },

    'Starclassic Walnut/Birch': {
      Snare: ['Starclassic Walnut/Birch Snare'],

      'Rack Tom': ['Starclassic Walnut/Birch Rack Tom'],

      'Floor Tom': ['Starclassic Walnut/Birch Floor Tom'],

      'Bass Drum': ['Starclassic Walnut/Birch Bass Drum'],

      'Overall Kit / Line Sound': [
        'Starclassic Walnut/Birch Full Kit Reference',
      ],
    },

    'Starclassic Performer': {
      Snare: ['Starclassic Performer Snare'],

      'Rack Tom': ['Starclassic Performer Rack Tom'],

      'Floor Tom': ['Starclassic Performer Floor Tom'],

      'Bass Drum': ['Starclassic Performer Bass Drum'],

      'Overall Kit / Line Sound': ['Starclassic Performer Full Kit Reference'],
    },

    'Starclassic Performer Birch/Bubinga': {
      Snare: ['Starclassic Performer Birch/Bubinga Snare'],

      'Rack Tom': ['Starclassic Performer Birch/Bubinga Rack Tom'],

      'Floor Tom': ['Starclassic Performer Birch/Bubinga Floor Tom'],

      'Bass Drum': ['Starclassic Performer Birch/Bubinga Bass Drum'],

      'Overall Kit / Line Sound': [
        'Starclassic Performer Birch/Bubinga Full Kit Reference',
      ],
    },

    'Starclassic Bubinga': {
      Snare: ['Starclassic Bubinga Snare'],

      'Rack Tom': ['Starclassic Bubinga Rack Tom'],

      'Floor Tom': ['Starclassic Bubinga Floor Tom'],

      'Bass Drum': ['Starclassic Bubinga Bass Drum'],

      'Overall Kit / Line Sound': ['Starclassic Bubinga Full Kit Reference'],
    },

    'Starclassic Birch': {
      Snare: ['Starclassic Birch Snare'],

      'Rack Tom': ['Starclassic Birch Rack Tom'],

      'Floor Tom': ['Starclassic Birch Floor Tom'],

      'Bass Drum': ['Starclassic Birch Bass Drum'],

      'Overall Kit / Line Sound': ['Starclassic Birch Full Kit Reference'],
    },

    'Starclassic Birch/Bubinga': {
      Snare: ['Starclassic Birch/Bubinga Snare'],

      'Rack Tom': ['Starclassic Birch/Bubinga Rack Tom'],

      'Floor Tom': ['Starclassic Birch/Bubinga Floor Tom'],

      'Bass Drum': ['Starclassic Birch/Bubinga Bass Drum'],

      'Overall Kit / Line Sound': [
        'Starclassic Birch/Bubinga Full Kit Reference',
      ],
    },

    'Starclassic Mirage': {
      Snare: ['Starclassic Mirage Acrylic Snare'],

      'Rack Tom': ['Starclassic Mirage Acrylic Rack Tom'],

      'Floor Tom': ['Starclassic Mirage Acrylic Floor Tom'],

      'Bass Drum': ['Starclassic Mirage Acrylic Bass Drum'],

      'Overall Kit / Line Sound': ['Starclassic Mirage Full Kit Reference'],
    },

    'Starclassic Exotix': {
      Snare: ['Starclassic Exotix Snare'],

      'Rack Tom': ['Starclassic Exotix Rack Tom'],

      'Floor Tom': ['Starclassic Exotix Floor Tom'],

      'Bass Drum': ['Starclassic Exotix Bass Drum'],

      'Overall Kit / Line Sound': ['Starclassic Exotix Full Kit Reference'],
    },

    Superstar: {
      Snare: ['Superstar Snare'],

      'Rack Tom': ['Superstar Rack Tom'],

      'Floor Tom': ['Superstar Floor Tom'],

      'Bass Drum': ['Superstar Bass Drum'],

      'Overall Kit / Line Sound': ['Superstar Full Kit Reference'],
    },

    'Superstar Classic': {
      Snare: ['Superstar Classic Maple Snare'],

      'Rack Tom': ['Superstar Classic Maple Rack Tom'],

      'Floor Tom': ['Superstar Classic Maple Floor Tom'],

      'Bass Drum': ['Superstar Classic Maple Bass Drum'],

      'Overall Kit / Line Sound': ['Superstar Classic Full Kit Reference'],
    },

    'Superstar Hyper-Drive': {
      Snare: ['Superstar Hyper-Drive Snare'],

      'Rack Tom': ['Superstar Hyper-Drive Rack Tom'],

      'Floor Tom': ['Superstar Hyper-Drive Floor Tom'],

      'Bass Drum': ['Superstar Hyper-Drive Bass Drum'],

      'Overall Kit / Line Sound': ['Superstar Hyper-Drive Full Kit Reference'],
    },

    'Superstar Hyper-Drive Duo': {
      Snare: ['Superstar Hyper-Drive Duo Snare'],

      'Rack Tom': ['Superstar Hyper-Drive Duo Rack Tom'],

      'Floor Tom': ['Superstar Hyper-Drive Duo Floor Tom'],

      'Bass Drum': ['Superstar Hyper-Drive Duo Bass Drum'],

      'Overall Kit / Line Sound': [
        'Superstar Hyper-Drive Duo Full Kit Reference',
      ],
    },

    'Superstar Custom': {
      Snare: ['Superstar Custom Snare'],

      'Rack Tom': ['Superstar Custom Rack Tom'],

      'Floor Tom': ['Superstar Custom Floor Tom'],

      'Bass Drum': ['Superstar Custom Bass Drum'],

      'Overall Kit / Line Sound': ['Superstar Custom Full Kit Reference'],
    },

    'Superstar EFX': {
      Snare: ['Superstar EFX Snare'],

      'Rack Tom': ['Superstar EFX Rack Tom'],

      'Floor Tom': ['Superstar EFX Floor Tom'],

      'Bass Drum': ['Superstar EFX Bass Drum'],

      'Overall Kit / Line Sound': ['Superstar EFX Full Kit Reference'],
    },

    'Superstar SK': {
      Snare: ['Superstar SK Snare'],

      'Rack Tom': ['Superstar SK Rack Tom'],

      'Floor Tom': ['Superstar SK Floor Tom'],

      'Bass Drum': ['Superstar SK Bass Drum'],

      'Overall Kit / Line Sound': ['Superstar SK Full Kit Reference'],
    },

    Silverstar: {
      Snare: ['Silverstar Birch Snare'],

      'Rack Tom': ['Silverstar Birch Rack Tom'],

      'Floor Tom': ['Silverstar Birch Floor Tom'],

      'Bass Drum': ['Silverstar Birch Bass Drum'],

      'Overall Kit / Line Sound': ['Silverstar Full Kit Reference'],
    },

    Imperialstar: {
      Snare: ['Imperialstar Poplar Snare'],

      'Rack Tom': ['Imperialstar Poplar Rack Tom'],

      'Floor Tom': ['Imperialstar Poplar Floor Tom'],

      'Bass Drum': ['Imperialstar Poplar Bass Drum'],

      'Overall Kit / Line Sound': ['Imperialstar Full Kit Reference'],
    },

    Swingstar: {
      Snare: ['Swingstar Snare'],

      'Rack Tom': ['Swingstar Rack Tom'],

      'Floor Tom': ['Swingstar Floor Tom'],

      'Bass Drum': ['Swingstar Bass Drum'],

      'Overall Kit / Line Sound': ['Swingstar Full Kit Reference'],
    },

    Rockstar: {
      Snare: ['Rockstar Snare'],

      'Rack Tom': ['Rockstar Rack Tom'],

      'Floor Tom': ['Rockstar Floor Tom'],

      'Bass Drum': ['Rockstar Bass Drum'],

      'Overall Kit / Line Sound': ['Rockstar Full Kit Reference'],
    },

    'Rockstar Custom': {
      Snare: ['Rockstar Custom Snare'],

      'Rack Tom': ['Rockstar Custom Rack Tom'],

      'Floor Tom': ['Rockstar Custom Floor Tom'],

      'Bass Drum': ['Rockstar Custom Bass Drum'],

      'Overall Kit / Line Sound': ['Rockstar Custom Full Kit Reference'],
    },

    Artstar: {
      Snare: ['Artstar Snare'],

      'Rack Tom': ['Artstar Rack Tom'],

      'Floor Tom': ['Artstar Floor Tom'],

      'Bass Drum': ['Artstar Bass Drum'],

      'Overall Kit / Line Sound': ['Artstar Full Kit Reference'],
    },

    'Artstar II': {
      Snare: ['Artstar II Snare'],

      'Rack Tom': ['Artstar II Rack Tom'],

      'Floor Tom': ['Artstar II Floor Tom'],

      'Bass Drum': ['Artstar II Bass Drum'],

      'Overall Kit / Line Sound': ['Artstar II Full Kit Reference'],
    },

    Granstar: {
      Snare: ['Granstar Snare'],

      'Rack Tom': ['Granstar Rack Tom'],

      'Floor Tom': ['Granstar Floor Tom'],

      'Bass Drum': ['Granstar Bass Drum'],

      'Overall Kit / Line Sound': ['Granstar Full Kit Reference'],
    },

    'Granstar Custom': {
      Snare: ['Granstar Custom Snare'],

      'Rack Tom': ['Granstar Custom Rack Tom'],

      'Floor Tom': ['Granstar Custom Floor Tom'],

      'Bass Drum': ['Granstar Custom Bass Drum'],

      'Overall Kit / Line Sound': ['Granstar Custom Full Kit Reference'],
    },

    Crestar: {
      Snare: ['Crestar Snare'],

      'Rack Tom': ['Crestar Rack Tom'],

      'Floor Tom': ['Crestar Floor Tom'],

      'Bass Drum': ['Crestar Bass Drum'],

      'Overall Kit / Line Sound': ['Crestar Full Kit Reference'],
    },

    Royalstar: {
      Snare: ['Royalstar Snare'],

      'Rack Tom': ['Royalstar Rack Tom'],

      'Floor Tom': ['Royalstar Floor Tom'],

      'Bass Drum': ['Royalstar Bass Drum'],

      'Overall Kit / Line Sound': ['Royalstar Full Kit Reference'],
    },

    Stagestar: {
      Snare: ['Stagestar Snare'],

      'Rack Tom': ['Stagestar Rack Tom'],

      'Floor Tom': ['Stagestar Floor Tom'],

      'Bass Drum': ['Stagestar Bass Drum'],

      'Overall Kit / Line Sound': ['Stagestar Full Kit Reference'],
    },

    'Club-JAM': {
      Snare: ['Club-JAM Snare'],

      'Rack Tom': ['Club-JAM Rack Tom'],

      'Floor Tom': ['Club-JAM Floor Tom'],

      'Bass Drum': ['Club-JAM Bass Drum'],

      'Overall Kit / Line Sound': ['Club-JAM Full Kit Reference'],
    },

    'Club-JAM Flyer': {
      Snare: ['Club-JAM Flyer Snare'],

      'Rack Tom': ['Club-JAM Flyer Rack Tom'],

      'Floor Tom': ['Club-JAM Flyer Floor Tom'],

      'Bass Drum': ['Club-JAM Flyer Bass Drum'],

      'Overall Kit / Line Sound': ['Club-JAM Flyer Full Kit Reference'],
    },

    'Club-JAM Pancake': {
      Snare: ['Club-JAM Pancake Snare'],

      'Rack Tom': ['Club-JAM Pancake Rack Tom'],

      'Floor Tom': ['Club-JAM Pancake Floor Tom'],

      'Bass Drum': ['Club-JAM Pancake Bass Drum'],

      'Overall Kit / Line Sound': ['Club-JAM Pancake Full Kit Reference'],
    },

    'Cocktail-JAM': {
      Snare: ['Cocktail-JAM Snare'],

      'Rack Tom': ['Cocktail-JAM Rack Tom'],

      'Floor Tom': ['Cocktail-JAM Floor Tom'],

      'Bass Drum': ['Cocktail-JAM Bass Drum'],

      'Overall Kit / Line Sound': ['Cocktail-JAM Full Kit Reference'],
    },

    'Cocktail-JAM Mini': {
      Snare: ['Cocktail-JAM Mini Snare'],

      'Rack Tom': ['Cocktail-JAM Mini Rack Tom'],

      'Floor Tom': ['Cocktail-JAM Mini Floor Tom'],

      'Bass Drum': ['Cocktail-JAM Mini Bass Drum'],

      'Overall Kit / Line Sound': ['Cocktail-JAM Mini Full Kit Reference'],
    },

    'S.L.P.': {
      Snare: [
        'S.L.P. G-Maple Snare',

        'S.L.P. G-Bubinga Snare',

        'S.L.P. Big Black Steel Snare',

        'S.L.P. Fat Spruce Snare',

        'S.L.P. Dynamic Kapur Snare',

        'S.L.P. Studio Maple Snare',

        'S.L.P. Vintage Steel Snare',

        'S.L.P. Classic Maple Snare',

        'S.L.P. Spotted Gum Snare',

        'S.L.P. Sonic Steel Snare',
      ],

      'Overall Kit / Line Sound': ['S.L.P. Snare Line Reference'],
    },

    'Sound Lab Project': {
      Snare: [
        'S.L.P. G-Maple Snare',

        'S.L.P. G-Bubinga Snare',

        'S.L.P. Big Black Steel Snare',

        'S.L.P. Fat Spruce Snare',

        'S.L.P. Dynamic Kapur Snare',

        'S.L.P. Studio Maple Snare',

        'S.L.P. Vintage Steel Snare',

        'S.L.P. Classic Maple Snare',

        'S.L.P. Spotted Gum Snare',

        'S.L.P. Sonic Steel Snare',
      ],

      'Overall Kit / Line Sound': ['Sound Lab Project Snare Line Reference'],
    },

    'S.L.P. Dynamic Kapur': {
      Snare: ['S.L.P. Dynamic Kapur Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Dynamic Kapur Snare Reference'],
    },

    'S.L.P. G-Maple': {
      Snare: ['S.L.P. G-Maple Snare'],

      'Overall Kit / Line Sound': ['S.L.P. G-Maple Snare Reference'],
    },

    'S.L.P. G-Bubinga': {
      Snare: ['S.L.P. G-Bubinga Snare'],

      'Overall Kit / Line Sound': ['S.L.P. G-Bubinga Snare Reference'],
    },

    'S.L.P. Big Black Steel': {
      Snare: ['S.L.P. Big Black Steel Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Big Black Steel Snare Reference'],
    },

    'S.L.P. Fat Spruce': {
      Snare: ['S.L.P. Fat Spruce Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Fat Spruce Snare Reference'],
    },

    'S.L.P. Vintage Steel': {
      Snare: ['S.L.P. Vintage Steel Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Vintage Steel Snare Reference'],
    },

    'S.L.P. Studio Maple': {
      Snare: ['S.L.P. Studio Maple Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Studio Maple Snare Reference'],
    },

    'S.L.P. Classic Maple': {
      Snare: ['S.L.P. Classic Maple Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Classic Maple Snare Reference'],
    },

    'S.L.P. Spotted Gum': {
      Snare: ['S.L.P. Spotted Gum Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Spotted Gum Snare Reference'],
    },

    'S.L.P. Duo Birch': {
      Snare: ['S.L.P. Duo Birch Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Duo Birch Snare Reference'],
    },

    'S.L.P. Sonic Steel': {
      Snare: ['S.L.P. Sonic Steel Snare'],

      'Overall Kit / Line Sound': ['S.L.P. Sonic Steel Snare Reference'],
    },

    'S.L.P. LAL145': {
      Snare: ['S.L.P. LAL145 Aluminum Snare'],

      'Overall Kit / Line Sound': ['S.L.P. LAL145 Snare Reference'],
    },

    Starphonic: {
      Snare: [
        'Starphonic Aluminum Snare',

        'Starphonic Brass Snare',

        'Starphonic Steel Snare',

        'Starphonic Copper Snare',

        'Starphonic Maple Snare',

        'Starphonic Walnut Snare',
      ],

      'Overall Kit / Line Sound': ['Starphonic Snare Line Reference'],
    },

    Metalworks: {
      Snare: [
        'Metalworks Steel Snare',

        'Metalworks Effect Snare',

        'Metalworks Black Steel Snare',
      ],

      'Overall Kit / Line Sound': ['Metalworks Snare Line Reference'],
    },

    'Bell Brass': {
      Snare: ['Bell Brass Snare'],

      'Overall Kit / Line Sound': ['Bell Brass Snare Reference'],
    },

    Warlord: {
      Snare: [
        'Warlord Masai Snare',

        'Warlord Praetorian Snare',

        'Warlord Spartan Snare',

        'Warlord Valkyrie Snare',
      ],

      'Overall Kit / Line Sound': ['Warlord Snare Line Reference'],
    },

    'Signature Series': {
      Snare: ['Tama Signature Series Snare Reference'],

      'Overall Kit / Line Sound': ['Tama Signature Series Reference'],
    },

    'Simon Phillips Signature': {
      Snare: ['Simon Phillips Signature Snare'],

      'Overall Kit / Line Sound': ['Simon Phillips Signature Reference'],
    },

    'Stewart Copeland Signature': {
      Snare: ['Stewart Copeland Signature Snare'],

      'Overall Kit / Line Sound': ['Stewart Copeland Signature Reference'],
    },

    'John Tempesta Signature': {
      Snare: ['John Tempesta Signature Snare'],

      'Overall Kit / Line Sound': ['John Tempesta Signature Reference'],
    },

    'Mike Portnoy Signature': {
      Snare: ['Mike Portnoy Signature Snare'],

      'Overall Kit / Line Sound': ['Mike Portnoy Signature Reference'],
    },

    'Lars Ulrich Signature': {
      Snare: ['Lars Ulrich Signature Snare'],

      'Overall Kit / Line Sound': ['Lars Ulrich Signature Reference'],
    },
  },
};

const getNonOberModelOptionsForSelection = ({
  companyName = '',

  lineName = '',

  drumType = '',
}) => {
  const companyLineData =
    NON_OBER_MODEL_OPTIONS_BY_COMPANY_AND_LINE[companyName] || {};

  const lineData = companyLineData[lineName] || null;

  if (!lineData) {
    return [];
  }

  return lineData[drumType] || lineData['Overall Kit / Line Sound'] || [];
};

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
      'Maple',

      'Birch',

      'Mahogany',

      'Walnut',

      'Oak',

      'Brass',

      'Steel',

      'Aluminum',

      'Copper',

      'Bronze',

      'Acrylic',
    ],

    'Rack Tom': [
      'Maple',

      'Birch',

      'Mahogany',

      'Walnut',

      'Oak',

      'Poplar',

      'Maple / Gum',

      'Acrylic',
    ],

    'Floor Tom': [
      'Maple',

      'Birch',

      'Mahogany',

      'Walnut',

      'Oak',

      'Poplar',

      'Maple / Gum',

      'Acrylic',
    ],

    'Bass Drum': [
      'Maple',

      'Birch',

      'Mahogany',

      'Walnut',

      'Oak',

      'Poplar',

      'Maple / Gum',

      'Acrylic',
    ],

    'Overall Kit / Line Sound': [
      'Balanced Maple Kit',

      'Bright Birch Kit',

      'Warm Mahogany Kit',

      'Vintage Maple / Gum Kit',

      'Modern Maple / Walnut Kit',

      'Controlled Acrylic Kit',
    ],
  },
};

const NON_OBER_DRUM_TYPE_OPTIONS = ['Snare'];

const NON_OBER_COMPANY_TYPE_OPTIONS = [
  'Generic / Baseline Reference',

  'Major Manufacturer',

  'Boutique Builder',

  'Independent Builder',
];

const NON_OBER_COMPANY_OPTIONS_BY_TYPE = {
  'Major Manufacturer': [
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

  'Boutique Builder': [
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

    'SJC Custom Drums',
  ],

  'Independent Builder': [
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

  'Generic / Baseline Reference': ['Generic Reference'],
};

const NON_OBER_LINE_OPTIONS_BY_COMPANY = {
  Pearl: [
    'Masterworks',

    'Reference',

    'Reference Pure',

    'Reference One',

    'Masters',

    'Masters Maple Reserve',

    'Masters Maple Complete',

    'Masters Maple/Gum',

    'Masters Studio',

    'Masters Custom',

    'Masters Custom Extra',

    'Masters Premium',

    'Masters Premium Legend',

    'Session',

    'Session Studio Select',

    'Session Select',

    'Session Custom',

    'Session Elite',

    'President Series',

    'President Series Deluxe',

    'President Series Phenolic',

    'President Classic',

    'Crystal Beat',

    'Decade Maple',

    'Decade Maple Artisan',

    'Export',

    'Export EXX',

    'Export EXL',

    'Forum',

    'Vision',

    'Vision Birch',

    'Vision Maple',

    'Vision Maple Lacquer',

    'Vision Birch/Basswood',

    'World Series',

    'Prestige Session',

    'Performance Session',

    'DX',

    'DLX',

    'MLX',

    'BLX',

    'CZX',

    'GLX',

    'Wood Fiberglass',

    'Fiberglass',

    'Maple Shell',

    'Birch Shell',

    'Free Floating',

    'Sensitone',

    'Sensitone Heritage Alloy',

    'Sensitone Premium',

    'Modern Utility',

    'Signature Series',

    'Chad Smith Signature',

    'Omar Hakim Signature',

    'Joey Jordison Signature',

    'Ian Paice Signature',

    'Dennis Chambers Signature',

    'Eric Singer Signature',

    'Roadshow',

    'Roadshow Jr.',

    'Midtown',

    'Compact Traveler',

    'Rhythm Traveler',
  ],

  Tama: [
    'STAR Maple',

    'STAR Walnut',

    'STAR Bubinga',

    'STAR Reserve',

    'Starclassic',

    'Starclassic Maple',

    'Starclassic Walnut/Birch',

    'Starclassic Performer',

    'Starclassic Performer Birch/Bubinga',

    'Starclassic Bubinga',

    'Starclassic Birch',

    'Starclassic Birch/Bubinga',

    'Starclassic Mirage',

    'Starclassic Exotix',

    'Superstar',

    'Superstar Classic',

    'Superstar Hyper-Drive',

    'Superstar Hyper-Drive Duo',

    'Superstar Custom',

    'Superstar EFX',

    'Superstar SK',

    'Silverstar',

    'Imperialstar',

    'Swingstar',

    'Rockstar',

    'Rockstar Custom',

    'Artstar',

    'Artstar II',

    'Granstar',

    'Granstar Custom',

    'Crestar',

    'Royalstar',

    'Stagestar',

    'Club-JAM',

    'Club-JAM Flyer',

    'Club-JAM Pancake',

    'Cocktail-JAM',

    'Cocktail-JAM Mini',

    'S.L.P.',

    'Sound Lab Project',

    'S.L.P. Dynamic Kapur',

    'S.L.P. G-Maple',

    'S.L.P. G-Bubinga',

    'S.L.P. Big Black Steel',

    'S.L.P. Fat Spruce',

    'S.L.P. Vintage Steel',

    'S.L.P. Studio Maple',

    'S.L.P. Classic Maple',

    'S.L.P. Spotted Gum',

    'S.L.P. Duo Birch',

    'S.L.P. Sonic Steel',

    'S.L.P. LAL145',

    'Starphonic',

    'Metalworks',

    'Signature Series',

    'Bell Brass',

    'Warlord',

    'Simon Phillips Signature',

    'Stewart Copeland Signature',

    'John Tempesta Signature',

    'Mike Portnoy Signature',

    'Lars Ulrich Signature',
  ],

  Yamaha: [
    'PHX',

    'Phoenix',

    'Recording Custom',

    'Recording Custom Aluminum',

    'Recording Custom Brass',

    'Recording Custom Stainless Steel',

    'Absolute',

    'Absolute Maple',

    'Absolute Birch',

    'Absolute Nouveau',

    'Absolute Hybrid Maple',

    'Maple Custom',

    'Maple Custom Absolute',

    'Birch Custom',

    'Birch Custom Absolute',

    'Oak Custom',

    'Oak Custom Absolute',

    'Live Custom',

    'Live Custom Hybrid Oak',

    'Tour Custom',

    'Stage Custom',

    'Stage Custom Birch',

    'Stage Custom Advantage',

    'Stage Custom Nouveau',

    'Rock Tour',

    'Rydeen',

    'GigMaker',

    'Club Custom',

    'Hipgig',

    'Manu Katché Hipgig',

    'Junior Kit',

    'Power V',

    'Power Tour Custom',

    '9000 Series',

    '8000 Series',

    '7000 Series',

    '5000 Series',

    'YD Series',

    'Steve Gadd Signature',

    'Akira Jimbo Signature',

    'David Garibaldi Signature',

    'Sensitive Series',

    'Musashi',

    'Anton Fig Signature',

    'Elvin Jones Signature',

    'Roy Haynes Signature',
  ],

  Ludwig: [
    'Legacy Mahogany',

    'Legacy Maple',

    'Classic Maple',

    'Classic Oak',

    'NeuSonic',

    'Vistalite',

    'Stainless Steel',

    'Evolution',

    'Breakbeats',

    'Element',

    'Element Evolution',

    'Accent',

    'Accent CS',

    'Questlove Pocket Kit',

    'Club Date',

    'Keystone',

    'Keystone X',

    'Centennial',

    'Epic',

    'Signet 105',

    'Standard',

    'Super Classic',

    'Hollywood',

    'Downbeat',

    'Jazzette',

    'Fab',

    'Pro Beat',

    'Rocker',

    'Rocker II',

    'Rockers',

    'Combo',

    'Supraphonic',

    'Super Ludwig',

    'Black Beauty',

    'Acrolite',

    'Super-Sensitive',

    'Pioneer',

    'Jazz Festival',

    'Auditorium',

    'School Festival',

    'Coliseum',

    'Bronze Phonic',

    'Copper Phonic',

    'Acrophonic',

    'Heirloom',

    'Universal',

    'Raw Brass',

    'Raw Copper',

    'Hammered Supraphonic',

    'Hammered Black Beauty',

    'Carl Palmer Signature',

    'Alex Van Halen Signature',

    'John Bonham Signature',

    'Questlove Signature',
  ],

  DW: [
    'Collector’s Series',

    'Collector’s Series Maple',

    'Collector’s Series Cherry',

    'Collector’s Series Mahogany',

    'Collector’s Series Oak',

    'Collector’s Series Purpleheart',

    'Collector’s Series Exotic',

    'Collector’s Series Jazz',

    'Collector’s Series Pure Maple',

    'Collector’s Series SSC',

    'Performance Series',

    'Design Series',

    'Design Series Frequent Flyer',

    'Design Series Mini-Pro',

    'Design Series Acrylic',

    'Design Series Black Nickel over Brass',

    'Design Series Steel',

    'Design Series Bell Brass',

    'Jazz Series',

    'Classics Series',

    'Eco-X Project',

    'Workshop Series',

    'FinishPly',

    'Satin Oil',

    'Super Solid',

    'True-Sonic',

    'MFG',

    'MFG True-Cast',

    'Concrete',

    'Edge',

    'Super Solid Edge',

    'Top Edge',

    'Craviotto / DW Solid Shell',

    'Contemporary Classic',

    'Complete Workshop',

    'Collector’s Metal',

    'Collector’s Aluminum',

    'Collector’s Brass',

    'Collector’s Bronze',

    'Collector’s Steel',

    'Collector’s Copper',

    'Neil Peart R30',

    'Neil Peart Time Machine',
  ],

  Gretsch: [
    'USA Custom',

    'USA Custom Round Badge',

    'Brooklyn',

    'Broadkaster',

    'Renown',

    'Renown Maple',

    'Renown RN2',

    'Catalina',

    'Catalina Club',

    'Catalina Club Jazz',

    'Catalina Maple',

    'Catalina Birch',

    'Catalina Ash',

    'Catalina Elite',

    'Energy',

    'Blackhawk',

    'Full Range',

    'Full Range Maple',

    'Full Range Walnut',

    'Full Range Mahogany',

    'Full Range Stave',

    'Full Range Metal',

    'Full Range Hammered',

    'New Classic',

    'Brooklyn Standard',

    'Brooklyn Chrome Over Brass',

    'Brooklyn Solid Steel',

    'USA Bronze',

    'USA Bell Brass',

    'USA Solid Aluminum',

    'G4160',

    'G4164',

    'G4169',

    'G4000 Series',

    'Round Badge',

    'Stop Sign Badge',

    'Square Badge',

    'Broadkaster Vintage Build',

    'Progressive Jazz',

    'Name Band',

    'Max Roach Signature',

    'Steve Ferrone Signature',

    'Keith Carlock Signature',
  ],

  Mapex: [
    'Black Panther Design Lab',

    'Black Panther',

    'Black Panther Artist',

    'Black Panther Blaster',

    'Black Panther Velvetone',

    'Black Panther Versatus',

    'Black Panther Wraith',

    'Black Panther Cherry Bomb',

    'Black Panther Persuader',

    'Black Panther Shadow',

    'Black Panther Sledgehammer',

    'Black Panther Predator',

    'Black Panther Warbird',

    'Black Panther Blade',

    'Black Panther Machete',

    'Black Panther Heartbreaker',

    'Black Panther Phat Bob',

    'Saturn',

    'Saturn Pro',

    'Saturn IV',

    'Saturn V',

    'Saturn VI',

    'Saturn Evolution',

    'Saturn Evolution Special Edition',

    'Saturn Maple/Walnut',

    'Saturn Birch/Walnut',

    'Orion',

    'Orion Classic',

    'Armory',

    'Armory Studioease',

    'Armory Rock',

    'Mars',

    'Mars Maple',

    'Mars Birch',

    'Mars Pro',

    'Meridian',

    'Meridian Maple',

    'Meridian Birch',

    'MyDentity',

    'Horizon',

    'Horizon Birch',

    'Horizon HZB',

    'Pro M',

    'M Series',

    'M Birch',

    'Q Series',

    'QR',

    'VX',

    'Voyager',

    'Venus',

    'Comet',

    'Tornado',

    'Prodigy',

    'V Series',

    'MPX',

    'Phosphor Bronze',

    'Daisy Cutter',

    'Chris Adler Signature',

    'Russ Miller Signature',

    'Will Calhoun Signature',
  ],

  Sonor: [
    'SQ2',

    'SQ1',

    'ProLite',

    'Vintage Series',

    'AQ2',

    'AQ1',

    'AQX',

    'Kompressor',

    'Artist Snare',

    'Signature Series',

    'Designer',

    'Delite',

    'Delite SQ2 Predecessor',

    'S Class',

    'S Class Pro',

    'Force',

    'Force 3007',

    'Force 3005',

    'Force 2007',

    'Force 2005',

    'Force 1007',

    'Force 1005',

    'Force 507',

    'Force 505',

    'Force 3000',

    'Force 2000',

    'Force 1000',

    'Force Maple',

    'Force Birch',

    'Select Force',

    'Essential Force',

    'Smart Force',

    'Ascent',

    'Safari',

    'Bop',

    'Jungle',

    'Martini',

    'Special Edition',

    'Phonic',

    'Phonic Plus',

    'Champion',

    'Performer',

    'Teardrop',

    'Swinger',

    'Action',

    'Lite',

    'HLD',

    'Horst Link Signature',

    'Benny Greb Signature',

    'Steve Smith Signature',

    'Danny Carey Signature',

    'Gavin Harrison Protean',

    'Protean',

    'Jost Nickel Signature',
  ],

  PDP: [
    'Concept Series',

    'Concept Maple',

    'Concept Birch',

    'Concept Classic',

    'Concept Exotic',

    'Concept Select',

    'Concept Maple Classic',

    'Concept Acrylic',

    'Limited Edition',

    '25th Anniversary Acrylic',

    'Mainstage',

    'Center Stage',

    'Encore',

    'New Yorker',

    'Player',

    'X7',

    'M5',

    'FS',

    'FX',

    'LX',

    'CX',

    'MX',

    'Platinum',

    '805',

    'Z5',

    'EZ',

    'Pacific FS',

    'Pacific CX',

    'Pacific LX',

    'Pacific MX',

    'Woody',

    'Black Wax',

    'Palladium',

    'Ace',

    'Chad Smith Signature',

    'Daru Jones Signature',

    'Eric Hernandez Signature',
  ],

  Rogers: [
    'Covington',

    'Cleveland',

    'PowerTone',

    'Dyna-Sonic',

    'Dynasonic',

    'SuperTen',

    'ThunderTone',

    'Tower',

    'Holiday',

    'Parklane',

    'Luxor',

    'Spotlight',

    'Celebrity',

    'Constellation',

    'Starlighter',

    'Delta',

    'Londoner',

    'Citadel',

    'Comet',

    'R360',

    'R380',

    'XP-8',

    'XP-10',

    'Big R',

    'Bread and Butter Lug Era',

    'Beavertail Lug Era',

    'Wood Dyna-Sonic',

    'Chrome Over Brass Dyna-Sonic',
  ],

  Slingerland: [
    'Radio King',

    'Studio King',

    'Artist Classic',

    'Sound King',

    'Rolling Bomber',

    'Broadcaster',

    'Super Gene Krupa',

    'Gene Krupa Deluxe',

    'Hollywood Ace',

    'Student Model',

    'Festival',

    'Buddy Rich',

    'Modern Solo',

    'Modern Jazz',

    'Avante',

    'Cutaway',

    'Magnum',

    'Spitfire',

    'Tempo King',

    'May Bell',

    'Spirit',

    'Niles Badge',

    'Chicago Badge',

    'Cloud Badge',

    'Black and Brass Badge',

    'Conway Era',

    'Nashville Era',
  ],

  Premier: [
    'Genista',

    'Genista Classic',

    'Elite',

    'Elite Maple',

    'Artist',

    'Artist Maple',

    'Artist Birch',

    'Signia',

    'Signia Marquis',

    'Modern Classic',

    'XPK',

    'APK',

    'Olympic',

    'Projector',

    'Resonator',

    'Soundwave',

    'Club',

    'Royal Ace',

    '2000',

    '2001',

    'Della-Porta 100',

    'Beatmaker',

    'Traditional',

    'Cabria',

    'Cabria APK',

    'Cabria XPK',

    'Cabria Exclusive',

    'Series Elite',

    'Series 90',

    'Series 70',

    'Series 54',

    'HTS',

    'Dominion',

    'One Series',

    'British Collection',

    'Premier Made in England',
  ],

  Natal: [
    'Cafe Racer',

    'Arcadia',

    'Originals',

    'Originals Maple',

    'Originals Walnut',

    'Originals Birch',

    'Originals Ash',

    'Ash',

    'Walnut',

    'Maple',

    'Birch',

    'Hand Hammered',

    'Hand Hammered Steel',

    'Hand Hammered Bronze',

    'Hand Hammered Copper',

    'Hand Hammered Brass',

    'Horizon',

    'Spirit',

    'DNA',

    'K-Mahogany',

    'Tulipwood',

    'Acrylic',

    'Stave',

    'Limited Edition',
  ],

  Canopus: [
    'Zelkova',

    'Neo Vintage',

    'Neo Vintage NV60-M1',

    'Neo Vintage NV60-M2',

    'Neo Vintage NV60-M5',

    'Neo Vintage NV50',

    'Neo Vintage NV60',

    'R.F.M.',

    'R.F.M. Maple',

    'R.F.M. Birch',

    'YAIBA',

    'YAIBA II',

    'YAIBA Groove Kit',

    'Type-R',

    '1ply',

    'The Maple',

    'Ash',

    'Birch',

    'Mahogany',

    'Acrylic',

    'Stave Bubinga',

    'Solid Brass',

    'Solid Aluminum',

    'Solid Steel',

    'Hammered Bronze',

    'Oil Finished Maple',

    'Bop Kit',

    'Club Kit',

    'M42',

    'M1',

    'M5',

    'MO-1455',

    'BR-1455',
  ],

  Craviotto: [
    'Custom Shop',

    'Private Reserve',

    'Solid Shell',

    'Single-Ply Solid Shell',

    'Stacked Solid',

    'Stacked Solid Maple',

    'Stacked Solid Cherry',

    'Stacked Solid Walnut',

    'Diamond Series',

    'Limited Edition',

    'Johnny C.',

    'Center Stage',

    'Lake Superior Timeless Timber',

    'Timeless Timber',

    'Birdseye Maple',

    'Curly Maple',

    'Mahogany',

    'Walnut',

    'Cherry',

    'Maple',

    'Ash',

    'Poplar',

    'Hybrid Shell',

    'Metal Series',

    'Brass',

    'Copper',

    'Aluminum',

    'AK Drums Era',

    'DW / Craviotto Era',
  ],

  'Noble & Cooley': [
    'Solid Shell Classic',

    'SS Classic',

    'CD Maple',

    'Horizon',

    'Horizon Maple',

    'Horizon Birch',

    'Walnut Classic',

    'Alloy Classic',

    'Noble & Cooley Classic',

    'Steam Bent Solid Shell',

    'Single Ply Maple',

    'Single Ply Walnut',

    'Single Ply Cherry',

    'Single Ply Tulip',

    'Union Series',

    'Star Series',
  ],

  Dunnett: [
    'Classic',

    '2N',

    'Stainless Steel',

    'Titanium',

    'Monoply',

    'George Way Studio',

    'George Way Aero',

    'Carter McLean Signature',

    'R4',

    'R7',

    'R-Class',

    'Dunnett Classic Titanium',

    'Dunnett Classic Stainless',

    'Dunnett Classic Bronze',

    'Dunnett Classic Brass',

    'Dunnett Classic Aluminum',
  ],

  'George Way': [
    'Studio',

    'Aero',

    'Tradition',

    'Elkhart',

    'Aristocrat',

    'Advance',

    'Acacia',

    'Walnut',

    'Maple',

    'Mahogany',

    'Copper',

    'Brass',

    'Aluminum',

    'George Way / Dunnett',
  ],

  Keplinger: [
    'Black Iron',

    'Stainless Steel',

    'Brass',

    'Copper',

    'Bronze',

    'Aluminum',

    'Steel',

    'Handmade Metal Shell',

    'Keplinger Black Iron Snare',

    'Keplinger Stainless Snare',
  ],

  'INDe Drum Lab': [
    'WaFarer',

    'BR Series',

    'Kalamazoo',

    'Maple',

    'Aluminum',

    'Bronze',

    'Steel',

    'Solid Shell',

    'Stave Shell',

    'Custom Series',
  ],

  Oriollo: [
    'Phantom',

    'Mangosta',

    'Bellmaker',

    'Bakar',

    'Tron',

    'Acrylic',

    'Aluminum',

    'Steel',

    'Copper',

    'Brass',

    'Bronze',

    'Cast Metal',
  ],

  'Q Drum Co.': [
    'Gentleman’s Series',

    'Q Gentlemen’s',

    'Copper',

    'Brass',

    'Steel',

    'Aluminum',

    'Mahogany',

    'Maple',

    'Acrylic',

    'Custom Shop',

    'Limited Edition',
  ],

  'C&C Drum Co.': [
    'Custom',

    'Player Date I',

    'Player Date II',

    'Gladstone',

    '12th & Vine',

    'Mahogany',

    'Maple',

    'Acrylic',

    'Vintage Maple',

    'Big Beat',

    'Super Flyer',

    'Challenger',
  ],

  'Sugar Percussion': [
    'Stave',

    'Steam Bent',

    'Solid Shell',

    'Maple',

    'Cherry',

    'Walnut',

    'Mahogany',

    'Padauk',

    'Custom Shop',

    'Single-Ply',
  ],

  'A&F Drum Co.': [
    'Raw Brass',

    'Raw Steel',

    'Raw Aluminum',

    'Raw Copper',

    'Royal',

    'Club',

    'Rude Boy',

    'Field Drum',

    'Single Tension',

    'Pancake',

    'Maple Club',

    'Mahogany Club',

    'Acrylic',

    'Patina',
  ],

  'British Drum Co.': [
    'Legend',

    'Lounge',

    'Live Lounge',

    'Bluebird',

    'Merlin',

    'Big Softy',

    'Maverick',

    'Super 7',

    'Raven',

    'Palladium',

    'Impression',

    'Casino',

    'Duke',
  ],

  'Doc Sweeney': [
    'Classic',

    'Solid Shell',

    'Stave',

    'Steam Bent',

    'Maple',

    'Cherry',

    'Walnut',

    'Mahogany',

    'Custom',
  ],

  'Pork Pie': [
    'USA Custom',

    'Little Squealer',

    'Hip Pig',

    'Pig Lite',

    'Patina Brass',

    'Big Black Brass',

    'Black Brass',

    'BOB',

    'Acrylic',

    'Maple',

    'Cherry Bubinga',

    'Zebrawood',

    'Brass',

    'Steel',
  ],

  Spaun: [
    'Custom',

    'Acrylic',

    'Maple',

    'Birch',

    'Hybrid',

    'Vented',

    'Acrylic Hybrid',

    'Signature Series',
  ],

  'SJC Custom Drums': [
    'Custom',

    'Pathfinder',

    'Tour Series',

    'Alpha',

    'Providence',

    'Navigator',

    'Goliath',

    'Josh Dun Signature',

    'Tre Cool Signature',

    'Maple',

    'Acrylic',

    'Metal',
  ],

  'Truth Custom Drums': [
    'Custom',

    'Maple',

    'Mahogany',

    'Birch',

    'Acrylic',

    'Hybrid',

    'Signature Series',
  ],

  'Generic Reference': [
    'Ply Reference',

    'Metal Reference',

    'Stave Reference',

    'Steam-Bent Reference',

    'Solid Shell Reference',

    'Acrylic Reference',
  ],

  default: [
    'Known / Documented Build',

    'Custom / One-Off Build',

    'General Builder Voice Reference',
  ],
};

const getReferenceLineStatus = ({ companyName = '', lineName = '' }) => {
  if (!companyName || !lineName) {
    return REFERENCE_LINE_STATUS.UNKNOWN;
  }

  const normalizedLineName = normalizeText(lineName);

  if (
    companyName === 'Generic Reference' ||
    companyName === '' ||
    normalizeText(companyName).includes('generic')
  ) {
    if (['ply reference', 'metal reference'].includes(normalizedLineName)) {
      return REFERENCE_LINE_STATUS.CURRENT;
    }

    return REFERENCE_LINE_STATUS.UNKNOWN;
  }

  const currentLinesByCompany = {
    Pearl: [
      'Masterworks',

      'Reference One',

      'Reference Pure',

      'Masters Maple Reserve',

      'Masters Maple Complete',

      'Session Studio Select',

      'President Series Deluxe',

      'Crystal Beat',

      'Decade Maple',

      'Export EXX',

      'Export EXL',

      'Roadshow',

      'Midtown',

      'Compact Traveler',

      'Free Floating',

      'Sensitone Heritage Alloy',

      'Modern Utility',
    ],

    Tama: [
      'STAR Maple',

      'STAR Walnut',

      'Starclassic Maple',

      'Starclassic Walnut/Birch',

      'Superstar Classic',

      'Imperialstar',

      'Club-JAM',

      'Club-JAM Flyer',

      'Club-JAM Pancake',

      'Cocktail-JAM',

      'S.L.P.',

      'Starphonic',

      'Metalworks',
    ],

    Yamaha: [
      'Recording Custom',

      'Absolute Hybrid Maple',

      'Live Custom Hybrid Oak',

      'Tour Custom',

      'Stage Custom Birch',

      'Rydeen',

      'Junior Kit',
    ],

    Ludwig: [
      'Legacy Mahogany',

      'Legacy Maple',

      'Classic Maple',

      'Classic Oak',

      'NeuSonic',

      'Vistalite',

      'Evolution',

      'Breakbeats',

      'Questlove Pocket Kit',

      'Supraphonic',

      'Black Beauty',

      'Acrolite',

      'Super-Sensitive',

      'Bronze Phonic',

      'Copper Phonic',

      'Universal',

      'Raw Brass',

      'Raw Copper',
    ],

    DW: [
      'Collector’s Series',

      'Collector’s Series Maple',

      'Collector’s Series Cherry',

      'Collector’s Series Mahogany',

      'Collector’s Series Oak',

      'Collector’s Series Purpleheart',

      'Collector’s Series Exotic',

      'Performance Series',

      'Design Series',

      'Design Series Frequent Flyer',

      'Design Series Mini-Pro',

      'Design Series Acrylic',

      'Classics Series',

      'Jazz Series',

      'Super Solid',

      'True-Sonic',

      'MFG',

      'Edge',
    ],

    Gretsch: [
      'USA Custom',

      'Brooklyn',

      'Broadkaster',

      'Renown',

      'Renown Maple',

      'Renown RN2',

      'Catalina Club',

      'Catalina Club Jazz',

      'Catalina Maple',

      'Full Range',

      'Brooklyn Standard',
    ],

    Mapex: [
      'Black Panther Design Lab',

      'Black Panther',

      'Black Panther Artist',

      'Saturn Evolution',

      'Saturn Evolution Special Edition',

      'Armory',

      'Armory Studioease',

      'Armory Rock',

      'Mars',

      'Mars Maple',

      'Venus',

      'Tornado',

      'MPX',
    ],

    Sonor: [
      'SQ2',

      'SQ1',

      'ProLite',

      'Vintage Series',

      'AQ2',

      'AQ1',

      'AQX',

      'Kompressor',

      'Artist Snare',
    ],

    PDP: [
      'Concept Series',

      'Concept Maple',

      'Concept Birch',

      'Concept Classic',

      'Concept Exotic',

      'Concept Select',

      'Concept Maple Classic',

      'Concept Acrylic',

      'Limited Edition',

      'Mainstage',

      'Center Stage',

      'New Yorker',
    ],

    Rogers: ['Covington', 'PowerTone', 'Dyna-Sonic', 'SuperTen'],

    Natal: [
      'Originals',

      'Originals Maple',

      'Originals Walnut',

      'Originals Birch',

      'Cafe Racer',

      'Arcadia',
    ],

    Canopus: [
      'Yaiba',

      'Yaiba II',

      'R.F.M.',

      'Neo-Vintage',

      'Ash',

      'The Maple',

      'Zelkova',
    ],

    Craviotto: [
      'Solid Shell',

      'Private Reserve',

      'Diamond Series',

      'Johnny C.',
    ],
  };

  const signatureKeywords = [
    'signature',
    'chad smith',
    'omar hakim',
    'joey jordison',
    'benny greb',
    'steve smith',
    'danny carey',
    'akira jimbo',
    'steve gadd',
    'manu katché',
  ];

  const vintageKeywords = [
    'teardrop',

    'phonic',

    'phonic plus',

    'champion',

    'performer',

    'holiday',

    'tower',

    'luxor',

    'spotlight',

    'celebrity',

    'cleveland',

    'covington',

    'super classic',

    'downbeat',

    'jazzette',

    'fab',

    'hollywood',

    'standard',

    'rocker',

    'rocker ii',

    'world series',

    'dx',

    'dlx',

    'mlx',

    'blx',

    'czx',

    'glx',
  ];

  const rareKeywords = [
    'bell brass',

    'warlord',

    'edge',

    'super solid edge',

    'top edge',

    'craviotto',

    'zelkova',

    'private reserve',

    'diamond series',

    'stainless steel',

    'bronze',

    'copper',

    'concrete',
  ];

  const limitedKeywords = [
    'limited',

    'anniversary',

    'special edition',

    'exotic',

    'exotix',

    'reserve',

    'artisan',
  ];

  const currentLines = currentLinesByCompany[companyName] || [];

  if (currentLines.some((line) => normalizeText(line) === normalizedLineName)) {
    return REFERENCE_LINE_STATUS.CURRENT;
  }

  if (
    signatureKeywords.some((keyword) =>
      normalizedLineName.includes(normalizeText(keyword))
    )
  ) {
    return REFERENCE_LINE_STATUS.SIGNATURE;
  }

  if (
    rareKeywords.some((keyword) =>
      normalizedLineName.includes(normalizeText(keyword))
    )
  ) {
    return REFERENCE_LINE_STATUS.RARE;
  }

  if (
    limitedKeywords.some((keyword) =>
      normalizedLineName.includes(normalizeText(keyword))
    )
  ) {
    return REFERENCE_LINE_STATUS.LIMITED;
  }

  if (
    vintageKeywords.some((keyword) =>
      normalizedLineName.includes(normalizeText(keyword))
    )
  ) {
    return REFERENCE_LINE_STATUS.VINTAGE;
  }

  return REFERENCE_LINE_STATUS.DISCONTINUED;
};

const getReferenceLineAccess = ({ companyName = '', lineName = '' }) => {
  const normalizedCompanyName = normalizeText(companyName);

  const normalizedLineName = normalizeText(lineName);

  if (
    normalizedCompanyName.includes('generic') ||
    companyName === '' ||
    companyName === 'Generic Reference'
  ) {
    if (['ply reference', 'metal reference'].includes(normalizedLineName)) {
      return REFERENCE_LINE_ACCESS.FREE;
    }

    return REFERENCE_LINE_ACCESS.UPGRADE;
  }

  const status = getReferenceLineStatus({ companyName, lineName });

  if (status === REFERENCE_LINE_STATUS.CURRENT) {
    return REFERENCE_LINE_ACCESS.FREE;
  }

  return REFERENCE_LINE_ACCESS.UPGRADE;
};

const getReferenceLineStatusLabel = ({ companyName = '', lineName = '' }) => {
  const status = getReferenceLineStatus({ companyName, lineName });

  return (
    REFERENCE_LINE_BUCKET_LABELS[status] || REFERENCE_LINE_BUCKET_LABELS.unknown
  );
};

const userCanAccessExpandedReferenceLines = ({
  isAdmin = true,

  isLegacyPrintSubscriber = false,

  isLegacyPrintPartner = false,
} = {}) => {
  return Boolean(isAdmin || isLegacyPrintSubscriber || isLegacyPrintPartner);
};

const filterReferenceLinesByAccess = ({
  companyName = '',

  lines = [],

  isAdmin = true,

  isLegacyPrintSubscriber = false,

  isLegacyPrintPartner = false,
} = {}) => {
  const canAccessExpanded = userCanAccessExpandedReferenceLines({
    isAdmin,

    isLegacyPrintSubscriber,

    isLegacyPrintPartner,
  });

  return lines.filter((lineName) => {
    const access = getReferenceLineAccess({ companyName, lineName });

    if (access === REFERENCE_LINE_ACCESS.FREE) {
      return true;
    }

    return canAccessExpanded;
  });
};

const sortReferenceLinesByStatus = ({ companyName = '', lines = [] }) => {
  const normalizedCompanyName = normalizeText(companyName);

  if (
    normalizedCompanyName.includes('generic') ||
    companyName === '' ||
    companyName === 'Generic Reference'
  ) {
    const genericOrder = [
      'Ply Reference',

      'Metal Reference',

      'Stave Reference',

      'Steam-Bent Reference',

      'Solid Shell Reference',

      'Acrylic Reference',
    ];

    return [...lines].sort((a, b) => {
      const indexA = genericOrder.indexOf(a);

      const indexB = genericOrder.indexOf(b);

      const safeIndexA = indexA === -1 ? 999 : indexA;

      const safeIndexB = indexB === -1 ? 999 : indexB;

      if (safeIndexA !== safeIndexB) {
        return safeIndexA - safeIndexB;
      }

      return a.localeCompare(b);
    });
  }

  return [...lines].sort((a, b) => {
    const statusA = getReferenceLineStatus({
      companyName,

      lineName: a,
    });

    const statusB = getReferenceLineStatus({
      companyName,

      lineName: b,
    });

    const statusIndexA = REFERENCE_LINE_STATUS_ORDER.indexOf(statusA);

    const statusIndexB = REFERENCE_LINE_STATUS_ORDER.indexOf(statusB);

    if (statusIndexA !== statusIndexB) {
      return statusIndexA - statusIndexB;
    }

    return a.localeCompare(b);
  });
};

const getReferenceLineBucketLabel = ({ companyName = '', lineName = '' }) => {
  const status = getReferenceLineStatus({ companyName, lineName });

  return (
    REFERENCE_LINE_BUCKET_LABELS[status] || REFERENCE_LINE_BUCKET_LABELS.unknown
  );
};

const getSelectorOptionMeta = ({
  fieldKey = '',
  option = '',
  selector = {},
}) => {
  if (fieldKey !== 'nonOberLineName') {
    return {};
  }

  const companyName =
    selector.nonOberCompanyType === 'Generic / Baseline Reference'
      ? 'Generic Reference'
      : selector.nonOberCompanyName || '';

  const status = getReferenceLineStatus({
    companyName,

    lineName: option,
  });

  const access = getReferenceLineAccess({
    companyName,

    lineName: option,
  });

  return {
    status,

    access,

    bucketLabel:
      REFERENCE_LINE_BUCKET_LABELS[status] ||
      REFERENCE_LINE_BUCKET_LABELS.unknown,
  };
};

const NON_OBER_BASELINE_MATERIAL_OPTIONS_BY_LINE = {
  'Ply Reference': [
    'Maple',

    'Birch',

    'Mahogany',

    'Walnut',

    'Oak',

    'Poplar',

    'Maple / Gum',

    'Maple / Poplar',

    'Birch / Poplar',

    'Maple / Walnut',

    'Maple / Mahogany',

    'Birch / Walnut',

    'Maple / Birch',

    'Mahogany / Poplar',

    'Beech',
  ],

  'Stave Reference': [
    'Maple',

    'Oak',

    'Walnut',

    'Cherry',

    'Mahogany',

    'Birch',

    'Ash',

    'Padauk',

    'Bubinga',

    'Wenge',

    'Purpleheart',

    'Zebrawood',

    'Sapele',

    'Maple / Walnut',

    'Oak / Cherry',

    'Walnut / Padauk',

    'Maple / Bubinga',

    'Mahogany / Cherry',
  ],

  'Steam-Bent Reference': [
    'Maple',

    'Walnut',

    'Cherry',

    'Oak',

    'Mahogany',

    'Ash',

    'Birch',

    'Beech',

    'Maple with Reinforcement Rings',

    'Walnut with Reinforcement Rings',

    'Mahogany with Reinforcement Rings',

    'Cherry with Reinforcement Rings',
  ],

  'Solid Shell Reference': [
    'Maple',

    'Walnut',

    'Cherry',

    'Mahogany',

    'Oak',

    'Ash',

    'Beech',

    'Birch',

    'Single-Piece Maple',

    'Single-Piece Walnut',

    'Single-Piece Cherry',

    'Single-Piece Mahogany',
  ],

  'Metal Reference': [
    'Brass',

    'Steel',

    'Aluminum',

    'Copper',

    'Bronze',

    'Bell Brass',

    'Black Nickel over Brass',

    'Chrome over Brass',

    'Hammered Brass',

    'Hammered Copper',

    'Hammered Steel',

    'Titanium',

    'Stainless Steel',

    'Seamless Aluminum',

    'Seamless Brass',
  ],

  'Acrylic Reference': [
    'Clear Acrylic',

    'Colored Acrylic',

    'Seamless Acrylic',

    'Cast Acrylic',

    'Acrylic with Reinforcement Rings',

    'Acrylic / Wood Hybrid',

    'Opaque Acrylic',

    'Transparent Acrylic',

    'Sparkle Acrylic',
  ],
};

const NON_OBER_BASELINE_CONSTRUCTION_OPTIONS = [
  'Ply',

  'Stave',

  'Steam Bent',

  'Solid',

  'Metal',

  'Acrylic',
];

const NON_OBER_MATERIAL_OPTIONS_BY_CONSTRUCTION = {
  Ply: ['Maple', 'Birch', 'Mahogany', 'Walnut', 'Oak', 'Poplar', 'Maple / Gum'],

  Stave: ['Maple', 'Oak', 'Walnut', 'Cherry', 'Mahogany', 'Bubinga', 'Padauk'],

  'Steam Bent': ['Maple', 'Oak', 'Walnut', 'Cherry', 'Mahogany', 'Ash'],

  Solid: ['Maple', 'Walnut', 'Cherry', 'Mahogany', 'Oak'],

  Metal: ['Brass', 'Steel', 'Aluminum', 'Copper', 'Bronze', 'Titanium'],

  Acrylic: [
    'Clear Acrylic',

    'Colored Acrylic',

    'Seamless Acrylic',

    'Cast Acrylic',
  ],
};

const NON_OBER_THICKNESS_OPTIONS_BY_CONSTRUCTION = {
  Ply: ['Thin / 5–6mm', 'Medium / 6–8mm', 'Thick / 8–10mm'],

  Stave: ['Thin / 7–9mm', 'Medium / 10–13mm', 'Thick / 14–18mm'],

  'Steam Bent': ['Thin / 5–6mm', 'Medium / 6–8mm', 'Thick / 8–10mm'],

  Solid: ['Thin / 5–6mm', 'Medium / 6–8mm', 'Thick / 8–10mm'],

  Metal: ['Thin / 1.0–1.2mm', 'Medium / 1.2–1.5mm', 'Thick / 1.5–3.0mm'],

  Acrylic: ['Thin / 4–5mm', 'Medium / 5–6mm', 'Thick / 6–8mm'],
};

const NON_OBER_LINE_SOUND_FOCUS_OPTIONS = [
  'Balanced Studio Line',

  'Bright / Projecting Line',

  'Warm / Vintage Line',

  'Dry / Controlled Line',

  'High-Sustain / Open Line',
];

const NON_OBER_PLY_LAYUP_OPTIONS = [
  'Standard Cross-Laminated Ply',

  'Thin Vintage Ply',

  'Maple / Gum Layup',

  'Hybrid Wood Layup',

  'Reinforced Ply Shell',
];

const NON_OBER_REINFORCEMENT_RING_OPTIONS = [
  'No Reinforcement Rings',

  'Single-Sided Reinforcement Rings',

  'Double Reinforcement Rings',
];

const NON_OBER_BEADED_SHELL_OPTIONS = [
  'No Center Bead',

  'Center Bead',

  'Dual Bead',
];

const NON_OBER_FINISH_TREATMENT_OPTIONS = [
  'Natural / Minimal Finish',

  'Satin Clear',

  'Gloss Clear',

  'Heavy Lacquer',

  'Wrap',

  'Oil / Wax',

  'Painted Finish',

  'Aged / Distressed Finish',
];

const NON_OBER_HOOP_OPTIONS = [
  'Triple Flange 1.6mm',

  'Triple Flange 2.3mm',

  'Triple Flange 3.0mm',

  'Die-Cast',

  'S-Hoop',

  'Single Flange',

  'Wood Hoop',
];

const NON_OBER_SNARE_WIRE_OPTIONS = [
  'Generic 20-Strand Steel',

  'PureSound Custom Pro Steel 20-Strand wires',

  'PureSound Blasters 20-Strand',

  'PureSound Equalizer 16-Strand',

  'Canopus Vintage Snare Wire',

  'Tama Starclassic Snappy Snare',

  'Ludwig Snare Wires',

  'DW TrueTone Snare Wires',
];

const NON_OBER_BATTER_HEAD_OPTIONS = [
  'Remo Coated Ambassador',

  'Remo Coated Emperor',

  'Remo Controlled Sound Reverse Dot',

  'Remo Powerstroke 3 Coated',

  'Evans G1 Coated',

  'Evans G2 Coated',

  'Evans HD Dry',

  'Evans Genera Dry',

  'Evans UV1 Coated',

  'Aquarian Texture Coated',

  'Aquarian Hi-Energy',
];

const NON_OBER_RESO_HEAD_OPTIONS = [
  'Remo Ambassador Side',

  'Remo Diplomat Snare Side',

  'Evans Snare Side 200',

  'Evans Snare Side 300',

  'Evans Snare Side 500',

  'Aquarian Classic Clear Snare Side',

  'Aquarian Hi-Performance Snare Side',
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

const DRUM_TYPE_FILTER_OPTIONS = ['Snare'];

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

  nonOberCompanyType: 'Generic / Baseline Reference',

  nonOberCompanyName: 'Generic Reference',

  nonOberLineName: 'Generic Ply Reference',

  nonOberModelName: '',

  nonOberBaselineConstruction: 'Ply',

  nonOberMaterial: 'Maple',

  nonOberThicknessGroup: 'Medium / 6–8mm',

  nonOberLineSoundFocus: 'Balanced Studio Line',

  nonOberPlyLayupStyle: 'Standard Cross-Laminated Ply',

  nonOberReinforcementRings: 'No Reinforcement Rings',

  nonOberBeadedShell: 'No Center Bead',

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

const FEUZON_FINISH_DESIGN_OPTIONS = ['Natural', 'Full Stain', 'Faded Stain'];

const FEUZON_FINISH_COATING_OPTIONS = ['Satin', 'Gloss'];

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

const SOUNDLEGEND_FINISH_COATING_OPTIONS = ['Satin', 'PolyGloss'];

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

    return NON_OBER_DRUM_TYPE_OPTIONS;
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

  if (field.source === 'nonOberCompanyType') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return [];
    }

    return Array.from(
      new Set([...NON_OBER_COMPANY_TYPE_OPTIONS, ...getReferenceCompanyTypes()])
    );
  }

  if (field.source === 'nonOberCompanyName') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return [];
    }

    if (selector.nonOberCompanyType === 'Generic / Baseline Reference') {
      return [];
    }

    const datasetOptions = getReferenceCompaniesByType(
      selector.nonOberCompanyType
    );

    const fallbackOptions =
      NON_OBER_COMPANY_OPTIONS_BY_TYPE[selector.nonOberCompanyType] || [];

    return datasetOptions.length ? datasetOptions : fallbackOptions;
  }

  if (field.source === 'nonOberLineName') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return [];
    }

    if (selector.nonOberCompanyType === 'Generic / Baseline Reference') {
      const datasetOptions = getReferenceLines({
        companyType: selector.nonOberCompanyType,

        companyName: '',
      });

      const fallbackOptions =
        NON_OBER_LINE_OPTIONS_BY_COMPANY['Generic Reference'] || [];

      const mergedOptions = datasetOptions.length
        ? datasetOptions
        : fallbackOptions;

      const accessFilteredOptions = filterReferenceLinesByAccess({
        companyName: 'Generic Reference',

        lines: mergedOptions,

        isAdmin: true,

        isLegacyPrintSubscriber: false,

        isLegacyPrintPartner: false,
      });

      return sortReferenceLinesByStatus({
        companyName: 'Generic Reference',

        lines: accessFilteredOptions,
      });
    }

    if (!selector.nonOberCompanyName) {
      return [];
    }

    const datasetOptions = getReferenceLines({
      companyType: selector.nonOberCompanyType,

      companyName: selector.nonOberCompanyName,
    });

    const fallbackOptions =
      NON_OBER_LINE_OPTIONS_BY_COMPANY[selector.nonOberCompanyName] ||
      NON_OBER_LINE_OPTIONS_BY_COMPANY.default ||
      [];

    const mergedOptions = datasetOptions.length
      ? datasetOptions
      : fallbackOptions;

    const accessFilteredOptions = filterReferenceLinesByAccess({
      companyName: selector.nonOberCompanyName,

      lines: mergedOptions,

      // Admin calibration view should see everything.

      // Later, public/subscriber UI should pass real user access here.

      isAdmin: true,

      isLegacyPrintSubscriber: false,

      isLegacyPrintPartner: false,
    });

    return sortReferenceLinesByStatus({
      companyName: selector.nonOberCompanyName,

      lines: accessFilteredOptions,
    });
  }

  if (field.source === 'nonOberModelName') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return [];
    }

    if (selector.nonOberCompanyType === 'Generic / Baseline Reference') {
      const datasetOptions = getReferenceModels({
        companyType: selector.nonOberCompanyType,

        companyName: '',

        lineName: selector.nonOberLineName,

        drumType: selector.drumType,
      });

      const fallbackOptions =
        NON_OBER_BASELINE_MATERIAL_OPTIONS_BY_LINE[selector.nonOberLineName] ||
        [];

      return datasetOptions.length ? datasetOptions : fallbackOptions;
    }

    if (!selector.nonOberCompanyName) {
      return [];
    }

    const datasetOptions = getReferenceModels({
      companyType: selector.nonOberCompanyType,

      companyName: selector.nonOberCompanyName,

      lineName: selector.nonOberLineName,

      drumType: selector.drumType,
    });

    const lineSpecificOptions = getNonOberModelOptionsForSelection({
      companyName: selector.nonOberCompanyName,

      lineName: selector.nonOberLineName,

      drumType: selector.drumType,
    });

    if (lineSpecificOptions.length) {
      return lineSpecificOptions;
    }

    const makerData =
      NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER[selector.nonOberCompanyName] ||
      NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER.default;

    const fallbackOptions = makerData[selector.drumType] || [];

    return datasetOptions.length ? datasetOptions : fallbackOptions;
  }

  if (field.source === 'nonOberBaselineConstruction') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return [];
    }

    return NON_OBER_BASELINE_CONSTRUCTION_OPTIONS;
  }

  if (field.source === 'nonOberMaterial') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return [];
    }

    return (
      NON_OBER_MATERIAL_OPTIONS_BY_CONSTRUCTION[
        selector.nonOberBaselineConstruction
      ] || []
    );
  }

  if (field.source === 'nonOberThicknessGroup') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return [];
    }

    return (
      NON_OBER_THICKNESS_OPTIONS_BY_CONSTRUCTION[
        selector.nonOberBaselineConstruction
      ] || []
    );
  }

  if (field.source === 'nonOberLineSoundFocus') {
    if (
      isHeritageConstruction(selector.construction) ||
      isFeuzonConstruction(selector.construction) ||
      isSoundLegendConstruction(selector.construction)
    ) {
      return [];
    }

    if (selector.drumType !== 'Overall Kit / Line Sound') {
      return [];
    }

    return NON_OBER_LINE_SOUND_FOCUS_OPTIONS;
  }

  if (field.source === 'nonOberPlyLayupStyle') {
    if (selector.nonOberBaselineConstruction !== 'Ply') return [];

    return NON_OBER_PLY_LAYUP_OPTIONS;
  }

  if (field.source === 'nonOberReinforcementRings') {
    if (
      !['Ply', 'Steam Bent', 'Solid'].includes(
        selector.nonOberBaselineConstruction
      )
    ) {
      return [];
    }

    return NON_OBER_REINFORCEMENT_RING_OPTIONS;
  }

  if (field.source === 'nonOberBeadedShell') {
    if (selector.nonOberBaselineConstruction !== 'Metal') return [];

    return NON_OBER_BEADED_SHELL_OPTIONS;
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

    if (field.source === 'soundLegendWoodSpeciesTertiary' && speciesCount < 3) {
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

    return NON_OBER_FINISH_TREATMENT_OPTIONS;
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

    return NON_OBER_HOOP_OPTIONS;
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

    return NON_OBER_SNARE_WIRE_OPTIONS;
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

    return NON_OBER_BATTER_HEAD_OPTIONS;
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

    return NON_OBER_RESO_HEAD_OPTIONS;
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

    ['nonOberCompanyType', selector.nonOberCompanyType],

    ['nonOberCompanyName', selector.nonOberCompanyName],

    ['nonOberLineName', selector.nonOberLineName],

    ['nonOberModelName', selector.nonOberModelName],

    ['nonOberBaselineConstruction', selector.nonOberBaselineConstruction],

    ['nonOberMaterial', selector.nonOberMaterial],

    ['nonOberThicknessGroup', selector.nonOberThicknessGroup],

    ['nonOberLineSoundFocus', selector.nonOberLineSoundFocus],

    ['nonOberPlyLayupStyle', selector.nonOberPlyLayupStyle],

    ['nonOberReinforcementRings', selector.nonOberReinforcementRings],

    ['nonOberBeadedShell', selector.nonOberBeadedShell],

    ['diameter', selector.diameter],

    ['depth', selector.depth],

    ['thickness', selector.thickness],

    ['finish', selector.finish],

    ['finishCoating', selector.finishCoating],

    ['stainOption', selector.stainOption],

    ['exteriorScorch', selector.exteriorScorch],

    ['soundLegendConstructionType', selector.soundLegendConstructionType],

    ['soundLegendWoodSpeciesCount', selector.soundLegendWoodSpeciesCount],

    ['soundLegendWoodSpeciesPrimary', selector.soundLegendWoodSpeciesPrimary],

    [
      'soundLegendWoodSpeciesSecondary',

      selector.soundLegendWoodSpeciesSecondary,
    ],

    ['soundLegendWoodSpeciesTertiary', selector.soundLegendWoodSpeciesTertiary],

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

const getReferenceScore = (drum = {}, node) => {
  const directKey = `overall${node.charAt(0).toUpperCase()}${node.slice(
    1
  )}OberScore`;

  const fallbackScores = drum.scores || {};

  return (
    Number(drum[directKey]) ||
    Number(fallbackScores[node]) ||
    Number(drum?.legacyPrintScores?.[node]) ||
    5
  );
};

const flattenReferenceValue = (value = '') => {
  if (value === undefined || value === null) return '';

  if (Array.isArray(value)) {
    return value.map(flattenReferenceValue).filter(Boolean).join(' / ');
  }

  if (typeof value === 'object') {
    const preferredKeys = [
      'label',

      'name',

      'value',

      'material',

      'shellMaterial',

      'shellMaterial1',

      'primaryShellMaterial',

      'wood',

      'metal',

      'type',

      'text',

      'description',
    ];

    for (const key of preferredKeys) {
      if (
        value[key] !== undefined &&
        value[key] !== null &&
        String(value[key]).trim() !== ''
      ) {
        return flattenReferenceValue(value[key]);
      }
    }

    return Object.values(value)
      .map(flattenReferenceValue)
      .filter(Boolean)
      .join(' / ');
  }

  return String(value || '').trim();
};

const getReferenceDrumMaterial = (drum = {}) => {
  const materialParts = [
    drum.shell?.material1,

    drum.shell?.material2,

    drum.shell?.material3,

    drum.shellMaterial1,

    drum.shellMaterial2,

    drum.shellMaterial3,

    drum.primaryShellMaterial,

    drum.shellMaterial,

    drum.material,

    drum.normalizedShellMaterial,

    drum.normalizedMaterial,

    drum.shell_material_1,

    drum.shell_material,

    drum.shellMaterialDescription,

    drum.shellConstructionMaterial,

    drum.wood,

    drum.shellWood,

    drum.alloy,

    drum.metal,
  ]

    .map(flattenReferenceValue)

    .filter(Boolean);

  const directMaterial = Array.from(new Set(materialParts)).join(' / ');

  if (directMaterial) {
    return directMaterial;
  }

  const searchableText = [
    drum.modelName,

    drum.model,

    drum.modelNumber,

    drum.lineSeries,

    drum.line,

    drum.series,

    drum.shell?.construction,

    drum.shellConstruction,

    drum.normalizedShellConstruction,

    drum.shell?.plyCountLayup,

    drum.plyCountLayup,

    drum.oberScores?.scoringBasis,

    drum.scoringBasis,

    drum.notes?.summary,

    drum.notes?.missingData,

    drum.drumSummaryNotes,

    drum.notesOnMissingData,

    drum.notes,

    drum.summary,

    drum.description,

    drum.shellNotes,

    drum.sources?.primarySourceUrl,

    drum.sources?.secondarySourceUrl,

    drum.primarySourceUrl,

    drum.secondarySourceUrl,

    drum.importMeta?.rawText,

    drum.importMeta?.description,

    drum.importMeta?.notes,
  ]

    .map(flattenReferenceValue)

    .filter(Boolean)

    .join(' ')

    .toLowerCase();

  const materialMatches = [
    ['black nickel over brass', 'Black Nickel over Brass'],

    ['chrome over brass', 'Chrome over Brass'],

    ['nickel over brass', 'Nickel over Brass'],

    ['cast bell brass', 'Cast Bell Brass'],

    ['bell brass', 'Bell Brass'],

    ['hammered brass', 'Hammered Brass'],

    ['raw brass', 'Raw Brass'],

    ['brass', 'Brass'],

    ['phosphor bronze', 'Phosphor Bronze'],

    ['bronze', 'Bronze'],

    ['copper', 'Copper'],

    ['aluminum', 'Aluminum'],

    ['aluminium', 'Aluminum'],

    ['stainless steel', 'Stainless Steel'],

    ['raw steel', 'Raw Steel'],

    ['steel', 'Steel'],

    ['titanium', 'Titanium'],

    ['iron', 'Iron'],

    ['northern red oak', 'Northern Red Oak'],

    ['tasmanian blackwood', 'Tasmanian Blackwood'],

    ['maple gum', 'Maple / Gum'],

    ['maple/gum', 'Maple / Gum'],

    ['maple poplar', 'Maple / Poplar'],

    ['maple/poplar', 'Maple / Poplar'],

    ['maple mahogany', 'Maple / Mahogany'],

    ['maple/mahogany', 'Maple / Mahogany'],

    ['mahogany poplar', 'Mahogany / Poplar'],

    ['mahogany/poplar', 'Mahogany / Poplar'],

    ['birch bubinga', 'Birch / Bubinga'],

    ['birch/bubinga', 'Birch / Bubinga'],

    ['walnut birch', 'Walnut / Birch'],

    ['walnut/birch', 'Walnut / Birch'],

    ['maple walnut', 'Maple / Walnut'],

    ['maple/walnut', 'Maple / Walnut'],

    ['jarrah', 'Jarrah'],

    ['sheoak', 'Sheoak'],

    ['blackwood', 'Blackwood'],

    ['maple', 'Maple'],

    ['walnut', 'Walnut'],

    ['mahogany', 'Mahogany'],

    ['oak', 'Oak'],

    ['birch', 'Birch'],

    ['cherry', 'Cherry'],

    ['beech', 'Beech'],

    ['poplar', 'Poplar'],

    ['bubinga', 'Bubinga'],

    ['kapur', 'Kapur'],

    ['spruce', 'Spruce'],

    ['sassafras', 'Sassafras'],

    ['ash', 'Ash'],

    ['rose gum', 'Rose Gum'],

    ['gum', 'Gum'],

    ['acrylic', 'Acrylic'],

    ['carbon fiber', 'Carbon Fiber'],
  ];

  const match = materialMatches.find(([needle]) =>
    searchableText.includes(needle)
  );

  return match?.[1] || '';
};

const getReferenceDrumThickness = (drum = {}) => {
  return (
    drum.shell?.thicknessMm ||
    drum.shellThicknessMm ||
    drum.thicknessMm ||
    drum.shellThickness ||
    drum.thickness ||
    drum.shell_thickness_mm ||
    ''
  );
};

const getReferenceDrumHoop = (drum = {}) => {
  return (
    drum.shell?.hoopRimType ||
    drum.hoopRimType ||
    drum.hoopType ||
    drum.hoops ||
    drum.rimType ||
    drum.stockHoops ||
    ''
  );
};

const getReferenceDrumConstruction = (drum = {}) => {
  return (
    drum.shell?.construction ||
    drum.shellConstruction ||
    drum.normalizedShellConstruction ||
    ''
  );
};

const getReferenceDrumLugCount = (drum = {}) => {
  return drum.hardware?.lugCount || drum.lugCount || '';
};

const getReferenceDrumField = (drum = {}, nestedPath = '', flatKey = '') => {
  if (nestedPath === 'shell.plyCountLayup') {
    return drum.shell?.plyCountLayup || drum[flatKey] || '';
  }

  if (nestedPath === 'shell.reinforcementRings') {
    return drum.shell?.reinforcementRings || drum[flatKey] || '';
  }

  if (nestedPath === 'shell.bearingEdge') {
    return drum.shell?.bearingEdge || drum[flatKey] || '';
  }

  if (nestedPath === 'shell.snareBedType') {
    return drum.shell?.snareBedType || drum[flatKey] || '';
  }

  if (nestedPath === 'shell.finishType') {
    return drum.shell?.finishType || drum[flatKey] || '';
  }

  if (nestedPath === 'hardware.stockSnareWires') {
    return drum.hardware?.stockSnareWires || drum[flatKey] || '';
  }

  if (nestedPath === 'hardware.stockBatterHead') {
    return drum.hardware?.stockBatterHead || drum[flatKey] || '';
  }

  if (nestedPath === 'hardware.stockResoHead') {
    return drum.hardware?.stockResoHead || drum[flatKey] || '';
  }

  return drum[flatKey] || '';
};

const mapReferenceDrumToSelector = (drum = {}) => {
  const diameter = drum.diameter ? `${drum.diameter} in` : '14 in';

  const depth = drum.depth ? `${drum.depth} in` : '5.5 in';

  const thickness = getReferenceDrumThickness(drum);

  const lugCount = getReferenceDrumLugCount(drum);

  return {
    drumType: 'Snare',

    nonOberCompanyType: drum.companyType || 'Major Manufacturer',

    nonOberCompanyName: drum.companyName || '',

    nonOberLineName: drum.lineSeries || '',

    nonOberModelName: drum.modelName || '',

    nonOberBaselineConstruction: getReferenceDrumConstruction(drum) || 'Ply',

    nonOberMaterial: getReferenceDrumMaterial(drum),

    nonOberThicknessGroup: thickness ? `${thickness}mm` : '',

    nonOberPlyLayupStyle: getReferenceDrumField(
      drum,

      'shell.plyCountLayup',

      'plyCountLayup'
    ),

    nonOberReinforcementRings: getReferenceDrumField(
      drum,

      'shell.reinforcementRings',

      'reinforcementRings'
    ),

    nonOberBeadedShell: '',

    diameter,

    depth,

    thickness: thickness ? `${thickness}mm` : '',

    lugCount: lugCount ? `${lugCount} lug` : '',

    staveCount: '',

    finish: getReferenceDrumField(drum, 'shell.finishType', 'finishType'),

    hoopType: getReferenceDrumHoop(drum),

    bearingEdge: getReferenceDrumField(
      drum,

      'shell.bearingEdge',

      'bearingEdge'
    ),

    snareBed: getReferenceDrumField(
      drum,

      'shell.snareBedType',

      'snareBedType'
    ),

    snareWires: getReferenceDrumField(
      drum,

      'hardware.stockSnareWires',

      'stockSnareWires'
    ),

    batterHead: getReferenceDrumField(
      drum,

      'hardware.stockBatterHead',

      'stockBatterHead'
    ),

    resoHead: getReferenceDrumField(
      drum,

      'hardware.stockResoHead',

      'stockResoHead'
    ),

    tension: 'Medium',
  };
};

const buildReferencePreviewFromDrum = (drum = {}) => {
  const playerValues = LEGACYPRINT_NODE_ORDER.reduce((acc, node) => {
    acc[node] = round(getReferenceScore(drum, node), 2);

    return acc;
  }, {});

  const topNodes = [...LEGACYPRINT_NODE_ORDER]

    .sort((a, b) => playerValues[b] - playerValues[a])

    .slice(0, 3);

  const firstListenProfile = LEGACYPRINT_NODE_ORDER.reduce((acc, node) => {
    acc[node] = topNodes.includes(node)
      ? round(clamp(playerValues[node], 5.5, 9.35), 2)
      : 3.25;

    return acc;
  }, {});

  const firstListenTop = topNodes.map((node) => ({
    node,

    label: LEGACYPRINT_NODE_LABELS[node],

    playerValue: playerValues[node],

    neutral: 5,

    rawMovement: round(Math.max(0, playerValues[node] - 5), 2),

    firstListenScore: round(Math.max(0.1, playerValues[node] - 4.5), 2),

    why: getFirstListenWhy(node),
  }));

  const centerHz =
    Number.parseFloat(drum.projectedShellFundamentalPitch) ||
    Number.parseFloat(drum.projectedShellFundamentalHz) ||
    347;

  const hzLow = Math.round(centerHz * 0.88);

  const hzHigh = Math.round(centerHz * 1.18);

  return {
    comparisonMode: {
      option: 'Firestore Reference Drum',
    },

    configDifferentialFactor: 1,

    playerValues,

    spiderValues: LEGACYPRINT_NODE_ORDER.map((node) => playerValues[node]),

    firstListenRows: firstListenTop,

    firstListenTop,

    firstListenNodes: topNodes,

    firstListenProfile,

    firstListenThread: {
      id: `firestore-reference-${drum.id || drum.modelName || 'drum'}`,

      slotKey: 'simple',

      visualMode: 'triangle',

      title: firstListenTop.map((row) => row.label).join(' / '),

      nodes: topNodes,

      score: firstListenTop[0]?.firstListenScore || 1,

      summary: `The drum is reading first as ${firstListenTop

        .map((row) => row.label.toLowerCase())

        .join(', ')}.`,
    },

    firstListenTitle: `${firstListenTop

      .map((row) => row.label)

      .join(' / ')} first impression`,

    firstListenDescription:
      drum.drumSummaryNotes ||
      drum.summary ||
      `This read is coming directly from the Firestore reference score for ${
        drum.companyName || 'this maker'
      } ${drum.modelName || 'reference snare'}.`,

    playerAnalysisTitle: `${
      LEGACYPRINT_NODE_LABELS[topNodes[0]] || 'Reference'
    } led player feel`,

    playerAnalysisDescription:
      drum.drumSummaryNotes ||
      `A Firestore-backed seven-node read for ${drum.companyName || ''} ${
        drum.modelName || ''
      }.`,

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

  const [referenceDrums, setReferenceDrums] = useState([]);

  const [isLoadingReferenceDrums, setIsLoadingReferenceDrums] = useState(false);

  const [selectedReferenceDrumId, setSelectedReferenceDrumId] = useState('');

  const [isSavingReferenceDrum, setIsSavingReferenceDrum] = useState(false);

  const [activeReferenceResearchTarget, setActiveReferenceResearchTarget] =
    useState(null);

    const [selectedResearchApplyFields, setSelectedResearchApplyFields] = useState(

  []

);

const [isApplyingResearchResult, setIsApplyingResearchResult] = useState(false);

const [researchApplyMessage, setResearchApplyMessage] = useState('');

  const functions = useMemo(() => getFunctions(), []);

const researchSnareReferenceDrumWithAI = useMemo(

  () => httpsCallable(functions, 'researchSnareReferenceDrumWithAI'),

  [functions]

);

const applySnareReferenceResearchResult = useMemo(

  () => httpsCallable(functions, 'applySnareReferenceResearchResult'),

  [functions]

);

  const selectedReferenceDrum = useMemo(() => {
    return (
      referenceDrums.find((drum) => drum.id === selectedReferenceDrumId) || null
    );
  }, [referenceDrums, selectedReferenceDrumId]);

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

    const loadReferenceDrums = async () => {
      setIsLoadingReferenceDrums(true);

      try {
        console.log('LegacyPrint Firestore debug:', {
          projectId: db.app.options.projectId,

          collection: SNARE_REFERENCE_DRUMS_COLLECTION,
        });

        const pageSize = 500;

        let allDocs = [];

        let lastDoc = null;

        let hasMore = true;

        while (hasMore) {
          const referenceQuery = lastDoc
            ? query(
                collection(db, SNARE_REFERENCE_DRUMS_COLLECTION),

                orderBy('companyName'),

                startAfter(lastDoc),

                limit(pageSize)
              )
            : query(
                collection(db, SNARE_REFERENCE_DRUMS_COLLECTION),

                orderBy('companyName'),

                limit(pageSize)
              );

          const snapshot = await getDocs(referenceQuery);

          allDocs = [...allDocs, ...snapshot.docs];

          lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

          hasMore = snapshot.size === pageSize;
        }

        console.log('snareReferenceDrums total loaded:', allDocs.length);

        allDocs.slice(0, 5).forEach((docSnap) => {
          console.log(
            'snareReferenceDrums sample doc:',

            docSnap.id,

            docSnap.data()
          );
        });

        const rows = allDocs

          .map((docSnap) => ({
            id: docSnap.id,

            ...docSnap.data(),
          }))

          .filter((drum) => {
            const rawType = normalizeText(
              drum.drumType || drum.type || 'snare'
            );

            return (
              rawType === 'snare' || rawType.includes('snare') || !drum.drumType
            );
          })

          .sort((a, b) => {
            const companyA = String(a.companyName || '').toLowerCase();

            const companyB = String(b.companyName || '').toLowerCase();

            if (companyA !== companyB) {
              return companyA.localeCompare(companyB);
            }

            return String(a.modelName || '').localeCompare(
              String(b.modelName || '')
            );
          });

        if (!isMounted) return;

        setReferenceDrums(rows);

        if (!selectedReferenceDrumId && rows[0]?.id) {
          setSelectedReferenceDrumId(rows[0].id);
        }
      } catch (error) {
        console.error('Failed loading snare reference drums:', {
          code: error.code,

          message: error.message,

          fullError: error,
        });

        if (isMounted) {
          setReferenceDrums([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingReferenceDrums(false);
        }
      }
    };

    loadReferenceDrums();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const selectedEngineLineKey = useMemo(() => {
    if (isHeritageConstruction(safeSelector.construction)) return 'heritage';

    if (isFeuzonConstruction(safeSelector.construction)) return 'feuzon';

    if (isSoundLegendConstruction(safeSelector.construction)) {
      return 'soundlegend';
    }

    return 'nonOber';
  }, [safeSelector.construction]);

  useEffect(() => {
    if (selectedEngineLineKey !== 'nonOber') return;

    if (!referenceDrums.length) return;

    const companyOptions = Array.from(
      new Set(referenceDrums.map((drum) => drum.companyName).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const selectedCompanyIsValid = companyOptions.includes(
      selector.nonOberCompanyName
    );

    const activeCompany = selectedCompanyIsValid
      ? selector.nonOberCompanyName
      : companyOptions[0] || '';

    const companyDrums = referenceDrums.filter(
      (drum) => drum.companyName === activeCompany
    );

    const lineOptions = Array.from(
      new Set(companyDrums.map((drum) => drum.lineSeries).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const selectedLineIsValid = lineOptions.includes(selector.nonOberLineName);

    const activeLine = selectedLineIsValid
      ? selector.nonOberLineName
      : lineOptions[0] || '';

    const matchingDrums = companyDrums.filter((drum) => {
      if (!activeLine) return true;

      return drum.lineSeries === activeLine;
    });

    const selectedDrumStillValid = matchingDrums.some(
      (drum) => drum.id === selectedReferenceDrumId
    );

    const fallbackDrum = selectedDrumStillValid
      ? referenceDrums.find((drum) => drum.id === selectedReferenceDrumId)
      : matchingDrums[0] || companyDrums[0];

    if (!fallbackDrum) return;

    const needsCompanyOrLineSync =
      selector.nonOberCompanyName !== activeCompany ||
      selector.nonOberLineName !== activeLine;

    const needsSelectedDrumSync = !selectedDrumStillValid;

    if (needsCompanyOrLineSync || needsSelectedDrumSync) {
      setSelector((current) => ({
        ...current,

        drumType: 'Snare',

        construction: 'Generic Ply Shell',

        nonOberCompanyType: fallbackDrum.companyType || 'Major Manufacturer',

        nonOberCompanyName: activeCompany,

        nonOberLineName: activeLine,

        nonOberModelName: fallbackDrum.modelName || '',
      }));

      setSelectedReferenceDrumId(fallbackDrum.id);
    }
  }, [
    selectedEngineLineKey,

    referenceDrums,

    selector.nonOberCompanyName,

    selector.nonOberLineName,

    selectedReferenceDrumId,
  ]);

  const preview = useMemo(() => {
    if (selectedEngineLineKey === 'nonOber' && selectedReferenceDrum) {
      return buildReferencePreviewFromDrum(selectedReferenceDrum);
    }

    return buildVoicePreview(safeSelector, draftCalibration);
  }, [
    selectedEngineLineKey,

    safeSelector,

    draftCalibration,

    selectedReferenceDrum,
  ]);

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

      if (lineOption.key === 'nonOber') {
        return {
          ...nextSelector,

          drumType: 'Snare',

          diameter: '14 in',

          depth: '5.5 in',

          thickness: '',

          lugCount: '8 lug',

          staveCount: '',

          nonOberCompanyType: 'Generic / Baseline Reference',

          nonOberCompanyName: '',

          nonOberLineName: 'Ply Reference',

          nonOberModelName: 'Maple',

          nonOberBaselineConstruction: 'Ply',

          nonOberMaterial: 'Maple',

          nonOberThicknessGroup: 'Medium / 6–8mm',

          nonOberLineSoundFocus: 'Balanced Studio Line',

          nonOberPlyLayupStyle: 'Standard Cross-Laminated Ply',

          nonOberReinforcementRings: 'No Reinforcement Rings',

          nonOberBeadedShell: 'No Center Bead',

          finish: 'Satin Clear',

          finishCoating: '',

          stainOption: '',

          exteriorScorch: '',

          coreStaveShell: '',

          steamBentExterior: '',

          hoopType: 'Triple Flange 2.3mm',

          bearingEdge: '45° inner edge with softened outer roundover',

          snareBed: 'Standard',

          tension: 'Medium',

          snareWires: 'Generic 20-Strand Steel',

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
        if (key === 'nonOberCompanyType') {
          if (value === 'Generic / Baseline Reference') {
            const lineOptions =
              NON_OBER_LINE_OPTIONS_BY_COMPANY['Generic Reference'] || [];

            const nextLineName = lineOptions[0] || 'Ply Reference';

            const materialOptions =
              NON_OBER_BASELINE_MATERIAL_OPTIONS_BY_LINE[nextLineName] || [];

            return {
              ...next,

              nonOberCompanyName: '',

              nonOberLineName: nextLineName,

              nonOberModelName: materialOptions[0] || 'Maple',

              nonOberBaselineConstruction: 'Ply',

              nonOberMaterial: materialOptions[0] || 'Maple',

              nonOberThicknessGroup: 'Medium / 6–8mm',

              nonOberPlyLayupStyle: NON_OBER_PLY_LAYUP_OPTIONS[0],

              nonOberReinforcementRings: NON_OBER_REINFORCEMENT_RING_OPTIONS[0],

              nonOberBeadedShell: '',
            };
          }

          const companyOptions =
            NON_OBER_COMPANY_OPTIONS_BY_TYPE[value] ||
            NON_OBER_COMPANY_OPTIONS_BY_TYPE['Major Manufacturer'] ||
            [];

          const nextCompanyName = companyOptions[0] || '';

          const lineOptions =
            NON_OBER_LINE_OPTIONS_BY_COMPANY[nextCompanyName] ||
            NON_OBER_LINE_OPTIONS_BY_COMPANY.default ||
            [];

          const nextLineName = lineOptions[0] || '';

          const makerData =
            NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER[nextCompanyName] ||
            NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER.default;

          const modelOptions = makerData[next.drumType] || [];

          return {
            ...next,

            nonOberCompanyName: nextCompanyName,

            nonOberLineName: nextLineName,

            nonOberModelName: modelOptions[0] || '',

            nonOberBaselineConstruction: '',

            nonOberMaterial: '',

            nonOberThicknessGroup: '',

            nonOberPlyLayupStyle: '',

            nonOberReinforcementRings: '',

            nonOberBeadedShell: '',
          };
        }

        if (key === 'nonOberCompanyName') {
          const lineOptions =
            NON_OBER_LINE_OPTIONS_BY_COMPANY[value] ||
            NON_OBER_LINE_OPTIONS_BY_COMPANY.default ||
            [];

          const nextLineName = lineOptions[0] || '';

          const makerData =
            NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER[value] ||
            NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER.default;

          const modelOptions = makerData[next.drumType] || [];

          return {
            ...next,

            nonOberLineName: nextLineName,

            nonOberModelName: modelOptions[0] || '',
          };
        }

        if (
          key === 'nonOberLineName' &&
          next.nonOberCompanyType !== 'Generic / Baseline Reference'
        ) {
          const lineSpecificOptions = getNonOberModelOptionsForSelection({
            companyName: next.nonOberCompanyName,

            lineName: value,

            drumType: next.drumType,
          });

          const makerData =
            NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER[next.nonOberCompanyName] ||
            NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER.default;

          const fallbackOptions = makerData[next.drumType] || [];

          const modelOptions = lineSpecificOptions.length
            ? lineSpecificOptions
            : fallbackOptions;

          return {
            ...next,

            nonOberModelName: modelOptions[0] || '',
          };
        }

        if (
          key === 'nonOberLineName' &&
          next.nonOberCompanyType === 'Generic / Baseline Reference'
        ) {
          const constructionByLine = {
            'Ply Reference': 'Ply',

            'Stave Reference': 'Stave',

            'Steam-Bent Reference': 'Steam Bent',

            'Solid Shell Reference': 'Solid',

            'Metal Reference': 'Metal',

            'Acrylic Reference': 'Acrylic',
          };

          const nextConstruction = constructionByLine[value] || 'Ply';

          const materialOptions =
            NON_OBER_BASELINE_MATERIAL_OPTIONS_BY_LINE[value] ||
            NON_OBER_MATERIAL_OPTIONS_BY_CONSTRUCTION[nextConstruction] ||
            [];

          const thicknessOptions =
            NON_OBER_THICKNESS_OPTIONS_BY_CONSTRUCTION[nextConstruction] || [];

          return {
            ...next,

            nonOberBaselineConstruction: nextConstruction,

            nonOberModelName: materialOptions[0] || '',

            nonOberMaterial: materialOptions[0] || '',

            nonOberThicknessGroup:
              thicknessOptions[1] || thicknessOptions[0] || '',

            nonOberPlyLayupStyle:
              nextConstruction === 'Ply' ? NON_OBER_PLY_LAYUP_OPTIONS[0] : '',

            nonOberReinforcementRings: ['Ply', 'Steam Bent', 'Solid'].includes(
              nextConstruction
            )
              ? NON_OBER_REINFORCEMENT_RING_OPTIONS[0]
              : '',

            nonOberBeadedShell:
              nextConstruction === 'Metal'
                ? NON_OBER_BEADED_SHELL_OPTIONS[0]
                : '',

            staveCount:
              nextConstruction === 'Stave'
                ? next.staveCount || '16 staves'
                : '',
          };
        }

        if (key === 'nonOberBaselineConstruction') {
          const materialOptions =
            NON_OBER_MATERIAL_OPTIONS_BY_CONSTRUCTION[value] || [];

          const thicknessOptions =
            NON_OBER_THICKNESS_OPTIONS_BY_CONSTRUCTION[value] || [];

          return {
            ...next,

            nonOberMaterial: materialOptions[0] || '',

            nonOberThicknessGroup:
              thicknessOptions[1] || thicknessOptions[0] || '',

            nonOberPlyLayupStyle:
              value === 'Ply' ? NON_OBER_PLY_LAYUP_OPTIONS[0] : '',

            nonOberReinforcementRings: ['Ply', 'Steam Bent', 'Solid'].includes(
              value
            )
              ? NON_OBER_REINFORCEMENT_RING_OPTIONS[0]
              : '',

            nonOberBeadedShell:
              value === 'Metal' ? NON_OBER_BEADED_SHELL_OPTIONS[0] : '',

            staveCount: value === 'Stave' ? next.staveCount || '16 staves' : '',
          };
        }

        if (key === 'drumType') {
          const lineSpecificOptions = getNonOberModelOptionsForSelection({
            companyName: next.nonOberCompanyName,

            lineName: next.nonOberLineName,

            drumType: value,
          });

          const makerData =
            NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER[next.nonOberCompanyName] ||
            NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER.default;

          const fallbackOptions = makerData[value] || [];

          const modelOptions = lineSpecificOptions.length
            ? lineSpecificOptions
            : fallbackOptions;

          return {
            ...next,

            nonOberLineSoundFocus:
              value === 'Overall Kit / Line Sound'
                ? next.nonOberLineSoundFocus ||
                  NON_OBER_LINE_SOUND_FOCUS_OPTIONS[0]
                : '',

            nonOberModelName:
              value === 'Overall Kit / Line Sound'
                ? modelOptions[0] || 'General Full Kit Reference'
                : modelOptions[0] || '',
          };
        }

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

          coreStaveShell: usesHybridShell
            ? next.coreStaveShell || FEUZON_CORE_STAVE_OPTIONS[0]
            : '',

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
    const selectedLineKey = selectedEngineLineKey;

    if (selectedLineKey === 'heritage') {
      return SELECTOR_FIELDS.filter((field) => {
        return ![
          'drumType',

          'construction',

          'nonOberCompanyType',

          'nonOberCompanyName',

          'nonOberLineName',

          'nonOberModelName',

          'nonOberBaselineConstruction',

          'nonOberMaterial',

          'nonOberThicknessGroup',

          'nonOberLineSoundFocus',

          'nonOberPlyLayupStyle',

          'nonOberReinforcementRings',

          'nonOberBeadedShell',

          'exteriorScorch',

          'coreStaveShell',

          'steamBentExterior',
        ].includes(field.key);
      });
    }

    if (selectedLineKey === 'feuzon') {
      return SELECTOR_FIELDS.filter((field) => {
        return ![
          'drumType',

          'construction',

          'nonOberCompanyType',

          'nonOberCompanyName',

          'nonOberLineName',

          'nonOberModelName',

          'nonOberBaselineConstruction',

          'nonOberMaterial',

          'nonOberThicknessGroup',

          'nonOberLineSoundFocus',

          'nonOberPlyLayupStyle',

          'nonOberReinforcementRings',

          'nonOberBeadedShell',
        ].includes(field.key);
      });
    }

    if (selectedLineKey === 'soundlegend') {
      return SELECTOR_FIELDS.filter((field) => {
        return ![
          'drumType',

          'construction',

          'nonOberCompanyType',

          'nonOberCompanyName',

          'nonOberLineName',

          'nonOberModelName',

          'nonOberBaselineConstruction',

          'nonOberMaterial',

          'nonOberThicknessGroup',

          'nonOberLineSoundFocus',

          'nonOberPlyLayupStyle',

          'nonOberReinforcementRings',

          'nonOberBeadedShell',
        ].includes(field.key);
      });
    }

    return SELECTOR_FIELDS.filter((field) => {
      return ![
        'construction',

        'soundLegendConstructionType',

        'soundLegendWoodSpeciesCount',

        'soundLegendWoodSpeciesPrimary',

        'soundLegendWoodSpeciesSecondary',

        'soundLegendWoodSpeciesTertiary',

        'soundLegendWoodSpeciesQuaternary',

        'soundLegendVeneerExterior',

        'coreStaveShell',

        'steamBentExterior',
      ].includes(field.key);
    });
  };

  const getSelectedEngineLineKey = () => selectedEngineLineKey;

  const getNonOberAvailableModels = () => {
    const makerData =
      NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER[selectedNonOberMaker] ||
      NON_OBER_PLACEHOLDER_DRUMS_BY_MAKER.default;

    return makerData[selectedNonOberDrumType] || [];
  };

  const handleSaveReferenceDrum = async (updatedFields = {}) => {
    if (!selectedReferenceDrumId) {
      window.alert('Select a snare reference drum first.');

      return;
    }

    setIsSavingReferenceDrum(true);

    try {
      const referenceDrumRef = doc(
        db,

        SNARE_REFERENCE_DRUMS_COLLECTION,

        selectedReferenceDrumId
      );

      const cleanPayload = {
        ...updatedFields,

        updatedAt: serverTimestamp(),
      };

      await updateDoc(referenceDrumRef, cleanPayload);

      setReferenceDrums((current) =>
        current.map((drum) =>
          drum.id === selectedReferenceDrumId
            ? {
                ...drum,

                ...updatedFields,
              }
            : drum
        )
      );

      window.alert('Snare reference drum saved.');
    } catch (error) {
      console.error('Failed saving snare reference drum:', error);

      window.alert('Failed saving snare reference drum. Check console.');
    } finally {
      setIsSavingReferenceDrum(false);
    }
  };

  const selectReferenceDrum = (drum = null) => {
    if (!drum?.id) return;

    const mapped = mapReferenceDrumToSelector(drum);

    setSelectedReferenceDrumId(drum.id);

    setSelector((current) => ({
      ...current,

      ...mapped,

      construction: 'Generic Ply Shell',

      drumType: 'Snare',

      nonOberCompanyType:
        drum.companyType || current.nonOberCompanyType || 'Major Manufacturer',

      nonOberCompanyName: drum.companyName || current.nonOberCompanyName || '',

      nonOberLineName: drum.lineSeries || current.nonOberLineName || '',

      nonOberModelName: drum.modelName || current.nonOberModelName || '',
    }));

    setActivePreviewRead('First Listen');
  };

  const getResearchFieldLabel = (key = '') => {

  const labels = {

    bearingEdge: 'Bearing Edge',

    snareBedType: 'Snare Bed Type',

    hoopRimType: 'Hoop / Rim Type',

    lugCount: 'Lug Count',

  };

  return labels[key] || key;

};

const getUsableResearchFields = (result = null) => {

  const confirmedFields = result?.confirmedFields || {};

  return Object.entries(confirmedFields)

    .map(([key, field]) => {

      const rawValue = field?.value;

      const normalizedValue = String(rawValue || '').trim().toLowerCase();

      const isUsable =

        rawValue !== undefined &&

        rawValue !== null &&

        normalizedValue !== '' &&

        normalizedValue !== 'unknown' &&

        normalizedValue !== 'unknown / not published' &&

        normalizedValue !== 'not published' &&

        normalizedValue !== 'null';

      return {

        key,

        value: rawValue,

        confidence: field?.confidence || '',

        sourceUrl: field?.sourceUrl || '',

        notes: field?.notes || '',

        usable: isUsable,

      };

    })

    .filter((field) =>

      ['bearingEdge', 'snareBedType', 'hoopRimType', 'lugCount'].includes(

        field.key

      )

    );

};

const toggleResearchApplyField = (fieldKey) => {

  setSelectedResearchApplyFields((current) => {

    if (current.includes(fieldKey)) {

      return current.filter((key) => key !== fieldKey);

    }

    return [...current, fieldKey];

  });

};

const handleApplyResearchResult = async () => {

  const target = activeReferenceResearchTarget;

  const job = target?.researchJob;

  if (!target?.id) {

    setResearchApplyMessage('No research target selected.');

    return;

  }

  if (!job?.jobId) {

    setResearchApplyMessage('No completed research job found.');

    return;

  }

  if (!selectedResearchApplyFields.length) {

    setResearchApplyMessage('Select at least one confirmed field to apply.');

    return;

  }

  setIsApplyingResearchResult(true);

  setResearchApplyMessage('');

  try {

    const result = await applySnareReferenceResearchResult({

      drumId: target.id,

      jobId: job.jobId,

      fieldsToApply: selectedResearchApplyFields,

    });

    const appliedCount = result?.data?.appliedCount || 0;

    setResearchApplyMessage(

      `Applied ${appliedCount} confirmed field${

        appliedCount === 1 ? '' : 's'

      } to the snare reference record.`

    );

    setReferenceDrums((current) =>

      current.map((drum) => {

        if (drum.id !== target.id) return drum;

        const confirmedFields = job?.result?.confirmedFields || {};

        const nextDrum = { ...drum };

        selectedResearchApplyFields.forEach((fieldKey) => {

          const value = confirmedFields[fieldKey]?.value;

          if (fieldKey === 'bearingEdge') {

            nextDrum.bearingEdge = value;

            nextDrum.shell = {

              ...(nextDrum.shell || {}),

              bearingEdge: value,

            };

          }

          if (fieldKey === 'snareBedType') {

            nextDrum.snareBedType = value;

            nextDrum.shell = {

              ...(nextDrum.shell || {}),

              snareBedType: value,

            };

          }

          if (fieldKey === 'hoopRimType') {

            nextDrum.hoopRimType = value;

            nextDrum.hoopType = value;

            nextDrum.shell = {

              ...(nextDrum.shell || {}),

              hoopRimType: value,

            };

          }

          if (fieldKey === 'lugCount') {

            nextDrum.lugCount = value;

            nextDrum.hardware = {

              ...(nextDrum.hardware || {}),

              lugCount: value,

            };

          }

        });

        return nextDrum;

      })

    );

  } catch (error) {

    console.error('Failed applying AI snare research result:', error);

    setResearchApplyMessage(

      error?.message || 'Failed to apply research result.'

    );

  } finally {

    setIsApplyingResearchResult(false);

  }

};

const handleResearchReferenceDrum = async (researchTarget) => {

  if (!researchTarget?.id) {

    console.warn('No snare research target id found:', researchTarget);

    return;

  }

  try {

    setSelectedResearchApplyFields([]);

    setResearchApplyMessage('');

    setActiveReferenceResearchTarget({

      ...researchTarget,

      researchJob: {

        status: 'researching',

      },

      researchJobError: '',

    });

    const result = await researchSnareReferenceDrumWithAI({

      drumId: researchTarget.id,

    });

    console.log('AI snare research complete:', result.data);

    const usableFieldKeys = getUsableResearchFields(result.data?.result)

      .filter((field) => field.usable)

      .map((field) => field.key);

    setSelectedResearchApplyFields(usableFieldKeys);

    setActiveReferenceResearchTarget({

      ...researchTarget,

      researchJob: result.data,

      researchJobError: '',

    });

  } catch (error) {

    console.error('Failed running AI snare research:', error);

    setActiveReferenceResearchTarget({

      ...researchTarget,

      researchJobError: error?.message || 'Failed running AI snare research.',

    });

  }

};

  const renderNonOberReferenceBuilder = () => {
    const companyOptions = Array.from(
      new Set(referenceDrums.map((drum) => drum.companyName).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const selectedCompanyIsValid = companyOptions.includes(
      selector.nonOberCompanyName
    );

    const activeCompany = selectedCompanyIsValid
      ? selector.nonOberCompanyName
      : companyOptions[0] || '';

    const companyDrums = referenceDrums.filter(
      (drum) => drum.companyName === activeCompany
    );

    const lineOptions = Array.from(
      new Set(companyDrums.map((drum) => drum.lineSeries).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const selectedLineIsValid = lineOptions.includes(selector.nonOberLineName);

    const activeLine = selectedLineIsValid
      ? selector.nonOberLineName
      : lineOptions[0] || '';

    const modelOptions = companyDrums.filter((drum) => {
      if (!activeLine) return true;

      return drum.lineSeries === activeLine;
    });

    return (
      <div className="legacyprint-non-ober-builder">
        <div className="legacyprint-preview-card-heading">
          <p>Firestore Reference Builder</p>

          <h4>Non-Ober Snare References</h4>
        </div>

        <p className="legacyprint-preview-description">
          This builder is now connected to the snareReferenceDrums Firestore
          collection. Select a company, line, and model to preview its imported
          LegacyPrint™ score.
        </p>

        <div className="legacyprint-admin-grid legacyprint-admin-grid--compact">
          <LegacyPrintStatCard
            label="Reference Snares"
            value={referenceDrums.length}
            detail={
              isLoadingReferenceDrums
                ? 'Loading from Firestore'
                : 'Loaded from snareReferenceDrums'
            }
          />

          <LegacyPrintStatCard
            label="Companies"
            value={companyOptions.length}
            detail="Firestore companyName values"
          />

          <LegacyPrintStatCard
            label="Current Company"
            value={activeCompany || 'None'}
            detail={`${companyDrums.length} snares`}
          />

          <LegacyPrintStatCard
            label="Current Line"
            value={activeLine || 'All Lines'}
            detail={`${modelOptions.length} matching snares`}
          />
        </div>

        <div className="legacyprint-non-ober-stage">
          <div className="legacyprint-non-ober-stage-heading">
            <span>Step 1</span>

            <strong>Select company / builder</strong>
          </div>

          <div className="legacyprint-builder-pill-grid">
            {companyOptions.map((companyName) => (
              <button
                key={companyName}
                type="button"
                className={activeCompany === companyName ? 'active' : ''}
                onClick={() => {
                  const nextCompanyDrums = referenceDrums.filter(
                    (drum) => drum.companyName === companyName
                  );

                  const nextDrum = nextCompanyDrums[0];

                  selectReferenceDrum(nextDrum);
                }}
              >
                {companyName}
              </button>
            ))}
          </div>
        </div>

        <div className="legacyprint-non-ober-stage">
          <div className="legacyprint-non-ober-stage-heading">
            <span>Step 2</span>

            <strong>Select line / series</strong>
          </div>

          <div className="legacyprint-builder-pill-grid">
            {lineOptions.map((lineName) => (
              <button
                key={lineName}
                type="button"
                className={activeLine === lineName ? 'active' : ''}
                onClick={() => {
                  const nextDrum =
                    companyDrums.find((drum) => drum.lineSeries === lineName) ||
                    companyDrums[0];

                  selectReferenceDrum(nextDrum);
                }}
              >
                {lineName}
              </button>
            ))}
          </div>
        </div>

        <div className="legacyprint-non-ober-stage">
          <div className="legacyprint-non-ober-stage-heading">
            <span>Step 3</span>

            <strong>Select snare model</strong>
          </div>

          <div className="legacyprint-non-ober-model-grid">
            {modelOptions.map((drum) => (
              <button
                key={drum.id}
                type="button"
                className={selectedReferenceDrumId === drum.id ? 'active' : ''}
                onClick={() => selectReferenceDrum(drum)}
              >
                <strong>{drum.modelName || 'Unnamed Reference Snare'}</strong>

                <span>
                  {drum.diameter || '?'}x{drum.depth || '?'} ·{' '}
                  {getReferenceDrumConstruction(drum) || 'Unknown construction'}{' '}
                  · {getReferenceDrumMaterial(drum) || 'Unknown material'} ·{' '}
                  {getReferenceDrumHoop(drum) || 'Unknown hoops'} ·{' '}
                  {getReferenceDrumLugCount(drum)
                    ? `${getReferenceDrumLugCount(drum)} lug`
                    : 'Unknown lugs'}
                </span>
              </button>
            ))}
          </div>

          {!modelOptions.length && (
            <div className="legacyprint-admin-note neutral">
              <strong>No Firestore snares found</strong>

              <span>
                No snareReferenceDrums records match the current company / line.
              </span>
            </div>
          )}
        </div>

        {selectedReferenceDrum && (
          <>
            <div className="legacyprint-admin-note">
              <strong>Selected Firestore reference</strong>

              <span>
                {selectedReferenceDrum.companyName} /{' '}
                {selectedReferenceDrum.lineSeries} /{' '}
                {selectedReferenceDrum.modelName}
              </span>
            </div>

            <SnareReferenceEditor
              drum={selectedReferenceDrum}
              isSaving={isSavingReferenceDrum}
              onSave={handleSaveReferenceDrum}
            />
          </>
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
              {selectedEngineLineKey !== 'nonOber' && (
                <AdminLegacyPrintSelector
                  selectorFields={getEngineSelectorFields()}
                  calibration={draftCalibration}
                  selector={safeSelector}
                  getSelectorOptions={getSelectorOptions}
                  getOptionMeta={getSelectorOptionMeta}
                  onSelectorChange={handleSelectorChange}
                />
              )}

              {renderSelectedLineBuilderPreview()}

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

        {activeTab === 'Engine Resources' && (
          <section className="legacyprint-admin-section">
            <SnareReferenceResourceManager
              referenceDrums={referenceDrums}
              isLoading={isLoadingReferenceDrums}
              selectedReferenceDrumId={selectedReferenceDrumId}
              onSelectReferenceDrum={(drumId) => {
                const drum = referenceDrums.find((item) => item.id === drumId);

                selectReferenceDrum(drum);
              }}
              selectedReferenceDrum={selectedReferenceDrum}
              isSavingReferenceDrum={isSavingReferenceDrum}
              onSaveReferenceDrum={handleSaveReferenceDrum}
              onResearchReferenceDrum={handleResearchReferenceDrum}
            />

            {activeReferenceResearchTarget && (
              <div className="legacyprint-admin-note neutral">
                <strong>
                  Research target selected:{' '}
                  {activeReferenceResearchTarget.companyName ||
                    'Unknown Company'}{' '}
                  / {activeReferenceResearchTarget.modelName || 'Unnamed Snare'}
                </strong>

                <span>
                  {activeReferenceResearchTarget.diameter || '?'}x
                  {activeReferenceResearchTarget.depth || '?'} ·{' '}
                  {activeReferenceResearchTarget.lineSeries || 'Unknown Series'}
                </span>

                {activeReferenceResearchTarget.researchJob?.status && (
                  <span>
                    Research job:{' '}
                    <strong>
                      {activeReferenceResearchTarget.researchJob.jobId ||
                        'Starting…'}
                    </strong>{' '}
                    · Status:{' '}
                    <strong>
                      {activeReferenceResearchTarget.researchJob.status}
                    </strong>
                  </span>
                )}

                {activeReferenceResearchTarget.researchJobError && (
                  <span style={{ color: '#ffb4a8' }}>
                    {activeReferenceResearchTarget.researchJobError}
                  </span>
                )}

                <div style={{ marginTop: '12px' }}>
                  <strong>Missing fields:</strong>

                  <ul>
                    {(
                      activeReferenceResearchTarget.researchJob
                        ?.missingFields ||
                      activeReferenceResearchTarget.researchNeeds
                        ?.missingFields ||
                      []
                    ).map((field) => (
                      <li key={field.key}>
                        <b>{field.label}</b> — {field.reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {activeReferenceResearchTarget.researchJob?.result && (
                  <div style={{ marginTop: '12px' }}>
                    <strong>AI Research Result</strong>

                    <p style={{ marginTop: '8px' }}>
                      {activeReferenceResearchTarget.researchJob.result
                        .summary || 'Research completed.'}
                    </p>

{activeReferenceResearchTarget.researchJob.result.confirmedFields && (

  <div style={{ marginTop: '12px' }}>

    <strong>Confirmed fields to apply:</strong>

    <div style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>

      {getUsableResearchFields(

        activeReferenceResearchTarget.researchJob.result

      ).map((field) => (

        <label

          key={field.key}

          style={{

            display: 'grid',

            gridTemplateColumns: 'auto 1fr',

            gap: '10px',

            alignItems: 'start',

            padding: '10px',

            border: '1px solid rgba(255,255,255,0.12)',

            background: 'rgba(255,255,255,0.04)',

            opacity: field.usable ? 1 : 0.5,

          }}

        >

          <input

            type="checkbox"

            checked={selectedResearchApplyFields.includes(field.key)}

            disabled={!field.usable || isApplyingResearchResult}

            onChange={() => toggleResearchApplyField(field.key)}

          />

          <span>

            <b>{getResearchFieldLabel(field.key)}</b>: {String(field.value)}

            {' · '}Confidence: {field.confidence || 'Unknown'}

            {field.sourceUrl ? (

              <>

                {' · '}

                <a href={field.sourceUrl} target="_blank" rel="noreferrer">

                  Source

                </a>

              </>

            ) : null}

            {field.notes ? <> — {field.notes}</> : null}

          </span>

        </label>

      ))}

    </div>

    <button

      type="button"

      className="legacyprint-admin-button primary"

      style={{ marginTop: '12px' }}

      disabled={

        isApplyingResearchResult || selectedResearchApplyFields.length === 0

      }

      onClick={handleApplyResearchResult}

    >

      {isApplyingResearchResult

        ? 'Applying...'

        : `Apply ${selectedResearchApplyFields.length} Field${

            selectedResearchApplyFields.length === 1 ? '' : 's'

          }`}

    </button>

    {researchApplyMessage && (

      <p style={{ marginTop: '10px' }}>{researchApplyMessage}</p>

    )}

  </div>

)}

                    {Array.isArray(
                      activeReferenceResearchTarget.researchJob.result.warnings
                    ) &&
                      activeReferenceResearchTarget.researchJob.result.warnings
                        .length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <strong>Warnings:</strong>

                          <ul>
                            {activeReferenceResearchTarget.researchJob.result.warnings.map(
                              (warning, index) => (
                                <li key={`${warning}-${index}`}>{warning}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
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
