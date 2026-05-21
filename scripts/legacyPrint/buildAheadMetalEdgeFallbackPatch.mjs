// scripts/legacyPrint/buildAheadMetalEdgeFallbackPatch.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// PHASE 3W — AHEAD METAL EDGE FALLBACK PATCH BUILDER

//

// Mode: READ ONLY

//

// What this does:

// - Reads the AHEAD fallback candidate audit JSON.

// - Filters AHEAD records that qualify for the metal-shell bearing edge fallback.

// - Creates a review-only JSON patch file.

// - Does NOT write to Firestore.

// - Does NOT rescore drums.

// - Does NOT apply stock head fallback.

// - Does NOT mark full stock pass.

//

// Usage:

// node scripts/legacyPrint/buildAheadMetalEdgeFallbackPatch.mjs

//

// Optional custom input:

// node scripts/legacyPrint/buildAheadMetalEdgeFallbackPatch.mjs "tmp/legacyPrint-audits/fallback-readiness-candidates/by-company/ahead.json"

import fs from 'fs';

import path from 'path';

import process from 'process';

const PROJECT_ROOT = process.cwd();

const DEFAULT_INPUT_PATH = path.join(

  PROJECT_ROOT,

  'tmp/legacyPrint-audits/fallback-readiness-candidates/by-company/ahead.json'

);

const OUTPUT_ROOT = path.join(

  PROJECT_ROOT,

  'tmp/legacyPrint-patches/ahead-metal-edge-fallback'

);

const INPUT_PATH = process.argv[2]

  ? path.resolve(PROJECT_ROOT, process.argv[2])

  : DEFAULT_INPUT_PATH;

const FALLBACK_KEY = 'metal-formed-machined-default';

const FALLBACK_ASSUMPTIONS = {

  bearingEdgeFallbackApplied: true,

  bearingEdgeFallbackKey: FALLBACK_KEY,

  bearingEdgeFallbackReason:

    'Metal shell record has valid material, construction, thickness, diameter, depth, source URL, and source confidence, but no published bearing edge geometry.',

  bearingEdgeNeedsVerification: true,

};

const FALLBACK_DERIVED_FIELD = {

  batterSideProfile: 'formed/machined metal bearing edge',

  snareSideProfile: 'formed/machined metal bearing edge',

  roundover: 'unknown',

  evidenceLevel: 'engineMetalFallback',

  confidence: 'Fallback',

  sourceType: 'LegacyPrint metal-shell fallback rule',

  notes:

    'Exact bearing edge geometry not published. Applied LegacyPrint metal-shell fallback based on metal shell construction.',

};

function ensureDir(dirPath) {

  fs.mkdirSync(dirPath, { recursive: true });

}

