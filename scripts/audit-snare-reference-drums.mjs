// scripts/audit-snare-reference-drums.mjs

// OBER LEGACYPRINT™ — Phase 3S-2 Refined Read-Only snareReferenceDrums Audit

// READ ONLY: performs Firestore reads only. No writes, no patches, no rescoring.

import fs from 'fs';

import path from 'path';

import admin from 'firebase-admin';

const COLLECTION = 'snareReferenceDrums';

const OUT_DIR = path.join(process.cwd(), 'audit-reports');

const NOW = new Date().toISOString().replace(/[:.]/g, '-');

const EMPTY_VALUES = new Set([

  '',

  'unknown',

  'Unknown',

  'UNKNOWN',

  'n/a',

  'N/A',

  'na',

  'NA',

  null,

  undefined,

]);

const VALID_CONFIDENCE = new Set([

  'high',

  'high-minus',

  'medium',

  'medium-minus',

  'low',

  'unknown',

]);

const NODE_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const MIRROR_FIELD_RULES = [

  {

    label: 'shell.material',

    flatPaths: ['shellMaterial', 'shellMaterial1', 'material'],

    nestedPaths: ['shell.material', 'shell.material1', 'shell.primaryMaterial'],

  },

  {

    label: 'shell.construction',

    flatPaths: ['shellConstruction', 'construction'],

    nestedPaths: ['shell.construction'],

  },

  {

    label: 'shell.thicknessMm',

    flatPaths: ['shellThicknessMm', 'thicknessMm'],

    nestedPaths: ['shell.thicknessMm', 'shell.shellThicknessMm'],

    numeric: true,

  },

  {

    label: 'shell.plyCount',

    flatPaths: ['plyCount', 'plyCountLayup'],

    nestedPaths: ['shell.plyCount', 'shell.plyCountLayup'],

  },

  {

    label: 'shell.reinforcementRings',

    flatPaths: ['reinforcementRings'],

    nestedPaths: ['shell.reinforcementRings'],

  },

  {

    label: 'shell.bearingEdge',

    flatPaths: ['bearingEdge'],

    nestedPaths: ['shell.bearingEdge'],

  },

  {

    label: 'shell.snareBedType',

    flatPaths: ['snareBedType'],

    nestedPaths: ['shell.snareBedType'],

  },

  {

    label: 'stockHardware.hoopType',

    flatPaths: ['hoopType', 'rimType'],

    nestedPaths: ['stockHardware.hoopType', 'stockHardware.rimType'],

  },

  {

    label: 'stockHardware.lugCount',

    flatPaths: ['lugCount'],

    nestedPaths: ['stockHardware.lugCount', 'hardware.lugCount', 'configuration.lugCount'],

    numeric: true,

  },

  {

    label: 'stockHardware.lugType',

    flatPaths: ['lugType'],

    nestedPaths: ['stockHardware.lugType'],

  },

  {

    label: 'stockHardware.hardwareFinish',

    flatPaths: ['hardwareFinish'],

    nestedPaths: ['stockHardware.hardwareFinish'],

  },

  {

    label: 'stockSnareSystem.throwOff',

    flatPaths: ['snareThrowMakeModel', 'throwOff', 'throwOffModel'],

    nestedPaths: ['stockSnareSystem.throwOff', 'stockSnareSystem.throwOffModel'],

  },

  {

    label: 'stockSnareSystem.snareWires',

    flatPaths: ['stockSnareWires', 'snareWires'],

    nestedPaths: ['stockSnareSystem.snareWires'],

  },

  {

    label: 'stockSnareSystem.batterHead',

    flatPaths: ['stockBatterHead', 'batterHead'],

    nestedPaths: ['stockSnareSystem.batterHead'],

  },

  {

    label: 'stockSnareSystem.resoHead',

    flatPaths: ['stockResoHead', 'resoHead'],

    nestedPaths: ['stockSnareSystem.resoHead'],

  },

  {

    label: 'sources.primaryUrl',

    flatPaths: ['primarySourceUrl', 'sourceUrl'],

    nestedPaths: ['sources.primaryUrl', 'sources.primarySourceUrl'],

  },

  {

    label: 'sources.secondaryUrl',

    flatPaths: ['secondarySourceUrl'],

    nestedPaths: ['sources.secondaryUrl', 'sources.secondarySourceUrl'],

  },

  {

    label: 'sources.confidence',

    flatPaths: ['sourceConfidence'],

    nestedPaths: ['sources.confidence', 'sources.sourceConfidence'],

  },

  {

    label: 'summary.notes',

    flatPaths: ['drumSummaryNotes', 'summaryNotes'],

    nestedPaths: ['summary.notes', 'summary.drumSummaryNotes'],

  },

];

