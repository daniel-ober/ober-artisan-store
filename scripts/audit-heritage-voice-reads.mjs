// scripts/audit-heritage-voice-reads.mjs

import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';

import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');

const OUT_DIR = path.join(ROOT, 'tmp');

const OUT_JSON = path.join(OUT_DIR, 'heritage-voice-read-full-audit.json');

const OUT_CSV = path.join(OUT_DIR, 'heritage-voice-read-full-audit.csv');

const AXIS_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const SIZES = ['12', '13', '14'];

const DEPTHS = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'];

const STAVE_OPTIONS_BY_SIZE = {

  12: ['16 - 10mm', '12 - 8mm + $150 (Re-Rings Required)'],

  13: ['16 - 10mm'],

  14: ['20 - 12mm', '16 - 10mm', '10 - 7mm + $150 (Re-Rings Required)'],

};

const LUGS_BY_SIZE_AND_STAVE = {

  '12|16 - 10mm': ['8'],

  '12|12 - 8mm + $150 (Re-Rings Required)': ['6'],

  '13|16 - 10mm': ['8'],

  '14|20 - 12mm': ['10'],

  '14|16 - 10mm': ['8'],

  '14|10 - 7mm + $150 (Re-Rings Required)': ['10'],

};

const HOOP_TYPES = ['Triple Flange', 'Die-Cast'];

const HARDWARE_COLORS = ['Chrome', 'Black Nickel', 'Brass/Gold'];

const SCORCH_DEPTHS = ['Light Torch', 'Medium Torch', 'Blackened'];

const REFERENCE_CONFIG = {

  size: '14',

  depth: '5.5',

  lugs: '8',

  staveOption: '16 - 10mm',

  hoopType: 'Triple Flange',

  hardwareColor: 'Chrome',

  scorchDepth: 'Medium Torch',

};

const DEFAULT_BENCHMARK = {

  benchmarkFamilyId: 'ober-custom',

  benchmarkTypeId: 'heritage-oak-reference',

  benchmarkSizeId: '14x5_5',

};

const round = (value, places = 2) => {

  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return Number(number.toFixed(places));

};

const normalizeNodes = (nodes = []) => {

  return Array.isArray(nodes) ? nodes.filter(Boolean).join('/') : '';

};

const getMovement = (profile = {}) => {

  return AXIS_KEYS.reduce((total, key) => {

    return total + Math.abs(Number(profile[key] ?? 5) - 5);

  }, 0);

};

const getSpread = (profile = {}) => {

  const values = AXIS_KEYS.map((key) => Number(profile[key] ?? 5)).filter(

    Number.isFinite

  );

  if (!values.length) return 0;

  return Math.max(...values) - Math.min(...values);

};

const getTopAxisDeltas = (profile = {}, limit = 4) => {

  return AXIS_KEYS.map((key) => {

    const value = Number(profile[key] ?? 5);

    const delta = round(value - 5, 2);

    return {

      key,

      value: round(value, 2),

      delta,

      distance: Math.abs(delta),

    };

  })

    .sort((a, b) => {

      if (b.distance !== a.distance) return b.distance - a.distance;

      return b.value - a.value;

    })

    .slice(0, limit);

};

const getAxisDeltaString = (profile = {}, limit = 4) => {

  return getTopAxisDeltas(profile, limit)

    .map((item) => {

      const prefix = item.delta > 0 ? '+' : '';

      return `${item.key}:${prefix}${item.delta}`;

    })

    .join(' | ');

};

const makeLabel = (config) => {

  return `${config.size}x${config.depth} / ${config.lugs}lug / ${config.staveOption} / ${config.hoopType} / ${config.hardwareColor} / ${config.scorchDepth}`;

};

const makeSoundOnlySignature = (config) => {

  return [

    config.size,

    config.depth,

    config.lugs,

    config.staveOption,

    config.hoopType,

    config.scorchDepth,

  ].join('|');

};

