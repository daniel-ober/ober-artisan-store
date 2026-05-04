// scripts/test-heritage-13-depth-voice-threads.mjs

import fs from 'fs';

import path from 'path';

import process from 'process';

import { pathToFileURL } from 'url';

const ROOT = process.cwd();

const DEPTHS = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'];

const BASE_CONFIG = {

  diameter: '13',

  lugQuantity: '8',

  staveQuantity: '16',

  shellThickness: '10mm',

  finish: 'Medium Torch',

  hardwareFinish: 'Chrome',

  hoopType: 'Triple Flange',

  bearingEdge: '45° inner bearing edge with softened outer roundover',

  snareBed: 'Standard',

  batterHead: 'Remo Ambassador Coated',

  resonantHead: 'Remo Ambassador Hazy Snare Side',

  snareWires: 'PureSound Custom Pro Steel 20-Strand',

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

const SLOT_KEYS = ['simple', 'shaped', 'complex'];

const SLOT_LABELS = {

  simple: 'firstRead',

  shaped: 'feelRead',

  complex: 'benchRead',

};

const FILE_CANDIDATES = {

  buildHeritageVoiceRead: [

    'src/utils/legacyPrint/buildHeritageVoiceRead.js',

    'src/utils/legacyPrint/buildHeritageVoiceRead.mjs',

  ],

  benchmarkCatalog: [

    'src/data/legacyPrint/benchmarkCatalog.js',

    'src/data/legacyPrint/benchmarkCatalog.mjs',

  ],

};

const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

const resolveFirstExisting = (candidates = []) => {

  return candidates.find((candidate) => exists(candidate)) || null;

};

const importProjectModule = async (relativePath) => {

  const absolutePath = path.join(ROOT, relativePath);

  const url = pathToFileURL(absolutePath).href;

  return import(url);

};

const round = (value, places = 4) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return 0;

  return Number(num.toFixed(places));

};

const stringifyNodes = (nodes = []) => {

  if (!Array.isArray(nodes)) return '';

  return nodes.filter(Boolean).join(' / ');

};

const getValue = (...values) => {

  return values.find((value) => value !== undefined && value !== null);

};

const normalizeAxisValue = (value) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return 5;

  return round(num, 2);

};

const makeConfigForDepth = (depth) => ({

  ...BASE_CONFIG,

  depth,

});

const normalizeConfigForEngine = (config = {}) => {

  return {

    ...config,

    size: `${config.diameter}x${config.depth}`,

    diameter: Number(config.diameter),

    depth: Number(config.depth),

    lugs: Number(config.lugQuantity),

    lugCount: Number(config.lugQuantity),

    lugQuantity: Number(config.lugQuantity),

    staveCount: Number(config.staveQuantity),

    staveQuantity: Number(config.staveQuantity),

    thickness: config.shellThickness,

    shellThickness: config.shellThickness,

    finish: config.finish,

    shellFinish: config.finish,

    hardware: config.hardwareFinish,

    hardwareFinish: config.hardwareFinish,

    hoops: config.hoopType,

    hoopType: config.hoopType,

    bearingEdge: config.bearingEdge,

    snareBed: config.snareBed,

    batterHead: config.batterHead,

    resonantHead: config.resonantHead,

    snareWires: config.snareWires,

  };

};

const getPossibleProfile = (read = {}) => {

  return (

    read.profile ||

    read.voiceProfile ||

    read.currentBuildVoiceRangeSummary ||

    read.VoiceMapping ||

    read.axisScores ||

    read.scores ||

    read.toneProfile ||

    {}

  );

};

const getPossibleThreads = (read = {}) => {

  const possible =

    read.voiceThreads ||

    read.threads ||

    read.threadReads ||

    read.currentVoiceThreads ||

    read.voiceThreadPaths ||

    [];

  if (Array.isArray(possible)) return possible;

  if (possible && typeof possible === 'object') {

    return Object.entries(possible).map(([slotKey, thread]) => ({

      slotKey,

      ...thread,

    }));

  }

  return [];

};

const findThreadBySlot = (threads = [], slotKey) => {

  const normalizedSlot = String(slotKey || '').toLowerCase();

  const exact = threads.find((thread) => {

    return String(thread?.slotKey || thread?.slot || '').toLowerCase() === normalizedSlot;

  });

  if (exact) return exact;

  if (normalizedSlot === 'simple') {

    return (

      threads.find((thread) => /first|simple/i.test(String(thread?.slotKey || thread?.slot || thread?.label || ''))) ||

      threads[0] ||

      null

    );

  }

  if (normalizedSlot === 'shaped') {

    return (

      threads.find((thread) => /feel|shaped/i.test(String(thread?.slotKey || thread?.slot || thread?.label || ''))) ||

      threads[1] ||

      null

    );

  }

  if (normalizedSlot === 'complex') {

    return (

      threads.find((thread) => /bench|complex/i.test(String(thread?.slotKey || thread?.slot || thread?.label || ''))) ||

      threads[2] ||

      null

    );

  }

  return null;

};

