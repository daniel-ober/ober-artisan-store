// src/utils/legacyPrint/runHeritageVoiceReadTestMatrix.js

import buildHeritageVoiceRead from './buildHeritageVoiceRead';

const TEST_DEPTHS_BY_SIZE = {

  12: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  13: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  14: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

};

const TEST_STAVE_OPTIONS_BY_SIZE_AND_LUGS = {

  12: {

    6: ['12 - 8mm + $150 (Re-Rings Required)'],

    8: ['16 - 10mm'],

  },

  13: {

    8: ['16 - 10mm'],

  },

  14: {

    8: ['16 - 10mm'],

    10: ['20 - 12mm', '10 - 7mm + $150 (Re-Rings Required)'],

  },

};

const TEST_HOOPS = ['Triple Flange', 'Die-Cast'];

const TEST_HARDWARE = ['Chrome', 'Black Nickel', 'Brass/Gold'];

const TEST_FINISHES = ['Light Torch', 'Medium Torch', 'Blackened'];

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

function getSortedAxes(profile = {}) {

  return [...AXES].sort((a, b) => {

    const aValue = Number(profile?.[a] ?? 5);

    const bValue = Number(profile?.[b] ?? 5);

    return bValue - aValue;

  });

}

function getAxisDelta(profile = {}, axis) {

  return Number(profile?.[axis] ?? 5) - 5;

}

function getAxisDeltaFixed(profile = {}, axis) {

  return Number(getAxisDelta(profile, axis).toFixed(2));

}

function buildSanityWarnings(input = {}, read = {}) {

  const warnings = [];

  const profile = read.profile || {};

  const isDeep = Number(input.depth) >= 7;

  const isShallow = Number(input.depth) <= 5;

  const isDieCast = input.hoopType === 'Die-Cast';

  const isTripleFlange = input.hoopType === 'Triple Flange';

  const isBlackened = String(input.scorchDepth || '')

    .toLowerCase()

    .includes('black');

  const isLight = String(input.scorchDepth || '')

    .toLowerCase()

    .includes('light');

  const hasReRings =

    String(input.staveOption || '').toLowerCase().includes('re-rings') ||

    String(input.staveOption || '').includes('+ $150');

  if (isDeep && getAxisDelta(profile, 'warmth') < -0.15) {

    warnings.push('Deep shell is reading unexpectedly low on warmth.');

  }

  if (isDeep && getAxisDelta(profile, 'sustain') < -0.15) {

    warnings.push('Deep shell is reading unexpectedly low on sustain.');

  }

  if (isShallow && getAxisDelta(profile, 'attack') < -0.25) {

    warnings.push('Shallow shell is reading unexpectedly low on attack.');

  }

  if (isDieCast && getAxisDelta(profile, 'control') < -0.15) {

    warnings.push('Die-Cast hoop is reading unexpectedly low on control.');

  }

  if (isDieCast && getAxisDelta(profile, 'sustain') > 0.85) {

    warnings.push('Die-Cast hoop may be allowing too much sustain increase.');

  }

  if (isTripleFlange && getAxisDelta(profile, 'sensitivity') < -0.85) {

    warnings.push('Triple Flange read may be too insensitive.');

  }

  if (isBlackened && getAxisDelta(profile, 'control') < -0.15) {

    warnings.push('Blackened finish is reading unexpectedly low on control.');

  }

  if (isBlackened && getAxisDelta(profile, 'sensitivity') > 0.55) {

    warnings.push('Blackened finish may be reading too touch-sensitive.');

  }

  if (isLight && getAxisDelta(profile, 'sensitivity') < -0.35) {

    warnings.push('Light finish did not preserve enough sensitivity.');

  }

  if (hasReRings && getAxisDelta(profile, 'control') < -0.15) {

    warnings.push('Re-rings are reading unexpectedly low on control.');

  }

  return warnings;

}

function buildTestCaseLabel(input = {}) {

  return [

    `${input.size}x${input.depth}`,

    `${input.lugs} lugs`,

    input.staveOption,

    input.hoopType,

    input.hardwareColor,

    input.scorchDepth,

  ].join(' • ');

}

function createTestInputs() {

  const inputs = [];

  Object.entries(TEST_DEPTHS_BY_SIZE).forEach(([size, depths]) => {

    depths.forEach((depth) => {

      const lugMap = TEST_STAVE_OPTIONS_BY_SIZE_AND_LUGS[size] || {};

      Object.entries(lugMap).forEach(([lugs, staveOptions]) => {

        staveOptions.forEach((staveOption) => {

          TEST_HOOPS.forEach((hoopType) => {

            TEST_FINISHES.forEach((scorchDepth) => {

              inputs.push({

                ...DEFAULT_BENCHMARK,

                size,

                depth,

                lugs,

                staveOption,

                hoopType,

                hardwareColor: 'Chrome',

                scorchDepth,

              });

            });

          });

        });

      });

    });

  });

  TEST_HARDWARE.forEach((hardwareColor) => {

    inputs.push({

      ...DEFAULT_BENCHMARK,

      size: '14',

      depth: '5.5',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor,

      scorchDepth: 'Medium Torch',

    });

  });

  return inputs;

}

