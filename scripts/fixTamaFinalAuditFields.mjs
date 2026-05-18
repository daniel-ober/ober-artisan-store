
import admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const snap = await db

  .collection('snareReferenceDrums')

  .where('companyName', '==', 'Tama')

  .get();

let updated = 0;

const normalizeConfidence = (value) => {

  if (!value) return value;

  const v = String(value).trim().toLowerCase();

  if (['high', 'medium', 'low'].includes(v)) return v;

  if (v.includes('high')) return 'high';

  if (v.includes('medium') || v.includes('med')) return 'medium';

  if (v.includes('low')) return 'low';

  return 'medium';

};

for (const doc of snap.docs) {

  const d = doc.data();

  const patch = {};

  patch.voiceScoreConfidence = normalizeConfidence(d.voiceScoreConfidence) || 'medium';

  patch.sourceConfidence = normalizeConfidence(d.sourceConfidence) || 'medium';

  if (!d.snareBedType) {

    patch.snareBedType = 'unknown';

  }

  if (!d.snareBeds) {

    patch.snareBeds = true;

  }

  patch.engineReadinessNotes =

    d.engineReadinessNotes ||

    'Engine-ready schema normalization completed. Unknown values are preserved where source confirmation is not available. Ober node scores remain shell-first and exclude brand prestige, rarity, price, artist association, and collectibility.';

  patch.dataCleanupUpdatedAt = admin.firestore.FieldValue.serverTimestamp();

  patch.dataCleanupUpdatedBy = 'fixTamaFinalAuditFields';

  await doc.ref.update(patch);

  updated++;

}

console.log(`Done. Updated ${updated} Tama records.`);

