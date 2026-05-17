
// scripts/legacyPrint/applySnarePatch.mjs

import fs from 'fs';

import path from 'path';

import process from 'process';

import { createRequire } from 'module';

import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

const admin = require('firebase-admin');

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../..');

const SERVICE_ACCOUNT_PATH = path.resolve(ROOT_DIR, 'serviceAccountKey.json');

const REPORT_DIR = path.resolve(ROOT_DIR, 'snarePatchApplyReports');

const args = process.argv.slice(2);

const patchPathArg = args.find((arg) => !arg.startsWith('--'));

const SHOULD_WRITE = args.includes('--write');

const FORCE = args.includes('--force');

function usage() {

  console.log(`

Usage:

  node scripts/legacyPrint/applySnarePatch.mjs data/snareResearchPatches/example.json

Dry run is default.

Write mode:

  node scripts/legacyPrint/applySnarePatch.mjs data/snareResearchPatches/example.json --write --force

Supported patch group shapes:

1. Legacy:

  {

    "matchModelNames": ["Model Name"],

    "updates": { "shell": {}, "hardware": {}, "notes": {} }

  }

2. New scalable:

  {

    "target": {

      "modelName": "Model Name",

      "modelNameIncludes": "Bubinga",

      "modelNameIncludesAny": ["Bubinga", "Walnut/Birch"],

      "diameter": 14,

      "depth": 6.5

    },

    "patch": { "shell": {}, "hardware": {}, "notes": {} }

  }

`);

}

