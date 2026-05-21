
const fs = require('fs');

const admin = require('firebase-admin');

const {

  scoreSnareVoice,

  SNARE_NODE_KEYS,

  SNARE_ENGINE_VERSION

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-engine-benchmark-suite-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-engine-benchmark-suite-v01.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const BENCHMARKS = [

  {

    id: 'ludwig-acrolite-aluminum-dry-control',

    label: 'Ludwig Acrolite should read controlled, sensitive, and drier than brass',

    match: record =>

      record.company === 'Ludwig' &&

      /acrolite/i.test(record.model),

    expectations: [

      { type: 'nodeAtLeast', node: 'control', min: 6.25 },

      { type: 'nodeAtLeast', node: 'sensitivity', min: 6.0 },

      { type: 'nodeBelow', node: 'warmth', max: 5.7 },

      { type: 'nodeBelow', node: 'sustain', max: 6.2 },

      { type: 'topIncludesAny', nodes: ['attack', 'control', 'sensitivity'] }

    ]

  },

  {

    id: 'ludwig-black-beauty-brass-body',

    label: 'Ludwig Black Beauty should read attack/sustain/brightness without behaving like aluminum',

    match: record =>

      record.company === 'Ludwig' &&

      /black beauty/i.test(record.model) &&

      !/super sensitive/i.test(record.model),

    expectations: [

      { type: 'nodeAtLeast', node: 'attack', min: 6.6 },

      { type: 'nodeAtLeast', node: 'sustain', min: 6.6 },

      { type: 'nodeAtLeast', node: 'brightness', min: 6.2 },

      { type: 'nodeBelow', node: 'control', max: 6.2 },

      { type: 'topIncludesAny', nodes: ['attack', 'sustain', 'brightness', 'projection'] }

    ]

  },

  {

    id: 'ludwig-legacy-mahogany-warmth',

    label: 'Ludwig Legacy Mahogany should be warmth/sustain dominant',

    match: record =>

      record.company === 'Ludwig' &&

      /legacy mahogany/i.test(record.model),

    expectations: [

      { type: 'nodeAtLeast', node: 'warmth', min: 7.4 },

      { type: 'nodeAtLeast', node: 'sustain', min: 6.7 },

      { type: 'nodeBelow', node: 'brightness', max: 5.1 },

      { type: 'topIncludesAll', nodes: ['warmth', 'sustain'] }

    ]

  },

  {

    id: 'ludwig-classic-maple-balanced-wood',

    label: 'Ludwig Classic Maple should read balanced warm/sensitive wood, not metal-bright',

    match: record =>

      record.company === 'Ludwig' &&

      /classic maple/i.test(record.model),

    expectations: [

      { type: 'nodeAtLeast', node: 'warmth', min: 6.3 },

      { type: 'nodeAtLeast', node: 'sensitivity', min: 6.2 },

      { type: 'nodeBelow', node: 'brightness', max: 6.0 },

      { type: 'nodeBelow', node: 'projection', max: 6.25 },

      { type: 'topIncludesAny', nodes: ['warmth', 'sensitivity', 'sustain', 'attack'] }

    ]

  },

  {

    id: 'ahead-bell-brass-strong-metal',

    label: 'AHEAD bell brass should read strong attack/sustain/projection with lower sensitivity than maple',

    match: record =>

      record.company === 'AHEAD' &&

      /bell brass/i.test(record.model),

    expectations: [

      { type: 'nodeAtLeast', node: 'attack', min: 7.1 },

      { type: 'nodeAtLeast', node: 'sustain', min: 7.0 },

      { type: 'nodeAtLeast', node: 'projection', min: 6.7 },

      { type: 'nodeBelow', node: 'sensitivity', max: 6.1 },

      { type: 'topIncludesAny', nodes: ['attack', 'sustain', 'projection'] }

    ]

  },

  {

    id: 'dw-true-cast-bronze-mass-control',

    label: 'DW True-Cast Bell Bronze should read attack/projection/control, not soft/warm wood',

    match: record =>

      record.company === 'DW / PDP' &&

      /true-cast|bell bronze/i.test(record.model),

    expectations: [

      { type: 'nodeAtLeast', node: 'attack', min: 7.3 },

      { type: 'nodeAtLeast', node: 'projection', min: 6.8 },

      { type: 'nodeAtLeast', node: 'control', min: 6.8 },

      { type: 'nodeBelow', node: 'sensitivity', max: 5.25 },

      { type: 'topIncludesAll', nodes: ['attack', 'control'] }

    ]

  },

  {

    id: 'gretsch-brooklyn-maple-warmth',

    label: 'Gretsch Brooklyn maple should read warm/sustain/sensitive, not steel-bright',

    match: record =>

      record.company === 'Gretsch' &&

      /brooklyn snare/i.test(record.model),

    expectations: [

      { type: 'nodeAtLeast', node: 'warmth', min: 6.8 },

      { type: 'nodeAtLeast', node: 'sustain', min: 6.2 },

      { type: 'nodeAtLeast', node: 'sensitivity', min: 6.1 },

      { type: 'nodeBelow', node: 'brightness', max: 5.6 },

      { type: 'topIncludesAny', nodes: ['warmth', 'sustain', 'sensitivity'] }

    ]

  },

  {

    id: 'steel-brighter-than-maple',

    label: 'Steel family average should be brighter than maple family average',

    aggregate: true,

    leftGroup: { family: 'shellMaterial', value: 'steel' },

    rightGroup: { family: 'shellMaterial', value: 'maple' },

    expectations: [

      { type: 'leftGreaterThanRightBy', node: 'brightness', minDelta: 1.0 },

      { type: 'leftGreaterThanRightBy', node: 'attack', minDelta: 0.25 },

      { type: 'rightGreaterThanLeftBy', node: 'warmth', minDelta: 1.0 }

    ]

  },

  {

    id: 'aluminum-more-control-than-brass',

    label: 'Aluminum family average should be more controlled/drier than brass',

    aggregate: true,

    leftGroup: { family: 'shellMaterial', value: 'aluminum' },

    rightGroup: { family: 'shellMaterial', value: 'brass' },

    expectations: [

      { type: 'leftGreaterThanRightBy', node: 'control', minDelta: 0.4 },

      { type: 'leftGreaterThanRightBy', node: 'sensitivity', minDelta: 0.25 },

      { type: 'rightGreaterThanLeftBy', node: 'sustain', minDelta: 0.6 }

    ]

  },

  {

    id: 'deep-wood-warmer-than-shallow-wood',

    label: 'Deep 14x8 wood snares should average warmer/sustainier than shallow 14x5 wood snares',

    aggregate: true,

    customGroups: records => {

      const isWood = record =>

        ['maple', 'mahogany', 'mahoganyPoplar', 'walnut', 'oak', 'beech', 'birch', 'poplar'].includes(record.families.shellMaterial);

      return {

        left: records.filter(record => isWood(record) && record.size === '14x8'),

        right: records.filter(record => isWood(record) && record.size === '14x5')

      };

    },

    expectations: [

      { type: 'leftGreaterThanRightBy', node: 'warmth', minDelta: 0.25 },

      { type: 'leftGreaterThanRightBy', node: 'sustain', minDelta: 0.2 }

    ]

  },

  {

    id: 'diecast-more-control-than-tripleflanged',

    label: 'Die-cast hoop family should average more controlled than triple-flanged',

    aggregate: true,

    leftGroup: { family: 'hoopType', value: 'dieCast' },

    rightGroup: { family: 'hoopType', value: 'tripleFlanged' },

    expectations: [

      { type: 'leftGreaterThanRightBy', node: 'control', minDelta: 0.45 },

      { type: 'rightGreaterThanLeftBy', node: 'sustain', minDelta: 0.2 }

    ]

  }

];

const average = values => {

  if (!values.length) return 0;

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));

};

