import fs from 'fs';

import path from 'path';

const AUDIT_DIR = 'tmp/legacyPrint-audits';

const OUTPUT_PREFIX = 'stock-head-fallback-candidates';

function readJson(filePath) {

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function latestStrictAuditPath() {

  const files = fs.readdirSync(AUDIT_DIR)

    .filter((name) => name.startsWith('strict-shell-field-quality-') && name.endsWith('.json'))

    .map((name) => path.join(AUDIT_DIR, name))

    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (!files.length) {

    throw new Error('No strict shell field quality audit found in ' + AUDIT_DIR);

  }

  return files[0];

}

function text(value) {

  if (value === null || value === undefined) return '';

  if (typeof value === 'string') return value.trim();

  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {

    return JSON.stringify(value);

  } catch {

    return String(value);

  }

}

function hasMissing(row, field) {

  return Array.isArray(row.missingForStock) && row.missingForStock.includes(field);

}

function hasStockHeadMissing(row) {

  return hasMissing(row, 'stock batter head') || hasMissing(row, 'stock reso head');

}

function isFallbackCore(row) {

  return row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK';

}

function isSourceConfirmedCore(row) {

  return row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS';

}

function groupCount(rows, keyFn) {

  return rows.reduce((acc, row) => {

    const key = keyFn(row) || 'UNKNOWN';

    acc[key] = (acc[key] || 0) + 1;

    return acc;

  }, {});

}

function compact(row) {

  return {

    id: row.id,

    label: row.label,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    fieldQualityTier: row.fieldQualityTier,

    stockTier: row.stockTier,

    missingForStock: row.missingForStock || [],

    stockBatterHead: text(row.stockBatterHead),

    stockResoHead: text(row.stockResoHead),

    stockSnareWires: text(row.stockSnareWires),

    productionStatus: text(row.productionStatus),

    primarySourceUrl: row.primarySourceUrl,

    sourceConfidence: row.sourceConfidence,

    priorityScore: row.priorityScore

  };

}

function main() {

  const strictAuditPath = latestStrictAuditPath();

  const strictAudit = readJson(strictAuditPath);

  const rows = strictAudit.allRows || [];

  const nearlyStock = rows.filter((row) => row.stockTier === 'NEARLY_MEANINGFUL_STOCK_PASS');

  const stockHeadMissing = nearlyStock.filter(hasStockHeadMissing);

  const productionMissing = nearlyStock.filter((row) => hasMissing(row, 'production status'));

  const sourceConfirmedCoreStockHeadMissing = stockHeadMissing.filter(isSourceConfirmedCore);

  const metalFallbackCoreStockHeadMissing = stockHeadMissing.filter(isFallbackCore);

  const bothHeadsMissing = stockHeadMissing.filter((row) =>

    hasMissing(row, 'stock batter head') && hasMissing(row, 'stock reso head')

  );

  const batterOnlyMissing = stockHeadMissing.filter((row) =>

    hasMissing(row, 'stock batter head') && !hasMissing(row, 'stock reso head')

  );

  const resoOnlyMissing = stockHeadMissing.filter((row) =>

    !hasMissing(row, 'stock batter head') && hasMissing(row, 'stock reso head')

  );

  const output = {

    auditName: 'OBER LEGACYPRINT™ STOCK HEAD FALLBACK CANDIDATE AUDIT',

    mode: 'READ_ONLY',

    sourceStrictAuditFile: strictAuditPath,

    generatedAt: new Date().toISOString(),

    collectionName: strictAudit.collectionName || 'snareReferenceDrums',

    fallbackRuleStatus: 'NO_WRITES_NO_RULES_APPLIED',

    note: 'This audit only identifies candidates. It does not assume stock head defaults are valid. Company-level default head rules must be source-backed before promotion.',

    summary: {

      totalRows: rows.length,

      nearlyMeaningfulStockPass: nearlyStock.length,

      stockHeadMissing: stockHeadMissing.length,

      productionStatusMissing: productionMissing.length,

      sourceConfirmedCoreStockHeadMissing: sourceConfirmedCoreStockHeadMissing.length,

      metalFallbackCoreStockHeadMissing: metalFallbackCoreStockHeadMissing.length,

      bothHeadsMissing: bothHeadsMissing.length,

      batterOnlyMissing: batterOnlyMissing.length,

      resoOnlyMissing: resoOnlyMissing.length,

      byCompany: groupCount(stockHeadMissing, (row) => row.companyName),

      byFieldQualityTier: groupCount(stockHeadMissing, (row) => row.fieldQualityTier),

      byMissingCombo: groupCount(stockHeadMissing, (row) => (row.missingForStock || []).join(' + '))

    },

    candidatesByCompany: Object.entries(groupCount(stockHeadMissing, (row) => row.companyName))

      .sort((a, b) => b[1] - a[1])

      .map(([companyName, count]) => ({

        companyName,

        count,

        records: stockHeadMissing

          .filter((row) => (row.companyName || 'UNKNOWN') === companyName)

          .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))

          .map(compact)

      })),

    allCandidates: stockHeadMissing

      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))

      .map(compact),

    topPriorityCandidates: stockHeadMissing

      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))

      .slice(0, 100)

      .map(compact)

  };

  fs.mkdirSync(AUDIT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const outputPath = path.join(AUDIT_DIR, OUTPUT_PREFIX + '-' + timestamp + '.json');

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('\nSTOCK HEAD FALLBACK CANDIDATE AUDIT COMPLETE');

  console.log(JSON.stringify(output.summary, null, 2));

  console.log('\nJSON report written to: ' + outputPath);

}

main();

