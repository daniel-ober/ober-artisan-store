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

const FLAT_PROFILE_THRESHOLD = 0.3;

const LOW_MOVEMENT_THRESHOLD = 0.75;

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

function getToneSignature(input = {}) {
  return [
    input.size,
    input.depth,
    input.lugs,
    input.staveOption,
    input.hoopType,
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

function buildToneCaseLabel(input = {}) {
  return [
    `${input.size}x${input.depth}`,
    `${input.lugs} lugs`,
    input.staveOption,
    input.hoopType,
    input.scorchDepth,
  ].join(' • ');
}

function hasReRings(input = {}) {
  return (
    String(input.staveOption || '')

      .toLowerCase()

      .includes('re-rings') || String(input.staveOption || '').includes('+ $150')
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
    nodes: Array.isArray(relationship.nodes) ? relationship.nodes.join(' / ') : '',
    score: round(relationship.score, 4),
    summary: relationship.summary,
    visualSignatureHash: relationship.visualSignatureHash || '',
    uniqueBenchShapeKey: relationship.uniqueBenchShapeKey || '',
    visualSignature: relationship.visualSignature || null,
  }));
}

function getBenchRelationship(keyRelationships = []) {
  return (
    keyRelationships.find((relationship) => relationship.slotKey === 'complex') ||

    null
  );
}

function createIssue(severity, message) {
  return {
    severity,
    message,
  };
}

