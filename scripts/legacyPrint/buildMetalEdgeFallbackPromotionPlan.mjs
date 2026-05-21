// scripts/legacyPrint/buildMetalEdgeFallbackPromotionPlan.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// BUILD METAL EDGE FALLBACK PROMOTION PLAN

//

// READ-ONLY.

// Does NOT write Firestore.

// Does NOT rescore drums.

// Builds a JSON plan for manually reviewed metal-shell fallback promotion.

//

// Rule:

// Metal-shell records with valid numeric shell thickness and unknown/placeholder

// bearing edge may be promoted using auditable metal edge fallback metadata,

// but only when source URL and source confidence are present.

//

// This rule does NOT apply to wood, acrylic, composite, ply/stave/steam-bent,

// non-metal, source-incomplete, or ambiguous shell records.

import fs from 'fs';

import path from 'path';

const INPUT_ARG_PREFIX = '--input=';

const OUTPUT_DIR = path.resolve('src/legacyPrint/reviewPlans');

function getInputPath() {

  const arg = process.argv.find((value) => value.startsWith(INPUT_ARG_PREFIX));

  if (arg) return arg.slice(INPUT_ARG_PREFIX.length);

  const auditDir = 'tmp/legacyPrint-audits';

  const files = fs.readdirSync(auditDir)

    .filter((name) => name.startsWith('metal-edge-fallback-candidates-') && name.endsWith('.json'))

    .map((name) => path.join(auditDir, name))

    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

  if (!files.length) {

    throw new Error('No metal-edge-fallback-candidates audit files found. Run auditMetalEdgeFallbackCandidates.mjs first.');

  }

  return files[0];

}

