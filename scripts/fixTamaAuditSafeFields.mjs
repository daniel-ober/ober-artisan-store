
import admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const snap = await db

  .collection('snareReferenceDrums')

  .where('companyName', '==', 'Tama')

  .get();

let updated = 0;

for (const doc of snap.docs) {

  const d = doc.data();

  const patch = {};

  if (!d.drumType) patch.drumType = 'Snare Drum';

  if (d.voiceScoreConfidence && typeof d.voiceScoreConfidence === 'string') {

    patch.voiceScoreConfidence = d.voiceScoreConfidence.toLowerCase();

  }

  if (d.sourceConfidence && typeof d.sourceConfidence === 'string') {

    patch.sourceConfidence = d.sourceConfidence.toLowerCase();

  }

  if (

    (d.shellThicknessMm === undefined || d.shellThicknessMm === null || d.shellThicknessMm === '') &&

    (d.shell?.construction?.shellThicknessMm !== undefined &&

      d.shell?.construction?.shellThicknessMm !== null &&

      d.shell?.construction?.shellThicknessMm !== '')

  ) {

    patch.shellThicknessMm = d.shell.construction.shellThicknessMm;

  }

  if (

    (d.shellThicknessMm === undefined || d.shellThicknessMm === null || d.shellThicknessMm === '') &&

    d.shellConstruction?.toLowerCase?.() === 'metal'

  ) {

    patch.shellThicknessMm = 'unknown';

  }

  if (

    (d.shellThicknessMm === undefined || d.shellThicknessMm === null || d.shellThicknessMm === '') &&

    d.shellConstruction?.toLowerCase?.() === 'ply'

  ) {

    patch.shellThicknessMm = 'unknown';

  }

  if (Object.keys(patch).length > 0) {

    patch.dataCleanupUpdatedAt = admin.firestore.FieldValue.serverTimestamp();

    patch.dataCleanupUpdatedBy = 'fixTamaAuditSafeFields';

    await doc.ref.update(patch);

    updated++;

    console.log('Updated:', doc.id, patch);

  }

}

console.log(`Done. Updated ${updated} Tama records.`);

