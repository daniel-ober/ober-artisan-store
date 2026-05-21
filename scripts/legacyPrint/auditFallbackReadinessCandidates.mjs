// scripts/legacyPrint/auditFallbackReadinessCandidates.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// PHASE 3V — FALLBACK READINESS CANDIDATE AUDIT

//

// READ-ONLY.

// Does NOT write Firestore.

// Does NOT create patches.

// Does NOT scrape data.

// Does NOT rescore drums.

//

// Purpose:

// Reads the strict shell field quality audit JSON and identifies records that may qualify for:

// 1. MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK

// 2. MEANINGFUL_STOCK_PASS_WITH_HEAD_FALLBACK

// 3. MEANINGFUL_STOCK_PASS_WITH_METAL_EDGE_AND_HEAD_FALLBACK

//

// Input default:

// tmp/legacyPrint-audits/strict-shell-field-quality-2026-05-21T03-57-24-135Z.json

//

// Output:

// tmp/legacyPrint-audits/fallback-readiness-candidates/

import fs from 'fs';

import path from 'path';

const DEFAULT_INPUT_PATH = path.resolve(

  'tmp/legacyPrint-audits/strict-shell-field-quality-2026-05-21T03-57-24-135Z.json'

);

const OUTPUT_ROOT = path.resolve(

  'tmp/legacyPrint-audits/fallback-readiness-candidates'

);

const METAL_EDGE_FALLBACK_KEY = 'metal-formed-machined-default';

const METAL_EDGE_FALLBACK = {

  batterSideProfile: 'formed/machined metal bearing edge',

  snareSideProfile: 'formed/machined metal bearing edge',

  roundover: 'unknown',

  evidenceLevel: 'engineMetalFallback',

  confidence: 'Fallback',

  sourceType: 'LegacyPrint metal-shell fallback rule',

  notes:

    'Exact bearing edge geometry not published. Applied LegacyPrint metal-shell fallback based on metal shell construction.',

};

const COMPANY_HEAD_FALLBACKS = {

  AHEAD: {

    stockHeadFallbackKey: 'remo-coated-ambassador-ambassador-snare-side',

    batterHead: 'Remo Coated Ambassador',

    resoHead: 'Remo Ambassador Snare Side',

    brandBasis: 'Remo',

    sourceText: 'Remo USA Heads',

    evidenceLevel: 'companyHeadBrandFallback',

    confidence: 'Fallback',

    reason:

      'Exact stock batter/reso models not published. Company/distributor source confirms Remo USA Heads for this snare family.',

  },

  SONOR: {

    stockHeadFallbackKey: 'remo-coated-ambassador-ambassador-snare-side',

    batterHead: 'Remo Coated Ambassador',

    resoHead: 'Remo Ambassador Snare Side',

    brandBasis: 'Remo',

    sourceText: 'Company-level Remo stock head fallback; exact model must be verified per series.',

    evidenceLevel: 'companyHeadBrandFallback',

    confidence: 'Fallback',

    reason:

      'Exact stock batter/reso models not published for this record. Use only where company/series source confirms Remo stock heads.',

  },

  Canopus: {

    stockHeadFallbackKey: 'remo-coated-ambassador-ambassador-snare-side',

    batterHead: 'Remo Coated Ambassador',

    resoHead: 'Remo Ambassador Snare Side',

    brandBasis: 'Remo',

    sourceText: 'Company-level Remo stock head fallback; exact model must be verified per series.',

    evidenceLevel: 'companyHeadBrandFallback',

    confidence: 'Fallback',

    reason:

      'Exact stock batter/reso models not published for this record. Use only where company/series source confirms Remo stock heads.',

  },

};

const CSV_COLUMNS = [

  'priority',

  'id',

  'label',

  'companyName',

  'lineSeries',

  'modelName',

  'diameter',

  'depth',

  'currentFieldQualityTier',

  'currentStockTier',

  'projectedCoreShellTier',

  'projectedStockTier',

  'fallbackTypes',

  'shellMaterial',

  'shellConstructionType',

  'shellThickness',

  'bearingEdgeQualityTier',

  'hoopType',

  'stockSnareWires',

  'stockBatterHead',

  'stockResoHead',

  'productionStatus',

  'primarySourceUrl',

  'sourceConfidence',

  'metalEdgeFallbackKey',

  'stockHeadFallbackKey',

  'stockHeadFallbackBatter',

  'stockHeadFallbackReso',

  'stockHeadFallbackBrandBasis',

  'notes',

];