const averageProfile = records => {

  const profile = {};

  for (const node of SNARE_NODE_KEYS) {

    profile[node] = average(records.map(record => record.voiceProfile[node]).filter(Number.isFinite));

  }

  return profile;

};

const topKeys = record => record.topNodes.map(node => node.key);

const evaluateExpectation = ({ expectation, record, leftProfile, rightProfile }) => {

  if (expectation.type === 'nodeAtLeast') {

    const actual = record.voiceProfile[expectation.node];

    return {

      pass: actual >= expectation.min,

      actual,

      expected: `${expectation.node} >= ${expectation.min}`

    };

  }

  if (expectation.type === 'nodeBelow') {

    const actual = record.voiceProfile[expectation.node];

    return {

      pass: actual <= expectation.max,

      actual,

      expected: `${expectation.node} <= ${expectation.max}`

    };

  }

  if (expectation.type === 'topIncludesAny') {

    const actual = topKeys(record);

    const pass = expectation.nodes.some(node => actual.includes(node));

    return {

      pass,

      actual: actual.join(', '),

      expected: `top includes any of ${expectation.nodes.join(', ')}`

    };

  }

  if (expectation.type === 'topIncludesAll') {

    const actual = topKeys(record);

    const pass = expectation.nodes.every(node => actual.includes(node));

    return {

      pass,

      actual: actual.join(', '),

      expected: `top includes all of ${expectation.nodes.join(', ')}`

    };

  }

  if (expectation.type === 'leftGreaterThanRightBy') {

    const left = leftProfile[expectation.node];

    const right = rightProfile[expectation.node];

    const delta = Number((left - right).toFixed(2));

    return {

      pass: delta >= expectation.minDelta,

      actual: `${left} vs ${right}; delta ${delta}`,

      expected: `left ${expectation.node} > right by >= ${expectation.minDelta}`

    };

  }

  if (expectation.type === 'rightGreaterThanLeftBy') {

    const left = leftProfile[expectation.node];

    const right = rightProfile[expectation.node];

    const delta = Number((right - left).toFixed(2));

    return {

      pass: delta >= expectation.minDelta,

      actual: `${right} vs ${left}; delta ${delta}`,

      expected: `right ${expectation.node} > left by >= ${expectation.minDelta}`

    };

  }

  return {

    pass: false,

    actual: 'unsupported',

    expected: expectation.type

  };

};

