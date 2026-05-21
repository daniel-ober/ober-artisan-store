
const fs = require('fs');

const admin = require('firebase-admin');

const {

  scoreSnareVoice,

  applySnareCalibrationOverlay,

  DEFAULT_SNARE_CALIBRATION_OVERLAY,

  SNARE_ENGINE_VERSION

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-engine-benchmark-suite-with-overlay-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-engine-benchmark-suite-with-overlay-v01.md';

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

    id: 'projection-not-overdominant-after-overlay',

    label: 'Projection should not become over-dominant after overlay',

    aggregate: true,

    expectations: [

      { type: 'projectionTop3BelowRatio', maxRatio: 0.5 }

    ]

  }

];

const average = values => {

  if (!values.length) return 0;

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));

};

const topKeys = record => record.topNodes.map(node => node.key);

const evaluateExpectation = ({ expectation, record, records }) => {

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

    return {

      pass: expectation.nodes.some(node => actual.includes(node)),

      actual: actual.join(', '),

      expected: `top includes any of ${expectation.nodes.join(', ')}`

    };

  }

  if (expectation.type === 'topIncludesAll') {

    const actual = topKeys(record);

    return {

      pass: expectation.nodes.every(node => actual.includes(node)),

      actual: actual.join(', '),

      expected: `top includes all of ${expectation.nodes.join(', ')}`

    };

  }

  if (expectation.type === 'projectionTop3BelowRatio') {

    const projectionTop3Count = records.filter(item =>

      item.topNodes.some(node => node.key === 'projection')

    ).length;

    const ratio = records.length ? projectionTop3Count / records.length : 0;

    return {

      pass: ratio <= expectation.maxRatio,

      actual: `${projectionTop3Count}/${records.length} (${Number((ratio * 100).toFixed(2))}%)`,

      expected: `projection top-3 ratio <= ${expectation.maxRatio}`

    };

  }

  return {

    pass: false,

    actual: 'unsupported',

    expected: expectation.type

  };

};

const evaluateRecordBenchmark = (benchmark, records) => {

  const matches = records.filter(benchmark.match);

  const itemResults = matches.map(record => {

    const expectationResults = benchmark.expectations.map(expectation => ({

      expectation,

      ...evaluateExpectation({ expectation, record, records })

    }));

    const passed = expectationResults.filter(result => result.pass).length;

    return {

      id: record.id,

      company: record.company,

      model: record.model,

      size: record.size,

      voiceProfile: record.voiceProfile,

      topNodes: record.topNodes,

      calibrationOverlay: record.calibrationOverlay,

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

  const expectationResults = benchmark.expectations.map(expectation => ({

    expectation,

    ...evaluateExpectation({ expectation, records })

  }));

  const passedAssertions = expectationResults.filter(result => result.pass).length;

  return {

    id: benchmark.id,

    label: benchmark.label,

    type: 'aggregate',

    passedAssertions,

    totalAssertions: expectationResults.length,

    pass: passedAssertions === expectationResults.length,

    expectationResults

  };

};

async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const baseRecords = [];

  snap.forEach(doc => {

    baseRecords.push(scoreSnareVoice({ id: doc.id, ...doc.data() }));

  });

  const overlayRecords = baseRecords.map(record =>

    applySnareCalibrationOverlay(record, DEFAULT_SNARE_CALIBRATION_OVERLAY)

  );

  const results = BENCHMARKS.map(benchmark =>

    benchmark.aggregate

      ? evaluateAggregateBenchmark(benchmark, overlayRecords)

      : evaluateRecordBenchmark(benchmark, overlayRecords)

  );

  const passedBenchmarks = results.filter(result => result.pass).length;

  const totalAssertions = results.reduce((sum, result) => sum + result.totalAssertions, 0);

  const passedAssertions = results.reduce((sum, result) => sum + result.passedAssertions, 0);

  const overlayAppliedCount = overlayRecords.filter(record => record.calibrationOverlay?.applied).length;

  const packet = {

    status: 'SNARE_ENGINE_BENCHMARK_SUITE_WITH_OVERLAY_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    engineVersion: SNARE_ENGINE_VERSION,

    overlayVersion: DEFAULT_SNARE_CALIBRATION_OVERLAY.version,

    promotedRecordsScored: overlayRecords.length,

    overlayAppliedCount,

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

  const rows = results.map(result => {

    const scope = result.type === 'record' ? `${result.matchedRecords} records` : 'aggregate';

    return `| ${result.pass ? 'PASS' : 'FAIL'} | ${result.id} | ${scope} | ${result.passedAssertions}/${result.totalAssertions} | ${result.label} |`;

  });

  const failing = results.filter(result => !result.pass);

  const md = [

    '# LegacyPrint Snare Benchmark Suite With Overlay v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Engine version: ${packet.engineVersion}`,

    `- Overlay version: ${packet.overlayVersion}`,

    `- Promoted records scored: ${packet.promotedRecordsScored}`,

    `- Overlay applied count: ${packet.overlayAppliedCount}`,

    `- Benchmarks: ${packet.summary.passedBenchmarks}/${packet.summary.benchmarkCount} passed`,

    `- Assertions: ${packet.summary.passedAssertions}/${packet.summary.totalAssertions} passed`,

    `- Assertion pass rate: ${packet.summary.assertionPassRate}%`,

    '',

    '## Results',

    '',

    '| Result | Benchmark | Scope | Assertions | Purpose |',

    '|---|---|---:|---:|---|',

    ...rows,

    '',

    '## Failure Details',

    '',

    failing.length ? JSON.stringify(failing, null, 2) : 'No failures.'

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    engineVersion: packet.engineVersion,

    overlayVersion: packet.overlayVersion,

    overlayAppliedCount: packet.overlayAppliedCount,

    summary: packet.summary

  }, null, 2));

  if (packet.summary.failedBenchmarks > 0) {

    process.exit(1);

  }

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