const getThreadScore = (thread = {}) => {

  return round(

    getValue(

      thread.score,

      thread.strengthScore,

      thread.weight,

      thread.threadScore,

      thread.relevanceScore,

      0

    ),

    4

  );

};

const getThreadHash = (thread = {}) => {

  return String(

    getValue(

      thread.visualSignatureHash,

      thread.visualHash,

      thread.uniqueBenchShapeKey,

      thread.visualSignature,

      thread.fingerprint,

      ''

    )

  );

};

const normalizeReadForDepth = ({ depth, read }) => {

  const profile = getPossibleProfile(read);

  const threads = getPossibleThreads(read);

  const simpleThread = findThreadBySlot(threads, 'simple') || {};

  const shapedThread = findThreadBySlot(threads, 'shaped') || {};

  const complexThread = findThreadBySlot(threads, 'complex') || {};

  const firstRead = simpleThread;

  const feelRead = shapedThread;

  const benchRead = complexThread;

  const axisValues = AXES.reduce((acc, axis) => {

    acc[axis] = normalizeAxisValue(profile?.[axis]);

    acc[`${axis}Delta`] = round(acc[axis] - 5, 2);

    return acc;

  }, {});

  const axisOnlyValues = AXES.map((axis) => axisValues[axis]);

  const spread = round(Math.max(...axisOnlyValues) - Math.min(...axisOnlyValues), 2);

  const movement = round(

    AXES.reduce((total, axis) => total + Math.abs(axisValues[axis] - 5), 0),

    2

  );

  return {

    depth,

    ...axisValues,

    movement,

    spread,

    firstRead: firstRead?.title || firstRead?.name || '',

    firstReadScore: getThreadScore(firstRead),

    firstReadNodes: stringifyNodes(firstRead?.nodes || firstRead?.axisKeys || []),

    firstReadVisual: getThreadHash(firstRead),

    feelRead: feelRead?.title || feelRead?.name || '',

    feelReadScore: getThreadScore(feelRead),

    feelReadNodes: stringifyNodes(feelRead?.nodes || feelRead?.axisKeys || []),

    feelReadVisual: getThreadHash(feelRead),

    benchRead: benchRead?.title || benchRead?.name || '',

    benchReadScore: getThreadScore(benchRead),

    benchReadNodes: stringifyNodes(benchRead?.nodes || benchRead?.axisKeys || []),

    benchReadVisual: getThreadHash(benchRead),

    playingSituation:

      read.playingSituation ||

      read.playingSituationSummary ||

      read.summary ||

      read.currentRead ||

      '',

    highlightedCharacteristics: Array.isArray(read.highlightedCharacteristics)

      ? read.highlightedCharacteristics.join('; ')

      : read.highlightedCharacteristics || read.characteristics || '',

  };

};

const callBuildHeritageVoiceRead = async ({ buildHeritageVoiceRead, benchmarkCatalog, config }) => {

  const normalizedConfig = normalizeConfigForEngine(config);

  const callShapes = [

    () =>

      buildHeritageVoiceRead({

        config: normalizedConfig,

        currentConfig: normalizedConfig,

        selectedConfig: normalizedConfig,

        benchmarkCatalog,

      }),

    () =>

      buildHeritageVoiceRead({

        currentConfig: normalizedConfig,

        benchmarkCatalog,

      }),

    () =>

      buildHeritageVoiceRead({

        selectedConfig: normalizedConfig,

        benchmarkCatalog,

      }),

    () =>

      buildHeritageVoiceRead({

        buildConfig: normalizedConfig,

        benchmarkCatalog,

      }),

    () => buildHeritageVoiceRead(normalizedConfig, benchmarkCatalog),

    () => buildHeritageVoiceRead(normalizedConfig),

  ];

  let lastError = null;

  for (const callShape of callShapes) {

    try {

      const result = await callShape();

      if (result && typeof result === 'object') {

        return result;

      }

    } catch (error) {

      lastError = error;

    }

  }

  throw lastError || new Error('Unable to call buildHeritageVoiceRead with known signatures.');

};

const getDirectionStats = (rows = [], axis, direction) => {

  const values = rows.map((row) => Number(row[axis]));

  let up = 0;

  let down = 0;

  let flat = 0;

  for (let index = 1; index < values.length; index += 1) {

    const prev = values[index - 1];

    const current = values[index];

    if (current > prev) up += 1;

    else if (current < prev) down += 1;

    else flat += 1;

  }

  const net = up - down;

  const passed =

    direction === 'up'

      ? up + flat >= 5 && net >= 4

      : down + flat >= 5 && net <= -4;

  return {

    axis,

    expected:

      direction === 'up'

        ? 'mostly increasing with shell depth'

        : 'mostly decreasing with shell depth',

    values: values.join(' → '),

    up,

    down,

    flat,

    net,

    passed,

  };

};