function readJson(filePath) {

  if (!fs.existsSync(filePath)) {

    throw new Error(`Input file not found: ${filePath}`);

  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function writeJson(filePath, data) {

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);

}

function isNonEmptyString(value) {

  return typeof value === 'string' && value.trim().length > 0;

}

function isValidNumber(value) {

  return typeof value === 'number' && Number.isFinite(value) && value > 0;

}

function normalizeText(value) {

  return String(value || '').trim().toLowerCase();

}

function isMetalLikeCandidate(candidate) {

  const shellMaterial = normalizeText(candidate.shellMaterial);

  const shellConstructionType = normalizeText(candidate.shellConstructionType);

  const metalMaterials = [

    'aluminum',

    'bell brass',

    'brass',

    'bronze',

    'copper',

    'steel',

    'stainless steel',

    'titanium',

    'phosphor bronze',

    'black nickel over brass',

  ];

  const hasMetalMaterial = metalMaterials.some((material) =>

    shellMaterial.includes(material)

  );

  const hasMetalConstruction =

    shellConstructionType.includes('metal') ||

    shellConstructionType.includes('solid shell');

  return hasMetalMaterial && hasMetalConstruction;

}

function qualifiesForAheadMetalEdgeFallback(candidate) {

  if (!candidate || typeof candidate !== 'object') return false;

  if (candidate.companyName !== 'AHEAD') return false;

  if (!candidate.fallbackTypes?.includes('metalEdgeFallback')) return false;

  if (!isMetalLikeCandidate(candidate)) return false;

  if (!isValidNumber(candidate.shellThickness)) return false;

  if (!isNonEmptyString(candidate.diameter)) return false;

  if (!isNonEmptyString(candidate.depth)) return false;

  if (!isNonEmptyString(candidate.primarySourceUrl)) return false;

  if (!isNonEmptyString(candidate.sourceConfidence)) return false;

  return true;

}

function buildFirestoreUpdate(candidate) {

  return {

    id: candidate.id,

    label: candidate.label,

    companyName: candidate.companyName,

    lineSeries: candidate.lineSeries,

    modelName: candidate.modelName,

    diameter: candidate.diameter,

    depth: candidate.depth,

    source: {

      primarySourceUrl: candidate.primarySourceUrl,

      sourceConfidence: candidate.sourceConfidence,

    },

    currentState: {

      fieldQualityTier: candidate.currentFieldQualityTier,

      stockTier: candidate.currentStockTier,

      bearingEdgeQualityTier: candidate.bearingEdgeQualityTier,

      shellMaterial: candidate.shellMaterial,

      shellConstructionType: candidate.shellConstructionType,

      shellThickness: candidate.shellThickness,

    },

    projectedState: {

      coreShellTier: 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK',

      stockTier:

        'NEARLY_MEANINGFUL_STOCK_PASS_WITH_METAL_EDGE_FALLBACK_PRODUCTION_STATUS_AND_HEADS_NEEDED',

    },

    update: {

      engineAssumptions: {

        ...FALLBACK_ASSUMPTIONS,

      },

      engineDerivedFields: {

        bearingEdgeFallback: {

          ...FALLBACK_DERIVED_FIELD,

        },

      },

    },

    firestoreDotNotationUpdate: {

      'engineAssumptions.bearingEdgeFallbackApplied': true,

      'engineAssumptions.bearingEdgeFallbackKey': FALLBACK_KEY,

      'engineAssumptions.bearingEdgeFallbackReason':

        FALLBACK_ASSUMPTIONS.bearingEdgeFallbackReason,

      'engineAssumptions.bearingEdgeNeedsVerification': true,

      'engineDerivedFields.bearingEdgeFallback.batterSideProfile':

        FALLBACK_DERIVED_FIELD.batterSideProfile,

      'engineDerivedFields.bearingEdgeFallback.snareSideProfile':

        FALLBACK_DERIVED_FIELD.snareSideProfile,

      'engineDerivedFields.bearingEdgeFallback.roundover':

        FALLBACK_DERIVED_FIELD.roundover,

      'engineDerivedFields.bearingEdgeFallback.evidenceLevel':

        FALLBACK_DERIVED_FIELD.evidenceLevel,

      'engineDerivedFields.bearingEdgeFallback.confidence':

        FALLBACK_DERIVED_FIELD.confidence,

      'engineDerivedFields.bearingEdgeFallback.sourceType':

        FALLBACK_DERIVED_FIELD.sourceType,

      'engineDerivedFields.bearingEdgeFallback.notes':

        FALLBACK_DERIVED_FIELD.notes,

    },

    reviewNotes: [

      'Review-only patch. No Firestore write has been performed.',

      'Applies only the LegacyPrint metal-shell bearing edge fallback.',

      'Does not apply stock head fallback.',

      'Does not update production status.',

      'Does not mark record as full stock pass.',

      'Exact bearing edge profile remains verification-needed.',

    ],

  };

}

function buildCsvRow(update) {

  const safe = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

  return [

    safe(update.id),

    safe(update.companyName),

    safe(update.lineSeries),

    safe(update.modelName),

    safe(update.diameter),

    safe(update.depth),

    safe(update.currentState.shellMaterial),

    safe(update.currentState.shellConstructionType),

    safe(update.currentState.shellThickness),

    safe(update.source.sourceConfidence),

    safe(update.source.primarySourceUrl),

    safe(update.projectedState.coreShellTier),

    safe(update.projectedState.stockTier),

    safe(update.firestoreDotNotationUpdate['engineAssumptions.bearingEdgeFallbackKey']),

    safe(update.firestoreDotNotationUpdate['engineDerivedFields.bearingEdgeFallback.batterSideProfile']),

    safe(update.firestoreDotNotationUpdate['engineDerivedFields.bearingEdgeFallback.confidence']),

  ].join(',');

}

function main() {

  console.log('\nOBER LEGACYPRINT™ DATA + RESEARCH');

  console.log('PHASE 3W AHEAD METAL EDGE FALLBACK PATCH BUILDER');

  console.log('Mode: READ ONLY');

  console.log(`Input: ${INPUT_PATH}\n`);

  const source = readJson(INPUT_PATH);

  const candidates = Array.isArray(source.candidates) ? source.candidates : [];

  const qualifiedCandidates = candidates.filter(qualifiesForAheadMetalEdgeFallback);

  const rejectedCandidates = candidates.filter(

    (candidate) => !qualifiesForAheadMetalEdgeFallback(candidate)

  );

  const updates = qualifiedCandidates.map(buildFirestoreUpdate);

  const generatedAt = new Date().toISOString();

  const patch = {

    phase: 'PHASE_3W_AHEAD_METAL_EDGE_FALLBACK_PATCH',

    generatedAt,

    mode: 'REVIEW_ONLY_PATCH',

    firestoreWrites: false,

    rescoring: false,

    stockHeadFallbackApplied: false,

    productionStatusUpdated: false,

    sourceFile: INPUT_PATH,

    targetCollection: 'snareReferenceDrums',

    companyName: 'AHEAD',

    companyId: 'ahead',

    ruleApplied: {

      name: 'LegacyPrint metal-shell bearing edge fallback rule',

      fallbackKey: FALLBACK_KEY,

      appliesOnlyTo: [

        'metal shell records',

        'records with valid shell material',

        'records with valid shell construction',

        'records with valid numeric shell thickness',

        'records with diameter and depth',

        'records with source URL and source confidence',

        'records with missing/placeholder bearing edge detail',

      ],

      doesNotApplyTo: [

        'wood ply shells',

        'stave shells',

        'steam-bent shells',

        'single-ply wood shells',

        'acrylic shells',

        'hybrid wood/composite shells unless future rule is explicitly defined',

      ],

    },

    summary: {

      sourceCandidates: candidates.length,

      qualifiedMetalEdgeFallbackUpdates: updates.length,

      rejectedCandidates: rejectedCandidates.length,

      projectedCoreShellPassWithMetalEdgeFallback: updates.length,

      projectedFullStockPass: 0,

      projectedNearlyStockPass:

        'Qualified AHEAD records may become nearly meaningful stock once fallback-aware audit logic is added, but production status and stock heads remain unresolved.',

    },

    updates,

    rejectedCandidates: rejectedCandidates.map((candidate) => ({

      id: candidate.id,

      label: candidate.label,

      reason:

        'Did not qualify for AHEAD metal edge fallback patch under current rule checks.',

    })),

    masterReportBackText:

      `Phase 3W AHEAD metal edge fallback patch generated as review-only. ` +

      `Source candidates: ${candidates.length}. Qualified AHEAD metal edge fallback updates: ${updates.length}. ` +

      `Rejected candidates: ${rejectedCandidates.length}. No Firestore writes were performed. ` +

      `No stock head fallback was applied. No production status was updated. No drum rescoring was performed. ` +

      `Patch output is ready for review before any database update step.`,

  };

  ensureDir(OUTPUT_ROOT);

  const timestampSlug = generatedAt.replace(/[:.]/g, '-');

  const jsonOutputPath = path.join(

    OUTPUT_ROOT,

    `ahead-metal-edge-fallback-review-patch-${timestampSlug}.json`

  );

  const latestJsonOutputPath = path.join(

    OUTPUT_ROOT,

    'ahead-metal-edge-fallback-review-patch-latest.json'

  );

  const csvOutputPath = path.join(

    OUTPUT_ROOT,

    `ahead-metal-edge-fallback-review-patch-${timestampSlug}.csv`

  );

  const latestCsvOutputPath = path.join(

    OUTPUT_ROOT,

    'ahead-metal-edge-fallback-review-patch-latest.csv'

  );

  const csvHeader = [

    'id',

    'companyName',

    'lineSeries',

    'modelName',

    'diameter',

    'depth',

    'shellMaterial',

    'shellConstructionType',

    'shellThickness',

    'sourceConfidence',

    'primarySourceUrl',

    'projectedCoreShellTier',

    'projectedStockTier',

    'bearingEdgeFallbackKey',

    'fallbackBatterSideProfile',

    'fallbackConfidence',

  ].join(',');

  const csvBody = updates.map(buildCsvRow).join('\n');

  const csv = `${csvHeader}\n${csvBody}\n`;

  writeJson(jsonOutputPath, patch);

  writeJson(latestJsonOutputPath, patch);

  fs.writeFileSync(csvOutputPath, csv);

  fs.writeFileSync(latestCsvOutputPath, csv);

  console.log('\nPHASE 3W AHEAD METAL EDGE FALLBACK PATCH BUILDER COMPLETE\n');

  console.log('COUNTS');

  console.table({

    sourceCandidates: candidates.length,

    qualifiedMetalEdgeFallbackUpdates: updates.length,

    rejectedCandidates: rejectedCandidates.length,

    firestoreWrites: false,

    stockHeadFallbackApplied: false,

    productionStatusUpdated: false,

  });

  console.log('\nOUTPUT FILES');

  console.log(jsonOutputPath);

  console.log(latestJsonOutputPath);

  console.log(csvOutputPath);

  console.log(latestCsvOutputPath);

  console.log('\nMASTER REPORT-BACK TEXT');

  console.log(patch.masterReportBackText);

}

main();