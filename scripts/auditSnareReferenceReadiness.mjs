
import admin from 'firebase-admin';

import fs from 'fs';

const COMPANIES = [

  'A&F Drum Co.','AHEAD','Brady Drum Company','Brooks Drum Co.','C&C Drums USA',

  'Canopus','Craviotto','Dunnett Classic Drums','DW','PDP','Gretsch','Hendrix Drums',

  'INDe Drum Lab','Joyful Noise Drum Company','Keplinger','Ludwig','Mapex',

  'Noble & Cooley','Oriollo','Pearl','Philly Drum Co.','Pork Pie Percussion',

  'Premier','Q Drum Co.','Rogers','Seven Six Drum Company','Slingerland','SONOR',

  'Spaun Drum Company','Sugar Percussion','Tama','WorldMax','Yamaha'

];

const REQUIRED = [

  'companyName','lineSeries','modelName','drumType','diameter','depth',

  'shellConstruction','shellMaterial1','shellThicknessMm','bearingEdge',

  'reinforcementRings','snareBeds','snareBedType','hoopType',

  'sourceConfidence','voiceScoreConfidence','scoringBasis',

  'attack','brightness','projection','sustain','warmth','sensitivity','control'

];

const VALID_CONFIDENCE = ['high', 'medium', 'low'];

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const snap = await db.collection('snareReferenceDrums').get();

const report = {

  totalDocs: snap.size,

  auditedAt: new Date().toISOString(),

  companies: {},

  badRecords: []

};

for (const name of COMPANIES) {

  report.companies[name] = {

    total: 0,

    engineReady: 0,

    needsResearch: 0,

    missingRequiredCount: 0,

    invalidConfidenceCount: 0,

    missingScoresCount: 0,

    examplesNeedingWork: []

  };

}

for (const doc of snap.docs) {

  const d = doc.data();

  const company = d.companyName || 'UNKNOWN';

  if (!report.companies[company]) {

    report.companies[company] = {

      total: 0,

      engineReady: 0,

      needsResearch: 0,

      missingRequiredCount: 0,

      invalidConfidenceCount: 0,

      missingScoresCount: 0,

      examplesNeedingWork: []

    };

  }

  const bucket = report.companies[company];

  bucket.total++;

  const missingRequired = REQUIRED.filter((field) => {

    const value = d[field];

    return value === undefined || value === null || value === '';

  });

  const missingScores = ['attack','brightness','projection','sustain','warmth','sensitivity','control']

    .filter((field) => typeof d[field] !== 'number');

  const conflicts = [];

  if (d.voiceScoreConfidence && !VALID_CONFIDENCE.includes(String(d.voiceScoreConfidence).toLowerCase())) {

    conflicts.push('INVALID: voiceScoreConfidence must be high, medium, or low');

  }

  if (d.sourceConfidence && !VALID_CONFIDENCE.includes(String(d.sourceConfidence).toLowerCase())) {

    conflicts.push('INVALID: sourceConfidence must be high, medium, or low');

  }

  const engineReady =

    missingRequired.length === 0 &&

    missingScores.length === 0 &&

    conflicts.length === 0 &&

    d.needsResearch !== true;

  if (engineReady) bucket.engineReady++;

  if (d.needsResearch === true) bucket.needsResearch++;

  if (missingRequired.length) bucket.missingRequiredCount++;

  if (missingScores.length) bucket.missingScoresCount++;

  if (conflicts.length) bucket.invalidConfidenceCount++;

  if (!engineReady) {

    const item = {

      id: doc.id,

      companyName: company,

      lineSeries: d.lineSeries || 'unknown',

      modelName: d.modelName || 'unknown',

      missingRequired,

      missingScores,

      conflicts,

      needsResearch: d.needsResearch === true

    };

    report.badRecords.push(item);

    if (bucket.examplesNeedingWork.length < 10) {

      bucket.examplesNeedingWork.push(item);

    }

  }

}

const out = 'data/snareAuditReports/snare-readiness-audit.json';

fs.writeFileSync(out, JSON.stringify(report, null, 2));

console.log(`Audited ${report.totalDocs} snare records`);

console.log(`Bad / incomplete records: ${report.badRecords.length}`);

console.log(`Report written to: ${out}`);

console.table(

  Object.entries(report.companies)

    .filter(([, v]) => v.total > 0)

    .map(([company, v]) => ({

      company,

      total: v.total,

      engineReady: v.engineReady,

      needsResearch: v.needsResearch,

      missingRequired: v.missingRequiredCount,

      missingScores: v.missingScoresCount,

      invalidConfidence: v.invalidConfidenceCount

    }))

);