function main() {

  const inputPath = path.resolve(process.argv[2] || DEFAULT_INPUT_PATH);

  console.log('');

  console.log('OBER LEGACYPRINT™ DATA + RESEARCH');

  console.log('PHASE 3V FALLBACK READINESS CANDIDATE AUDIT');

  console.log('Mode: READ ONLY');

  console.log(`Input: ${inputPath}`);

  console.log('');

  if (!fs.existsSync(inputPath)) {

    throw new Error(`Input audit file not found: ${inputPath}`);

  }

  const report = readJson(inputPath);

  if (!Array.isArray(report.allRows)) {

    throw new Error('Input audit JSON is missing expected allRows array.');

  }

  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  fs.mkdirSync(path.join(OUTPUT_ROOT, 'by-company'), { recursive: true });

  const rows = report.allRows.map(normalizeAuditRow);

  const metalEdgeFallbackCandidates = rows

    .filter(qualifiesForMetalEdgeFallback)

    .map((row) => buildCandidate(row, ['metalEdgeFallback']));

  const stockHeadFallbackCandidates = rows

    .filter(qualifiesForStockHeadFallback)

    .map((row) => buildCandidate(row, ['stockHeadFallback']));

  const combinedFallbackCandidates = rows

    .filter((row) => {

      return (

        qualifiesForMetalEdgeFallback(row) &&

        qualifiesForStockHeadFallback(row, {

          allowProjectedMetalEdgeFallback: true,

        })

      );

    })

    .map((row) =>

      buildCandidate(row, ['metalEdgeFallback', 'stockHeadFallback'])

    );

  writeQueueFiles(

    'metal-edge-fallback-candidates',

    metalEdgeFallbackCandidates

  );

  writeQueueFiles(

    'stock-head-fallback-candidates',

    stockHeadFallbackCandidates

  );

  writeQueueFiles(

    'combined-metal-edge-and-head-fallback-candidates',

    combinedFallbackCandidates

  );

  writeByCompanyFiles([

    ...metalEdgeFallbackCandidates,

    ...stockHeadFallbackCandidates,

    ...combinedFallbackCandidates,

  ]);

  const index = buildIndex({

    inputPath,

    sourceAuditGeneratedAt: report.generatedAt || '',

    totalRows: rows.length,

    metalEdgeFallbackCandidates,

    stockHeadFallbackCandidates,

    combinedFallbackCandidates,

  });

  writeJson(path.join(OUTPUT_ROOT, 'index.json'), index);

  printSummary(index);

}

function normalizeAuditRow(row) {

  const parsedShellConstruction = parseMaybeJson(row.shellConstruction);

  const parsedBearingEdge = parseMaybeJson(row.bearingEdge);

  const parsedHoopType = parseMaybeJson(row.hoopType);

  const parsedStockSnareWires = parseMaybeJson(row.stockSnareWires);

  const companyName = clean(row.companyName);

  const shellMaterial =

    clean(row.shellMaterial) ||

    clean(parsedShellConstruction?.shellMaterialPrimary);

  const shellConstruction =

    parsedShellConstruction || row.shellConstruction || '';

  const shellConstructionType =

    clean(parsedShellConstruction?.shellConstruction) ||

    inferShellConstructionType(row);

  const shellThickness =

    toNumber(row.shellThickness) ||

    toNumber(parsedShellConstruction?.shellThicknessMm);

  const missingForCoreShell = arrayify(row.missingForCoreShell);

  const missingForStock = arrayify(row.missingForStock);

  return {

    raw: row,

    id: clean(row.id),

    label: clean(row.label),

    companyName,

    lineSeries: clean(row.lineSeries),

    modelName: clean(row.modelName),

    diameter: clean(row.diameter),

    depth: clean(row.depth),

    fieldQualityTier: clean(row.fieldQualityTier),

    stockTier: clean(row.stockTier),

    missingForCoreShell,

    missingForStock,

    shellMaterial,

    shellConstruction,

    shellConstructionType,

    shellThickness,

    shellThicknessQualityTier: clean(row.shellThicknessQualityTier),

    bearingEdge: parsedBearingEdge || row.bearingEdge || '',

    bearingEdgeQualityTier: clean(row.bearingEdgeQualityTier),

    hoopType: parsedHoopType || row.hoopType || '',

    stockBatterHead: clean(row.stockBatterHead),

    stockResoHead: clean(row.stockResoHead),

    stockSnareWires: parsedStockSnareWires || row.stockSnareWires || '',

    productionStatus: clean(row.productionStatus),

    primarySourceUrl: clean(row.primarySourceUrl),

    sourceConfidence: clean(row.sourceConfidence),

    nonCriticalMissingShell: arrayify(row.nonCriticalMissingShell),

    nonCriticalMissingStock: arrayify(row.nonCriticalMissingStock),

  };

}