const makeDigest = (record = {}) => {

  return [

    `firstTell:${record.firstTellTitle || 'NONE'} [${record.firstTellNodes || ''}]`,

    `player:${record.playerTitle || 'NONE'} [${record.playerNodes || ''}]`,

    `identity:${record.identityTitle || 'NONE'} [${record.identityNodes || ''}]`,

  ].join(' || ');

};

const makeReadRecord = ({ config, summary }) => {

  const profile = summary?.profile || {};

  const movement = round(getMovement(profile), 2);

  const spread = round(getSpread(profile), 2);

  const firstTellTitle = summary?.simpleThreadTitle || '';

  const firstTellNodes = normalizeNodes(summary?.simpleThreadNodes);

  const firstTellSummary = summary?.sourceBuildRead || '';

  const playerTitle = summary?.shapedThreadTitle || '';

  const playerNodes = normalizeNodes(summary?.shapedThreadNodes);

  const playerSummary = summary?.feelRead || '';

  const identityTitle = summary?.complexThreadTitle || '';

  const identityNodes = normalizeNodes(summary?.complexThreadNodes);

 const identitySummary = summary?.complexThreadSummary || summary?.playingSituation || '';
 
  const record = {

    label: makeLabel(config),

    soundOnlySignature: makeSoundOnlySignature(config),

    size: config.size,

    depth: config.depth,

    lugs: config.lugs,

    staveOption: config.staveOption,

    hoopType: config.hoopType,

    hardwareColor: config.hardwareColor,

    scorchDepth: config.scorchDepth,

    movement,

    spread,

    topAxisDeltas: getAxisDeltaString(profile),

    profile: AXIS_KEYS.reduce((acc, key) => {

      acc[key] = round(Number(profile[key] ?? 5), 2);

      return acc;

    }, {}),

    firstTellTitle,

    firstTellNodes,

    firstTellSummary,

    playerTitle,

    playerNodes,

    playerSummary,

    identityTitle,

    identityNodes,

    identitySummary,

    identityHardwarePhrase: '',

    identityVisualMood: '',

  };

  return {

    ...record,

    digest: makeDigest(record),

  };

};

