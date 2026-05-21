// scripts/legacyPrint/buildReadinessWorkQueues.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// Build readiness work queues from a Phase 3T audit JSON report.

//

// READ-ONLY.

// Does NOT write Firestore.

// Does NOT patch records.

// Does NOT rescore drums.

// Does NOT modify schema.

//

// Usage:

// node scripts/legacyPrint/buildReadinessWorkQueues.mjs "tmp/legacyPrint-audits/phase-3t-stock-core-shell-readiness-....json"

import fs from 'fs';

import path from 'path';

const REQUIRED_REPORT_KEYS = [

  'allRows',

  'totalRecordsScanned',

  'stockTierCounts',

  'coreShellTierCounts',

];

const DEFAULT_OUTPUT_DIR = path.resolve('tmp/legacyPrint-audits/work-queues');

function ensureDir(dirPath) {

  fs.mkdirSync(dirPath, { recursive: true });

}

function readJson(filePath) {

  const resolved = path.resolve(filePath);

  if (!fs.existsSync(resolved)) {

    throw new Error(`Input report not found: ${resolved}`);

  }

  const raw = fs.readFileSync(resolved, 'utf8');

  try {

    return {

      resolvedPath: resolved,

      data: JSON.parse(raw),

    };

  } catch (error) {

    throw new Error(`Failed to parse JSON report at ${resolved}: ${error.message}`);

  }

}

function validateReport(report) {

  const missing = REQUIRED_REPORT_KEYS.filter((key) => !(key in report));

  if (missing.length > 0) {

    throw new Error(

      `Input JSON does not look like a Phase 3T readiness report. Missing keys: ${missing.join(', ')}`

    );

  }

  if (!Array.isArray(report.allRows)) {

    throw new Error('Input JSON report has an allRows key, but allRows is not an array.');

  }

}

function writeJson(outputDir, fileName, payload) {

  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));

  return filePath;

}

function writeCsv(outputDir, fileName, rows) {

  const filePath = path.join(outputDir, fileName);

  const headers = [

    'id',

    'label',

    'companyName',

    'lineSeries',

    'modelName',

    'diameter',

    'depth',

    'stockTier',

    'coreShellTier',

    'missingForStock',

    'missingForCoreShell',

    'nonCriticalMissingStock',

    'nonCriticalMissingShell',

    'shellMaterial',

    'shellConstruction',

    'shellThickness',

    'shellThicknessConfidence',

    'bearingEdge',

    'bearingEdgeConfidence',

    'reinforcementRings',

    'reinforcementRingMaterial',

    'reinforcementRingThickness',

    'reinforcementRingHeight',

    'hoopType',

    'stockBatterHead',

    'stockResoHead',

    'stockSnareWires',

    'productionStatus',

    'primarySourceUrl',

    'sourceConfidence',

    'priorityScore',

  ];

  const csv = [

    headers.join(','),

    ...rows.map((row) =>

      headers.map((header) => csvEscape(formatCell(row[header]))).join(',')

    ),

  ].join('\n');

  fs.writeFileSync(filePath, csv);

  return filePath;

}

