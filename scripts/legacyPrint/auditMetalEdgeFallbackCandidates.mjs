// scripts/legacyPrint/auditMetalEdgeFallbackCandidates.mjs

//

// OBER LEGACYPRINT™ DATA + RESEARCH

// METAL EDGE FALLBACK CANDIDATE AUDIT

//

// READ-ONLY.

// Does NOT write Firestore.

// Does NOT rescore drums.

// Does NOT promote readiness.

//

// Purpose:

// Identify records that have valid numeric shell thickness but unknown/placeholder

// bearing edge data, then split true metal-shell fallback candidates from records

// that must remain blocked.

import admin from 'firebase-admin';

import fs from 'fs';

import path from 'path';

const COLLECTION_NAME = 'snareReferenceDrums';

const OUTPUT_DIR = path.resolve('tmp/legacyPrint-audits');

const OUTPUT_FILE = path.join(

  OUTPUT_DIR,

  `metal-edge-fallback-candidates-${new Date().toISOString().replace(/[:.]/g, '-')}.json`

);

const SERVICE_ACCOUNT_ARG_PREFIX = '--serviceAccount=';

function getServiceAccountPath() {

  const arg = process.argv.find((value) => value.startsWith(SERVICE_ACCOUNT_ARG_PREFIX));

  return arg ? arg.slice(SERVICE_ACCOUNT_ARG_PREFIX.length) : process.env.GOOGLE_APPLICATION_CREDENTIALS;

}

