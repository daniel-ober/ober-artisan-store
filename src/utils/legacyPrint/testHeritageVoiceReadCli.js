// src/utils/legacyPrint/testHeritageVoiceReadCli.js

import buildHeritageVoiceRead from './buildHeritageVoiceRead.js';

const DEFAULT_INPUT = {

  benchmarkFamilyId: 'ober-custom',

  benchmarkTypeId: 'heritage-oak-reference',

  benchmarkSizeId: '14x5_5',

  size: '14',

  depth: '5.5',

  lugs: '8',

  staveOption: '16 - 10mm',

  hoopType: 'Triple Flange',

  hardwareColor: 'Chrome',

  scorchDepth: 'Medium Torch',

};

const CASES = {

  standard: {

    ...DEFAULT_INPUT,

  },

  deepFocused: {

    ...DEFAULT_INPUT,

    size: '14',

    depth: '7.0',

    lugs: '10',

    staveOption: '20 - 12mm',

    hoopType: 'Die-Cast',

    scorchDepth: 'Blackened',

  },

  smallOpen: {

    ...DEFAULT_INPUT,

    size: '12',

    depth: '5.0',

    lugs: '6',

    staveOption: '12 - 8mm + $150 (Re-Rings Required)',

    hoopType: 'Triple Flange',

    scorchDepth: 'Light Torch',

  },

  deepOpen: {

    ...DEFAULT_INPUT,

    size: '14',

    depth: '8.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    scorchDepth: 'Light Torch',

  },

  shortControlled: {

    ...DEFAULT_INPUT,

    size: '14',

    depth: '5.0',

    lugs: '10',

    staveOption: '20 - 12mm',

    hoopType: 'Die-Cast',

    scorchDepth: 'Blackened',

  },

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

function delta(value) {

  const n = Number(value ?? 5) - 5;

  return Number(n.toFixed(2));

}

function sortAxes(profile = {}) {

  return [...AXES].sort((a, b) => Number(profile[b] ?? 5) - Number(profile[a] ?? 5));

}

function printCase(name, input) {

  const read = buildHeritageVoiceRead(input);

  const profile = read.profile || {};

  const sorted = sortAxes(profile);

  console.log('\n============================================================');

  console.log(`CASE: ${name}`);

  console.log('============================================================');

  console.log('\nCONFIG');

  console.table({

    size: `${input.size}x${input.depth}`,

    lugs: input.lugs,

    staveOption: input.staveOption,

    hoopType: input.hoopType,

    hardwareColor: input.hardwareColor,

    scorchDepth: input.scorchDepth,

    benchmark: `${input.benchmarkTypeId} / ${input.benchmarkSizeId}`,

  });

  console.log('\nPROFILE');

  console.table(

    AXES.reduce((acc, axis) => {

      acc[axis] = {

        value: profile[axis],

        delta: delta(profile[axis]),

      };

      return acc;

    }, {})

  );

  console.log('\nTOP AXES');

  console.table(

    sorted.slice(0, 3).map((axis) => ({

      axis,

      value: profile[axis],

      delta: delta(profile[axis]),

    }))

  );

  console.log('\nLOWEST AXES');

  console.table(

    sorted

      .slice(-3)

      .reverse()

      .map((axis) => ({

        axis,

        value: profile[axis],

        delta: delta(profile[axis]),

      }))

  );

  console.log('\nREADOUTS');

  console.log('Playing Situation:', read.playingSituation);

  console.log('Feel Read:', read.feelRead);

  console.log('Highlighted:', read.highlightedCharacteristics);

  console.log('Primary Genre:', read.primaryGenre);

  console.log('Secondary Genres:', read.secondaryGenres?.join(', '));

  console.log('Recording Mic:', read.recordingMic);

  console.log('Source Build:', read.sourceBuildRead);

  return read;

}

function printHelp() {

  console.log('\nHeritage Voice Read CLI');

  console.log('\nCommands:');

  console.log('  node src/utils/legacyPrint/testHeritageVoiceReadCli.js list');

  console.log('  node src/utils/legacyPrint/testHeritageVoiceReadCli.js standard');

  console.log('  node src/utils/legacyPrint/testHeritageVoiceReadCli.js deepFocused');

  console.log('  node src/utils/legacyPrint/testHeritageVoiceReadCli.js smallOpen');

  console.log('  node src/utils/legacyPrint/testHeritageVoiceReadCli.js deepOpen');

  console.log('  node src/utils/legacyPrint/testHeritageVoiceReadCli.js shortControlled');

  console.log('  node src/utils/legacyPrint/testHeritageVoiceReadCli.js all');

}

const command = process.argv[2] || 'help';

if (command === 'help') {

  printHelp();

} else if (command === 'list') {

  console.table(Object.keys(CASES).map((name) => ({ case: name })));

} else if (command === 'all') {

  Object.entries(CASES).forEach(([name, input]) => printCase(name, input));

} else if (CASES[command]) {

  printCase(command, CASES[command]);

} else {

  console.error(`Unknown case: ${command}`);

  printHelp();

  process.exit(1);

}