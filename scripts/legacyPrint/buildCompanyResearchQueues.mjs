// scripts/legacyPrint/buildCompanyResearchQueues.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// PHASE 3U — COMPANY RESEARCH QUEUE BUILDER

//

// READ-ONLY.

// Does NOT write Firestore.

// Does NOT create Firestore patches.

// Does NOT scrape data.

// Does NOT rescore drums.

// Does NOT modify source audit files.

//

// Input:

// tmp/legacyPrint-audits/strict-shell-field-quality-2026-05-21T03-57-24-135Z.json

//

// Output:

// tmp/legacyPrint-audits/company-research/

//   index.json

//   company-order-smallest-to-largest.csv

//   company-order-smallest-to-largest.json

//   <company-slug>/

//     company-dashboard.json

//     all-records.csv

//     all-records.json

//     nearly-meaningful-stock-pass.csv

//     nearly-meaningful-stock-pass.json

//     has-thickness-but-edge-unknown.csv

//     has-thickness-but-edge-unknown.json

//     has-edge-but-thickness-missing.csv

//     has-edge-but-thickness-missing.json

//     missing-thickness-and-edge.csv

//     missing-thickness-and-edge.json

//     stock-heads-needed.csv

//     stock-heads-needed.json

//     production-status-needed.csv

//     production-status-needed.json

//     company-profile-research-template.json

import fs from 'fs';

import path from 'path';

const DEFAULT_INPUT_PATH = path.resolve(

  'tmp/legacyPrint-audits/strict-shell-field-quality-2026-05-21T03-57-24-135Z.json'

);

const OUTPUT_ROOT = path.resolve('tmp/legacyPrint-audits/company-research');

const COMPANY_PROFILE_COLLECTION = 'legacyPrintCompanyProfiles';

const CANONICAL_COMPANY_ORDER = [

  { companyName: 'AHEAD', expectedCount: 33 },

  { companyName: 'WorldMax', expectedCount: 39, aliases: ['WorldMax/OEM', 'WorldMax', 'WorldMax/OEM Hardware', 'OEM'] },

  { companyName: 'Gretsch', expectedCount: 44 },

  { companyName: 'Craviotto', expectedCount: 49 },

  { companyName: 'Dunnett', expectedCount: 56 },

  { companyName: 'Pork Pie', expectedCount: 58 },

  { companyName: 'Premier', expectedCount: 61 },

  { companyName: 'Rogers', expectedCount: 61 },

  { companyName: 'Canopus', expectedCount: 63 },

  { companyName: 'Noble & Cooley', expectedCount: 66 },

  { companyName: 'Slingerland', expectedCount: 68 },

  { companyName: 'Yamaha', expectedCount: 84 },

  { companyName: 'SONOR', expectedCount: 98, aliases: ['Sonor', 'SONOR'] },

  { companyName: 'DW/PDP', expectedCount: 107, aliases: ['DW/PDP', 'DW', 'PDP', 'Drum Workshop'] },

  { companyName: 'Brady', expectedCount: 110 },

  { companyName: 'Mapex', expectedCount: 112 },

  { companyName: 'Tama', expectedCount: 121 },

  { companyName: 'Ludwig', expectedCount: 127 },

  { companyName: 'Pearl', expectedCount: 128 },

];

const CORE_FIELDS = [

  'companyName',

  'lineSeries',

  'modelName',

  'diameter',

  'depth',

  'shellMaterial',

  'shellConstruction',

  'shellThickness',

  'bearingEdge',

  'primarySourceUrl',

  'sourceConfidence',

];

const STOCK_FIELDS = [

  'hoopType',

  'stockBatterHead',

  'stockResoHead',

  'stockSnareWires',

  'productionStatus',

];

