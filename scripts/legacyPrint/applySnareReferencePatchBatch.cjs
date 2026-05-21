const admin = require('firebase-admin');

const fs = require('fs');

const patchFile = process.argv[2];

const mode = process.argv.includes('--write') ? 'write' : 'dry-run';

if (!patchFile) {

  console.error('Usage: node scripts/legacyPrint/applySnareReferencePatchBatch.cjs <patch-file> [--write]');

  process.exit(1);

}

const patches = JSON.parse(fs.readFileSync(patchFile, 'utf8'));

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

const COLLECTION = 'snareReferenceDrums';

function flattenUpdateObject(obj, prefix = '', out = {}) {

  Object.entries(obj || {}).forEach(([key, value]) => {

    const path = prefix ? `${prefix}.${key}` : key;

    if (

      value &&

      typeof value === 'object' &&

      !Array.isArray(value) &&

      !(value instanceof Date)

    ) {

      flattenUpdateObject(value, path, out);

    } else {

      out[path] = value;

    }

  });

  return out;

}

async function main() {

  console.log(`Patch file: ${patchFile}`);

  console.log(`Mode: ${mode}`);

  console.log(`Research session: ${patches.researchSession}`);

  console.log(`Patch count: ${patches.patches.length}`);

  let checked = 0;

  let written = 0;

  let skipped = 0;

  for (const patch of patches.patches) {

    checked += 1;

    if (!patch.id) {

      console.warn(`SKIP: Missing id for patch`, patch.match || {});

      skipped += 1;

      continue;

    }

    const ref = db.collection(COLLECTION).doc(patch.id);

    const snap = await ref.get();

    if (!snap.exists) {

      console.warn(`SKIP: Doc not found: ${patch.id}`);

      skipped += 1;

      continue;

    }

    const current = snap.data();

    const updatePayload = flattenUpdateObject({

      ...patch.updates,

      legacyPrintLastResearchSession: patches.researchSession,

      legacyPrintLastResearchUpdatedAt: admin.firestore.FieldValue.serverTimestamp()

    });

    console.log('\n----------------------------------------');

    console.log(`DOC: ${patch.id}`);

    console.log(`Current: ${current.companyName || current.company} / ${current.lineSeries || ''} / ${current.modelName || ''}`);

    console.log('Update payload:');

    console.log(JSON.stringify(updatePayload, null, 2));

    if (mode === 'write') {

      await ref.update(updatePayload);

      written += 1;

      console.log('WRITE: complete');

    } else {

      console.log('DRY RUN: no write');

    }

  }

  console.log('\n========================================');

  console.log(JSON.stringify({

    collection: COLLECTION,

    researchSession: patches.researchSession,

    mode,

    checked,

    written,

    skipped

  }, null, 2));

}

main().catch((error) => {

  console.error(error);

  process.exit(1);

});