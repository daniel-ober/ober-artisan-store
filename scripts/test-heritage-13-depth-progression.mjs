import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

import { buildKeyRelationships } from '../src/utils/legacyPrint/heritageKeyRelationships.js';

import buildVoiceThreadReadout from '../src/utils/legacyPrint/buildVoiceThreadReadout.js';

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

const DEPTHS_13 = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'];

const BASE_13_CONFIG = {

  size: '13',

  lugs: '8',

  staveOption: '16 - 10mm',

  hoopType: 'Triple Flange',

  hardwareColor: 'Chrome',

  scorchDepth: 'Medium Torch',

};

function round(value, places = 2) {

  return Number(Number(value || 0).toFixed(places));

}

function getProfileValue(profile, axis) {

  return Number(profile?.[axis] ?? 5);

}

function deltaFromCenter(profile, axis) {

  return round(getProfileValue(profile, axis) - 5, 2);

}

function getSpread(profile) {

  const values = AXES.map((axis) => getProfileValue(profile, axis));

  return round(Math.max(...values) - Math.min(...values), 2);

}

function getMovement(profile) {

  return round(

    AXES.reduce((sum, axis) => {

      return sum + Math.abs(deltaFromCenter(profile, axis));

    }, 0),

    2

  );

}

function getProfileSignature(profile) {

  return AXES.map((axis) => `${axis}:${round(profile?.[axis] ?? 5, 2)}`).join(

    '|'

  );

}

function getAxisDeltas(profile) {

  return AXES.reduce((acc, axis) => {

    acc[axis] = deltaFromCenter(profile, axis);

    return acc;

  }, {});

}

function getAxisValues(profile) {

  return AXES.reduce((acc, axis) => {

    acc[axis] = round(profile?.[axis] ?? 5, 2);

    return acc;

  }, {});

}

function compareProfiles(previousResult, currentResult) {

  if (!previousResult || !currentResult) {

    return null;

  }

  const axisChanges = AXES.reduce((acc, axis) => {

    acc[axis] = round(

      getProfileValue(currentResult.profile, axis) -

        getProfileValue(previousResult.profile, axis),

      2

    );

    return acc;

  }, {});

  const totalAxisMovement = round(

    AXES.reduce((sum, axis) => {

      return sum + Math.abs(axisChanges[axis]);

    }, 0),

    2

  );

  const profileChanged =

    previousResult.profileSignature !== currentResult.profileSignature;

  const topThreadChanged =

    previousResult.topThreadId !== currentResult.topThreadId;

  const sourceReadChanged =

    String(previousResult.sourceBuildRead || '') !==

    String(currentResult.sourceBuildRead || '');

  const highlightedChanged =

    String(previousResult.highlightedCharacteristics || '') !==

    String(currentResult.highlightedCharacteristics || '');

  return {

    from: previousResult.depth,

    to: currentResult.depth,

    totalAxisMovement,

    profileChanged,

    topThreadChanged,

    sourceReadChanged,

    highlightedChanged,

    attack: axisChanges.attack,

    brightness: axisChanges.brightness,

    projection: axisChanges.projection,

    sustain: axisChanges.sustain,

    warmth: axisChanges.warmth,

    sensitivity: axisChanges.sensitivity,

    control: axisChanges.control,

  };

}

function readDepth(depth) {

  const input = {

    ...DEFAULT_BENCHMARK,

    ...BASE_13_CONFIG,

    depth,

  };

  const read = buildHeritageVoiceRead(input);

  const profile = read.profile || {};

  const relationships = buildKeyRelationships(read).slice(0, 3);

  const topThread = relationships[0] || null;

  const topThreadReadout = topThread

    ? buildVoiceThreadReadout({

        thread: topThread,

        profile,

        sourceBuildRead: read.sourceBuildRead || '',

      })

    : null;

  return {

    label: `13x${depth}`,

    size: input.size,

    depth,

    input,

    profile,

    profileSignature: getProfileSignature(profile),

    axisValues: getAxisValues(profile),

    axisDeltas: getAxisDeltas(profile),

    spread: getSpread(profile),

    movement: getMovement(profile),

    topThreadId: topThread?.id || 'none',

    topThreadTitle: topThread?.title || 'None',

    topThreadSlot: topThread?.slotKey || 'none',

    topThreadScore: round(topThread?.score || 0, 4),

    topThreadNodes: Array.isArray(topThread?.nodes)

      ? topThread.nodes.join(' / ')

      : '',

    topThreadReadName: topThreadReadout?.threadName || '',

    topThreadIntensity: topThreadReadout?.intensityLabel || '',

    sourceBuildRead: read.sourceBuildRead || '',

    playingSituation: read.playingSituation || '',

    highlightedCharacteristics: read.highlightedCharacteristics || '',

    relationships: relationships.map((relationship, index) => {

      const readout = buildVoiceThreadReadout({

        thread: relationship,

        profile,

        sourceBuildRead: read.sourceBuildRead || '',

      });

      return {

        rank: index + 1,

        id: relationship.id,

        slot: relationship.slotKey,

        title: relationship.title,

        score: round(relationship.score, 4),

        nodes: Array.isArray(relationship.nodes)

          ? relationship.nodes.join(' / ')

          : '',

        readName: readout?.threadName || '',

        intensity: readout?.intensityLabel || '',

      };

    }),

  };

}

function printHeader(title) {

  console.log('\n');

  console.log('='.repeat(90));

  console.log(title);

  console.log('='.repeat(90));

}