function qualifiesForMetalEdgeFallback(row) {

  return (

    hasIdentity(row) &&

    isMetalShell(row) &&

    hasValidShellThickness(row) &&

    hasSource(row) &&

    hasUnknownOrPlaceholderBearingEdge(row)

  );

}

function qualifiesForStockHeadFallback(

  row,

  options = { allowProjectedMetalEdgeFallback: false }

) {

  const coreShellReady =

    row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS' ||

    (options.allowProjectedMetalEdgeFallback &&

      qualifiesForMetalEdgeFallback(row));

  if (!coreShellReady) return false;

  if (!hasSource(row)) return false;

  if (!hasHoopType(row)) return false;

  if (!hasStockSnareWires(row)) return false;

  if (!hasKnownOrFallbackCompanyHeadBrand(row)) return false;

  const batterMissing = isBlank(row.stockBatterHead);

  const resoMissing = isBlank(row.stockResoHead);

  return batterMissing || resoMissing;

}

function buildCandidate(row, fallbackTypes) {

  const appliesMetalEdgeFallback = fallbackTypes.includes('metalEdgeFallback');

  const appliesStockHeadFallback = fallbackTypes.includes('stockHeadFallback');

  const stockHeadFallback = appliesStockHeadFallback

    ? getCompanyHeadFallback(row.companyName)

    : null;

  const projectedCoreShellTier = appliesMetalEdgeFallback

    ? 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK'

    : row.fieldQualityTier;

  const projectedStockTier = resolveProjectedStockTier(row, {

    appliesMetalEdgeFallback,

    appliesStockHeadFallback,

  });

  const projectedEngineAssumptions = {};

  const projectedEngineDerivedFields = {};

  if (appliesMetalEdgeFallback) {

    projectedEngineAssumptions.bearingEdgeFallbackApplied = true;

    projectedEngineAssumptions.bearingEdgeFallbackKey =

      METAL_EDGE_FALLBACK_KEY;

    projectedEngineAssumptions.bearingEdgeFallbackReason =

      'Metal shell record has valid material, construction, thickness, diameter, depth, source URL, and source confidence, but no published bearing edge geometry.';

    projectedEngineAssumptions.bearingEdgeNeedsVerification = true;

    projectedEngineDerivedFields.bearingEdgeFallback = METAL_EDGE_FALLBACK;

  }

  if (appliesStockHeadFallback && stockHeadFallback) {

    projectedEngineAssumptions.stockHeadFallbackApplied = true;

    projectedEngineAssumptions.stockHeadFallbackKey =

      stockHeadFallback.stockHeadFallbackKey;

    projectedEngineAssumptions.stockHeadFallbackReason =

      stockHeadFallback.reason;

    projectedEngineAssumptions.stockHeadNeedsVerification = true;

    projectedEngineDerivedFields.stockHeadFallback = {

      batterHead: stockHeadFallback.batterHead,

      resoHead: stockHeadFallback.resoHead,

      brandBasis: stockHeadFallback.brandBasis,

      sourceText: stockHeadFallback.sourceText,

      evidenceLevel: stockHeadFallback.evidenceLevel,

      confidence: stockHeadFallback.confidence,

    };

  }

  return {

    id: row.id,

    label: row.label,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    diameter: row.diameter,

    depth: row.depth,

    currentFieldQualityTier: row.fieldQualityTier,

    currentStockTier: row.stockTier,

    projectedCoreShellTier,

    projectedStockTier,

    fallbackTypes,

    shellMaterial: row.shellMaterial,

    shellConstructionType: row.shellConstructionType,

    shellThickness: row.shellThickness,

    bearingEdgeQualityTier: row.bearingEdgeQualityTier,

    hoopType: row.hoopType,

    stockSnareWires: row.stockSnareWires,

    stockBatterHead: row.stockBatterHead,

    stockResoHead: row.stockResoHead,

    productionStatus: row.productionStatus,

    primarySourceUrl: row.primarySourceUrl,

    sourceConfidence: row.sourceConfidence,

    projectedEngineAssumptions,

    projectedEngineDerivedFields,

    stockHeadFallback,

    notes: buildCandidateNotes(row, {

      appliesMetalEdgeFallback,

      appliesStockHeadFallback,

      stockHeadFallback,

    }),

  };

}