function buildSanityIssues(input = {}, read = {}, keyRelationships = []) {
  const issues = [];

  const profile = read.profile || {};

  const benchRelationship = getBenchRelationship(keyRelationships);

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

  if (spread < FLAT_PROFILE_THRESHOLD) {
    issues.push(
      createIssue(
        'info',
        'Voice profile may be too flat. The graph/readout may not visibly change enough.'
      )
    );
  }

  if (movementScore < LOW_MOVEMENT_THRESHOLD) {
    issues.push(
      createIssue(
        'info',
        'Total profile movement is low. This configuration may feel too similar to the center/reference.'
      )
    );
  }

  if (benchRelationship && !benchRelationship.visualSignatureHash) {
    issues.push(
      createIssue(
        'warning',
        'Bench / Complex thread is missing a unique visual signature hash.'
      )
    );
  }

  if (benchRelationship && !benchRelationship.uniqueBenchShapeKey) {
    issues.push(
      createIssue(
        'warning',
        'Bench / Complex thread is missing a unique bench shape key.'
      )
    );
  }

const isControlledDeepBuild =

  isDeep &&

  (isDieCast || isBlackened) &&

  controlDelta >= 0.5 &&

  attackDelta >= 0.35;

const isAcceptableFocusedDeepSustain =

  isControlledDeepBuild &&

  sustainDelta >= -0.5 &&

  (projectionDelta >= 0.25 || warmthDelta >= 0.05);

if (
  isDeep &&

  sustainDelta < -0.35 &&

  !isAcceptableFocusedDeepSustain &&

  !(isThickHighLugShell && (isDieCast || isBlackened) && controlDelta > 0.65)
) {
  issues.push(
    createIssue('warning', 'Deep shell is reading unexpectedly low on sustain.')
  );
}

  if (
    isDeep &&

    warmthDelta < -0.35 &&

    !(isThickHighLugShell && projectionDelta > 0.75)
  ) {
    issues.push(
      createIssue('warning', 'Deep shell is reading unexpectedly low on warmth.')
    );
  }

  if (isShallow && attackDelta < -0.45 && !(reRings && isTripleFlange)) {
    issues.push(
      createIssue('warning', 'Shallow shell is reading unexpectedly low on attack.')
    );
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
    issues.push(
      createIssue('warning', 'Die-Cast hoop is reading unexpectedly low on control.')
    );
  }

  if (
    isDieCast &&

    sustainDelta > 1.25 &&

    !(reRings && isVeryDeep && warmthDelta > 0.65)
  ) {
    issues.push(
      createIssue(
        'warning',
        'Die-Cast hoop may be allowing too much sustain increase.'
      )
    );
  }

  if (
    isTripleFlange &&

    sensitivityDelta < -1.05 &&

    !(isBlackened && isThickHighLugShell && controlDelta > 0.75)
  ) {
    issues.push(createIssue('warning', 'Triple Flange read may be too insensitive.'));
  }

  if (
    isBlackened &&

    controlDelta < -0.45 &&

    !(reRings && (smallThinShell || thinShell))
  ) {
    issues.push(
      createIssue(
        'warning',
        'Blackened finish is reading unexpectedly low on control.'
      )
    );
  }

  if (isLight && sensitivityDelta < -0.65 && !(isThickHighLugShell && projectionDelta > 0.85)) {
    issues.push(
      createIssue('warning', 'Light finish did not preserve enough sensitivity.')
    );
  }

  if (
    reRings &&

    controlDelta < -0.75 &&

    !(sustainDelta > 0.75 || warmthDelta > 0.55 || sensitivityDelta > 0.35)
  ) {
    issues.push(
      createIssue('warning', 'Re-rings are reading unexpectedly low on control.')
    );
  }

  if (isBlackened && isDieCast && controlDelta < 0.15 && !reRings) {
    issues.push(
      createIssue(
        'warning',
        'Blackened + Die-Cast build is not gaining expected control.'
      )
    );
  }

  if (isLight && isTripleFlange && sensitivityDelta < -0.55 && !isThickHighLugShell) {
    issues.push(
      createIssue(
        'warning',
        'Light Torch + Triple Flange build may be losing too much touch response.'
      )
    );
  }

  if (isDeep && isTripleFlange && !isBlackened && sustainDelta < -0.15 && warmthDelta < 0.15) {
    issues.push(
      createIssue(
        'warning',
        'Deep Triple Flange build may not be preserving enough bloom.'
      )
    );
  }

  if (isDieCast && isBlackened && controlDelta <= sustainDelta && !reRings) {
    issues.push(
      createIssue(
        'warning',
        'Focused Die-Cast + Blackened build should generally place control above sustain.'
      )
    );
  }

  if (isShallow && attackDelta <= warmthDelta && !reRings) {
    issues.push(
      createIssue(
        'warning',
        'Shallow non-re-ring build should usually read with attack leading warmth.'
      )
    );
  }

  const isCompactFocusedLightDeep =

    size === '12' &&

    isDeep &&

    isLight &&

    isDieCast &&

    !reRings &&

    brightnessDelta - warmthDelta <= 0.25;

  /**

   * This sanity check is intentionally softer than the old version.

   * Light Torch and thin/re-ring variants can keep brightness present even on

   * deeper shells, so only warn when warmth is clearly behind brightness.

   */

 const isCompactMediumTorchDeep =

  size === '12' &&

  isDeep &&

  !isBlackened &&

  !isLight &&

  !reRings;

const isFocusedMediumTorchDeep =

  isDeep &&

  !isBlackened &&

  !isLight &&

  isDieCast &&

  controlDelta >= 0.35 &&

  attackDelta >= 0.35;

if (
  isDeep &&

  warmthDelta + 0.22 <= brightnessDelta &&

  !isBlackened &&

  !isLight &&

  !isCompactFocusedLightDeep &&

  !isCompactMediumTorchDeep &&

  !isFocusedMediumTorchDeep &&

  !reRings
) {
  issues.push(
    createIssue(
      'warning',
      'Deep non-blackened build should usually read warmer than brighter.'
    )
  );
}

  return issues;
}