function readJson(filePath) {

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function initFirebaseAdmin() {

  const serviceAccountPath = getServiceAccountPath();

  if (!serviceAccountPath) {

    throw new Error('Missing service account. Use --serviceAccount=backend/serviceAccountKey-prod.json');

  }

  const absolutePath = path.resolve(serviceAccountPath);

  const serviceAccount = readJson(absolutePath);

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {

    throw new Error(`Invalid service account file: ${absolutePath}`);

  }

  if (!admin.apps.length) {

    admin.initializeApp({

      credential: admin.credential.cert(serviceAccount),

      projectId: serviceAccount.project_id

    });

  }

  console.log('Firebase Admin initialized:');

  console.log(JSON.stringify({

    projectId: serviceAccount.project_id,

    clientEmail: serviceAccount.client_email,

    serviceAccountPath

  }, null, 2));

  return admin.firestore();

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

function parseMaybeJson(value) {

  if (!value) return null;

  if (typeof value === 'object') return value;

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  try {

    return JSON.parse(trimmed);

  } catch {

    return null;

  }

}

function getNested(data, keys) {

  for (const key of keys) {

    const parts = key.split('.');

    let current = data;

    for (const part of parts) {

      if (!current || typeof current !== 'object' || !(part in current)) {

        current = undefined;

        break;

      }

      current = current[part];

    }

    if (current !== undefined && current !== null && normalizeText(current) !== '') {

      return current;

    }

  }

  return '';

}

function getShellConstructionObject(data) {

  const raw = getNested(data, [

    'shellConstruction',

    'shell.shellConstruction',

    'shell.construction'

  ]);

  return parseMaybeJson(raw);

}

function getShellMaterial(data) {

  const shellObj = getShellConstructionObject(data);

  const candidates = [

    data.shellMaterial,

    data.shellMaterialPrimary,

    data.material,

    data.shell?.material,

    data.shell?.shellMaterialPrimary,

    data.shell?.shellMaterial,

    shellObj?.shellMaterialPrimary,

    shellObj?.shellMaterial,

    shellObj?.material,

    shellObj?.shellMaterialSecondary,

    shellObj?.shellMaterialTertiary

  ];

  return candidates.map(normalizeText).filter(Boolean).join(' | ');

}

function getShellConstruction(data) {

  const shellObj = getShellConstructionObject(data);

  const candidates = [

    data.shellConstruction,

    data.construction,

    data.shell?.construction,

    data.shell?.shellConstruction,

    shellObj?.shellConstruction,

    shellObj?.construction,

    shellObj?.layupDescription

  ];

  return candidates.map(normalizeText).filter(Boolean).join(' | ');

}

function getShellThickness(data) {

  const shellObj = getShellConstructionObject(data);

  const candidates = [

    data.shellThickness,

    data.shellThicknessMm,

    data.shell?.shellThicknessMm,

    data.shell?.thicknessMm,

    shellObj?.shellThicknessMm,

    shellObj?.thicknessMm

  ];

  for (const candidate of candidates) {

    const raw = normalizeText(candidate);

    if (!raw) continue;

    const numeric = Number(raw.replace(/[^0-9.]/g, ''));

    if (Number.isFinite(numeric) && numeric > 0 && numeric <= 50) {

      return {

        value: numeric,

        raw,

        isValid: true

      };

    }

  }

  return {

    value: null,

    raw: '',

    isValid: false

  };

}

function getBearingEdgeRaw(data) {

  return getNested(data, [

    'bearingEdge',

    'shell.bearingEdge',

    'shell.bearingEdgeProfile',

    'shell.edge',

    'edge'

  ]);

}

function isPlaceholderBearingEdge(value) {

  const text = lower(value);

  if (!text) return true;

  const meaningfulTerms = [

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

    'half round',

    'sonor osm',

    'osm',

    'dual',

    'back cut',

    'profile',

    'machined',

    'cut'

  ];

  if (meaningfulTerms.some((term) => text.includes(term))) {

    return false;

  }

  const placeholderTerms = [

    'unknown',

    'not verified',

    'notverified',

    'needs verification',

    'needs review',

    'tbd',

    'n/a',

    'na',

    'none',

    'unspecified',

    'not published'

  ];

  return placeholderTerms.some((term) => text.includes(term));

}

function isMetalLike(data) {

  const material = lower(getShellMaterial(data));

  const construction = lower(getShellConstruction(data));

  const joined = `${material} ${construction}`;

  const metalTerms = [

    'metal',

    'steel',

    'stainless',

    'brass',

    'bell brass',

    'bronze',

    'copper',

    'aluminum',

    'aluminium',

    'titanium',

    'iron',

    'black iron',

    'nickel',

    'cobalt',

    'alloy'

  ];

  return metalTerms.some((term) => joined.includes(term));

}

function isClearlyNonMetal(data) {

  const material = lower(getShellMaterial(data));

  const construction = lower(getShellConstruction(data));

  const joined = `${material} ${construction}`;

  const nonMetalTerms = [

    'maple',

    'birch',

    'beech',

    'mahogany',

    'walnut',

    'oak',

    'cherry',

    'ash',

    'poplar',

    'bubinga',

    'rosewood',

    'teak',

    'ply',

    'stave',

    'steam',

    'steam-bent',

    'single ply',

    'solid wood',

    'wood',

    'acrylic',

    'fiberglass',

    'carbon',

    'composite'

  ];

  return nonMetalTerms.some((term) => joined.includes(term)) && !isMetalLike(data);

}

function getSourceUrl(data) {

  return normalizeText(getNested(data, [

    'primarySourceUrl',

    'sourceUrl',

    'source.url',

    'primarySource.url',

    'sources.primary.url'

  ]));

}

function getSourceConfidence(data) {

  return normalizeText(getNested(data, [

    'sourceConfidence',

    'source.confidence',

    'primarySource.confidence',

    'sources.primary.confidence'

  ]));

}

function buildLabel(data) {

  const company = normalizeText(data.companyName || data.company || 'Unknown Company');

  const line = normalizeText(data.lineSeries || data.series || '');

  const model = normalizeText(data.modelName || data.model || 'Unknown Model');

  const diameter = normalizeText(data.diameter || data.size?.diameter || '');

  const depth = normalizeText(data.depth || data.size?.depth || '');

  const size = diameter && depth ? `${diameter}x${depth}` : '';

  return [company, line, model, size].filter(Boolean).join(' — ');

}

function classifyCandidate(doc) {

  const data = doc.data();

  const shellThickness = getShellThickness(data);

  const bearingEdgeRaw = getBearingEdgeRaw(data);

  const placeholderBearingEdge = isPlaceholderBearingEdge(bearingEdgeRaw);

  const metalLike = isMetalLike(data);

  const clearlyNonMetal = isClearlyNonMetal(data);

  const sourceUrl = getSourceUrl(data);

  const sourceConfidence = getSourceConfidence(data);

  const base = {

    id: doc.id,

    label: buildLabel(data),

    companyName: normalizeText(data.companyName || data.company || ''),

    lineSeries: normalizeText(data.lineSeries || data.series || ''),

    modelName: normalizeText(data.modelName || data.model || ''),

    diameter: normalizeText(data.diameter || data.size?.diameter || ''),

    depth: normalizeText(data.depth || data.size?.depth || ''),

    shellMaterial: getShellMaterial(data),

    shellConstruction: getShellConstruction(data),

    shellThicknessMm: shellThickness.value,

    shellThicknessRaw: shellThickness.raw,

    bearingEdge: normalizeText(bearingEdgeRaw),

    sourceUrl,

    sourceConfidence,

    currentFieldQualityTier: normalizeText(data.fieldQualityTier || ''),

    currentCoreShellTier: normalizeText(data.coreShellTier || ''),

    notesOnMissingData: normalizeText(data.notesOnMissingData || '')

  };

  if (!shellThickness.isValid) {

    return {

      group: 'blockedMissingValidThickness',

      reason: 'blocked: missing valid numeric shell thickness',

      ...base

    };

  }

  if (!placeholderBearingEdge) {

    return {

      group: 'notCandidateBearingEdgeAlreadyMeaningful',

      reason: 'not candidate: bearing edge already appears meaningful',

      ...base

    };

  }

  if (metalLike) {

    return {

      group: 'eligibleMetalEdgeFallbackCandidate',

      reason: 'eligible candidate: valid shell thickness + metal shell + unknown/placeholder bearing edge',

      projectedFieldQualityTier: 'MEANINGFUL_CORE_SHELL_PASS_WITH_METAL_EDGE_FALLBACK',

      ...base

    };

  }

  if (clearlyNonMetal) {

    return {

      group: 'blockedNonMetalUnknownEdge',

      reason: 'blocked: non-metal shell with unknown/placeholder bearing edge requires source-backed edge detail',

      ...base

    };

  }

  return {

    group: 'blockedAmbiguousMaterialOrConstruction',

    reason: 'blocked: cannot confirm metal shell from material/construction fields',

    ...base

  };

}

function sortRows(rows) {

  return [...rows].sort((a, b) => {

    const companyCompare = a.companyName.localeCompare(b.companyName);

    if (companyCompare) return companyCompare;

    const lineCompare = a.lineSeries.localeCompare(b.lineSeries);

    if (lineCompare) return lineCompare;

    return a.modelName.localeCompare(b.modelName);

  });

}

function countBy(rows, key) {

  return rows.reduce((acc, row) => {

    const value = row[key] || 'UNKNOWN';

    acc[value] = (acc[value] || 0) + 1;

    return acc;

  }, {});

}

async function main() {

  const db = initFirebaseAdmin();

  console.log(`\nReading ${COLLECTION_NAME}...`);

  const snapshot = await db.collection(COLLECTION_NAME).get();

  const rows = snapshot.docs.map(classifyCandidate);

  const groups = {

    eligibleMetalEdgeFallbackCandidate: sortRows(rows.filter((row) => row.group === 'eligibleMetalEdgeFallbackCandidate')),

    blockedNonMetalUnknownEdge: sortRows(rows.filter((row) => row.group === 'blockedNonMetalUnknownEdge')),

    blockedAmbiguousMaterialOrConstruction: sortRows(rows.filter((row) => row.group === 'blockedAmbiguousMaterialOrConstruction')),

    blockedMissingValidThickness: sortRows(rows.filter((row) => row.group === 'blockedMissingValidThickness')),

    notCandidateBearingEdgeAlreadyMeaningful: sortRows(rows.filter((row) => row.group === 'notCandidateBearingEdgeAlreadyMeaningful'))

  };

  const summary = {

    auditName: 'OBER LEGACYPRINT™ METAL EDGE FALLBACK CANDIDATE AUDIT',

    mode: 'READ_ONLY',

    collectionName: COLLECTION_NAME,

    generatedAt: new Date().toISOString(),

    totalRecordsScanned: snapshot.size,

    targetDefinition: 'Records with valid numeric shell thickness and unknown/placeholder bearing edge. Only confirmed metal shells are eligible for metal-edge fallback.',

    groupCounts: Object.fromEntries(

      Object.entries(groups).map(([key, value]) => [key, value.length])

    ),

    eligibleByCompany: countBy(groups.eligibleMetalEdgeFallbackCandidate, 'companyName'),

    blockedNonMetalByCompany: countBy(groups.blockedNonMetalUnknownEdge, 'companyName'),

    blockedAmbiguousByCompany: countBy(groups.blockedAmbiguousMaterialOrConstruction, 'companyName')

  };

  const report = {

    summary,

    groups

  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

  console.log('\nMETAL EDGE FALLBACK CANDIDATE AUDIT COMPLETE');

  console.log(JSON.stringify(summary, null, 2));

  console.log(`\nJSON report written to: ${OUTPUT_FILE}`);

}

main().catch((error) => {

  console.error('\nAudit failed.');

  console.error(error);

  process.exit(1);

});