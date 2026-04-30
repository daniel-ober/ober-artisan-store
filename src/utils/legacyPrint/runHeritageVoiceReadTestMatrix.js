// src/utils/legacyPrint/runHeritageVoiceReadTestMatrix.js

import buildHeritageVoiceRead from './buildHeritageVoiceRead.js';

import { buildKeyRelationships } from './heritageKeyRelationships.js';

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

const FOCUS_CASES = [
  {
    label: 'Small shallow quick read',

    size: '12',

    depth: '5.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    label: 'Small deep bloom read',

    size: '12',

    depth: '8.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    label: 'Small re-ring read',

    size: '12',

    depth: '6.5',

    lugs: '6',

    staveOption: '12 - 8mm + $150 (Re-Rings Required)',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    label: 'Standard Heritage reference-like read',

    size: '14',

    depth: '5.5',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    label: 'Deep 14 open read',

    size: '14',

    depth: '8.0',

    lugs: '8',

    staveOption: '16 - 10mm',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Medium Torch',
  },

  {
    label: 'Heavy focused 14 read',

    size: '14',

    depth: '6.5',

    lugs: '10',

    staveOption: '20 - 12mm',

    hoopType: 'Die-Cast',

    hardwareColor: 'Chrome',

    scorchDepth: 'Blackened',
  },

  {
    label: 'Thin re-ring 14 read',

    size: '14',

    depth: '6.5',

    lugs: '10',

    staveOption: '10 - 7mm + $150 (Re-Rings Required)',

    hoopType: 'Triple Flange',

    hardwareColor: 'Chrome',

    scorchDepth: 'Light Torch',
  },
];

function toNumber(value, fallback = 5) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value, places = 2) {
  return Number(Number(value || 0).toFixed(places));
}

function getAxisDelta(profile = {}, axis) {
  return toNumber(profile?.[axis], 5) - 5;
}

function getAxisDeltaFixed(profile = {}, axis) {
  return round(getAxisDelta(profile, axis), 2);
}

function getSortedAxes(profile = {}) {
  return [...AXES].sort((a, b) => {
    const aValue = toNumber(profile?.[a], 5);

    const bValue = toNumber(profile?.[b], 5);

    return bValue - aValue;
  });
}

function getProfileSpread(profile = {}) {
  const values = AXES.map((axis) => toNumber(profile?.[axis], 5));

  const highest = Math.max(...values);

  const lowest = Math.min(...values);

  return round(highest - lowest, 2);
}

function getProfileMovementScore(profile = {}) {
  const movement = AXES.reduce((sum, axis) => {
    return sum + Math.abs(getAxisDelta(profile, axis));
  }, 0);

  return round(movement, 2);
}