function resolveProjectedStockTier(

  row,

  { appliesMetalEdgeFallback, appliesStockHeadFallback }

) {

  const coreShellReady =

    row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS' ||

    appliesMetalEdgeFallback;

  if (!coreShellReady) return row.stockTier || 'STOCK_BLOCKED_BY_CORE_SHELL';

  const hasRequiredStockHardware =

    hasHoopType(row) && hasStockSnareWires(row);

  if (!hasRequiredStockHardware) {

    return 'STOCK_BLOCKED_BY_HARDWARE_OR_WIRES';

  }

  const productionKnown = !isBlank(row.productionStatus);

  if (appliesMetalEdgeFallback && appliesStockHeadFallback) {

    if (productionKnown) {

      return 'MEANINGFUL_STOCK_PASS_WITH_METAL_EDGE_AND_HEAD_FALLBACK';

    }

    return 'NEARLY_MEANINGFUL_STOCK_PASS_WITH_METAL_EDGE_AND_HEAD_FALLBACK_PRODUCTION_STATUS_NEEDED';

  }

  if (appliesMetalEdgeFallback) {

    if (!isBlank(row.stockBatterHead) && !isBlank(row.stockResoHead)) {

      if (productionKnown) {

        return 'MEANINGFUL_STOCK_PASS_WITH_METAL_EDGE_FALLBACK';

      }

      return 'NEARLY_MEANINGFUL_STOCK_PASS_WITH_METAL_EDGE_FALLBACK_PRODUCTION_STATUS_NEEDED';

    }

    return 'NEARLY_MEANINGFUL_STOCK_PASS_WITH_METAL_EDGE_FALLBACK_HEADS_NEEDED';

  }

  if (appliesStockHeadFallback) {

    if (productionKnown) {

      return 'MEANINGFUL_STOCK_PASS_WITH_HEAD_FALLBACK';

    }

    return 'NEARLY_MEANINGFUL_STOCK_PASS_WITH_HEAD_FALLBACK_PRODUCTION_STATUS_NEEDED';

  }

  return row.stockTier || 'UNKNOWN_STOCK_TIER';

}

function buildCandidateNotes(

  row,

  { appliesMetalEdgeFallback, appliesStockHeadFallback, stockHeadFallback }

) {

  const notes = [];

  if (appliesMetalEdgeFallback) {

    notes.push(

      `Metal edge fallback candidate: ${row.shellMaterial} ${row.shellConstructionType} shell, ${row.shellThickness}mm thickness, unknown/placeholder bearing edge.`

    );

  }

  if (appliesStockHeadFallback && stockHeadFallback) {

    notes.push(

      `Stock head fallback candidate: company fallback uses ${stockHeadFallback.batterHead} / ${stockHeadFallback.resoHead} based on ${stockHeadFallback.brandBasis} brand basis.`

    );

  }

  if (isBlank(row.productionStatus)) {

    notes.push('Production status still needs verification.');

  }

  if (isBlank(row.stockBatterHead) || isBlank(row.stockResoHead)) {

    notes.push('Exact stock batter/reso head models still need verification.');

  }

  return notes.join(' ');

}

function writeQueueFiles(queueName, candidates) {

  const jsonPath = path.join(OUTPUT_ROOT, `${queueName}.json`);

  const csvPath = path.join(OUTPUT_ROOT, `${queueName}.csv`);

  writeJson(jsonPath, {

    queueName,

    generatedAt: new Date().toISOString(),

    totalCandidates: candidates.length,

    candidates,

  });

  writeCsv(csvPath, candidates);

}

function writeByCompanyFiles(candidates) {

  const deduped = dedupeCandidates(candidates);

  const grouped = new Map();

  for (const candidate of deduped) {

    const companyName = candidate.companyName || 'UNKNOWN_COMPANY';

    if (!grouped.has(companyName)) {

      grouped.set(companyName, []);

    }

    grouped.get(companyName).push(candidate);

  }

  for (const [companyName, rows] of grouped.entries()) {

    const slug = slugify(companyName);

    const basePath = path.join(OUTPUT_ROOT, 'by-company', slug);

    writeJson(`${basePath}.json`, {

      companyName,

      companyId: slug,

      generatedAt: new Date().toISOString(),

      totalCandidates: rows.length,

      candidates: rows,

    });

    writeCsv(`${basePath}.csv`, rows);

  }

}

