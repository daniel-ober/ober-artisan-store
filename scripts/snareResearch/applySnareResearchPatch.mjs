// scripts/snareResearch/applySnareResearchPatch.mjs

import fs from 'fs';

import path from 'path';

import admin from 'firebase-admin';

const patchFile = process.argv[2];

const mode = process.argv[3] || 'preview';

if (!patchFile) {

  console.error('Usage: node scripts/snareResearch/applySnareResearchPatch.mjs data/snareResearchPatches/tama-pass-1.json preview');

  console.error('Modes: preview | apply');

  process.exit(1);

}

if (!['preview', 'apply'].includes(mode)) {

  console.error('Mode must be preview or apply');

  process.exit(1);

}

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

const patchPath = path.resolve(process.cwd(), patchFile);

if (!fs.existsSync(patchPath)) {

  console.error(`Patch file not found: ${patchPath}`);

  process.exit(1);

}

const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));

const entries = Object.entries(patch);

console.log(`Patch file: ${patchFile}`);

console.log(`Mode: ${mode}`);

console.log(`Docs in patch: ${entries.length}`);

if (!entries.length) {

  console.log('No patch entries found.');

  process.exit(0);

}

let updated = 0;

let missing = 0;

for (const [docId, updates] of entries) {

  const ref = db.collection('snareReferenceDrums').doc(docId);

  const snap = await ref.get();

  if (!snap.exists) {

    missing += 1;

    console.warn(`Missing doc: ${docId}`);

    continue;

  }

  const existing = snap.data();

  console.log('\n----------------------------------------');

  console.log(`Doc: ${docId}`);

  console.log(`Existing: ${existing.companyName || 'Unknown'} / ${existing.lineSeries || 'Unknown'} / ${existing.modelName || 'Unknown'}`);

  console.log(`Patch:    ${updates.companyName || existing.companyName || 'Unknown'} / ${updates.lineSeries || existing.lineSeries || 'Unknown'} / ${updates.modelName || existing.modelName || 'Unknown'}`);

  if (mode === 'apply') {

    await ref.set(

      {

        ...updates,

        researchUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),

        researchUpdatedBy: 'tama-pass-1'

      },

      { merge: true }

    );

    updated += 1;

  }

}

console.log('\n========================================');

console.log(`Mode: ${mode}`);

console.log(`Updated: ${updated}`);

console.log(`Missing: ${missing}`);

console.log(`Reviewed: ${entries.length}`);

console.log('========================================');