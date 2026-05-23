// src/legacyPrint/ui/VoicePlayground.js

import React, { useMemo, useState } from 'react';

import {

  Zap,

  SunMedium,

  Volume2,

  Waves,

  Flame,

  Feather,

  Crosshair,

  SlidersHorizontal,

  BookOpen,

  ChevronDown,

  RotateCcw,

  CheckCircle2,

} from 'lucide-react';

import { useVoicePlayground } from './useVoicePlayground.js';

import { buildSnareVoicePacket } from '../engine/snare';

import { VoiceMorphPanel } from './VoiceMorphPanel.js';

import { morphVoice } from '../morph/morphVoice.js';

import VoiceConstellationMap from './VoiceConstellationMap.js';
import PlayerAnalysisDeepDive from './PlayerAnalysisDeepDive.js';

import './VoicePlayground.css';

const WORKFLOW_MODES = [

  {

    key: 'reference',

    label: 'Reference',

    eyebrow: 'Compare known drums',

    title: 'Reference Match',

    description: 'Choose a known drum as the acoustic anchor for the read.',

  },

  {

    key: 'shape',

    label: 'Shape',

    eyebrow: 'Sculpt by ear',

    title: 'Shape Your Voice',

    description: 'Adjust the voice characteristics to find matching drums.',

    hidden: true,

  },

  {

    key: 'build',

    label: 'Build',

    eyebrow: 'Choose physical traits',

    title: 'Build Your Voice',

    description: 'Start with physical build choices and let the voice field respond.',

  },

];

const READ_MODES = [

  {

    key: 'firstListen',

    label: 'First Listen',

    kicker: 'First Listen',

    shortPurpose: 'What the ear catches first',

    description:

      'The fastest audible impression: the traits a drummer is most likely to notice first when the drum speaks.',

  },

  {

    key: 'playerAnalysis',

    label: 'Player Analysis',

    kicker: 'Seven-Node Read',

    shortPurpose: 'How it behaves under the stick',

    description:

      'A practical seven-node read of how the drum behaves under the stick across attack, brightness, projection, sustain, warmth, sensitivity, and control.',

  },

  {

    key: 'legacyprint',

    label: 'LegacyPrint Identity',

    kicker: 'Identity',

    shortPurpose: 'The full acoustic fingerprint',

    description:

      'The one-of-one voice fingerprint: how this drum’s traits combine into a recognizable acoustic identity.',

    hidden: true,

  },

];

const VOICE_NODES = [

  {

    key: 'attack',

    label: 'Attack',

    shortLabel: 'Strike',

    Icon: Zap,

    color: '#ff7448',

    description: 'Initial stick contact, immediacy, and front-edge definition.',

    firstListenCopy: 'Quick stick definition and a clear front edge.',

    playerCopy: 'Immediate under the stick with clear rebound and front-edge response.',

  },

  {

    key: 'brightness',

    label: 'Brightness',

    shortLabel: 'Clarity',

    Icon: SunMedium,

    color: '#e7d98f',

    description: 'Upper harmonic clarity, shimmer, and perceived crispness.',

    firstListenCopy: 'Crisp upper detail that shows up early in the hit.',

    playerCopy: 'Adds top-end articulation, snap, and mix-ready definition.',

  },

  {

    key: 'projection',

    label: 'Projection',

    shortLabel: 'Carry',

    Icon: Volume2,

    color: '#ffb53a',

    description: 'How strongly the voice carries through the room or mix.',

    firstListenCopy: 'The voice steps forward quickly and feels easy to place.',

    playerCopy: 'Carries through the room or track without needing extra force.',

  },

  {

    key: 'sustain',

    label: 'Sustain',

    shortLabel: 'Bloom',

    Icon: Waves,

    color: '#4d86ff',

    description: 'How long the note blooms after the initial strike.',

    firstListenCopy: 'A continuing note bloom after the initial attack.',

    playerCopy: 'Gives the drum length, movement, and a more open resonant feel.',

  },

  {

    key: 'warmth',

    label: 'Warmth',

    shortLabel: 'Body',

    Icon: Flame,

    color: '#c1682e',

    description: 'Low-mid body, roundness, and perceived fullness.',

    firstListenCopy: 'Rounder low-mid body supporting the first impression.',

    playerCopy: 'Adds body, low-mid support, and a fuller feel under the hands.',

  },

  {

    key: 'sensitivity',

    label: 'Sensitivity',

    shortLabel: 'Touch',

    Icon: Feather,

    color: '#68d9df',

    description: 'Response to light touch, ghost notes, and dynamic nuance.',

    firstListenCopy: 'Small details and light strokes speak quickly.',

    playerCopy: 'Responds to ghost notes, soft strokes, and subtle dynamics.',

  },

  {

    key: 'control',

    label: 'Control',

    shortLabel: 'Focus',

    Icon: Crosshair,

    color: '#9e8bff',

    description: 'Focus, containment, dryness, and ease of placement.',

    firstListenCopy: 'A focused note shape with less spread.',

    playerCopy: 'Keeps the voice focused, dry enough to place, and easy to manage.',

  },

];

const BUILD_OPTIONS = [

  {

    key: 'shellConstruction',

    label: 'Shell Construction',

    value: 'Stave',

    note: 'Direct, open, fast transfer',

  },

  {

    key: 'shellMaterial',

    label: 'Shell Material',

    value: 'Maple',

    note: 'Balanced body and articulation',

  },

  {

    key: 'shellThickness',

    label: 'Shell Thickness',

    value: 'Medium',

    note: 'Normalized thickness range',

  },

  {

    key: 'size',

    label: 'Size',

    value: '14 × 6.5',

    note: 'Balanced depth and response',

  },

  {

    key: 'bearingEdge',

    label: 'Bearing Edge',

    value: '45° / Roundover',

    note: 'Attack with softened warmth',

  },

  {

    key: 'hoops',

    label: 'Hoops',

    value: 'Die Cast',

    note: 'Focused control and punch',

  },

];

const DEFAULT_REFERENCE_MODIFIERS = {

  batterHead: 'coated-1ply',

  resoHead: 'clear-snare-side',

  hoopType: 'verified-or-default',

  snareWires: 'balanced-20',

  wireTension: 'medium',

  dampening: 'none',

};

const MODIFIER_OPTIONS = {

  batterHead: [

    {

      value: 'coated-1ply',

      label: 'Coated 1-ply',

      note: 'Default open reference setup',

      impact: 'Open attack, balanced warmth',

    },

    {

      value: 'clear-1ply',

      label: 'Clear 1-ply',

      note: 'More attack and upper clarity',

      impact: 'Brighter, faster, more open',

    },

    {

      value: 'coated-2ply',

      label: 'Coated 2-ply',

      note: 'Controlled studio-style response',

      impact: 'More focus, less ring',

    },

    {

      value: 'controlled-dot',

      label: 'Controlled / Center Dot',

      note: 'Extra attack with focused overtones',

      impact: 'Punchier, tighter, more durable',

    },

    {

      value: 'dry-vented',

      label: 'Dry / Vented',

      note: 'Reduced sustain and overtone spread',

      impact: 'Drier, shorter, more controlled',

    },

  ],

  resoHead: [

    {

      value: 'clear-snare-side',

      label: 'Clear Snare Side',

      note: 'Default open reference setup',

      impact: 'Responsive wire detail',

    },

    {

      value: 'thin-snare-side',

      label: 'Thin Snare Side',

      note: 'Higher sensitivity response',

      impact: 'More wire detail and touch',

    },

    {

      value: 'medium-snare-side',

      label: 'Medium Snare Side',

      note: 'Balanced stock-style response',

      impact: 'Stable wire response',

    },

    {

      value: 'heavy-snare-side',

      label: 'Heavy Snare Side',

      note: 'More controlled bottom response',

      impact: 'Less buzz, firmer response',

    },

  ],

  hoopType: [

    {

      value: 'verified-or-default',

      label: 'Verified Stock / Default',

      note: 'Use verified hoop data when available',

      impact: 'Preserves the reference baseline',

    },

    {

      value: 'triple-flanged',

      label: 'Triple-Flanged',

      note: 'Open, familiar, flexible response',

      impact: 'More bloom and openness',

    },

    {

      value: 'die-cast',

      label: 'Die Cast',

      note: 'More mass and rigidity',

      impact: 'More attack and control',

    },

    {

      value: 'wood-hoop',

      label: 'Wood Hoop',

      note: 'Warmer rim feel and softer edge',

      impact: 'More body, less metallic edge',

    },

    {

      value: 'single-flanged',

      label: 'Single-Flanged',

      note: 'Vintage-leaning openness',

      impact: 'Airier, lighter rim behavior',

    },

  ],

  snareWires: [

    {

      value: 'balanced-20',

      label: '20-Strand Balanced',

      note: 'Default reference assumption',

      impact: 'Balanced snap and response',

    },

    {

      value: 'light-16',

      label: '16-Strand Light',

      note: 'Less wire mass',

      impact: 'More shell tone, less buzz',

    },

    {

      value: 'wide-24',

      label: '24-Strand Wide',

      note: 'More wire presence',

      impact: 'More snap and sensitivity',

    },

    {

      value: 'dense-30',

      label: '30-Strand Dense',

      note: 'Strong wire bed coverage',

      impact: 'More wire voice and control',

    },

    {

      value: 'wide-42',

      label: '42-Strand Wide',

      note: 'Maximum wire presence',

      impact: 'Very snare-forward response',

    },

  ],

  wireTension: [

    {

      value: 'loose',

      label: 'Loose',

      note: 'More rattle and spread',

      impact: 'Wider, wetter response',

    },

    {

      value: 'medium',

      label: 'Medium',

      note: 'Default reference assumption',

      impact: 'Open but controlled',

    },

    {

      value: 'tight',

      label: 'Tight',

      note: 'Shorter and more contained',

      impact: 'Crisper, drier response',

    },

  ],

  dampening: [

    {

      value: 'none',

      label: 'None',

      note: 'Default open comparison baseline',

      impact: 'Maximum open resonance',

    },

    {

      value: 'one-gel',

      label: '1 Gel',

      note: 'Light overtone control',

      impact: 'Slightly shorter and cleaner',

    },

    {

      value: 'two-gels',

      label: '2 Gels',

      note: 'Moderate overtone control',

      impact: 'Drier, more contained',

    },

    {

      value: 'ring',

      label: 'Dampening Ring',

      note: 'Strong edge overtone reduction',

      impact: 'Short, focused, familiar control',

    },

    {

      value: 'wallet',

      label: 'Wallet / Cloth',

      note: 'Heavy muffled backbeat behavior',

      impact: 'Fat, short, dry response',

    },

    {

      value: 'tape',

      label: 'Tape',

      note: 'Localized overtone control',

      impact: 'Subtle to moderate control',

    },

  ],

};