function buildIndex({

  inputPath,

  sourceAuditGeneratedAt,

  totalRows,

  metalEdgeFallbackCandidates,

  stockHeadFallbackCandidates,

  combinedFallbackCandidates,

}) {

  const byCompany = {};

  for (const candidate of dedupeCandidates([

    ...metalEdgeFallbackCandidates,

    ...stockHeadFallbackCandidates,

    ...combinedFallbackCandidates,

  ])) {

    const companyName = candidate.companyName || 'UNKNOWN_COMPANY';

    if (!byCompany[companyName]) {

      byCompany[companyName] = {

        companyName,

        totalUniqueFallbackCandidates: 0,

        metalEdgeFallbackCandidates: 0,

        stockHeadFallbackCandidates: 0,

        combinedMetalEdgeAndHeadFallbackCandidates: 0,

        projectedCoreShellPassWithMetalEdgeFallback: 0,

        projectedStockPassWithFallback: 0,

        projectedNearlyStockPassWithFallback: 0,

      };

    }

    byCompany[companyName].totalUniqueFallbackCandidates += 1;

    if (candidate.fallbackTypes.includes('metalEdgeFallback')) {

      byCompany[companyName].metalEdgeFallbackCandidates += 1;

    }

    if (candidate.fallbackTypes.includes('stockHeadFallback')) {

      byCompany[companyName].stockHeadFallbackCandidates += 1;

    }

    if (

      candidate.fallbackTypes.includes('metalEdgeFallback') &&

      candidate.fallbackTypes.includes('stockHeadFallback')

    ) {

      byCompany[companyName].combinedMetalEdgeAndHeadFallbackCandidates += 1;

    }

    if (

      candidate.projectedCoreShellTier ===

      'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK'

    ) {

      byCompany[companyName].projectedCoreShellPassWithMetalEdgeFallback += 1;

    }

    if (candidate.projectedStockTier.startsWith('MEANINGFUL_STOCK_PASS')) {

      byCompany[companyName].projectedStockPassWithFallback += 1;

    }

    if (candidate.projectedStockTier.startsWith('NEARLY_MEANINGFUL_STOCK_PASS')) {

      byCompany[companyName].projectedNearlyStockPassWithFallback += 1;

    }

  }

  const companySummary = Object.values(byCompany).sort((a, b) => {

    return (

      b.totalUniqueFallbackCandidates - a.totalUniqueFallbackCandidates ||

      a.companyName.localeCompare(b.companyName)

    );

  });

  return {

    phase: 'PHASE_3V_FALLBACK_READINESS_CANDIDATE_AUDIT',

    generatedAt: new Date().toISOString(),

    mode: 'READ_ONLY',

    sourceAuditFile: inputPath,

    sourceAuditGeneratedAt,

    totalRowsScanned: totalRows,

    rulesApplied: {

      metalBearingEdgeFallback: {

        appliesTo: 'metal shell snare drums only',

        fallbackKey: METAL_EDGE_FALLBACK_KEY,

        projectedTier: 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK',

        guardrails: [

          'Does not apply to wood ply shells',

          'Does not apply to solid wood shells',

          'Does not apply to stave shells',

          'Does not apply to steam-bent shells',

          'Does not apply to single-ply wood shells',

          'Does not apply to acrylic shells',

          'Does not apply to hybrid wood shells',

          'Does not apply to composite shells unless separate rules are defined',

        ],

      },

      stockHeadFallback: {

        appliesTo: 'stock batter/reso heads only',

        guardrails: [

          'Does not apply to hardware',

          'Does not apply to hoops',

          'Does not apply to throw-offs',

          'Does not apply to lugs',

          'Does not apply to snare wires',

          'Does not apply to shell construction',

          'Does not apply to shell material',

          'Does not apply to shell thickness',

        ],

        knownCompanyFallbacks: COMPANY_HEAD_FALLBACKS,

      },

    },

    counts: {

      metalEdgeFallbackCandidates: metalEdgeFallbackCandidates.length,

      stockHeadFallbackCandidates: stockHeadFallbackCandidates.length,

      combinedMetalEdgeAndHeadFallbackCandidates:

        combinedFallbackCandidates.length,

    },

    companySummary,

    outputFiles: {

      metalEdgeFallbackCandidatesJson: path.join(

        OUTPUT_ROOT,

        'metal-edge-fallback-candidates.json'

      ),

      metalEdgeFallbackCandidatesCsv: path.join(

        OUTPUT_ROOT,

        'metal-edge-fallback-candidates.csv'

      ),

      stockHeadFallbackCandidatesJson: path.join(

        OUTPUT_ROOT,

        'stock-head-fallback-candidates.json'

      ),

      stockHeadFallbackCandidatesCsv: path.join(

        OUTPUT_ROOT,

        'stock-head-fallback-candidates.csv'

      ),

      combinedCandidatesJson: path.join(

        OUTPUT_ROOT,

        'combined-metal-edge-and-head-fallback-candidates.json'

      ),

      combinedCandidatesCsv: path.join(

        OUTPUT_ROOT,

        'combined-metal-edge-and-head-fallback-candidates.csv'

      ),

      byCompanyFolder: path.join(OUTPUT_ROOT, 'by-company'),

    },

    recommendedNextStep:

      'Review by-company/ahead.json. If counts look correct, create a review-only AHEAD patch that adds engineAssumptions and engineDerivedFields without overwriting source-confirmed fields.',

  };

}