function analyzeProgression(results, comparisons) {

  const duplicateProfileGroups = results.reduce((acc, result) => {

    if (!acc[result.profileSignature]) {

      acc[result.profileSignature] = [];

    }

    acc[result.profileSignature].push(result.label);

    return acc;

  }, {});

  const duplicateProfiles = Object.values(duplicateProfileGroups).filter(

    (group) => group.length > 1

  );

  const weakComparisons = comparisons.filter((comparison) => {

    return comparison.totalAxisMovement < 0.25;

  });

  const identicalReadComparisons = comparisons.filter((comparison) => {

    return (

      comparison.sourceReadChanged === false &&

      comparison.highlightedChanged === false

    );

  });

  const unchangedThreadComparisons = comparisons.filter((comparison) => {

    return comparison.topThreadChanged === false;

  });

  return {

    duplicateProfiles,

    weakComparisons,

    identicalReadComparisons,

    unchangedThreadComparisons,

    hasDuplicateProfiles: duplicateProfiles.length > 0,

    hasWeakComparisons: weakComparisons.length > 0,

    hasIdenticalReadComparisons: identicalReadComparisons.length > 0,

    allTopThreadsSame:

      unchangedThreadComparisons.length === comparisons.length &&

      comparisons.length > 0,

  };

}

const results = DEPTHS_13.map(readDepth);

const comparisons = results

  .map((result, index) => {

    if (index === 0) return null;

    return compareProfiles(results[index - 1], result);

  })

  .filter(Boolean);

const analysis = analyzeProgression(results, comparisons);

printHeader('13-INCH HERITAGE DEPTH PROGRESSION — SUMMARY');

console.table(

  results.map((result) => ({

    build: result.label,

    spread: result.spread,

    movement: result.movement,

    topThread: result.topThreadTitle,

    slot: result.topThreadSlot,

    threadScore: result.topThreadScore,

    attack: result.axisDeltas.attack,

    brightness: result.axisDeltas.brightness,

    projection: result.axisDeltas.projection,

    sustain: result.axisDeltas.sustain,

    warmth: result.axisDeltas.warmth,

    sensitivity: result.axisDeltas.sensitivity,

    control: result.axisDeltas.control,

  }))

);

printHeader('13-INCH HERITAGE DEPTH PROGRESSION — STEP-BY-STEP MOVEMENT');

console.table(

  comparisons.map((comparison) => ({

    change: `${comparison.from} → ${comparison.to}`,

    totalAxisMovement: comparison.totalAxisMovement,

    profileChanged: comparison.profileChanged,

    topThreadChanged: comparison.topThreadChanged,

    sourceReadChanged: comparison.sourceReadChanged,

    highlightedChanged: comparison.highlightedChanged,

    attack: comparison.attack,

    brightness: comparison.brightness,

    projection: comparison.projection,

    sustain: comparison.sustain,

    warmth: comparison.warmth,

    sensitivity: comparison.sensitivity,

    control: comparison.control,

  }))

);

printHeader('13-INCH HERITAGE DEPTH PROGRESSION — THREAD DETAILS');

results.forEach((result) => {

  console.log(`\n${result.label}`);

  console.log('-'.repeat(90));

  console.log(`Source build read: ${result.sourceBuildRead}`);

  console.log(`Highlighted: ${result.highlightedCharacteristics}`);

  console.log(`Playing situation: ${result.playingSituation}`);

  console.table(result.relationships);

});

printHeader('13-INCH HERITAGE DEPTH PROGRESSION — VALIDATION FLAGS');

if (analysis.hasDuplicateProfiles) {

  console.log('\nFAIL: Duplicate VoiceMap profiles found.');

  console.table(

    analysis.duplicateProfiles.map((group) => ({

      duplicateBuilds: group.join(' / '),

    }))

  );

} else {

  console.log('\nPASS: No duplicate VoiceMap profiles across 13-inch depths.');

}

if (analysis.hasWeakComparisons) {

  console.log('\nFAIL: Weak depth steps found. These likely need stronger depth shaping.');

  console.table(

    analysis.weakComparisons.map((comparison) => ({

      change: `${comparison.from} → ${comparison.to}`,

      totalAxisMovement: comparison.totalAxisMovement,

    }))

  );

} else {

  console.log('\nPASS: Every adjacent 13-inch depth step has meaningful axis movement.');

}

if (analysis.hasIdenticalReadComparisons) {

  console.log('\nFAIL: Some adjacent depth steps keep identical read language.');

  console.table(

    analysis.identicalReadComparisons.map((comparison) => ({

      change: `${comparison.from} → ${comparison.to}`,

      sourceReadChanged: comparison.sourceReadChanged,

      highlightedChanged: comparison.highlightedChanged,

    }))

  );

} else {

  console.log('\nPASS: Adjacent depth steps produce changed read language.');

}

if (analysis.allTopThreadsSame) {

  console.log(

    '\nWARNING: Top Voice Thread never changes across 13-inch depths. This may be acceptable only if thread intensity, score, and read language still move clearly.'

  );

} else {

  console.log('\nPASS: Top Voice Thread changes at least once across the 13-inch range.');

}

printHeader('READ THIS');

console.log(

  'Ideal result: no duplicate profiles, no adjacent movement below 0.25, and read language changing across the depth path.'

);

console.log(

  'If 5.0 → 5.5, 6.0 → 6.5, or 7.5 → 8.0 is below 0.25 totalAxisMovement, buildHeritageVoiceRead.js needs stronger depth sensitivity.'

);

console.log(

  'If VoiceMap values move but text does not, the issue is likely sourceBuildRead/highlight copy selection rather than scoring.'

);

console.log(

  'If the Node report looks good but the browser still looks identical, the issue is likely SpiderChart display amplification, memo state, chart rendering, or CSS.'

);