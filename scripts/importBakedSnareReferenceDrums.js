// scripts/importBakedSnareReferenceDrums.js

const fs = require('fs');

const admin = require('firebase-admin');

const INPUT_PATH =

  process.argv[2] ||

  'data/firestoreExports/snareReferenceDrums-normalized-full-preview.json';

const SHOULD_WRITE = process.argv.includes('--write');

admin.initializeApp();

const db = admin.firestore();

const rows = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

const run = async () => {

  console.log('LegacyPrint baked snare reference import');

  console.log('Input:', INPUT_PATH);

  console.log('Mode:', SHOULD_WRITE ? 'WRITE' : 'DRY RUN');

  console.log('Docs:', rows.length);

  let count = 0;

  for (const row of rows) {

    const { id, ...data } = row;

    if (!id) {

      throw new Error(`Missing id for row: ${JSON.stringify(row).slice(0, 300)}`);

    }

    count += 1;

    if (!SHOULD_WRITE) continue;

    await db.collection('snareReferenceDrums').doc(id).set(

      {

        ...data,

        id,

        updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      },

      { merge: true }

    );

    if (count % 100 === 0) {

      console.log(`Written ${count}/${rows.length}`);

    }

  }

  console.log(

    SHOULD_WRITE

      ? `Import complete. Written docs: ${count}`

      : `Dry run complete. Would write docs: ${count}`

  );

};

run().catch((error) => {

  console.error(error);

  process.exit(1);

});