const MODIFIER_GROUPS = [

  {

    key: 'heads',

    impact: 'Very high impact',

    title: 'Heads',

    description:

      'Batter and resonant head choices strongly shape attack, brightness, sustain, control, and touch response.',

    controls: ['batterHead', 'resoHead'],

  },

  {

    key: 'hoops',

    impact: 'High impact',

    title: 'Hoop / Rim',

    description: 'Hoop mass and rigidity affect focus, rimshot attack, openness, and sustain.',

    controls: ['hoopType'],

  },

  {

    key: 'wires',

    impact: 'High impact',

    title: 'Snare Wires',

    description: 'Wire count and tension shape sensitivity, articulation, buzz, and dryness.',

    controls: ['snareWires', 'wireTension'],

  },

  {

    key: 'dampening',

    impact: 'Setup impact',

    title: 'Dampening',

    description:

      'Rings, gels, tape, wallets, and other muffling are treated as setup modifiers after the core voice is formed.',

    controls: ['dampening'],

  },

];

const REFERENCE_OPTIONS = [

  {

    key: 'ludwig-acrolite',

    snareReferenceId:

      'ludwig_acrolite_acrolite-5x14_14x5_metal_aluminum_brushed-aluminum_triple-flanged-steel_lm404_f8e66e46',

    label: 'Ludwig Acrolite',

    detail: '14x5 Aluminum Reference',

    companyName: 'Ludwig',

    lineSeries: 'Acrolite',

    modelName: 'Acrolite',

    shellMaterial: 'Aluminum',

    shellConstruction: 'Metal',

    diameter: '14',

    depth: '5',

    voice: {

      attack: 0.72,

      brightness: 0.66,

      projection: 0.84,

      sustain: 0.58,

      warmth: 0.74,

      sensitivity: 0.7,

      control: 0.72,

    },

  },

  {

    key: 'ludwig-black-beauty',

    snareReferenceId:

      'ludwig_1977-ludwig_black-beauty-5x14_14x5_metal_brass_1-2_black-nickel-over-brass_triple-flanged_lb416-era_19292b4b',

    label: 'Ludwig Black Beauty',

    detail: '14x5 Brass Reference',

    companyName: 'Ludwig',

    lineSeries: 'Black Beauty',

    modelName: 'Black Beauty',

    shellMaterial: 'Brass',

    shellConstruction: 'Metal',

    diameter: '14',

    depth: '5',

    voice: {

      attack: 0.78,

      brightness: 0.82,

      projection: 0.86,

      sustain: 0.62,

      warmth: 0.55,

      sensitivity: 0.74,

      control: 0.6,

    },

  },

  {

    key: 'dw-true-cast-bronze',

    snareReferenceId:

      'dw-pdp_dw-mfg-true-cast_mfg-true-cast-bell-bronze-14x4_14x4_metal_bronze_35_machined-bronze_true-cast-hoops_8a293c51',

    label: 'DW True-Cast Bronze',

    detail: '14x4 Bell Bronze Reference',

    companyName: 'DW / PDP',

    lineSeries: 'DW MFG',

    modelName: 'True-Cast Bell Bronze',

    shellMaterial: 'Bronze',

    shellConstruction: 'Cast Metal',

    diameter: '14',

    depth: '4',

    voice: {

      attack: 0.76,

      brightness: 0.72,

      projection: 0.78,

      sustain: 0.54,

      warmth: 0.5,

      sensitivity: 0.66,

      control: 0.68,

    },

  },

];

const MOCK_MATCHES = [

  {

    id: 'mock-1',

    companyName: 'Tama',

    modelName: 'S.L.P. Classic Dry Aluminum LAL1455',

    modelDetail: '14x5.5 Aluminum',

    explanation: 'Shares a dry, clear, controlled aluminum voice with quick attack.',

    voiceProfile: {

      attack: 0.74,

      brightness: 0.68,

      projection: 0.82,

      sustain: 0.54,

      warmth: 0.58,

      sensitivity: 0.69,

      control: 0.8,

    },

  },

  {

    id: 'mock-2',

    companyName: 'Ludwig',

    modelName: 'Supraphonic LM400',

    modelDetail: '14x5 Aluminum',

    explanation: 'Classic aluminum reference with crisp attack and familiar studio control.',

    voiceProfile: {

      attack: 0.73,

      brightness: 0.67,

      projection: 0.8,

      sustain: 0.56,

      warmth: 0.6,

      sensitivity: 0.7,

      control: 0.78,

    },

  },

  {

    id: 'mock-3',

    companyName: 'Pearl',

    modelName: 'Sensitone Heritage Aluminum Alloy',

    modelDetail: '14x5 Aluminum',

    explanation: 'Comparable shell family with balanced snap, focus, and usable body.',

    voiceProfile: {

      attack: 0.7,

      brightness: 0.65,

      projection: 0.78,

      sustain: 0.57,

      warmth: 0.62,

      sensitivity: 0.68,

      control: 0.76,

    },

  },

  {

    id: 'mock-4',

    companyName: 'Canopus',

    modelName: 'Aluminum Alloy',

    modelDetail: '14x6 Aluminum',

    explanation: 'Similar metal-shell clarity with a touch more depth and bloom.',

    voiceProfile: {

      attack: 0.69,

      brightness: 0.66,

      projection: 0.76,

      sustain: 0.62,

      warmth: 0.64,

      sensitivity: 0.67,

      control: 0.72,

    },

  },

  {

    id: 'mock-5',

    companyName: 'Ludwig',

    modelName: 'Acrolite',

    modelDetail: '14x5 Aluminum',

    explanation: 'A familiar open aluminum sound with approachable control and tone.',

    voiceProfile: {

      attack: 0.72,

      brightness: 0.66,

      projection: 0.84,

      sustain: 0.58,

      warmth: 0.74,

      sensitivity: 0.7,

      control: 0.72,

    },

  },

  {

    id: 'mock-6',

    companyName: 'Yamaha',

    modelName: 'Recording Custom Aluminum',

    modelDetail: '14x5.5 Aluminum',

    explanation: 'Useful alternative when clarity and articulation matter more than warmth.',

    voiceProfile: {

      attack: 0.76,

      brightness: 0.72,

      projection: 0.76,

      sustain: 0.5,

      warmth: 0.5,

      sensitivity: 0.72,

      control: 0.76,

    },

  },

  {

    id: 'mock-7',

    companyName: 'Gretsch',

    modelName: 'Full Range Aluminum',

    modelDetail: '14x6.5 Aluminum',

    explanation: 'Related shell voice, but deeper and slightly broader in response.',

    voiceProfile: {

      attack: 0.66,

      brightness: 0.63,

      projection: 0.72,

      sustain: 0.66,

      warmth: 0.68,

      sensitivity: 0.64,

      control: 0.66,

    },

  },

  {

    id: 'mock-8',

    companyName: 'DW',

    modelName: 'Design Series Aluminum',

    modelDetail: '14x5.5 Aluminum',

    explanation: 'Modern aluminum response with useful projection but less exact match.',

    voiceProfile: {

      attack: 0.68,

      brightness: 0.64,

      projection: 0.72,

      sustain: 0.6,

      warmth: 0.58,

      sensitivity: 0.62,

      control: 0.64,

    },

  },

  {

    id: 'mock-9',

    companyName: 'Mapex',

    modelName: 'Black Panther Aluminum',

    modelDetail: '14x6 Aluminum',

    explanation: 'Shares some attack behavior, but the overall voice target is broader.',

    voiceProfile: {

      attack: 0.63,

      brightness: 0.58,

      projection: 0.68,

      sustain: 0.68,

      warmth: 0.7,

      sensitivity: 0.6,

      control: 0.6,

    },

  },

  {

    id: 'mock-10',

    companyName: 'Pork Pie',

    modelName: 'Patina Aluminum',

    modelDetail: '14x6.5 Aluminum',

    explanation: 'A creative flavor match, but less aligned to the selected voice profile.',

    voiceProfile: {

      attack: 0.58,

      brightness: 0.55,

      projection: 0.64,

      sustain: 0.72,

      warmth: 0.74,

      sensitivity: 0.56,

      control: 0.58,

    },

  },

];