function initFirebase() {

  if (!admin.apps.length) {

    admin.initializeApp({

      credential: admin.credential.applicationDefault(),

    });

  }

  return admin.firestore();

}

function rawGet(obj, pathString) {

  return pathString.split('.').reduce((acc, key) => acc?.[key], obj);

}

function getFirst(obj, paths) {

  for (const p of paths) {

    const value = rawGet(obj, p);

    if (!isMissing(value)) {

      return { path: p, value };

    }

  }

  return { path: undefined, value: undefined };

}

function isMissing(value) {

  return EMPTY_VALUES.has(value);

}

function normalizeText(value) {

  return String(value ?? '')

    .trim()

    .toLowerCase()

    .replace(/[™®©]/g, '')

    .replace(/[“”]/g, '"')

    .replace(/[‘’]/g, "'")

    .replace(/-/g, ' ')

    .replace(/\s+/g, ' ');

}

function normalizeComparisonText(value) {

  return normalizeText(value)

    .replace(/\bmillimeter\b/g, 'mm')

    .replace(/\bmillimeters\b/g, 'mm')

    .replace(/\binch\b/g, '"')

    .replace(/\binches\b/g, '"')

    .replace(/\btriple flanged\b/g, 'triple flange')

    .replace(/\btriple-flange\b/g, 'triple flange')

    .replace(/\bdie cast\b/g, 'diecast')

    .replace(/\bdie-cast\b/g, 'diecast')

    .replace(/\bnot applicable\b/g, 'none')

    .replace(/\bno\b/g, 'none')

    .replace(/\bwithout\b/g, 'none');

}

function normalizeNumber(value) {

  if (value === null || value === undefined || value === '') return undefined;

  if (typeof value === 'number') {

    return Number.isFinite(value) ? value : undefined;

  }

  const cleaned = String(value).replace(/[^\d.-]/g, '');

  if (!cleaned) return undefined;

  const n = Number(cleaned);

  return Number.isFinite(n) ? n : undefined;

}

function valuesMatch(a, b, numeric = false) {

  if (numeric) {

    const an = normalizeNumber(a);

    const bn = normalizeNumber(b);

    if (an === undefined || bn === undefined) return false;

    return Math.abs(an - bn) < 0.001;

  }

  return normalizeText(a) === normalizeText(b);

}

function valuesEquivalent(a, b) {

  return normalizeComparisonText(a) === normalizeComparisonText(b);

}

function classifyNumericIssue(field, raw, numericValue, message) {

  const rawText = String(raw ?? '').trim();

  if (rawText.match(/\d+\s*[-/]\s*\d+/) || rawText.match(/\d{2,}\s*\d{2,}/)) {

    return 'parser corruption';

  }

  if (

    field === 'lugCount' &&

    numericValue !== undefined &&

    (numericValue > 24 || numericValue < 0)

  ) {

    return 'parser corruption';

  }

  if (

    ['diameter', 'depth'].includes(field) &&

    numericValue !== undefined &&

    numericValue > 30

  ) {

    return 'parser corruption';

  }

  if (

    field === 'shellThicknessMm' &&

    numericValue !== undefined &&

    numericValue > 40

  ) {

    return 'ingest bug';

  }

  if (message.includes('not numeric')) {

    return 'ingest bug';

  }

  return 'manual review';

}

function addIssue(bucket, issue) {

  bucket.push({

    severity: issue.severity ?? 'review',

    category: issue.category,

    docId: issue.docId,

    field: issue.field,

    value: issue.value,

    message: issue.message,

  });

}