function csvEscape(value) {

  const stringValue = value === undefined || value === null ? '' : String(value);

  const escaped = stringValue.replace(/"/g, '""');

  if (

    escaped.includes(',') ||

    escaped.includes('"') ||

    escaped.includes('\n') ||

    escaped.includes('\r')

  ) {

    return `"${escaped}"`;

  }

  return escaped;

}

function formatCell(value) {

  if (Array.isArray(value)) return value.join(' | ');

  if (value && typeof value === 'object') return JSON.stringify(value);

  return value ?? '';

}

function compactRow(row) {

  return {

    id: row.id,

    label: row.label,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    drumType: row.drumType,

    diameter: row.diameter,

    depth: row.depth,

    stockTier: row.stockTier,

    stockPassable: row.stockPassable,

    coreShellTier: row.coreShellTier,

    coreShellPassable: row.coreShellPassable,

    missingForStock: row.missingForStock || [],

    missingForCoreShell: row.missingForCoreShell || [],

    nonCriticalMissingStock: row.nonCriticalMissingStock || [],

    nonCriticalMissingShell: row.nonCriticalMissingShell || [],

    shellMaterial: row.shellMaterial,

    shellConstruction: row.shellConstruction,

    shellThickness: row.shellThickness,

    shellThicknessConfidence: row.shellThicknessConfidence,

    bearingEdge: row.bearingEdge,

    bearingEdgeConfidence: row.bearingEdgeConfidence,

    snareBed: row.snareBed,

    reinforcementRings: row.reinforcementRings,

    reinforcementRingMaterial: row.reinforcementRingMaterial,

    reinforcementRingThickness: row.reinforcementRingThickness,

    reinforcementRingHeight: row.reinforcementRingHeight,

    hoopType: row.hoopType,

    stockBatterHead: row.stockBatterHead,

    stockResoHead: row.stockResoHead,

    stockSnareWires: row.stockSnareWires,

    lugCount: row.lugCount,

    lugType: row.lugType,

    hardwareFinish: row.hardwareFinish,

    throwOff: row.throwOff,

    productionStatus: row.productionStatus,

    primarySourceUrl: row.primarySourceUrl,

    sourceConfidence: row.sourceConfidence,

    isCommonKnownVintage: row.isCommonKnownVintage,

    isSinglePlyThinOrSteambentShell: row.isSinglePlyThinOrSteambentShell,

    hasReRingData: row.hasReRingData,

    reRingValueIndicatesNone: row.reRingValueIndicatesNone,

    priorityScore: Number(row.priorityScore || 0),

  };

}

function byPriorityThenLabel(a, b) {

  const scoreDiff = Number(b.priorityScore || 0) - Number(a.priorityScore || 0);

  if (scoreDiff !== 0) return scoreDiff;

  return String(a.label || '').localeCompare(String(b.label || ''));

}

function includesMissing(row, fieldName) {

  return Array.isArray(row.missingForStock) && row.missingForStock.includes(fieldName);

}

function includesCoreMissing(row, fieldName) {

  return Array.isArray(row.missingForCoreShell) && row.missingForCoreShell.includes(fieldName);

}

function includesNonCriticalShell(row, fieldName) {

  return Array.isArray(row.nonCriticalMissingShell) && row.nonCriticalMissingShell.includes(fieldName);

}

function hasAnyNonCriticalReRingDetailMissing(row) {

  return (row.nonCriticalMissingShell || []).some((field) =>

    String(field).startsWith('re-ring ')

  );

}

function createQueue(name, description, rows, extra = {}) {

  const normalizedRows = rows.map(compactRow).sort(byPriorityThenLabel);

  return {

    queueName: name,

    description,

    generatedAt: new Date().toISOString(),

    count: normalizedRows.length,

    ...extra,

    rows: normalizedRows,

  };

}

function buildQueues(report) {

  const rows = report.allRows.map(compactRow).sort(byPriorityThenLabel);

  const passableCoreShellReadyForEngineTest = rows.filter(

    (row) => row.coreShellTier === 'PASSABLE_CORE_SHELL'

  );

  const passableStockReadyForEngineTest = rows.filter(

    (row) => row.stockTier === 'PASSABLE_STOCK'

  );

  const nearlyPassableStock = rows.filter(

    (row) => row.stockTier === 'NEARLY_PASSABLE_STOCK'

  );

  const stockHeadsNeeded = rows.filter(

    (row) =>

      includesMissing(row, 'stock batter head') ||

      includesMissing(row, 'stock reso head')

  );

  const stockBatterHeadNeeded = rows.filter((row) =>

    includesMissing(row, 'stock batter head')

  );

  const stockResoHeadNeeded = rows.filter((row) =>

    includesMissing(row, 'stock reso head')

  );

  const stockSnareWiresNeeded = rows.filter((row) =>

    includesMissing(row, 'stock snare wires')

  );

  const productionStatusNeeded = rows.filter((row) =>

    includesMissing(row, 'production status')

  );

  const shellThicknessConfidenceNeeded = rows.filter((row) =>

    includesCoreMissing(row, 'shell thickness or explicit thickness confidence')

  );

  const sourceUrlNeeded = rows.filter((row) =>

    includesCoreMissing(row, 'primary source URL')

  );

  const shellMaterialNeeded = rows.filter((row) =>

    includesCoreMissing(row, 'shell material')

  );

  const coreShellBlocked = rows.filter(

    (row) => row.coreShellTier !== 'PASSABLE_CORE_SHELL'

  );

  const stockBlocked = rows.filter(

    (row) => row.stockTier !== 'PASSABLE_STOCK'

  );

  const commonKnownVintageAvailable = rows.filter(

    (row) =>

      row.isCommonKnownVintage &&

      (row.stockTier === 'PASSABLE_STOCK' || row.coreShellTier === 'PASSABLE_CORE_SHELL')

  );

  const commonKnownVintageBlockedForStock = rows.filter(

    (row) => row.isCommonKnownVintage && row.stockTier !== 'PASSABLE_STOCK'

  );

  const singlePlyThinSteambentMissingReRingPresence = rows.filter(

    (row) =>

      row.isSinglePlyThinOrSteambentShell &&

      includesCoreMissing(row, 're-ring presence/absence for single-ply/thin/steam-bent shell')

  );

  const reringDetailNiceToHave = rows.filter(

    (row) =>

      row.hasReRingData &&

      !row.reRingValueIndicatesNone &&

      hasAnyNonCriticalReRingDetailMissing(row)

  );

  const nonCriticalStockEnrichmentNeeded = rows.filter(

    (row) => Array.isArray(row.nonCriticalMissingStock) && row.nonCriticalMissingStock.length > 0

  );

  const nonCriticalShellEnrichmentNeeded = rows.filter(

    (row) => Array.isArray(row.nonCriticalMissingShell) && row.nonCriticalMissingShell.length > 0

  );

  const stockMinorOnlyPromotionCandidates = rows.filter((row) => {

    const missing = row.missingForStock || [];

    const coreMissing = row.missingForCoreShell || [];

    return (

      row.coreShellTier === 'PASSABLE_CORE_SHELL' &&

      row.stockTier !== 'PASSABLE_STOCK' &&

      coreMissing.length === 0 &&

      missing.length > 0 &&

      missing.every((field) =>

        [

          'stock batter head',

          'stock reso head',

          'stock snare wires',

          'production status',

          'hoop type',

        ].includes(field)

      )

    );

  });

  const queues = {

    'passable-core-shell-ready-for-engine-test': createQueue(

      'passable-core-shell-ready-for-engine-test',

      'Records that currently pass core shell readiness and can be used for shell-first / inferred-shell engine testing.',

      passableCoreShellReadyForEngineTest

    ),

    'passable-stock-ready-for-engine-test': createQueue(

      'passable-stock-ready-for-engine-test',

      'Records that currently pass strict stock readiness and can be used as full factory stock references.',

      passableStockReadyForEngineTest

    ),

    'nearly-passable-stock': createQueue(

      'nearly-passable-stock',

      'Records that pass core shell readiness and are missing only minor stock fields.',

      nearlyPassableStock

    ),

    'stock-minor-only-promotion-candidates': createQueue(

      'stock-minor-only-promotion-candidates',

      'Highest-value records where core shell passes and only stock-level fields are blocking full stock promotion.',

      stockMinorOnlyPromotionCandidates

    ),

    'stock-heads-needed': createQueue(

      'stock-heads-needed',

      'Records missing stock batter head and/or stock reso head.',

      stockHeadsNeeded

    ),

    'stock-batter-head-needed': createQueue(

      'stock-batter-head-needed',

      'Records missing stock batter head.',

      stockBatterHeadNeeded

    ),

    'stock-reso-head-needed': createQueue(

      'stock-reso-head-needed',

      'Records missing stock reso head.',

      stockResoHeadNeeded

    ),

    'stock-snare-wires-needed': createQueue(

      'stock-snare-wires-needed',

      'Records missing stock snare wires.',

      stockSnareWiresNeeded

    ),

    'production-status-needed': createQueue(

      'production-status-needed',

      'Records missing production status.',

      productionStatusNeeded

    ),

    'shell-thickness-confidence-needed': createQueue(

      'shell-thickness-confidence-needed',

      'Records blocked from core shell pass because shell thickness or explicit thickness confidence is missing.',

      shellThicknessConfidenceNeeded

    ),

    'source-url-needed': createQueue(

      'source-url-needed',

      'Records blocked from core shell pass because primary source URL is missing.',

      sourceUrlNeeded

    ),

    'shell-material-needed': createQueue(

      'shell-material-needed',

      'Records blocked from core shell pass because shell material is missing.',

      shellMaterialNeeded

    ),

    'core-shell-blocked': createQueue(

      'core-shell-blocked',

      'All records that do not currently pass core shell readiness.',

      coreShellBlocked

    ),

    'stock-blocked': createQueue(

      'stock-blocked',

      'All records that do not currently pass full stock readiness.',

      stockBlocked

    ),

    'common-known-vintage-available': createQueue(

      'common-known-vintage-available',

      'Common, known, or vintage records that are currently usable as stock or core-shell references.',

      commonKnownVintageAvailable

    ),

    'common-known-vintage-blocked-for-stock': createQueue(

      'common-known-vintage-blocked-for-stock',

      'Common, known, or vintage records that are still blocked from strict stock pass.',

      commonKnownVintageBlockedForStock

    ),

    'single-ply-thin-steambent-missing-rering-presence': createQueue(

      'single-ply-thin-steambent-missing-rering-presence',

      'Single-ply, thin, or steam-bent shell candidates missing required re-ring presence/absence data.',

      singlePlyThinSteambentMissingReRingPresence

    ),

    'rering-detail-nice-to-have': createQueue(

      'rering-detail-nice-to-have',

      'Records with re-ring data captured but missing nice-to-have re-ring material, thickness, or height details.',

      reringDetailNiceToHave

    ),

    'non-critical-stock-enrichment-needed': createQueue(

      'non-critical-stock-enrichment-needed',

      'Records missing non-critical stock enrichment fields that do not block stock/core pass.',

      nonCriticalStockEnrichmentNeeded

    ),

    'non-critical-shell-enrichment-needed': createQueue(

      'non-critical-shell-enrichment-needed',

      'Records missing non-critical shell enrichment fields that do not block stock/core pass.',

      nonCriticalShellEnrichmentNeeded

    ),

  };

  return queues;

}

function countMissingFields(rows, key) {

  const counts = {};

  for (const row of rows) {

    const values = Array.isArray(row[key]) ? row[key] : [];

    for (const value of values) {

      counts[value] = (counts[value] || 0) + 1;

    }

  }

  return Object.entries(counts)

    .sort((a, b) => b[1] - a[1])

    .map(([field, count]) => ({ field, count }));

}

function buildIndex(report, queues, inputPath, outputDir) {

  const rows = report.allRows.map(compactRow);

  const queueSummaries = Object.entries(queues).map(([slug, queue]) => ({

    slug,

    fileJson: `${slug}.json`,

    fileCsv: `${slug}.csv`,

    count: queue.count,

    description: queue.description,

  }));

  const stockTierCounts = report.stockTierCounts || {};

  const coreShellTierCounts = report.coreShellTierCounts || {};

  return {

    indexName: 'OBER LEGACYPRINT™ readiness work queues',

    generatedAt: new Date().toISOString(),

    sourceReport: inputPath,

    outputDir,

    totalRecordsScanned: report.totalRecordsScanned,

    stockTierCounts,

    coreShellTierCounts,

    keyCounts: {

      passableStock: stockTierCounts.PASSABLE_STOCK || 0,

      nearlyPassableStock: stockTierCounts.NEARLY_PASSABLE_STOCK || 0,

      passableCoreShell: coreShellTierCounts.PASSABLE_CORE_SHELL || 0,

      coreShellNeedsResearch: coreShellTierCounts.CORE_SHELL_NEEDS_RESEARCH || 0,

      stockNeedsResearch: stockTierCounts.STOCK_NEEDS_RESEARCH || 0,

    },

    topMissingForStock: countMissingFields(rows, 'missingForStock').slice(0, 25),

    topMissingForCoreShell: countMissingFields(rows, 'missingForCoreShell').slice(0, 25),

    topNonCriticalMissingStock: countMissingFields(rows, 'nonCriticalMissingStock').slice(0, 25),

    topNonCriticalMissingShell: countMissingFields(rows, 'nonCriticalMissingShell').slice(0, 25),

    queues: queueSummaries,

    recommendedNextSteps: [

      'Use passable-core-shell-ready-for-engine-test for initial calculated shell voice testing.',

      'Use passable-stock-ready-for-engine-test as the strict stock reference baseline.',

      'Use stock-minor-only-promotion-candidates as the first enrichment batch.',

      'Resolve shell-thickness-confidence-needed to unlock the largest core-shell gain.',

      'Resolve stock-heads-needed and production-status-needed to promote nearly passable stock records.',

      'Treat rering-detail-nice-to-have as enrichment only unless re-ring presence/absence is missing.',

    ],

  };

}

function printQueueTable(index) {

  console.log('');

  console.log('READINESS WORK QUEUES CREATED');

  console.table(

    index.queues.map((queue) => ({

      queue: queue.slug,

      count: queue.count,

      json: queue.fileJson,

      csv: queue.fileCsv,

    }))

  );

}

function printSummary(index) {

  console.log('');

  console.log('SUMMARY');

  console.table([

    {

      totalRecordsScanned: index.totalRecordsScanned,

      passableStock: index.keyCounts.passableStock,

      nearlyPassableStock: index.keyCounts.nearlyPassableStock,

      passableCoreShell: index.keyCounts.passableCoreShell,

      coreShellNeedsResearch: index.keyCounts.coreShellNeedsResearch,

      stockNeedsResearch: index.keyCounts.stockNeedsResearch,

    },

  ]);

  console.log('');

  console.log('TOP MISSING FOR STOCK');

  console.table(index.topMissingForStock.slice(0, 10));

  console.log('');

  console.log('TOP MISSING FOR CORE SHELL');

  console.table(index.topMissingForCoreShell.slice(0, 10));

}

async function main() {

  const inputArg = process.argv[2];

  if (!inputArg) {

    console.error('');

    console.error('Missing input report path.');

    console.error('');

    console.error('Usage:');

    console.error(

      'node scripts/legacyPrint/buildReadinessWorkQueues.mjs "tmp/legacyPrint-audits/phase-3t-stock-core-shell-readiness-....json"'

    );

    console.error('');

    process.exit(1);

  }

  const { resolvedPath, data: report } = readJson(inputArg);

  validateReport(report);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const outputDir = path.join(DEFAULT_OUTPUT_DIR, `readiness-work-queues-${timestamp}`);

  ensureDir(outputDir);

  const queues = buildQueues(report);

  for (const [slug, queue] of Object.entries(queues)) {

    writeJson(outputDir, `${slug}.json`, queue);

    writeCsv(outputDir, `${slug}.csv`, queue.rows);

  }

  const index = buildIndex(report, queues, resolvedPath, outputDir);

  const indexJsonPath = writeJson(outputDir, 'index.json', index);

  printSummary(index);

  printQueueTable(index);

  console.log('');

  console.log('INDEX FILE');

  console.log(indexJsonPath);

  console.log('');

  console.log('OUTPUT FOLDER');

  console.log(outputDir);

  console.log('');

}

main().catch((error) => {

  console.error('');

  console.error('Failed to build readiness work queues.');

  console.error(error);

  console.error('');

  process.exit(1);

});