const resolveGroup = (records, group) => {

  if (!group) return [];

  if (group.family === 'shellMaterial') {

    return records.filter(record => record.families.shellMaterial === group.value);

  }

  if (group.family === 'shellConstruction') {

    return records.filter(record => record.families.shellConstruction === group.value);

  }

  if (group.family === 'hoopType') {

    return records.filter(record => record.families.hoopType === group.value);

  }

  if (group.family === 'size') {

    return records.filter(record => record.size === group.value);

  }

  return [];

};

const evaluateRecordBenchmark = (benchmark, records) => {

  const matches = records.filter(benchmark.match);

  const itemResults = matches.map(record => {

    const expectationResults = benchmark.expectations.map(expectation => ({

      expectation,

      ...evaluateExpectation({ expectation, record })

    }));

    const passed = expectationResults.filter(result => result.pass).length;

    return {

      id: record.id,

      company: record.company,

      model: record.model,

      size: record.size,

      families: record.families,

      voiceProfile: record.voiceProfile,

      topNodes: record.topNodes,

      passed,

      total: expectationResults.length,

      pass: passed === expectationResults.length,

      expectationResults

    };

  });

  const totalAssertions = itemResults.reduce((sum, item) => sum + item.total, 0);

  const passedAssertions = itemResults.reduce((sum, item) => sum + item.passed, 0);

  return {

    id: benchmark.id,

    label: benchmark.label,

    type: 'record',

    matchedRecords: matches.length,

    passedAssertions,

    totalAssertions,

    pass: matches.length > 0 && passedAssertions === totalAssertions,

    itemResults

  };

};

const evaluateAggregateBenchmark = (benchmark, records) => {

  let left = [];

  let right = [];

  if (benchmark.customGroups) {

    const groups = benchmark.customGroups(records);

    left = groups.left || [];

    right = groups.right || [];

  } else {

    left = resolveGroup(records, benchmark.leftGroup);

    right = resolveGroup(records, benchmark.rightGroup);

  }

  const leftProfile = averageProfile(left);

  const rightProfile = averageProfile(right);

  const expectationResults = benchmark.expectations.map(expectation => ({

    expectation,

    ...evaluateExpectation({ expectation, leftProfile, rightProfile })

  }));

  const passedAssertions = expectationResults.filter(result => result.pass).length;

  return {

    id: benchmark.id,

    label: benchmark.label,

    type: 'aggregate',

    leftCount: left.length,

    rightCount: right.length,

    leftProfile,

    rightProfile,

    passedAssertions,

    totalAssertions: expectationResults.length,

    pass: left.length > 0 && right.length > 0 && passedAssertions === expectationResults.length,

    expectationResults

  };

};