function summarizeRead(input = {}, read = {}) {
  const profile = read.profile || {};

  const sortedAxes = getSortedAxes(profile);

  const keyRelationships = summarizeRelationships(read);

  const benchRelationship = getBenchRelationship(keyRelationships);

  const issues = buildSanityIssues(input, read, keyRelationships);

  const warnings = issues

    .filter((issue) => issue.severity === 'warning')

    .map((issue) => issue.message);

  const infoNotes = issues

    .filter((issue) => issue.severity === 'info')

    .map((issue) => issue.message);

  return {
    label: buildTestCaseLabel(input),
    toneLabel: buildToneCaseLabel(input),
    signature: getInputSignature(input),
    toneSignature: getToneSignature(input),
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
    benchRelationshipId: benchRelationship?.id || '',
    benchRelationshipTitle: benchRelationship?.title || '',
    benchVisualSignatureHash: benchRelationship?.visualSignatureHash || '',
    uniqueBenchShapeKey: benchRelationship?.uniqueBenchShapeKey || '',
    benchVisualSignature: benchRelationship?.visualSignature || null,
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
    issues,
    warnings,
    infoNotes,
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
      label:

        '14x6.5 / 8 lugs / 16 - 10mm → 14x6.5 / 10 lugs / 20 - 12mm',
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
      label: '14x6.5 / 8 lugs / Triple Flange → Die-Cast',
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
      label:

        '14x6.5 / 10 lugs / 20 - 12mm / Blackened / Triple Flange → Die-Cast',
      from: {
        size: '14',
        depth: '6.5',
        lugs: '10',
        staveOption: '20 - 12mm',
        hoopType: 'Triple Flange',
        hardwareColor: 'Chrome',
        scorchDepth: 'Blackened',
      },
      to: {
        size: '14',
        depth: '6.5',
        lugs: '10',
        staveOption: '20 - 12mm',
        hoopType: 'Die-Cast',
        hardwareColor: 'Chrome',
        scorchDepth: 'Blackened',
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
      benchRelationshipFrom: fromResult.benchRelationshipTitle,
      benchRelationshipTo: toResult.benchRelationshipTitle,
      changedBenchRelationship:

        fromResult.benchRelationshipId !== toResult.benchRelationshipId,
      benchSignatureFrom: fromResult.benchVisualSignatureHash,
      benchSignatureTo: toResult.benchVisualSignatureHash,
      changedBenchVisualSignature:

        fromResult.benchVisualSignatureHash !== toResult.benchVisualSignatureHash,
      ...axisDeltas,
    };
  });
}

function countBy(results = [], getter) {
  return results.reduce((acc, result) => {
    const key = getter(result) || 'None';

    acc[key] = (acc[key] || 0) + 1;

    return acc;
  }, {});
}

function countMessages(results = [], fieldName) {
  return results.reduce((acc, result) => {
    (result[fieldName] || []).forEach((message) => {
      acc[message] = (acc[message] || 0) + 1;
    });

    return acc;
  }, {});
}

function getToneUniqueResults(results = []) {
  const byToneSignature = new Map();

  results.forEach((result) => {
    if (!byToneSignature.has(result.toneSignature)) {
      byToneSignature.set(result.toneSignature, result);
    }
  });

  return [...byToneSignature.values()];
}

function getDuplicateBenchShapeGroups(results = []) {
  const byHash = new Map();

  results.forEach((result) => {
    const key = result.benchVisualSignatureHash || '';

    if (!key) return;

    if (!byHash.has(key)) {
      byHash.set(key, []);
    }

    byHash.get(key).push(result);
  });

  return [...byHash.entries()]

    .map(([visualSignatureHash, groupedResults]) => {
      const uniqueToneSignatures = [
        ...new Set(groupedResults.map((result) => result.toneSignature)),
      ];

      const uniqueToneLabels = [
        ...new Set(groupedResults.map((result) => result.toneLabel)),
      ];

      const hardwareOnlyDuplicate =

        uniqueToneSignatures.length === 1 && groupedResults.length > 1;

      return {
        visualSignatureHash,
        count: groupedResults.length,
        toneSignatureCount: uniqueToneSignatures.length,
        hardwareOnlyDuplicate,
        benchRelationshipTitles: [
          ...new Set(groupedResults.map((result) => result.benchRelationshipTitle)),
        ].join(' | '),
        labels: groupedResults.map((result) => result.label),
        toneLabels: uniqueToneLabels,
      };
    })

    .filter((group) => group.toneSignatureCount > 1)

    .sort((a, b) => b.toneSignatureCount - a.toneSignatureCount);
}