function auditNumeric(docId, data, issues) {

  const numericChecks = [

    {

      field: 'lugCount',

      paths: ['stockHardware.lugCount', 'lugCount', 'hardware.lugCount', 'configuration.lugCount'],

      min: 0,

      max: 24,

      integer: true,

    },

    {

      field: 'diameter',

      paths: ['diameter', 'size.diameter', 'dimensions.diameter'],

      min: 6,

      max: 30,

    },

    {

      field: 'depth',

      paths: ['depth', 'size.depth', 'dimensions.depth'],

      min: 1,

      max: 30,

    },

    {

      field: 'shellThicknessMm',

      paths: ['shell.thicknessMm', 'shell.shellThicknessMm', 'shellThicknessMm'],

      min: 0.5,

      max: 40,

    },

  ];

  for (const check of numericChecks) {

    const { value: raw } = getFirst(data, check.paths);

    if (raw === undefined) continue;

    const value = normalizeNumber(raw);

    if (value === undefined) {

      addIssue(issues.numericValidity, {

        severity: 'critical',

        category: classifyNumericIssue(check.field, raw, value, `${check.field} is not numeric.`),

        docId,

        field: check.field,

        value: raw,

        message: `${check.field} is not numeric.`,

      });

      continue;

    }

    if (value < check.min || value > check.max) {

      addIssue(issues.numericValidity, {

        severity: 'critical',

        category: classifyNumericIssue(

          check.field,

          raw,

          value,

          `${check.field} outside expected range ${check.min}-${check.max}.`

        ),

        docId,

        field: check.field,

        value,

        message: `${check.field} outside expected range ${check.min}-${check.max}.`,

      });

    }

    if (check.integer && !Number.isInteger(value)) {

      addIssue(issues.numericValidity, {

        severity: 'review',

        category: 'manual review',

        docId,

        field: check.field,

        value,

        message: `${check.field} should be an integer.`,

      });

    }

  }

  for (const node of NODE_KEYS) {

    const raw = getFirst(data, [

      `overallScores.${node}`,

      `scores.overall.${node}`,

      `voiceScores.${node}`,

      node,

    ]).value;

    if (raw === undefined) continue;

    const value = normalizeNumber(raw);

    if (value === undefined || value < 0 || value > 10) {

      addIssue(issues.numericValidity, {

        severity: 'critical',

        category: value === undefined ? 'ingest bug' : 'manual review',

        docId,

        field: `score.${node}`,

        value: raw,

        message: `Node score ${node} is not a valid 0-10 number.`,

      });

    }

  }

}

function auditFlatNestedMirrors(docId, data, issues) {

  for (const rule of MIRROR_FIELD_RULES) {

    const flat = getFirst(data, rule.flatPaths);

    const nested = getFirst(data, rule.nestedPaths);

    const flatMissing = isMissing(flat.value);

    const nestedMissing = isMissing(nested.value);

    const base = {

      docId,

      field: rule.label,

      flatPath: flat.path,

      flatValue: flat.value,

      nestedPath: nested.path,

      nestedValue: nested.value,

      canonical: nestedMissing ? 'flat fallback' : 'nested',

    };

    if (!flatMissing && !nestedMissing) {

      if (valuesMatch(flat.value, nested.value, rule.numeric)) {

        issues.flatNestedRefined.mirrorMatch.push(base);

      } else if (!rule.numeric && valuesEquivalent(flat.value, nested.value)) {

        issues.flatNestedRefined.normalizationEquivalent.push(base);

      } else {

        issues.flatNestedRefined.trueMismatch.push({

          ...base,

          severity: 'review',

          message: 'Flat legacy mirror and nested canonical value disagree.',

        });

      }

      continue;

    }

    if (!flatMissing && nestedMissing) {

      issues.flatNestedRefined.nestedMissingFlatAvailable.push({

        ...base,

        severity: 'review',

        message: 'Nested canonical field is missing but flat legacy value is available.',

      });

      continue;

    }

    if (flatMissing && !nestedMissing) {

      issues.flatNestedRefined.flatMissingNestedAvailable.push({

        ...base,

        severity: 'low',

        message: 'Nested canonical value exists but flat mirror is missing.',

      });

      continue;

    }

    issues.flatNestedRefined.missingMirror.push({

      ...base,

      severity: 'low',

      message: 'Both flat mirror and nested canonical value are missing.',

    });

  }

}

function auditConfidence(docId, data, issues) {

  const confidenceFields = [

    ['voiceScoreConfidence', data.voiceScoreConfidence],

    ['sourceConfidence', data.sourceConfidence],

    ['sources.confidence', rawGet(data, 'sources.confidence')],

  ];

  for (const [field, value] of confidenceFields) {

    if (isMissing(value)) continue;

    if (!VALID_CONFIDENCE.has(String(value))) {

      addIssue(issues.confidenceLabels, {

        severity: 'review',

        category: 'manual review',

        docId,

        field,

        value,

        message: `${field} is not in approved confidence labels.`,

      });

    }

  }

}

