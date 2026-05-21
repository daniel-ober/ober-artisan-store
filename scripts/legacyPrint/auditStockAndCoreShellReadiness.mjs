// scripts/legacyPrint/auditStockAndCoreShellReadiness.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// PHASE 3T — STOCK + CORE SHELL READINESS CROSS-REFERENCE AUDIT

//

// READ-ONLY.

// Does NOT write Firestore patches.

// Does NOT rescore drums.

// Does NOT scrape new data.

// Does NOT change schema.

// Does NOT overwrite records.

//

// IMPORTANT ENGINE ASSUMPTION:

// Existing voice node fields such as attack, brightness, projection,

// sustain, warmth, sensitivity, and control are treated as legacy/reference

// display values only. They are NOT used to determine readiness.

// Readiness is based on physical configuration completeness only.

import admin from 'firebase-admin';

import fs from 'fs';

import path from 'path';

const COLLECTION_NAME = 'snareReferenceDrums';

const OUTPUT_DIR = path.resolve('tmp/legacyPrint-audits');

const OUTPUT_FILE = path.join(

  OUTPUT_DIR,

  `phase-3t-stock-core-shell-readiness-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

);

const CORE_SHELL_REQUIRED_FIELDS = [

  'companyName',

  'modelName',

  'diameter',

  'depth',

  'shell material',

  'shell construction',

  'shell thickness or explicit thickness confidence',

  'bearing edge or explicit edge confidence',

  'primary source URL',

  'source confidence',

];

const STOCK_REQUIRED_FIELDS = [

  ...CORE_SHELL_REQUIRED_FIELDS,

  'hoop type',

  'stock batter head',

  'stock reso head',

  'stock snare wires',

  'production status',

];

const NON_CRITICAL_SHELL_FIELDS = [

  'shell finish',

  'shell interior finish',

  'outer ply material',

  'inner ply material',

  'ply count / layup detail',

  'glue type',

  'shell forming method',

  'bearing edge angle detail',

  'snare bed width',

  'snare bed depth',

  're-ring material',

  're-ring thickness',

  're-ring height',

  're-ring count',

  're-ring grain orientation',

];

const NON_CRITICAL_STOCK_FIELDS = [

  'lug count',

  'lug type',

  'tension rod type',

  'throw-off make/model',

  'butt plate make/model',

  'hardware finish',

  'stock batter head exact film/coating',

  'stock reso head exact weight',

  'snare wire strand count',

  'snare wire material',

  'snare wire end plate style',

  'factory muffler',

  'badge type',

  'country of origin',

  'model number',

  'year introduced',

  'year discontinued',

  'artist/signature status',

  'limited run status',

];

const COMMON_KNOWN_VINTAGE_TERMS = [

  'supraphonic',

  'black beauty',

  'acrolite',

  'jazz festival',

  'pioneer',

  'super sensitive',

  'supersensitive',

  'dyna-sonic',

  'dynasonic',

  'powertone',

  'radio king',

  'sound king',

  'broadkaster',

  'usa custom',

  'bell brass',

  'king beat',

  'rosewood',

  'artstar',

  'granstar',

  'recording custom',

  'tour custom',

  'sensitone',

  'free floating',

  'free-floating',

  'reference',

  'masters',

  'phosphor bronze',

  'bronze',

  'copper',

  'brass',

  'aluminum',

  'steel',

  'maple',

  'walnut',

  'oak',

  'beech',

  'craviotto',

  'brady',

  'noble',

  'cooley',

  'dunnett',

  'canopus',

  'kompressor',

  'signature',

  'collector',

];

const STRONG_COMMON_PRIORITY = [

  'ludwig supraphonic',

  'ludwig black beauty',

  'ludwig acrolite',

  'ludwig jazz festival',

  'ludwig pioneer',

  'rogers dyna-sonic',

  'rogers dynasonic',

  'rogers powertone',

  'slingerland radio king',

  'gretsch broadkaster',

  'gretsch usa custom',

  'tama bell brass',

  'tama king beat',

  'tama artstar',

  'yamaha recording custom',

  'yamaha tour custom',

  'pearl sensitone',

  'pearl free floating',

  'pearl free-floating',

  'sonor kompressor',

  'dw collector',

  'craviotto',

  'brady',

  'noble',

  'canopus',

  'ahead',

];

function initFirebaseAdmin() {

  if (admin.apps.length) return;

  admin.initializeApp({

    credential: admin.credential.applicationDefault(),

  });

}

function firstNonEmpty(...values) {

  for (const value of values) {

    if (value === undefined || value === null) continue;

    if (typeof value === 'string' && value.trim() === '') continue;

    if (typeof value === 'string' && value.trim().toLowerCase() === 'unknown') continue;

    if (typeof value === 'string' && value.trim().toLowerCase() === 'n/a') continue;

    if (typeof value === 'string' && value.trim().toLowerCase() === 'na') continue;

    if (Array.isArray(value) && value.length === 0) continue;

    return value;

  }

  return null;

}

function rawFirst(...values) {

  for (const value of values) {

    if (value !== undefined && value !== null) return value;

  }

  return null;

}

function toLowerString(value) {

  if (value === undefined || value === null) return '';

  if (Array.isArray(value)) return value.join(' ').toLowerCase();

  if (typeof value === 'object') return JSON.stringify(value).toLowerCase();

  return String(value).toLowerCase();

}

function normalizeField(value) {

  if (value === undefined || value === null) return '';

  if (Array.isArray(value)) return value.filter(Boolean).join(', ').trim();

  if (typeof value === 'object') return JSON.stringify(value);

  return String(value).trim();

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

function hasConfidence(value) {

  if (!isPresent(value)) return false;

  const v = toLowerString(value);

  return (

    v.includes('confirmed') ||

    v.includes('high') ||

    v.includes('medium') ||

    v.includes('estimated') ||

    v.includes('inferred') ||

    v.includes('explicit') ||

    v.includes('documented')

  );

}

function isTrueish(value) {

  if (value === true) return true;

  if (typeof value === 'string') {

    const v = value.trim().toLowerCase();

    return v === 'true' || v === 'yes' || v === 'y' || v === '1';

  }

  return false;

}

function includesAny(value, terms) {

  const haystack = toLowerString(value);

  return terms.some((term) => haystack.includes(term));

}

function getCanonicalFields(doc) {

  const shell = doc.shell || {};

  const stockHardware = doc.stockHardware || {};

  const stockSnareSystem = doc.stockSnareSystem || {};

  const sources = doc.sources || {};

  const summary = doc.summary || {};

  const collectorMetadata = doc.collectorMetadata || {};

  const sourceUrls = [

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

  const diameter = rawFirst(

    shell.diameter,

    shell.size?.diameter,

    doc.diameter,

    doc.DIAMETER

  );

  const depth = rawFirst(

    shell.depth,

    shell.size?.depth,

    doc.depth,

    doc.DEPTH

  );

  const shellMaterial = firstNonEmpty(

    shell.material,

    shell.materials,

    shell.primaryMaterial,

    shell.shellMaterial,

    doc.shellMaterial,

    doc.shellMaterial1,

    doc['SHELL MATERIAL 1'],

    doc.material

  );

  const shellConstruction = firstNonEmpty(

    shell.construction,

    shell.shellConstruction,

    doc.shellConstruction,

    doc['SHELL CONSTRUCTION'],

    doc.construction

  );

  const shellThickness = firstNonEmpty(

    shell.thicknessMm,

    shell.thickness,

    shell.shellThickness,

    doc.shellThicknessMm,

    doc.shellThickness,

    doc['SHELL THICKNESS (mm)']

  );

  const shellThicknessConfidence = firstNonEmpty(

    shell.thicknessConfidence,

    shell.shellThicknessConfidence,

    doc.shellThicknessConfidence,

    doc.thicknessConfidence

  );

  const bearingEdge = firstNonEmpty(

    shell.bearingEdge,

    shell.bearingEdges,

    doc.bearingEdge,

    doc['BEARING EDGE']

  );

  const bearingEdgeConfidence = firstNonEmpty(

    shell.bearingEdgeConfidence,

    shell.edgeConfidence,

    doc.bearingEdgeConfidence,

    doc.edgeConfidence

  );

  const snareBed = firstNonEmpty(

    shell.snareBed,

    shell.snareBedType,

    stockSnareSystem.snareBed,

    stockSnareSystem.snareBedType,

    doc.snareBed,

    doc.snareBedType,

    doc['SNARE BED TYPE']

  );

  const reinforcementRings = firstNonEmpty(

    shell.reinforcementRings,

    shell.reRings,

    shell.rerings,

    shell.reinforcementRing,

    shell.reRing,

    doc.reinforcementRings,

    doc.reRings,

    doc.rerings,

    doc['REINFORCEMENT RINGS']

  );

  const reinforcementRingMaterial = firstNonEmpty(

    shell.reinforcementRingMaterial,

    shell.reRingMaterial,

    shell.reRingsMaterial,

    shell.reringMaterial,

    doc.reinforcementRingMaterial,

    doc.reRingMaterial,

    doc.reringMaterial

  );

  const reinforcementRingThickness = firstNonEmpty(

    shell.reinforcementRingThickness,

    shell.reinforcementRingThicknessMm,

    shell.reRingThickness,

    shell.reRingThicknessMm,

    shell.reringThickness,

    doc.reinforcementRingThickness,

    doc.reinforcementRingThicknessMm,

    doc.reRingThickness,

    doc.reringThickness

  );

  const reinforcementRingHeight = firstNonEmpty(

    shell.reinforcementRingHeight,

    shell.reinforcementRingHeightMm,

    shell.reRingHeight,

    shell.reRingHeightMm,

    shell.reringHeight,

    doc.reinforcementRingHeight,

    doc.reRingHeight,

    doc.reringHeight

  );

  const hoopType = firstNonEmpty(

    stockHardware.hoopType,

    stockHardware.hoops,

    stockHardware.rimType,

    doc.hoopType,

    doc.rimType,

    doc['HOOP/RIM TYPE']

  );

  const stockBatterHead = firstNonEmpty(

    stockHardware.stockBatterHead,

    stockHardware.batterHead,

    stockHardware.heads?.batter,

    stockSnareSystem.stockBatterHead,

    doc.stockBatterHead,

    doc.batterHead,

    doc['STOCK BATTER HEAD']

  );

  const stockResoHead = firstNonEmpty(

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

  );

  const stockSnareWires = firstNonEmpty(

    stockSnareSystem.stockSnareWires,

    stockSnareSystem.snareWires,

    stockSnareSystem.wires,

    doc.stockSnareWires,

    doc.snareWires,

    doc['STOCK SNARE WIRES']

  );

  const sourceConfidence = firstNonEmpty(

    sources.confidence,

    sources.sourceConfidence,

    sources.primary?.confidence,

    doc.sourceConfidence,

    doc['SOURCE CONFIDENCE'],

    doc.voiceScoreConfidence

  );

  const productionStatus = firstNonEmpty(

    summary.productionStatus,

    collectorMetadata.productionStatus,

    doc.productionStatus,

    doc.currentlyInProduction,

    doc.discontinued,

    doc['CURRENTLY IN PRODUCTION (YES/NO)'],

    doc['DISCONTINUED (YES/NO)']

  );

  const duplicateConflict = firstNonEmpty(

    doc.duplicateConflict,

    doc.hasDuplicateConflict,

    doc.unresolvedDuplicateConflict,

    summary.duplicateConflict

  );

  const criticalNumericIssue = firstNonEmpty(

    doc.criticalNumericIssue,

    doc.hasCriticalNumericIssue,

    doc.numericValidityIssue,

    summary.criticalNumericIssue

  );

  return {

    id: doc.__id,

    companyName: firstNonEmpty(doc.companyName, doc['COMPANY NAME']),

    companyType: firstNonEmpty(doc.companyType, doc['COMPANY TYPE']),

    modelName: firstNonEmpty(doc.modelName, doc['MODEL NAME']),

    lineSeries: firstNonEmpty(doc.lineSeries, doc.series, doc['LINE/SERIES']),

    drumType: firstNonEmpty(doc.drumType, doc['DRUM TYPE']),

    diameter,

    depth,

    shellMaterial,

    shellConstruction,

    shellThickness,

    shellThicknessConfidence,

    bearingEdge,

    bearingEdgeConfidence,

    snareBed,

    reinforcementRings,

    reinforcementRingMaterial,

    reinforcementRingThickness,

    reinforcementRingHeight,

    hoopType,

    stockBatterHead,

    stockResoHead,

    stockSnareWires,

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

    sourceConfidence,

    productionStatus,

    yearIntroduced: firstNonEmpty(collectorMetadata.yearIntroduced, doc.yearIntroduced),

    yearDiscontinued: firstNonEmpty(collectorMetadata.yearDiscontinued, doc.yearDiscontinued),

    countryOfOrigin: firstNonEmpty(collectorMetadata.countryOfOrigin, doc.countryOfOrigin),

    modelNumber: firstNonEmpty(doc.modelNumber, doc.modelNum, doc['MODEL NUM.']),

    duplicateConflict,

    criticalNumericIssue,

    rawRecord: doc,

  };

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

    !includesAny(material, ['steel', 'brass', 'bronze', 'copper', 'aluminum', 'acrylic']);

  return explicitSinglePlyOrSteamBent || thinWoodShell;

}

function hasReRingData(fields) {

  return isPresent(fields.reinforcementRings);

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

function findCoreShellMissing(fields) {

  const missing = [];

  if (!isPresent(fields.companyName)) missing.push('companyName');

  if (!isPresent(fields.modelName)) missing.push('modelName');

  const dia = numeric(fields.diameter);

  const dep = numeric(fields.depth);

  if (!Number.isFinite(dia)) missing.push('diameter');

  if (!Number.isFinite(dep)) missing.push('depth');

  if (!isPresent(fields.shellMaterial)) missing.push('shell material');

  if (!isPresent(fields.shellConstruction)) missing.push('shell construction');

  if (!isPresent(fields.shellThickness) && !hasConfidence(fields.shellThicknessConfidence)) {

    missing.push('shell thickness or explicit thickness confidence');

  }

  if (!isPresent(fields.bearingEdge) && !hasConfidence(fields.bearingEdgeConfidence)) {

    missing.push('bearing edge or explicit edge confidence');

  }

  if (!isPresent(fields.primarySourceUrl)) missing.push('primary source URL');

  if (!isPresent(fields.sourceConfidence)) missing.push('source confidence');

  if (isSinglePlyThinOrSteambentShell(fields) && !hasReRingData(fields)) {

    missing.push('re-ring presence/absence for single-ply/thin/steam-bent shell');

  }

  return missing;

}

function findStockMissing(fields) {

  const missing = findCoreShellMissing(fields);

  if (!isPresent(fields.hoopType)) missing.push('hoop type');

  if (!isPresent(fields.stockBatterHead)) missing.push('stock batter head');

  if (!isPresent(fields.stockResoHead)) missing.push('stock reso head');

  if (!isPresent(fields.stockSnareWires)) missing.push('stock snare wires');

  if (!isPresent(fields.productionStatus)) missing.push('production status');

  return missing;

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

  if (Number.isFinite(thickness) && (thickness <= 0 || thickness > 50)) {

    issues.push(`shell thickness out of expected range: ${fields.shellThickness}`);

  }

  if (isTrueish(fields.criticalNumericIssue)) {

    issues.push('record has criticalNumericIssue flag');

  }

  return issues;

}

function findNonCriticalShellMissing(fields) {

  const missing = [];

  if (!isPresent(fields.snareBed)) missing.push('snare bed type/detail');

  if (hasReRingData(fields) && !reRingValueIndicatesNone(fields)) {

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

function classifyCoreShell(fields) {

  const criticalIssues = findCriticalNumericIssues(fields);

  const missing = findCoreShellMissing(fields);

  if (criticalIssues.length > 0 || isTrueish(fields.duplicateConflict)) {

    return {

      passable: false,

      tier: 'CORE_SHELL_NOT_READY',

      missing,

      criticalIssues,

      reason: criticalIssues.length

        ? criticalIssues.join('; ')

        : 'unresolved duplicate conflict or critical issue flag',

    };

  }

  if (missing.length === 0) {

    return {

      passable: true,

      tier: 'PASSABLE_CORE_SHELL',

      missing,

      criticalIssues,

      reason: 'meets core shell readiness requirements',

    };

  }

  return {

    passable: false,

    tier: 'CORE_SHELL_NEEDS_RESEARCH',

    missing,

    criticalIssues,

    reason: `missing core shell fields: ${missing.join(', ')}`,

  };

}

function classifyStock(fields) {

  const core = classifyCoreShell(fields);

  const criticalIssues = findCriticalNumericIssues(fields);

  const missing = findStockMissing(fields);

  if (criticalIssues.length > 0 || isTrueish(fields.duplicateConflict)) {

    return {

      passable: false,

      tier: 'STOCK_NOT_READY',

      missing,

      criticalIssues,

      reason: criticalIssues.length

        ? criticalIssues.join('; ')

        : 'unresolved duplicate conflict or critical issue flag',

    };

  }

  if (missing.length === 0) {

    return {

      passable: true,

      tier: 'PASSABLE_STOCK',

      missing,

      criticalIssues,

      reason: 'meets stock readiness requirements',

    };

  }

  const stockOnlyMissing = missing.filter((field) => !core.missing.includes(field));

  const nearlyPassable =

    core.passable &&

    stockOnlyMissing.length > 0 &&

    stockOnlyMissing.length <= 3 &&

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

      passable: false,

      tier: 'NEARLY_PASSABLE_STOCK',

      missing,

      criticalIssues,

      reason: `core shell passes; missing minor stock fields: ${stockOnlyMissing.join(', ')}`,

    };

  }

  if (core.passable) {

    return {

      passable: false,

      tier: 'SHELL_PASSABLE_STOCK_NEEDS_RESEARCH',

      missing,

      criticalIssues,

      reason: `core shell passes; stock configuration incomplete: ${stockOnlyMissing.join(', ')}`,

    };

  }

  return {

    passable: false,

    tier: 'STOCK_NEEDS_RESEARCH',

    missing,

    criticalIssues,

    reason: `missing stock/core fields: ${missing.join(', ')}`,

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

function isCommonKnownVintage(fields) {

  const haystack = `${fields.companyName || ''} ${fields.lineSeries || ''} ${fields.modelName || ''}`.toLowerCase();

  return COMMON_KNOWN_VINTAGE_TERMS.some((term) => haystack.includes(term));

}

function priorityScore(fields, stockClassification, coreClassification) {

  const haystack = `${fields.companyName || ''} ${fields.lineSeries || ''} ${fields.modelName || ''}`.toLowerCase();

  let score = 0;

  STRONG_COMMON_PRIORITY.forEach((term, index) => {

    if (haystack.includes(term)) {

      score += 1000 - index * 20;

    }

  });

  COMMON_KNOWN_VINTAGE_TERMS.forEach((term) => {

    if (haystack.includes(term)) score += 25;

  });

  if (stockClassification.tier === 'PASSABLE_STOCK') score += 600;

  if (stockClassification.tier === 'NEARLY_PASSABLE_STOCK') score += 450;

  if (stockClassification.tier === 'SHELL_PASSABLE_STOCK_NEEDS_RESEARCH') score += 275;

  if (coreClassification.tier === 'PASSABLE_CORE_SHELL') score += 250;

  const sourceConfidence = toLowerString(fields.sourceConfidence);

  if (sourceConfidence.includes('high')) score += 100;

  if (sourceConfidence.includes('medium')) score += 50;

  score -= (stockClassification.missing?.length || 0) * 12;

  score -= (coreClassification.missing?.length || 0) * 18;

  return score;

}

function increment(obj, key, amount = 1) {

  obj[key] = (obj[key] || 0) + amount;

}

function compactRecord(row) {

  return {

    id: row.id,

    label: row.label,

    stockTier: row.stockTier,

    coreShellTier: row.coreShellTier,

    missingForStock: row.missingForStock,

    missingForCoreShell: row.missingForCoreShell,

    nonCriticalMissingStock: row.nonCriticalMissingStock,

    nonCriticalMissingShell: row.nonCriticalMissingShell,

    reason: row.stockReason,

  };

}

function buildReport(rows) {

  const stockTierCounts = {};

  const coreShellTierCounts = {};

  const manufacturerBreakdown = {};

  const missingStockCounts = {};

  const missingCoreShellCounts = {};

  const nonCriticalStockCounts = {};

  const nonCriticalShellCounts = {};

  const reRingFlagCounts = {

    singlePlyThinOrSteambentShells: 0,

    singlePlyThinOrSteambentMissingReRingPresence: 0,

    reRingDataCaptured: 0,

    reRingDataCapturedMissingNiceToHaveDetails: 0,

  };

  for (const row of rows) {

    increment(stockTierCounts, row.stockTier);

    increment(coreShellTierCounts, row.coreShellTier);

    const company = row.companyName || 'UNKNOWN_COMPANY';

    if (!manufacturerBreakdown[company]) {

      manufacturerBreakdown[company] = {

        total: 0,

        PASSABLE_STOCK: 0,

        NEARLY_PASSABLE_STOCK: 0,

        SHELL_PASSABLE_STOCK_NEEDS_RESEARCH: 0,

        STOCK_NEEDS_RESEARCH: 0,

        STOCK_NOT_READY: 0,

        PASSABLE_CORE_SHELL: 0,

        CORE_SHELL_NEEDS_RESEARCH: 0,

        CORE_SHELL_NOT_READY: 0,

      };

    }

    manufacturerBreakdown[company].total += 1;

    manufacturerBreakdown[company][row.stockTier] += 1;

    manufacturerBreakdown[company][row.coreShellTier] += 1;

    for (const field of row.missingForStock || []) increment(missingStockCounts, field);

    for (const field of row.missingForCoreShell || []) increment(missingCoreShellCounts, field);

    for (const field of row.nonCriticalMissingStock || []) increment(nonCriticalStockCounts, field);

    for (const field of row.nonCriticalMissingShell || []) increment(nonCriticalShellCounts, field);

    if (row.isSinglePlyThinOrSteambentShell) {

      reRingFlagCounts.singlePlyThinOrSteambentShells += 1;

    }

    if (row.isSinglePlyThinOrSteambentShell && row.missingForCoreShell.includes('re-ring presence/absence for single-ply/thin/steam-bent shell')) {

      reRingFlagCounts.singlePlyThinOrSteambentMissingReRingPresence += 1;

    }

    if (row.hasReRingData) {

      reRingFlagCounts.reRingDataCaptured += 1;

    }

    if (

      row.hasReRingData &&

      row.nonCriticalMissingShell.some((field) => field.startsWith('re-ring '))

    ) {

      reRingFlagCounts.reRingDataCapturedMissingNiceToHaveDetails += 1;

    }

  }

  const sorted = [...rows].sort((a, b) => b.priorityScore - a.priorityScore);

  const passableStock = sorted.filter((row) => row.stockTier === 'PASSABLE_STOCK');

  const nearlyPassableStock = sorted.filter((row) => row.stockTier === 'NEARLY_PASSABLE_STOCK');

  const passableCoreShell = sorted.filter((row) => row.coreShellTier === 'PASSABLE_CORE_SHELL');

  const coreShellBlocked = sorted.filter((row) => row.coreShellTier !== 'PASSABLE_CORE_SHELL');

  const knownAvailable = sorted.filter(

    (row) =>

      row.isCommonKnownVintage &&

      (row.stockTier === 'PASSABLE_STOCK' || row.coreShellTier === 'PASSABLE_CORE_SHELL')

  );

  const knownBlocked = sorted.filter(

    (row) =>

      row.isCommonKnownVintage &&

      row.stockTier !== 'PASSABLE_STOCK'

  );

  const reRingCriticalFlags = sorted.filter(

    (row) =>

      row.isSinglePlyThinOrSteambentShell &&

      row.missingForCoreShell.includes('re-ring presence/absence for single-ply/thin/steam-bent shell')

  );

  const reRingNiceToHaveFlags = sorted.filter(

    (row) =>

      row.hasReRingData &&

      row.nonCriticalMissingShell.some((field) => field.startsWith('re-ring '))

  );

  const manufacturerRows = Object.entries(manufacturerBreakdown)

    .sort((a, b) => b[1].total - a[1].total)

    .map(([companyName, counts]) => ({

      companyName,

      ...counts,

    }));

  const topMissingStock = Object.entries(missingStockCounts)

    .sort((a, b) => b[1] - a[1])

    .map(([field, count]) => ({ field, count }));

  const topMissingCoreShell = Object.entries(missingCoreShellCounts)

    .sort((a, b) => b[1] - a[1])

    .map(([field, count]) => ({ field, count }));

  const topNonCriticalStock = Object.entries(nonCriticalStockCounts)

    .sort((a, b) => b[1] - a[1])

    .map(([field, count]) => ({ field, count }));

  const topNonCriticalShell = Object.entries(nonCriticalShellCounts)

    .sort((a, b) => b[1] - a[1])

    .map(([field, count]) => ({ field, count }));

  return {

    auditName: 'OBER LEGACYPRINT™ DATA + RESEARCH — PHASE 3T STOCK + CORE SHELL READINESS CROSS-REFERENCE AUDIT',

    mode: 'READ_ONLY',

    collectionName: COLLECTION_NAME,

    generatedAt: new Date().toISOString(),

    totalRecordsScanned: rows.length,

    stockTierCounts: {

      PASSABLE_STOCK: stockTierCounts.PASSABLE_STOCK || 0,

      NEARLY_PASSABLE_STOCK: stockTierCounts.NEARLY_PASSABLE_STOCK || 0,

      SHELL_PASSABLE_STOCK_NEEDS_RESEARCH: stockTierCounts.SHELL_PASSABLE_STOCK_NEEDS_RESEARCH || 0,

      STOCK_NEEDS_RESEARCH: stockTierCounts.STOCK_NEEDS_RESEARCH || 0,

      STOCK_NOT_READY: stockTierCounts.STOCK_NOT_READY || 0,

    },

    coreShellTierCounts: {

      PASSABLE_CORE_SHELL: coreShellTierCounts.PASSABLE_CORE_SHELL || 0,

      CORE_SHELL_NEEDS_RESEARCH: coreShellTierCounts.CORE_SHELL_NEEDS_RESEARCH || 0,

      CORE_SHELL_NOT_READY: coreShellTierCounts.CORE_SHELL_NOT_READY || 0,

    },

    reRingAuditSummary: reRingFlagCounts,

    topMissingFieldsBlockingStockPass: topMissingStock,

    topMissingFieldsBlockingCoreShellPass: topMissingCoreShell,

    topNonCriticalMissingStockFields: topNonCriticalStock,

    topNonCriticalMissingShellFields: topNonCriticalShell,

    manufacturerBreakdownByReadinessTier: manufacturerRows,

    top25PassableStock: passableStock.slice(0, 25).map(compactRecord),

    top25NearlyPassableStock: nearlyPassableStock.slice(0, 25).map(compactRecord),

    top25PassableCoreShell: passableCoreShell.slice(0, 25).map(compactRecord),

    top25CoreShellBlocked: coreShellBlocked.slice(0, 25).map(compactRecord),

    commonKnownVintageCurrentlyAvailable: knownAvailable.slice(0, 100).map(compactRecord),

    commonKnownVintageStillBlockedForStock: knownBlocked.slice(0, 100).map(compactRecord),

    singlePlyThinSteambentMissingReRingPresence: reRingCriticalFlags.slice(0, 100).map(compactRecord),

    reRingDataCapturedButMissingNiceToHaveDetails: reRingNiceToHaveFlags.slice(0, 100).map(compactRecord),

    requiredFields: {

      passableCoreShell: CORE_SHELL_REQUIRED_FIELDS,

      passableStock: STOCK_REQUIRED_FIELDS,

    },

    nonCriticalFields: {

      shell: NON_CRITICAL_SHELL_FIELDS,

      stock: NON_CRITICAL_STOCK_FIELDS,

    },

    recommendedEnrichmentOrder: {

      phase1: {

        name: 'Promote nearly passable stock records',

        records: nearlyPassableStock.slice(0, 25).map(compactRecord),

      },

      phase2: {

        name: 'Resolve core-shell blockers',

        fields: topMissingCoreShell.slice(0, 12),

      },

      phase3: {

        name: 'Resolve stock blockers',

        fields: topMissingStock.slice(0, 12),

      },

      phase4: {

        name: 'Resolve single-ply/thin/steam-bent re-ring presence flags',

        records: reRingCriticalFlags.slice(0, 25).map(compactRecord),

      },

      phase5: {

        name: 'Backfill non-critical enrichment fields',

        stockFields: topNonCriticalStock.slice(0, 12),

        shellFields: topNonCriticalShell.slice(0, 12),

      },

    },

    masterReportBackText: buildMasterReportBackText(

      rows.length,

      stockTierCounts,

      coreShellTierCounts,

      topMissingStock,

      topMissingCoreShell,

      reRingFlagCounts

    ),

    allRows: rows,

  };

}

function buildMasterReportBackText(

  total,

  stockTierCounts,

  coreShellTierCounts,

  topMissingStock,

  topMissingCoreShell,

  reRingFlagCounts

) {

  const topStockBlockers = topMissingStock

    .slice(0, 5)

    .map((item) => `${item.field} (${item.count})`)

    .join(', ');

  const topCoreBlockers = topMissingCoreShell

    .slice(0, 5)

    .map((item) => `${item.field} (${item.count})`)

    .join(', ');

  return [

    `Phase 3T stock + core-shell readiness cross-reference audit complete.`,

    `Read-only scan of ${total} snareReferenceDrums records.`,

    `Stock tier counts: PASSABLE_STOCK ${stockTierCounts.PASSABLE_STOCK || 0}, NEARLY_PASSABLE_STOCK ${stockTierCounts.NEARLY_PASSABLE_STOCK || 0}, SHELL_PASSABLE_STOCK_NEEDS_RESEARCH ${stockTierCounts.SHELL_PASSABLE_STOCK_NEEDS_RESEARCH || 0}, STOCK_NEEDS_RESEARCH ${stockTierCounts.STOCK_NEEDS_RESEARCH || 0}, STOCK_NOT_READY ${stockTierCounts.STOCK_NOT_READY || 0}.`,

    `Core shell tier counts: PASSABLE_CORE_SHELL ${coreShellTierCounts.PASSABLE_CORE_SHELL || 0}, CORE_SHELL_NEEDS_RESEARCH ${coreShellTierCounts.CORE_SHELL_NEEDS_RESEARCH || 0}, CORE_SHELL_NOT_READY ${coreShellTierCounts.CORE_SHELL_NOT_READY || 0}.`,

    `Top stock blockers: ${topStockBlockers || 'none detected'}.`,

    `Top core-shell blockers: ${topCoreBlockers || 'none detected'}.`,

    `Re-ring audit: ${reRingFlagCounts.singlePlyThinOrSteambentShells} single-ply/thin/steam-bent candidates found; ${reRingFlagCounts.singlePlyThinOrSteambentMissingReRingPresence} are missing required re-ring presence/absence data; ${reRingFlagCounts.reRingDataCaptured} records have re-ring data captured; ${reRingFlagCounts.reRingDataCapturedMissingNiceToHaveDetails} have re-ring data but are missing nice-to-have material/thickness/height details.`,

    `Recommended next step: promote nearly-passable stock records first, resolve core-shell blockers second, then batch-fill single-ply/thin/steam-bent re-ring presence before moving into non-critical enrichment fields.`,

  ].join(' ');

}

async function main() {

  initFirebaseAdmin();

  const db = admin.firestore();

  console.log('');

  console.log('OBER LEGACYPRINT™ PHASE 3T STOCK + CORE SHELL READINESS AUDIT');

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

    const coreShellClassification = classifyCoreShell(fields);

    const stockClassification = classifyStock(fields);

    const nonCriticalMissingShell = findNonCriticalShellMissing(fields);

    const nonCriticalMissingStock = findNonCriticalStockMissing(fields);

    rows.push({

      id: docSnap.id,

      label: recordLabel(fields),

      stockTier: stockClassification.tier,

      stockPassable: stockClassification.passable,

      stockReason: stockClassification.reason,

      missingForStock: stockClassification.missing,

      stockCriticalIssues: stockClassification.criticalIssues,

      coreShellTier: coreShellClassification.tier,

      coreShellPassable: coreShellClassification.passable,

      coreShellReason: coreShellClassification.reason,

      missingForCoreShell: coreShellClassification.missing,

      coreShellCriticalIssues: coreShellClassification.criticalIssues,

      nonCriticalMissingShell,

      nonCriticalMissingStock,

      isCommonKnownVintage: isCommonKnownVintage(fields),

      isSinglePlyThinOrSteambentShell: isSinglePlyThinOrSteambentShell(fields),

      hasReRingData: hasReRingData(fields),

      reRingValueIndicatesNone: reRingValueIndicatesNone(fields),

      priorityScore: priorityScore(fields, stockClassification, coreShellClassification),

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

      primarySourceUrl: normalizeField(fields.primarySourceUrl),

      sourceConfidence: normalizeField(fields.sourceConfidence),

      productionStatus: normalizeField(fields.productionStatus),

      yearIntroduced: normalizeField(fields.yearIntroduced),

      yearDiscontinued: normalizeField(fields.yearDiscontinued),

      countryOfOrigin: normalizeField(fields.countryOfOrigin),

      modelNumber: normalizeField(fields.modelNumber),

    });

  });

  const report = buildReport(rows);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

  console.log('TOTAL RECORDS SCANNED');

  console.table([{ totalRecordsScanned: report.totalRecordsScanned }]);

  console.log('');

  console.log('STOCK READINESS TIER COUNTS');

  console.table([report.stockTierCounts]);

  console.log('');

  console.log('CORE SHELL READINESS TIER COUNTS');

  console.table([report.coreShellTierCounts]);

  console.log('');

  console.log('RE-RING AUDIT SUMMARY');

  console.table([report.reRingAuditSummary]);

  console.log('');

  console.log('TOP MISSING FIELDS BLOCKING STOCK PASS');

  console.table(report.topMissingFieldsBlockingStockPass.slice(0, 25));

  console.log('');

  console.log('TOP MISSING FIELDS BLOCKING CORE SHELL PASS');

  console.table(report.topMissingFieldsBlockingCoreShellPass.slice(0, 25));

  console.log('');

  console.log('TOP NON-CRITICAL MISSING STOCK FIELDS');

  console.table(report.topNonCriticalMissingStockFields.slice(0, 25));

  console.log('');

  console.log('TOP NON-CRITICAL MISSING SHELL FIELDS');

  console.table(report.topNonCriticalMissingShellFields.slice(0, 25));

  console.log('');

  console.log('TOP 25 PASSABLE STOCK');

  console.table(report.top25PassableStock);

  console.log('');

  console.log('TOP 25 NEARLY PASSABLE STOCK');

  console.table(report.top25NearlyPassableStock);

  console.log('');

  console.log('TOP 25 PASSABLE CORE SHELL');

  console.table(report.top25PassableCoreShell);

  console.log('');

  console.log('TOP 25 CORE SHELL BLOCKED');

  console.table(report.top25CoreShellBlocked);

  console.log('');

  console.log('COMMON / KNOWN / VINTAGE CURRENTLY AVAILABLE');

  console.table(report.commonKnownVintageCurrentlyAvailable.slice(0, 50));

  console.log('');

  console.log('COMMON / KNOWN / VINTAGE STILL BLOCKED FOR STOCK');

  console.table(report.commonKnownVintageStillBlockedForStock.slice(0, 50));

  console.log('');

  console.log('SINGLE-PLY / THIN / STEAM-BENT MISSING RE-RING PRESENCE');

  console.table(report.singlePlyThinSteambentMissingReRingPresence.slice(0, 50));

  console.log('');

  console.log('RE-RING DATA CAPTURED BUT MISSING NICE-TO-HAVE DETAILS');

  console.table(report.reRingDataCapturedButMissingNiceToHaveDetails.slice(0, 50));

  console.log('');

  console.log('MANUFACTURER BREAKDOWN BY READINESS TIER');

  console.table(report.manufacturerBreakdownByReadinessTier);

  console.log('');

  console.log('RECOMMENDED ENRICHMENT ORDER');

  console.dir(report.recommendedEnrichmentOrder, { depth: 6 });

  console.log('');

  console.log('MASTER REPORT-BACK TEXT');

  console.log(report.masterReportBackText);

  console.log('');

  console.log(`JSON report written to: ${OUTPUT_FILE}`);

  console.log('');

}

main().catch((error) => {

  console.error('');

  console.error('PHASE 3T stock + core shell readiness audit failed.');

  console.error(error);

  console.error('');

  process.exit(1);

});