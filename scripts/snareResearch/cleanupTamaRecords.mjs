// scripts/snareResearch/cleanupTamaRecords.mjs

import admin from 'firebase-admin';

const mode = process.argv[2] || 'preview';

if (!['preview', 'apply'].includes(mode)) {

  console.error('Usage: node scripts/snareResearch/cleanupTamaRecords.mjs preview');

  console.error('Usage: node scripts/snareResearch/cleanupTamaRecords.mjs apply');

  process.exit(1);

}

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

const normalizeUnknown = (value) => {

  if (value === undefined || value === null || value === '') return 'unknown';

  if (typeof value === 'string') {

    const trimmed = value.trim();

    if (!trimmed) return 'unknown';

    const lower = trimmed.toLowerCase();

    if (

      lower === 'unknown unknown' ||

      lower === 'unknown / unknown' ||

      lower === 'n/a' ||

      lower === 'na' ||

      lower === 'none unknown' ||

      lower === 'unknown none'

    ) {

      return 'unknown';

    }

    return trimmed;

  }

  return value;

};

const normalizeConfidence = (value) => {

  if (value === undefined || value === null || value === '') return 'Unknown';

  const lower = String(value).trim().toLowerCase();

  if (lower === 'high') return 'High';

  if (lower === 'medium') return 'Medium';

  if (lower === 'low') return 'Low';

  if (lower === 'medium-high') return 'Medium';

  if (lower === 'high-medium') return 'Medium';

  if (lower === 'unknown') return 'Unknown';

  return 'Unknown';

};

const normalizeBoolish = (value) => {

  if (value === true || value === false) return value;

  if (value === undefined || value === null || value === '') return 'unknown';

  const lower = String(value).trim().toLowerCase();

  if (lower === 'true' || lower === 'yes') return true;

  if (lower === 'false' || lower === 'no') return false;

  if (lower === 'unknown') return 'unknown';

  return value;

};

const dedupeRepeatedPhrase = (value) => {

  if (typeof value !== 'string') return value;

  const trimmed = normalizeUnknown(value);

  if (trimmed === 'unknown') return trimmed;

  const halfLength = Math.floor(trimmed.length / 2);

  const firstHalf = trimmed.slice(0, halfLength).trim();

  const secondHalf = trimmed.slice(halfLength).trim();

  if (firstHalf && firstHalf === secondHalf) {

    return firstHalf;

  }

  const words = trimmed.split(/\s+/);

  const mid = Math.floor(words.length / 2);

  if (words.length >= 4 && words.length % 2 === 0) {

    const left = words.slice(0, mid).join(' ');

    const right = words.slice(mid).join(' ');

    if (left === right) return left;

  }

  return trimmed;

};

const cleanObject = (obj) => {

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const cleaned = {};

  for (const [key, value] of Object.entries(obj)) {

    if (value && typeof value === 'object' && !Array.isArray(value)) {

      cleaned[key] = cleanObject(value);

      continue;

    }

    if (

      key.toLowerCase().includes('confidence') ||

      key === 'sourceConfidence'

    ) {

      cleaned[key] = normalizeConfidence(value);

      continue;

    }

    if (

      key === 'currentlyInProduction' ||

      key === 'artistSignature' ||

      key === 'discontinued' ||

      key === 'rareCollectible' ||

      key === 'reinforcementRings' ||

      key === 'present' ||

      key === 'stock' ||

      key === 'stockHeadsKnown' ||

      key === 'limitedRun'

    ) {

      cleaned[key] = normalizeBoolish(value);

      continue;

    }

    if (

      key === 'make' ||

      key === 'model' ||

      key === 'style' ||

      key === 'notes' ||

      key === 'batterHead' ||

      key === 'resonantHead' ||

      key === 'batterHoopType' ||

      key === 'resonantHoopType' ||

      key === 'lugType' ||

      key === 'modelNumber' ||

      key === 'finishName' ||

      key === 'finishType' ||

      key === 'primarySourceUrl' ||

      key === 'secondarySourceUrl' ||

      key === 'material' ||

      key === 'shellMaterialPrimary' ||

      key === 'shellMaterialSecondary' ||

      key === 'shellMaterialTertiary'

    ) {

      cleaned[key] = dedupeRepeatedPhrase(value);

      continue;

    }

    cleaned[key] = value;

  }

  return cleaned;

};

const snapshot = await db

  .collection('snareReferenceDrums')

  .where('companyName', '==', 'Tama')

  .get();

console.log(`Mode: ${mode}`);

console.log(`Found Tama records: ${snapshot.size}`);

let changedCount = 0;

let unchangedCount = 0;

const batch = db.batch();

let batchOps = 0;

for (const doc of snapshot.docs) {

  const before = doc.data();

  const after = cleanObject(before);

  const beforeJson = JSON.stringify(before);

  const afterJson = JSON.stringify(after);

  if (beforeJson === afterJson) {

    unchangedCount += 1;

    continue;

  }

  changedCount += 1;

  console.log('\n----------------------------------------');

  console.log(`Doc: ${doc.id}`);

  console.log(`${before.lineSeries || 'Unknown'} / ${before.modelName || 'Unknown'}`);

  if (mode === 'apply') {

    batch.set(

      doc.ref,

      {

        ...after,

        dataCleanupUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),

        dataCleanupUpdatedBy: 'cleanupTamaRecords'

      },

      { merge: true }

    );

    batchOps += 1;

  }

}

if (mode === 'apply' && batchOps > 0) {

  await batch.commit();

}

console.log('\n========================================');

console.log(`Mode: ${mode}`);

console.log(`Changed: ${changedCount}`);

console.log(`Unchanged: ${unchangedCount}`);

console.log(`Total: ${snapshot.size}`);

console.log('========================================');