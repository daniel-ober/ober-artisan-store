import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

import { buildKeyRelationships } from '../src/utils/legacyPrint/heritageKeyRelationships.js';

const DEFAULT_BENCHMARK = {
  benchmarkFamilyId: 'ober-custom',

  benchmarkTypeId: 'heritage-oak-reference',

  benchmarkSizeId: '14x5_5',
};

const AXES = [
  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',
];

const TEST_CASES = [
  {
    name: '12x5 shallow standard',

    size: '12',

    depth: '5.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    name: '12x6 mid standard',

    size: '12',

    depth: '6.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    name: '12x6.5 mid-deep standard',

    size: '12',

    depth: '6.5',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    name: '12x8 deep standard',

    size: '12',

    depth: '8.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    name: '12x6.5 six-lug re-ring',

    size: '12',

    depth: '6.5',

    lugs: '6',

    staveOption: '12 - 8mm + $150 (Re-Rings Required)',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    name: '14x6 standard',

    size: '14',

    depth: '6.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    name: '14x6.5 standard',

    size: '14',

    depth: '6.5',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    name: '14x6.5 ten-lug thick',

    size: '14',

    depth: '6.5',

    lugs: '10',

    staveOption: '20 - 12mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    name: '14x6.5 ten-lug thick die-cast blackened',

    size: '14',

    depth: '6.5',

    lugs: '10',

    staveOption: '20 - 12mm',

    hoopType: 'Die-Cast',

    hardwareColor: 'Chrome',

    scorchDepth: 'Blackened',
  },

  {
    name: '14x6.5 ten-lug thin re-ring light',

    size: '14',

    depth: '6.5',

    lugs: '10',

    staveOption: '10 - 7mm + $150 (Re-Rings Required)',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Light Torch',
  },

  {
    name: '14x8 deep open',

    size: '14',

    depth: '8.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },
];

function round(value, places = 2) {
  return Number(Number(value || 0).toFixed(places));
}

function delta(profile, axis) {
  return round(Number(profile?.[axis] ?? 5) - 5, 2);
}

function spread(profile) {
  const values = AXES.map((axis) => Number(profile?.[axis] ?? 5));

  return round(Math.max(...values) - Math.min(...values), 2);
}

function movement(profile) {
  return round(
    AXES.reduce((sum, axis) => sum + Math.abs(delta(profile, axis)), 0),

    2
  );
}

function readCase(testCase) {
  const input = {
    ...DEFAULT_BENCHMARK,

    ...testCase,
  };

  const read = buildHeritageVoiceRead(input);

  const profile = read.profile || {};

  const relationships = buildKeyRelationships(read).slice(0, 3);

  return {
    name: testCase.name,

    input,

    profile,

    spread: spread(profile),

    movement: movement(profile),

    deltas: AXES.reduce((acc, axis) => {
      acc[axis] = delta(profile, axis);

      return acc;
    }, {}),

    topThread: relationships[0]?.title || 'None',

    topThreadId: relationships[0]?.id || 'none',

    threads: relationships.map((relationship, index) => ({
      rank: index + 1,

      id: relationship.id,

      slot: relationship.slotKey,

      title: relationship.title,

      nodes: Array.isArray(relationship.nodes)
        ? relationship.nodes.join(' / ')
        : '',

      score: round(relationship.score, 4),
    })),

    sourceBuildRead: read.sourceBuildRead,

    playingSituation: read.playingSituation,

    highlightedCharacteristics: read.highlightedCharacteristics,
  };
}

function compareResults(label, a, b) {
  const axisChanges = AXES.reduce((acc, axis) => {
    acc[axis] = round(
      Number(b.profile?.[axis] ?? 5) - Number(a.profile?.[axis] ?? 5),
      2
    );

    return acc;
  }, {});

  const totalMovement = round(
    AXES.reduce((sum, axis) => sum + Math.abs(axisChanges[axis]), 0),

    2
  );

  return {
    comparison: label,

    totalMovement,

    topThreadFrom: a.topThread,

    topThreadTo: b.topThread,

    topThreadChanged: a.topThreadId !== b.topThreadId,

    ...axisChanges,
  };
}

const results = TEST_CASES.map(readCase);

console.log('\nHERITAGE LEGACYPRINT TEST CASES\n');

console.table(
  results.map((result) => ({
    case: result.name,

    spread: result.spread,

    movement: result.movement,

    topThread: result.topThread,

    attack: result.deltas.attack,

    brightness: result.deltas.brightness,

    projection: result.deltas.projection,

    sustain: result.deltas.sustain,

    warmth: result.deltas.warmth,

    sensitivity: result.deltas.sensitivity,

    control: result.deltas.control,
  }))
);

console.log('\nTARGETED CHANGE COMPARISONS\n');

const byName = Object.fromEntries(
  results.map((result) => [result.name, result])
);

console.table([
  compareResults(
    '12x6 → 12x6.5',

    byName['12x6 mid standard'],

    byName['12x6.5 mid-deep standard']
  ),

  compareResults(
    '14x6 → 14x6.5',

    byName['14x6 standard'],

    byName['14x6.5 standard']
  ),

  compareResults(
    '14x6.5 8-lug 10mm → 14x6.5 10-lug 12mm',

    byName['14x6.5 standard'],

    byName['14x6.5 ten-lug thick']
  ),

  compareResults(
    '14x6.5 10-lug 12mm triple/medium → die-cast/blackened',

    byName['14x6.5 ten-lug thick'],

    byName['14x6.5 ten-lug thick die-cast blackened']
  ),

  compareResults(
    '12x5 → 12x8',

    byName['12x5 shallow standard'],

    byName['12x8 deep standard']
  ),
]);

console.log('\nTHREAD DETAILS\n');

results.forEach((result) => {
  console.log(`\n${result.name}`);

  console.log(result.sourceBuildRead);

  console.table(result.threads);

  console.log('Playing Situation:', result.playingSituation);

  console.log('Highlighted:', result.highlightedCharacteristics);
});

console.log('\nREAD THIS:\n');

console.log(
  'If any TARGETED CHANGE COMPARISON has totalMovement below about 0.25, that config change is probably too weak in the scoring engine.'
);

console.log(
  'If topThreadChanged is false for every comparison, the thread scorer may still be too sticky.'
);

console.log(
  'If 12x6 → 12x6.5 or 14x6 → 14x6.5 shows near-zero axis changes, the depth shaping in buildHeritageVoiceRead.js needs stronger depth sensitivity.'
);
