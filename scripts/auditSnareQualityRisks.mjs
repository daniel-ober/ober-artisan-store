
import admin from 'firebase-admin';

import fs from 'fs';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const snap = await db.collection('snareReferenceDrums').get();

const risks = [];

const scoreFields = ['attack', 'brightness', 'projection', 'sustain', 'warmth', 'sensitivity', 'control'];

for (const doc of snap.docs) {

  const d = doc.data();

  const flags = [];

  for (const field of scoreFields) {

    const value = d[field];

    if (typeof value !== 'number') flags.push(`${field} is not numeric`);

    if (typeof value === 'number' && (value < 1 || value > 10)) flags.push(`${field} out of 1-10 range`);

  }

  if (d.shellMaterial1 === 'unknown') flags.push('shellMaterial1 unknown');

  if (d.shellConstruction === 'unknown') flags.push('shellConstruction unknown');

  if (d.bearingEdge === 'unknown') flags.push('bearingEdge unknown');

  if (d.hoopType === 'unknown') flags.push('hoopType unknown');

  if (d.shellThicknessMm === 'unknown' || d.shellThicknessMm === null) flags.push('shellThicknessMm unknown');

  if (d.sourceConfidence === 'high' && String(d.primarySourceUrl || '').toLowerCase() === 'unknown') {

    flags.push('high sourceConfidence but primarySourceUrl unknown');

  }

  if (d.voiceScoreConfidence === 'high' && (

    d.shellMaterial1 === 'unknown' ||

    d.shellConstruction === 'unknown' ||

    d.hoopType === 'unknown'

  )) {

    flags.push('high voiceScoreConfidence with unknown core fields');

  }

  const scores = scoreFields.map((field) => d[field]).filter((v) => typeof v === 'number');

  const uniqueScores = new Set(scores.map((v) => Number(v).toFixed(1)));

  if (uniqueScores.size <= 2) flags.push('scores look overly flat / generic');

  if (flags.length) {

    risks.push({

      id: doc.id,

      companyName: d.companyName,

      lineSeries: d.lineSeries,

      modelName: d.modelName,

      shellConstruction: d.shellConstruction,

      shellMaterial1: d.shellMaterial1,

      shellMaterial2: d.shellMaterial2,

      shellThicknessMm: d.shellThicknessMm,

      bearingEdge: d.bearingEdge,

      hoopType: d.hoopType,

      sourceConfidence: d.sourceConfidence,

      voiceScoreConfidence: d.voiceScoreConfidence,

      flags

    });

  }

}

const byCompany = {};

for (const risk of risks) {

  if (!byCompany[risk.companyName]) byCompany[risk.companyName] = 0;

  byCompany[risk.companyName]++;

}

const report = {

  auditedAt: new Date().toISOString(),

  totalDocs: snap.size,

  totalRiskRecords: risks.length,

  byCompany,

  risks

};

fs.writeFileSync('data/snareAuditReports/snare-quality-risk-audit.json', JSON.stringify(report, null, 2));

console.log('Total docs:', snap.size);

console.log('Risk records:', risks.length);

console.table(Object.entries(byCompany).map(([company, count]) => ({ company, count })));