function auditMissingHighValueFields(docId, data, issues) {

  const requiredGroups = [

    {

      field: 'shell.material',

      paths: ['shell.material', 'shell.material1', 'shellMaterial', 'shellMaterial1'],

    },

    {

      field: 'shell.construction',

      paths: ['shell.construction', 'shellConstruction'],

    },

    {

      field: 'shell.thicknessMm',

      paths: ['shell.thicknessMm', 'shell.shellThicknessMm', 'shellThicknessMm'],

    },

    {

      field: 'stockHardware.hoopType',

      paths: ['stockHardware.hoopType', 'hoopType'],

    },

    {

      field: 'stockSnareSystem.snareWires',

      paths: ['stockSnareSystem.snareWires', 'stockSnareWires', 'snareWires'],

    },

    {

      field: 'stockSnareSystem.batterHead',

      paths: ['stockSnareSystem.batterHead', 'stockBatterHead', 'batterHead'],

    },

    {

      field: 'stockSnareSystem.resoHead',

      paths: ['stockSnareSystem.resoHead', 'stockResoHead', 'resoHead'],

    },

    {

      field: 'sources.primaryUrl',

      paths: ['sources.primaryUrl', 'sources.primarySourceUrl', 'primarySourceUrl', 'sourceUrl'],

    },

  ];

  for (const group of requiredGroups) {

    const { value } = getFirst(data, group.paths);

    if (isMissing(value)) {

      addIssue(issues.missingFields, {

        severity: 'review',

        category: 'manual review',

        docId,

        field: group.field,

        value: undefined,

        message: `${group.field} is missing from both nested canonical and flat legacy paths.`,

      });

    }

  }

}

function duplicateKeyFor(data) {

  const company = normalizeComparisonText(getFirst(data, ['companyName', 'company', 'brand']).value);

  const model = normalizeComparisonText(getFirst(data, ['modelName', 'model']).value);

  const line = normalizeComparisonText(getFirst(data, ['lineSeries', 'series', 'line']).value);

  const diameter = normalizeNumber(getFirst(data, ['diameter', 'size.diameter', 'dimensions.diameter']).value);

  const depth = normalizeNumber(getFirst(data, ['depth', 'size.depth', 'dimensions.depth']).value);

  if (!company || !model || !diameter || !depth) return null;

  return [company, line, model, diameter, depth].join('|');

}

function classifyDuplicateGroup(records) {

  const constructions = new Set(

    records

      .map((r) => normalizeComparisonText(getFirst(r.data, ['shell.construction', 'shellConstruction']).value))

      .filter(Boolean)

  );

  const materials = new Set(

    records

      .map((r) => normalizeComparisonText(getFirst(r.data, ['shell.material', 'shellMaterial', 'shellMaterial1']).value))

      .filter(Boolean)

  );

  const finishes = new Set(

    records

      .map((r) => normalizeComparisonText(getFirst(r.data, ['finishType', 'shell.finishType']).value))

      .filter(Boolean)

  );

  const modelNumbers = new Set(

    records

      .map((r) => normalizeComparisonText(getFirst(r.data, ['modelNumber', 'modelNum', 'modelNo']).value))

      .filter(Boolean)

  );

  if (constructions.size <= 1 && materials.size <= 1 && modelNumbers.size <= 1 && finishes.size <= 1) {

    return 'true duplicate';

  }

  if (modelNumbers.size > 1 || finishes.size > 1) {

    return 'intentional variant';

  }

  return 'uncertain/manual review';

}

function auditDuplicates(records, issues) {

  const map = new Map();

  for (const record of records) {

    const key = duplicateKeyFor(record.data);

    if (!key) continue;

    if (!map.has(key)) map.set(key, []);

    map.get(key).push(record);

  }

  for (const [key, group] of map.entries()) {

    if (group.length < 2) continue;

    const category = classifyDuplicateGroup(group);

    issues.duplicateGroups.push({

      category,

      key,

      count: group.length,

      docIds: group.map((item) => item.docId),

      records: group.map((item) => ({

        docId: item.docId,

        company: getFirst(item.data, ['companyName', 'company', 'brand']).value,

        line: getFirst(item.data, ['lineSeries', 'series', 'line']).value,

        model: getFirst(item.data, ['modelName', 'model']).value,

        modelNumber: getFirst(item.data, ['modelNumber', 'modelNum', 'modelNo']).value,

        diameter: getFirst(item.data, ['diameter', 'size.diameter', 'dimensions.diameter']).value,

        depth: getFirst(item.data, ['depth', 'size.depth', 'dimensions.depth']).value,

        shellConstruction: getFirst(item.data, ['shell.construction', 'shellConstruction']).value,

        shellMaterial: getFirst(item.data, ['shell.material', 'shellMaterial', 'shellMaterial1']).value,

        finishType: getFirst(item.data, ['finishType', 'shell.finishType']).value,

      })),

    });

  }

}

