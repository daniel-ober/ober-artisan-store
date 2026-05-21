// scripts/legacyPrint/applyAheadMetalEdgeFallbackPatch.mjs

import fs from 'fs';

import path from 'path';

import process from 'process';

import { fileURLToPath } from 'url';

import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const PHASE = 'PHASE_3X_AHEAD_METAL_EDGE_FALLBACK_PATCH_APPLIER';

const COLLECTION_NAME = 'snareReferenceDrums';

const DEFAULT_PATCH_PATH = path.resolve(

  process.cwd(),

  'tmp/legacyPrint-patches/ahead-metal-edge-fallback/ahead-metal-edge-fallback-review-patch-latest.json'

);

const OUTPUT_ROOT = path.resolve(

  process.cwd(),

  'tmp/legacyPrint-patches/ahead-metal-edge-fallback/apply-results'

);

const args = process.argv.slice(2);

const APPLY_MODE = args.includes('--apply');

const PATCH_ARG = args.find((arg) => arg.startsWith('--patch='));

const PATCH_PATH = PATCH_ARG

  ? path.resolve(process.cwd(), PATCH_ARG.replace('--patch=', '').trim())

  : DEFAULT_PATCH_PATH;

const FORCE_ARG = args.includes('--force');

const EXPECTED_COMPANY = 'AHEAD';

const EXPECTED_UPDATE_COUNT = 33;

const FORBIDDEN_DOT_PATH_PREFIXES = [

  'shell.bearingEdge',

  'bearingEdge',

  'stockBatterHead',

  'stockResoHead',

  'stockHeads',

  'productionStatus',

  'stockHardware.productionStatus',

];

const FORBIDDEN_DOT_PATH_INCLUDES = [

  'stockBatterHead',

  'stockResoHead',

  'productionStatus',

  'stockHeadFallback',

];

const REQUIRED_DOT_PATHS = [

  'engineAssumptions.bearingEdgeFallbackApplied',

  'engineAssumptions.bearingEdgeFallbackKey',

  'engineAssumptions.bearingEdgeFallbackReason',

  'engineAssumptions.bearingEdgeNeedsVerification',

  'engineDerivedFields.bearingEdgeFallback.batterSideProfile',

  'engineDerivedFields.bearingEdgeFallback.snareSideProfile',

  'engineDerivedFields.bearingEdgeFallback.roundover',

  'engineDerivedFields.bearingEdgeFallback.evidenceLevel',

  'engineDerivedFields.bearingEdgeFallback.confidence',

  'engineDerivedFields.bearingEdgeFallback.sourceType',

  'engineDerivedFields.bearingEdgeFallback.notes',

];

function ensureDir(dirPath) {

  fs.mkdirSync(dirPath, { recursive: true });

}