const getVisualAcrossDepthAssertions = (rows = []) => {

  return SLOT_KEYS.map((slotKey) => {

    const field = `${SLOT_LABELS[slotKey]}Visual`;

    const values = rows.map((row) => row[field]).filter(Boolean);

    const uniqueVisualHashes = new Set(values).size;

    return {

      slot: slotKey,

      uniqueVisualHashes,

      totalDepths: DEPTHS.length,

      expected: 'at least 5 unique visual hashes across 7 depths',

      passed: uniqueVisualHashes >= 5,

    };

  });

};

const getVisualWithinDepthAssertions = (rows = []) => {

  return rows.map((row) => {

    const values = [

      { slot: 'simple', title: row.firstRead, hash: row.firstReadVisual },

      { slot: 'shaped', title: row.feelRead, hash: row.feelReadVisual },

      { slot: 'complex', title: row.benchRead, hash: row.benchReadVisual },

    ];

    const grouped = values.reduce((acc, item) => {

      if (!item.hash) return acc;

      acc[item.hash] = acc[item.hash] || [];

      acc[item.hash].push(item.slot);

      return acc;

    }, {});

    const duplicatedHashes = Object.entries(grouped)

      .filter(([, slots]) => slots.length > 1)

      .map(([hash, slots]) => `${hash}: ${slots.join(' / ')}`);

    return {

      depth: row.depth,

      simpleTitle: row.firstRead,

      simpleHash: row.firstReadVisual,

      shapedTitle: row.feelRead,

      shapedHash: row.feelReadVisual,

      complexTitle: row.benchRead,

      complexHash: row.benchReadVisual,

      uniqueHashes: new Set(values.map((item) => item.hash).filter(Boolean)).size,

      totalHashes: values.filter((item) => item.hash).length,

      duplicatedHashes: duplicatedHashes.join('; '),

      passed: duplicatedHashes.length === 0,

    };

  });

};

const containsAny = (value = '', terms = []) => {

  const haystack = String(value || '').toLowerCase();

  return terms.some((term) => haystack.includes(String(term).toLowerCase()));

};

const getNarrativeAssertions = (rows = []) => {

  const byDepth = Object.fromEntries(rows.map((row) => [row.depth, row]));

  const textFor = (depth) => {

    const row = byDepth[depth] || {};

    return [

      row.firstRead,

      row.feelRead,

      row.benchRead,

      row.playingSituation,

      row.highlightedCharacteristics,

    ].join(' ');

  };

  return [

    {

      check: '5.0 should lean quick / lean / front-edge somewhere in the read',

      passed: containsAny(textFor('5.0'), [

        'quick',

        'lean',

        'front',

        'bite',

        'dry',

        'compact',

        'articulate',

      ]),

    },

    {

      check: '5.5 should remain allowed to read centered / balanced',

      passed: containsAny(textFor('5.5'), ['centered', 'balanced', 'center']),

    },

    {

      check: '6.5 should begin showing body / rounded / bloom / warmth language',

      passed: containsAny(textFor('6.5'), ['body', 'rounded', 'bloom', 'warm']),

    },

    {

      check: '8.0 should clearly show deep / body / bloom / warmth / sustain language',

      passed: containsAny(textFor('8.0'), ['deep', 'body', 'bloom', 'warm', 'sustain']),

    },

  ];

};

const printFailureSection = ({

  toneAssertions,

  visualAcrossDepthAssertions,

  visualWithinDepthAssertions,

  narrativeAssertions,

}) => {

  const failedTone = toneAssertions.filter((item) => !item.passed);

  const failedAcrossDepth = visualAcrossDepthAssertions.filter((item) => !item.passed);

  const failedWithinDepth = visualWithinDepthAssertions.filter((item) => !item.passed);

  const failedNarrative = narrativeAssertions.filter((item) => !item.passed);

  const hasFailures =

    failedTone.length ||

    failedAcrossDepth.length ||

    failedWithinDepth.length ||

    failedNarrative.length;

  if (!hasFailures) return false;

  console.log('\nFAILED ASSERTIONS');

  if (failedTone.length) {

    console.log('\nTone direction failures:');

    console.table(failedTone);

  }

  if (failedAcrossDepth.length) {

    console.log('\nVisual-across-depth failures:');

    console.table(failedAcrossDepth);

  }

  if (failedWithinDepth.length) {

    console.log('\nVisual-within-depth failures:');

    console.table(

      failedWithinDepth.map((item) => ({

        depth: item.depth,

        simpleTitle: item.simpleTitle,

        simpleHash: item.simpleHash,

        shapedTitle: item.shapedTitle,

        shapedHash: item.shapedHash,

        complexTitle: item.complexTitle,

        complexHash: item.complexHash,

        duplicatedHashes: item.duplicatedHashes,

      }))

    );

  }

  if (failedNarrative.length) {

    console.log('\nNarrative failures:');

    console.table(failedNarrative);

  }

  return true;

};

