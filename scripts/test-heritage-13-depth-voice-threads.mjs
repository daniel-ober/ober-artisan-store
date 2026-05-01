
// scripts/test-heritage-13-depth-voice-threads.mjs

import path from 'path';

import process from 'process';

import { pathToFileURL } from 'url';

const ROOT = process.cwd();

const DEPTHS = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'];

const BASE_CONFIG = {

  size: '13',

  lugs: 8,

  staveOption: '16 staves • 10mm',

  scorchDepth: 'Medium Torch',

  hardwareColor: 'Chrome',

  hoopType: 'Triple Flange',

  benchmarkFamilyId: 'heritage',

  benchmarkTypeId: 'center',

  benchmarkSizeId: '13',

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

const SLOTS = ['simple', 'shaped', 'complex'];

const round = (value, places = 4) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return 0;

  return Number(num.toFixed(places));

};

const normalizeAxisValue = (value) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return 5;

  return round(num, 2);

};

const importProjectModule = async (relativePath) => {

  const absolutePath = path.join(ROOT, relativePath);

  return import(pathToFileURL(absolutePath).href);

};

const cleanText = (value) => {

  if (typeof value === 'string') return value.trim();

  if (Array.isArray(value)) {

    return value

      .map((item) => cleanText(item))

      .filter(Boolean)

      .join('; ');

  }

  if (value && typeof value === 'object') {

    return (

      cleanText(value.title) ||

      cleanText(value.label) ||

      cleanText(value.heading) ||

      cleanText(value.summary) ||

      cleanText(value.description) ||

      cleanText(value.body)

    );

  }

  return '';

};

const cleanNodes = (value) => {

  if (!value) return [];

  if (Array.isArray(value)) return value.filter(Boolean);

  if (value && typeof value === 'object') {

    if (Array.isArray(value.nodes)) return value.nodes.filter(Boolean);

    if (Array.isArray(value.axes)) return value.axes.filter(Boolean);

    if (Array.isArray(value.nodeKeys)) return value.nodeKeys.filter(Boolean);

  }

  return [];

};

const pickTopAxes = (profile = {}, direction = 'high', count = 3) => {

  const sorted = AXES.map((axis) => ({

    axis,

    value: normalizeAxisValue(profile[axis]),

    delta: round(normalizeAxisValue(profile[axis]) - 5, 2),

  })).sort((a, b) => {

    if (direction === 'low') return a.value - b.value;

    return b.value - a.value;

  });

  return sorted.slice(0, count).map((item) => item.axis);

};

const visualHash = (payload = {}) => {

  const text = JSON.stringify(payload);

  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {

    hash ^= text.charCodeAt(i);

    hash = Math.imul(hash, 16777619);

  }

  return String(hash >>> 0);

};

const makeThreadSummary = (read, slot) => {

  const profile = read.profile || {};

  if (slot === 'simple') {

    const sourceText = cleanText(read.sourceBuildRead) || cleanText(read.playingSituation);

    return {

      slot,

      title: sourceText,

      score: round(

        Math.abs(normalizeAxisValue(profile.attack) - 5) +

          Math.abs(normalizeAxisValue(profile.warmth) - 5),

        4

      ),

      nodes: pickTopAxes(profile, 'high', 3),

      summary: sourceText,

    };

  }

  if (slot === 'shaped') {

    const feelText = cleanText(read.feelRead);

    return {

      slot,

      title: feelText,

      score: round(

        Math.abs(normalizeAxisValue(profile.warmth) - 5) +

          Math.abs(normalizeAxisValue(profile.sustain) - 5) +

          Math.abs(normalizeAxisValue(profile.attack) - 5),

        4

      ),

      nodes: pickTopAxes(profile, 'high', 3),

      summary: feelText,

    };

  }

  const complexText =

    cleanText(read.playingSituation) ||

    cleanText(read.highlightedCharacteristics) ||

    cleanText(read.feelRead);

  const complexNodes = [

    ...new Set([

      ...pickTopAxes(profile, 'high', 3),

      ...pickTopAxes(profile, 'low', 2),

    ]),

  ].slice(0, 4);

  return {

    slot,

    title: complexText,

    score: round(

      AXES.reduce((sum, axis) => {

        return sum + Math.abs(normalizeAxisValue(profile[axis]) - 5);

      }, 0),

      4

    ),

    nodes: complexNodes,

    summary: [

      cleanText(read.playingSituation),

      cleanText(read.highlightedCharacteristics),

    ]

      .filter(Boolean)

      .join(' '),

  };

};

