
/* eslint-disable no-console */

import fs from 'fs';

import path from 'path';

import admin from 'firebase-admin';

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const serviceAccount = require('../../serviceAccountKey.json');

if (!admin.apps.length) {

  admin.initializeApp({

    credential: admin.credential.cert(serviceAccount),

    projectId: serviceAccount.project_id,

  });

}

const db = admin.firestore();

const COLLECTION = 'snareReferenceDrums';

function usage() {

  console.log(`

LegacyPrint add snare reference drums from research batch

Usage:

  node scripts/legacyPrint/addSnareReferenceDrumsFromResearchBatch.mjs <path-to-json> [--write] [--force]

Examples:

  node scripts/legacyPrint/addSnareReferenceDrumsFromResearchBatch.mjs data/snareResearchPatches/tama-signature-missing-models-add-pass-1.json

  node scripts/legacyPrint/addSnareReferenceDrumsFromResearchBatch.mjs data/snareResearchPatches/tama-signature-missing-models-add-pass-1.json --write --force

`);

}

function readJson(filePath) {

  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {

    throw new Error(`JSON file not found: ${absolutePath}`);

  }

  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

}

function slugify(value) {

  return String(value || '')

    .trim()

    .toLowerCase()

    .replace(/&/g, 'and')

    .replace(/ø/g, 'o')

    .replace(/[^a-z0-9]+/g, '-')

    .replace(/^-+|-+$/g, '');

}

function normalizeSizeValue(value) {

  if (value === undefined || value === null || value === '') return '';

  return String(value).replace('.', '-');

}

function buildFallbackId(record) {

  const company = slugify(record.companyName || record.company || 'unknown-company');

  const line = slugify(record.lineSeries || record.line || 'unknown-line');

  const model = slugify(record.modelName || record.model || 'unknown-model');

  const diameter = normalizeSizeValue(record.diameter);

  const depth = normalizeSizeValue(record.depth);

  const construction = slugify(

    record.shell?.construction ||

      record.shell?.shellConstruction ||

      record.shellConstruction ||

      'unknown-construction'

  );

  const material = slugify(

    record.shell?.material1 ||

      record.shell?.shellMaterial1 ||

      record.material1 ||

      'unknown-material'

  );

  const size = diameter && depth ? `${diameter}x${depth}` : 'unknown-size';

  return `${company}_${line}_${model}_${size}_${construction}_${material}`;

}

function isPlainObject(value) {

  return value && typeof value === 'object' && !Array.isArray(value);

}

function stripUndefinedDeep(value) {

  if (Array.isArray(value)) {

    return value.map(stripUndefinedDeep);

  }

  if (!isPlainObject(value)) {

    return value;

  }

  return Object.entries(value).reduce((acc, [key, entry]) => {

    if (entry === undefined) return acc;

    acc[key] = stripUndefinedDeep(entry);

    return acc;

  }, {});

}

function ensureCoreRecordShape(rawRecord, batch = {}) {

  const record = stripUndefinedDeep({ ...rawRecord });

  const companyName = record.companyName || batch.companyName || batch.company || 'Unknown';

  const lineSeries = record.lineSeries || batch.lineSeries || batch.line || 'Unknown';

  record.companyName = companyName;

  record.lineSeries = lineSeries;

  record.shell = {

    ...(record.shell || {}),

  };

  record.hardware = {

    ...(record.hardware || {}),

  };

  record.sources = {

    ...(record.sources || {}),

  };

  record.notes = {

    ...(record.notes || {}),

  };

  if (!record.notes.researchStatus) {

    record.notes.researchStatus = batch.researchStatus || 'researched';

  }

  if (!record.notes.researchedBy) {

    record.notes.researchedBy = 'company-line-batch';

  }

  if (!record.createdAt) {

    record.createdAt = admin.firestore.FieldValue.serverTimestamp();

  }

  record.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  return record;

}

function extractRecordsFromPatchGroups(batch) {

  if (!Array.isArray(batch.patchGroups)) return [];

  return batch.patchGroups

    .map((group) => {

      const candidate =

        group.record ||

        group.newRecord ||

        group.addRecord ||

        group.drum ||

        group.patch;

      if (!candidate || !isPlainObject(candidate)) return null;

      const target = isPlainObject(group.target) ? group.target : {};

      return {

        ...candidate,

        ...target,

        modelName:

          candidate.modelName ||

          target.modelName ||

          group.modelName ||

          group.groupName ||

          'Unknown Model',

      };

    })

    .filter(Boolean);

}

function extractRecords(batch) {

  if (Array.isArray(batch.records)) return batch.records;

  if (Array.isArray(batch.drums)) return batch.drums;

  if (Array.isArray(batch.newRecords)) return batch.newRecords;

  if (Array.isArray(batch.addRecords)) return batch.addRecords;

  if (Array.isArray(batch.recordsToAdd)) return batch.recordsToAdd;

  if (Array.isArray(batch.drumsToAdd)) return batch.drumsToAdd;

  return extractRecordsFromPatchGroups(batch);

}