const main = async () => {

  const buildPath = resolveFirstExisting(FILE_CANDIDATES.buildHeritageVoiceRead);

  const benchmarkPath = resolveFirstExisting(FILE_CANDIDATES.benchmarkCatalog);

  if (!buildPath) {

    console.error('\nMissing required engine file.');

    console.error('Could not find one of:');

    FILE_CANDIDATES.buildHeritageVoiceRead.forEach((candidate) => {

      console.error(`- ${candidate}`);

    });

    process.exit(1);

  }

  const buildModule = await importProjectModule(buildPath);

  const benchmarkModule = benchmarkPath ? await importProjectModule(benchmarkPath) : {};

  const buildHeritageVoiceRead =

    buildModule.default ||

    buildModule.buildHeritageVoiceRead ||

    buildModule.getHeritageVoiceRead;

  const benchmarkCatalog =

    benchmarkModule.default ||

    benchmarkModule.LEGACYPRINT_BENCHMARK_CATALOG ||

    benchmarkModule.benchmarkCatalog ||

    benchmarkModule;

  if (typeof buildHeritageVoiceRead !== 'function') {

    console.error('\nCould not find buildHeritageVoiceRead export.');

    console.error(`Checked: ${buildPath}`);

    console.error('Expected a default export or named export called buildHeritageVoiceRead.');

    process.exit(1);

  }

  const rows = [];

  for (const depth of DEPTHS) {

    const config = makeConfigForDepth(depth);

    const read = await callBuildHeritageVoiceRead({

      buildHeritageVoiceRead,

      benchmarkCatalog,

      config,

    });

    rows.push(normalizeReadForDepth({ depth, read }));

  }

  const threadRows = rows.flatMap((row) => [

    {

      depth: row.depth,

      slot: 'simple',

      title: row.firstRead,

      score: row.firstReadScore,

      nodes: row.firstReadNodes,

      visualHash: row.firstReadVisual,

    },

    {

      depth: row.depth,

      slot: 'shaped',

      title: row.feelRead,

      score: row.feelReadScore,

      nodes: row.feelReadNodes,

      visualHash: row.feelReadVisual,

    },

    {

      depth: row.depth,

      slot: 'complex',

      title: row.benchRead,

      score: row.benchReadScore,

      nodes: row.benchReadNodes,

      visualHash: row.benchReadVisual,

    },

  ]);

  const toneAssertions = [

    getDirectionStats(rows, 'warmth', 'up'),

    getDirectionStats(rows, 'sustain', 'up'),

    getDirectionStats(rows, 'projection', 'up'),

    getDirectionStats(rows, 'brightness', 'down'),

    getDirectionStats(rows, 'attack', 'down'),

  ];

  const visualAcrossDepthAssertions = getVisualAcrossDepthAssertions(rows);

  const visualWithinDepthAssertions = getVisualWithinDepthAssertions(rows);

  const narrativeAssertions = getNarrativeAssertions(rows);

  console.log('\nHeritage 13" Depth Voice Thread Test');

  console.log('Configuration locked except depth:');

  console.log('13" • 8 lugs • 16 staves • 10mm • Medium Torch • Chrome • Triple Flange');

  console.log('\nDepth Profile + Thread Summary');

  console.table(rows);

  console.log('\nAll Three Threads Per Depth');

  console.table(threadRows);

  console.log('\nTone Direction Assertions');

  console.table(toneAssertions);

  console.log('\nVisual Signature Variation Across Depths');

  console.table(visualAcrossDepthAssertions);

  console.log('\nVisual Signature Uniqueness Within Each Depth');

  console.table(visualWithinDepthAssertions);

  console.log('\nNarrative / Readout Assertions');

  console.table(narrativeAssertions);

  const hasFailures = printFailureSection({

    toneAssertions,

    visualAcrossDepthAssertions,

    visualWithinDepthAssertions,

    narrativeAssertions,

  });

  if (hasFailures) {

    process.exit(1);

  }

  console.log(

    '\nPASS: 13" depth progression is directionally consistent, and each thread slot has a distinct visual signature within each depth.\n'

  );

};

main().catch((error) => {

  console.error('\nFAILED TO RUN HERITAGE 13" DEPTH VOICE THREAD TEST\n');

  console.error(error);

  process.exit(1);

});