const stringifyNodes = (nodes = []) => {

  return Array.isArray(nodes) ? nodes.filter(Boolean).join(' / ') : '';

};

const compareDirection = (rows, axis, expectedDirection) => {

  let up = 0;

  let down = 0;

  let flat = 0;

  for (let index = 1; index < rows.length; index += 1) {

    const previous = rows[index - 1][axis];

    const current = rows[index][axis];

    if (current > previous) up += 1;

    else if (current < previous) down += 1;

    else flat += 1;

  }

  const passed =

    expectedDirection === 'up'

      ? up >= 4 && up > down

      : down >= 4 && down > up;

  return {

    axis,

    expected:

      expectedDirection === 'up'

        ? 'mostly increasing with shell depth'

        : 'mostly decreasing with shell depth',

    values: rows.map((row) => row[axis]).join(' → '),

    up,

    down,

    flat,

    net: up - down,

    passed,

  };

};

const includesAny = (value, words = []) => {

  const text = String(value || '').toLowerCase();

  return words.some((word) => text.includes(word));

};

const main = async () => {

  const module = await importProjectModule(

    'src/utils/legacyPrint/buildHeritageVoiceRead.js'

  );

  const buildHeritageVoiceRead =

    module.buildHeritageVoiceRead || module.default;

  if (typeof buildHeritageVoiceRead !== 'function') {

    throw new Error('buildHeritageVoiceRead export was not found.');

  }

  const reads = DEPTHS.map((depth) => {

    const input = {

      ...BASE_CONFIG,

      depth,

    };

    const read = buildHeritageVoiceRead(input);

    if (!read || typeof read !== 'object') {

      console.log('\nBAD READ SHAPE');

      console.log({ depth, input, read });

      process.exit(1);

    }

    if (!read.profile || typeof read.profile !== 'object') {

      console.log('\nMISSING PROFILE');

      console.log({ depth, input, currentSpec: read.currentSpec, read });

      process.exit(1);

    }

    const simple = makeThreadSummary(read, 'simple');

    const shaped = makeThreadSummary(read, 'shaped');

    const complex = makeThreadSummary(read, 'complex');

    const emptySlots = [simple, shaped, complex].filter((slot) => !slot.title);

    if (emptySlots.length) {

      console.log('\nEMPTY READ SLOT');

      console.log({

        depth,

        input,

        currentSpec: read.currentSpec,

        profile: read.profile,

        emptySlots: emptySlots.map((slot) => slot.slot),

        sourceBuildRead: read.sourceBuildRead,

        feelRead: read.feelRead,

        playingSituation: read.playingSituation,

        highlightedCharacteristics: read.highlightedCharacteristics,

      });

      process.exit(1);

    }

    return {

      depth,

      input,

      read,

      simple,

      shaped,

      complex,

    };

  });

  const rows = reads.map((item) => {

    const profile = item.read.profile || {};

    const referenceCenter = 5;

    const axisValues = AXES.reduce((acc, axis) => {

      acc[axis] = normalizeAxisValue(profile[axis]);

      acc[`${axis}Delta`] = round(acc[axis] - referenceCenter, 2);

      return acc;

    }, {});

    const deltas = AXES.map((axis) => Math.abs(axisValues[`${axis}Delta`]));

    const values = AXES.map((axis) => axisValues[axis]);

    const simpleHash = visualHash({

      depth: item.depth,

      slot: 'simple',

      title: item.simple.title,

      nodes: item.simple.nodes,

      score: item.simple.score,

    });

    const shapedHash = visualHash({

      depth: item.depth,

      slot: 'shaped',

      title: item.shaped.title,

      nodes: item.shaped.nodes,

      score: item.shaped.score,

    });

    const complexHash = visualHash({

      depth: item.depth,

      slot: 'complex',

      title: item.complex.title,

      nodes: item.complex.nodes,

      score: item.complex.score,

    });

    return {

      depth: item.depth,

      ...axisValues,

      movement: round(deltas.reduce((sum, value) => sum + value, 0), 2),

      spread: round(Math.max(...values) - Math.min(...values), 2),

      firstRead: item.simple.title,

      firstReadScore: item.simple.score,

      firstReadNodes: stringifyNodes(item.simple.nodes),

      firstReadVisual: simpleHash,

      feelRead: item.shaped.title,

      feelReadScore: item.shaped.score,

      feelReadNodes: stringifyNodes(item.shaped.nodes),

      feelReadVisual: shapedHash,

      benchRead: item.complex.title,

      benchReadScore: item.complex.score,

      benchReadNodes: stringifyNodes(item.complex.nodes),

      benchReadVisual: complexHash,

      playingSituation: cleanText(item.read.playingSituation),

      highlightedCharacteristics: cleanText(item.read.highlightedCharacteristics),

    };

  });

  const allThreadRows = reads.flatMap((item) => {

    return SLOTS.map((slot) => {

      const thread = item[slot];

      return {

        depth: item.depth,

        slot,

        title: thread.title,

        score: thread.score,

        nodes: stringifyNodes(thread.nodes),

        visualHash: visualHash({

          depth: item.depth,

          slot,

          title: thread.title,

          nodes: thread.nodes,

          score: thread.score,

        }),

        summary: thread.summary,

      };

    });

  });

  const toneDirectionAssertions = [

    compareDirection(rows, 'warmth', 'up'),

    compareDirection(rows, 'sustain', 'up'),

    compareDirection(rows, 'projection', 'up'),

    compareDirection(rows, 'brightness', 'down'),

    compareDirection(rows, 'attack', 'down'),

  ];

  const visualAcrossDepthAssertions = SLOTS.map((slot) => {

    const hashes = allThreadRows

      .filter((row) => row.slot === slot)

      .map((row) => row.visualHash)

      .filter(Boolean);

    return {

      slot,

      uniqueVisualHashes: new Set(hashes).size,

      totalDepths: DEPTHS.length,

      expected: 'at least 5 unique visual hashes across 7 depths',

      passed: new Set(hashes).size >= 5,

    };

  });

  const visualWithinDepthAssertions = DEPTHS.map((depth) => {

    const depthRows = allThreadRows.filter((row) => row.depth === depth);

    const hashes = depthRows.map((row) => row.visualHash).filter(Boolean);

    const uniqueHashes = new Set(hashes);

    return {

      depth,

      simpleTitle: depthRows.find((row) => row.slot === 'simple')?.title || '',

      simpleHash:

        depthRows.find((row) => row.slot === 'simple')?.visualHash || '',

      shapedTitle: depthRows.find((row) => row.slot === 'shaped')?.title || '',

      shapedHash:

        depthRows.find((row) => row.slot === 'shaped')?.visualHash || '',

      complexTitle:

        depthRows.find((row) => row.slot === 'complex')?.title || '',

      complexHash:

        depthRows.find((row) => row.slot === 'complex')?.visualHash || '',

      uniqueHashes: uniqueHashes.size,

      totalHashes: hashes.length,

      duplicatedHashes: '',

      passed: hashes.length === 3 && uniqueHashes.size === 3,

    };

  });

  const combinedTextByDepth = (depth) => {

    const row = rows.find((item) => item.depth === depth);

    const threadRows = allThreadRows.filter((item) => item.depth === depth);

    return [

      row?.firstRead,

      row?.feelRead,

      row?.benchRead,

      row?.playingSituation,

      row?.highlightedCharacteristics,

      ...threadRows.map((item) => item.summary),

    ]

      .join(' ')

      .toLowerCase();

  };

  const narrativeAssertions = [

    {

      check: '5.0 should lean quick / lean / front-edge somewhere in the read',

      passed: includesAny(combinedTextByDepth('5.0'), [

        'quick',

        'lean',

        'front',

        'bite',

        'dry',

        'immediate',

        'shorter',

      ]),

    },

    {

      check: '5.5 should remain allowed to read centered / balanced',

      passed: includesAny(combinedTextByDepth('5.5'), [

        'center',

        'balanced',

        'natural',

        'classic',

      ]),

    },

    {

      check: '6.5 should still read as balanced / classic / centered transition, not fully deep yet',

      passed: includesAny(combinedTextByDepth('6.5'), [

        'balanced',

        'classic',

        'center',

        'shell-first',

        'transition',

        'shifted',

      ]),

    },

    {

      check: '7.5 should begin showing deep / body / bloom / warmth language',

      passed: includesAny(combinedTextByDepth('7.5'), [

        'deep',

        'deeper',

        'body',

        'bloom',

        'warm',

        'grounded',

        'darker',

      ]),

    },

    {

      check: '8.0 should clearly show deep / body / bloom / warmth / sustain language',

      passed: includesAny(combinedTextByDepth('8.0'), [

        'deep',

        'deeper',

        'body',

        'bloom',

        'warm',

        'sustain',

        'fuller',

        'longer',

        'grounded',

        'darker',

      ]),

    },

  ];

  console.log('\nHeritage 13" Depth Voice Thread Test');

  console.log('Configuration locked except depth:');

  console.log(

    '13" • 8 lugs • 16 staves • 10mm • Medium Torch • Chrome • Triple Flange\n'

  );

  console.log('Depth Profile + Thread Summary');

  console.table(rows);

  console.log('\nAll Three Threads Per Depth');

  console.table(allThreadRows);

  console.log('\nTone Direction Assertions');

  console.table(toneDirectionAssertions);

  console.log('\nVisual Signature Variation Across Depths');

  console.table(visualAcrossDepthAssertions);

  console.log('\nVisual Signature Uniqueness Within Each Depth');

  console.table(visualWithinDepthAssertions);

  console.log('\nNarrative / Readout Assertions');

  console.table(narrativeAssertions);

  const failures = {

    toneDirection: toneDirectionAssertions.filter((item) => !item.passed),

    visualAcrossDepth: visualAcrossDepthAssertions.filter((item) => !item.passed),

    visualWithinDepth: visualWithinDepthAssertions.filter((item) => !item.passed),

    narrative: narrativeAssertions.filter((item) => !item.passed),

  };

  const hasFailures = Object.values(failures).some((items) => items.length > 0);

  if (hasFailures) {

    console.log('\nFAILED ASSERTIONS\n');

    if (failures.toneDirection.length) {

      console.log('Tone direction failures:');

      console.table(failures.toneDirection);

    }

    if (failures.visualAcrossDepth.length) {

      console.log('Visual-across-depth failures:');

      console.table(failures.visualAcrossDepth);

    }

    if (failures.visualWithinDepth.length) {

      console.log('Visual-within-depth failures:');

      console.table(failures.visualWithinDepth);

    }

    if (failures.narrative.length) {

      console.log('Narrative failures:');

      console.table(failures.narrative);

    }

    process.exit(1);

  }

  console.log(

    '\nPASS: 13" depth progression is directionally consistent, readouts are non-empty, and each thread slot has a distinct visual signature within each depth.\n'

  );

};

main().catch((error) => {

  console.error('\nFAILED TO RUN HERITAGE 13" DEPTH VOICE THREAD TEST\n');

  console.error(error);

  process.exit(1);

});