function getInputSignature(input = {}) {
  return [
    input.size,

    input.depth,

    input.lugs,

    input.staveOption,

    input.hoopType,

    input.hardwareColor,

    input.scorchDepth,
  ].join('|');
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

function hasReRings(input = {}) {
  return (
    String(input.staveOption || '')
      .toLowerCase()
      .includes('re-rings') ||
    String(input.staveOption || '').includes('+ $150')
  );
}

function isThinShell(input = {}) {
  return String(input.staveOption || '').includes('7mm');
}

function isSmallThinShell(input = {}) {
  return String(input.staveOption || '').includes('8mm');
}

function isThickShell(input = {}) {
  return String(input.staveOption || '').includes('12mm');
}

function createTestInputs() {
  const inputs = [];

  Object.entries(TEST_DEPTHS_BY_SIZE).forEach(([size, depths]) => {
    depths.forEach((depth) => {
      const lugMap = TEST_STAVE_OPTIONS_BY_SIZE_AND_LUGS[size] || {};

      Object.entries(lugMap).forEach(([lugs, staveOptions]) => {
        staveOptions.forEach((staveOption) => {
          TEST_HOOPS.forEach((hoopType) => {
            TEST_HARDWARE.forEach((hardwareColor) => {
              TEST_FINISHES.forEach((scorchDepth) => {
                inputs.push({
                  ...DEFAULT_BENCHMARK,

                  size,

                  depth,

                  lugs,

                  staveOption,

                  hoopType,

                  hardwareColor,

                  scorchDepth,
                });
              });
            });
          });
        });
      });
    });
  });

  return inputs;
}

function buildProfileDeltas(profile = {}) {
  return AXES.reduce((acc, axis) => {
    acc[axis] = getAxisDeltaFixed(profile, axis);

    return acc;
  }, {});
}

function summarizeRelationships(read = {}) {
  const relationships = buildKeyRelationships(read).slice(0, 3);

  return relationships.map((relationship, index) => ({
    rank: index + 1,

    id: relationship.id,

    slotKey: relationship.slotKey,

    title: relationship.title,

    nodes: Array.isArray(relationship.nodes)
      ? relationship.nodes.join(' / ')
      : '',

    score: round(relationship.score, 4),

    summary: relationship.summary,
  }));
}

function buildSanityWarnings(input = {}, read = {}) {
  const warnings = [];

  const profile = read.profile || {};

  const depth = Number(input.depth);

  const size = String(input.size);

  const lugs = String(input.lugs);

  const isDeep = depth >= 7;

  const isVeryDeep = depth >= 7.5;

  const isShallow = depth <= 5;

  const isDieCast = input.hoopType === 'Die-Cast';

  const isTripleFlange = input.hoopType === 'Triple Flange';

  const finish = String(input.scorchDepth || '').toLowerCase();

  const isBlackened = finish.includes('black');

  const isLight = finish.includes('light');

  const reRings = hasReRings(input);

  const thinShell = isThinShell(input);

  const smallThinShell = isSmallThinShell(input);

  const thickShell = isThickShell(input);

  const isThickHighLugShell = size === '14' && lugs === '10' && thickShell;

  const attackDelta = getAxisDelta(profile, 'attack');

  const brightnessDelta = getAxisDelta(profile, 'brightness');

  const projectionDelta = getAxisDelta(profile, 'projection');

  const sustainDelta = getAxisDelta(profile, 'sustain');

  const warmthDelta = getAxisDelta(profile, 'warmth');

  const sensitivityDelta = getAxisDelta(profile, 'sensitivity');

  const controlDelta = getAxisDelta(profile, 'control');

  const spread = getProfileSpread(profile);

  const movementScore = getProfileMovementScore(profile);

  if (spread < 0.55) {
    warnings.push(
      'Voice profile may be too flat. The graph/readout may not visibly change enough.'
    );
  }

  if (movementScore < 1.45) {
    warnings.push(
      'Total profile movement is low. This configuration may feel too similar to the center/reference.'
    );
  }

  if (
    isDeep &&
    sustainDelta < -0.35 &&
    !(isThickHighLugShell && (isDieCast || isBlackened) && controlDelta > 0.65)
  ) {
    warnings.push('Deep shell is reading unexpectedly low on sustain.');
  }

  if (
    isDeep &&
    warmthDelta < -0.35 &&
    !(isThickHighLugShell && projectionDelta > 0.75)
  ) {
    warnings.push('Deep shell is reading unexpectedly low on warmth.');
  }

  if (isShallow && attackDelta < -0.45 && !(reRings && isTripleFlange)) {
    warnings.push('Shallow shell is reading unexpectedly low on attack.');
  }

  if (
    isDieCast &&
    controlDelta < -0.4 &&
    !(
      reRings &&
      (size === '12' || isDeep) &&
      (sustainDelta > 0.25 || sensitivityDelta > 0.35)
    )
  ) {
    warnings.push('Die-Cast hoop is reading unexpectedly low on control.');
  }

  if (
    isDieCast &&
    sustainDelta > 1.25 &&
    !(reRings && isVeryDeep && warmthDelta > 0.65)
  ) {
    warnings.push('Die-Cast hoop may be allowing too much sustain increase.');
  }

  if (
    isTripleFlange &&
    sensitivityDelta < -1.05 &&
    !(isBlackened && isThickHighLugShell && controlDelta > 0.75)
  ) {
    warnings.push('Triple Flange read may be too insensitive.');
  }

  if (
    isBlackened &&
    controlDelta < -0.45 &&
    !(reRings && (smallThinShell || thinShell))
  ) {
    warnings.push('Blackened finish is reading unexpectedly low on control.');
  }

  if (
    isLight &&
    sensitivityDelta < -0.65 &&
    !(isThickHighLugShell && projectionDelta > 0.85)
  ) {
    warnings.push('Light finish did not preserve enough sensitivity.');
  }

  if (
    reRings &&
    controlDelta < -0.75 &&
    !(sustainDelta > 0.75 || warmthDelta > 0.55 || sensitivityDelta > 0.35)
  ) {
    warnings.push('Re-rings are reading unexpectedly low on control.');
  }

  if (isBlackened && isDieCast && controlDelta < 0.15 && !reRings) {
    warnings.push(
      'Blackened + Die-Cast build is not gaining expected control.'
    );
  }

  if (
    isLight &&
    isTripleFlange &&
    sensitivityDelta < -0.55 &&
    !isThickHighLugShell
  ) {
    warnings.push(
      'Light Torch + Triple Flange build may be losing too much touch response.'
    );
  }

  if (
    isDeep &&
    isTripleFlange &&
    !isBlackened &&
    sustainDelta < -0.15 &&
    warmthDelta < 0.15
  ) {
    warnings.push(
      'Deep Triple Flange build may not be preserving enough bloom.'
    );
  }

  if (isDieCast && isBlackened && controlDelta <= sustainDelta && !reRings) {
    warnings.push(
      'Focused Die-Cast + Blackened build should generally place control above sustain.'
    );
  }

  if (isShallow && attackDelta <= warmthDelta && !reRings) {
    warnings.push(
      'Shallow non-re-ring build should usually read with attack leading warmth.'
    );
  }

  if (isDeep && warmthDelta <= brightnessDelta && !isBlackened) {
    warnings.push(
      'Deep non-blackened build should usually read warmer than brighter.'
    );
  }

  return warnings;
}

function summarizeRead(input = {}, read = {}) {
  const profile = read.profile || {};

  const sortedAxes = getSortedAxes(profile);

  const keyRelationships = summarizeRelationships(read);

  const warnings = buildSanityWarnings(input, read);

  return {
    label: buildTestCaseLabel(input),

    signature: getInputSignature(input),

    input,

    profile,

    deltas: buildProfileDeltas(profile),

    spread: getProfileSpread(profile),

    movementScore: getProfileMovementScore(profile),

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

    keyRelationships,

    topRelationshipId: keyRelationships[0]?.id || '',

    topRelationshipTitle: keyRelationships[0]?.title || '',

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

function buildComparisonRows(results = []) {
  const bySignature = new Map();

  results.forEach((result) => {
    bySignature.set(result.signature, result);
  });

  const comparisonPairs = [
    {
      label:
        '12x6.0 → 12x6.5 / 8 lugs / 16 - 10mm / Triple Flange / Medium Torch',

      from: {
        size: '12',

        depth: '6.0',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },

      to: {
        size: '12',

        depth: '6.5',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },
    },

    {
      label:
        '14x6.0 → 14x6.5 / 8 lugs / 16 - 10mm / Triple Flange / Medium Torch',

      from: {
        size: '14',

        depth: '6.0',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },

      to: {
        size: '14',

        depth: '6.5',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },
    },

    {
      label: '14x6.5 / 8 lugs / 16 - 10mm → 14x6.5 / 10 lugs / 20 - 12mm',

      from: {
        size: '14',

        depth: '6.5',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },

      to: {
        size: '14',

        depth: '6.5',

        lugs: '10',

        staveOption: '20 - 12mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },
    },

    {
      label: '14x6.5 / Triple Flange → Die-Cast',

      from: {
        size: '14',

        depth: '6.5',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },

      to: {
        size: '14',

        depth: '6.5',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Die-Cast',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },
    },

    {
      label: '14x6.5 / Medium Torch → Blackened',

      from: {
        size: '14',

        depth: '6.5',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Medium Torch',
      },

      to: {
        size: '14',

        depth: '6.5',

        lugs: '8',

        staveOption: '16 - 10mm',

        hoopType: 'Triple Flange',

        hardwareColor: 'Chrome',

        scorchDepth: 'Blackened',
      },
    },
  ];

  return comparisonPairs.map((pair) => {
    const fromResult = bySignature.get(getInputSignature(pair.from));

    const toResult = bySignature.get(getInputSignature(pair.to));

    if (!fromResult || !toResult) {
      return {
        comparison: pair.label,

        status: 'missing case',
      };
    }

    const axisDeltas = AXES.reduce((acc, axis) => {
      const fromValue = toNumber(fromResult.profile?.[axis], 5);

      const toValue = toNumber(toResult.profile?.[axis], 5);

      acc[axis] = round(toValue - fromValue, 2);

      return acc;
    }, {});

    const totalMovement = AXES.reduce((sum, axis) => {
      return sum + Math.abs(axisDeltas[axis]);
    }, 0);

    return {
      comparison: pair.label,

      totalMovement: round(totalMovement, 2),

      topRelationshipFrom: fromResult.topRelationshipTitle,

      topRelationshipTo: toResult.topRelationshipTitle,

      changedTopRelationship:
        fromResult.topRelationshipId !== toResult.topRelationshipId,

      ...axisDeltas,
    };
  });
}

function printResult(result = {}, index = 0, collapsed = true) {
  const method = collapsed ? console.groupCollapsed : console.group;

  method(`${index + 1}. ${result.label}`);

  console.log('Input:', result.input);

  console.log('Profile:', result.profile);

  console.log('Deltas from Heritage center:', result.deltas);

  console.log('Spread:', result.spread);

  console.log('Movement Score:', result.movementScore);

  console.log('Highest Axes:', result.highestAxes);

  console.log('Lowest Axes:', result.lowestAxes);

  console.log('Key Relationships:');

  console.table(result.keyRelationships);

  console.log('Primary Genre:', result.primaryGenre);

  console.log('Secondary Genres:', result.secondaryGenres);

  console.log('Recording Mic:', result.recordingMic);

  console.log('Playing Situation:', result.playingSituation);

  console.log('Feel Read:', result.feelRead);

  console.log(
    'Highlighted Characteristics:',
    result.highlightedCharacteristics
  );

  console.log('Source Build Read:', result.sourceBuildRead);

  console.log('Benchmark:', result.benchmark);

  if (result.warnings.length > 0) {
    console.warn('Sanity Warnings:', result.warnings);
  } else {
    console.log('Sanity Warnings: none');
  }

  console.groupEnd();
}

export function runHeritageVoiceReadTestMatrix({
  limit,

  onlyWarnings = false,

  collapsed = true,

  focusOnly = false,

  includeComparisons = true,
} = {}) {
  const rawInputs = focusOnly
    ? FOCUS_CASES.map((item) => ({
        ...DEFAULT_BENCHMARK,

        ...item,
      }))
    : createTestInputs();

  const hasLimit = limit !== undefined && limit !== null && limit !== '';

  const selectedInputs =
    hasLimit && Number.isFinite(Number(limit))
      ? rawInputs.slice(0, Number(limit))
      : rawInputs;

  const results = selectedInputs.map((input) => {
    const read = buildHeritageVoiceRead(input);

    return summarizeRead(input, read);
  });

  const visibleResults = onlyWarnings
    ? results.filter((result) => result.warnings.length > 0)
    : results;

  const warningCount = results.filter(
    (result) => result.warnings.length > 0
  ).length;

  const flatCount = results.filter((result) => result.spread < 0.55).length;

  const lowMovementCount = results.filter(
    (result) => result.movementScore < 1.45
  ).length;

  const relationshipCounts = results.reduce((acc, result) => {
    const key = result.topRelationshipTitle || 'None';

    acc[key] = (acc[key] || 0) + 1;

    return acc;
  }, {});

  console.clear();

  console.log(
    '%cHeritage LegacyPrint™ Voice Read Test Matrix',

    'font-size: 16px; font-weight: bold;'
  );

  console.table({
    totalGeneratedCases: results.length,

    visibleCases: visibleResults.length,

    warningCases: warningCount,

    flatProfileCases: flatCount,

    lowMovementCases: lowMovementCount,

    onlyWarnings,

    focusOnly,
  });

  console.log('Top Relationship Distribution:');

  console.table(
    Object.entries(relationshipCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([relationship, count]) => ({
        relationship,

        count,
      }))
  );

  if (includeComparisons && !focusOnly) {
    console.log('Targeted Change Comparisons:');

    console.table(buildComparisonRows(results));
  }

  visibleResults.forEach((result, index) => {
    printResult(result, index, collapsed);
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

  console.log('Spread:', summary.spread);

  console.log('Movement Score:', summary.movementScore);

  console.log('Highest Axes:', summary.highestAxes);

  console.log('Lowest Axes:', summary.lowestAxes);

  console.log('Key Relationships:');

  console.table(summary.keyRelationships);

  console.log('Primary Genre:', summary.primaryGenre);

  console.log('Secondary Genres:', summary.secondaryGenres);

  console.log('Recording Mic:', summary.recordingMic);

  console.log('Playing Situation:', summary.playingSituation);

  console.log('Feel Read:', summary.feelRead);

  console.log(
    'Highlighted Characteristics:',
    summary.highlightedCharacteristics
  );

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

export function runHeritageVoiceReadFocusedTests() {
  return runHeritageVoiceReadTestMatrix({
    focusOnly: true,

    collapsed: false,

    includeComparisons: false,
  });
}

export default runHeritageVoiceReadTestMatrix;
