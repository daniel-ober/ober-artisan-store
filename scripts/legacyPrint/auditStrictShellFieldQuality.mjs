// scripts/legacyPrint/auditStrictShellFieldQuality.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// STRICT SHELL FIELD QUALITY AUDIT

//

// READ-ONLY.

// Does NOT write Firestore patches.

// Does NOT rescore drums.

// Does NOT scrape new data.

// Does NOT change schema.

// Does NOT overwrite records.

//

// Purpose:

// Determine true core-shell readiness by validating whether shell thickness

// and bearing edge values are actually meaningful acoustic data.

//

// Critical correction:

// A bearingEdge object full of "unknown", "notVerified", or "low" placeholders

// does NOT count as meaningful bearing edge data.

//

// Existing node scores such as attack, brightness, projection, sustain,

// warmth, sensitivity, and control are ignored.

import admin from 'firebase-admin';

import fs from 'fs';

import path from 'path';

const COLLECTION_NAME = 'snareReferenceDrums';

const OUTPUT_DIR = path.resolve('tmp/legacyPrint-audits');

const OUTPUT_FILE = path.join(

  OUTPUT_DIR,

  `strict-shell-field-quality-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

);

const KNOWN_MEANINGFUL_EDGE_TERMS = [

  '45',

  '30',

  '60',

  'roundover',

  'round over',

  'rounded',

  'baseball bat',

  'double 45',

  'reverse 45',

  'inner 45',

  'outer 45',

  'sharp',

  'vintage',

  'modern',

  'full round',

  'full-round',

  'half round',

  'half-round',

  'sonor osm',

  'osm',

  'dual',

  'dual 45',

  'back cut',

  'back-cut',

  'bearing edge',

  'cut',

  'profile',

  'snare side',

  'batter side',

];

const BAD_PLACEHOLDER_TERMS = [

  'unknown',

  'not verified',

  'notverified',

  'unverified',

  'not specified',

  'unspecified',

  'n/a',

  'na',

  'null',

  'undefined',

  'tbd',

  'needs research',

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

  'kompressor',

  'craviotto',

  'brady',

  'noble',

  'cooley',

  'dunnett',

  'canopus',

  'ahead',

];

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

        v === 'unspecified' ||

        v === 'tbd'

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

      v !== 'unspecified' &&

      v !== 'tbd'

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

function sourceUrlsFrom(doc, sources) {

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

function selectBestBearingEdge(...values) {

  const candidates = values.filter(isPresent);

  if (candidates.length === 0) return null;

  const sourceConfirmed = candidates.find((value) => {

    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

    return toLowerString(value.evidenceLevel) === 'sourceconfirmed';

  });

  if (sourceConfirmed) return sourceConfirmed;

  const meaningfulObject = candidates.find((value) => {

    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

    return objectHasMeaningfulLeafValue(value);

  });

  if (meaningfulObject) return meaningfulObject;

  const meaningfulString = candidates.find((value) => {

    if (typeof value !== 'string') return false;

    return leafValueLooksMeaningfulEdge(value);

  });

  if (meaningfulString) return meaningfulString;

  return candidates[0] || null;

}

function getCanonicalFields(doc) {

  const shell = doc.shell || {};

  const stockHardware = doc.stockHardware || {};

  const stockSnareSystem = doc.stockSnareSystem || {};

  const sources = doc.sources || {};

  const summary = doc.summary || {};

  const collectorMetadata = doc.collectorMetadata || {};

  const sourceUrls = sourceUrlsFrom(doc, sources);

  return {

    id: doc.__id,

    fieldQualityTier: doc.fieldQualityTier,

    coreShellTier: doc.coreShellTier,

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

    bearingEdge: selectBestBearingEdge(

      doc.bearingEdge,

      doc.edgeProfile,

      doc['BEARING EDGE'],

      shell.bearingEdge,

      shell.bearingEdges,

      shell.edge,

      shell.edgeProfile,

      shell.bearingEdgeProfile

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

    rawShell: shell,

  };

}

function valueLooksPlaceholder(value) {

  const v = toLowerString(value);

  if (!v) return true;

  return BAD_PLACEHOLDER_TERMS.some((term) => v.includes(term));

}

function objectHasMeaningfulLeafValue(obj) {

  if (!obj || typeof obj !== 'object') return false;

  const ignoredKeys = new Set([

    'confidence',

    'evidencelevel',

    'evidenceLevel',

    'notes',

    'source',

    'sourceUrl',

    'sourceURL',

  ]);

  const stack = [obj];

  while (stack.length > 0) {

    const current = stack.pop();

    if (!current || typeof current !== 'object') continue;

    for (const [key, value] of Object.entries(current)) {

      if (ignoredKeys.has(key)) continue;

      if (value && typeof value === 'object' && !Array.isArray(value)) {

        stack.push(value);

        continue;

      }

      if (Array.isArray(value)) {

        for (const item of value) {

          if (item && typeof item === 'object') {

            stack.push(item);

          } else if (leafValueLooksMeaningfulEdge(item)) {

            return true;

          }

        }

        continue;

      }

      if (leafValueLooksMeaningfulEdge(value)) {

        return true;

      }

    }

  }

  return false;

}

function leafValueLooksMeaningfulEdge(value) {

  if (!isPresent(value)) return false;

  const v = toLowerString(value);

  if (!v || valueLooksPlaceholder(v)) return false;

  if (v === 'low' || v === 'medium' || v === 'high') return false;

  if (v === 'true' || v === 'false') return false;

  return KNOWN_MEANINGFUL_EDGE_TERMS.some((term) => v.includes(term));

}

function bearingEdgeQuality(fields) {

  const raw = fields.bearingEdge;

  if (!isPresent(raw)) {

    return {

      hasAnyBearingEdgeField: false,

      hasMeaningfulBearingEdge: false,

      bearingEdgeQualityTier: 'MISSING_BEARING_EDGE',

      reason: 'bearing edge field missing',

    };

  }

  if (typeof raw === 'string') {

    if (leafValueLooksMeaningfulEdge(raw)) {

      return {

        hasAnyBearingEdgeField: true,

        hasMeaningfulBearingEdge: true,

        bearingEdgeQualityTier: 'MEANINGFUL_BEARING_EDGE',

        reason: 'bearing edge string contains meaningful edge/profile detail',

      };

    }

    return {

      hasAnyBearingEdgeField: true,

      hasMeaningfulBearingEdge: false,

      bearingEdgeQualityTier: 'PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE',

      reason: `bearing edge string is placeholder/unknown: ${normalizeField(raw)}`,

    };

  }

  if (Array.isArray(raw)) {

    const hasMeaningful = raw.some((item) => {

      if (item && typeof item === 'object') return objectHasMeaningfulLeafValue(item);

      return leafValueLooksMeaningfulEdge(item);

    });

    return {

      hasAnyBearingEdgeField: true,

      hasMeaningfulBearingEdge: hasMeaningful,

      bearingEdgeQualityTier: hasMeaningful

        ? 'MEANINGFUL_BEARING_EDGE'

        : 'PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE',

      reason: hasMeaningful

        ? 'bearing edge array contains meaningful edge/profile detail'

        : 'bearing edge array contains no meaningful edge/profile values',

    };

  }

  if (typeof raw === 'object') {

    const hasMeaningful = objectHasMeaningfulLeafValue(raw);

    return {

      hasAnyBearingEdgeField: true,

      hasMeaningfulBearingEdge: hasMeaningful,

      bearingEdgeQualityTier: hasMeaningful

        ? 'MEANINGFUL_BEARING_EDGE'

        : 'PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE',

      reason: hasMeaningful

        ? 'bearing edge object contains meaningful edge/profile detail'

        : 'bearing edge object is present but contains only placeholder/unknown values',

    };

  }

  return {

    hasAnyBearingEdgeField: true,

    hasMeaningfulBearingEdge: false,

    bearingEdgeQualityTier: 'PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE',

    reason: 'bearing edge field exists but is not interpretable as meaningful acoustic data',

  };

}

function shellThicknessQuality(fields) {

  const raw = fields.shellThickness;

  const thickness = numeric(raw);

  if (!isPresent(raw)) {

    return {

      hasShellThicknessValue: false,

      hasValidNumericShellThickness: false,

      shellThicknessQualityTier: 'MISSING_SHELL_THICKNESS',

      reason: 'shell thickness field missing',

    };

  }

  if (!Number.isFinite(thickness)) {

    return {

      hasShellThicknessValue: true,

      hasValidNumericShellThickness: false,

      shellThicknessQualityTier: 'NON_NUMERIC_SHELL_THICKNESS',

      reason: `shell thickness present but non-numeric: ${normalizeField(raw)}`,

    };

  }

  if (thickness <= 0 || thickness > 50) {

    return {

      hasShellThicknessValue: true,

      hasValidNumericShellThickness: false,

      shellThicknessQualityTier: 'OUT_OF_RANGE_SHELL_THICKNESS',

      reason: `shell thickness out of expected range: ${normalizeField(raw)}`,

    };

  }

  return {

    hasShellThicknessValue: true,

    hasValidNumericShellThickness: true,

    shellThicknessQualityTier: 'VALID_NUMERIC_SHELL_THICKNESS',

    reason: `valid numeric shell thickness: ${thickness}`,

  };

}

function sourceQuality(fields) {

  const hasSourceUrl = isPresent(fields.primarySourceUrl);

  const hasSourceConfidence = isPresent(fields.sourceConfidence);

  return {

    hasSourceUrl,

    hasSourceConfidence,

    sourceQualityTier:

      hasSourceUrl && hasSourceConfidence

        ? 'SOURCE_PRESENT'

        : hasSourceUrl

          ? 'SOURCE_URL_PRESENT_CONFIDENCE_MISSING'

          : hasSourceConfidence

            ? 'SOURCE_CONFIDENCE_PRESENT_URL_MISSING'

            : 'SOURCE_MISSING',

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

function hasReRingPresenceData(fields) {

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

function findCriticalNumericIssues(fields) {

  const issues = [];

  const dia = numeric(fields.diameter);

  const dep = numeric(fields.depth);

  const thickness = numeric(fields.shellThickness);

  if (!Number.isFinite(dia)) issues.push('diameter missing or non-numeric');

  if (!Number.isFinite(dep)) issues.push('depth missing or non-numeric');

  if (Number.isFinite(dia) && (dia < 6 || dia > 20)) {

    issues.push(`diameter out of expected snare range: ${normalizeField(fields.diameter)}`);

  }

  if (Number.isFinite(dep) && (dep < 2 || dep > 12)) {

    issues.push(`depth out of expected snare range: ${normalizeField(fields.depth)}`);

  }

  if (isPresent(fields.shellThickness) && !Number.isFinite(thickness)) {

    issues.push(`shell thickness present but non-numeric: ${normalizeField(fields.shellThickness)}`);

  }

  if (Number.isFinite(thickness) && (thickness <= 0 || thickness > 50)) {

    issues.push(`shell thickness out of expected range: ${normalizeField(fields.shellThickness)}`);

  }

  if (isTrueish(fields.criticalNumericIssue)) {

    issues.push('record has criticalNumericIssue flag');

  }

  return issues;

}

function findMissingCoreShellStrictFieldQuality(fields, thicknessCheck, edgeCheck, sourceCheck) {

  const missing = [];

  if (!isPresent(fields.companyName)) missing.push('companyName');

  if (!isPresent(fields.modelName)) missing.push('modelName');

  if (!Number.isFinite(numeric(fields.diameter))) missing.push('diameter');

  if (!Number.isFinite(numeric(fields.depth))) missing.push('depth');

  if (!isPresent(fields.shellMaterial)) missing.push('shell material');

  if (!isPresent(fields.shellConstruction)) missing.push('shell construction');

  if (!thicknessCheck.hasValidNumericShellThickness) {

    missing.push('valid numeric shell thickness');

  }

  if (!edgeCheck.hasMeaningfulBearingEdge) {

    missing.push('meaningful bearing edge shape/detail');

  }

  if (!sourceCheck.hasSourceUrl) missing.push('primary source URL');

  if (!sourceCheck.hasSourceConfidence) missing.push('source confidence');

  if (isSinglePlyThinOrSteambentShell(fields) && !hasReRingPresenceData(fields)) {

    missing.push('re-ring presence/absence for single-ply/thin/steam-bent shell');

  }

  return missing;

}

function findMissingStockStrictFieldQuality(fields, coreMissing) {

  const missing = [...coreMissing];

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

function classifyShellFieldQuality(fields, thicknessCheck, edgeCheck, sourceCheck, criticalIssues) {

  const hasCoreIdentity =

    isPresent(fields.companyName) &&

    isPresent(fields.modelName) &&

    Number.isFinite(numeric(fields.diameter)) &&

    Number.isFinite(numeric(fields.depth)) &&

    isPresent(fields.shellMaterial) &&

    isPresent(fields.shellConstruction);

  const hasMetalEdgeFallback =

    fields.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK' ||

    fields.coreShellTier === 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK' ||

    fields.engineAssumptions?.bearingEdgeFallbackApplied === true;

  if (criticalIssues.length > 0 || isTrueish(fields.duplicateConflict)) {

    return {

      fieldQualityTier: 'SHELL_FIELD_NOT_READY',

      coreShellPassable: false,

      reason: criticalIssues.length

        ? criticalIssues.join('; ')

        : 'unresolved duplicate conflict or critical issue flag',

    };

  }

  if (

    hasCoreIdentity &&

    hasMetalEdgeFallback &&

    thicknessCheck.hasValidNumericShellThickness &&

    sourceCheck.hasSourceUrl &&

    sourceCheck.hasSourceConfidence

  ) {

    return {

      fieldQualityTier: 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK',

      coreShellPassable: true,

      reason: 'has identity, size, material, construction, valid numeric thickness, source URL, source confidence, and auditable metal-shell bearing-edge fallback',

    };

  }

  if (

    hasCoreIdentity &&

    thicknessCheck.hasValidNumericShellThickness &&

    edgeCheck.hasMeaningfulBearingEdge &&

    sourceCheck.hasSourceUrl &&

    sourceCheck.hasSourceConfidence

  ) {

    return {

      fieldQualityTier: 'MEANINGFUL_CORE_SHELL_PASS',

      coreShellPassable: true,

      reason: 'has identity, size, material, construction, valid numeric thickness, meaningful bearing edge, source URL, and source confidence',

    };

  }

  if (

    hasCoreIdentity &&

    thicknessCheck.hasValidNumericShellThickness &&

    !edgeCheck.hasMeaningfulBearingEdge

  ) {

    return {

      fieldQualityTier: 'HAS_THICKNESS_BUT_EDGE_UNKNOWN',

      coreShellPassable: false,

      reason: 'has valid shell thickness but bearing edge is missing or placeholder/unknown',

    };

  }

  if (

    hasCoreIdentity &&

    !thicknessCheck.hasValidNumericShellThickness &&

    edgeCheck.hasMeaningfulBearingEdge

  ) {

    return {

      fieldQualityTier: 'HAS_EDGE_BUT_THICKNESS_MISSING',

      coreShellPassable: false,

      reason: 'has meaningful bearing edge but shell thickness is missing, non-numeric, or out of range',

    };

  }

  if (

    hasCoreIdentity &&

    !thicknessCheck.hasValidNumericShellThickness &&

    !edgeCheck.hasMeaningfulBearingEdge

  ) {

    return {

      fieldQualityTier: 'MISSING_THICKNESS_AND_EDGE',

      coreShellPassable: false,

      reason: 'has basic shell identity but lacks valid shell thickness and meaningful bearing edge detail',

    };

  }

  return {

    fieldQualityTier: 'SHELL_IDENTITY_INCOMPLETE',

    coreShellPassable: false,

    reason: 'missing basic identity, size, material, or construction fields',

  };

}

function classifyStockFromFieldQuality(fields, corePassable, stockMissing) {

  if (!corePassable) {

    return {

      stockTier: 'STOCK_BLOCKED_BY_CORE_SHELL',

      stockPassable: false,

      reason: 'stock cannot pass because core shell field quality does not pass',

    };

  }

  if (stockMissing.length === 0) {

    return {

      stockTier: 'MEANINGFUL_STOCK_PASS',

      stockPassable: true,

      reason: 'core shell passes and required stock fields are present',

    };

  }

  const stockOnlyMissing = stockMissing.filter(

    (field) =>

      ![

        'companyName',

        'modelName',

        'diameter',

        'depth',

        'shell material',

        'shell construction',

        'valid numeric shell thickness',

        'meaningful bearing edge shape/detail',

        'primary source URL',

        'source confidence',

        're-ring presence/absence for single-ply/thin/steam-bent shell',

      ].includes(field)

  );

  if (

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

    )

  ) {

    return {

      stockTier: 'NEARLY_MEANINGFUL_STOCK_PASS',

      stockPassable: false,

      reason: `core shell passes; missing stock fields: ${stockOnlyMissing.join(', ')}`,

    };

  }

  return {

    stockTier: 'STOCK_NEEDS_RESEARCH',

    stockPassable: false,

    reason: `stock missing required fields: ${stockMissing.join(', ')}`,

  };

}

function isCommonKnownVintage(fields) {

  const haystack = `${fields.companyName || ''} ${fields.lineSeries || ''} ${fields.modelName || ''}`.toLowerCase();

  return COMMON_KNOWN_VINTAGE_TERMS.some((term) => haystack.includes(term));

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

function countArrayField(rows, key) {

  const counts = {};

  for (const row of rows) {

    const values = Array.isArray(row[key]) ? row[key] : [];

    for (const value of values) {

      increment(counts, value);

    }

  }

  return Object.entries(counts)

    .sort((a, b) => b[1] - a[1])

    .map(([field, count]) => ({ field, count }));

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

  if (row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS') score += 500;

  if (row.fieldQualityTier === 'HAS_THICKNESS_BUT_EDGE_UNKNOWN') score += 300;

  if (row.fieldQualityTier === 'HAS_EDGE_BUT_THICKNESS_MISSING') score += 240;

  if (row.stockTier === 'MEANINGFUL_STOCK_PASS') score += 500;

  if (row.stockTier === 'NEARLY_MEANINGFUL_STOCK_PASS') score += 300;

  if (row.sourceConfidence === 'High') score += 100;

  if (row.sourceConfidence === 'Medium') score += 50;

  score -= (row.missingForCoreShell || []).length * 35;

  score -= (row.missingForStock || []).length * 10;

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

    fieldQualityTier: row.fieldQualityTier,

    stockTier: row.stockTier,

    missingForCoreShell: row.missingForCoreShell,

    missingForStock: row.missingForStock,

    shellMaterial: row.shellMaterial,

    shellConstruction: row.shellConstruction,

    shellThickness: row.shellThickness,

    shellThicknessQualityTier: row.shellThicknessQualityTier,

    shellThicknessQualityReason: row.shellThicknessQualityReason,

    shellThicknessConfidence: row.shellThicknessConfidence,

    bearingEdge: row.bearingEdge,

    bearingEdgeQualityTier: row.bearingEdgeQualityTier,

    bearingEdgeQualityReason: row.bearingEdgeQualityReason,

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

    reason: row.fieldQualityReason,

  };

}

function buildManufacturerBreakdown(rows) {

  const breakdown = {};

  for (const row of rows) {

    const company = row.companyName || 'UNKNOWN_COMPANY';

    if (!breakdown[company]) {

      breakdown[company] = {

        total: 0,

        MEANINGFUL_CORE_SHELL_PASS: 0,

        HAS_THICKNESS_BUT_EDGE_UNKNOWN: 0,

        HAS_EDGE_BUT_THICKNESS_MISSING: 0,

        MISSING_THICKNESS_AND_EDGE: 0,

        SHELL_IDENTITY_INCOMPLETE: 0,

        SHELL_FIELD_NOT_READY: 0,

        MEANINGFUL_STOCK_PASS: 0,

        NEARLY_MEANINGFUL_STOCK_PASS: 0,

        STOCK_BLOCKED_BY_CORE_SHELL: 0,

        STOCK_NEEDS_RESEARCH: 0,

      };

    }

    breakdown[company].total += 1;

    breakdown[company][row.fieldQualityTier] += 1;

    breakdown[company][row.stockTier] += 1;

  }

  return Object.entries(breakdown)

    .sort((a, b) => b[1].total - a[1].total)

    .map(([companyName, counts]) => ({

      companyName,

      ...counts,

    }));

}

function buildReport(rows) {

  const fieldQualityCounts = {};

  const stockTierCounts = {};

  const shellThicknessQualityCounts = {};

  const bearingEdgeQualityCounts = {};

  const sourceQualityCounts = {};

  const reRingCounts = {

    singlePlyThinOrSteambentShells: 0,

    singlePlyThinOrSteambentMissingReRingPresence: 0,

    reRingPresenceCaptured: 0,

    reRingDetailNiceToHaveMissing: 0,

  };

  for (const row of rows) {

    increment(fieldQualityCounts, row.fieldQualityTier);

    increment(stockTierCounts, row.stockTier);

    increment(shellThicknessQualityCounts, row.shellThicknessQualityTier);

    increment(bearingEdgeQualityCounts, row.bearingEdgeQualityTier);

    increment(sourceQualityCounts, row.sourceQualityTier);

    if (row.isSinglePlyThinOrSteambentShell) {

      reRingCounts.singlePlyThinOrSteambentShells += 1;

    }

    if (

      row.isSinglePlyThinOrSteambentShell &&

      row.missingForCoreShell.includes('re-ring presence/absence for single-ply/thin/steam-bent shell')

    ) {

      reRingCounts.singlePlyThinOrSteambentMissingReRingPresence += 1;

    }

    if (row.hasReRingPresenceData) {

      reRingCounts.reRingPresenceCaptured += 1;

    }

    if (

      row.hasReRingPresenceData &&

      row.nonCriticalMissingShell.some((field) => String(field).startsWith('re-ring '))

    ) {

      reRingCounts.reRingDetailNiceToHaveMissing += 1;

    }

  }

  const sortedRows = [...rows].sort((a, b) => b.priorityScore - a.priorityScore);

  const meaningfulCorePass = sortedRows.filter(

    (row) => row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS'

  );

  const hasThicknessButEdgeUnknown = sortedRows.filter(

    (row) => row.fieldQualityTier === 'HAS_THICKNESS_BUT_EDGE_UNKNOWN'

  );

  const hasEdgeButThicknessMissing = sortedRows.filter(

    (row) => row.fieldQualityTier === 'HAS_EDGE_BUT_THICKNESS_MISSING'

  );

  const missingThicknessAndEdge = sortedRows.filter(

    (row) => row.fieldQualityTier === 'MISSING_THICKNESS_AND_EDGE'

  );

  const meaningfulStockPass = sortedRows.filter(

    (row) => row.stockTier === 'MEANINGFUL_STOCK_PASS'

  );

  const nearlyMeaningfulStockPass = sortedRows.filter(

    (row) => row.stockTier === 'NEARLY_MEANINGFUL_STOCK_PASS'

  );

  const commonKnownVintageAvailable = sortedRows.filter(

    (row) => row.isCommonKnownVintage && row.fieldQualityTier === 'MEANINGFUL_CORE_SHELL_PASS'

  );

  const commonKnownVintageBlocked = sortedRows.filter(

    (row) => row.isCommonKnownVintage && row.fieldQualityTier !== 'MEANINGFUL_CORE_SHELL_PASS'

  );

  const placeholderEdgeRows = sortedRows.filter(

    (row) => row.bearingEdgeQualityTier === 'PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE'

  );

  const missingEdgeRows = sortedRows.filter(

    (row) => row.bearingEdgeQualityTier === 'MISSING_BEARING_EDGE'

  );

  const missingThicknessRows = sortedRows.filter(

    (row) => row.shellThicknessQualityTier === 'MISSING_SHELL_THICKNESS'

  );

  const topMissingCore = countArrayField(rows, 'missingForCoreShell');

  const topMissingStock = countArrayField(rows, 'missingForStock');

  const topNonCriticalShell = countArrayField(rows, 'nonCriticalMissingShell');

  const topNonCriticalStock = countArrayField(rows, 'nonCriticalMissingStock');

  return {

    auditName: 'OBER LEGACYPRINT™ STRICT SHELL FIELD QUALITY AUDIT',

    mode: 'READ_ONLY',

    collectionName: COLLECTION_NAME,

    generatedAt: new Date().toISOString(),

    totalRecordsScanned: rows.length,

    strictDefinition: {

      meaningfulCoreShellPass:

        'Requires identity, size, shell material, shell construction, valid numeric shell thickness, meaningful bearing edge shape/detail, primary source URL, and source confidence. Placeholder edge objects with unknown/notVerified values do not pass.',

      meaningfulCoreShellPassWithMetalEdgeFallback:

        'Metal-shell exception only: requires identity, size, shell material/construction, valid numeric shell thickness, source URL, source confidence, and auditable engineAssumptions.bearingEdgeFallbackApplied metadata. This is counted separately from source-confirmed bearing-edge passes.',

      meaningfulStockPass:

        'Requires meaningful core shell pass plus hoop type, stock batter head, stock reso head, stock snare wires, and production status.',

    },

    fieldQualityCounts: {

      MEANINGFUL_CORE_SHELL_PASS: fieldQualityCounts.MEANINGFUL_CORE_SHELL_PASS || 0,

      MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK: fieldQualityCounts.MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK || 0,

      TOTAL_MEANINGFUL_CORE_SHELL_USABLE:

        (fieldQualityCounts.MEANINGFUL_CORE_SHELL_PASS || 0) +

        (fieldQualityCounts.MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK || 0),

      HAS_THICKNESS_BUT_EDGE_UNKNOWN: fieldQualityCounts.HAS_THICKNESS_BUT_EDGE_UNKNOWN || 0,

      HAS_EDGE_BUT_THICKNESS_MISSING: fieldQualityCounts.HAS_EDGE_BUT_THICKNESS_MISSING || 0,

      MISSING_THICKNESS_AND_EDGE: fieldQualityCounts.MISSING_THICKNESS_AND_EDGE || 0,

      SHELL_IDENTITY_INCOMPLETE: fieldQualityCounts.SHELL_IDENTITY_INCOMPLETE || 0,

      SHELL_FIELD_NOT_READY: fieldQualityCounts.SHELL_FIELD_NOT_READY || 0,

    },

    stockTierCounts: {

      MEANINGFUL_STOCK_PASS: stockTierCounts.MEANINGFUL_STOCK_PASS || 0,

      NEARLY_MEANINGFUL_STOCK_PASS: stockTierCounts.NEARLY_MEANINGFUL_STOCK_PASS || 0,

      STOCK_BLOCKED_BY_CORE_SHELL: stockTierCounts.STOCK_BLOCKED_BY_CORE_SHELL || 0,

      STOCK_NEEDS_RESEARCH: stockTierCounts.STOCK_NEEDS_RESEARCH || 0,

    },

    shellThicknessQualityCounts: {

      VALID_NUMERIC_SHELL_THICKNESS: shellThicknessQualityCounts.VALID_NUMERIC_SHELL_THICKNESS || 0,

      MISSING_SHELL_THICKNESS: shellThicknessQualityCounts.MISSING_SHELL_THICKNESS || 0,

      NON_NUMERIC_SHELL_THICKNESS: shellThicknessQualityCounts.NON_NUMERIC_SHELL_THICKNESS || 0,

      OUT_OF_RANGE_SHELL_THICKNESS: shellThicknessQualityCounts.OUT_OF_RANGE_SHELL_THICKNESS || 0,

    },

    bearingEdgeQualityCounts: {

      MEANINGFUL_BEARING_EDGE: bearingEdgeQualityCounts.MEANINGFUL_BEARING_EDGE || 0,

      PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE:

        bearingEdgeQualityCounts.PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE || 0,

      MISSING_BEARING_EDGE: bearingEdgeQualityCounts.MISSING_BEARING_EDGE || 0,

    },

    sourceQualityCounts: {

      SOURCE_PRESENT: sourceQualityCounts.SOURCE_PRESENT || 0,

      SOURCE_URL_PRESENT_CONFIDENCE_MISSING:

        sourceQualityCounts.SOURCE_URL_PRESENT_CONFIDENCE_MISSING || 0,

      SOURCE_CONFIDENCE_PRESENT_URL_MISSING:

        sourceQualityCounts.SOURCE_CONFIDENCE_PRESENT_URL_MISSING || 0,

      SOURCE_MISSING: sourceQualityCounts.SOURCE_MISSING || 0,

    },

    reRingAuditSummary: reRingCounts,

    topMissingFieldsBlockingMeaningfulCoreShellPass: topMissingCore,

    topMissingFieldsBlockingMeaningfulStockPass: topMissingStock,

    topNonCriticalMissingShellFields: topNonCriticalShell,

    topNonCriticalMissingStockFields: topNonCriticalStock,

    top25MeaningfulCoreShellPass: meaningfulCorePass.slice(0, 25).map(compactRow),

    top25HasThicknessButEdgeUnknown: hasThicknessButEdgeUnknown.slice(0, 25).map(compactRow),

    top25HasEdgeButThicknessMissing: hasEdgeButThicknessMissing.slice(0, 25).map(compactRow),

    top25MissingThicknessAndEdge: missingThicknessAndEdge.slice(0, 25).map(compactRow),

    top25MeaningfulStockPass: meaningfulStockPass.slice(0, 25).map(compactRow),

    top25NearlyMeaningfulStockPass: nearlyMeaningfulStockPass.slice(0, 25).map(compactRow),

    top50PlaceholderOrUnknownBearingEdge: placeholderEdgeRows.slice(0, 50).map(compactRow),

    top50MissingBearingEdge: missingEdgeRows.slice(0, 50).map(compactRow),

    top50MissingShellThickness: missingThicknessRows.slice(0, 50).map(compactRow),

    commonKnownVintageMeaningfulCoreAvailable: commonKnownVintageAvailable.slice(0, 100).map(compactRow),

    commonKnownVintageBlockedFromMeaningfulCore: commonKnownVintageBlocked.slice(0, 100).map(compactRow),

    manufacturerBreakdownByShellFieldQuality: buildManufacturerBreakdown(rows),

    recommendedEnrichmentOrder: {

      phase1: {

        name: 'Fix placeholder/unknown bearing edges where thickness already exists',

        why: 'These are closest to meaningful core shell pass because thickness is already present.',

        count: hasThicknessButEdgeUnknown.length,

        records: hasThicknessButEdgeUnknown.slice(0, 25).map(compactRow),

      },

      phase2: {

        name: 'Add shell thickness where meaningful edge exists',

        count: hasEdgeButThicknessMissing.length,

        records: hasEdgeButThicknessMissing.slice(0, 25).map(compactRow),

      },

      phase3: {

        name: 'Resolve records missing both shell thickness and meaningful edge',

        count: missingThicknessAndEdge.length,

        records: missingThicknessAndEdge.slice(0, 25).map(compactRow),

      },

      phase4: {

        name: 'Promote meaningful core shell records to stock where possible',

        fields: topMissingStock.slice(0, 12),

        records: nearlyMeaningfulStockPass.slice(0, 25).map(compactRow),

      },

      phase5: {

        name: 'Backfill non-critical enrichment fields',

        shellFields: topNonCriticalShell.slice(0, 12),

        stockFields: topNonCriticalStock.slice(0, 12),

      },

    },

    masterReportBackText: buildMasterReportBackText(

      rows.length,

      fieldQualityCounts,

      stockTierCounts,

      shellThicknessQualityCounts,

      bearingEdgeQualityCounts,

      sourceQualityCounts,

      topMissingCore,

      topMissingStock

    ),

    allRows: sortedRows,

  };

}

function buildMasterReportBackText(

  total,

  fieldQualityCounts,

  stockTierCounts,

  shellThicknessQualityCounts,

  bearingEdgeQualityCounts,

  sourceQualityCounts,

  topMissingCore,

  topMissingStock

) {

  const corePass = fieldQualityCounts.MEANINGFUL_CORE_SHELL_PASS || 0;

  const metalEdgeFallbackPass = fieldQualityCounts.MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK || 0;

  const totalCoreUsable = corePass + metalEdgeFallbackPass;

  const thicknessButEdgeUnknown = fieldQualityCounts.HAS_THICKNESS_BUT_EDGE_UNKNOWN || 0;

  const edgeButThicknessMissing = fieldQualityCounts.HAS_EDGE_BUT_THICKNESS_MISSING || 0;

  const missingBoth = fieldQualityCounts.MISSING_THICKNESS_AND_EDGE || 0;

  const identityIncomplete = fieldQualityCounts.SHELL_IDENTITY_INCOMPLETE || 0;

  const stockPass = stockTierCounts.MEANINGFUL_STOCK_PASS || 0;

  const nearlyStock = stockTierCounts.NEARLY_MEANINGFUL_STOCK_PASS || 0;

  const stockBlockedByCore = stockTierCounts.STOCK_BLOCKED_BY_CORE_SHELL || 0;

  const validThickness = shellThicknessQualityCounts.VALID_NUMERIC_SHELL_THICKNESS || 0;

  const meaningfulEdge = bearingEdgeQualityCounts.MEANINGFUL_BEARING_EDGE || 0;

  const placeholderEdge = bearingEdgeQualityCounts.PLACEHOLDER_OR_UNKNOWN_BEARING_EDGE || 0;

  const missingEdge = bearingEdgeQualityCounts.MISSING_BEARING_EDGE || 0;

  const coreBlockers = topMissingCore

    .slice(0, 5)

    .map((item) => `${item.field} (${item.count})`)

    .join(', ');

  const stockBlockers = topMissingStock

    .slice(0, 5)

    .map((item) => `${item.field} (${item.count})`)

    .join(', ');

  return [

    `Strict shell field quality audit complete.`,

    `Read-only scan of ${total} snareReferenceDrums records.`,

    `Source-confirmed meaningful core shell pass count is ${corePass}.`,

    `Metal-edge fallback core shell pass count is ${metalEdgeFallbackPass}.`,

    `Total meaningful core-shell usable records: ${totalCoreUsable}.`,

    `Closest core-shell candidates: ${thicknessButEdgeUnknown} have valid thickness but unknown/placeholder bearing edge; ${edgeButThicknessMissing} have meaningful edge but missing/invalid thickness; ${missingBoth} are missing both thickness and meaningful edge; ${identityIncomplete} have incomplete shell identity.`,

    `Stock quality counts: MEANINGFUL_STOCK_PASS ${stockPass}, NEARLY_MEANINGFUL_STOCK_PASS ${nearlyStock}, STOCK_BLOCKED_BY_CORE_SHELL ${stockBlockedByCore}.`,

    `Field quality counts: valid numeric shell thickness ${validThickness}; meaningful bearing edge ${meaningfulEdge}; placeholder/unknown bearing edge ${placeholderEdge}; missing bearing edge ${missingEdge}.`,

    `Source quality: ${sourceQualityCounts.SOURCE_PRESENT || 0} records have source URL and confidence.`,

    `Top meaningful core blockers: ${coreBlockers || 'none detected'}.`,

    `Top meaningful stock blockers: ${stockBlockers || 'none detected'}.`,

    `Recommended next step: continue resolving the remaining placeholder/unknown bearing edge records where shell thickness already exists, then add thickness for records with meaningful edge, then resolve records missing both fields before stock-head cleanup.`,

  ].join(' ');

}

async function main() {

  initFirebaseAdmin();

  const db = admin.firestore();

  console.log('');

  console.log('OBER LEGACYPRINT™ STRICT SHELL FIELD QUALITY AUDIT');

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

    const thicknessCheck = shellThicknessQuality(fields);

    const edgeCheck = bearingEdgeQuality(fields);

    const sourceCheck = sourceQuality(fields);

    const criticalIssues = findCriticalNumericIssues(fields);

    const shellFieldClassification = classifyShellFieldQuality(

      fields,

      thicknessCheck,

      edgeCheck,

      sourceCheck,

      criticalIssues

    );

    const missingForCoreShell = findMissingCoreShellStrictFieldQuality(

      fields,

      thicknessCheck,

      edgeCheck,

      sourceCheck

    );

    const missingForStock = findMissingStockStrictFieldQuality(

      fields,

      missingForCoreShell

    );

    const stockClassification = classifyStockFromFieldQuality(

      fields,

      shellFieldClassification.coreShellPassable,

      missingForStock

    );

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

      fieldQualityTier: shellFieldClassification.fieldQualityTier,

      coreShellPassable: shellFieldClassification.coreShellPassable,

      fieldQualityReason: shellFieldClassification.reason,

      stockTier: stockClassification.stockTier,

      stockPassable: stockClassification.stockPassable,

      stockReason: stockClassification.reason,

      missingForCoreShell,

      missingForStock,

      shellThicknessQualityTier: thicknessCheck.shellThicknessQualityTier,

      shellThicknessQualityReason: thicknessCheck.reason,

      hasShellThicknessValue: thicknessCheck.hasShellThicknessValue,

      hasValidNumericShellThickness: thicknessCheck.hasValidNumericShellThickness,

      bearingEdgeQualityTier: edgeCheck.bearingEdgeQualityTier,

      bearingEdgeQualityReason: edgeCheck.reason,

      hasAnyBearingEdgeField: edgeCheck.hasAnyBearingEdgeField,

      hasMeaningfulBearingEdge: edgeCheck.hasMeaningfulBearingEdge,

      sourceQualityTier: sourceCheck.sourceQualityTier,

      hasSourceUrl: sourceCheck.hasSourceUrl,

      hasSourceConfidence: sourceCheck.hasSourceConfidence,

      isCommonKnownVintage: isCommonKnownVintage(fields),

      isSinglePlyThinOrSteambentShell: isSinglePlyThinOrSteambentShell(fields),

      hasReRingPresenceData: hasReRingPresenceData(fields),

      reRingValueIndicatesNone: reRingValueIndicatesNone(fields),

      nonCriticalMissingShell: findNonCriticalShellMissing(fields),

      nonCriticalMissingStock: findNonCriticalStockMissing(fields),

      criticalIssues,

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

  console.log('SHELL FIELD QUALITY COUNTS');

  console.table([report.fieldQualityCounts]);

  console.log('');

  console.log('STOCK FIELD QUALITY COUNTS');

  console.table([report.stockTierCounts]);

  console.log('');

  console.log('SHELL THICKNESS QUALITY COUNTS');

  console.table([report.shellThicknessQualityCounts]);

  console.log('');

  console.log('BEARING EDGE QUALITY COUNTS');

  console.table([report.bearingEdgeQualityCounts]);

  console.log('');

  console.log('SOURCE QUALITY COUNTS');

  console.table([report.sourceQualityCounts]);

  console.log('');

  console.log('RE-RING AUDIT SUMMARY');

  console.table([report.reRingAuditSummary]);

  console.log('');

  console.log('TOP MISSING FIELDS BLOCKING MEANINGFUL CORE SHELL PASS');

  console.table(report.topMissingFieldsBlockingMeaningfulCoreShellPass.slice(0, 25));

  console.log('');

  console.log('TOP MISSING FIELDS BLOCKING MEANINGFUL STOCK PASS');

  console.table(report.topMissingFieldsBlockingMeaningfulStockPass.slice(0, 25));

  console.log('');

  console.log('TOP 25 MEANINGFUL CORE SHELL PASS');

  console.table(report.top25MeaningfulCoreShellPass);

  console.log('');

  console.log('TOP 25 HAS THICKNESS BUT EDGE UNKNOWN');

  console.table(report.top25HasThicknessButEdgeUnknown);

  console.log('');

  console.log('TOP 25 HAS EDGE BUT THICKNESS MISSING');

  console.table(report.top25HasEdgeButThicknessMissing);

  console.log('');

  console.log('TOP 25 MISSING THICKNESS AND EDGE');

  console.table(report.top25MissingThicknessAndEdge);

  console.log('');

  console.log('TOP 25 MEANINGFUL STOCK PASS');

  console.table(report.top25MeaningfulStockPass);

  console.log('');

  console.log('TOP 25 NEARLY MEANINGFUL STOCK PASS');

  console.table(report.top25NearlyMeaningfulStockPass);

  console.log('');

  console.log('TOP 50 PLACEHOLDER OR UNKNOWN BEARING EDGE');

  console.table(report.top50PlaceholderOrUnknownBearingEdge);

  console.log('');

  console.log('MANUFACTURER BREAKDOWN BY SHELL FIELD QUALITY');

  console.table(report.manufacturerBreakdownByShellFieldQuality);

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

  console.error('Strict shell field quality audit failed.');

  console.error(error);

  console.error('');

  process.exit(1);

});