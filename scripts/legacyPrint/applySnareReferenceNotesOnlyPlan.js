#!/usr/bin/env node

const fs = require('fs');

const path = require('path');

const PLAN_PATH =

  process.argv.find((arg) => arg.startsWith('--plan='))?.replace('--plan=', '') ||

  'src/legacyPrint/reviewPlans/snare-reference-notes-only-apply-plan-latest.json';

const SERVICE_ACCOUNT_PATH =

  process.argv.find((arg) => arg.startsWith('--serviceAccount='))?.replace('--serviceAccount=', '') ||

  '';

const APPLY = process.argv.includes('--apply');

const VERIFY_FIRESTORE = process.argv.includes('--verifyFirestore') || APPLY;

const CONFIRM =

  process.argv.find((arg) => arg.startsWith('--confirm='))?.replace('--confirm=', '') ||

  '';

const LIMIT_ARG = process.argv.find((arg) => arg.startsWith('--limit='))?.replace('--limit=', '');

const LIMIT = LIMIT_ARG ? Number(LIMIT_ARG) : null;

const COLLECTION = 'snareReferenceDrums';

const REQUIRED_CONFIRM = 'APPLY_NOTES_ONLY';

function fail(message) {

  console.error(`\n❌ ${message}`);

  process.exit(1);

}

function readJson(filePath) {

  if (!fs.existsSync(filePath)) {

    fail(`Missing file: ${filePath}`);

  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));

}

function chunkArray(items, size) {

  const chunks = [];

  for (let i = 0; i < items.length; i += size) {

    chunks.push(items.slice(i, i + size));

  }

  return chunks;

}

function assertPlanShape(plan) {

  if (!plan || typeof plan !== 'object') fail('Plan is not a valid object.');

  if (plan.mode !== 'NOTES_ONLY_APPLY_PLAN_NO_FIRESTORE_WRITES') {

    fail(`Unexpected plan mode: ${plan.mode}`);

  }

  if (plan.firestoreWrites !== false) {

    fail('Plan firestoreWrites must be false.');

  }

  if (plan.rescoring !== false) {

    fail('Plan rescoring must be false.');

  }

  if (!plan.groups || !Array.isArray(plan.groups.notesOnly)) {

    fail('Plan is missing groups.notesOnly.');

  }

  const allowed = new Set(plan.allowedSetKeys || []);

  if (allowed.size !== 1 || !allowed.has('notesOnMissingData')) {

    fail('Notes-only plan must allow only notesOnMissingData.');

  }

  for (const update of plan.groups.notesOnly) {

    const keys = Object.keys(update.set || {});

    if (keys.length !== 1 || keys[0] !== 'notesOnMissingData') {

      fail(`Non-notes-only update found: ${update.id} keys=${keys.join(', ')}`);

    }

    if (!update.id) {

      fail(`Update is missing id: ${JSON.stringify(update).slice(0, 300)}`);

    }

    if (!update.set.notesOnMissingData || typeof update.set.notesOnMissingData !== 'string') {

      fail(`Update has missing/invalid notesOnMissingData: ${update.id}`);

    }

  }

}

function summarize(updates) {

  const byCompany = {};

  const bySourceGroup = {};

  const emptyNotes = [];

  for (const update of updates) {

    byCompany[update.companyName] = (byCompany[update.companyName] || 0) + 1;

    bySourceGroup[update.sourceGroup] = (bySourceGroup[update.sourceGroup] || 0) + 1;

    if (!update.set?.notesOnMissingData || typeof update.set.notesOnMissingData !== 'string') {

      emptyNotes.push(update.id);

    }

  }

  return {

    totalUpdates: updates.length,

    byCompany,

    bySourceGroup,

    emptyNotes

  };

}

function initFirebaseAdmin() {

  if (!SERVICE_ACCOUNT_PATH) {

    fail('Missing --serviceAccount=<path>. Refusing to initialize Firebase Admin without an explicit service account.');

  }

  const absoluteServiceAccountPath = path.resolve(SERVICE_ACCOUNT_PATH);

  const serviceAccount = readJson(absoluteServiceAccountPath);

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {

    fail(`Invalid service account file: ${absoluteServiceAccountPath}`);

  }

  const admin = require('firebase-admin');

  if (!admin.apps.length) {

    admin.initializeApp({

      credential: admin.credential.cert(serviceAccount),

      projectId: serviceAccount.project_id

    });

  }

  console.log('\nFirebase Admin initialized:');

  console.log(JSON.stringify({

    projectId: serviceAccount.project_id,

    clientEmail: serviceAccount.client_email,

    serviceAccountPath: SERVICE_ACCOUNT_PATH

  }, null, 2));

  return admin;

}

