// scripts/legacyPrint/auditStrictPassableReadiness.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// STRICT PASSABLE READINESS AUDIT

//

// READ-ONLY.

// Does NOT write Firestore patches.

// Does NOT rescore drums.

// Does NOT scrape new data.

// Does NOT change schema.

// Does NOT overwrite records.

//

// Important correction from prior audit:

// - shell thickness confidence does NOT substitute for shell thickness.

// - bearing edge confidence does NOT substitute for bearing edge shape/detail.

// - confidence qualifies the value; it does not replace the value.

//

// Existing node scores such as attack, brightness, projection, sustain,

// warmth, sensitivity, and control are ignored for readiness. The engine

// must calculate those values from physical configuration data.

import admin from 'firebase-admin';

import fs from 'fs';

import path from 'path';

const COLLECTION_NAME = 'snareReferenceDrums';

const OUTPUT_DIR = path.resolve('tmp/legacyPrint-audits');

const OUTPUT_FILE = path.join(

  OUTPUT_DIR,

  `strict-passable-readiness-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

);

function initFirebaseAdmin() {

  if (admin.apps.length) return;

  admin.initializeApp({

    credential: admin.credential.applicationDefault(),

  });

}

function rawFirst(...values) {

  for (const value of values) {

    if (value !== undefined && value !== null) return value;

  }

  return null;

}

function firstNonEmpty(...values) {

  for (const value of values) {

    if (value === undefined || value === null) continue;

    if (typeof value === 'string') {

      const v = value.trim().toLowerCase();

      if (

        v === '' ||

        v === 'unknown' ||

        v === 'n/a' ||

        v === 'na' ||

        v === 'null' ||

        v === 'undefined' ||

        v === 'not specified' ||

        v === 'unspecified'

      ) {

        continue;

      }

    }

    if (Array.isArray(value) && value.length === 0) continue;

    return value;

  }

  return null;

}

function normalizeField(value) {

  if (value === undefined || value === null) return '';

  if (Array.isArray(value)) return value.filter(Boolean).join(', ').trim();

  if (typeof value === 'object') return JSON.stringify(value);

  return String(value).trim();

}

function toLowerString(value) {

  if (value === undefined || value === null) return '';

  if (Array.isArray(value)) return value.join(' ').toLowerCase();

  if (typeof value === 'object') return JSON.stringify(value).toLowerCase();

  return String(value).toLowerCase();

}

function isPresent(value) {

  if (value === undefined || value === null) return false;

  if (typeof value === 'string') {

    const v = value.trim().toLowerCase();

    return (

      v !== '' &&

      v !== 'unknown' &&

      v !== 'n/a' &&

      v !== 'na' &&

      v !== 'null' &&

      v !== 'undefined' &&

      v !== 'not specified' &&

      v !== 'unspecified'

    );

  }

  if (Array.isArray(value)) return value.length > 0 && value.some(isPresent);

  if (typeof value === 'number') return Number.isFinite(value);

  if (typeof value === 'boolean') return true;

  if (typeof value === 'object') return Object.keys(value).length > 0;

  return true;

}

function numeric(value) {

  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  if (typeof value === 'string') {

    const cleaned = value.replace(/["']/g, '').trim();

    const parsed = Number.parseFloat(cleaned);

    return Number.isFinite(parsed) ? parsed : null;

  }

  return null;

}

function isTrueish(value) {

  if (value === true) return true;

  if (typeof value === 'string') {

    const v = value.trim().toLowerCase();

    return v === 'true' || v === 'yes' || v === 'y' || v === '1';

  }

  return false;

}

function hasLowOrEstimatedConfidence(value) {

  const v = toLowerString(value);

  return (

    v.includes('low') ||

    v.includes('estimated') ||

    v.includes('inferred') ||

    v.includes('unknown') ||

    v.includes('needs') ||

    v.includes('unverified')

  );

}

function getSourceUrls(doc, sources) {

  return [

    sources.primary?.url,

    sources.primaryUrl,

    sources.primarySourceUrl,

    sources.primarySourceURL,

    sources.sourceUrl,

    sources.sourceURL,

    doc.primarySourceUrl,

    doc.primarySourceURL,

    doc.primarySource,

    doc.sourceUrl,

    doc.sourceURL,

  ].filter(isPresent);

}

function getCanonicalFields(doc) {

  const shell = doc.shell || {};

  const stockHardware = doc.stockHardware || {};

  const stockSnareSystem = doc.stockSnareSystem || {};

  const sources = doc.sources || {};

  const summary = doc.summary || {};

  const collectorMetadata = doc.collectorMetadata || {};

  const sourceUrls = getSourceUrls(doc, sources);

  return {

    id: doc.__id,

    coreShellTier: doc.coreShellTier,

    fieldQualityTier: doc.fieldQualityTier,

    engineAssumptions: doc.engineAssumptions || {},

    bearingEdgeNeedsVerification: doc.bearingEdgeNeedsVerification,

    companyName: firstNonEmpty(doc.companyName, doc['COMPANY NAME']),

    companyType: firstNonEmpty(doc.companyType, doc['COMPANY TYPE']),

    modelName: firstNonEmpty(doc.modelName, doc['MODEL NAME']),

    lineSeries: firstNonEmpty(doc.lineSeries, doc.series, doc['LINE/SERIES']),

    drumType: firstNonEmpty(doc.drumType, doc['DRUM TYPE']),

    diameter: rawFirst(shell.diameter, shell.size?.diameter, doc.diameter, doc.DIAMETER),

    depth: rawFirst(shell.depth, shell.size?.depth, doc.depth, doc.DEPTH),

    shellMaterial: firstNonEmpty(

      shell.material,

      shell.materials,

      shell.primaryMaterial,

      shell.shellMaterial,

      doc.shellMaterial,

      doc.shellMaterial1,

      doc['SHELL MATERIAL 1'],

      doc.material

    ),

    shellConstruction: firstNonEmpty(

      shell.construction,

      shell.shellConstruction,

      doc.shellConstruction,

      doc['SHELL CONSTRUCTION'],

      doc.construction

    ),

    shellThickness: firstNonEmpty(

      shell.thicknessMm,

      shell.thickness,

      shell.shellThickness,

      shell.thicknessInches,

      doc.shellThicknessMm,

      doc.shellThickness,

      doc.thicknessMm,

      doc.thickness,

      doc['SHELL THICKNESS (mm)']

    ),

    shellThicknessConfidence: firstNonEmpty(

      shell.thicknessConfidence,

      shell.shellThicknessConfidence,

      doc.shellThicknessConfidence,

      doc.thicknessConfidence

    ),

    bearingEdge: firstNonEmpty(

      shell.bearingEdge,

      shell.bearingEdges,

      shell.edge,

      shell.edgeProfile,

      shell.bearingEdgeProfile,

      doc.bearingEdge,

      doc.edgeProfile,

      doc['BEARING EDGE']

    ),

    bearingEdgeConfidence: firstNonEmpty(

      shell.bearingEdgeConfidence,

      shell.edgeConfidence,

      doc.bearingEdgeConfidence,

      doc.edgeConfidence

    ),

    snareBed: firstNonEmpty(

      shell.snareBed,

      shell.snareBedType,

      stockSnareSystem.snareBed,

      stockSnareSystem.snareBedType,

      doc.snareBed,

      doc.snareBedType,

      doc['SNARE BED TYPE']

    ),

    reinforcementRings: firstNonEmpty(

      shell.reinforcementRings,

      shell.reRings,

      shell.rerings,

      shell.reinforcementRing,

      shell.reRing,

      doc.reinforcementRings,

      doc.reRings,

      doc.rerings,

      doc['REINFORCEMENT RINGS']

    ),

    reinforcementRingMaterial: firstNonEmpty(

      shell.reinforcementRingMaterial,

      shell.reRingMaterial,

      shell.reRingsMaterial,

      shell.reringMaterial,

      doc.reinforcementRingMaterial,

      doc.reRingMaterial,

      doc.reringMaterial

    ),

    reinforcementRingThickness: firstNonEmpty(

      shell.reinforcementRingThickness,

      shell.reinforcementRingThicknessMm,

      shell.reRingThickness,

      shell.reRingThicknessMm,

      shell.reringThickness,

      doc.reinforcementRingThickness,

      doc.reinforcementRingThicknessMm,

      doc.reRingThickness,

      doc.reringThickness

    ),

    reinforcementRingHeight: firstNonEmpty(

      shell.reinforcementRingHeight,

      shell.reinforcementRingHeightMm,

      shell.reRingHeight,

      shell.reRingHeightMm,

      shell.reringHeight,

      doc.reinforcementRingHeight,

      doc.reRingHeight,

      doc.reringHeight

    ),

    hoopType: firstNonEmpty(

      stockHardware.hoopType,

      stockHardware.hoops,

      stockHardware.rimType,

      doc.hoopType,

      doc.rimType,

      doc['HOOP/RIM TYPE']

    ),

    stockBatterHead: firstNonEmpty(

      stockHardware.stockBatterHead,

      stockHardware.batterHead,

      stockHardware.heads?.batter,

      stockSnareSystem.stockBatterHead,

      doc.stockBatterHead,

      doc.batterHead,

      doc['STOCK BATTER HEAD']

    ),

    stockResoHead: firstNonEmpty(

      stockHardware.stockResoHead,

      stockHardware.resoHead,

      stockHardware.resonantHead,

      stockHardware.heads?.reso,

      stockHardware.heads?.resonant,

      stockSnareSystem.stockResoHead,

      doc.stockResoHead,

      doc.resoHead,

      doc.resonantHead,

      doc['STOCK RESO HEAD']

    ),

    stockSnareWires: firstNonEmpty(

      stockSnareSystem.stockSnareWires,

      stockSnareSystem.snareWires,

      stockSnareSystem.wires,

      doc.stockSnareWires,

      doc.snareWires,

      doc['STOCK SNARE WIRES']

    ),

    lugCount: firstNonEmpty(stockHardware.lugCount, doc.lugCount, doc['LUG COUNT']),

    lugType: firstNonEmpty(stockHardware.lugType, doc.lugType, doc['LUG TYPE']),

    hardwareFinish: firstNonEmpty(stockHardware.hardwareFinish, doc.hardwareFinish, doc['HARDWARE FINISH']),

    throwOff: firstNonEmpty(

      stockSnareSystem.throwOff,

      stockSnareSystem.throwOffModel,

      doc.throwOff,

      doc.snareThrow,

      doc['SNARE THROW MAKE & MODEL']

    ),

    primarySourceUrl: sourceUrls[0] || null,

    sourceConfidence: firstNonEmpty(

      sources.confidence,

      sources.sourceConfidence,

      sources.primary?.confidence,

      doc.sourceConfidence,

      doc['SOURCE CONFIDENCE'],

      doc.voiceScoreConfidence

    ),

    productionStatus: firstNonEmpty(

      summary.productionStatus,

      collectorMetadata.productionStatus,

      doc.productionStatus,

      doc.currentlyInProduction,

      doc.discontinued,

      doc['CURRENTLY IN PRODUCTION (YES/NO)'],

      doc['DISCONTINUED (YES/NO)']

    ),

    yearIntroduced: firstNonEmpty(collectorMetadata.yearIntroduced, doc.yearIntroduced),

    yearDiscontinued: firstNonEmpty(collectorMetadata.yearDiscontinued, doc.yearDiscontinued),

    countryOfOrigin: firstNonEmpty(collectorMetadata.countryOfOrigin, doc.countryOfOrigin),

    modelNumber: firstNonEmpty(doc.modelNumber, doc.modelNum, doc['MODEL NUM.']),

    duplicateConflict: firstNonEmpty(

      doc.duplicateConflict,

      doc.hasDuplicateConflict,

      doc.unresolvedDuplicateConflict,

      summary.duplicateConflict

    ),

    criticalNumericIssue: firstNonEmpty(

      doc.criticalNumericIssue,

      doc.hasCriticalNumericIssue,

      doc.numericValidityIssue,

      summary.criticalNumericIssue

    ),

  };

}

function isMetalShell(fields) {

  const material = toLowerString(fields.shellMaterial);

  const construction = toLowerString(fields.shellConstruction);

  return (

    material.includes('steel') ||

    material.includes('brass') ||

    material.includes('bronze') ||

    material.includes('copper') ||

    material.includes('aluminum') ||

    material.includes('aluminium') ||

    material.includes('titanium') ||

    material.includes('metal') ||

    construction.includes('metal')

  );

}

function isSinglePlyThinOrSteambentShell(fields) {

  const construction = toLowerString(fields.shellConstruction);

  const material = toLowerString(fields.shellMaterial);

  const model = `${fields.companyName || ''} ${fields.lineSeries || ''} ${fields.modelName || ''}`.toLowerCase();

  const thickness = numeric(fields.shellThickness);

  const explicitSinglePlyOrSteamBent =

    construction.includes('single ply') ||

    construction.includes('single-ply') ||

    construction.includes('solid shell') ||

    construction.includes('solid-shell') ||

    construction.includes('one ply') ||

    construction.includes('one-ply') ||

    construction.includes('steam bent') ||

    construction.includes('steam-bent') ||

    construction.includes('steambent') ||

    model.includes('single ply') ||

    model.includes('single-ply') ||

    model.includes('solid shell') ||

    model.includes('steam bent') ||

    model.includes('steam-bent') ||

    model.includes('steambent') ||

    model.includes('radio king') ||

    model.includes('craviotto') ||

    model.includes('noble') ||

    model.includes('cooley');

  const thinWoodShell =

    Number.isFinite(thickness) &&

    thickness > 0 &&

    thickness <= 6.5 &&

    !isMetalShell(fields) &&

    !material.includes('acrylic');

  return explicitSinglePlyOrSteamBent || thinWoodShell;

}

function reRingValueIndicatesNone(fields) {

  const value = toLowerString(fields.reinforcementRings);

  return (

    value.includes('none') ||

    value.includes('no ') ||

    value === 'false' ||

    value === '0' ||

    value.includes('without')

  );

}

function hasReRingPresenceData(fields) {

  return isPresent(fields.reinforcementRings);

}

function findCriticalNumericIssues(fields) {

  const issues = [];

  const dia = numeric(fields.diameter);

  const dep = numeric(fields.depth);

  const thickness = numeric(fields.shellThickness);

  if (!Number.isFinite(dia)) issues.push('diameter missing or non-numeric');

  if (!Number.isFinite(dep)) issues.push('depth missing or non-numeric');

  if (Number.isFinite(dia) && (dia < 6 || dia > 20)) {

    issues.push(`diameter out of expected snare range: ${fields.diameter}`);

  }

  if (Number.isFinite(dep) && (dep < 2 || dep > 12)) {

    issues.push(`depth out of expected snare range: ${fields.depth}`);

  }

  if (isPresent(fields.shellThickness) && !Number.isFinite(thickness)) {

    issues.push(`shell thickness present but non-numeric: ${fields.shellThickness}`);

  }

  if (Number.isFinite(thickness) && (thickness <= 0 || thickness > 50)) {

    issues.push(`shell thickness out of expected range: ${fields.shellThickness}`);

  }

  if (isTrueish(fields.criticalNumericIssue)) {

    issues.push('record has criticalNumericIssue flag');

  }

  return issues;

}

function hasAuditableMetalEdgeFallback(fields) {

  return (

    fields.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK' ||

    fields.coreShellTier === 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK' ||

    fields.engineAssumptions?.bearingEdgeFallbackApplied === true

  );

}

function findCoreShellMissingStrict(fields) {

  const missing = [];

  if (!isPresent(fields.companyName)) missing.push('companyName');

  if (!isPresent(fields.modelName)) missing.push('modelName');

  if (!Number.isFinite(numeric(fields.diameter))) missing.push('diameter');

  if (!Number.isFinite(numeric(fields.depth))) missing.push('depth');

  if (!isPresent(fields.shellMaterial)) missing.push('shell material');

  if (!isPresent(fields.shellConstruction)) missing.push('shell construction');

  if (!isPresent(fields.shellThickness)) {

    missing.push('shell thickness value');

  }

  if (!isPresent(fields.bearingEdge) && !hasAuditableMetalEdgeFallback(fields)) {

    missing.push('bearing edge shape/detail');

  }

  if (!isPresent(fields.primarySourceUrl)) missing.push('primary source URL');

  if (!isPresent(fields.sourceConfidence)) missing.push('source confidence');

  if (isSinglePlyThinOrSteambentShell(fields) && !hasReRingPresenceData(fields)) {

    missing.push('re-ring presence/absence for single-ply/thin/steam-bent shell');

  }

  return missing;

}

function findCoreShellConfidenceWarnings(fields) {

  const warnings = [];

  if (!isPresent(fields.shellThicknessConfidence)) {

    warnings.push('shell thickness confidence missing');

  } else if (hasLowOrEstimatedConfidence(fields.shellThicknessConfidence)) {

    warnings.push(`shell thickness confidence is ${normalizeField(fields.shellThicknessConfidence)}`);

  }

  if (!isPresent(fields.bearingEdgeConfidence)) {

    warnings.push('bearing edge confidence missing');

  } else if (hasLowOrEstimatedConfidence(fields.bearingEdgeConfidence)) {

    warnings.push(`bearing edge confidence is ${normalizeField(fields.bearingEdgeConfidence)}`);

  }

  if (!isPresent(fields.sourceConfidence)) {

    warnings.push('source confidence missing');

  } else if (hasLowOrEstimatedConfidence(fields.sourceConfidence)) {

    warnings.push(`source confidence is ${normalizeField(fields.sourceConfidence)}`);

  }

  return warnings;

}

function findStockMissingStrict(fields) {

  const missing = [...findCoreShellMissingStrict(fields)];

  if (!isPresent(fields.hoopType)) missing.push('hoop type');

  if (!isPresent(fields.stockBatterHead)) missing.push('stock batter head');

  if (!isPresent(fields.stockResoHead)) missing.push('stock reso head');

  if (!isPresent(fields.stockSnareWires)) missing.push('stock snare wires');

  if (!isPresent(fields.productionStatus)) missing.push('production status');

  return missing;

}

function findNonCriticalShellMissing(fields) {

  const missing = [];

  if (!isPresent(fields.snareBed)) missing.push('snare bed type/detail');

  if (hasReRingPresenceData(fields) && !reRingValueIndicatesNone(fields)) {

    if (!isPresent(fields.reinforcementRingMaterial)) missing.push('re-ring material');

    if (!isPresent(fields.reinforcementRingThickness)) missing.push('re-ring thickness');

    if (!isPresent(fields.reinforcementRingHeight)) missing.push('re-ring height');

  }

  return missing;

}

function findNonCriticalStockMissing(fields) {

  const missing = [];

  if (!isPresent(fields.lugCount)) missing.push('lug count');

  if (!isPresent(fields.lugType)) missing.push('lug type');

  if (!isPresent(fields.hardwareFinish)) missing.push('hardware finish');

  if (!isPresent(fields.throwOff)) missing.push('throw-off make/model');

  if (!isPresent(fields.modelNumber)) missing.push('model number');

  if (!isPresent(fields.countryOfOrigin)) missing.push('country of origin');

  if (!isPresent(fields.yearIntroduced)) missing.push('year introduced');

  if (!isPresent(fields.yearDiscontinued) && toLowerString(fields.productionStatus).includes('discontinued')) {

    missing.push('year discontinued');

  }

  return missing;

}

function classifyCoreShellStrict(fields) {

  const criticalIssues = findCriticalNumericIssues(fields);

  const missing = findCoreShellMissingStrict(fields);

  const confidenceWarnings = findCoreShellConfidenceWarnings(fields);

  if (criticalIssues.length > 0 || isTrueish(fields.duplicateConflict)) {

    return {

      tier: 'CORE_SHELL_NOT_READY',

      passable: false,

      missing,

      confidenceWarnings,

      criticalIssues,

      reason: criticalIssues.length

        ? criticalIssues.join('; ')

        : 'unresolved duplicate conflict or critical issue flag',

    };

  }

  if (hasAuditableMetalEdgeFallback(fields) && missing.length === 0) {

    return {

      tier: 'PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK',

      passable: true,

      missing,

      confidenceWarnings: [

        ...confidenceWarnings,

        'bearing edge uses auditable metal-shell fallback and still needs verification',

      ],

      criticalIssues,

      reason:

        'has required shell facts with auditable metal-shell bearing-edge fallback; bearing edge is not source-confirmed',

    };

  }

  if (missing.length === 0 && confidenceWarnings.length === 0) {

    return {

      tier: 'PASSABLE_CORE_SHELL_STRICT',

      passable: true,

      missing,

      confidenceWarnings,

      criticalIssues,

      reason: 'has required shell facts and no confidence warnings',

    };

  }

  if (missing.length === 0 && confidenceWarnings.length > 0) {

    return {

      tier: 'PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS',

      passable: true,

      missing,

      confidenceWarnings,

      criticalIssues,

      reason: `has required shell facts, but confidence needs review: ${confidenceWarnings.join(', ')}`,

    };

  }

  return {

    tier: 'CORE_SHELL_NEEDS_RESEARCH',

    passable: false,

    missing,

    confidenceWarnings,

    criticalIssues,

    reason: `missing required core shell fields: ${missing.join(', ')}`,

  };

}

function classifyStockStrict(fields) {

  const core = classifyCoreShellStrict(fields);

  const criticalIssues = findCriticalNumericIssues(fields);

  const missing = findStockMissingStrict(fields);

  if (criticalIssues.length > 0 || isTrueish(fields.duplicateConflict)) {

    return {

      tier: 'STOCK_NOT_READY',

      passable: false,

      missing,

      criticalIssues,

      reason: criticalIssues.length

        ? criticalIssues.join('; ')

        : 'unresolved duplicate conflict or critical issue flag',

    };

  }

  if (missing.length === 0 && core.tier === 'PASSABLE_CORE_SHELL_STRICT') {

    return {

      tier: 'PASSABLE_STOCK_STRICT',

      passable: true,

      missing,

      criticalIssues,

      reason: 'has strict core shell data and complete required stock configuration',

    };

  }

  if (

    missing.length === 0 &&

    (

      core.tier === 'PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS' ||

      core.tier === 'PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK'

    )

  ) {

    return {

      tier: core.tier === 'PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK'

        ? 'PASSABLE_STOCK_WITH_METAL_EDGE_FALLBACK'

        : 'PASSABLE_STOCK_WITH_CORE_CONFIDENCE_WARNINGS',

      passable: true,

      missing,

      criticalIssues,

      reason: core.tier === 'PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK'

        ? 'stock configuration complete, but core shell uses auditable metal-edge fallback'

        : 'stock configuration complete, but core shell confidence needs review',

    };

  }

  const coreMissing = new Set(core.missing || []);

  const stockOnlyMissing = missing.filter((field) => !coreMissing.has(field));

  const nearlyPassable =

    core.passable &&

    stockOnlyMissing.length > 0 &&

    stockOnlyMissing.length <= 4 &&

    stockOnlyMissing.every((field) =>

      [

        'hoop type',

        'stock batter head',

        'stock reso head',

        'stock snare wires',

        'production status',

      ].includes(field)

    );

  if (nearlyPassable) {

    return {

      tier: 'NEARLY_PASSABLE_STOCK',

      passable: false,

      missing,

      criticalIssues,

      reason: `core shell passes; missing stock fields: ${stockOnlyMissing.join(', ')}`,

    };

  }

  if (core.passable) {

    return {

      tier: 'CORE_PASSABLE_STOCK_NEEDS_RESEARCH',

      passable: false,

      missing,

      criticalIssues,

      reason: `core shell passes; stock configuration incomplete: ${stockOnlyMissing.join(', ')}`,

    };

  }

  return {

    tier: 'STOCK_NEEDS_RESEARCH',

    passable: false,

    missing,

    criticalIssues,

    reason: `missing required core/stock fields: ${missing.join(', ')}`,

  };

}

function recordLabel(fields) {

  return [

    normalizeField(fields.companyName),

    normalizeField(fields.lineSeries),

    normalizeField(fields.modelName),

    normalizeField(fields.diameter) && normalizeField(fields.depth)

      ? `${normalizeField(fields.diameter)}x${normalizeField(fields.depth)}`

      : '',

  ]

    .filter(Boolean)

    .join(' — ');

}

function increment(obj, key, amount = 1) {

  obj[key] = (obj[key] || 0) + amount;

}

function priorityScore(row) {

  let score = 0;

  const haystack = `${row.companyName || ''} ${row.lineSeries || ''} ${row.modelName || ''}`.toLowerCase();

  const priorityTerms = [

    'supraphonic',

    'black beauty',

    'acrolite',

    'jazz festival',

    'dyna-sonic',

    'dynasonic',

    'powertone',

    'radio king',

    'broadkaster',

    'usa custom',

    'bell brass',

    'king beat',

    'recording custom',

    'tour custom',

    'sensitone',

    'free floating',

    'kompressor',

    'craviotto',

    'brady',

    'noble',

    'canopus',

    'ahead',

  ];

  priorityTerms.forEach((term, index) => {

    if (haystack.includes(term)) score += 1000 - index * 20;

  });

  if (row.stockTier === 'PASSABLE_STOCK_STRICT') score += 700;

  if (row.stockTier === 'PASSABLE_STOCK_WITH_CORE_CONFIDENCE_WARNINGS') score += 600;

  if (row.stockTier === 'NEARLY_PASSABLE_STOCK') score += 450;

  if (row.coreShellTier === 'PASSABLE_CORE_SHELL_STRICT') score += 300;

  if (row.coreShellTier === 'PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS') score += 220;

  if (row.coreShellTier === 'PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK') score += 210;

  score -= (row.missingForStock || []).length * 12;

  score -= (row.missingForCoreShell || []).length * 25;

  score -= (row.coreShellConfidenceWarnings || []).length * 8;

  return score;

}

function compactRow(row) {

  return {

    id: row.id,

    label: row.label,

    companyName: row.companyName,

    lineSeries: row.lineSeries,

    modelName: row.modelName,

    diameter: row.diameter,

    depth: row.depth,

    stockTier: row.stockTier,

    coreShellTier: row.coreShellTier,

    missingForStock: row.missingForStock,

    missingForCoreShell: row.missingForCoreShell,

    coreShellConfidenceWarnings: row.coreShellConfidenceWarnings,

    shellMaterial: row.shellMaterial,

    shellConstruction: row.shellConstruction,

    shellThickness: row.shellThickness,

    shellThicknessConfidence: row.shellThicknessConfidence,

    bearingEdge: row.bearingEdge,

    bearingEdgeConfidence: row.bearingEdgeConfidence,

    hoopType: row.hoopType,

    stockBatterHead: row.stockBatterHead,

    stockResoHead: row.stockResoHead,

    stockSnareWires: row.stockSnareWires,

    productionStatus: row.productionStatus,

    primarySourceUrl: row.primarySourceUrl,

    sourceConfidence: row.sourceConfidence,

    nonCriticalMissingStock: row.nonCriticalMissingStock,

    nonCriticalMissingShell: row.nonCriticalMissingShell,

    priorityScore: row.priorityScore,

    reason: row.stockReason,

  };

}

function countArrayField(rows, key) {

  const counts = {};

  for (const row of rows) {

    const arr = Array.isArray(row[key]) ? row[key] : [];

    for (const item of arr) increment(counts, item);

  }

  return Object.entries(counts)

    .sort((a, b) => b[1] - a[1])

    .map(([field, count]) => ({ field, count }));

}

function buildReport(rows) {

  const stockTierCounts = {};

  const coreShellTierCounts = {};

  const manufacturerBreakdown = {};

  for (const row of rows) {

    increment(stockTierCounts, row.stockTier);

    increment(coreShellTierCounts, row.coreShellTier);

    const company = row.companyName || 'UNKNOWN_COMPANY';

    if (!manufacturerBreakdown[company]) {

      manufacturerBreakdown[company] = {

        total: 0,

        PASSABLE_STOCK_STRICT: 0,

        PASSABLE_STOCK_WITH_CORE_CONFIDENCE_WARNINGS: 0,

        PASSABLE_STOCK_WITH_METAL_EDGE_FALLBACK: 0,

        NEARLY_PASSABLE_STOCK: 0,

        CORE_PASSABLE_STOCK_NEEDS_RESEARCH: 0,

        STOCK_NEEDS_RESEARCH: 0,

        STOCK_NOT_READY: 0,

        PASSABLE_CORE_SHELL_STRICT: 0,

        PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS: 0,

        PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK: 0,

        CORE_SHELL_NEEDS_RESEARCH: 0,

        CORE_SHELL_NOT_READY: 0,

      };

    }

    manufacturerBreakdown[company].total += 1;

    manufacturerBreakdown[company][row.stockTier] += 1;

    manufacturerBreakdown[company][row.coreShellTier] += 1;

  }

  const sortedRows = [...rows].sort((a, b) => b.priorityScore - a.priorityScore);

  const strictCore = sortedRows.filter((row) => row.coreShellTier === 'PASSABLE_CORE_SHELL_STRICT');

  const warningCore = sortedRows.filter((row) => row.coreShellTier === 'PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS');

  const coreBlocked = sortedRows.filter((row) => row.coreShellTier === 'CORE_SHELL_NEEDS_RESEARCH');

  const strictStock = sortedRows.filter((row) => row.stockTier === 'PASSABLE_STOCK_STRICT');

  const warningStock = sortedRows.filter((row) => row.stockTier === 'PASSABLE_STOCK_WITH_CORE_CONFIDENCE_WARNINGS');

  const nearlyStock = sortedRows.filter((row) => row.stockTier === 'NEARLY_PASSABLE_STOCK');

  const manufacturerRows = Object.entries(manufacturerBreakdown)

    .sort((a, b) => b[1].total - a[1].total)

    .map(([companyName, counts]) => ({ companyName, ...counts }));

  const topMissingCore = countArrayField(rows, 'missingForCoreShell');

  const topMissingStock = countArrayField(rows, 'missingForStock');

  const topConfidenceWarnings = countArrayField(rows, 'coreShellConfidenceWarnings');

  const topNonCriticalShell = countArrayField(rows, 'nonCriticalMissingShell');

  const topNonCriticalStock = countArrayField(rows, 'nonCriticalMissingStock');

  return {

    auditName: 'OBER LEGACYPRINT™ STRICT PASSABLE READINESS AUDIT',

    mode: 'READ_ONLY',

    collectionName: COLLECTION_NAME,

    generatedAt: new Date().toISOString(),

    totalRecordsScanned: rows.length,

    strictDefinition: {

      passableCoreShell:

        'Requires actual shell thickness value and actual bearing edge shape/detail. Confidence qualifies values but does not replace them.',

      passableStock:

        'Requires strict/passable core shell plus hoop type, stock batter head, stock reso head, stock snare wires, and production status.',

    },

    stockTierCounts: {

      PASSABLE_STOCK_STRICT: stockTierCounts.PASSABLE_STOCK_STRICT || 0,

      PASSABLE_STOCK_WITH_CORE_CONFIDENCE_WARNINGS:

        stockTierCounts.PASSABLE_STOCK_WITH_CORE_CONFIDENCE_WARNINGS || 0,

      NEARLY_PASSABLE_STOCK: stockTierCounts.NEARLY_PASSABLE_STOCK || 0,

      CORE_PASSABLE_STOCK_NEEDS_RESEARCH:

        stockTierCounts.CORE_PASSABLE_STOCK_NEEDS_RESEARCH || 0,

      STOCK_NEEDS_RESEARCH: stockTierCounts.STOCK_NEEDS_RESEARCH || 0,

      STOCK_NOT_READY: stockTierCounts.STOCK_NOT_READY || 0,

    },

    coreShellTierCounts: {

      PASSABLE_CORE_SHELL_STRICT: coreShellTierCounts.PASSABLE_CORE_SHELL_STRICT || 0,

      PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS:

        coreShellTierCounts.PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS || 0,

      PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK:

        coreShellTierCounts.PASSABLE_CORE_SHELL_WITH_METAL_EDGE_FALLBACK || 0,

      CORE_SHELL_NEEDS_RESEARCH: coreShellTierCounts.CORE_SHELL_NEEDS_RESEARCH || 0,

      CORE_SHELL_NOT_READY: coreShellTierCounts.CORE_SHELL_NOT_READY || 0,

    },

    topMissingFieldsBlockingCoreShellStrictPass: topMissingCore,

    topMissingFieldsBlockingStockStrictPass: topMissingStock,

    topCoreShellConfidenceWarnings: topConfidenceWarnings,

    topNonCriticalMissingShellFields: topNonCriticalShell,

    topNonCriticalMissingStockFields: topNonCriticalStock,

    top25PassableCoreShellStrict: strictCore.slice(0, 25).map(compactRow),

    top25PassableCoreShellWithConfidenceWarnings: warningCore.slice(0, 25).map(compactRow),

    top25CoreShellBlocked: coreBlocked.slice(0, 25).map(compactRow),

    top25PassableStockStrict: strictStock.slice(0, 25).map(compactRow),

    top25PassableStockWithCoreConfidenceWarnings: warningStock.slice(0, 25).map(compactRow),

    top25NearlyPassableStock: nearlyStock.slice(0, 25).map(compactRow),

    manufacturerBreakdownByStrictReadinessTier: manufacturerRows,

    recommendedEnrichmentOrder: {

      phase1: {

        name: 'Protect strict engine baseline',

        action:

          'Use PASSABLE_CORE_SHELL_STRICT records only for cleanest shell-engine calibration.',

        records: strictCore.slice(0, 25).map(compactRow),

      },

      phase2: {

        name: 'Review confidence-warning core shell records',

        action:

          'These have physical values but need confidence cleanup before being considered clean calibration references.',

        records: warningCore.slice(0, 25).map(compactRow),

      },

      phase3: {

        name: 'Unlock blocked core shell records',

        fields: topMissingCore.slice(0, 12),

      },

      phase4: {

        name: 'Promote nearly passable stock records',

        fields: topMissingStock.slice(0, 12),

        records: nearlyStock.slice(0, 25).map(compactRow),

      },

      phase5: {

        name: 'Backfill non-critical fields',

        stockFields: topNonCriticalStock.slice(0, 12),

        shellFields: topNonCriticalShell.slice(0, 12),

      },

    },

    masterReportBackText: buildMasterReportBackText(

      rows.length,

      stockTierCounts,

      coreShellTierCounts,

      topMissingCore,

      topMissingStock,

      topConfidenceWarnings

    ),

    allRows: sortedRows,

  };

}

function buildMasterReportBackText(

  total,

  stockTierCounts,

  coreShellTierCounts,

  topMissingCore,

  topMissingStock,

  topConfidenceWarnings

) {

  const coreStrict = coreShellTierCounts.PASSABLE_CORE_SHELL_STRICT || 0;

  const coreWarn = coreShellTierCounts.PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS || 0;

  const coreBlocked = coreShellTierCounts.CORE_SHELL_NEEDS_RESEARCH || 0;

  const stockStrict = stockTierCounts.PASSABLE_STOCK_STRICT || 0;

  const stockWarn = stockTierCounts.PASSABLE_STOCK_WITH_CORE_CONFIDENCE_WARNINGS || 0;

  const nearlyStock = stockTierCounts.NEARLY_PASSABLE_STOCK || 0;

  const stockNeeds = stockTierCounts.STOCK_NEEDS_RESEARCH || 0;

  const coreBlockers = topMissingCore

    .slice(0, 5)

    .map((item) => `${item.field} (${item.count})`)

    .join(', ');

  const stockBlockers = topMissingStock

    .slice(0, 5)

    .map((item) => `${item.field} (${item.count})`)

    .join(', ');

  const confidenceWarnings = topConfidenceWarnings

    .slice(0, 5)

    .map((item) => `${item.field} (${item.count})`)

    .join(', ');

  return [

    `Strict passable readiness audit complete.`,

    `Read-only scan of ${total} snareReferenceDrums records.`,

    `Core shell strict tiers: PASSABLE_CORE_SHELL_STRICT ${coreStrict}, PASSABLE_CORE_SHELL_WITH_CONFIDENCE_WARNINGS ${coreWarn}, CORE_SHELL_NEEDS_RESEARCH ${coreBlocked}.`,

    `Stock strict tiers: PASSABLE_STOCK_STRICT ${stockStrict}, PASSABLE_STOCK_WITH_CORE_CONFIDENCE_WARNINGS ${stockWarn}, NEARLY_PASSABLE_STOCK ${nearlyStock}, STOCK_NEEDS_RESEARCH ${stockNeeds}.`,

    `Top strict core blockers: ${coreBlockers || 'none detected'}.`,

    `Top strict stock blockers: ${stockBlockers || 'none detected'}.`,

    `Top confidence warnings: ${confidenceWarnings || 'none detected'}.`,

    `Recommended next step: use strict core-shell pass records for engine calibration, separately review confidence-warning records, then enrich missing shell thickness and bearing edge values before stock-head and production-status cleanup.`,

  ].join(' ');

}

async function main() {

  initFirebaseAdmin();

  const db = admin.firestore();

  console.log('');

  console.log('OBER LEGACYPRINT™ STRICT PASSABLE READINESS AUDIT');

  console.log('Mode: READ ONLY');

  console.log(`Collection: ${COLLECTION_NAME}`);

  console.log('');

  const snapshot = await db.collection(COLLECTION_NAME).get();

  const rows = [];

  snapshot.forEach((docSnap) => {

    const data = {

      __id: docSnap.id,

      ...docSnap.data(),

    };

    const fields = getCanonicalFields(data);

    const coreShellClassification = classifyCoreShellStrict(fields);

    const stockClassification = classifyStockStrict(fields);

    const row = {

      id: docSnap.id,

      label: recordLabel(fields),

      companyName: normalizeField(fields.companyName),

      companyType: normalizeField(fields.companyType),

      modelName: normalizeField(fields.modelName),

      lineSeries: normalizeField(fields.lineSeries),

      drumType: normalizeField(fields.drumType),

      diameter: normalizeField(fields.diameter),

      depth: normalizeField(fields.depth),

      shellMaterial: normalizeField(fields.shellMaterial),

      shellConstruction: normalizeField(fields.shellConstruction),

      shellThickness: normalizeField(fields.shellThickness),

      shellThicknessConfidence: normalizeField(fields.shellThicknessConfidence),

      bearingEdge: normalizeField(fields.bearingEdge),

      bearingEdgeConfidence: normalizeField(fields.bearingEdgeConfidence),

      snareBed: normalizeField(fields.snareBed),

      reinforcementRings: normalizeField(fields.reinforcementRings),

      reinforcementRingMaterial: normalizeField(fields.reinforcementRingMaterial),

      reinforcementRingThickness: normalizeField(fields.reinforcementRingThickness),

      reinforcementRingHeight: normalizeField(fields.reinforcementRingHeight),

      hoopType: normalizeField(fields.hoopType),

      stockBatterHead: normalizeField(fields.stockBatterHead),

      stockResoHead: normalizeField(fields.stockResoHead),

      stockSnareWires: normalizeField(fields.stockSnareWires),

      lugCount: normalizeField(fields.lugCount),

      lugType: normalizeField(fields.lugType),

      hardwareFinish: normalizeField(fields.hardwareFinish),

      throwOff: normalizeField(fields.throwOff),

      productionStatus: normalizeField(fields.productionStatus),

      primarySourceUrl: normalizeField(fields.primarySourceUrl),

      sourceConfidence: normalizeField(fields.sourceConfidence),

      coreShellTier: coreShellClassification.tier,

      coreShellPassable: coreShellClassification.passable,

      coreShellReason: coreShellClassification.reason,

      missingForCoreShell: coreShellClassification.missing,

      coreShellConfidenceWarnings: coreShellClassification.confidenceWarnings,

      coreShellCriticalIssues: coreShellClassification.criticalIssues,

      stockTier: stockClassification.tier,

      stockPassable: stockClassification.passable,

      stockReason: stockClassification.reason,

      missingForStock: stockClassification.missing,

      stockCriticalIssues: stockClassification.criticalIssues,

      isSinglePlyThinOrSteambentShell: isSinglePlyThinOrSteambentShell(fields),

      hasReRingPresenceData: hasReRingPresenceData(fields),

      reRingValueIndicatesNone: reRingValueIndicatesNone(fields),

      nonCriticalMissingShell: findNonCriticalShellMissing(fields),

      nonCriticalMissingStock: findNonCriticalStockMissing(fields),

    };

    row.priorityScore = priorityScore(row);

    rows.push(row);

  });

  const report = buildReport(rows);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

  console.log('TOTAL RECORDS SCANNED');

  console.table([{ totalRecordsScanned: report.totalRecordsScanned }]);

  console.log('');

  console.log('STRICT CORE SHELL READINESS TIER COUNTS');

  console.table([report.coreShellTierCounts]);

  console.log('');

  console.log('STRICT STOCK READINESS TIER COUNTS');

  console.table([report.stockTierCounts]);

  console.log('');

  console.log('TOP MISSING FIELDS BLOCKING STRICT CORE SHELL PASS');

  console.table(report.topMissingFieldsBlockingCoreShellStrictPass.slice(0, 25));

  console.log('');

  console.log('TOP MISSING FIELDS BLOCKING STRICT STOCK PASS');

  console.table(report.topMissingFieldsBlockingStockStrictPass.slice(0, 25));

  console.log('');

  console.log('TOP CORE SHELL CONFIDENCE WARNINGS');

  console.table(report.topCoreShellConfidenceWarnings.slice(0, 25));

  console.log('');

  console.log('TOP 25 PASSABLE CORE SHELL STRICT');

  console.table(report.top25PassableCoreShellStrict);

  console.log('');

  console.log('TOP 25 PASSABLE CORE SHELL WITH CONFIDENCE WARNINGS');

  console.table(report.top25PassableCoreShellWithConfidenceWarnings);

  console.log('');

  console.log('TOP 25 CORE SHELL BLOCKED');

  console.table(report.top25CoreShellBlocked);

  console.log('');

  console.log('TOP 25 PASSABLE STOCK STRICT');

  console.table(report.top25PassableStockStrict);

  console.log('');

  console.log('TOP 25 NEARLY PASSABLE STOCK');

  console.table(report.top25NearlyPassableStock);

  console.log('');

  console.log('MANUFACTURER BREAKDOWN BY STRICT READINESS TIER');

  console.table(report.manufacturerBreakdownByStrictReadinessTier);

  console.log('');

  console.log('RECOMMENDED ENRICHMENT ORDER');

  console.dir(report.recommendedEnrichmentOrder, { depth: 5 });

  console.log('');

  console.log('MASTER REPORT-BACK TEXT');

  console.log(report.masterReportBackText);

  console.log('');

  console.log(`JSON report written to: ${OUTPUT_FILE}`);

  console.log('');

}

main().catch((error) => {

  console.error('');

  console.error('Strict passable readiness audit failed.');

  console.error(error);

  console.error('');

  process.exit(1);

});