function printSummary(index) {

  console.log('');

  console.log('PHASE 3V FALLBACK READINESS CANDIDATE AUDIT COMPLETE');

  console.log('');

  console.log('OUTPUT ROOT');

  console.log(OUTPUT_ROOT);

  console.log('');

  console.log('COUNTS');

  console.table(index.counts);

  console.log('');

  console.log('TOP COMPANY SUMMARY');

  console.table(index.companySummary.slice(0, 20));

  console.log('');

  const ahead = index.companySummary.find((item) => item.companyName === 'AHEAD');

  console.log('AHEAD SUMMARY');

  if (ahead) {

    console.table([ahead]);

    console.log('');

    console.log('AHEAD FILES');

    console.log(path.join(OUTPUT_ROOT, 'by-company', 'ahead.json'));

    console.log(path.join(OUTPUT_ROOT, 'by-company', 'ahead.csv'));

  } else {

    console.log('No AHEAD fallback candidates found.');

  }

  console.log('');

  console.log('MASTER REPORT-BACK TEXT');

  console.log(buildMasterReportBack(index));

  console.log('');

}

function buildMasterReportBack(index) {

  const ahead = index.companySummary.find((item) => item.companyName === 'AHEAD');

  return [

    'Phase 3V fallback readiness candidate audit is complete.',

    `Rows scanned: ${index.totalRowsScanned}.`,

    `Metal edge fallback candidates: ${index.counts.metalEdgeFallbackCandidates}.`,

    `Stock head fallback candidates: ${index.counts.stockHeadFallbackCandidates}.`,

    `Combined metal-edge + stock-head fallback candidates: ${index.counts.combinedMetalEdgeAndHeadFallbackCandidates}.`,

    ahead

      ? `AHEAD candidates: ${ahead.totalUniqueFallbackCandidates} total; ${ahead.metalEdgeFallbackCandidates} metal edge fallback; ${ahead.stockHeadFallbackCandidates} stock head fallback; ${ahead.combinedMetalEdgeAndHeadFallbackCandidates} combined fallback.`

      : 'AHEAD had no fallback candidates in this audit.',

    'No Firestore writes were performed. No patches were created. No scraping was performed. No drum rescoring was performed.',

    'Recommended next step: review the AHEAD by-company JSON/CSV and then create a review-only AHEAD patch for engineAssumptions and engineDerivedFields.',

  ].join(' ');

}

function hasIdentity(row) {

  return (

    !isBlank(row.companyName) &&

    !isBlank(row.modelName) &&

    !isBlank(row.diameter) &&

    !isBlank(row.depth)

  );

}

function isMetalShell(row) {

  const material = `${row.shellMaterial}`.toLowerCase();

  const construction = `${row.shellConstructionType}`.toLowerCase();

  const label = `${row.label} ${row.modelName}`.toLowerCase();

  const metalMaterials = [

    'steel',

    'brass',

    'bell brass',

    'bronze',

    'copper',

    'aluminum',

    'aluminium',

    'titanium',

    'stainless',

    'cobalt',

    'nickel',

    'monel',

    'phosphor bronze',

  ];

  const materialLooksMetal = metalMaterials.some((term) =>

    material.includes(term)

  );

  const labelLooksMetal = metalMaterials.some((term) => label.includes(term));

  const constructionLooksMetal =

    construction.includes('metal') ||

    construction.includes('cast') ||

    construction.includes('spun') ||

    construction.includes('welded') ||

    construction.includes('rolled');

  const knownNonMetalConstruction =

    construction.includes('ply') ||

    construction.includes('wood') ||

    construction.includes('stave') ||

    construction.includes('steam') ||

    construction.includes('solid wood') ||

    construction.includes('single-ply') ||

    construction.includes('acrylic') ||

    construction.includes('composite') ||

    construction.includes('fiberglass') ||

    construction.includes('carbon');

  if (knownNonMetalConstruction && !materialLooksMetal) return false;

  return materialLooksMetal || labelLooksMetal || constructionLooksMetal;

}