function getHardwareOnlyBenchShapeGroups(results = []) {
  const byHash = new Map();

  results.forEach((result) => {
    const key = result.benchVisualSignatureHash || '';

    if (!key) return;

    if (!byHash.has(key)) {
      byHash.set(key, []);
    }

    byHash.get(key).push(result);
  });

  return [...byHash.entries()]

    .map(([visualSignatureHash, groupedResults]) => {
      const uniqueToneSignatures = [
        ...new Set(groupedResults.map((result) => result.toneSignature)),
      ];

      if (uniqueToneSignatures.length !== 1 || groupedResults.length <= 1) {
        return null;
      }

      return {
        visualSignatureHash,
        count: groupedResults.length,
        benchRelationshipTitles: [
          ...new Set(groupedResults.map((result) => result.benchRelationshipTitle)),
        ].join(' | '),
        toneLabel: groupedResults[0]?.toneLabel || '',
        hardwareVariants: groupedResults

          .map((result) => result.input?.hardwareColor)

          .filter(Boolean)

          .join(' | '),
      };
    })

    .filter(Boolean)

    .sort((a, b) => b.count - a.count);
}

function toDuplicateBenchShapeRows(duplicateGroups = []) {
  return duplicateGroups.map((group) => ({
    visualSignatureHash: group.visualSignatureHash,
    caseCount: group.count,
    toneSignatureCount: group.toneSignatureCount,
    benchRelationshipTitles: group.benchRelationshipTitles,
    firstToneCase: group.toneLabels?.[0] || '',
    secondToneCase: group.toneLabels?.[1] || '',
  }));
}

function toHardwareOnlyDuplicateRows(groups = []) {
  return groups.map((group) => ({
    visualSignatureHash: group.visualSignatureHash,
    count: group.count,
    benchRelationshipTitles: group.benchRelationshipTitles,
    toneLabel: group.toneLabel,
    hardwareVariants: group.hardwareVariants,
  }));
}

function toInspectionRows(results = []) {
  return results.map((item) => ({
    label: item.label,
    toneLabel: item.toneLabel,
    topRelationshipTitle: item.topRelationshipTitle,
    benchRelationshipTitle: item.benchRelationshipTitle,
    benchVisualSignatureHash: item.benchVisualSignatureHash,
    movementScore: item.movementScore,
    spread: item.spread,
    warnings: item.warnings?.join(' | '),
    infoNotes: item.infoNotes?.join(' | '),
    attack: item.profile?.attack,
    brightness: item.profile?.brightness,
    projection: item.profile?.projection,
    sustain: item.profile?.sustain,
    warmth: item.profile?.warmth,
    sensitivity: item.profile?.sensitivity,
    control: item.profile?.control,
    topKeyRelationships: item.keyRelationships

      ?.map((rel) => `${rel.title} (${rel.score})`)

      .join(' | '),
  }));
}