const buildAllConfigs = () => {

  const configs = [];

  SIZES.forEach((size) => {

    DEPTHS.forEach((depth) => {

      const staveOptions = STAVE_OPTIONS_BY_SIZE[size] || [];

      staveOptions.forEach((staveOption) => {

        const lugsOptions =

          LUGS_BY_SIZE_AND_STAVE[`${size}|${staveOption}`] || [];

        lugsOptions.forEach((lugs) => {

          HOOP_TYPES.forEach((hoopType) => {

            HARDWARE_COLORS.forEach((hardwareColor) => {

              SCORCH_DEPTHS.forEach((scorchDepth) => {

                configs.push({

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

  return configs;

};

const isReferenceSoundConfig = (recordOrConfig) => {

  return (

    String(recordOrConfig.size) === REFERENCE_CONFIG.size &&

    String(recordOrConfig.depth) === REFERENCE_CONFIG.depth &&

    String(recordOrConfig.lugs) === REFERENCE_CONFIG.lugs &&

    String(recordOrConfig.staveOption) === REFERENCE_CONFIG.staveOption &&

    String(recordOrConfig.hoopType) === REFERENCE_CONFIG.hoopType &&

    String(recordOrConfig.scorchDepth) === REFERENCE_CONFIG.scorchDepth

  );

};

const auditReferenceProfile = (records = []) => {

  const referenceRecords = records.filter((record) => {

    return (

      String(record.size) === REFERENCE_CONFIG.size &&

      String(record.depth) === REFERENCE_CONFIG.depth &&

      String(record.lugs) === REFERENCE_CONFIG.lugs &&

      String(record.staveOption) === REFERENCE_CONFIG.staveOption &&

      String(record.hoopType) === REFERENCE_CONFIG.hoopType &&

      String(record.hardwareColor) === REFERENCE_CONFIG.hardwareColor &&

      String(record.scorchDepth) === REFERENCE_CONFIG.scorchDepth

    );

  });

  return referenceRecords.map((record) => {

    const offCenterAxes = AXIS_KEYS.filter((key) => {

      return Math.abs(Number(record.profile[key] ?? 5) - 5) > 0.01;

    });

    return {

      label: record.label,

      pass: offCenterAxes.length === 0,

      offCenterAxes,

      profile: record.profile,

    };

  });

};

const auditHardwareIsolation = (records = []) => {

  const grouped = new Map();

  records.forEach((record) => {

    const key = record.soundOnlySignature;

    if (!grouped.has(key)) grouped.set(key, []);

    grouped.get(key).push(record);

  });

  const failures = [];

  grouped.forEach((group) => {

    if (group.length < 3) return;

const firstTellSet = new Set(

  group.map((item) => `${item.firstTellTitle}|${item.firstTellNodes}`)

);

const playerSet = new Set(

  group.map((item) => `${item.playerTitle}|${item.playerNodes}`)

);

    if (firstTellSet.size > 1 || playerSet.size > 1) {

      failures.push({

        soundOnlySignature: group[0].soundOnlySignature,

        examples: group.map((item) => ({

          label: item.label,

          firstTell: `${item.firstTellTitle} [${item.firstTellNodes}]`,

          player: `${item.playerTitle} [${item.playerNodes}]`,

          identity: `${item.identityTitle} [${item.identityNodes}]`,

        })),

        firstTellVariants: firstTellSet.size,

        playerVariants: playerSet.size,

      });

    }

  });

  return failures;

};

const auditMissingReads = (records = []) => {

  return records.filter((record) => {

    return (

      !record.firstTellTitle ||

      !record.firstTellNodes ||

      !record.playerTitle ||

      !record.playerNodes ||

      !record.identityTitle ||

      !record.identityNodes

    );

  });

};

const auditWeakFlatCases = (records = []) => {

  return records.filter((record) => {

    if (isReferenceSoundConfig(record)) return false;

    return record.movement < 0.75 || record.spread < 0.25;

  });

};

const auditRepeatedDigests = (records = []) => {

  const groups = new Map();

  records.forEach((record) => {

    if (!groups.has(record.digest)) groups.set(record.digest, []);

    groups.get(record.digest).push(record);

  });

  return [...groups.entries()]

    .map(([digest, group]) => ({

      digest,

      count: group.length,

      examples: group.slice(0, 8).map((item) => item.label),

    }))

    .filter((item) => item.count >= 12)

    .sort((a, b) => b.count - a.count);

};

const auditIdentityUniqueness = (records = []) => {

  const grouped = new Map();

  records.forEach((record) => {

    if (!grouped.has(record.identityTitle)) {

      grouped.set(record.identityTitle, []);

    }

    grouped.get(record.identityTitle).push(record);

  });

  return [...grouped.entries()]

    .map(([identityTitle, group]) => ({

      identityTitle,

      count: group.length,

      examples: group.slice(0, 8).map((item) => item.label),

    }))

    .filter((item) => item.count > 1)

    .sort((a, b) => b.count - a.count);

};

const toCsvValue = (value) => {

  const stringValue =

    value === null || value === undefined

      ? ''

      : typeof value === 'object'

        ? JSON.stringify(value)

        : String(value);

  return `"${stringValue.replaceAll('"', '""')}"`;

};

const writeCsv = (records = []) => {

  const columns = [

    'label',

    'size',

    'depth',

    'lugs',

    'staveOption',

    'hoopType',

    'hardwareColor',

    'scorchDepth',

    'movement',

    'spread',

    'topAxisDeltas',

    'firstTellTitle',

    'firstTellNodes',

    'playerTitle',

    'playerNodes',

    'identityTitle',

    'identityNodes',

    'identitySummary',

    'digest',

  ];

  const rows = [

    columns.join(','),

    ...records.map((record) =>

      columns.map((column) => toCsvValue(record[column])).join(',')

    ),

  ];

  fs.writeFileSync(OUT_CSV, rows.join('\n'));

};

const main = () => {

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const configs = buildAllConfigs();

  const records = configs.map((config) => {

    const summary = buildHeritageVoiceRead({

      ...config,

      ...DEFAULT_BENCHMARK,

    });

    return makeReadRecord({

      config,

      summary,

    });

  });

  const referenceAudit = auditReferenceProfile(records);

  const hardwareIsolationFailures = auditHardwareIsolation(records);

  const missingReads = auditMissingReads(records);

  const weakFlatCases = auditWeakFlatCases(records);

  const repeatedDigests = auditRepeatedDigests(records);

  const repeatedIdentityTitles = auditIdentityUniqueness(records);

  const report = {

    generatedAt: new Date().toISOString(),

    totalConfigs: records.length,

    referenceAudit,

    hardwareIsolationFailures,

    missingReads,

    weakFlatCases,

    repeatedDigests,

    repeatedIdentityTitles,

    records,

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));

  writeCsv(records);

  console.log('\nHERITAGE VOICE READ FULL AUDIT\n');

  console.log(`Total configs tested: ${records.length}`);

  console.log(`Reference profile checks: ${referenceAudit.length}`);

  console.log(

    `Reference failures: ${referenceAudit.filter((item) => !item.pass).length}`

  );

  console.log(`Missing read failures: ${missingReads.length}`);

  console.log(`Hardware isolation failures: ${hardwareIsolationFailures.length}`);

  console.log(`Weak / flat cases: ${weakFlatCases.length}`);

  console.log(`Repeated digest groups: ${repeatedDigests.length}`);

  console.log(`Repeated Identity Shape titles: ${repeatedIdentityTitles.length}`);

  console.log('\nReference audit');

  console.table(

    referenceAudit.map((item) => ({

      pass: item.pass,

      label: item.label,

      profile: AXIS_KEYS.map((key) => `${key}:${item.profile[key]}`).join(

        ' | '

      ),

      offCenterAxes: item.offCenterAxes.join(', '),

    }))

  );

  console.log('\nSample configs');

  console.table(

    records.slice(0, 18).map((record) => ({

      label: record.label,

      movement: record.movement,

      spread: record.spread,

      topAxisDeltas: record.topAxisDeltas,

      firstTell: `${record.firstTellTitle} [${record.firstTellNodes}]`,

      player: `${record.playerTitle} [${record.playerNodes}]`,

      identity: `${record.identityTitle} [${record.identityNodes}]`,

    }))

  );

  if (hardwareIsolationFailures.length) {

    console.log('\nHardware isolation failures');

    console.table(

      hardwareIsolationFailures.slice(0, 20).map((item) => ({

        soundOnlySignature: item.soundOnlySignature,

        firstTellVariants: item.firstTellVariants,

        playerVariants: item.playerVariants,

      }))

    );

  }

  if (weakFlatCases.length) {

    console.log('\nWeak / flat cases');

    console.table(

      weakFlatCases.slice(0, 30).map((record) => ({

        label: record.label,

        movement: record.movement,

        spread: record.spread,

        topAxisDeltas: record.topAxisDeltas,

        digest: record.digest,

      }))

    );

  }

  if (repeatedDigests.length) {

    console.log('\nRepeated digest groups');

    console.table(

      repeatedDigests.slice(0, 24).map((item) => ({

        count: item.count,

        digest: item.digest,

        examples: item.examples.join(' | '),

      }))

    );

  }

  if (repeatedIdentityTitles.length) {

    console.log('\nRepeated Identity Shape titles');

    console.table(

      repeatedIdentityTitles.slice(0, 24).map((item) => ({

        count: item.count,

        identityTitle: item.identityTitle,

        examples: item.examples.join(' | '),

      }))

    );

  }

  console.log(`\nWrote JSON report: ${path.relative(ROOT, OUT_JSON)}`);

  console.log(`Wrote CSV report:  ${path.relative(ROOT, OUT_CSV)}\n`);

  const hasHardFailures =

    referenceAudit.some((item) => !item.pass) ||

    missingReads.length > 0 ||

    hardwareIsolationFailures.length > 0;

  if (hasHardFailures) {

    process.exitCode = 1;

  }

};

main();