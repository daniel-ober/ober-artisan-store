
// scripts/test-heritage-thickness-voice-threads.mjs

import fs from 'fs';

import path from 'path';

import process from 'process';

import { pathToFileURL } from 'url';

const ROOT = process.cwd();

const THICKNESS_OPTIONS = [

  '16 staves • 8mm',

  '16 staves • 10mm',

  '16 staves • 13mm',

];

const BASE_CONFIG = {

  size: '13',

  depth: '6.5',

  lugs: 8,

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

const FILE_CANDIDATES = {

  buildHeritageVoiceRead: [

    'src/utils/legacyPrint/buildHeritageVoiceRead.js',

    'src/utils/legacyPrint/buildHeritageVoiceRead.mjs',

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

const normalizeAxisValue = (value) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return 5;

  return round(num, 2);

};

const getText = (...values) => {

  const found = values.find(

    (value) => typeof value === 'string' && value.trim().length > 0

  );

  return found || '';

};

const getArray = (...values) => {

  const found = values.find((value) => Array.isArray(value) && value.length > 0);

  return found || [];

};

const hashString = (value = '') => {

  const input = String(value);

  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {

    hash ^= input.charCodeAt(index);

    hash = Math.imul(hash, 16777619);

  }

  return String(hash >>> 0);

};

const stringifyNodes = (nodes = []) => {

  if (!Array.isArray(nodes)) return '';

  return nodes.filter(Boolean).join(' / ');

};

const buildThreadSignature = ({

  slot,

  title,

  score,

  nodes,

  profile,

  summary,

  staveOption,

}) => {

  return hashString(

    JSON.stringify({

      slot,

      staveOption,

      title,

      score: round(score, 3),

      nodes,

      profile: AXES.reduce((acc, axis) => {

        acc[axis] = normalizeAxisValue(profile?.[axis]);

        return acc;

      }, {}),

      summary,

    })

  );

};

const getThreadData = ({ read, slot, staveOption }) => {

  const profile = read.profile || {};

  if (slot === 'simple') {

    const title = getText(

      read.simpleThreadTitle,

      read.firstReadTitle,

      read.sourceBuildRead?.title,

      read.sourceBuildRead,

      read.currentSpecSummary

    );

    const summary = getText(

      read.simpleThreadSummary,

      read.firstReadSummary,

      read.sourceBuildRead?.summary,

      read.sourceBuildRead,

      read.currentSpecSummary

    );

    const nodes = getArray(

      read.simpleThreadNodes,

      read.firstReadNodes,

      read.sourceBuildRead?.nodes

    );

    const score = Number(

      read.simpleThreadScore ??

        read.firstReadScore ??

        read.sourceBuildRead?.score ??

        0

    );

    return {

      slot,

      title,

      summary,

      nodes,

      score,

      visualHash: buildThreadSignature({

        slot,

        title,

        score,

        nodes,

        profile,

        summary,

        staveOption,

      }),

    };

  }

  if (slot === 'shaped') {

    const title = getText(

      read.shapedThreadTitle,

      read.feelReadTitle,

      read.feelRead?.title,

      read.feelRead

    );

    const summary = getText(

      read.shapedThreadSummary,

      read.feelReadSummary,

      read.feelRead?.summary,

      read.feelRead

    );

    const nodes = getArray(

      read.shapedThreadNodes,

      read.feelReadNodes,

      read.feelRead?.nodes

    );

    const score = Number(

      read.shapedThreadScore ?? read.feelReadScore ?? read.feelRead?.score ?? 0

    );

    return {

      slot,

      title,

      summary,

      nodes,

      score,

      visualHash: buildThreadSignature({

        slot,

        title,

        score,

        nodes,

        profile,

        summary,

        staveOption,

      }),

    };

  }

  const title = getText(

    read.complexThreadTitle,

    read.benchmarkReadTitle,

    read.playingSituation?.title,

    read.playingSituation

  );

  const summary = getText(

    read.complexThreadSummary,

    read.benchmarkReadSummary,

    read.playingSituation?.summary,

    read.playingSituation,

    read.highlightedCharacteristics

  );

  const nodes = getArray(

    read.complexThreadNodes,

    read.benchmarkReadNodes,

    read.playingSituation?.nodes

  );

  const score = Number(

    read.complexThreadScore ??

      read.benchmarkReadScore ??

      read.playingSituation?.score ??

      read.meta?.movement ??

      0

  );

  return {

    slot,

    title,

    summary,

    nodes,

    score,

    visualHash: buildThreadSignature({

      slot,

      title,

      score,

      nodes,

      profile,

      summary,

      staveOption,

    }),

  };

};

const includesAny = (text, words = []) => {

  const normalized = String(text || '').toLowerCase();

  return words.some((word) => normalized.includes(String(word).toLowerCase()));

};

const compare = (a, b) => {

  return round(normalizeAxisValue(b) - normalizeAxisValue(a), 3);

};

const main = async () => {

  const buildHeritageVoiceReadPath = resolveFirstExisting(

    FILE_CANDIDATES.buildHeritageVoiceRead

  );

  if (!buildHeritageVoiceReadPath) {

    console.error('Could not find buildHeritageVoiceRead file.');

    process.exit(1);

  }

  const voiceReadModule = await importProjectModule(buildHeritageVoiceReadPath);

  const buildHeritageVoiceRead =

    voiceReadModule.buildHeritageVoiceRead || voiceReadModule.default;

  if (typeof buildHeritageVoiceRead !== 'function') {

    console.error('buildHeritageVoiceRead export not found.');

    process.exit(1);

  }

  const rows = THICKNESS_OPTIONS.map((staveOption) => {

    const input = {

      ...BASE_CONFIG,

      staveOption,

    };

    const read = buildHeritageVoiceRead(input);

    const profile = read.profile || {};

    const simple = getThreadData({ read, slot: 'simple', staveOption });

    const shaped = getThreadData({ read, slot: 'shaped', staveOption });

    const complex = getThreadData({ read, slot: 'complex', staveOption });

    return {

      staveOption,

      input,

      read,

      attack: normalizeAxisValue(profile.attack),

      brightness: normalizeAxisValue(profile.brightness),

      projection: normalizeAxisValue(profile.projection),

      sustain: normalizeAxisValue(profile.sustain),

      warmth: normalizeAxisValue(profile.warmth),

      sensitivity: normalizeAxisValue(profile.sensitivity),

      control: normalizeAxisValue(profile.control),

      firstRead: simple.title,

      firstReadScore: round(simple.score),

      firstReadNodes: stringifyNodes(simple.nodes),

      firstReadVisual: simple.visualHash,

      feelRead: shaped.title,

      feelReadScore: round(shaped.score),

      feelReadNodes: stringifyNodes(shaped.nodes),

      feelReadVisual: shaped.visualHash,

      benchRead: complex.title,

      benchReadScore: round(complex.score),

      benchReadNodes: stringifyNodes(complex.nodes),

      benchReadVisual: complex.visualHash,

      playingSituation: getText(read.playingSituation),

      highlightedCharacteristics: getText(read.highlightedCharacteristics),

    };

  });

  const thin = rows.find((row) => row.staveOption.includes('8mm'));

  const medium = rows.find((row) => row.staveOption.includes('10mm'));

  const thick = rows.find((row) => row.staveOption.includes('13mm'));

  const deltaRows = AXES.map((axis) => ({

    axis,

    thin8mm: thin?.[axis],

    medium10mm: medium?.[axis],

    thick13mm: thick?.[axis],

    thinToMediumDelta: compare(thin?.[axis], medium?.[axis]),

    mediumToThickDelta: compare(medium?.[axis], thick?.[axis]),

  }));

  const allThreads = rows.flatMap((row) => [

    {

      staveOption: row.staveOption,

      slot: 'simple',

      title: row.firstRead,

      score: row.firstReadScore,

      nodes: row.firstReadNodes,

      visualHash: row.firstReadVisual,

    },

    {

      staveOption: row.staveOption,

      slot: 'shaped',

      title: row.feelRead,

      score: row.feelReadScore,

      nodes: row.feelReadNodes,

      visualHash: row.feelReadVisual,

    },

    {

      staveOption: row.staveOption,

      slot: 'complex',

      title: row.benchRead,

      score: row.benchReadScore,

      nodes: row.benchReadNodes,

      visualHash: row.benchReadVisual,

    },

  ]);

  const threadPresenceAssertions = allThreads.map((thread) => {

    const score = Number(thread.score);

    const nodeCount = String(thread.nodes || '')

      .split('/')

      .map((node) => node.trim())

      .filter(Boolean).length;

    return {

      staveOption: thread.staveOption,

      slot: thread.slot,

      hasTitle: Boolean(thread.title),

      hasVisualHash: Boolean(thread.visualHash),

      score,

      nodeCount,

      passed:

        Boolean(thread.title) &&

        Boolean(thread.visualHash) &&

        Number.isFinite(score) &&

        score > 0 &&

        nodeCount > 0,

    };

  });

  const visualUniquenessRows = rows.map((row) => {

    const hashes = [row.firstReadVisual, row.feelReadVisual, row.benchReadVisual].filter(

      Boolean

    );

    const uniqueHashes = new Set(hashes);

    return {

      staveOption: row.staveOption,

      uniqueHashes: uniqueHashes.size,

      totalHashes: hashes.length,

      expected: '3 unique visual hashes across simple / shaped / complex',

      passed: uniqueHashes.size === 3 && hashes.length === 3,

    };

  });

  const thicknessDirectionAssertions = [

    {

      check: '13mm should read equal or higher control than 8mm',

      thin8mm: thin?.control,

      thick13mm: thick?.control,

      passed: thick?.control >= thin?.control,

    },

    {

      check: '13mm should read equal or higher projection than 8mm',

      thin8mm: thin?.projection,

      thick13mm: thick?.projection,

      passed: thick?.projection >= thin?.projection,

    },

    {

      check: '13mm should not read more sensitive/open than 8mm',

      thin8mm: thin?.sensitivity,

      thick13mm: thick?.sensitivity,

      passed: thick?.sensitivity <= thin?.sensitivity + 0.15,

    },

    {

      check: '8mm should preserve open / sensitive / lively language somewhere',

      passed: includesAny(

        [

          thin?.firstRead,

          thin?.feelRead,

          thin?.benchRead,

          thin?.playingSituation,

          thin?.highlightedCharacteristics,

        ].join(' '),

        ['open', 'openness', 'sensitive', 'lively', 'alive', 'breathe', 'responsive']

      ),

    },

    {

      check: '13mm should show control / focus / weight / body language somewhere',

      passed: includesAny(

        [

          thick?.firstRead,

          thick?.feelRead,

          thick?.benchRead,

          thick?.playingSituation,

          thick?.highlightedCharacteristics,

        ].join(' '),

        ['control', 'controlled', 'focus', 'focused', 'weight', 'body', 'grounded', 'contained']

      ),

    },

  ];

  console.log('\nHeritage Shell Thickness Voice Thread Test');

  console.log('Configuration locked except shell thickness:');

  console.log(

    `${BASE_CONFIG.size}" x ${BASE_CONFIG.depth}" • ${BASE_CONFIG.lugs} lugs • ${BASE_CONFIG.scorchDepth} • ${BASE_CONFIG.hardwareColor} • ${BASE_CONFIG.hoopType}`

  );

  console.log('\nThickness Profile + Thread Summary');

  console.table(

    rows.map((row) => ({

      staveOption: row.staveOption,

      attack: row.attack,

      brightness: row.brightness,

      projection: row.projection,

      sustain: row.sustain,

      warmth: row.warmth,

      sensitivity: row.sensitivity,

      control: row.control,

      firstRead: row.firstRead,

      firstReadScore: row.firstReadScore,

      firstReadNodes: row.firstReadNodes,

      firstReadVisual: row.firstReadVisual,

      feelRead: row.feelRead,

      feelReadScore: row.feelReadScore,

      feelReadNodes: row.feelReadNodes,

      feelReadVisual: row.feelReadVisual,

      benchRead: row.benchRead,

      benchReadScore: row.benchReadScore,

      benchReadNodes: row.benchReadNodes,

      benchReadVisual: row.benchReadVisual,

      playingSituation: row.playingSituation,

      highlightedCharacteristics: row.highlightedCharacteristics,

    }))

  );

  console.log('\nAxis Deltas Across Thickness');

  console.table(deltaRows);

  console.log('\nAll Threads');

  console.table(allThreads);

  console.log('\nThread Presence Assertions');

  console.table(threadPresenceAssertions);

  console.log('\nVisual Signature Uniqueness Within Each Thickness');

  console.table(visualUniquenessRows);

  console.log('\nThickness Narrative / Tone Assertions');

  console.table(thicknessDirectionAssertions);

  const failedThreadPresence = threadPresenceAssertions.filter((item) => !item.passed);

  const failedVisual = visualUniquenessRows.filter((item) => !item.passed);

  const failedThicknessDirection = thicknessDirectionAssertions.filter(

    (item) => !item.passed

  );

  const hasFailures =

    failedThreadPresence.length ||

    failedVisual.length ||

    failedThicknessDirection.length;

  if (hasFailures) {

    console.error('\nFAILED ASSERTIONS');

    if (failedThreadPresence.length) {

      console.error('\nThread presence failures:');

      console.table(failedThreadPresence);

    }

    if (failedVisual.length) {

      console.error('\nVisual uniqueness failures:');

      console.table(failedVisual);

    }

    if (failedThicknessDirection.length) {

      console.error('\nThickness narrative / tone failures:');

      console.table(failedThicknessDirection);

    }

    process.exit(1);

  }

  console.log(

    '\nPASS: Heritage shell thickness variation is directionally consistent, readouts are non-empty, and each thread slot has a distinct visual signature.\n'

  );

};

main().catch((error) => {

  console.error('\nFAILED TO RUN HERITAGE SHELL THICKNESS VOICE THREAD TEST\n');

  console.error(error);

  process.exit(1);

});

