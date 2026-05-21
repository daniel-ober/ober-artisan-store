
const { initializeApp, cert, getApps } = require('firebase-admin/app');

const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('../../serviceAccountKey.json');

if (!getApps().length) {

  initializeApp({ credential: cert(serviceAccount) });

}

const db = getFirestore();

const toThicknessMm = value => {

  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const match = String(value ?? '').match(/-?\d+(\.\d+)?/);

  if (!match) return null;

  const parsed = Number(match[0]);

  return Number.isFinite(parsed) ? parsed : null;

};

(async () => {

  const snap = await db.collection('snareReferenceDrums').limit(3000).get();

  let checked = 0;

  let updated = 0;

  let skipped = 0;

  for (const doc of snap.docs) {

    checked += 1;

    const data = doc.data();

    const existing = toThicknessMm(data.shellThicknessMm);

    const fromShellThickness = toThicknessMm(data.shellThickness);

    if (existing || !fromShellThickness) {

      skipped += 1;

      continue;

    }

    await doc.ref.update({

      shellThicknessMm: fromShellThickness,

      legacyPrintThicknessBackfillApplied: true,

      legacyPrintThicknessBackfillSource: 'shellThickness',

      legacyPrintThicknessBackfillAt: FieldValue.serverTimestamp(),

    });

    updated += 1;

    console.log(`UPDATED ${doc.id} => shellThicknessMm: ${fromShellThickness}`);

  }

  console.log('\n========================================');

  console.log(JSON.stringify({ checked, updated, skipped }, null, 2));

})();

