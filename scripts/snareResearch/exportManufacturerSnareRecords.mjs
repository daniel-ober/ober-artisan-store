// scripts/snareResearch/exportManufacturerSnareRecords.mjs

import fs from 'fs';

import path from 'path';

import admin from 'firebase-admin';

const manufacturer = process.argv[2];

if (!manufacturer) {

  console.error(

    'Usage: node scripts/snareResearch/exportManufacturerSnareRecords.mjs "Tama"'

  );

  process.exit(1);

}

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

const slugify = (value = '') =>

  value

    .toLowerCase()

    .replace(/&/g, 'and')

    .replace(/[^a-z0-9]+/g, '-')

    .replace(/^-|-$/g, '');

const safeText = (value) =>

  typeof value === 'string' ? value.toLowerCase().trim() : '';

const outDir = path.join(process.cwd(), 'data', 'snareResearchExports');

fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(

  outDir,

  `${slugify(manufacturer)}-firestore-export.json`

);

const snapshot = await db

  .collection('snareReferenceDrums')

  .where('companyName', '==', manufacturer)

  .get();

const records = snapshot.docs

  .map((doc) => ({

    id: doc.id,

    ...doc.data(),

  }))

  .sort((a, b) => {

    const lineA = safeText(a.lineSeries);

    const lineB = safeText(b.lineSeries);

    const modelA = safeText(a.modelName);

    const modelB = safeText(b.modelName);

    if (lineA !== lineB) return lineA.localeCompare(lineB);

    return modelA.localeCompare(modelB);

  });

fs.writeFileSync(outPath, JSON.stringify(records, null, 2));

console.log(`Exported ${records.length} ${manufacturer} records`);

console.log(outPath);