function readJson(filePath) {

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function normalizeText(value) {

  if (value === null || value === undefined) return '';

  if (typeof value === 'string') return value.trim();

  if (typeof value === 'number') return String(value);

  if (typeof value === 'boolean') return String(value);

  try {

    return JSON.stringify(value);

  } catch {

    return String(value);

  }

}

function lower(value) {

  return normalizeText(value).toLowerCase();

}

function hasSource(row) {

  return Boolean(normalizeText(row.sourceUrl)) && Boolean(normalizeText(row.sourceConfidence));

}

function inferFallbackKey(row) {

  const material = lower(row.shellMaterial);

  const construction = lower(row.shellConstruction);

  if (material.includes('bell brass')) return 'metal_bell_brass_generic_machined_edge';

  if (material.includes('brass')) return 'metal_brass_generic_machined_edge';

  if (material.includes('bronze')) return 'metal_bronze_generic_machined_edge';

  if (material.includes('copper')) return 'metal_copper_generic_machined_edge';

  if (material.includes('aluminum') || material.includes('aluminium')) return 'metal_aluminum_generic_machined_edge';

  if (material.includes('stainless')) return 'metal_stainless_steel_generic_machined_edge';

  if (material.includes('steel')) return 'metal_steel_generic_machined_edge';

  if (material.includes('iron') || construction.includes('iron')) return 'metal_iron_generic_machined_edge';

  if (material.includes('titanium')) return 'metal_titanium_generic_machined_edge';

  return 'metal_generic_machined_edge';

}

function inferFallbackReason(row) {

  const material = normalizeText(row.shellMaterial) || 'metal';

  const construction = normalizeText(row.shellConstruction) || 'metal shell';

  const thickness = row.shellThicknessMm ? `${row.shellThicknessMm}mm` : 'valid numeric shell thickness';

  return `Metal-shell fallback applied because this record has ${thickness}, confirmed metal shell context (${material}; ${construction}), source URL and source confidence, and only the exact published bearing-edge geometry remains unknown. This fallback is auditable and marked as needing verification.`;

}

function buildBearingEdgeFallback() {

  return {

    batterSideProfile: 'machined metal bearing edge',

    snareSideProfile: 'machined metal bearing edge',

    roundover: 'unknown',

    confidence: 'fallback',

    evidenceLevel: 'metalShellFallback',

    needsVerification: true,

    notes: 'Exact published bearing-edge geometry was not found. Generic machined metal bearing edge fallback applied under LegacyPrint metal-shell readiness rule.'

  };

}

function buildUpdate(row) {

  const fallbackKey = inferFallbackKey(row);

  const fallbackReason = inferFallbackReason(row);

  return {

    id: row.id,

    label: row.label,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    reason: row.reason,

    sourceUrl: row.sourceUrl,

    sourceConfidence: row.sourceConfidence,

    currentFieldQualityTier: row.currentFieldQualityTier,

    projectedFieldQualityTier: 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK',

    reviewWarnings: [

      'Does not source-confirm exact bearing edge geometry.',

      'Must remain auditable as fallback, not full source-confirmed core shell pass.',

      'Does not imply stock readiness.'

    ],

    set: {

      fieldQualityTier: 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK',

      coreShellTier: 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK',

      bearingEdge: buildBearingEdgeFallback(row),

      bearingEdgeNeedsVerification: true,

      engineAssumptions: {

        bearingEdgeFallbackApplied: true,

        bearingEdgeFallbackKey: fallbackKey,

        bearingEdgeFallbackReason: fallbackReason,

        bearingEdgeNeedsVerification: true

      },

      notesOnMissingData: [

        normalizeText(row.notesOnMissingData),

        'Metal bearing-edge fallback is applied for core-shell modeling only. Exact published edge geometry still needs verification before this record can be treated as source-confirmed full core shell data.'

      ].filter(Boolean).join(' ')

    }

  };

}

function countBy(rows, key) {

  return rows.reduce((acc, row) => {

    const value = row[key] || 'UNKNOWN';

    acc[value] = (acc[value] || 0) + 1;

    return acc;

  }, {});

}

function assertPlanSafety(updates) {

  const allowedSetKeys = new Set([

    'fieldQualityTier',

    'coreShellTier',

    'bearingEdge',

    'bearingEdgeNeedsVerification',

    'engineAssumptions',

    'notesOnMissingData'

  ]);

  for (const update of updates) {

    if (!update.id || !update.set) {

      throw new Error(`Invalid update shape: ${JSON.stringify(update)}`);

    }

    if (!normalizeText(update.sourceUrl) || !normalizeText(update.sourceConfidence)) {

      throw new Error(`Source-incomplete update blocked: ${update.id}`);

    }

    const keys = Object.keys(update.set);

    for (const key of keys) {

      if (!allowedSetKeys.has(key)) {

        throw new Error(`Unsafe set key ${key} for ${update.id}`);

      }

    }

    if (update.set.fieldQualityTier !== 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK') {

      throw new Error(`Unsafe fieldQualityTier for ${update.id}`);

    }

    if (update.set.coreShellTier !== 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK') {

      throw new Error(`Unsafe coreShellTier for ${update.id}`);

    }

    if (update.set.bearingEdgeNeedsVerification !== true) {

      throw new Error(`Missing bearingEdgeNeedsVerification for ${update.id}`);

    }

    if (update.set.engineAssumptions?.bearingEdgeFallbackApplied !== true) {

      throw new Error(`Missing bearingEdgeFallbackApplied for ${update.id}`);

    }

    if (update.set.engineAssumptions?.bearingEdgeNeedsVerification !== true) {

      throw new Error(`Missing engineAssumptions.bearingEdgeNeedsVerification for ${update.id}`);

    }

  }

}

function main() {

  const inputPath = getInputPath();

  const audit = readJson(inputPath);

  const candidates = audit.groups?.eligibleMetalEdgeFallbackCandidate || [];

  if (!Array.isArray(candidates)) {

    throw new Error('Input audit missing groups.eligibleMetalEdgeFallbackCandidate array.');

  }

  const eligibleCandidates = candidates.filter(hasSource);

  const blockedMissingSource = candidates.filter((row) => !hasSource(row));

  const updates = eligibleCandidates.map(buildUpdate);

  assertPlanSafety(updates);

  const generatedAt = new Date().toISOString();

  const outputFile = path.join(

    OUTPUT_DIR,

    'snare-reference-metal-edge-fallback-promotion-plan-latest.json'

  );

  const timestampedOutputFile = path.join(

    OUTPUT_DIR,

    `snare-reference-metal-edge-fallback-promotion-plan-${generatedAt.replace(/[:.]/g, '-')}.json`

  );

  const plan = {

    planName: 'SNARE_REFERENCE_METAL_EDGE_FALLBACK_PROMOTION_PLAN',

    mode: 'DRY_RUN_PLAN_NO_FIRESTORE_WRITES',

    collectionName: 'snareReferenceDrums',

    generatedAt,

    sourceAuditFile: inputPath,

    firestoreWrites: false,

    rescoring: false,

    readinessTier: 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK',

    allowedSetKeys: [

      'fieldQualityTier',

      'coreShellTier',

      'bearingEdge',

      'bearingEdgeNeedsVerification',

      'engineAssumptions',

      'notesOnMissingData'

    ],

    summary: {

      totalAuditCandidates: candidates.length,

      totalPromotionCandidates: updates.length,

      blockedMissingSourceCount: blockedMissingSource.length,

      byCompany: countBy(updates, 'companyName'),

      blockedMissingSourceByCompany: countBy(blockedMissingSource, 'companyName'),

      warnings: [

        'Plan is dry-run only.',

        'No Firestore writes were attempted.',

        'Fallback applies only to confirmed metal-shell records.',

        'Fallback requires source URL and source confidence.',

        'Fallback does not source-confirm exact bearing edge geometry.',

        'Fallback does not create full stock readiness.'

      ]

    },

    blockedMissingSource,

    updates

  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(outputFile, JSON.stringify(plan, null, 2));

  fs.writeFileSync(timestampedOutputFile, JSON.stringify(plan, null, 2));

  console.log('\nMETAL EDGE FALLBACK PROMOTION PLAN BUILT');

  console.log(JSON.stringify({

    outputFile,

    timestampedOutputFile,

    sourceAuditFile: inputPath,

    firestoreWrites: false,

    totalAuditCandidates: candidates.length,

    totalPromotionCandidates: updates.length,

    blockedMissingSourceCount: blockedMissingSource.length,

    byCompany: plan.summary.byCompany,

    blockedMissingSourceByCompany: plan.summary.blockedMissingSourceByCompany,

    allowedSetKeys: plan.allowedSetKeys

  }, null, 2));

}

try {

  main();

} catch (error) {

  console.error('\nPlan build failed.');

  console.error(error);

  process.exit(1);

}