async function verifyFirestoreDocs({ db, updates }) {

  const refs = updates.map((update) => db.collection(COLLECTION).doc(update.id));

  const snapshots = [];

  for (const refChunk of chunkArray(refs, 300)) {

    const docs = await db.getAll(...refChunk);

    snapshots.push(...docs);

  }

  const missing = [];

  const existing = [];

  snapshots.forEach((snapshot, index) => {

    const update = updates[index];

    if (!snapshot.exists) {

      missing.push({

        id: update.id,

        label: update.label,

        companyName: update.companyName

      });

    } else {

      existing.push(update.id);

    }

  });

  return {

    expected: updates.length,

    existing: existing.length,

    missing: missing.length,

    missingRecords: missing

  };

}

async function applyNotesOnly({ db, updates }) {

  let written = 0;

  for (const updateChunk of chunkArray(updates, 450)) {

    const batch = db.batch();

    for (const update of updateChunk) {

      const ref = db.collection(COLLECTION).doc(update.id);

      batch.update(ref, {

        notesOnMissingData: update.set.notesOnMissingData

      });

    }

    await batch.commit();

    written += updateChunk.length;

    console.log(`Committed batch. Total written: ${written}/${updates.length}`);

  }

  return written;

}

async function main() {

  const plan = readJson(path.resolve(PLAN_PATH));

  assertPlanShape(plan);

  let updates = plan.groups.notesOnly;

  if (LIMIT != null) {

    if (!Number.isFinite(LIMIT) || LIMIT <= 0) {

      fail(`Invalid --limit value: ${LIMIT_ARG}`);

    }

    updates = updates.slice(0, LIMIT);

  }

  const summary = summarize(updates);

  console.log('\nLEGACYPRINT SNARE REFERENCE NOTES-ONLY APPLY');

  console.log('==================================================');

  console.log('Plan:', PLAN_PATH);

  console.log('Collection:', COLLECTION);

  console.log('Apply flag:', APPLY);

  console.log('Verify Firestore:', VERIFY_FIRESTORE);

  console.log('Limit:', LIMIT ?? 'none');

  console.log('\nSummary:');

  console.log(JSON.stringify(summary, null, 2));

  if (summary.emptyNotes.length) {

    fail(`Found ${summary.emptyNotes.length} updates with missing/invalid notesOnMissingData.`);

  }

  if (!VERIFY_FIRESTORE) {

    console.log('\n✅ Local dry run only. No Firebase Admin initialization. No Firestore reads/writes attempted.');

    console.log('\nTo verify records exist without writing:');

    console.log(`node ${process.argv[1]} --verifyFirestore --serviceAccount=backend/serviceAccountKey-prod.json`);

    process.exit(0);

  }

  const admin = initFirebaseAdmin();

  const db = admin.firestore();

  console.log('\nVerifying Firestore document existence...');

  const verification = await verifyFirestoreDocs({ db, updates });

  console.log('\nFirestore verification:');

  console.log(JSON.stringify({

    expected: verification.expected,

    existing: verification.existing,

    missing: verification.missing,

    missingSample: verification.missingRecords.slice(0, 20)

  }, null, 2));

  if (verification.missing > 0) {

    fail(`Firestore verification failed. Missing records: ${verification.missing}`);

  }

  if (!APPLY) {

    console.log('\n✅ Firestore verification dry run passed. No Firestore writes were attempted.');

    console.log('\nTo apply notes only:');

    console.log(`node ${process.argv[1]} --apply --serviceAccount=backend/serviceAccountKey-prod.json --confirm=${REQUIRED_CONFIRM}`);

    process.exit(0);

  }

  if (CONFIRM !== REQUIRED_CONFIRM) {

    fail(`Apply requested, but confirmation is missing. Required: --confirm=${REQUIRED_CONFIRM}`);

  }

  console.log('\nApplying notesOnMissingData only...');

  const written = await applyNotesOnly({ db, updates });

  console.log('\n✅ Notes-only Firestore apply complete.');

  console.log(JSON.stringify({

    collection: COLLECTION,

    written,

    fieldUpdated: 'notesOnMissingData'

  }, null, 2));

}

main().catch((error) => {

  console.error(error);

  process.exit(1);

});