function auditFutureScoreRecalculation(docId, data, issues) {

  const confidence = getFirst(data, ['voiceScoreConfidence', 'scoring.confidence']).value;

  const basis = normalizeComparisonText(getFirst(data, ['scoringBasis', 'scoring.basis']).value);

  const generated = Boolean(data.generated || data.isGenerated || data.scoringGenerated);

  const hasScores = NODE_KEYS.some((node) => {

    const raw = getFirst(data, [

      `overallScores.${node}`,

      `scores.overall.${node}`,

      `voiceScores.${node}`,

      node,

    ]).value;

    return normalizeNumber(raw) !== undefined;

  });

  if (

    hasScores &&

    (

      generated ||

      basis.includes('heuristic') ||

      basis.includes('generated') ||

      basis.includes('estimated') ||

      ['low', 'unknown', 'medium-minus'].includes(String(confidence))

    )

  ) {

    issues.futureScoreRecalculationQueue.push({

      docId,

      confidence,

      scoringBasis: getFirst(data, ['scoringBasis', 'scoring.basis']).value,

      reason: 'Preserved from audit logic: generated/heuristic/low-confidence scoring should be reviewed after resolver calibration.',

    });

  }

}

function summarize(issues, totalRecords) {

  const refined = issues.flatNestedRefined;

  const numericByCategory = issues.numericValidity.reduce((acc, item) => {

    const key = item.category || 'manual review';

    acc[key] = (acc[key] || 0) + 1;

    return acc;

  }, {});

  const duplicateByCategory = issues.duplicateGroups.reduce((acc, item) => {

    const key = item.category || 'uncertain/manual review';

    acc[key] = (acc[key] || 0) + 1;

    return acc;

  }, {});

  return {

    recordsScanned: totalRecords,

    numericValidity: issues.numericValidity.length,

    numericValidityByCategory: numericByCategory,

    duplicateGroups: issues.duplicateGroups.length,

    duplicateGroupsByCategory: duplicateByCategory,

    flatNestedRefined: {

      mirrorMatch: refined.mirrorMatch.length,

      normalizationEquivalent: refined.normalizationEquivalent.length,

      missingMirror: refined.missingMirror.length,

      trueMismatch: refined.trueMismatch.length,

      nestedMissingFlatAvailable: refined.nestedMissingFlatAvailable.length,

      flatMissingNestedAvailable: refined.flatMissingNestedAvailable.length,

    },

    confidenceLabels: issues.confidenceLabels.length,

    missingFields: issues.missingFields.length,

    futureScoreRecalculationQueue: issues.futureScoreRecalculationQueue.length,

    trueCleanupCandidates: {

      numericParserCorruption: numericByCategory['parser corruption'] || 0,

      numericIngestBug: numericByCategory['ingest bug'] || 0,

      flatNestedTrueMismatch: refined.trueMismatch.length,

      nestedMissingFlatAvailable: refined.nestedMissingFlatAvailable.length,

      trueDuplicateGroups: duplicateByCategory['true duplicate'] || 0,

    },

  };

}