function readJson(filePath) {

  if (!fs.existsSync(filePath)) {

    throw new Error(`File not found: ${filePath}`);

  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function initFirebase() {

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {

    throw new Error(`Missing service account key: ${SERVICE_ACCOUNT_PATH}`);

  }

  if (admin.apps.length) return admin.firestore();

  const serviceAccount = require(SERVICE_ACCOUNT_PATH);

  admin.initializeApp({

    credential: admin.credential.cert(serviceAccount),

    projectId: serviceAccount.project_id,

  });

  return admin.firestore();

}

function normalizeText(value = '') {

  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');

}

function isPlainObject(value) {

  return (

    value &&

    typeof value === 'object' &&

    !Array.isArray(value) &&

    !(value instanceof Date)

  );

}

function flattenUpdateObject(input, prefix = '', output = {}) {

  Object.entries(input || {}).forEach(([key, value]) => {

    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (value === undefined) return;

    if (isPlainObject(value)) {

      flattenUpdateObject(value, fieldPath, output);

      return;

    }

    output[fieldPath] = value;

  });

  return output;

}

function getNestedValue(obj, dottedPath) {

  return dottedPath.split('.').reduce((acc, key) => {

    if (!acc || typeof acc !== 'object') return undefined;

    return acc[key];

  }, obj);

}

function valuesAreEqual(currentValue, nextValue) {

  return JSON.stringify(currentValue) === JSON.stringify(nextValue);

}

function formatPreviewValue(value) {

  if (value === undefined) return 'undefined';

  if (value === null) return 'null';

  if (isPlainObject(value) || Array.isArray(value)) {

    return JSON.stringify(value, null, 2);

  }

  return String(value);

}

function normalizeGroupToMatcher(group = {}) {

  const target = group.target && typeof group.target === 'object'

    ? group.target

    : {};

  const matchModelNames = Array.isArray(group.matchModelNames)

    ? group.matchModelNames

    : [];

  const updatesSource = group.updates && typeof group.updates === 'object'

    ? group.updates

    : group.patch && typeof group.patch === 'object'

      ? group.patch

      : {};

  const match = {

    companyName: target.companyName || target.company || group.companyName || null,

    lineSeries: target.lineSeries || group.lineSeries || null,

    modelName: target.modelName || null,

    matchModelNames,

    modelNameIncludes: target.modelNameIncludes || null,

    modelNameIncludesAny: Array.isArray(target.modelNameIncludesAny)

      ? target.modelNameIncludesAny

      : [],

    diameter: target.diameter ?? null,

    depth: target.depth ?? null,

    id: target.id || null,

  };

  return {

    groupName: group.groupName || target.modelName || matchModelNames.join(', ') || 'Unnamed Patch Group',

    match,

    updates: flattenUpdateObject(updatesSource),

    sourceShape: group.updates ? 'legacy-matchModelNames-updates' : 'target-patch',

  };

}

function buildPatchGroups(patch) {

  if (!Array.isArray(patch.patchGroups)) {

    throw new Error('Patch does not contain patchGroups array.');

  }

  if (!patch.companyName) {

    throw new Error('Patch is missing top-level companyName.');

  }

  if (!patch.lineSeries) {

    throw new Error('Patch is missing top-level lineSeries.');

  }

  const groups = patch.patchGroups.map((group) => {

    const normalized = normalizeGroupToMatcher({

      ...group,

      companyName: patch.companyName,

      lineSeries: patch.lineSeries,

    });

    normalized.match.companyName = normalized.match.companyName || patch.companyName;

    normalized.match.lineSeries = normalized.match.lineSeries || patch.lineSeries;

    return normalized;

  });

  const usableGroups = groups.filter((group) => {

    const hasUpdates = Object.keys(group.updates).length > 0;

    const hasExactModel =

      group.match.modelName ||

      group.match.matchModelNames.length > 0 ||

      group.match.id;

    const hasFlexibleModel =

      group.match.modelNameIncludes ||

      group.match.modelNameIncludesAny.length > 0 ||

      group.match.diameter !== null ||

      group.match.depth !== null;

    return hasUpdates && (hasExactModel || hasFlexibleModel);

  });

  if (!usableGroups.length) {

    throw new Error('Patch has no usable patchGroups. Expected updates/patch plus matchModelNames or target criteria.');

  }

  return usableGroups;

}

function recordMatchesGroup(record, group) {

  const match = group.match;

  const recordCompany = normalizeText(record.companyName || record.company);

  const recordLine = normalizeText(record.lineSeries);

  const recordModel = normalizeText(record.modelName);

  const recordId = normalizeText(record.id);

  if (match.companyName && recordCompany !== normalizeText(match.companyName)) {

    return false;

  }

  if (match.lineSeries && recordLine !== normalizeText(match.lineSeries)) {

    return false;

  }

  if (match.id && recordId !== normalizeText(match.id)) {

    return false;

  }

  if (match.modelName && recordModel !== normalizeText(match.modelName)) {

    return false;

  }

  if (match.matchModelNames.length) {

    const modelSet = match.matchModelNames.map(normalizeText);

    if (!modelSet.includes(recordModel)) return false;

  }

  if (match.modelNameIncludes) {

    if (!recordModel.includes(normalizeText(match.modelNameIncludes))) {

      return false;

    }

  }

  if (match.modelNameIncludesAny.length) {

    const hasAny = match.modelNameIncludesAny.some((needle) => {

      return recordModel.includes(normalizeText(needle));

    });

    if (!hasAny) return false;

  }

  if (match.diameter !== null && Number(record.diameter) !== Number(match.diameter)) {

    return false;

  }

  if (match.depth !== null && Number(record.depth) !== Number(match.depth)) {

    return false;

  }

  return true;

}

async function fetchCandidateRecords(db, patch) {

  const snapshot = await db

    .collection('snareReferenceDrums')

    .where('companyName', '==', patch.companyName)

    .where('lineSeries', '==', patch.lineSeries)

    .get();

  return snapshot.docs.map((doc) => ({

    id: doc.id,

    ref: doc.ref,

    data: doc.data(),

  }));

}

function buildReportName(patch, mode) {

  const safeCompany = normalizeText(patch.companyName).replace(/[^a-z0-9]+/g, '-');

  const safeLine = normalizeText(patch.lineSeries).replace(/[^a-z0-9]+/g, '-');

  const patchName = patch.patchName

    ? normalizeText(patch.patchName).replace(/[^a-z0-9]+/g, '-')

    : `${safeCompany}-${safeLine}`;

  return `${patchName}-${mode}-${Date.now()}.json`;

}

async function main() {

  if (!patchPathArg) {

    usage();

    process.exit(1);

  }

  const patchPath = path.resolve(ROOT_DIR, patchPathArg);

  const patch = readJson(patchPath);

  if (patch.doNotApplyAutomatically && !FORCE) {

    throw new Error('Patch has doNotApplyAutomatically=true. Re-run with --force after review.');

  }

  const patchGroups = buildPatchGroups(patch);

  const db = initFirebase();

  const candidates = await fetchCandidateRecords(db, patch);

  const matchedDocIds = new Set();

  const duplicateMatches = [];

  const unmatchedGroups = [];

  const operations = [];

  patchGroups.forEach((group) => {

    const matches = candidates.filter((candidate) => {

      return recordMatchesGroup(

        {

          id: candidate.id,

          ...candidate.data,

        },

        group

      );

    });

    if (!matches.length) {

      unmatchedGroups.push({

        groupName: group.groupName,

        match: group.match,

      });

      return;

    }

    matches.forEach((candidate) => {

      const duplicateKey = `${candidate.id}:${group.groupName}`;

      if (matchedDocIds.has(duplicateKey)) {

        duplicateMatches.push({

          groupName: group.groupName,

          documentId: candidate.id,

          modelName: candidate.data.modelName,

        });

        return;

      }

      matchedDocIds.add(duplicateKey);

      const fieldChanges = [];

      Object.entries(group.updates).forEach(([fieldPath, nextValue]) => {

        const currentValue = getNestedValue(candidate.data, fieldPath);

        if (!valuesAreEqual(currentValue, nextValue)) {

          fieldChanges.push({

            fieldPath,

            currentValue,

            nextValue,

          });

        }

      });

      operations.push({

        groupName: group.groupName,

        sourceShape: group.sourceShape,

        documentId: candidate.id,

        modelName: candidate.data.modelName,

        ref: candidate.ref,

        updates: group.updates,

        fieldChanges,

      });

    });

  });

  const operationsWithChanges = operations.filter((operation) => {

    return operation.fieldChanges.length > 0;

  });

  console.log('');

  console.log('LegacyPrint scalable snare patch apply');

  console.log(`Patch: ${patchPathArg}`);

  console.log(`Company: ${patch.companyName}`);

  console.log(`Line: ${patch.lineSeries}`);

  console.log(`Mode: ${SHOULD_WRITE ? 'WRITE' : 'DRY RUN'}`);

  console.log(`Patch groups: ${patchGroups.length}`);

  console.log(`Candidate records: ${candidates.length}`);

  console.log('');

  operations.forEach((operation) => {

    if (!operation.fieldChanges.length) {

      console.log(`No changes needed: ${operation.modelName}`);

      return;

    }

    console.log(`${SHOULD_WRITE ? 'Updating' : 'Would update'}: ${operation.modelName}`);

    operation.fieldChanges.forEach((change) => {

      console.log(`- ${change.fieldPath}`);

      console.log(`  current: ${formatPreviewValue(change.currentValue)}`);

      console.log(`  next:    ${formatPreviewValue(change.nextValue)}`);

    });

    console.log('');

  });

  if (SHOULD_WRITE) {

    for (const operation of operationsWithChanges) {

      await operation.ref.update(operation.updates);

    }

  }

  const report = {

    generatedAt: new Date().toISOString(),

    patchPath,

    companyName: patch.companyName,

    lineSeries: patch.lineSeries,

    mode: SHOULD_WRITE ? 'write' : 'dry-run',

    patchGroups: patchGroups.map((group) => ({

      groupName: group.groupName,

      sourceShape: group.sourceShape,

      match: group.match,

      updates: group.updates,

    })),

    candidateRecordCount: candidates.length,

    matchedOperations: operations.map((operation) => ({

      groupName: operation.groupName,

      sourceShape: operation.sourceShape,

      documentId: operation.documentId,

      modelName: operation.modelName,

      fieldChanges: operation.fieldChanges,

    })),

    unmatchedGroups,

    duplicateMatches,

    writtenUpdates: SHOULD_WRITE ? operationsWithChanges.length : 0,

  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const reportPath = path.resolve(

    REPORT_DIR,

    buildReportName(patch, SHOULD_WRITE ? 'write' : 'dry-run')

  );

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('Patch apply complete.');

  console.log(`Matched operations: ${operations.length}`);

  console.log(`Operations with changes: ${operationsWithChanges.length}`);

  console.log(`Unmatched groups: ${unmatchedGroups.length}`);

  console.log(`Duplicate matches skipped: ${duplicateMatches.length}`);

  console.log(`Written updates: ${SHOULD_WRITE ? operationsWithChanges.length : 0}`);

  console.log(`Report: ${reportPath}`);

  if (!SHOULD_WRITE) {

    console.log('');

    console.log('Dry run only. No Firestore documents were changed.');

    console.log('To write after reviewing the report:');

    console.log(`node scripts/legacyPrint/applySnarePatch.mjs ${patchPathArg} --write --force`);

  }

}

main().catch((error) => {

  console.error('');

  console.error('Patch apply failed:');

  console.error(error);

  process.exit(1);

});

