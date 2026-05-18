
import admin from 'firebase-admin';

import fs from 'fs';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const patchPath = process.argv[2];

const mode = process.argv[3] || '--dry-run';

if (!patchPath) {

  console.error('Usage: node scripts/validateAndApplySnareResearchPatch.mjs <patch.json> --dry-run|--apply');

  process.exit(1);

}

const data = JSON.parse(fs.readFileSync(patchPath, 'utf8'));

const forbidden = ['RESEARCH_REQUIRED', 'RESEARCH_REQUIRED_TRUE_OR_FALSE', 'RESEARCH_REQUIRED_BUCKET'];

let errors = [];

for (const record of data.records || []) {

  if (!record.id) errors.push('Record missing id');

  for (const [key, value] of Object.entries(record.patch || {})) {

    if (forbidden.includes(value)) {

      errors.push(`${record.id}: ${key} still has placeholder ${value}`);

    }

  }

  if (!['high', 'medium', 'low'].includes(record.patch?.sourceConfidence)) {

    errors.push(`${record.id}: sourceConfidence must be high, medium, or low`);

  }

  if (!['high', 'medium', 'low'].includes(record.patch?.voiceScoreConfidence)) {

    errors.push(`${record.id}: voiceScoreConfidence must be high, medium, or low`);

  }

}

if (errors.length) {

  console.error('Patch validation failed:');

  console.error(errors.join('\n'));

  process.exit(1);

}

console.log(`Patch valid: ${patchPath}`);

console.log(`Records: ${data.records.length}`);

if (mode !== '--apply') {

  console.log('Dry run only. Use --apply to write to Firestore.');

  process.exit(0);

}

for (const record of data.records) {

  await db.collection('snareReferenceDrums').doc(record.id).update({

    ...record.patch,

    dataCleanupUpdatedAt: admin.firestore.FieldValue.serverTimestamp()

  });

  console.log(`Updated ${record.id}`);

}

console.log('Done.');

