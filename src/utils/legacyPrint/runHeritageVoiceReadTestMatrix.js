// src/utils/legacyPrint/runHeritageVoiceReadTestMatrix.js

import buildHeritageVoiceRead from './buildHeritageVoiceRead.js';

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

  const depth = Number(input.depth);

  const isDeep = depth >= 7;

  const isVeryDeep = depth >= 7.5;

  const isShallow = depth <= 5;

  const isDieCast = input.hoopType === 'Die-Cast';

  const isTripleFlange = input.hoopType === 'Triple Flange';

  const isBlackened = String(input.scorchDepth || '')

    .toLowerCase()

    .includes('black');

  const isLight = String(input.scorchDepth || '')

    .toLowerCase()

    .includes('light');

  const isMedium = String(input.scorchDepth || '')

    .toLowerCase()

    .includes('medium');

  const hasReRings =

    String(input.staveOption || '').toLowerCase().includes('re-rings') ||

    String(input.staveOption || '').includes('+ $150');

  const isThinReRingShell =

    hasReRings && String(input.staveOption || '').includes('7mm');

  const isSmallReRingShell =

    hasReRings && String(input.staveOption || '').includes('8mm');

  const isThickHighLugShell =

    String(input.size) === '14' &&

    String(input.lugs) === '10' &&

    String(input.staveOption || '').includes('20 - 12mm');

  const attackDelta = getAxisDelta(profile, 'attack');

  const brightnessDelta = getAxisDelta(profile, 'brightness');

  const projectionDelta = getAxisDelta(profile, 'projection');

  const sustainDelta = getAxisDelta(profile, 'sustain');

  const warmthDelta = getAxisDelta(profile, 'warmth');

  const sensitivityDelta = getAxisDelta(profile, 'sensitivity');

  const controlDelta = getAxisDelta(profile, 'control');

  /*

    Deep-shell rule:

    Deep shells do not always need high sustain once heavy control factors are present.

    A deep 14x7+ / 10-lug / 12mm / Die-Cast / Blackened build can believably read

    short, focused, and controlled. Only warn when sustain is low without a clear

    control-forward reason.

  */

  if (

    isDeep &&

    sustainDelta < -0.35 &&

    !(isThickHighLugShell && (isDieCast || isBlackened) && controlDelta > 0.65)

  ) {

    warnings.push('Deep shell is reading unexpectedly low on sustain.');

  }

  /*

    Deep warmth rule:

    Keep this, but make it less sensitive. Deep shells should almost never read

    meaningfully thin unless multiple bright/focused choices are overpowering it.

  */

  if (

    isDeep &&

    warmthDelta < -0.35 &&

    !(isThickHighLugShell && projectionDelta > 0.75)

  ) {

    warnings.push('Deep shell is reading unexpectedly low on warmth.');

  }

  /*

    Shallow attack rule:

    A shallow shell can still read rounder if it is thin, low-lug, re-ringed,

    and Triple Flange. Warn only when attack is very low without that explanation.

  */

  if (

    isShallow &&

    attackDelta < -0.45 &&

    !(hasReRings && isTripleFlange)

  ) {

    warnings.push('Shallow shell is reading unexpectedly low on attack.');

  }

  /*

    Die-Cast control rule:

    Die-Cast adds focus, but a deep thin re-ring shell can still stay open.

    Warn only when Die-Cast control is clearly below center and there is not

    a strong deep/thin/open-shell explanation.

  */

if (

  isDieCast &&

  controlDelta < -0.4 &&

  !(

    hasReRings &&

    (String(input.size) === '12' || isDeep) &&

    (sustainDelta > 0.25 || sensitivityDelta > 0.35)

  )

) {

  warnings.push('Die-Cast hoop is reading unexpectedly low on control.');

}

  /*

    Die-Cast sustain rule:

    Die-Cast can still allow sustain on deep, thin, re-ring shells.

    Warn only when sustain gets very high without that expected open-shell reason.

  */

if (

  isDieCast &&

  sustainDelta > 1.25 &&

  !(hasReRings && isVeryDeep && warmthDelta > 0.65)

) {

  warnings.push('Die-Cast hoop may be allowing too much sustain increase.');

}

  /*

    Triple Flange sensitivity rule:

    Triple Flange preserves openness, but Blackened finish / thick 10-lug shells

    can intentionally trade sensitivity for a more locked-in note center.

  */

  if (

    isTripleFlange &&

    sensitivityDelta < -1.05 &&

    !(isBlackened && isThickHighLugShell && controlDelta > 0.75)

  ) {

    warnings.push('Triple Flange read may be too insensitive.');

  }

  /*

    Blackened control rule:

    Blackened should generally add control, but small/thin/re-ring shells can

    still read open. Warn only when blackened control is clearly low without a

    small-shell / re-ring explanation.

  */

  if (

    isBlackened &&

    controlDelta < -0.45 &&

    !(hasReRings && (isSmallReRingShell || isThinReRingShell))

  ) {

    warnings.push('Blackened finish is reading unexpectedly low on control.');

  }

  /*

    Light Torch sensitivity rule:

    Light Torch preserves touch, but 14 / 10-lug / 12mm builds can still read

    more powerful and less sensitive because mass and lug count dominate.

  */

  if (

    isLight &&

    sensitivityDelta < -0.65 &&

    !(isThickHighLugShell && projectionDelta > 0.85)

  ) {

    warnings.push('Light finish did not preserve enough sensitivity.');

  }

  /*

    Re-ring control rule:

    Re-rings add support, not automatic control. Thin/deep/open builds can still

    read loose and blooming. Warn only when control is very low on a re-ring build

    that is not clearly leaning into sustain/body.

  */

  if (

    hasReRings &&

    controlDelta < -0.75 &&

    !(sustainDelta > 0.75 || warmthDelta > 0.55 || sensitivityDelta > 0.35)

  ) {

    warnings.push('Re-rings are reading unexpectedly low on control.');

  }

  /*

    Extra coherence checks:

    These are better “real” contradictions than the old broad warnings.

  */

  if (

    isBlackened &&

    isDieCast &&

    controlDelta < 0.15 &&

    !hasReRings

  ) {

    warnings.push('Blackened + Die-Cast build is not gaining expected control.');

  }

  if (

    isLight &&

    isTripleFlange &&

    sensitivityDelta < -0.55 &&

    !isThickHighLugShell

  ) {

    warnings.push('Light Torch + Triple Flange build may be losing too much touch response.');

  }

   if (

    isDeep &&

    isTripleFlange &&

    !isBlackened &&

    sustainDelta < -0.15 &&

    warmthDelta < 0.15

  ) {

    warnings.push('Deep Triple Flange build may not be preserving enough bloom.');

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