function hasValidShellThickness(row) {

  return (

    Number.isFinite(row.shellThickness) &&

    row.shellThickness > 0 &&

    row.shellThickness <= 50 &&

    row.shellThicknessQualityTier === 'VALID_NUMERIC_SHELL_THICKNESS'

  );

}

function hasSource(row) {

  return !isBlank(row.primarySourceUrl) && !isBlank(row.sourceConfidence);

}

function hasUnknownOrPlaceholderBearingEdge(row) {

  if (

    row.bearingEdgeQualityTier === 'PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE' ||

    row.bearingEdgeQualityTier === 'MISSING_BEARING_EDGE'

  ) {

    return true;

  }

  const text = stringify(row.bearingEdge).toLowerCase();

  if (!text) return true;

  const unknownTerms = [

    'unknown',

    'notverified',

    'not verified',

    'placeholder',

  ];

  const meaningfulTerms = [

    '45',

    '30',

    'roundover',

    'double',

    'machined',

    'rolled',

    'formed',

    'flanged',

    'bead',

    'bearing edge',

    'sharp',

  ];

  const hasUnknown = unknownTerms.some((term) => text.includes(term));

  const hasMeaningful = meaningfulTerms.some((term) => text.includes(term));

  return hasUnknown && !hasMeaningful;

}

function hasHoopType(row) {

  return !isBlank(stringify(row.hoopType));

}

function hasStockSnareWires(row) {

  const text = stringify(row.stockSnareWires).toLowerCase();

  if (isBlank(text)) return false;

  const unknownOnly =

    text.includes('"unknown"') &&

    !text.includes('fat cat') &&

    !text.includes('remo') &&

    !text.includes('puresound') &&

    !text.includes('canopus') &&

    !text.includes('snappy') &&

    !text.includes('snare wire');

  return !unknownOnly;

}

function hasKnownOrFallbackCompanyHeadBrand(row) {

  return Boolean(getCompanyHeadFallback(row.companyName));

}

function getCompanyHeadFallback(companyName) {

  const exact = COMPANY_HEAD_FALLBACKS[companyName];

  if (exact) return exact;

  const normalized = normalizeCompany(companyName);

  for (const [key, fallback] of Object.entries(COMPANY_HEAD_FALLBACKS)) {

    if (normalizeCompany(key) === normalized) {

      return fallback;

    }

  }

  return null;

}

function inferShellConstructionType(row) {

  const text = `${row.label || ''} ${row.shellMaterial || ''}`.toLowerCase();

  if (

    text.includes('brass') ||

    text.includes('bell brass') ||

    text.includes('steel') ||

    text.includes('bronze') ||

    text.includes('copper') ||

    text.includes('aluminum') ||

    text.includes('aluminium') ||

    text.includes('titanium')

  ) {

    return 'Metal';

  }

  if (text.includes('ply')) return 'Ply';

  if (text.includes('stave')) return 'Stave';

  if (text.includes('steam')) return 'Steam-Bent';

  if (text.includes('solid')) return 'Solid Shell';

  return '';

}

function dedupeCandidates(candidates) {

  const byKey = new Map();

  for (const candidate of candidates) {

    const existing = byKey.get(candidate.id);

    if (!existing) {

      byKey.set(candidate.id, candidate);

      continue;

    }

    const mergedFallbackTypes = [

      ...new Set([...existing.fallbackTypes, ...candidate.fallbackTypes]),

    ];

    byKey.set(candidate.id, {

      ...existing,

      fallbackTypes: mergedFallbackTypes,

      projectedCoreShellTier:

        mergedFallbackTypes.includes('metalEdgeFallback')

          ? 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK'

          : existing.projectedCoreShellTier,

      projectedStockTier: mergedFallbackTypes.includes('stockHeadFallback')

        ? resolveProjectedStockTier(

            {

              ...candidate,

              fieldQualityTier: existing.currentFieldQualityTier,

              stockTier: existing.currentStockTier,

            },

            {

              appliesMetalEdgeFallback:

                mergedFallbackTypes.includes('metalEdgeFallback'),

              appliesStockHeadFallback:

                mergedFallbackTypes.includes('stockHeadFallback'),

            }

          )

        : existing.projectedStockTier,

    });

  }

  return [...byKey.values()];

}

