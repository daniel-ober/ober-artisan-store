
import admin from 'firebase-admin';

import fs from 'fs';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const isKnown = (v) =>

  v !== undefined &&

  v !== null &&

  v !== '' &&

  String(v).trim().toLowerCase() !== 'unknown' &&

  String(v).trim().toLowerCase() !== 'n/a';

const isBool = (v) => typeof v === 'boolean';

const get = (obj, path) =>

  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

const requiredCore = [

  ['shellConstruction', ['shellConstruction', 'shell.construction.shellConstruction']],

  ['shellMaterial1', ['shellMaterial1', 'shell.construction.shellMaterialPrimary']],

  ['diameter', ['diameter', 'shell.dimensions.diameterInches']],

  ['depth', ['depth', 'shell.dimensions.depthInches']],

  ['shellThicknessMm', ['shellThicknessMm', 'shell.construction.shellThicknessMm']],

  ['bearingEdge', ['bearingEdge', 'shell.bearingEdges.batterSideProfile', 'shell.bearingEdges.snareSideProfile']],

  ['reinforcementRings', ['reinforcementRings', 'shell.construction.reinforcementRings']],

  ['snareBeds', ['snareBeds', 'shell.snareBeds.present']],

  ['snareBedType', ['snareBedType', 'shell.snareBeds.depthBucket', 'shell.snareBeds.bedStyle']]

];

const requiredStock = [

  ['hoopType', ['hoopType', 'stockHardware.hoops.batterHoopType', 'stockHardware.hoops.resonantHoopType']],

  ['hoopMaterial', ['stockHardware.hoops.hoopMaterial']],

  ['snareWireMaterial', ['stockSnareSystem.snareWires.material']],

  ['snareWireStrandCount', ['stockSnareSystem.snareWires.strandCount']],

  ['stockBatterHead', ['stockBatterHead', 'stockSnareSystem.heads.batterHead']],

  ['stockResoHead', ['stockResoHead', 'stockSnareSystem.heads.resonantHead']],

  ['snareThrow', ['snareThrowMakeModel', 'stockHardware.throwOff.model', 'stockHardware.throwOff.make', 'stockHardware.throwOff.style']],

  ['lugCount', ['lugCount', 'stockHardware.lugs.lugCount']],

  ['lugType', ['lugType', 'stockHardware.lugs.lugType']]

];

const optionalStock = [

  ['hoopThicknessMm', ['stockHardware.hoops.hoopThicknessMm']],

  ['snareWireModel', ['stockSnareSystem.snareWires.model']],

  ['airVentCount', ['airVentCount', 'shell.airVentCount', 'stockHardware.airVentCount']],

  ['throwOffExactModel', ['stockHardware.throwOff.model']]

];

const resolveAny = (d, paths) => {

  for (const path of paths) {

    const value = get(d, path);

    if (value !== undefined) return value;

  }

  return undefined;

};

const checkCore = (d) => {

  const missing = [];

  for (const [label, paths] of requiredCore) {

    const value = resolveAny(d, paths);

    if (label === 'reinforcementRings' || label === 'snareBeds') {

      if (!isBool(value)) missing.push(label);

      continue;

    }

    if (!isKnown(value)) missing.push(label);

  }

  const reRings = resolveAny(d, ['reinforcementRings', 'shell.construction.reinforcementRings']);

  if (reRings === true) {

    const material = resolveAny(d, ['reRingMaterial', 'shell.construction.reinforcementRingMaterial']);

    if (!isKnown(material)) missing.push('reRingMaterial');

  }

  return {

    ready: missing.length === 0,

    missing

  };

};

const checkStock = (d, coreReady) => {

  const missing = [];

  if (!coreReady) {

    missing.push('coreShellReady required first');

  }

  for (const [label, paths] of requiredStock) {

    const value = resolveAny(d, paths);

    if (!isKnown(value)) missing.push(label);

  }

  return {

    ready: coreReady && missing.length === 0,

    missing

  };

};

const checkOptionalStock = (d) => {

  const missingOptional = [];

  for (const [label, paths] of optionalStock) {

    const value = resolveAny(d, paths);

    if (!isKnown(value)) missingOptional.push(label);

  }

  return missingOptional;

};

const snap = await db.collection('snareReferenceDrums').get();

const report = {

  auditedAt: new Date().toISOString(),

  totalDocs: snap.size,

  summary: {

    coreShellReady: 0,

    stockConfigReady: 0,

    modifierReady: 0,

    needsCoreResearch: 0,

    needsStockResearch: 0

  },

  byCompany: {},

  records: []

};

for (const doc of snap.docs) {

  const d = doc.data();

  const company = d.companyName || 'UNKNOWN';

  if (!report.byCompany[company]) {

    report.byCompany[company] = {

      total: 0,

      coreShellReady: 0,

      stockConfigReady: 0,

      modifierReady: 0,

      needsCoreResearch: 0,

      needsStockResearch: 0

    };

  }

  const core = checkCore(d);

  const stock = checkStock(d, core.ready);

  const missingOptionalStock = checkOptionalStock(d);

  const modifierReady = core.ready;

  report.byCompany[company].total++;

  if (core.ready) {

    report.summary.coreShellReady++;

    report.byCompany[company].coreShellReady++;

  } else {

    report.summary.needsCoreResearch++;

    report.byCompany[company].needsCoreResearch++;

  }

  if (stock.ready) {

    report.summary.stockConfigReady++;

    report.byCompany[company].stockConfigReady++;

  } else {

    report.summary.needsStockResearch++;

    report.byCompany[company].needsStockResearch++;

  }

  if (modifierReady) {

    report.summary.modifierReady++;

    report.byCompany[company].modifierReady++;

  }

  report.records.push({

    id: doc.id,

    companyName: company,

    lineSeries: d.lineSeries || 'unknown',

    modelName: d.modelName || 'unknown',

    coreShellReady: core.ready,

    stockConfigReady: stock.ready,

    modifierReady,

    missingCoreFields: core.missing,

    missingStockFields: stock.missing,

    missingOptionalStockFields: missingOptionalStock,

    needsResearch: d.needsResearch === true

  });

}

fs.writeFileSync(

  'data/snareAuditReports/snare-model-readiness-audit.json',

  JSON.stringify(report, null, 2)

);

console.log('Total docs:', report.totalDocs);

console.log('Core shell ready:', report.summary.coreShellReady);

console.log('Stock config ready:', report.summary.stockConfigReady);

console.log('Modifier ready:', report.summary.modifierReady);

console.log('Needs core research:', report.summary.needsCoreResearch);

console.log('Needs stock research:', report.summary.needsStockResearch);

console.table(

  Object.entries(report.byCompany)

    .map(([company, v]) => ({ company, ...v }))

    .sort((a, b) => b.needsCoreResearch - a.needsCoreResearch || b.needsStockResearch - a.needsStockResearch)

);