function summarizeRecord(record) {

  const shell = record.shell || {};

  const hardware = record.hardware || {};

  return {

    id: record.id || buildFallbackId(record),

    companyName: record.companyName,

    lineSeries: record.lineSeries,

    modelName: record.modelName,

    diameter: record.diameter,

    depth: record.depth,

    shellConstruction: shell.construction || shell.shellConstruction || '',

    material1: shell.material1 || shell.shellMaterial1 || '',

    material2: shell.material2 || shell.shellMaterial2 || '',

    material3: shell.material3 || shell.shellMaterial3 || '',

    thicknessMm: shell.thicknessMm ?? '',

    bearingEdge: shell.bearingEdge || '',

    hoopRimType: shell.hoopRimType || hardware.hoopRimType || '',

  };

}

async function main() {

  const [, , jsonPath, ...args] = process.argv;

  if (!jsonPath || args.includes('--help')) {

    usage();

    process.exit(jsonPath ? 0 : 1);

  }

  const shouldWrite = args.includes('--write');

  const force = args.includes('--force');

  if (shouldWrite && !force) {

    throw new Error('Refusing to write without --force. Re-run with --write --force after reviewing dry run.');

  }

  const batch = readJson(jsonPath);

  const records = extractRecords(batch);

  console.log('\nLegacyPrint add snare reference drums from research batch');

  console.log(`Batch: ${jsonPath}`);

  console.log(`Company: ${batch.companyName || batch.company || 'Unknown'}`);

  console.log(`Line: ${batch.lineSeries || batch.line || 'Unknown'}`);

  console.log(`Mode: ${shouldWrite ? 'WRITE' : 'DRY RUN'}`);

  console.log(`Candidate records: ${records.length}`);

  if (!records.length) {

    console.log('\nNo addable records found.');

    console.log('Expected one of these shapes: records[], drums[], newRecords[], addRecords[], recordsToAdd[], drumsToAdd[], or patchGroups[] with record/newRecord/addRecord/drum/patch.');

    process.exit(0);

  }

  let wouldCreate = 0;

  let created = 0;

  let skippedExisting = 0;

  let invalid = 0;

  const report = [];

  for (const rawRecord of records) {

    const record = ensureCoreRecordShape(rawRecord, batch);

    const id = record.id || buildFallbackId(record);

    if (!record.modelName) {

      invalid += 1;

      report.push({

        id,

        status: 'invalid',

        reason: 'Missing modelName',

        record: summarizeRecord(record),

      });

      console.log(`\nInvalid record skipped: ${id}`);

      console.log('- missing modelName');

      continue;

    }

    record.id = id;

    const docRef = db.collection(COLLECTION).doc(id);

    const existingSnap = await docRef.get();

    if (existingSnap.exists) {

      skippedExisting += 1;

      report.push({

        id,

        status: 'skipped-existing',

        record: summarizeRecord(record),

      });

      console.log(`\nSkipping existing: ${record.modelName}`);

      console.log(`- id: ${id}`);

      continue;

    }

    wouldCreate += 1;

    report.push({

      id,

      status: shouldWrite ? 'created' : 'would-create',

      record: summarizeRecord(record),

    });

    console.log(`\n${shouldWrite ? 'Creating' : 'Would create'}: ${record.modelName}`);

    console.log(`- id: ${id}`);

    console.log(`- size: ${record.diameter || '?'}x${record.depth || '?'}`);

    console.log(`- company/line: ${record.companyName} / ${record.lineSeries}`);

    console.log(`- shell: ${record.shell?.construction || record.shell?.shellConstruction || 'unknown'} | ${record.shell?.material1 || 'unknown'} | ${record.shell?.thicknessMm ?? 'unknown'}mm`);

    if (shouldWrite) {

      await docRef.set(record, { merge: false });

      created += 1;

    }

  }

  const reportDir = path.resolve(process.cwd(), 'snarePatchApplyReports');

  if (!fs.existsSync(reportDir)) {

    fs.mkdirSync(reportDir, { recursive: true });

  }

  const patchBaseName = path.basename(jsonPath, path.extname(jsonPath));

  const reportPath = path.join(

    reportDir,

    `${patchBaseName}-${shouldWrite ? 'write' : 'dry-run'}-${Date.now()}.json`

  );

  fs.writeFileSync(

    reportPath,

    JSON.stringify(

      {

        batch: jsonPath,

        collection: COLLECTION,

        mode: shouldWrite ? 'WRITE' : 'DRY RUN',

        candidateRecords: records.length,

        wouldCreate,

        created,

        skippedExisting,

        invalid,

        report,

      },

      null,

      2

    )

  );

  console.log('\nAdd batch complete.');

  console.log(`Candidate records: ${records.length}`);

  console.log(`Would create: ${wouldCreate}`);

  console.log(`Created: ${created}`);

  console.log(`Skipped existing: ${skippedExisting}`);

  console.log(`Invalid: ${invalid}`);

  console.log(`Report: ${reportPath}`);

  if (!shouldWrite) {

    console.log('\nDry run only. No Firestore documents were changed.');

    console.log('To write after reviewing the report:');

    console.log(`node scripts/legacyPrint/addSnareReferenceDrumsFromResearchBatch.mjs ${jsonPath} --write --force`);

  }

}

main()

  .then(() => process.exit(0))

  .catch((error) => {

    console.error(error);

    process.exit(1);

  });

