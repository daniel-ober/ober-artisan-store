
const fs = require('fs');

const path = require('path');

const auditDir = 'tmp/legacyPrint-audits';

const reviewDir = 'src/legacyPrint/reviewPlans';

function readJson(filePath, fallback = null) {

  if (!fs.existsSync(filePath)) return fallback;

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function latestAudit(prefix) {

  const file = fs.readdirSync(auditDir)

    .filter((name) => name.startsWith(prefix) && name.endsWith('.json'))

    .sort()

    .reverse()[0];

  return file ? path.join(auditDir, file) : null;

}

function countBy(rows, keyFn) {

  return rows.reduce((acc, row) => {

    const key = keyFn(row) || 'Unknown';

    acc[key] = (acc[key] || 0) + 1;

    return acc;

  }, {});

}

const latestPassablePath = latestAudit('strict-passable-readiness-');

const latestShellPath = latestAudit('strict-shell-field-quality-');

if (!latestPassablePath) throw new Error('Missing latest strict passable audit.');

if (!latestShellPath) throw new Error('Missing latest strict shell audit.');

const passable = readJson(latestPassablePath);

const shell = readJson(latestShellPath);

const allRows = Array.isArray(passable.allRows) ? passable.allRows : [];

const nearlyPassable = allRows.filter((row) => row.stockTier === 'NEARLY_PASSABLE_STOCK');

const coreUsableRows = allRows.filter((row) =>

  [

    'PASSABLE_CORE_SHELL_STRICT',

    'PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS',

    'PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK'

  ].includes(row.coreShellTier)

);

const stockHeadManual =

  readJson('src/legacyPrint/reviewPlans/stock-head-manual-review-workbench.json', {});

const manualGroups = stockHeadManual.manualReviewGroups || [];

const rankedManualReviewGroups = manualGroups

  .map((group) => ({

    companyName: group.companyName,

    lineSeries: group.lineSeries,

    extractionDecision: group.extractionDecision,

    candidateCount: group.candidateCount,

    sourceHosts: group.sourceHosts,

    snippetTerms: group.snippetTerms,

    reviewFile: 'src/legacyPrint/reviewPlans/stock-head-manual-review-workbench.md'

  }))

  .sort((a, b) => b.candidateCount - a.candidateCount);

const remainingFastLaneProductionOnly = nearlyPassable.filter((row) => {

  const missing = row.missingForStock || [];

  return missing.length === 1 && missing[0] === 'production status';

});

const remainingHeadOnly = nearlyPassable.filter((row) => {

  const missing = row.missingForStock || [];

  return missing.length > 0 && missing.every((field) =>

    ['stock batter head', 'stock reso head'].includes(field)

  );

});

const remainingHeadAndProduction = nearlyPassable.filter((row) => {

  const missing = row.missingForStock || [];

  return missing.includes('production status') &&

    (missing.includes('stock batter head') || missing.includes('stock reso head'));

});

const stockHeadExactWriteCount =

  readJson('src/legacyPrint/reviewPlans/stock-head-exact-source-backed-write-confirmation.json', {})?.summary?.actualWriteCount || 0;

const ludwigHeadOnlyWriteCount =

  readJson('src/legacyPrint/reviewPlans/ludwig-head-only-exact-head-write-confirmation.json', {})?.summary?.actualWriteCount || 0;

const productionStatusInitialWriteCount =

  readJson('src/legacyPrint/reviewPlans/production-status-only-stock-readiness-write-confirmation.json', {})?.summary?.actualWriteCount || 0;

const remainingProductionStatusWriteCount =

  readJson('src/legacyPrint/reviewPlans/remaining-production-status-only-write-confirmation.json', {})?.summary?.actualWriteCount || 0;

const productionStatusTotalWriteCount =

  productionStatusInitialWriteCount + remainingProductionStatusWriteCount;

const completedWrites = {

  metalEdgeFallbackWrites:

    readJson('src/legacyPrint/reviewPlans/metal-edge-fallback-firestore-write-confirmation.json', {})?.summary?.actualWriteCount || 0,

  productionStatusWrites: productionStatusTotalWriteCount,

  productionStatusInitialWrites: productionStatusInitialWriteCount,

  remainingProductionStatusWrites: remainingProductionStatusWriteCount,

  stockHeadExactWrites: stockHeadExactWriteCount,

  ludwigHeadOnlyExactWrites: ludwigHeadOnlyWriteCount,

  totalControlledWrites:

    (readJson('src/legacyPrint/reviewPlans/metal-edge-fallback-firestore-write-confirmation.json', {})?.summary?.actualWriteCount || 0) +

    productionStatusTotalWriteCount +

    stockHeadExactWriteCount +

    ludwigHeadOnlyWriteCount

};

const nextBatchRecommendations = [

  {

    rank: 1,

    lane: 'Manual source-backed stock-head review',

    targetCount: rankedManualReviewGroups.reduce((sum, group) => sum + group.candidateCount, 0),

    artifact: 'src/legacyPrint/reviewPlans/stock-head-manual-review-workbench.md',

    topGroups: rankedManualReviewGroups.slice(0, 6)

  },

  {

    rank: 2,

    lane: 'Remaining production-status-only cleanup',

    targetCount: remainingFastLaneProductionOnly.length,

    byCompany: countBy(remainingFastLaneProductionOnly, (row) => row.companyName)

  },

  {

    rank: 3,

    lane: 'Head-only records with no production blocker',

    targetCount: remainingHeadOnly.length,

    byCompany: countBy(remainingHeadOnly, (row) => row.companyName)

  },

  {

    rank: 4,

    lane: 'Mixed head + production records',

    targetCount: remainingHeadAndProduction.length,

    byCompany: countBy(remainingHeadAndProduction, (row) => row.companyName)

  }

];

const outFile = path.join(reviewDir, 'legacyprint-readiness-progress-dashboard-and-next-batches.json');

const markdownFile = path.join(reviewDir, 'legacyprint-readiness-progress-dashboard-and-next-batches.md');

const output = {

  status: 'LEGACYPRINT_READINESS_PROGRESS_DASHBOARD_AND_NEXT_BATCHES_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  collectionName: 'snareReferenceDrums',

  noFirestoreWrites: true,

  latestAudits: {

    strictShellAudit: latestShellPath,

    strictPassableAudit: latestPassablePath

  },

  summary: {

    totalRecordsScanned: passable.totalRecordsScanned,

    completedWrites,

    coreShellStrictTierCounts: passable.coreShellStrictTierCounts,

    stockStrictTierCounts: passable.stockStrictTierCounts,

    fallbackTierAuditCheck: passable.fallbackTierAuditCheck || null,

    strictShellSummary: shell.summary || null,

    coreUsableCount: coreUsableRows.length,

    nearlyPassableStockCount: nearlyPassable.length,

    nearlyPassableMissingCombos: countBy(nearlyPassable, (row) =>

      (row.missingForStock || []).join(' + ') || 'none'

    ),

    nearlyPassableByCompany: countBy(nearlyPassable, (row) => row.companyName),

    remainingFastLaneProductionOnlyCount: remainingFastLaneProductionOnly.length,

    remainingHeadOnlyCount: remainingHeadOnly.length,

    remainingHeadAndProductionCount: remainingHeadAndProduction.length,

    manualReviewCandidateCount: rankedManualReviewGroups.reduce((sum, group) => sum + group.candidateCount, 0),

    manualReviewGroupCount: rankedManualReviewGroups.length,

    firestoreWrites: 0

  },

  nextBatchRecommendations

};

const lines = [

  '# LegacyPrint Readiness Progress Dashboard',

  '',

  `Generated: ${output.generatedAt}`,

  '',

  '## Completed Writes',

  '',

  `- Metal-edge fallback writes: ${completedWrites.metalEdgeFallbackWrites}`,

  `- Production-status writes: ${completedWrites.productionStatusWrites}`,

  `- Exact source-backed stock-head writes: ${completedWrites.stockHeadExactWrites}`,
  `- Ludwig head-only exact writes: ${completedWrites.ludwigHeadOnlyExactWrites}`,
  `- Total controlled writes: ${completedWrites.totalControlledWrites}`,

  '',

  '## Current Snapshot',

  '',

  `- Total records scanned: ${output.summary.totalRecordsScanned}`,

  `- Core usable rows: ${output.summary.coreUsableCount}`,

  `- Nearly passable stock rows: ${output.summary.nearlyPassableStockCount}`,

  `- Manual review stock-head candidates: ${output.summary.manualReviewCandidateCount}`,

  '',

  '## Next Batch Recommendations',

  '',

  ...nextBatchRecommendations.flatMap((rec) => [

    `### ${rec.rank}. ${rec.lane}`,

    '',

    `Target count: ${rec.targetCount}`,

    '',

    rec.artifact ? `Artifact: \`${rec.artifact}\`` : '',

    ''

  ])

];

fs.writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);

fs.writeFileSync(markdownFile, `${lines.join('\n')}\n`);

console.log(JSON.stringify({

  outFile,

  markdownFile,

  status: output.status,

  completedWrites,

  coreUsableCount: output.summary.coreUsableCount,

  nearlyPassableStockCount: output.summary.nearlyPassableStockCount,

  nextBatchRecommendations: nextBatchRecommendations.map((rec) => ({

    rank: rec.rank,

    lane: rec.lane,

    targetCount: rec.targetCount

  })),

  firestoreWrites: 0

}, null, 2));