async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const records = [];

  snap.forEach(doc => {

    records.push(scoreSnareVoice({ id: doc.id, ...doc.data() }));

  });

  const results = BENCHMARKS.map(benchmark =>

    benchmark.aggregate

      ? evaluateAggregateBenchmark(benchmark, records)

      : evaluateRecordBenchmark(benchmark, records)

  );

  const passedBenchmarks = results.filter(result => result.pass).length;

  const totalAssertions = results.reduce((sum, result) => sum + result.totalAssertions, 0);

  const passedAssertions = results.reduce((sum, result) => sum + result.passedAssertions, 0);

  const packet = {

    status: 'SNARE_ENGINE_BENCHMARK_SUITE_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    engineVersion: SNARE_ENGINE_VERSION,

    promotedRecordsScored: records.length,

    summary: {

      benchmarkCount: results.length,

      passedBenchmarks,

      failedBenchmarks: results.length - passedBenchmarks,

      totalAssertions,

      passedAssertions,

      failedAssertions: totalAssertions - passedAssertions,

      assertionPassRate: totalAssertions

        ? Number(((passedAssertions / totalAssertions) * 100).toFixed(2))

        : 0

    },

    results

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const benchmarkRows = results.map(result => {

    const scope =

      result.type === 'record'

        ? `${result.matchedRecords} records`

        : `${result.leftCount} vs ${result.rightCount}`;

    return `| ${result.pass ? 'PASS' : 'FAIL'} | ${result.id} | ${scope} | ${result.passedAssertions}/${result.totalAssertions} | ${result.label} |`;

  });

  const failureDetails = [];

  for (const result of results.filter(item => !item.pass)) {

    failureDetails.push(`## ${result.id}`);

    failureDetails.push('');

    failureDetails.push(result.label);

    failureDetails.push('');

    if (result.type === 'record') {

      for (const item of result.itemResults.filter(recordResult => !recordResult.pass).slice(0, 12)) {

        failureDetails.push(`### ${item.company} ${item.model} ${item.size}`);

        failureDetails.push('');

        failureDetails.push(`Profile: ${JSON.stringify(item.voiceProfile)}`);

        failureDetails.push(`Top nodes: ${item.topNodes.map(node => node.key).join(', ')}`);

        failureDetails.push('');

        failureDetails.push('| Pass | Expected | Actual |');

        failureDetails.push('|---|---|---|');

        for (const expectation of item.expectationResults.filter(exp => !exp.pass)) {

          failureDetails.push(`| ${expectation.pass ? 'yes' : 'no'} | ${expectation.expected} | ${expectation.actual} |`);

        }

        failureDetails.push('');

      }

    } else {

      failureDetails.push(`Left profile: ${JSON.stringify(result.leftProfile)}`);

      failureDetails.push(`Right profile: ${JSON.stringify(result.rightProfile)}`);

      failureDetails.push('');

      failureDetails.push('| Pass | Expected | Actual |');

      failureDetails.push('|---|---|---|');

      for (const expectation of result.expectationResults.filter(exp => !exp.pass)) {

        failureDetails.push(`| ${expectation.pass ? 'yes' : 'no'} | ${expectation.expected} | ${expectation.actual} |`);

      }

      failureDetails.push('');

    }

  }

  const md = [

    '# LegacyPrint Snare Engine Benchmark Suite v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    '## Summary',

    '',

    `- Engine version: ${packet.engineVersion}`,

    `- Promoted records scored: ${packet.promotedRecordsScored}`,

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Benchmarks: ${packet.summary.passedBenchmarks}/${packet.summary.benchmarkCount} passed`,

    `- Assertions: ${packet.summary.passedAssertions}/${packet.summary.totalAssertions} passed`,

    `- Assertion pass rate: ${packet.summary.assertionPassRate}%`,

    '',

    '## Benchmark Results',

    '',

    '| Result | Benchmark | Scope | Assertions | Purpose |',

    '|---|---|---:|---:|---|',

    ...benchmarkRows,

    '',

    '# Failure Details',

    '',

    ...(failureDetails.length ? failureDetails : ['No failures.'])

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    engineVersion: packet.engineVersion,

    summary: packet.summary

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