const CSV_COLUMNS = [

  'priority',

  'id',

  'label',

  'companyName',

  'lineSeries',

  'modelName',

  'diameter',

  'depth',

  'fieldQualityTier',

  'stockTier',

  'missingForCoreShell',

  'missingForStock',

  'shellMaterial',

  'shellConstruction',

  'shellThickness',

  'shellThicknessQualityTier',

  'bearingEdge',

  'bearingEdgeQualityTier',

  'hoopType',

  'stockBatterHead',

  'stockResoHead',

  'stockSnareWires',

  'productionStatus',

  'primarySourceUrl',

  'sourceConfidence',

  'nonCriticalMissingShell',

  'nonCriticalMissingStock',

  'reason',

];

function readJson(filePath) {

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function writeJson(filePath, data) {

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);

}

function writeCsv(filePath, rows) {

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const header = CSV_COLUMNS.join(',');

  const body = rows.map((row, index) => {

    const compact = compactRow(row, index + 1);

    return CSV_COLUMNS.map((column) => csvEscape(compact[column])).join(',');

  });

  fs.writeFileSync(filePath, [header, ...body].join('\n') + '\n');

}

function csvEscape(value) {

  if (value === undefined || value === null) return '';

  let output = '';

  if (Array.isArray(value)) {

    output = value.join(' | ');

  } else if (typeof value === 'object') {

    output = JSON.stringify(value);

  } else {

    output = String(value);

  }

  if (output.includes('"')) output = output.replace(/"/g, '""');

  if (

    output.includes(',') ||

    output.includes('\n') ||

    output.includes('\r') ||

    output.includes('"')

  ) {

    return `"${output}"`;

  }

  return output;

}

function normalizeText(value) {

  if (value === undefined || value === null) return '';

  return String(value).trim();

}

function normalizeCompanyKey(value) {

  return normalizeText(value)

    .toLowerCase()

    .replace(/&/g, 'and')

    .replace(/\+/g, 'and')

    .replace(/\//g, ' ')

    .replace(/[^a-z0-9]+/g, ' ')

    .replace(/\s+/g, ' ')

    .trim();

}

function slugifyCompany(value) {

  const normalized = normalizeCompanyKey(value)

    .replace(/\band\b/g, 'and')

    .replace(/\s+/g, '-');

  return normalized || 'unknown-company';

}

function findCanonicalCompanyName(rawCompanyName) {

  const rawKey = normalizeCompanyKey(rawCompanyName);

  for (const company of CANONICAL_COMPANY_ORDER) {

    const names = [company.companyName, ...(company.aliases || [])];

    if (names.some((name) => normalizeCompanyKey(name) === rawKey)) {

      return company.companyName;

    }

  }

  return normalizeText(rawCompanyName) || 'UNKNOWN_COMPANY';

}

function isMissing(row, fieldName) {

  const values = Array.isArray(row.missingForCoreShell)

    ? row.missingForCoreShell

    : [];

  const stockValues = Array.isArray(row.missingForStock)

    ? row.missingForStock

    : [];

  return values.includes(fieldName) || stockValues.includes(fieldName);

}

function hasMissingStockHead(row) {

  return isMissing(row, 'stock batter head') || isMissing(row, 'stock reso head');

}

function hasMissingProductionStatus(row) {

  return isMissing(row, 'production status');

}

function rowPriority(row) {

  let score = Number(row.priorityScore || 0);

  if (row.stockTier === 'NEARLY_MEANINGFUL_STOCK_PASS') score += 10000;

  if (row.fieldQualityTier === 'HAS_THICKNESS_BUT_EDGE_UNKNOWN') score += 8000;

  if (row.fieldQualityTier === 'HAS_EDGE_BUT_THICKNESS_MISSING') score += 7000;

  if (row.fieldQualityTier === 'MISSING_THICKNESS_AND_EDGE') score += 3000;

  if (row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS') score += 5000;

  if (hasMissingStockHead(row)) score += 800;

  if (hasMissingProductionStatus(row)) score += 500;

  if (normalizeText(row.sourceConfidence).toLowerCase() === 'high') score += 250;

  if (normalizeText(row.sourceConfidence).toLowerCase() === 'medium') score += 125;

  return score;

}

function sortRows(rows) {

  return [...rows].sort((a, b) => {

    const priorityDiff = rowPriority(b) - rowPriority(a);

    if (priorityDiff !== 0) return priorityDiff;

    const companyDiff = normalizeText(a.companyName).localeCompare(normalizeText(b.companyName));

    if (companyDiff !== 0) return companyDiff;

    const lineDiff = normalizeText(a.lineSeries).localeCompare(normalizeText(b.lineSeries));

    if (lineDiff !== 0) return lineDiff;

    return normalizeText(a.modelName).localeCompare(normalizeText(b.modelName));

  });

}

function compactRow(row, priority = null) {

  return {

    priority,

    id: row.id || '',

    label: row.label || '',

    companyName: row.companyName || '',

    lineSeries: row.lineSeries || '',

    modelName: row.modelName || '',

    diameter: row.diameter || '',

    depth: row.depth || '',

    fieldQualityTier: row.fieldQualityTier || '',

    stockTier: row.stockTier || '',

    missingForCoreShell: Array.isArray(row.missingForCoreShell)

      ? row.missingForCoreShell

      : [],

    missingForStock: Array.isArray(row.missingForStock)

      ? row.missingForStock

      : [],

    shellMaterial: row.shellMaterial || '',

    shellConstruction: row.shellConstruction || '',

    shellThickness: row.shellThickness || '',

    shellThicknessQualityTier: row.shellThicknessQualityTier || '',

    bearingEdge: row.bearingEdge || '',

    bearingEdgeQualityTier: row.bearingEdgeQualityTier || '',

    hoopType: row.hoopType || '',

    stockBatterHead: row.stockBatterHead || '',

    stockResoHead: row.stockResoHead || '',

    stockSnareWires: row.stockSnareWires || '',

    productionStatus: row.productionStatus || '',

    primarySourceUrl: row.primarySourceUrl || '',

    sourceConfidence: row.sourceConfidence || '',

    nonCriticalMissingShell: Array.isArray(row.nonCriticalMissingShell)

      ? row.nonCriticalMissingShell

      : [],

    nonCriticalMissingStock: Array.isArray(row.nonCriticalMissingStock)

      ? row.nonCriticalMissingStock

      : [],

    reason: row.reason || row.fieldQualityReason || row.stockReason || '',

  };

}

function summarizeCounts(rows) {

  const fieldQualityCounts = {};

  const stockTierCounts = {};

  const missingCoreCounts = {};

  const missingStockCounts = {};

  const lineSeriesCounts = {};

  for (const row of rows) {

    increment(fieldQualityCounts, row.fieldQualityTier || 'UNKNOWN_FIELD_QUALITY_TIER');

    increment(stockTierCounts, row.stockTier || 'UNKNOWN_STOCK_TIER');

    for (const field of row.missingForCoreShell || []) {

      increment(missingCoreCounts, field);

    }

    for (const field of row.missingForStock || []) {

      increment(missingStockCounts, field);

    }

    increment(lineSeriesCounts, row.lineSeries || 'UNKNOWN_LINE_SERIES');

  }

  return {

    totalRecords: rows.length,

    fieldQualityCounts,

    stockTierCounts,

    missingCoreCounts: sortCountObject(missingCoreCounts),

    missingStockCounts: sortCountObject(missingStockCounts),

    lineSeriesCounts: sortCountObject(lineSeriesCounts),

  };

}

function sortCountObject(obj) {

  return Object.entries(obj)

    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

    .map(([name, count]) => ({ name, count }));

}

function increment(obj, key, amount = 1) {

  const safeKey = key || 'UNKNOWN';

  obj[safeKey] = (obj[safeKey] || 0) + amount;

}

function buildCompanyProfileTemplate(companyName, rows) {

  const companyId = slugifyCompany(companyName);

  const sourceUrls = unique(

    rows

      .map((row) => row.primarySourceUrl)

      .filter(Boolean)

  );

  return {

    collection: COMPANY_PROFILE_COLLECTION,

    mode: 'researchTemplateOnly',

    status: 'notResearched',

    companyId,

    companyName,

    companyProfileDataIsEnrichmentOnly: true,

    readinessWarning:

      'Company profile data must not affect drum readiness or node scoring unless tied to a specific physical drum field already represented in snareReferenceDrums.',

    profile: {

      companyName,

      headquarters: {

        city: '',

        stateRegion: '',

        country: '',

      },

      establishedYear: null,

      stillInBusiness: null,

      website: '',

      companySummary: '',

      shellBuildingMethods: [

        {

          methodName: '',

          description: '',

          acousticRelevance: '',

          appliesToLines: [],

          sourceUrl: '',

          sourceConfidence: '',

        },

      ],

      notableTechnologies: [],

      notableSeries: [],

      funFacts: [],

      sourceUrls: [],

      sourceConfidence: '',

      notes: '',

      lastResearchedAt: null,

    },

    datasetContext: {

      totalRecordsInSnareReferenceCollectionForCompany: rows.length,

      lineSeriesFoundInCurrentDataset: summarizeCounts(rows).lineSeriesCounts,

      existingPrimarySourceUrlsFromDrumRecords: sourceUrls.slice(0, 25),

    },

  };

}

function unique(values) {

  return [...new Set(values.filter(Boolean))];

}

function getRowsByCompany(report) {

  const allRows = Array.isArray(report.allRows) ? report.allRows : [];

  const grouped = new Map();

  for (const row of allRows) {

    const canonicalCompanyName = findCanonicalCompanyName(row.companyName);

    const normalizedRow = {

      ...row,

      companyName: canonicalCompanyName,

    };

    if (!grouped.has(canonicalCompanyName)) {

      grouped.set(canonicalCompanyName, []);

    }

    grouped.get(canonicalCompanyName).push(normalizedRow);

  }

  return grouped;

}

function getCompanySortOrder(companyName, rows) {

  const canonical = CANONICAL_COMPANY_ORDER.find(

    (company) => company.companyName === companyName

  );

  if (canonical) {

    return {

      expectedCount: canonical.expectedCount,

      orderSource: 'canonicalPhase3UOrder',

    };

  }

  return {

    expectedCount: rows.length,

    orderSource: 'actualCountFallback',

  };

}

function buildCompanyDashboard(companyName, rows, report) {

  const sorted = sortRows(rows);

  const summary = summarizeCounts(sorted);

  const nearlyMeaningfulStockPass = sorted.filter(

    (row) => row.stockTier === 'NEARLY_MEANINGFUL_STOCK_PASS'

  );

  const hasThicknessButEdgeUnknown = sorted.filter(

    (row) => row.fieldQualityTier === 'HAS_THICKNESS_BUT_EDGE_UNKNOWN'

  );

  const hasEdgeButThicknessMissing = sorted.filter(

    (row) => row.fieldQualityTier === 'HAS_EDGE_BUT_THICKNESS_MISSING'

  );

  const missingThicknessAndEdge = sorted.filter(

    (row) => row.fieldQualityTier === 'MISSING_THICKNESS_AND_EDGE'

  );

  const stockHeadsNeeded = sorted.filter(hasMissingStockHead);

  const productionStatusNeeded = sorted.filter(hasMissingProductionStatus);

  const meaningfulCoreShellPass = sorted.filter(

    (row) => row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS'

  );

  const meaningfulStockPass = sorted.filter(

    (row) => row.stockTier === 'MEANINGFUL_STOCK_PASS'

  );

  return {

    phase: 'PHASE_3U_COMPANY_RESEARCH_QUEUE',

    generatedAt: new Date().toISOString(),

    sourceAuditFile: report.__sourceAuditFile || '',

    sourceAuditGeneratedAt: report.generatedAt || '',

    companyName,

    companyId: slugifyCompany(companyName),

    mode: 'READ_ONLY_QUEUE_OUTPUT',

    firestoreWrites: false,

    patchCreation: false,

    scraping: false,

    rescoring: false,

    companyProfileCollectionPreparedForFutureUse: COMPANY_PROFILE_COLLECTION,

    companyProfileDataIsEnrichmentOnly: true,

    totalRecords: sorted.length,

    readinessSnapshot: {

      meaningfulCoreShellPass: meaningfulCoreShellPass.length,

      meaningfulStockPass: meaningfulStockPass.length,

      nearlyMeaningfulStockPass: nearlyMeaningfulStockPass.length,

      hasThicknessButEdgeUnknown: hasThicknessButEdgeUnknown.length,

      hasEdgeButThicknessMissing: hasEdgeButThicknessMissing.length,

      missingThicknessAndEdge: missingThicknessAndEdge.length,

      stockHeadsNeeded: stockHeadsNeeded.length,

      productionStatusNeeded: productionStatusNeeded.length,

    },

    summary,

    recommendedCompanyResearchOrder: [

      {

        queue: 'nearly-meaningful-stock-pass',

        count: nearlyMeaningfulStockPass.length,

        goal: 'Promote existing meaningful core-shell records into full stock pass by researching stock batter head, stock reso head, and production status.',

      },

      {

        queue: 'has-thickness-but-edge-unknown',

        count: hasThicknessButEdgeUnknown.length,

        goal: 'Promote records into meaningful core shell pass by researching meaningful bearing edge shape/detail.',

      },

      {

        queue: 'has-edge-but-thickness-missing',

        count: hasEdgeButThicknessMissing.length,

        goal: 'Promote records into meaningful core shell pass by researching valid numeric shell thickness.',

      },

      {

        queue: 'missing-thickness-and-edge',

        count: missingThicknessAndEdge.length,

        goal: 'Deeper research records missing both major shell-field blockers.',

      },

      {

        queue: 'stock-heads-needed',

        count: stockHeadsNeeded.length,

        goal: 'Research stock batter and resonant heads for records close to stock pass.',

      },

      {

        queue: 'production-status-needed',

        count: productionStatusNeeded.length,

        goal: 'Research current/discontinued status.',

      },

    ],

    firstResearchPromptHint: buildResearchPrompt(companyName, sorted, {

      nearlyMeaningfulStockPass,

      hasThicknessButEdgeUnknown,

      hasEdgeButThicknessMissing,

      missingThicknessAndEdge,

      stockHeadsNeeded,

      productionStatusNeeded,

    }),

    filesGeneratedForCompany: [

      'company-dashboard.json',

      'all-records.csv',

      'all-records.json',

      'nearly-meaningful-stock-pass.csv',

      'nearly-meaningful-stock-pass.json',

      'has-thickness-but-edge-unknown.csv',

      'has-thickness-but-edge-unknown.json',

      'has-edge-but-thickness-missing.csv',

      'has-edge-but-thickness-missing.json',

      'missing-thickness-and-edge.csv',

      'missing-thickness-and-edge.json',

      'stock-heads-needed.csv',

      'stock-heads-needed.json',

      'production-status-needed.csv',

      'production-status-needed.json',

      'company-profile-research-template.json',

    ],

  };

}

function buildResearchPrompt(companyName, rows, queues) {

  const topLines = summarizeCounts(rows)

    .lineSeriesCounts.slice(0, 8)

    .map((item) => `${item.name} (${item.count})`)

    .join(', ');

  const nearlyStockCount = queues.nearlyMeaningfulStockPass.length;

  const edgeUnknownCount = queues.hasThicknessButEdgeUnknown.length;

  const thicknessMissingCount = queues.hasEdgeButThicknessMissing.length;

  const missingBothCount = queues.missingThicknessAndEdge.length;

  return [

    `Research ${companyName} snare drum data for the Ober LegacyPrint™ Voicing Engine.`,

    `Use official manufacturer pages, official catalog PDFs, archived official catalogs, distributor pages, and major retailer specs in that order.`,

    `Do not use company reputation, price, collectibility, artist hype, or country of origin for acoustic scoring.`,

    `Dataset context for ${companyName}: ${rows.length} records. Top series/families: ${topLines || 'none detected'}.`,

    `Current queues: nearly meaningful stock pass ${nearlyStockCount}; has valid thickness but unknown/placeholder bearing edge ${edgeUnknownCount}; has meaningful edge but missing thickness ${thicknessMissingCount}; missing both thickness and edge ${missingBothCount}.`,

    `Drum fields needed: shell thickness, bearing edge shape/detail, stock batter head, stock reso head, stock snare wires, production status, source URL, and source confidence.`,

    `Also gather enrichment-only company profile data for legacyPrintCompanyProfiles: company name, headquarters, established year, still in business, website, shell-building methods, notable technologies, notable series, fun facts, company summary, and sources.`,

    `Company profile data is enrichment only and must not affect readiness or node scoring unless tied to a specific physical drum field already represented in the drum record.`,

    `Return a research packet only. Do not create Firestore writes and do not create patches yet.`,

  ].join('\n\n');

}

function writeCompanyFiles(companyName, rows, report) {

  const slug = slugifyCompany(companyName);

  const companyDir = path.join(OUTPUT_ROOT, slug);

  const sorted = sortRows(rows);

  const queues = {

    'all-records': sorted,

    'nearly-meaningful-stock-pass': sorted.filter(

      (row) => row.stockTier === 'NEARLY_MEANINGFUL_STOCK_PASS'

    ),

    'has-thickness-but-edge-unknown': sorted.filter(

      (row) => row.fieldQualityTier === 'HAS_THICKNESS_BUT_EDGE_UNKNOWN'

    ),

    'has-edge-but-thickness-missing': sorted.filter(

      (row) => row.fieldQualityTier === 'HAS_EDGE_BUT_THICKNESS_MISSING'

    ),

    'missing-thickness-and-edge': sorted.filter(

      (row) => row.fieldQualityTier === 'MISSING_THICKNESS_AND_EDGE'

    ),

    'stock-heads-needed': sorted.filter(hasMissingStockHead),

    'production-status-needed': sorted.filter(hasMissingProductionStatus),

  };

  const dashboard = buildCompanyDashboard(companyName, sorted, report);

  writeJson(path.join(companyDir, 'company-dashboard.json'), dashboard);

  for (const [queueName, queueRows] of Object.entries(queues)) {

    const compactRows = queueRows.map((row, index) => compactRow(row, index + 1));

    writeJson(path.join(companyDir, `${queueName}.json`), {

      queueName,

      companyName,

      companyId: slug,

      generatedAt: new Date().toISOString(),

      sourceAuditFile: report.__sourceAuditFile || '',

      totalRows: compactRows.length,

      rows: compactRows,

    });

    writeCsv(path.join(companyDir, `${queueName}.csv`), queueRows);

  }

  writeJson(

    path.join(companyDir, 'company-profile-research-template.json'),

    buildCompanyProfileTemplate(companyName, sorted)

  );

  return {

    companyName,

    companyId: slug,

    folder: companyDir,

    totalRecords: sorted.length,

    readinessSnapshot: dashboard.readinessSnapshot,

    files: dashboard.filesGeneratedForCompany,

  };

}

function buildMasterIndex(companyOutputs, report) {

  const sortedCompanyOutputs = [...companyOutputs].sort((a, b) => {

    const aOrder = getCompanySortOrder(a.companyName, new Array(a.totalRecords));

    const bOrder = getCompanySortOrder(b.companyName, new Array(b.totalRecords));

    const countDiff = aOrder.expectedCount - bOrder.expectedCount;

    if (countDiff !== 0) return countDiff;

    return a.companyName.localeCompare(b.companyName);

  });

  const companyOrderRows = sortedCompanyOutputs.map((company, index) => ({

    order: index + 1,

    companyName: company.companyName,

    companyId: company.companyId,

    actualRecordCount: company.totalRecords,

    expectedPhase3UCount: getCompanySortOrder(company.companyName, []).expectedCount,

    meaningfulCoreShellPass: company.readinessSnapshot.meaningfulCoreShellPass,

    meaningfulStockPass: company.readinessSnapshot.meaningfulStockPass,

    nearlyMeaningfulStockPass: company.readinessSnapshot.nearlyMeaningfulStockPass,

    hasThicknessButEdgeUnknown: company.readinessSnapshot.hasThicknessButEdgeUnknown,

    hasEdgeButThicknessMissing: company.readinessSnapshot.hasEdgeButThicknessMissing,

    missingThicknessAndEdge: company.readinessSnapshot.missingThicknessAndEdge,

    stockHeadsNeeded: company.readinessSnapshot.stockHeadsNeeded,

    productionStatusNeeded: company.readinessSnapshot.productionStatusNeeded,

    folder: company.folder,

  }));

  return {

    phase: 'PHASE_3U_COMPANY_RESEARCH_QUEUE_BUILDER',

    generatedAt: new Date().toISOString(),

    mode: 'READ_ONLY',

    sourceAuditFile: report.__sourceAuditFile || '',

    sourceAuditGeneratedAt: report.generatedAt || '',

    collectionName: report.collectionName || 'snareReferenceDrums',

    companyProfileCollectionPreparedForFutureUse: COMPANY_PROFILE_COLLECTION,

    globalReadinessFromSourceAudit: {

      totalRecordsScanned: report.totalRecordsScanned,

      fieldQualityCounts: report.fieldQualityCounts,

      stockTierCounts: report.stockTierCounts,

      shellThicknessQualityCounts: report.shellThicknessQualityCounts,

      bearingEdgeQualityCounts: report.bearingEdgeQualityCounts,

      sourceQualityCounts: report.sourceQualityCounts,

    },

    importantRules: [

      'No Firestore writes were performed.',

      'No patches were created.',

      'No scraping was performed.',

      'No drum rescoring was performed.',

      'Company profile data is enrichment only and must not affect readiness or node scoring unless tied to a specific physical drum field already represented in the drum record.',

    ],

    researchOrderSmallestToLargest: companyOrderRows,

    recommendedFirstCompany: companyOrderRows[0] || null,

    recommendedFirstResearchPrompt:

      companyOrderRows[0]

        ? `Start with ${companyOrderRows[0].companyName}. Open ${path.join(companyOrderRows[0].folder, 'company-dashboard.json')} and use the firstResearchPromptHint plus all queue CSVs in that folder.`

        : '',

    companyFoldersGenerated: sortedCompanyOutputs.map((company) => ({

      companyName: company.companyName,

      companyId: company.companyId,

      folder: company.folder,

      totalRecords: company.totalRecords,

      files: company.files,

    })),

  };

}

function writeCompanyOrderCsv(index) {

  const filePath = path.join(OUTPUT_ROOT, 'company-order-smallest-to-largest.csv');

  const columns = [

    'order',

    'companyName',

    'companyId',

    'actualRecordCount',

    'expectedPhase3UCount',

    'meaningfulCoreShellPass',

    'meaningfulStockPass',

    'nearlyMeaningfulStockPass',

    'hasThicknessButEdgeUnknown',

    'hasEdgeButThicknessMissing',

    'missingThicknessAndEdge',

    'stockHeadsNeeded',

    'productionStatusNeeded',

    'folder',

  ];

  const header = columns.join(',');

  const body = index.researchOrderSmallestToLargest.map((row) =>

    columns.map((column) => csvEscape(row[column])).join(',')

  );

  fs.writeFileSync(filePath, [header, ...body].join('\n') + '\n');

}

function validateReport(report, inputPath) {

  if (!report || typeof report !== 'object') {

    throw new Error('Input report is not a JSON object.');

  }

  if (!Array.isArray(report.allRows)) {

    throw new Error('Input report is missing allRows array.');

  }

  if (!report.allRows.length) {

    throw new Error('Input report allRows array is empty.');

  }

  report.__sourceAuditFile = inputPath;

  return report;

}

function printConsoleSummary(index) {

  console.log('');

  console.log('PHASE 3U COMPANY RESEARCH QUEUE BUILDER COMPLETE');

  console.log('Mode: READ ONLY');

  console.log('');

  console.log('OUTPUT ROOT');

  console.log(OUTPUT_ROOT);

  console.log('');

  console.log('COMPANY ORDER — SMALLEST TO LARGEST');

  console.table(

    index.researchOrderSmallestToLargest.map((row) => ({

      order: row.order,

      companyName: row.companyName,

      actualRecordCount: row.actualRecordCount,

      meaningfulCoreShellPass: row.meaningfulCoreShellPass,

      nearlyMeaningfulStockPass: row.nearlyMeaningfulStockPass,

      hasThicknessButEdgeUnknown: row.hasThicknessButEdgeUnknown,

      hasEdgeButThicknessMissing: row.hasEdgeButThicknessMissing,

      missingThicknessAndEdge: row.missingThicknessAndEdge,

    }))

  );

  console.log('');

  console.log('FIRST COMPANY RECOMMENDATION');

  console.dir(index.recommendedFirstCompany, { depth: null });

  console.log('');

  console.log('GENERATED ROOT FILES');

  console.log(path.join(OUTPUT_ROOT, 'index.json'));

  console.log(path.join(OUTPUT_ROOT, 'company-order-smallest-to-largest.json'));

  console.log(path.join(OUTPUT_ROOT, 'company-order-smallest-to-largest.csv'));

  console.log('');

  console.log('GENERATED COMPANY FOLDERS');

  for (const company of index.companyFoldersGenerated) {

    console.log(`- ${company.companyName}: ${company.folder}`);

  }

  console.log('');

  console.log('RECOMMENDED FIRST AHEAD RESEARCH PROMPT');

  const ahead = index.companyFoldersGenerated.find((company) => company.companyName === 'AHEAD');

  if (ahead) {

    const dashboardPath = path.join(ahead.folder, 'company-dashboard.json');

    const dashboard = readJson(dashboardPath);

    console.log(dashboard.firstResearchPromptHint);

  } else {

    console.log('AHEAD folder was not generated. Check company naming in source audit.');

  }

  console.log('');

  console.log('MASTER REPORT-BACK TEXT');

  console.log(buildMasterReportBackText(index));

  console.log('');

}

function buildMasterReportBackText(index) {

  const first = index.recommendedFirstCompany;

  return [

    'Phase 3U company research queue builder is complete.',

    `Input audit: ${index.sourceAuditFile}`,

    `Output root: ${OUTPUT_ROOT}`,

    `Companies generated: ${index.companyFoldersGenerated.length}`,

    'The script created company-by-company research folders in smallest-to-largest order, with dashboard files and CSV/JSON queues for all records, nearly meaningful stock pass, thickness-ready edge cleanup, edge-ready thickness cleanup, missing thickness and edge, stock heads needed, and production status needed.',

    'No Firestore writes were performed. No patches were created. No scraping was performed. No drum rescoring was performed.',

    first

      ? `Recommended first research company: ${first.companyName}, with ${first.actualRecordCount} records.`

      : 'No recommended first company was found.',

    'Company profile enrichment is prepared for future collection legacyPrintCompanyProfiles, but profile data remains enrichment only and does not affect readiness or node scoring unless tied to a specific physical drum field.',

  ].join(' ');

}

function main() {

  const inputPath = path.resolve(process.argv[2] || DEFAULT_INPUT_PATH);

  console.log('');

  console.log('OBER LEGACYPRINT™ DATA + RESEARCH');

  console.log('PHASE 3U COMPANY RESEARCH QUEUE BUILDER');

  console.log('Mode: READ ONLY');

  console.log(`Input: ${inputPath}`);

  console.log('');

  if (!fs.existsSync(inputPath)) {

    throw new Error(`Input audit file not found: ${inputPath}`);

  }

  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  const report = validateReport(readJson(inputPath), inputPath);

  const grouped = getRowsByCompany(report);

  const companyOutputs = [];

  for (const [companyName, rows] of grouped.entries()) {

    companyOutputs.push(writeCompanyFiles(companyName, rows, report));

  }

  const index = buildMasterIndex(companyOutputs, report);

  writeJson(path.join(OUTPUT_ROOT, 'index.json'), index);

  writeJson(

    path.join(OUTPUT_ROOT, 'company-order-smallest-to-largest.json'),

    index.researchOrderSmallestToLargest

  );

  writeCompanyOrderCsv(index);

  printConsoleSummary(index);

}

main();