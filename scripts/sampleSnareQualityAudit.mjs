
import admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const snap = await db.collection('snareReferenceDrums').get();

const byCompany = {};

for (const doc of snap.docs) {

  const d = doc.data();

  const company = d.companyName || 'UNKNOWN';

  if (!byCompany[company]) byCompany[company] = [];

  byCompany[company].push({ id: doc.id, ...d });

}

for (const [company, records] of Object.entries(byCompany).sort()) {

  const sample = records

    .slice()

    .sort((a, b) => String(a.modelName || '').localeCompare(String(b.modelName || '')))

    .slice(0, 3)

    .map((d) => ({

      id: d.id,

      modelName: d.modelName,

      shellConstruction: d.shellConstruction,

      shellMaterial1: d.shellMaterial1,

      shellMaterial2: d.shellMaterial2,

      shellThicknessMm: d.shellThicknessMm,

      hoopType: d.hoopType,

      sourceConfidence: d.sourceConfidence,

      voiceScoreConfidence: d.voiceScoreConfidence,

      scores: {

        attack: d.attack,

        brightness: d.brightness,

        projection: d.projection,

        sustain: d.sustain,

        warmth: d.warmth,

        sensitivity: d.sensitivity,

        control: d.control

      },

      scoringBasis: d.scoringBasis

    }));

  console.log('\n==============================');

  console.log(company);

  console.log('Total:', records.length);

  console.log(JSON.stringify(sample, null, 2));

}

