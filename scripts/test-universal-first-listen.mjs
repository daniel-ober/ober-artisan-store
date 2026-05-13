// scripts/test-universal-first-listen.mjs

import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

const AXIS_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const baseInput = {

  size: '13',

  lugs: '8',

  staveOption: '16 - 12mm',

  hardwareColor: 'Chrome',

  hoopType: 'Triple Flange',

  scorchDepth: 'Medium Torch',

  benchmarkFamilyId: 'ober-custom',

  benchmarkTypeId: 'heritage-oak-reference',

  benchmarkSizeId: '14x5_5',

};

const cases = [

  {

    label: '13x5.0 Medium Torch Triple Flange',

    input: { ...baseInput, depth: '5.0' },

  },

  {

    label: '13x5.5 Medium Torch Triple Flange',

    input: { ...baseInput, depth: '5.5' },

  },

  {

    label: '13x6.0 Medium Torch Triple Flange',

    input: { ...baseInput, depth: '6.0' },

  },

  {

    label: '13x6.5 Medium Torch Triple Flange',

    input: { ...baseInput, depth: '6.5' },

  },

  {

    label: '13x7.0 Medium Torch Triple Flange',

    input: { ...baseInput, depth: '7.0' },

  },

  {

    label: '13x7.5 Medium Torch Triple Flange',

    input: { ...baseInput, depth: '7.5' },

  },

  {

    label: '13x8.0 Medium Torch Triple Flange',

    input: { ...baseInput, depth: '8.0' },

  },

];

const formatProfile = (profile = {}) => {

  return AXIS_ORDER.map((axis) => {

    const value = Number(profile?.[axis] ?? 0).toFixed(2);

    return `${axis}:${value}`;

  }).join(' | ');

};

console.log('\n=== HERITAGE UNIVERSAL FIRST LISTEN TEST ===\n');

cases.forEach(({ label, input }) => {

  const result = buildHeritageVoiceRead(input);

  const firstListen = result.firstListen || result.universalFirstListen || {};

  const universalProfile =

    result.universalProfile || result.universalVoiceRead?.profile || {};

  const shapedProfile = result.profile || {};

  console.log(`\n--- ${label} ---`);

  console.log(`Title: ${firstListen.title}`);

  console.log(`Nodes: ${(firstListen.nodes || []).join(' → ')}`);

  console.log(`Summary: ${firstListen.summary}`);

  console.log(`Universal Profile: ${formatProfile(universalProfile)}`);

  console.log(`Shaped Profile:    ${formatProfile(shapedProfile)}`);

});

console.log('\n=== END TEST ===\n');