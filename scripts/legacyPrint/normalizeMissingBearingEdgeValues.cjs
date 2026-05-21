
const { initializeApp, cert, getApps } = require('firebase-admin/app');

const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('../../serviceAccountKey.json');

if (!getApps().length) {

  initializeApp({ credential: cert(serviceAccount) });

}

const db = getFirestore();

const isMissingEdgeValue = value => {

  const text = String(value ?? '').trim().toLowerCase();

  return (

    text === 'missing' ||

    text === 'missing edge' ||

    text === 'unknown' ||

    text === 'n/a' ||

    text === 'na'

  );

};

(async () => {

  const snap = await db.collection('snareReferenceDrums').limit(3000).get();

  let checked = 0;

  let updated = 0;

  let skipped = 0;

  for (const doc of snap.docs) {

    checked += 1;

    const data = doc.data();

    if (!isMissingEdgeValue(data.bearingEdge)) {

      skipped += 1;

      continue;

    }

    await doc.ref.update({

      bearingEdge: 'unknown',

      bearingEdgeNeedsVerification: true,

      legacyPrintBearingEdgeNormalizeApplied: true,

      legacyPrintBearingEdgeNormalizeAt: FieldValue.serverTimestamp(),

    });

    updated += 1;

    console.log(`NORMALIZED ${doc.id} => bearingEdge: unknown`);

  }

  console.log('\n========================================');

  console.log(JSON.stringify({ checked, updated, skipped }, null, 2));

})();