const MOCK_BUILDER_MATCHES = [

  {

    id: 'builder-1',

    builderName: 'Northstar Custom Drums',

    builderType: 'Independent Custom Builder',

    fitReason: 'Strong fit for focused custom wood-shell builds with premium hardware choices.',

    location: 'Nashville, TN',

    shopLabel: 'Request Build Quote',

  },

  {

    id: 'builder-2',

    builderName: 'Pearl Masterworks',

    builderType: 'Manufacturer Custom Program',

    fitReason:

      'Best fit when the player wants broad shell, finish, size, and hardware flexibility.',

    location: 'Global Dealer Network',

    shopLabel: 'Find Masterworks Dealer',

  },

  {

    id: 'builder-3',

    builderName: 'SJC Custom Drums',

    builderType: 'Custom Manufacturer',

    fitReason:

      'Good match for players prioritizing custom finish, identity, and modern build options.',

    location: 'Southbridge, MA',

    shopLabel: 'Start Custom Build',

  },

  {

    id: 'builder-4',

    builderName: 'Crescent Shellworks',

    builderType: 'Independent Shell Builder',

    fitReason: 'Strong match for open, warm, highly resonant shell-first builds.',

    location: 'Asheville, NC',

    shopLabel: 'Contact Builder',

  },

];

const TEST_MATCH_PERCENTS = [99, 96, 93, 91, 82, 74, 66, 58, 49, 37];

const TEST_BUILDER_MATCH_PERCENTS = [98, 95, 92, 90, 84, 76, 68, 57, 48, 39];

const SHOP_LOCAL_SELLERS = [

  'Cymbal & Shell Co.',

  'Nashville Drum Exchange',

  'The Snare Room',

  'Backline Drum Supply',

];

const CATALOG_SORT_OPTIONS = [

  { key: 'company', label: 'Company / Maker' },

  { key: 'material', label: 'Shell Material' },

  { key: 'construction', label: 'Shell Construction' },

  { key: 'thickness', label: 'Shell Thickness' },

  { key: 'alpha', label: 'Model A–Z' },

];

const clamp01 = (value, fallback = 0.5) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.max(0, Math.min(1, number));

};

const getVoiceScore = (voice, key, fallback = 5) => {

  const number = Number(voice?.[key]);

  if (!Number.isFinite(number)) return fallback;

  return number > 1 ? Math.max(0, Math.min(10, number)) : clamp01(number, 0.5) * 10;

};

const getVoiceValue = (voice, key) => {

  const score = getVoiceScore(voice, key, 5);

  return clamp01(score / 10, 0.5);

};

const getResultVoice = (result) =>

  result?.voice || result?.legacyPrintVoice || result?.voiceProfile || {};

const getResultId = (result, index) =>

  result?.drumId || result?.id || `${result?.companyName || 'voice'}-${index}`;

const scoreVoiceSimilarity = (sourceVoice = {}, targetVoice = {}) => {

  const totalDifference = VOICE_NODES.reduce((sum, node) => {

    return (

      sum + Math.abs(getVoiceValue(sourceVoice, node.key) - getVoiceValue(targetVoice, node.key))

    );

  }, 0);

  return clamp01(1 - totalDifference / VOICE_NODES.length);

};

const getBuilderMatchPercent = (index = 0) => TEST_BUILDER_MATCH_PERCENTS[index] ?? 50;

const getMockSeller = (index = 0) => SHOP_LOCAL_SELLERS[index % SHOP_LOCAL_SELLERS.length];

const getMatchToneClass = (percent) => {

  if (percent >= 97) return 'vp-match-score--elite';

  if (percent >= 94) return 'vp-match-score--strong';

  if (percent >= 90) return 'vp-match-score--good';

  if (percent >= 60) return 'vp-match-score--medium';

  return 'vp-match-score--low';

};

const getMatchPercent = (result) =>

  Math.round(clamp01(result?.similarityScore ?? result?.matchScore ?? 0.5) * 100);

const normalizeDiscoveryScore = (value) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return 0.5;

  return number > 1 ? number / 100 : number;

};

const discoveryMatchToResult = (match, section) => ({

  id: match.id,

  drumId: match.id,

  companyName: match.company,

  company: match.company,

  modelName: match.model,

  model: match.model,

  modelDetail: match.size,

  size: match.size,

  voice: match.raw?.voiceProfile || {},

  legacyPrintVoice: match.raw?.voiceProfile || {},

  similarityScore: normalizeDiscoveryScore(match.similarity),

  matchScore: normalizeDiscoveryScore(match.similarity),

  summary: match.summary?.text || match.summary?.title || match.why || section?.description || '',

  explanation: match.why || section?.description || '',

  discoverySectionKey: section?.key || null,

  discoverySectionLabel: section?.label || null,

  discoveryMatch: match,

});

const buildModeVoice = (baseVoice, mode, selectedReference) => {

  const sourceVoice = selectedReference?.voice || baseVoice || {};

  if (mode === 'reference') return sourceVoice;

  if (mode === 'build') {

    return {

      attack: clamp01(getVoiceValue(baseVoice, 'attack') + 0.05),

      brightness: clamp01(getVoiceValue(baseVoice, 'brightness') - 0.02),

      projection: clamp01(getVoiceValue(baseVoice, 'projection') + 0.08),

      sustain: clamp01(getVoiceValue(baseVoice, 'sustain') + 0.04),

      warmth: clamp01(getVoiceValue(baseVoice, 'warmth') + 0.08),

      sensitivity: clamp01(getVoiceValue(baseVoice, 'sensitivity') + 0.03),

      control: clamp01(getVoiceValue(baseVoice, 'control') + 0.06),

    };

  }

  return sourceVoice || {};

};

const getTopNodes = (voice, count = 3) =>

  [...VOICE_NODES]

    .map((node) => ({

      ...node,

      value: getVoiceScore(voice, node.key, 5),

    }))

    .sort((a, b) => b.value - a.value)

    .slice(0, count);

const normalizeEngineVoiceScoreForMap = (value) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return 5;

  return number > 1 ? Math.max(0, Math.min(10, number)) : clamp01(number, 0.5) * 10;

};

const normalizeEngineVoiceProfileForMap = (profile) => {

  return VOICE_NODES.reduce((acc, node) => {

    acc[node.key] = normalizeEngineVoiceScoreForMap(profile?.[node.key]);

    return acc;

  }, {});

};

const getReferenceRawRecord = (reference) => {

  return reference?.rawRecord || reference?.raw || reference?.record || reference || null;

};

const buildReferenceEnginePacket = (reference) => {

  const rawRecord = getReferenceRawRecord(reference);

  if (!rawRecord) return null;

  try {

    return buildSnareVoicePacket(rawRecord, {

      includeRawRecord: true,

      includeBaseScore: true,

      mode: 'voicePlaygroundReference',

    });

  } catch (error) {

    console.warn('Unable to build LegacyPrint snare voice packet for reference.', error);

    return null;

  }

};

const getReadoutNodeKeys = (readout) => {

  return (readout?.nodes || []).map((item) => item.node || item.key).filter(Boolean);

};

const getReferenceRaw = (item) => item?.rawRecord || item?.raw || item?.record || item || {};

const getReferenceField = (item, keys) => {

  const raw = getReferenceRaw(item);

  for (const key of keys) {

    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== '') return item[key];

    if (raw?.[key] !== undefined && raw?.[key] !== null && raw?.[key] !== '') return raw[key];

  }

  return '';

};

const getReferenceSize = (item) => {

  const raw = getReferenceRaw(item);

  const direct =

    item?.size || item?.drumSize || raw?.size || raw?.drumSize || raw?.SIZE || raw?.['SIZE'];

  if (direct) return direct;

  const diameter = item?.diameter ?? raw?.diameter ?? raw?.DIAMETER ?? raw?.['DIAMETER'];

  const depth = item?.depth ?? raw?.depth ?? raw?.DEPTH ?? raw?.['DEPTH'];

  return diameter && depth ? `${diameter}x${depth}` : '';

};