function printResult(result = {}, index = 0, collapsed = true) {
  const method = collapsed ? console.groupCollapsed : console.group;

  method(`${index + 1}. ${result.label}`);

  console.log('Tone Signature:', result.toneSignature);

  console.log('Tone Label:', result.toneLabel);

  console.log('Input:', result.input);

  console.log('Profile:', result.profile);

  console.log('Deltas from Heritage center:', result.deltas);

  console.log('Spread:', result.spread);

  console.log('Movement Score:', result.movementScore);

  console.log('Highest Axes:', result.highestAxes);

  console.log('Lowest Axes:', result.lowestAxes);

  console.log('Key Relationships:');

  console.table(result.keyRelationships);

  console.log('Bench Relationship:', {
    id: result.benchRelationshipId,
    title: result.benchRelationshipTitle,
    visualSignatureHash: result.benchVisualSignatureHash,
    uniqueBenchShapeKey: result.uniqueBenchShapeKey,
    visualSignature: result.benchVisualSignature,
  });

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

  if (result.infoNotes.length > 0) {
    console.info('Info Notes:', result.infoNotes);
  } else {
    console.log('Info Notes: none');
  }

  console.groupEnd();
}

function exposeDebugGlobals(matrix) {
  if (typeof window === 'undefined') return;

  window.heritageVoiceReadMatrix = matrix;

  window.allHeritageCases = matrix.allCases;

  window.toneUniqueHeritageCases = matrix.toneUniqueCases;

  window.visibleHeritageCases = matrix.visibleCases;

  window.warningHeritageCases = matrix.warningCases;

  window.infoHeritageCases = matrix.infoCases;

  window.duplicateBenchShapeGroups = matrix.duplicateBenchShapeGroups;

  window.hardwareOnlyBenchShapeGroups = matrix.hardwareOnlyBenchShapeGroups;

  window.warnings = matrix.warningCases;

  window.inspectHeritageAllCases = (limit = 30) => {
    const rows = toInspectionRows(matrix.allCases.slice(0, limit));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageToneUniqueCases = (limit = 30) => {
    const rows = toInspectionRows(matrix.toneUniqueCases.slice(0, limit));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageVisibleCases = (limit = 30) => {
    const rows = toInspectionRows(matrix.visibleCases.slice(0, limit));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageWarnings = (limit = 30) => {
    const rows = toInspectionRows(matrix.warningCases.slice(0, limit));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageInfoNotes = (limit = 30) => {
    const rows = toInspectionRows(matrix.infoCases.slice(0, limit));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageWarningReasons = () => {
    const rows = Object.entries(matrix.warningReasonCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([warning, count]) => ({
        warning,
        count,
      }));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageInfoReasons = () => {
    const rows = Object.entries(matrix.infoReasonCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([note, count]) => ({
        note,
        count,
      }));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageRelationships = () => {
    const rows = Object.entries(matrix.relationshipCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([relationship, count]) => ({
        relationship,
        count,
      }));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageBenchRelationships = () => {
    const rows = Object.entries(matrix.benchRelationshipCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([relationship, count]) => ({
        relationship,
        count,
      }));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageBenchShapeHashes = () => {
    const rows = Object.entries(matrix.benchShapeHashCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([visualSignatureHash, count]) => ({
        visualSignatureHash,
        count,
      }));

    console.table(rows);

    return rows;
  };

  window.inspectHeritageDuplicateBenchShapes = () => {
    const rows = toDuplicateBenchShapeRows(matrix.duplicateBenchShapeGroups);

    console.table(rows);

    return rows;
  };

  window.inspectHeritageHardwareOnlyBenchShapes = () => {
    const rows = toHardwareOnlyDuplicateRows(matrix.hardwareOnlyBenchShapeGroups);

    console.table(rows);

    return rows;
  };

  window.inspectHeritageComparisons = () => {
    console.table(matrix.comparisonRows);

    return matrix.comparisonRows;
  };
}

export function runHeritageVoiceReadTestMatrix({
  limit,
  onlyWarnings = false,
  onlyInfo = false,
  collapsed = true,
  focusOnly = false,
  includeComparisons = true,
  printDetails = false,
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

  const toneUniqueResults = getToneUniqueResults(results);

  const duplicateBenchShapeGroups = getDuplicateBenchShapeGroups(results);

  const hardwareOnlyBenchShapeGroups = getHardwareOnlyBenchShapeGroups(results);

  const warningResults = results.filter((result) => result.warnings.length > 0);

  const infoResults = results.filter((result) => result.infoNotes.length > 0);

  const visibleResults = onlyWarnings

    ? warningResults

    : onlyInfo

      ? infoResults

      : results;

  const flatCount = results.filter((result) => result.spread < 0.3).length;

  const lowMovementCount = results.filter(
    (result) => result.movementScore < 0.75
  ).length;

  const missingBenchShapeHashCount = results.filter(
    (result) => !result.benchVisualSignatureHash
  ).length;

  const duplicateBenchShapeCaseCount = duplicateBenchShapeGroups.reduce(
    (sum, group) => sum + group.count,
    0
  );

  const relationshipCounts = countBy(
    toneUniqueResults,
    (result) => result.topRelationshipTitle
  );

  const benchRelationshipCounts = countBy(
    toneUniqueResults,
    (result) => result.benchRelationshipTitle
  );

  const benchShapeHashCounts = countBy(
    toneUniqueResults,
    (result) => result.benchVisualSignatureHash
  );

  const warningReasonCounts = countMessages(warningResults, 'warnings');

  const infoReasonCounts = countMessages(infoResults, 'infoNotes');

  const comparisonRows =

    includeComparisons && !focusOnly ? buildComparisonRows(results) : [];

  const shouldPrintDetails =

    printDetails || focusOnly || onlyWarnings || onlyInfo || hasLimit;

  const matrixSummary = {
    totalGeneratedCases: results.length,
    toneUniqueCases: toneUniqueResults.length,
    visibleCases: visibleResults.length,
    warningCases: warningResults.length,
    infoCases: infoResults.length,
    flatProfileCases: flatCount,
    lowMovementCases: lowMovementCount,
    missingBenchShapeHashCases: missingBenchShapeHashCount,
    duplicateToneBenchShapeGroups: duplicateBenchShapeGroups.length,
    duplicateToneBenchShapeCases: duplicateBenchShapeCaseCount,
    hardwareOnlyBenchShapeGroups: hardwareOnlyBenchShapeGroups.length,
    uniqueBenchShapeHashes: Object.keys(benchShapeHashCounts).filter(Boolean).length,
    onlyWarnings,
    onlyInfo,
    focusOnly,
    printDetails: shouldPrintDetails,
  };

  const matrix = {
    summary: matrixSummary,
    allCases: results,
    toneUniqueCases: toneUniqueResults,
    visibleCases: visibleResults,
    warningCases: warningResults,
    infoCases: infoResults,
    relationshipCounts,
    benchRelationshipCounts,
    benchShapeHashCounts,
    warningReasonCounts,
    infoReasonCounts,
    duplicateBenchShapeGroups,
    hardwareOnlyBenchShapeGroups,
    comparisonRows,
  };

  exposeDebugGlobals(matrix);

  console.clear();

  console.log(
    '%cHeritage LegacyPrint™ Voice Read Test Matrix',
    'font-size: 16px; font-weight: bold;'
  );

  console.table(matrixSummary);

  console.log('Top Relationship Distribution — tone unique only:');

  console.table(
    Object.entries(relationshipCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([relationship, count]) => ({
        relationship,
        count,
      }))
  );

  console.log('Bench / Complex Relationship Distribution — tone unique only:');

  console.table(
    Object.entries(benchRelationshipCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([relationship, count]) => ({
        relationship,
        count,
      }))
  );

  console.log('Bench / Complex Visual Signature Distribution — tone unique only:');

  console.table(
    Object.entries(benchShapeHashCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([visualSignatureHash, count]) => ({
        visualSignatureHash,
        count,
      }))
  );

  console.log('Duplicate Bench / Complex Visual Shape Groups — tone-affecting only:');

  console.table(toDuplicateBenchShapeRows(duplicateBenchShapeGroups));

  console.log('Hardware-only Bench Shape Groups — expected / allowed:');

  console.table(toHardwareOnlyDuplicateRows(hardwareOnlyBenchShapeGroups).slice(0, 25));

  console.log('Warning Reason Distribution:');

  console.table(
    Object.entries(warningReasonCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([warning, count]) => ({
        warning,
        count,
      }))
  );

  console.log('Info Note Distribution:');

  console.table(
    Object.entries(infoReasonCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([note, count]) => ({
        note,
        count,
      }))
  );

  if (includeComparisons && !focusOnly) {
    console.log('Targeted Change Comparisons:');

    console.table(comparisonRows);
  }

  console.log('Saved debug globals:', {
    matrix: 'window.heritageVoiceReadMatrix',
    allCases: 'window.allHeritageCases',
    toneUniqueCases: 'window.toneUniqueHeritageCases',
    visibleCases: 'window.visibleHeritageCases',
    warningCases: 'window.warningHeritageCases',
    infoCases: 'window.infoHeritageCases',
    duplicateBenchShapeGroups: 'window.duplicateBenchShapeGroups',
    hardwareOnlyBenchShapeGroups: 'window.hardwareOnlyBenchShapeGroups',
    warningsAlias: 'window.warnings',
  });

  console.log('Inspection helpers:', {
    allCases: 'window.inspectHeritageAllCases(limit)',
    toneUniqueCases: 'window.inspectHeritageToneUniqueCases(limit)',
    visibleCases: 'window.inspectHeritageVisibleCases(limit)',
    warnings: 'window.inspectHeritageWarnings(limit)',
    warningReasons: 'window.inspectHeritageWarningReasons()',
    infoNotes: 'window.inspectHeritageInfoNotes(limit)',
    infoReasons: 'window.inspectHeritageInfoReasons()',
    relationships: 'window.inspectHeritageRelationships()',
    benchRelationships: 'window.inspectHeritageBenchRelationships()',
    benchShapeHashes: 'window.inspectHeritageBenchShapeHashes()',
    duplicateBenchShapes: 'window.inspectHeritageDuplicateBenchShapes()',
    hardwareOnlyBenchShapes: 'window.inspectHeritageHardwareOnlyBenchShapes()',
    comparisons: 'window.inspectHeritageComparisons()',
  });

  if (shouldPrintDetails) {
    visibleResults.forEach((result, index) => {
      printResult(result, index, collapsed);
    });
  } else {
    console.log(
      'Detail output skipped. Run runHeritageVoiceReadTestMatrix({ printDetails: true }) to print every case.'
    );
  }

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

  console.log('Tone Signature:', summary.toneSignature);

  console.log('Tone Label:', summary.toneLabel);

  console.log('Input:', resolvedInput);

  console.log('Profile:', summary.profile);

  console.log('Deltas from Heritage center:', summary.deltas);

  console.log('Spread:', summary.spread);

  console.log('Movement Score:', summary.movementScore);

  console.log('Highest Axes:', summary.highestAxes);

  console.log('Lowest Axes:', summary.lowestAxes);

  console.log('Key Relationships:');

  console.table(summary.keyRelationships);

  console.log('Bench Relationship:', {
    id: summary.benchRelationshipId,
    title: summary.benchRelationshipTitle,
    visualSignatureHash: summary.benchVisualSignatureHash,
    uniqueBenchShapeKey: summary.uniqueBenchShapeKey,
    visualSignature: summary.benchVisualSignature,
  });

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

  if (summary.infoNotes.length > 0) {
    console.info('Info Notes:', summary.infoNotes);
  } else {
    console.log('Info Notes: none');
  }

  console.groupEnd();

  return summary;
}

export function runHeritageVoiceReadFocusedTests() {
  return runHeritageVoiceReadTestMatrix({
    focusOnly: true,
    collapsed: false,
    includeComparisons: false,
    printDetails: true,
  });
}

export default runHeritageVoiceReadTestMatrix;