function summarizeRead(input = {}, read = {}) {

  const profile = read.profile || {};

  const sortedAxes = getSortedAxes(profile);

  const warnings = buildSanityWarnings(input, read);

  return {

    label: buildTestCaseLabel(input),

    input,

    profile,

    deltas: AXES.reduce((acc, axis) => {

      acc[axis] = getAxisDeltaFixed(profile, axis);

      return acc;

    }, {}),

    highestAxes: sortedAxes.slice(0, 3).map((axis) => ({

      axis,

      value: profile[axis],

      delta: getAxisDeltaFixed(profile, axis),

    })),

    lowestAxes: sortedAxes

      .slice(-3)

      .reverse()

      .map((axis) => ({

        axis,

        value: profile[axis],

        delta: getAxisDeltaFixed(profile, axis),

      })),

    primaryGenre: read.primaryGenre,

    secondaryGenres: read.secondaryGenres,

    recordingMic: read.recordingMic,

    playingSituation: read.playingSituation,

    feelRead: read.feelRead,

    highlightedCharacteristics: read.highlightedCharacteristics,

    sourceBuildRead: read.sourceBuildRead,

    benchmark: {

      familyId: read.benchmark?.familyId,

      familyLabel: read.benchmark?.familyLabel,

      typeId: read.benchmark?.typeId,

      typeLabel: read.benchmark?.typeLabel,

      sizeId: read.benchmark?.sizeId,

      sizeLabel: read.benchmark?.sizeLabel,

    },

    warnings,

  };

}

export function runHeritageVoiceReadTestMatrix({

  limit,

  onlyWarnings = false,

  collapsed = true,

} = {}) {

  const inputs = createTestInputs();

  const hasLimit = limit !== undefined && limit !== null && limit !== '';

  const selectedInputs =

    hasLimit && Number.isFinite(Number(limit))

      ? inputs.slice(0, Number(limit))

      : inputs;

  const results = selectedInputs.map((input) => {

    const read = buildHeritageVoiceRead(input);

    return summarizeRead(input, read);

  });

  const visibleResults = onlyWarnings

    ? results.filter((result) => result.warnings.length > 0)

    : results;

  console.clear();

  console.log(

    '%cHeritage LegacyPrint™ Voice Read Test Matrix',

    'font-size: 16px; font-weight: bold;'

  );

  console.log({

    totalGeneratedCases: results.length,

    visibleCases: visibleResults.length,

    onlyWarnings,

  });

  visibleResults.forEach((result, index) => {

    const method = collapsed ? console.groupCollapsed : console.group;

    method(`${index + 1}. ${result.label}`);

    console.log('Input:', result.input);

    console.log('Profile:', result.profile);

    console.log('Deltas from Heritage center:', result.deltas);

    console.log('Highest Axes:', result.highestAxes);

    console.log('Lowest Axes:', result.lowestAxes);

    console.log('Primary Genre:', result.primaryGenre);

    console.log('Secondary Genres:', result.secondaryGenres);

    console.log('Recording Mic:', result.recordingMic);

    console.log('Playing Situation:', result.playingSituation);

    console.log('Feel Read:', result.feelRead);

    console.log('Highlighted Characteristics:', result.highlightedCharacteristics);

    console.log('Source Build Read:', result.sourceBuildRead);

    console.log('Benchmark:', result.benchmark);

    if (result.warnings.length > 0) {

      console.warn('Sanity Warnings:', result.warnings);

    } else {

      console.log('Sanity Warnings: none');

    }

    console.groupEnd();

  });

  return visibleResults;

}

export function runOneHeritageVoiceReadTest(input = {}) {

  const resolvedInput = {

    ...DEFAULT_BENCHMARK,

    size: '14',

    depth: '5.5',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',

    ...input,

  };

  const read = buildHeritageVoiceRead(resolvedInput);

  const summary = summarizeRead(resolvedInput, read);

  console.clear();

  console.group(`Heritage Single Voice Read Test: ${summary.label}`);

  console.log('Input:', resolvedInput);

  console.log('Profile:', summary.profile);

  console.log('Deltas from Heritage center:', summary.deltas);

  console.log('Highest Axes:', summary.highestAxes);

  console.log('Lowest Axes:', summary.lowestAxes);

  console.log('Primary Genre:', summary.primaryGenre);

  console.log('Secondary Genres:', summary.secondaryGenres);

  console.log('Recording Mic:', summary.recordingMic);

  console.log('Playing Situation:', summary.playingSituation);

  console.log('Feel Read:', summary.feelRead);

  console.log('Highlighted Characteristics:', summary.highlightedCharacteristics);

  console.log('Source Build Read:', summary.sourceBuildRead);

  console.log('Benchmark:', summary.benchmark);

  if (summary.warnings.length > 0) {

    console.warn('Sanity Warnings:', summary.warnings);

  } else {

    console.log('Sanity Warnings: none');

  }

  console.groupEnd();

  return summary;

}

export default runHeritageVoiceReadTestMatrix;