function writeJson(filePath, value) {

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);

}

function readJson(filePath) {

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function writeCsv(filePath, rows) {

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const header = CSV_COLUMNS.join(',');

  const body = rows.map((row, index) => {

    const flat = flattenCandidateForCsv(row, index + 1);

    return CSV_COLUMNS.map((column) => csvEscape(flat[column])).join(',');

  });

  fs.writeFileSync(filePath, [header, ...body].join('\n') + '\n');

}

function flattenCandidateForCsv(candidate, priority) {

  return {

    priority,

    id: candidate.id,

    label: candidate.label,

    companyName: candidate.companyName,

    lineSeries: candidate.lineSeries,

    modelName: candidate.modelName,

    diameter: candidate.diameter,

    depth: candidate.depth,

    currentFieldQualityTier: candidate.currentFieldQualityTier,

    currentStockTier: candidate.currentStockTier,

    projectedCoreShellTier: candidate.projectedCoreShellTier,

    projectedStockTier: candidate.projectedStockTier,

    fallbackTypes: candidate.fallbackTypes,

    shellMaterial: candidate.shellMaterial,

    shellConstructionType: candidate.shellConstructionType,

    shellThickness: candidate.shellThickness,

    bearingEdgeQualityTier: candidate.bearingEdgeQualityTier,

    hoopType: stringify(candidate.hoopType),

    stockSnareWires: stringify(candidate.stockSnareWires),

    stockBatterHead: candidate.stockBatterHead,

    stockResoHead: candidate.stockResoHead,

    productionStatus: candidate.productionStatus,

    primarySourceUrl: candidate.primarySourceUrl,

    sourceConfidence: candidate.sourceConfidence,

    metalEdgeFallbackKey:

      candidate.projectedEngineAssumptions?.bearingEdgeFallbackKey || '',

    stockHeadFallbackKey:

      candidate.projectedEngineAssumptions?.stockHeadFallbackKey || '',

    stockHeadFallbackBatter:

      candidate.projectedEngineDerivedFields?.stockHeadFallback?.batterHead ||

      '',

    stockHeadFallbackReso:

      candidate.projectedEngineDerivedFields?.stockHeadFallback?.resoHead || '',

    stockHeadFallbackBrandBasis:

      candidate.projectedEngineDerivedFields?.stockHeadFallback?.brandBasis ||

      '',

    notes: candidate.notes,

  };

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

function parseMaybeJson(value) {

  if (typeof value !== 'string') return value && typeof value === 'object' ? value : null;

  const trimmed = value.trim();

  if (!trimmed) return null;

  if (

    !(

      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||

      (trimmed.startsWith('[') && trimmed.endsWith(']'))

    )

  ) {

    return null;

  }

  try {

    return JSON.parse(trimmed);

  } catch {

    return null;

  }

}

function arrayify(value) {

  if (Array.isArray(value)) return value.filter(Boolean).map(clean);

  if (typeof value === 'string' && value.trim()) {

    return value

      .split('|')

      .map((item) => item.trim())

      .filter(Boolean);

  }

  return [];

}

function clean(value) {

  if (value === undefined || value === null) return '';

  return String(value).trim();

}

function isBlank(value) {

  return clean(value) === '';

}

function toNumber(value) {

  if (value === undefined || value === null || value === '') return null;

  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return number;

}

function stringify(value) {

  if (value === undefined || value === null) return '';

  if (typeof value === 'string') return value;

  try {

    return JSON.stringify(value);

  } catch {

    return String(value);

  }

}

function normalizeCompany(value) {

  return clean(value)

    .toLowerCase()

    .replace(/&/g, 'and')

    .replace(/\+/g, 'and')

    .replace(/\//g, ' ')

    .replace(/[^a-z0-9]+/g, ' ')

    .replace(/\s+/g, ' ')

    .trim();

}

function slugify(value) {

  return normalizeCompany(value).replace(/\s+/g, '-') || 'unknown-company';

}

main();