const normalizeReferenceMatchValue = (value) =>

  String(value || '')

    .toLowerCase()

    .replace(/[·•]/g, ' ')

    .replace(/["'’‘“”]/g, '')

    .replace(/[^a-z0-9.]+/g, ' ')

    .replace(/\b14 x 8\b/g, '14x8')

    .replace(/\b14 x 6.5\b/g, '14x6.5')

    .replace(/\b14 x 6\b/g, '14x6')

    .replace(/\b14 x 5.5\b/g, '14x5.5')

    .replace(/\b14 x 5\b/g, '14x5')

    .replace(/\b13 x 7\b/g, '13x7')

    .replace(/\b13 x 6.5\b/g, '13x6.5')

    .replace(/\b13 x 6\b/g, '13x6')

    .replace(/\s+/g, ' ')

    .trim();

const getReferenceMatchValues = (item) => {

  const raw = getReferenceRaw(item);

  const company = getReferenceField(item, [

    'companyName',

    'company',

    'COMPANY_NAME',

    'COMPANY NAME',

  ]);

  const line = getReferenceField(item, [

    'lineSeries',

    'line',

    'series',

    'LINE_SERIES',

    'LINE/SERIES',

    'LINE / SERIES',

  ]);

  const model = getReferenceField(item, ['modelName', 'model', 'MODEL_NAME', 'MODEL NAME']);

  const material = getReferenceField(item, [

    'shellMaterial',

    'shellMaterial1',

    'material',

    'SHELL_MATERIAL_1',

    'SHELL MATERIAL 1',

    'SHELL MATERIAL',

  ]);

  const construction = getReferenceField(item, [

    'shellConstruction',

    'construction',

    'SHELL_CONSTRUCTION',

    'SHELL CONSTRUCTION',

  ]);

  const size = getReferenceSize(item);

  return [

    item?.key,

    item?.id,

    item?.value,

    item?.snareReferenceId,

    item?.referenceId,

    item?.label,

    item?.displayLabel,

    item?.optionLabel,

    raw?.id,

    raw?.key,

    raw?.value,

    raw?.snareReferenceId,

    raw?.referenceId,

    raw?.label,

    raw?.displayLabel,

    raw?.optionLabel,

    raw?.firestoreId,

    company,

    line,

    model,

    material,

    construction,

    size,

    [company, line, model, size].filter(Boolean).join(' '),

    [model, material, size].filter(Boolean).join(' '),

    [model, construction, material, size].filter(Boolean).join(' '),

    [company, model, material, size].filter(Boolean).join(' '),

    [company, line, model, material, size].filter(Boolean).join(' '),

  ].filter(Boolean);

};

const getReferenceTokenScore = (selectedValue, item) => {

  const selected = normalizeReferenceMatchValue(selectedValue);

  if (!selected) return 0;

  const selectedTokens = Array.from(new Set(selected.split(' ').filter(Boolean)));

  return getReferenceMatchValues(item).reduce((bestScore, value) => {

    const candidate = normalizeReferenceMatchValue(value);

    if (!candidate) return bestScore;

    if (candidate === selected) return Math.max(bestScore, 10000);

    if (candidate.includes(selected)) return Math.max(bestScore, 9000);

    if (selected.includes(candidate) && candidate.length > 6) return Math.max(bestScore, 8000);

    const candidateTokens = new Set(candidate.split(' ').filter(Boolean));

    const matchedTokens = selectedTokens.filter((token) => candidateTokens.has(token));

    const hasSizeToken = selectedTokens.some((token) => /\d+x\d/.test(token));

    const sizeMatched =

      !hasSizeToken ||

      selectedTokens.some((token) => /\d+x\d/.test(token) && candidateTokens.has(token));

    if (!sizeMatched) return bestScore;

    const score =

      matchedTokens.length * 100 +

      (candidateTokens.has(selectedTokens[0]) ? 25 : 0) -

      Math.abs(candidateTokens.size - selectedTokens.length);

    return Math.max(bestScore, score);

  }, 0);

};

const normalizeBrandValue = (value) => {

  const text = String(value || '').trim();

  const lower = text.toLowerCase();

  if (lower === 'dw' || lower === 'pdp' || lower === 'dw / pdp' || lower === 'dw/pdp') {

    return 'DW / PDP';

  }

  return text;

};

const normalizeSelectValue = (value) => String(value || '').trim();

const getReferenceOptionId = (reference) => {

  if (!reference) return '';

  return (

    reference.snareReferenceId ||

    reference.id ||

    reference.key ||

    reference.value ||

    reference.label ||

    ''

  );

};

const getReferenceIdentity = (reference) => {

  const company = getReferenceField(reference, [

    'companyName',

    'company',

    'brand',

    'manufacturer',

    'COMPANY_NAME',

    'COMPANY NAME',

  ]);

  const line = getReferenceField(reference, [

    'lineSeries',

    'line',

    'series',

    'LINE_SERIES',

    'LINE/SERIES',

    'LINE / SERIES',

  ]);

  const model = getReferenceField(reference, ['modelName', 'model', 'MODEL_NAME', 'MODEL NAME']);

  const material = getReferenceField(reference, [

    'shellMaterial',

    'shellMaterial1',

    'material',

    'SHELL_MATERIAL_1',

    'SHELL MATERIAL 1',

    'SHELL MATERIAL',

  ]);

  const construction = getReferenceField(reference, [

    'shellConstruction',

    'construction',

    'SHELL_CONSTRUCTION',

    'SHELL CONSTRUCTION',

  ]);

  const size = getReferenceSize(reference);

  return {

    company: normalizeBrandValue(company || reference?.companyName || reference?.company || ''),

    line: normalizeSelectValue(line),

    model: normalizeSelectValue(

      model || reference?.modelName || reference?.label || 'Selected Reference'

    ),

    material: normalizeSelectValue(material || 'Material pending'),

    construction: normalizeSelectValue(construction || 'Construction pending'),

    size: normalizeSelectValue(size || 'Size pending'),

  };

};

const getReferenceDiameter = (reference) => {

  const raw = getReferenceRaw(reference);

  const value = reference?.diameter ?? raw?.diameter ?? raw?.DIAMETER ?? raw?.['DIAMETER'];

  return Number(String(value || '').replace(/[^\d.]/g, ''));

};

const getReferenceDepth = (reference) => {

  const raw = getReferenceRaw(reference);

  const value = reference?.depth ?? raw?.depth ?? raw?.DEPTH ?? raw?.['DEPTH'];

  return Number(String(value || '').replace(/[^\d.]/g, ''));

};

const getReferenceThicknessMm = (reference) => {

  const raw = getReferenceRaw(reference);

  const value =

    reference?.shellThicknessMm ??

    reference?.shellThickness ??

    raw?.shellThicknessMm ??

    raw?.shellThickness ??

    raw?.['SHELL THICKNESS (mm)'] ??

    raw?.SHELL_THICKNESS_MM;

  const number = Number(String(value || '').replace(/[^\d.]/g, ''));

  return Number.isFinite(number) ? number : null;

};

const getReferenceThicknessCategory = (reference) => {

  const thickness = getReferenceThicknessMm(reference);

  if (!Number.isFinite(thickness)) return 'Thickness unknown';

  if (thickness < 4.5) return 'Extra thin shells';

  if (thickness < 6.5) return 'Thin shells';

  if (thickness < 8.5) return 'Medium shells';

  if (thickness < 12) return 'Thick shells';

  return 'Extra thick shells';

};

const hasVerifiedStockSetupData = (reference) => {

  const raw = getReferenceRaw(reference);

  return Boolean(

    reference?.stockSetupVerified ||

      reference?.verifiedStockSetup ||

      reference?.engineAssumptions?.stockSetupVerified ||

      raw?.stockSetupVerified ||

      raw?.verifiedStockSetup ||

      raw?.engineAssumptions?.stockSetupVerified

  );

};

const getReferenceSortGroup = (reference, sortMode) => {

  const identity = getReferenceIdentity(reference);

  if (sortMode === 'alpha') return (identity.model.charAt(0) || '#').toUpperCase();

  if (sortMode === 'material') return identity.material || 'Material unknown';

  if (sortMode === 'construction') return identity.construction || 'Construction unknown';

  if (sortMode === 'thickness') return getReferenceThicknessCategory(reference);

  return identity.company || 'Unknown company';

};

const sortReferenceCatalog = (items = [], sortMode = 'company') => {

  return [...items].sort((a, b) => {

    const aIdentity = getReferenceIdentity(a);

    const bIdentity = getReferenceIdentity(b);

    const groupCompare = getReferenceSortGroup(a, sortMode).localeCompare(

      getReferenceSortGroup(b, sortMode)

    );

    if (groupCompare !== 0) return groupCompare;

    const companyCompare = aIdentity.company.localeCompare(bIdentity.company);

    if (companyCompare !== 0) return companyCompare;

    const lineCompare = aIdentity.line.localeCompare(bIdentity.line);

    if (lineCompare !== 0) return lineCompare;

    const modelCompare = aIdentity.model.localeCompare(bIdentity.model);

    if (modelCompare !== 0) return modelCompare;

    const aDiameter = getReferenceDiameter(a);

    const bDiameter = getReferenceDiameter(b);

    if (Number.isFinite(aDiameter) && Number.isFinite(bDiameter) && aDiameter !== bDiameter) {

      return aDiameter - bDiameter;

    }

    const aDepth = getReferenceDepth(a);

    const bDepth = getReferenceDepth(b);

    if (Number.isFinite(aDepth) && Number.isFinite(bDepth) && aDepth !== bDepth) {

      return aDepth - bDepth;

    }

    return aIdentity.material.localeCompare(bIdentity.material);

  });

};

const groupReferenceCatalog = (items = [], sortMode = 'company') => {

  const groups = new Map();

  sortReferenceCatalog(items, sortMode).forEach((reference) => {

    const groupLabel = getReferenceSortGroup(reference, sortMode) || 'Other';

    if (!groups.has(groupLabel)) {

      groups.set(groupLabel, []);

    }

    groups.get(groupLabel).push(reference);

  });

  return Array.from(groups.entries()).map(([label, references]) => ({

    label,

    references,

  }));

};

const buildReadoutTitle = (readMode, topNodes) => {

  const primary = topNodes[0]?.label || 'Balanced';

  const secondary = topNodes[1]?.label || 'Control';

  const tertiary = topNodes[2]?.label || 'Brightness';

  if (readMode === 'playerAnalysis') {

    return `${primary}-forward response`;

  }

  return `${primary} first`;

};

const getReadoutLede = (readMode, selectedReferenceReadout) => {

  if (selectedReferenceReadout?.purpose) return selectedReferenceReadout.purpose;

  if (selectedReferenceReadout?.explanation) return selectedReferenceReadout.explanation;

  if (readMode === 'playerAnalysis') {

    return 'How this drum is likely to feel under the stick once the full seven-node voice is considered.';

  }

  return 'The first audible impression: the traits most likely to be noticed immediately when the snare speaks.';

};

const areModifierProfilesEqual = (a = {}, b = {}) => {

  return Object.keys(DEFAULT_REFERENCE_MODIFIERS).every((key) => a?.[key] === b?.[key]);

};

const getModifierOption = (key, value) => {

  return (

    MODIFIER_OPTIONS[key]?.find((item) => item.value === value) ||

    MODIFIER_OPTIONS[key]?.[0] ||

    null

  );

};

const getModifierSummary = (referenceModifiers) => {

  return Object.keys(DEFAULT_REFERENCE_MODIFIERS)

    .map((key) => getModifierOption(key, referenceModifiers[key])?.label)

    .filter(Boolean)

    .join(', ');

};

function WorkflowRail({ workflowMode, setWorkflowMode }) {

  const visibleWorkflowModes = WORKFLOW_MODES.filter((item) => !item.hidden);

  return (

    <div className="vp-workflow-rail" aria-label="Voice workflow mode">

      {visibleWorkflowModes.map((item) => (

        <button

          key={item.key}

          type="button"

          className={workflowMode === item.key ? 'is-active' : ''}

          onClick={() => setWorkflowMode(item.key)}

        >

          <span>{item.eyebrow}</span>

          <strong>{item.label}</strong>

        </button>

      ))}

    </div>

  );

}

function ModifierSelect({ modifierKey, value, onChange }) {

  const selectedOption = getModifierOption(modifierKey, value);

  return (

    <label className="vp-modifier-select">

      <span>{selectedOption?.label || 'Select modifier'}</span>

      <select value={value} onChange={(event) => onChange(modifierKey, event.target.value)}>

        {MODIFIER_OPTIONS[modifierKey].map((option) => (

          <option key={option.value} value={option.value}>

            {option.label}

          </option>

        ))}

      </select>

      <em>{selectedOption?.note}</em>

      <small>{selectedOption?.impact}</small>

    </label>

  );

}

function ModifierSections({

  mode = 'build',

  referenceModifiers,

  onModifierChange,

  referenceIsModified,

  clearReferenceModifiers,

}) {

  const [isOpen, setIsOpen] = useState(false);

  return (

    <section className={`vp-modifier-panel ${isOpen ? 'is-open' : ''}`}>

      <button

        type="button"

        className="vp-modifier-toggle"

        onClick={() => setIsOpen((current) => !current)}

        aria-expanded={isOpen}

      >

        <div>

          <span>{mode === 'reference' ? 'Personal Setup' : 'Build Setup'}</span>

          <strong>

            {referenceIsModified

              ? 'Personal modifiers enabled'

              : mode === 'reference'

                ? 'Enable personal modifiers'

                : 'Setup modifiers'}

          </strong>

        </div>

        <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />

      </button>

      {isOpen && (

        <div className="vp-modifier-body">

          <div className="vp-modifier-intro">

            <p>

              Start with the core drum, then personalize the setup with normalized choices for

              heads, hoops, wires, tension, and dampening.

            </p>

          </div>

          <div className={`vp-setup-state ${referenceIsModified ? 'is-modified' : ''}`}>

            <div>

              <span>Current setup profile</span>

              <strong>

                {referenceIsModified ? 'Personal Modified Setup' : 'Default Open Reference Setup'}

              </strong>

              <p>

                {referenceIsModified

                  ? 'This read is using your selected setup modifiers.'

                  : 'Using Ober’s normalized open setup until original stock component data is verified.'}

              </p>

            </div>

            {referenceIsModified && (

              <button type="button" onClick={clearReferenceModifiers}>

                <RotateCcw size={13} strokeWidth={2.2} aria-hidden="true" />

                Clear Modifiers

              </button>

            )}

          </div>

          {MODIFIER_GROUPS.map((group) => (

            <section key={group.key} className="vp-modifier-group">

              <div className="vp-modifier-group-head">

                <span>{group.impact}</span>

                <strong>{group.title}</strong>

              </div>

              <p>{group.description}</p>

              <div className="vp-modifier-options">

                {group.controls.map((modifierKey) => (

                  <ModifierSelect

                    key={modifierKey}

                    modifierKey={modifierKey}

                    value={

                      referenceModifiers?.[modifierKey] || DEFAULT_REFERENCE_MODIFIERS[modifierKey]

                    }

                    onChange={onModifierChange}

                  />

                ))}

              </div>

            </section>

          ))}

        </div>

      )}

    </section>

  );

}

function BuildPanel({

  referenceModifiers,

  onModifierChange,

  referenceIsModified,

  clearReferenceModifiers,

}) {

  return (

    <div className="vp-sidebar-scroll">

      <div className="vp-control-section-label">

        <span>Build Setup</span>

        <p>Choose the physical traits that define the starting voice.</p>

      </div>

      <div className="vp-build-stack">

        {BUILD_OPTIONS.map((option) => (

          <button key={option.key} type="button" className="vp-build-card">

            <span>{option.label}</span>

            <strong>{option.value}</strong>

            <em>{option.note}</em>

          </button>

        ))}

      </div>

      <div className="vp-helper-card">

        <strong>Build Mode</strong>

        <p>

          This view is using mock builder matching for now. Later, selected traits will route into

          the universal voicing engine and certified builder fit logic.

        </p>

      </div>

      <ModifierSections

        mode="build"

        referenceModifiers={referenceModifiers}

        onModifierChange={onModifierChange}

        referenceIsModified={referenceIsModified}

        clearReferenceModifiers={clearReferenceModifiers}

      />

    </div>

  );

}

function ShapePanel({ voice, updateVoice }) {

  return (

    <div className="vp-sidebar-scroll">

      <div className="vp-slider-stack">

        {VOICE_NODES.map((node) => {

          const value = getVoiceValue(voice, node.key);

          return (

            <label key={node.key} className="vp-slider-row">

              <div className="vp-slider-meta">

                <span className="vp-slider-icon" style={{ color: node.color }}>

                  {node.Icon && <node.Icon size={14} strokeWidth={2.25} aria-hidden="true" />}

                </span>

                <span className="vp-slider-label">{node.label}</span>

                <span className="vp-slider-value">{value.toFixed(2)}</span>

              </div>

              <input

                type="range"

                min="0"

                max="1"

                step="0.01"

                value={value}

                onChange={(event) => updateVoice(node.key, parseFloat(event.target.value))}

                style={{ accentColor: node.color }}

              />

            </label>

          );

        })}

      </div>

    </div>

  );

}

function ReferencePanel({

  selectedReferenceId,

  setSelectedReferenceId,

  referenceOptions = REFERENCE_OPTIONS,

  referenceLoading = false,

  referenceError = null,

  referenceModifiers,

  onModifierChange,

  referenceIsModified,

  clearReferenceModifiers,

}) {

  const [browseMode, setBrowseMode] = useState('catalog');

  const [brandFilter, setBrandFilter] = useState('all');

  const [lineFilter, setLineFilter] = useState('all');

  const [catalogSort, setCatalogSort] = useState('company');

  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const selectedReference =

    referenceOptions.find((reference) => getReferenceOptionId(reference) === selectedReferenceId) ||

    referenceOptions.find((reference) => reference.key === selectedReferenceId) ||

    referenceOptions.find((reference) => reference.snareReferenceId === selectedReferenceId) ||

    null;

  const brandOptions = useMemo(() => {

    return Array.from(

      new Set(

        referenceOptions.map((reference) => getReferenceIdentity(reference).company).filter(Boolean)

      )

    ).sort((a, b) => a.localeCompare(b));

  }, [referenceOptions]);

  const lineOptions = useMemo(() => {

    return Array.from(

      new Set(

        referenceOptions

          .filter((reference) => {

            if (brandFilter === 'all') return true;

            return getReferenceIdentity(reference).company === brandFilter;

          })

          .map((reference) => getReferenceIdentity(reference).line || 'Unlisted / General')

          .filter(Boolean)

      )

    ).sort((a, b) => a.localeCompare(b));

  }, [brandFilter, referenceOptions]);

  const filteredReferenceOptions = useMemo(() => {

    const seen = new Set();

    const filtered = referenceOptions

      .filter((reference) => {

        const identity = getReferenceIdentity(reference);

        const line = identity.line || 'Unlisted / General';

        if (verifiedOnly && !hasVerifiedStockSetupData(reference)) return false;

        if (browseMode === 'guided' && brandFilter !== 'all' && identity.company !== brandFilter) {

          return false;

        }

        if (browseMode === 'guided' && lineFilter !== 'all' && line !== lineFilter) {

          return false;

        }

        return true;

      })

      .filter((reference) => {

        const identity = getReferenceIdentity(reference);

        const dedupeKey =

          normalizeReferenceMatchValue(

            [

              identity.company,

              identity.line,

              identity.model,

              identity.construction,

              identity.material,

              identity.size,

            ]

              .filter(Boolean)

              .join(' ')

          ) || normalizeReferenceMatchValue(getReferenceOptionId(reference));

        if (!dedupeKey) return true;

        if (seen.has(dedupeKey)) return false;

        seen.add(dedupeKey);

        return true;

      });

    return sortReferenceCatalog(filtered, catalogSort);

  }, [browseMode, brandFilter, catalogSort, lineFilter, referenceOptions, verifiedOnly]);

  const groupedReferenceOptions = useMemo(() => {

    return groupReferenceCatalog(filteredReferenceOptions, catalogSort);

  }, [catalogSort, filteredReferenceOptions]);

  const handleBrowseModeChange = (nextMode) => {

    setBrowseMode(nextMode);

    if (nextMode === 'catalog') {

      setBrandFilter('all');

      setLineFilter('all');

    }

  };

  const handleBrandChange = (nextBrand) => {

    setBrandFilter(nextBrand);

    setLineFilter('all');

  };

  const handleResetReferenceFilters = () => {

    setBrowseMode('catalog');

    setBrandFilter('all');

    setLineFilter('all');

    setCatalogSort('company');

    setVerifiedOnly(false);

  };

  const handleModelChange = (nextValue) => {

    if (!nextValue || nextValue === 'all') return;

    setSelectedReferenceId(nextValue);

  };

  return (

    <div className="vp-sidebar-scroll">

      <div className="vp-control-section-label">

        <span>Reference Browser</span>

        <p>Choose the drum that anchors the acoustic read.</p>

      </div>

      <div className="vp-reference-count-row">

        <strong>{filteredReferenceOptions.length}</strong>

        <span>visible</span>

        <em>/ {referenceOptions.length} available</em>

      </div>

      <div className="vp-browser-mode-toggle" aria-label="Catalog browse mode">

        <button

          type="button"

          className={browseMode === 'catalog' ? 'is-active' : ''}

          onClick={() => handleBrowseModeChange('catalog')}

        >

          <span>Browse</span>

          <strong>Full Catalog</strong>

        </button>

        <button

          type="button"

          className={browseMode === 'guided' ? 'is-active' : ''}

          onClick={() => handleBrowseModeChange('guided')}

        >

          <span>Filter</span>

          <strong>Make / Series</strong>

        </button>

      </div>

      <label className={`vp-stock-toggle ${verifiedOnly ? 'is-active' : ''}`}>

        <input

          type="checkbox"

          checked={verifiedOnly}

          onChange={(event) => setVerifiedOnly(event.target.checked)}

        />

        <span>

          <strong>Verified stock only</strong>

          <em>Only include drums with approved original setup data.</em>

        </span>

      </label>

      <label className="vp-reference-select-label">

        <span>Catalog Sort</span>

        <select value={catalogSort} onChange={(event) => setCatalogSort(event.target.value)}>

          {CATALOG_SORT_OPTIONS.map((option) => (

            <option key={option.key} value={option.key}>

              {option.label}

            </option>

          ))}

        </select>

      </label>

      {browseMode === 'guided' && (

        <div className="vp-guided-stack">

          <label className="vp-reference-select-label">

            <span>Brand / Maker</span>

            <select value={brandFilter} onChange={(event) => handleBrandChange(event.target.value)}>

              <option value="all">All brands</option>

              {brandOptions.map((brand) => (

                <option key={brand} value={brand}>

                  {brand}

                </option>

              ))}

            </select>

          </label>

          <label className="vp-reference-select-label">

            <span>Line / Series</span>

            <select value={lineFilter} onChange={(event) => setLineFilter(event.target.value)}>

              <option value="all">All lines / series</option>

              {lineOptions.map((line) => (

                <option key={line} value={line}>

                  {line}

                </option>

              ))}

            </select>

          </label>

        </div>

      )}

      <label className="vp-reference-select-label vp-reference-select-label--primary">

        <span>Reference Drum</span>

        <select

          value={selectedReferenceId || 'all'}

          onChange={(event) => handleModelChange(event.target.value)}

        >

          <option value="all">Choose a reference drum</option>

          {groupedReferenceOptions.map((group) => (

            <optgroup key={group.label} label={group.label}>

              {group.references.map((reference) => {

                const identity = getReferenceIdentity(reference);

                const id = getReferenceOptionId(reference);

                const referenceLabel = [

                  identity.company,

                  identity.line,

                  identity.model,

                  identity.size,

                  identity.material,

                ]

                  .filter(Boolean)

                  .join(' · ');

                return (

                  <option key={id} value={id}>

                    {referenceLabel}

                  </option>

                );

              })}

            </optgroup>

          ))}

        </select>

      </label>

      <div className={`vp-reference-status-card ${referenceIsModified ? 'is-modified' : ''}`}>

        <div className="vp-reference-status-head">

          {referenceIsModified ? (

            <SlidersHorizontal size={14} strokeWidth={2.2} aria-hidden="true" />

          ) : (

            <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden="true" />

          )}

          <div>

            <span>Setup Profile</span>

            <strong>

              {referenceIsModified ? 'Personal Modified Setup' : 'Default Open Reference Setup'}

            </strong>

          </div>

        </div>

        <p>

          {referenceIsModified

            ? `Using selected modifiers: ${getModifierSummary(referenceModifiers)}.`

            : 'Using Ober’s normalized open setup until verified original stock component data is available.'}

        </p>

      </div>

      <div className="vp-helper-card">

        <strong>Reference Status</strong>

        <p>

          {referenceLoading

            ? 'Loading passable LegacyPrint snare references...'

            : referenceError

              ? referenceError

              : `${filteredReferenceOptions.length} selectable reference options currently visible.`}

        </p>

        {selectedReference && (

          <p>

            Selected: {getReferenceIdentity(selectedReference).model} ·{' '}

            {getReferenceIdentity(selectedReference).material} ·{' '}

            {getReferenceIdentity(selectedReference).size}

          </p>

        )}

      </div>

      <ModifierSections

        mode="reference"

        referenceModifiers={referenceModifiers}

        onModifierChange={onModifierChange}

        referenceIsModified={referenceIsModified}

        clearReferenceModifiers={clearReferenceModifiers}

      />

      <button

        type="button"

        className="vp-reset-button vp-reset-button--inside"

        onClick={handleResetReferenceFilters}

      >

        <span>↻</span>

        Reset Filters

      </button>

    </div>

  );

}

function ReadoutSummary({

  readMode,

  selectedReadMode,

  selectedReferenceReadout,

  topNodes,

  referenceIdentity,

  modifierProfileSource,

  referenceModifiers,

  referenceIsModified,

}) {

  const title = buildReadoutTitle(readMode, topNodes);

  const lede = getReadoutLede(readMode, selectedReferenceReadout);

  const referenceLine = [referenceIdentity.company, referenceIdentity.model, referenceIdentity.size]

    .filter(Boolean)

    .join(' · ');

  const basisLine = [referenceIdentity.material, referenceIdentity.construction]

    .filter(Boolean)

    .join(' · ');

  return (

    <section className="vp-readout-panel">

      <div className="vp-readout-head">

        <div>

          <span>{selectedReadMode.kicker}</span>

          <strong>{referenceLine}</strong>

        </div>

        <em>{referenceIsModified ? 'Modified Setup' : 'Reference Setup'}</em>

      </div>

      <div className="vp-readout-content">

        <div className="vp-readout-primary">

          <h3>{title}</h3>

          <p>{lede}</p>

        </div>

        <div className="vp-readout-nodes">

          {topNodes.map((node) => (

            <article key={node.key} className="vp-readout-node">

              <span className="vp-readout-node-icon" style={{ color: node.color }}>

                {node.Icon && <node.Icon size={15} strokeWidth={2.25} aria-hidden="true" />}

              </span>

              <div>

                <strong>{node.label}</strong>

                <p>{readMode === 'playerAnalysis' ? node.playerCopy : node.firstListenCopy}</p>

              </div>

            </article>

          ))}

        </div>

      </div>

      <div className="vp-readout-basis">

        <div className="vp-readout-basis-title">

          <BookOpen size={13} strokeWidth={2.2} aria-hidden="true" />

          <span>Read Basis</span>

        </div>

        <div className="vp-readout-basis-grid">

          <div>

            <dt>Reference</dt>

            <dd>{basisLine || 'Physical shell data pending'}</dd>

          </div>

          <div>

            <dt>Drivers</dt>

            <dd>Shell, size, construction, hoops, edge behavior, and setup profile.</dd>

          </div>

          <div>

            <dt>Setup</dt>

            <dd>

              {referenceIsModified

                ? getModifierSummary(referenceModifiers)

                : `${modifierProfileSource}. Default open comparison setup.`}

            </dd>

          </div>

        </div>

      </div>

    </section>

  );

}

function MatchResultCard({ result, index, workflowMode }) {

  const isBuilderResult = workflowMode === 'build';

  const id = isBuilderResult ? result.id : getResultId(result, index);

  const percent = isBuilderResult

    ? getBuilderMatchPercent(index)

    : (TEST_MATCH_PERCENTS[index] ?? getMatchPercent(result));

  const sellerName = getMockSeller(index);

  const matchToneClass = getMatchToneClass(percent);

  return (

    <article key={id} className="vp-result-card">

      <div className={`vp-match-score ${matchToneClass}`}>

        <strong>{percent}%</strong>

        <span>{isBuilderResult ? 'fit' : 'match'}</span>

      </div>

      <div className="vp-result-copy">

        <div className="vp-result-main">

          <strong>

            {isBuilderResult

              ? result.builderName

              : `${result.companyName || result.company || 'Unknown'} ${

                  result.modelName || result.model || 'Untitled Voice'

                }`}

          </strong>

          <span>

            {isBuilderResult ? result.builderType : result.modelDetail || result.size || id}

          </span>

        </div>

        <p className="vp-result-why">

          {isBuilderResult

            ? result.fitReason

            : result.explanation ||

              result.summary ||

              'Shares similar voice behavior with the selected reference.'}

        </p>

        <div className="vp-result-shop">

          <span>{isBuilderResult ? result.location : 'Shop local'}</span>

          <a href="#" onClick={(event) => event.preventDefault()}>

            {isBuilderResult ? result.shopLabel : sellerName}

          </a>

        </div>

      </div>

    </article>

  );

}

export function VoicePlayground({ firestore }) {

  const [workflowMode, setWorkflowMode] = useState('reference');

  const [readMode, setReadMode] = useState('firstListen');

  const [compareA, setCompareA] = useState(null);

  const [compareB, setCompareB] = useState(null);

  const [morphAmount, setMorphAmount] = useState(0.5);

  const [selectedReferenceId, setSelectedReferenceId] = useState('ludwig-acrolite');

  const [selectedDiscoverySectionKey, setSelectedDiscoverySectionKey] = useState(null);

  const [referenceModifiers, setReferenceModifiers] = useState(DEFAULT_REFERENCE_MODIFIERS);

  const {

    setQuery,

    voice,

    updateVoice,

    results,

    discoveryResults,

    discoveryViewModel,

    referenceOptions,

    referenceLoading,

    referenceError,

    loading,

  } = useVoicePlayground(firestore, selectedReferenceId);

  const referenceIsModified = useMemo(() => {

    return !areModifierProfilesEqual(referenceModifiers, DEFAULT_REFERENCE_MODIFIERS);

  }, [referenceModifiers]);

  const rawVisibleReferenceOptions = referenceOptions?.length

    ? referenceOptions

    : REFERENCE_OPTIONS;

  const visibleReferenceOptions = useMemo(() => {

    const seen = new Set();

    return rawVisibleReferenceOptions.filter((item) => {

      const identity = getReferenceIdentity(item);

      const dedupeKey =

        normalizeReferenceMatchValue(

          [

            identity.company,

            identity.line,

            identity.model,

            identity.construction,

            identity.material,

            identity.size,

          ]

            .filter(Boolean)

            .join(' ')

        ) || normalizeReferenceMatchValue(getReferenceOptionId(item));

      if (!dedupeKey) return true;

      if (seen.has(dedupeKey)) return false;

      seen.add(dedupeKey);

      return true;

    });

  }, [rawVisibleReferenceOptions]);

  const selectedReference = useMemo(() => {

    const selectedKey = normalizeReferenceMatchValue(selectedReferenceId);

    const allCandidates = [

      ...(referenceOptions || []),

      ...(visibleReferenceOptions || []),

      ...REFERENCE_OPTIONS,

    ].filter(Boolean);

    if (!selectedKey || selectedKey === 'all') {

      return visibleReferenceOptions[0] || allCandidates[0] || REFERENCE_OPTIONS[0];

    }

    const exactMatch = allCandidates.find((item) =>

      getReferenceMatchValues(item).some(

        (value) => normalizeReferenceMatchValue(value) === selectedKey

      )

    );

    if (exactMatch) return exactMatch;

    const scoredMatches = allCandidates

      .map((item) => ({

        item,

        score: getReferenceTokenScore(selectedReferenceId, item),

      }))

      .filter((entry) => entry.score > 0)

      .sort((a, b) => b.score - a.score);

    return (

      scoredMatches[0]?.item ||

      visibleReferenceOptions[0] ||

      allCandidates[0] ||

      REFERENCE_OPTIONS[0]

    );

  }, [referenceOptions, selectedReferenceId, visibleReferenceOptions]);

  const selectedReadMode = READ_MODES.find((item) => item.key === readMode) || READ_MODES[0];

  const referenceIdentity = useMemo(

    () => getReferenceIdentity(selectedReference),

    [selectedReference]

  );

  const discoverySections = useMemo(() => {

    return (discoveryViewModel?.recommendedSections || []).filter(

      (section) => section.matches?.length

    );

  }, [discoveryViewModel]);

  const selectedDiscoverySection = useMemo(() => {

    return (

      discoverySections.find((section) => section.key === selectedDiscoverySectionKey) ||

      discoverySections.find(

        (section) => section.key === discoveryViewModel?.uiHints?.defaultSimilarSection

      ) ||

      discoverySections[0] ||

      null

    );

  }, [discoverySections, discoveryViewModel, selectedDiscoverySectionKey]);

  const selectedDiscoveryResults = useMemo(() => {

    return (selectedDiscoverySection?.matches || []).map((match) =>

      discoveryMatchToResult(match, selectedDiscoverySection)

    );

  }, [selectedDiscoverySection]);

  const rawResults = results.length

    ? results

    : selectedDiscoveryResults.length

      ? selectedDiscoveryResults

      : discoveryResults.length

        ? discoveryResults

        : MOCK_MATCHES;

  const selectedReferenceEnginePacket = useMemo(() => {

    if (workflowMode !== 'reference') return null;

    return buildReferenceEnginePacket(selectedReference);

  }, [workflowMode, selectedReference]);

  const selectedReferenceVoice = useMemo(() => {

    return normalizeEngineVoiceProfileForMap(

      selectedReferenceEnginePacket?.voiceProfile ||

        selectedReference?.voiceProfile ||

        selectedReference?.legacyPrintVoice ||

        selectedReference?.voice ||

        {}

    );

  }, [selectedReferenceEnginePacket, selectedReference]);

  const selectedReferenceReadout = useMemo(() => {

    if (!selectedReferenceEnginePacket?.readouts) return null;

    if (readMode === 'playerAnalysis') return selectedReferenceEnginePacket.readouts.playerAnalysis;

    if (readMode === 'legacyprint') return selectedReferenceEnginePacket.readouts.legacyPrintIdentity;

    return selectedReferenceEnginePacket.readouts.firstListen;

  }, [selectedReferenceEnginePacket, readMode]);

  const modeVoice = useMemo(() => {

    if (workflowMode === 'reference') return selectedReferenceVoice;

    return buildModeVoice(voice || {}, workflowMode, selectedReference);

  }, [voice, workflowMode, selectedReference, selectedReferenceVoice]);

  const activeVoice = useMemo(() => {

    if (!compareA || !compareB) return modeVoice || {};

    return morphVoice(getResultVoice(compareA), getResultVoice(compareB), morphAmount);

  }, [compareA, compareB, morphAmount, modeVoice]);

  const compareVoice = useMemo(() => {

    if (readMode !== 'playerAnalysis') return null;

    if (compareA && compareB) return getResultVoice(compareB);

    return null;

  }, [readMode, compareA, compareB]);

  const displayResults = useMemo(() => {

    if (workflowMode === 'build') return MOCK_BUILDER_MATCHES.slice(0, 10);

    return rawResults

      .map((result) => {

        if (result.discoveryMatch) return result;

        const resultVoice = getResultVoice(result);

        const similarityScore = scoreVoiceSimilarity(activeVoice, resultVoice);

        return {

          ...result,

          similarityScore,

        };

      })

      .sort((a, b) => b.similarityScore - a.similarityScore)

      .slice(0, 10);

  }, [workflowMode, rawResults, activeVoice]);

  const topNodes = useMemo(() => getTopNodes(activeVoice, 3), [activeVoice]);

  const firstListenKeys = useMemo(() => {

    if (workflowMode === 'reference') {

      const readoutKeys = getReadoutNodeKeys(selectedReferenceEnginePacket?.readouts?.firstListen);

      if (readoutKeys.length) return readoutKeys;

    }

    return topNodes.map((node) => node.key);

  }, [workflowMode, selectedReferenceEnginePacket, topNodes]);

  const modifierProfileSource = referenceIsModified

    ? 'Personal modified setup'

    : workflowMode === 'reference'

      ? 'Verified stock when available; default setup otherwise'

      : 'Default open setup for custom matching';

  const handleShapeNodeDrag = (key, nextValue) => {

    updateVoice(key, nextValue, { runSearchOnUpdate: false });

  };

  const handleModifierChange = (modifierKey, value) => {

    setReferenceModifiers((current) => ({

      ...current,

      [modifierKey]: value,

    }));

  };

  const clearReferenceModifiers = () => {

    setReferenceModifiers(DEFAULT_REFERENCE_MODIFIERS);

  };

  const handleReset = () => {

    setCompareA(null);

    setCompareB(null);

    setMorphAmount(0.5);

    setReadMode('firstListen');

    setWorkflowMode('reference');

    setSelectedReferenceId('ludwig-acrolite');

    setSelectedDiscoverySectionKey(null);

    setReferenceModifiers(DEFAULT_REFERENCE_MODIFIERS);

    setQuery('');

  };

  return (

    <div className={`vp-shell vp-mode-${workflowMode} vp-read-${readMode}`}>

      <div className="vp-page-frame">

        <header className="vp-header">

          <div className="vp-title-group">

            <div className="vp-header-copy">

              <h2>LegacyPrint™ Drum Voicing Engine</h2>

              <p>Select · Read · Compare · Discover</p>

            </div>

          </div>

          <div className="vp-header-actions">

            <button type="button" onClick={handleReset}>

              <span>↻</span>

              Reset

            </button>

            <button type="button">

              <span>☆</span>

              Save Voice

            </button>

          </div>

        </header>

        <section className="vp-engine-shell">

          <aside className="vp-panel vp-left-panel">

            <WorkflowRail workflowMode={workflowMode} setWorkflowMode={setWorkflowMode} />

            {workflowMode === 'build' && (

              <BuildPanel

                referenceModifiers={referenceModifiers}

                onModifierChange={handleModifierChange}

                referenceIsModified={referenceIsModified}

                clearReferenceModifiers={clearReferenceModifiers}

              />

            )}

            {workflowMode === 'shape' && <ShapePanel voice={voice} updateVoice={updateVoice} />}

            {workflowMode === 'reference' && (

              <ReferencePanel

                selectedReferenceId={selectedReferenceId}

                setSelectedReferenceId={setSelectedReferenceId}

                referenceOptions={visibleReferenceOptions}

                referenceLoading={referenceLoading}

                referenceError={referenceError}

                referenceModifiers={referenceModifiers}

                onModifierChange={handleModifierChange}

                referenceIsModified={referenceIsModified}

                clearReferenceModifiers={clearReferenceModifiers}

              />

            )}

          </aside>

          <main className="vp-stage">

            <section className="vp-stage-inner">

              <div className="vp-read-mode-dock" aria-label="Read view">

                {READ_MODES.filter((item) => !item.hidden).map((item) => (

                  <button

                    key={item.key}

                    type="button"

                    className={readMode === item.key ? 'is-active' : ''}

                    onClick={() => setReadMode(item.key)}

                  >

                    <span>{item.kicker}</span>

                    <strong>{item.label}</strong>

                  </button>

                ))}

              </div>

              <div className="vp-map-zone">

                <VoiceConstellationMap

                  voice={activeVoice}

                  compareVoice={compareVoice}

                  readMode={readMode}

                  firstListenKeys={firstListenKeys}

                  shapeMode={workflowMode === 'shape'}

                  onNodeClick={(key) =>

                    updateVoice(key, Math.min(1, getVoiceValue(voice, key) + 0.08))

                  }

                  onNodeDrag={handleShapeNodeDrag}

                />

              </div>

              <ReadoutSummary

                readMode={readMode}

                selectedReadMode={selectedReadMode}

                selectedReferenceReadout={selectedReferenceReadout}

                topNodes={topNodes}

                referenceIdentity={referenceIdentity}

                modifierProfileSource={modifierProfileSource}

                referenceModifiers={referenceModifiers}

                referenceIsModified={referenceIsModified}

              />



              {readMode === 'playerAnalysis' && (



                <PlayerAnalysisDeepDive



                  read={{



                    ...(selectedReferenceReadout || {}),



                    title: selectedReferenceReadout?.title,



                    summary: selectedReferenceReadout?.summary || selectedReferenceReadout?.description,



                    dominantNodes: topNodes,

                        config: referenceIdentity,

                        referenceIdentity,

                        referenceModifiers,

                        referenceIsModified,



                    playerAnalysis: {



                      ...(selectedReferenceReadout || {}),



                      title: selectedReferenceReadout?.title,



                      overviewSummary:



                        selectedReferenceReadout?.summary ||



                        selectedReferenceReadout?.description ||



                        selectedReadMode.description,



                      dominantNodes: topNodes,

                        config: referenceIdentity,

                        referenceIdentity,

                        referenceModifiers,

                        referenceIsModified,



                    },



                  }}



                  playerAnalysis={{



                    ...(selectedReferenceReadout || {}),



                    title: selectedReferenceReadout?.title,



                    overviewSummary:



                      selectedReferenceReadout?.summary ||



                      selectedReferenceReadout?.description ||



                      selectedReadMode.description,



                    dominantNodes: topNodes,

                        config: referenceIdentity,

                        referenceIdentity,

                        referenceModifiers,

                        referenceIsModified,



                  }}



                />



              )}

            </section>

            {compareA && compareB && (

              <div className="vp-morph-panel">

                <div className="vp-morph-header">

                  <div>

                    <p>A/B Morph</p>

                    <strong>

                      {compareA.companyName || 'A'} → {compareB.companyName || 'B'}

                    </strong>

                  </div>

                  <label>

                    <span>{Math.round(morphAmount * 100)}%</span>

                    <input

                      type="range"

                      min="0"

                      max="1"

                      step="0.01"

                      value={morphAmount}

                      onChange={(event) => setMorphAmount(parseFloat(event.target.value))}

                    />

                  </label>

                </div>

                <VoiceMorphPanel drumA={compareA} drumB={compareB} />

              </div>

            )}

          </main>

          <aside className="vp-panel vp-right-panel">

            <div className="vp-results-head">

              <div className="vp-results-title">

                <span>⌬</span>

                <div>

                  <h3>

                    {workflowMode === 'build'

                      ? 'Certified Builder Matches'

                      : 'Similar Voice Matches'}

                  </h3>

                  <p>

                    {loading

                      ? 'Reshaping sound space...'

                      : workflowMode === 'build'

                        ? 'Builders ranked by fit for this custom build direction'

                        : discoveryViewModel?.target?.title

                          ? `Previewing matches for ${discoveryViewModel.target.title}`

                          : referenceIsModified

                            ? 'Ranked against your modified setup'

                            : `Previewing matches for ${referenceIdentity.company} ${referenceIdentity.model}`}

                  </p>

                </div>

              </div>

            </div>

            {workflowMode !== 'build' && discoverySections.length > 0 && (

              <div className="vp-discovery-block">

                <div className="vp-discovery-section-tabs" aria-label="Discovery match sections">

                  {discoverySections.map((section) => (

                    <button

                      key={section.key}

                      type="button"

                      className={selectedDiscoverySection?.key === section.key ? 'is-active' : ''}

                      onClick={() => setSelectedDiscoverySectionKey(section.key)}

                    >

                      <span>{section.label}</span>

                      <em>{section.matches.length}</em>

                    </button>

                  ))}

                </div>

                {selectedDiscoverySection?.description && (

                  <div className="vp-discovery-section-summary">

                    <strong>{selectedDiscoverySection.label}</strong>

                    <p>{selectedDiscoverySection.description}</p>

                  </div>

                )}

              </div>

            )}

            <div className="vp-results-scroll">

              {displayResults.map((result, index) => (

                <MatchResultCard

                  key={workflowMode === 'build' ? result.id : getResultId(result, index)}

                  result={result}

                  index={index}

                  workflowMode={workflowMode}

                />

              ))}

            </div>

            <button type="button" className="vp-view-all-button">

              <span>☷</span>

              View All Results

              <span>›</span>

            </button>

          </aside>

        </section>

      </div>

    </div>

  );

}

export default VoicePlayground;