function buildMarkdown(summary, issues) {

  return `# OBER LEGACYPRINT™ Phase 3S-2 Refined Read-Only Audit

Generated: ${new Date().toISOString()}

Collection: \`${COLLECTION}\`

## Summary

| Category | Count |

|---|---:|

| Records scanned | ${summary.recordsScanned} |

| Numeric validity issues | ${summary.numericValidity} |

| Duplicate groups | ${summary.duplicateGroups} |

| Confidence label issues | ${summary.confidenceLabels} |

| Missing high-value fields | ${summary.missingFields} |

| Future score recalculation queue | ${summary.futureScoreRecalculationQueue} |

## Refined Flat-vs-Nested Categories

| Category | Count |

|---|---:|

| Mirror match | ${summary.flatNestedRefined.mirrorMatch} |

| Normalization equivalent | ${summary.flatNestedRefined.normalizationEquivalent} |

| Missing mirror | ${summary.flatNestedRefined.missingMirror} |

| True mismatch | ${summary.flatNestedRefined.trueMismatch} |

| Nested missing / flat available | ${summary.flatNestedRefined.nestedMissingFlatAvailable} |

| Flat missing / nested available | ${summary.flatNestedRefined.flatMissingNestedAvailable} |

## Numeric Validity Reclassification

| Category | Count |

|---|---:|

| Parser corruption | ${summary.numericValidityByCategory['parser corruption'] || 0} |

| Ingest bug | ${summary.numericValidityByCategory['ingest bug'] || 0} |

| Manual review | ${summary.numericValidityByCategory['manual review'] || 0} |

## Duplicate Group Reclassification

| Category | Count |

|---|---:|

| True duplicate | ${summary.duplicateGroupsByCategory['true duplicate'] || 0} |

| Intentional variant | ${summary.duplicateGroupsByCategory['intentional variant'] || 0} |

| Uncertain/manual review | ${summary.duplicateGroupsByCategory['uncertain/manual review'] || 0} |

## True Cleanup Candidate Counts

| Candidate Type | Count |

|---|---:|

| Numeric parser corruption | ${summary.trueCleanupCandidates.numericParserCorruption} |

| Numeric ingest bug | ${summary.trueCleanupCandidates.numericIngestBug} |

| Flat/nested true mismatch | ${summary.trueCleanupCandidates.flatNestedTrueMismatch} |

| Nested missing / flat available | ${summary.trueCleanupCandidates.nestedMissingFlatAvailable} |

| True duplicate groups | ${summary.trueCleanupCandidates.trueDuplicateGroups} |

## Recommendation

Cleanup patches should only begin after the true mismatch, parser corruption, ingest bug, and true duplicate records are manually reviewed from the JSON detail report. Mirror matches, normalization equivalents, and flat-missing/nested-available cases should not be treated as cleanup blockers.

## Notes

- Nested canonical fields are favored over flat legacy mirrors.

- Flat fields are treated as display/search/legacy mirrors unless nested canonical values are missing.

- No Firestore writes were performed.

- No rescoring was performed.

- Future score recalculation queue was preserved only as a later review queue.

`;

}

async function main() {

  const db = initFirebase();

  const snapshot = await db.collection(COLLECTION).get();

  const records = [];

  const issues = {

    numericValidity: [],

    duplicateGroups: [],

    flatNestedRefined: {

      mirrorMatch: [],

      normalizationEquivalent: [],

      missingMirror: [],

      trueMismatch: [],

      nestedMissingFlatAvailable: [],

      flatMissingNestedAvailable: [],

    },

    confidenceLabels: [],

    missingFields: [],

    futureScoreRecalculationQueue: [],

  };

  for (const doc of snapshot.docs) {

    const data = doc.data();

    const docId = doc.id;

    records.push({ docId, data });

    auditNumeric(docId, data, issues);

    auditFlatNestedMirrors(docId, data, issues);

    auditConfidence(docId, data, issues);

    auditMissingHighValueFields(docId, data, issues);

    auditFutureScoreRecalculation(docId, data, issues);

  }

  auditDuplicates(records, issues);

  const summary = summarize(issues, records.length);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jsonPath = path.join(OUT_DIR, `snareReferenceDrums-audit-refined-${NOW}.json`);

  const mdPath = path.join(OUT_DIR, `snareReferenceDrums-audit-refined-${NOW}.md`);

  fs.writeFileSync(

    jsonPath,

    JSON.stringify(

      {

        phase: '3S-2',

        collection: COLLECTION,

        generatedAt: new Date().toISOString(),

        readOnly: true,

        summary,

        issues,

      },

      null,

      2

    )

  );

  fs.writeFileSync(mdPath, buildMarkdown(summary, issues));

  console.log('✅ Phase 3S-2 refined read-only audit complete');

  console.log(`Records scanned: ${summary.recordsScanned}`);

  console.log(`JSON report: ${jsonPath}`);

  console.log(`Markdown report: ${mdPath}`);

  console.table(summary);

}

main().catch((error) => {

  console.error('❌ Phase 3S-2 audit failed:', error);

  process.exit(1);

});