function readJson(filePath) {

  if (!fs.existsSync(filePath)) {

    throw new Error(`File not found: ${filePath}`);

  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function writeJson(filePath, data) {

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

}

function csvEscape(value) {

  if (value === null || value === undefined) return '';

  const stringValue =

    typeof value === 'string' ? value : JSON.stringify(value);

  if (

    stringValue.includes(',') ||

    stringValue.includes('"') ||

    stringValue.includes('\n') ||

    stringValue.includes('\r')

  ) {

    return `"${stringValue.replaceAll('"', '""')}"`;

  }

  return stringValue;

}

function writeCsv(filePath, rows) {

  const headers = [

    'id',

    'label',

    'companyName',

    'modelName',

    'okToUpdate',

    'documentExists',

    'companyMatches',

    'patchHasOnlyAllowedFields',

    'alreadyHasSameFallback',

    'needsUpdate',

    'reason',

  ];

  const lines = [

    headers.join(','),

    ...rows.map((row) =>

      headers.map((header) => csvEscape(row[header])).join(',')

    ),

  ];

  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);

}

function getPatchRows(patchData) {

  if (Array.isArray(patchData)) return patchData;

  if (Array.isArray(patchData.updates)) return patchData.updates;

  if (Array.isArray(patchData.patch)) return patchData.patch;

  if (Array.isArray(patchData.records)) return patchData.records;

  throw new Error(

    'Patch file does not contain an array. Expected one of: root array, updates, patch, records.'

  );

}

function validatePatchMetadata(patchData, rows) {

  const failures = [];

  const companies = [...new Set(rows.map((row) => row.companyName).filter(Boolean))];

  if (companies.length !== 1 || companies[0] !== EXPECTED_COMPANY) {

    failures.push(

      `Patch must only contain companyName "${EXPECTED_COMPANY}". Found: ${companies.join(', ') || 'none'}`

    );

  }

  if (!FORCE_ARG && rows.length !== EXPECTED_UPDATE_COUNT) {

    failures.push(

      `Expected ${EXPECTED_UPDATE_COUNT} AHEAD updates. Found ${rows.length}. Use --force only if intentionally overriding.`

    );

  }

  if (patchData.stockHeadFallbackApplied === true) {

    failures.push('Patch metadata says stockHeadFallbackApplied=true. This applier must not apply stock head fallback.');

  }

  if (patchData.productionStatusUpdated === true) {

    failures.push('Patch metadata says productionStatusUpdated=true. This applier must not update production status.');

  }

  return failures;

}

function validatePatchRow(row, index) {

  const failures = [];

  if (!row || typeof row !== 'object') {

    return [`Row ${index + 1} is not an object.`];

  }

  if (!row.id || typeof row.id !== 'string') {

    failures.push(`Row ${index + 1} is missing string id.`);

  }

  if (row.companyName !== EXPECTED_COMPANY) {

    failures.push(

      `Row ${index + 1} has companyName "${row.companyName}", expected "${EXPECTED_COMPANY}".`

    );

  }

  const update = row.firestoreDotNotationUpdate;

  if (!update || typeof update !== 'object' || Array.isArray(update)) {

    failures.push(`Row ${index + 1} is missing firestoreDotNotationUpdate object.`);

    return failures;

  }

  const updateKeys = Object.keys(update);

  for (const requiredPath of REQUIRED_DOT_PATHS) {

    if (!updateKeys.includes(requiredPath)) {

      failures.push(`Row ${index + 1} missing required update path: ${requiredPath}`);

    }

  }

  for (const key of updateKeys) {

    const startsForbidden = FORBIDDEN_DOT_PATH_PREFIXES.some((prefix) => {

      return key === prefix || key.startsWith(`${prefix}.`);

    });

    const includesForbidden = FORBIDDEN_DOT_PATH_INCLUDES.some((part) =>

      key.includes(part)

    );

    if (startsForbidden || includesForbidden) {

      failures.push(`Row ${index + 1} contains forbidden update path: ${key}`);

    }

  }

  if (update['engineAssumptions.bearingEdgeFallbackApplied'] !== true) {

    failures.push(

      `Row ${index + 1} must set engineAssumptions.bearingEdgeFallbackApplied to true.`

    );

  }

  if (update['engineAssumptions.bearingEdgeNeedsVerification'] !== true) {

    failures.push(

      `Row ${index + 1} must set engineAssumptions.bearingEdgeNeedsVerification to true.`

    );

  }

  if (

    update['engineDerivedFields.bearingEdgeFallback.evidenceLevel'] !==

    'engineMetalFallback'

  ) {

    failures.push(

      `Row ${index + 1} must set engineDerivedFields.bearingEdgeFallback.evidenceLevel to engineMetalFallback.`

    );

  }

  if (update['engineDerivedFields.bearingEdgeFallback.confidence'] !== 'Fallback') {

    failures.push(

      `Row ${index + 1} must set engineDerivedFields.bearingEdgeFallback.confidence to Fallback.`

    );

  }

  return failures;

}

function initializeFirebaseAdmin() {

  if (admin.apps.length) return;

  const serviceAccountPath =

    process.env.GOOGLE_APPLICATION_CREDENTIALS ||

    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||

    '';

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {

    const serviceAccount = readJson(serviceAccountPath);

    admin.initializeApp({

      credential: admin.credential.cert(serviceAccount),

    });

    return;

  }

  admin.initializeApp({

    credential: admin.credential.applicationDefault(),

  });

}

function getNestedValue(obj, dotPath) {

  return dotPath.split('.').reduce((current, part) => {

    if (!current || typeof current !== 'object') return undefined;

    return current[part];

  }, obj);

}

function valuesEqual(a, b) {

  return JSON.stringify(a) === JSON.stringify(b);

}

function rowAlreadyHasSameFallback(docData, update) {

  return Object.entries(update).every(([dotPath, value]) => {

    return valuesEqual(getNestedValue(docData, dotPath), value);

  });

}

async function validateAgainstFirestore(db, rows) {

  const validationRows = [];

  for (const row of rows) {

    const docRef = db.collection(COLLECTION_NAME).doc(row.id);

    const snap = await docRef.get();

    const result = {

      id: row.id,

      label: row.label || '',

      companyName: row.companyName || '',

      modelName: row.modelName || '',

      okToUpdate: false,

      documentExists: snap.exists,

      companyMatches: false,

      patchHasOnlyAllowedFields: true,

      alreadyHasSameFallback: false,

      needsUpdate: false,

      reason: '',

    };

    if (!snap.exists) {

      result.reason = 'Firestore document does not exist.';

      validationRows.push(result);

      continue;

    }

    const docData = snap.data() || {};

    const docCompanyName = docData.companyName || docData.company || '';

    result.companyMatches = docCompanyName === EXPECTED_COMPANY;

    if (!result.companyMatches) {

      result.reason = `Company mismatch. Firestore companyName/company is "${docCompanyName}".`;

      validationRows.push(result);

      continue;

    }

    const updateKeys = Object.keys(row.firestoreDotNotationUpdate || {});

    const forbiddenKey = updateKeys.find((key) => {

      const startsForbidden = FORBIDDEN_DOT_PATH_PREFIXES.some((prefix) => {

        return key === prefix || key.startsWith(`${prefix}.`);

      });

      const includesForbidden = FORBIDDEN_DOT_PATH_INCLUDES.some((part) =>

        key.includes(part)

      );

      return startsForbidden || includesForbidden;

    });

    if (forbiddenKey) {

      result.patchHasOnlyAllowedFields = false;

      result.reason = `Forbidden update path present: ${forbiddenKey}`;

      validationRows.push(result);

      continue;

    }

    result.alreadyHasSameFallback = rowAlreadyHasSameFallback(

      docData,

      row.firestoreDotNotationUpdate

    );

    result.needsUpdate = !result.alreadyHasSameFallback;

    result.okToUpdate = true;

    result.reason = result.alreadyHasSameFallback

      ? 'Document already has the same fallback values.'

      : 'Document is valid for fallback metadata update.';

    validationRows.push(result);

  }

  return validationRows;

}

async function applyUpdates(db, rows, validationRows) {

  const eligibleIds = new Set(

    validationRows

      .filter((row) => row.okToUpdate && row.needsUpdate)

      .map((row) => row.id)

  );

  const rowsToApply = rows.filter((row) => eligibleIds.has(row.id));

  const batches = [];

  let currentBatch = db.batch();

  let operationCount = 0;

  for (const row of rowsToApply) {

    const docRef = db.collection(COLLECTION_NAME).doc(row.id);

    currentBatch.update(docRef, row.firestoreDotNotationUpdate);

    operationCount += 1;

    if (operationCount === 450) {

      batches.push(currentBatch);

      currentBatch = db.batch();

      operationCount = 0;

    }

  }

  if (operationCount > 0) {

    batches.push(currentBatch);

  }

  for (const batch of batches) {

    await batch.commit();

  }

  return {

    batchesCommitted: batches.length,

    documentsUpdated: rowsToApply.length,

  };

}

async function main() {

  console.log('');

  console.log('OBER LEGACYPRINT™ DATA + RESEARCH');

  console.log(PHASE);

  console.log(`Mode: ${APPLY_MODE ? 'APPLY / FIRESTORE WRITE' : 'DRY RUN / READ ONLY'}`);

  console.log(`Collection: ${COLLECTION_NAME}`);

  console.log(`Patch: ${PATCH_PATH}`);

  console.log('');

  ensureDir(OUTPUT_ROOT);

  const patchData = readJson(PATCH_PATH);

  const rows = getPatchRows(patchData);

  const metadataFailures = validatePatchMetadata(patchData, rows);

  const rowFailures = rows.flatMap((row, index) => validatePatchRow(row, index));

  const allPatchFailures = [...metadataFailures, ...rowFailures];

  if (allPatchFailures.length > 0) {

    const failureReport = {

      phase: PHASE,

      generatedAt: new Date().toISOString(),

      applyMode: APPLY_MODE,

      patchPath: PATCH_PATH,

      failures: allPatchFailures,

    };

    const failurePath = path.join(

      OUTPUT_ROOT,

      `ahead-metal-edge-fallback-apply-validation-failed-${new Date()

        .toISOString()

        .replaceAll(':', '-')

        .replaceAll('.', '-')}.json`

    );

    writeJson(failurePath, failureReport);

    console.error('PATCH VALIDATION FAILED');

    console.error(`Failure report: ${failurePath}`);

    console.error('');

    console.error(allPatchFailures.slice(0, 20).join('\n'));

    process.exit(1);

  }

  const companies = [...new Set(rows.map((row) => row.companyName).filter(Boolean))];

  console.log('PATCH VALIDATION PASSED');

  console.table({

    rows: rows.length,

    companies: companies.join(', '),

    applyMode: APPLY_MODE,

    stockHeadFallbackApplied: patchData.stockHeadFallbackApplied === true,

    productionStatusUpdated: patchData.productionStatusUpdated === true,

  });

  initializeFirebaseAdmin();

  const db = admin.firestore();

  const validationRows = await validateAgainstFirestore(db, rows);

  const summary = {

    rows: rows.length,

    documentExists: validationRows.filter((row) => row.documentExists).length,

    missingDocuments: validationRows.filter((row) => !row.documentExists).length,

    companyMatches: validationRows.filter((row) => row.companyMatches).length,

    okToUpdate: validationRows.filter((row) => row.okToUpdate).length,

    notOkToUpdate: validationRows.filter((row) => !row.okToUpdate).length,

    alreadyHadSameFallback: validationRows.filter((row) => row.alreadyHasSameFallback).length,

    needsUpdate: validationRows.filter((row) => row.needsUpdate).length,

  };

  console.log('');

  console.log('FIRESTORE PRECHECK SUMMARY');

  console.table(summary);

  const notOkRows = validationRows.filter((row) => !row.okToUpdate);

  if (notOkRows.length > 0) {

    console.log('');

    console.log('NOT OK TO UPDATE');

    console.table(

      notOkRows.slice(0, 20).map((row) => ({

        id: row.id,

        companyName: row.companyName,

        documentExists: row.documentExists,

        companyMatches: row.companyMatches,

        reason: row.reason,

      }))

    );

  }

  const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');

  const resultJsonPath = path.join(

    OUTPUT_ROOT,

    `ahead-metal-edge-fallback-apply-result-${timestamp}.json`

  );

  const resultCsvPath = path.join(

    OUTPUT_ROOT,

    `ahead-metal-edge-fallback-apply-result-${timestamp}.csv`

  );

  const latestJsonPath = path.join(

    OUTPUT_ROOT,

    'ahead-metal-edge-fallback-apply-result-latest.json'

  );

  const latestCsvPath = path.join(

    OUTPUT_ROOT,

    'ahead-metal-edge-fallback-apply-result-latest.csv'

  );

  let applyResult = {

    batchesCommitted: 0,

    documentsUpdated: 0,

  };

  if (notOkRows.length > 0) {

    const result = {

      phase: PHASE,

      generatedAt: new Date().toISOString(),

      mode: APPLY_MODE ? 'APPLY_ABORTED' : 'DRY_RUN_FAILED_PRECHECK',

      collection: COLLECTION_NAME,

      patchPath: PATCH_PATH,

      firestoreWritesPerformed: false,

      summary,

      applyResult,

      rows: validationRows,

    };

    writeJson(resultJsonPath, result);

    writeJson(latestJsonPath, result);

    writeCsv(resultCsvPath, validationRows);

    writeCsv(latestCsvPath, validationRows);

    console.log('');

    console.log('ABORTED');

    console.log('One or more rows are not safe to update.');

    console.log('');

    console.log('OUTPUT FILES');

    console.log(resultJsonPath);

    console.log(latestJsonPath);

    console.log(resultCsvPath);

    console.log(latestCsvPath);

    process.exit(1);

  }

  if (APPLY_MODE) {

    applyResult = await applyUpdates(db, rows, validationRows);

  }

  const result = {

    phase: PHASE,

    generatedAt: new Date().toISOString(),

    mode: APPLY_MODE ? 'APPLY_COMPLETE' : 'DRY_RUN_COMPLETE',

    collection: COLLECTION_NAME,

    patchPath: PATCH_PATH,

    firestoreWritesPerformed: APPLY_MODE,

    summary,

    applyResult,

    rows: validationRows,

    masterReportBackText: APPLY_MODE

      ? `Phase 3X AHEAD metal edge fallback patch applied. Rows validated: ${rows.length}. Documents updated: ${applyResult.documentsUpdated}. Already had same fallback: ${summary.alreadyHadSameFallback}. Missing documents: ${summary.missingDocuments}. Not ok to update: ${summary.notOkToUpdate}. Only engineAssumptions and engineDerivedFields bearing-edge fallback metadata were written. No stock head fallback was applied. No production status was updated. No shell.bearingEdge field was overwritten. No drum rescoring was performed.`

      : `Phase 3X AHEAD metal edge fallback patch dry run complete. Rows validated: ${rows.length}. OK to update: ${summary.okToUpdate}. Needs update: ${summary.needsUpdate}. Already had same fallback: ${summary.alreadyHadSameFallback}. Missing documents: ${summary.missingDocuments}. Not ok to update: ${summary.notOkToUpdate}. No Firestore writes were performed. Run with --apply to write only engineAssumptions and engineDerivedFields bearing-edge fallback metadata.`,

  };

  writeJson(resultJsonPath, result);

  writeJson(latestJsonPath, result);

  writeCsv(resultCsvPath, validationRows);

  writeCsv(latestCsvPath, validationRows);

  console.log('');

  console.log(

    APPLY_MODE

      ? 'PHASE 3X AHEAD METAL EDGE FALLBACK PATCH APPLY COMPLETE'

      : 'PHASE 3X AHEAD METAL EDGE FALLBACK PATCH DRY RUN COMPLETE'

  );

  console.log('');

  console.log('APPLY RESULT');

  console.table({

    firestoreWritesPerformed: APPLY_MODE,

    batchesCommitted: applyResult.batchesCommitted,

    documentsUpdated: applyResult.documentsUpdated,

    alreadyHadSameFallback: summary.alreadyHadSameFallback,

    needsUpdate: summary.needsUpdate,

  });

  console.log('');

  console.log('OUTPUT FILES');

  console.log(resultJsonPath);

  console.log(latestJsonPath);

  console.log(resultCsvPath);

  console.log(latestCsvPath);

  console.log('');

  console.log('MASTER REPORT-BACK TEXT');

  console.log(result.masterReportBackText);

}

main().catch((error) => {

  console.error('');

  console.error(`${PHASE} FAILED`);

  console.error(error);

  process.exit(1);

});