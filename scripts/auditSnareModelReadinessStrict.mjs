
import admin from 'firebase-admin';

import fs from 'fs';

if (admin.apps.length === 0) admin.initializeApp();

const db = admin.firestore();

const isKnown = (v) =>

  v !== undefined &&

  v !== null &&

  v !== '' &&

  String(v).trim().toLowerCase() !== 'unknown' &&

  String(v).trim().toLowerCase() !== 'n/a' &&

  String(v).trim().toLowerCase() !== 'none';

const isBool = (v) => typeof v === 'boolean';

const get = (obj, path) =>

  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

const resolveAny = (d, paths) => {

  for (const path of paths) {

    const value = get(d, path);

    if (value !== undefined) return value;

  }

  return undefined;

};

const coreMinimumRequired = [

  ['shellConstruction', ['shellConstruction', 'shell.construction.shellConstruction']],

  ['shellMaterial1', ['shellMaterial1', 'shell.construction.shellMaterialPrimary']],

  ['diameter', ['diameter', 'shell.dimensions.diameterInches']],

  ['depth', ['depth', 'shell.dimensions.depthInches']],

  ['shellThicknessMm', ['shellThicknessMm', 'shell.construction.shellThicknessMm']],

  ['bearingEdge', ['bearingEdge', 'shell.bearingEdges.batterSideProfile', 'shell.bearingEdges.snareSideProfile']],

  ['snareBedType', ['snareBedType', 'shell.snareBeds.depthBucket', 'shell.snareBeds.bedStyle']]

];

const stockMinimumRequired = [

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

const stockOptionalButUseful = [

  ['hoopThicknessMm', ['stockHardware.hoops.hoopThicknessMm']],

  ['snareWireModel', ['stockSnareSystem.snareWires.model']],

  ['airVentCount', ['airVentCount', 'shell.airVentCount', 'stockHardware.airVentCount']],

  ['throwOffExactModel', ['stockHardware.throwOff.model']]

];

const checkCore = (d) => {

  const failed = [];

  for (const [label, paths] of coreMinimumRequired) {

    const value = resolveAny(d, paths);

    if (!isKnown(value)) failed.push(label);

  }

  const reRings = resolveAny(d, ['reinforcementRings', 'shell.construction.reinforcementRings']);

  if (!isBool(reRings)) failed.push('reinforcementRings');

  const snareBeds = resolveAny(d, ['snareBeds', 'shell.snareBeds.present']);

  if (!isBool(snareBeds)) failed.push('snareBeds');

  if (reRings === true) {

    const material = resolveAny(d, ['reRingMaterial', 'shell.construction.reinforcementRingMaterial']);

    if (!isKnown(material)) failed.push('reRingMaterial');

  }

  return {

    passed: failed.length === 0,

    failed

  };

};

const checkStock = (d, corePassed) => {

  const failed = [];

  if (!corePassed) failed.push('coreShellMinimum must pass first');

  for (const [label, paths] of stockMinimumRequired) {

    const value = resolveAny(d, paths);

    if (!isKnown(value)) failed.push(label);

  }

  return {

    passed: corePassed && failed.length === 0,

    failed

  };

};

const checkOptional = (d) => {

  const unknown = [];

  for (const [label, paths] of stockOptionalButUseful) {

    const value = resolveAny(d, paths);

    if (!isKnown(value)) unknown.push(label);

  }

  return unknown;

};

const snap = await db.collection('snareReferenceDrums').get();

const report = {

  auditedAt: new Date().toISOString(),

  totalDocs: snap.size,

  definitions: {

    coreShellMinimumPassed: 'True only when all bare-shell minimum fields are known. Unknown is allowed in Firestore but fails minimum engine readiness.',

    stockMinimumPassed: 'True only when core shell minimum passes plus stock hardware/head/wire minimum fields are known.',

    modifierReady: 'True only when core shell minimum passes; user-selected modifiers can then be applied against a trusted shell baseline.'

  },

  summary: {

    coreShellMinimumPassed: 0,

    stockMinimumPassed: 0,

    modifierReady: 0,

    coreShellMinimumFailed: 0,

    stockMinimumFailed: 0

  },

  byCompany: {},

  failedCoreFieldCounts: {},

  failedStockFieldCounts: {},

  records: []

};

for (const doc of snap.docs) {

  const d = doc.data();

  const company = d.companyName || 'UNKNOWN';

  if (!report.byCompany[company]) {

    report.byCompany[company] = {

      total: 0,

      coreShellMinimumPassed: 0,

      stockMinimumPassed: 0,

      modifierReady: 0,

      coreShellMinimumFailed: 0,

      stockMinimumFailed: 0

    };

  }

  const core = checkCore(d);

  const stock = checkStock(d, core.passed);

  const optionalUnknown = checkOptional(d);

  const modifierReady = core.passed;

  report.byCompany[company].total++;

  if (core.passed) {

    report.summary.coreShellMinimumPassed++;

    report.byCompany[company].coreShellMinimumPassed++;

  } else {

    report.summary.coreShellMinimumFailed++;

    report.byCompany[company].coreShellMinimumFailed++;

    for (const field of core.failed) {

      report.failedCoreFieldCounts[field] = (report.failedCoreFieldCounts[field] || 0) + 1;

    }

  }

  if (stock.passed) {

    report.summary.stockMinimumPassed++;

    report.byCompany[company].stockMinimumPassed++;

  } else {

    report.summary.stockMinimumFailed++;

    report.byCompany[company].stockMinimumFailed++;

    for (const field of stock.failed) {

      report.failedStockFieldCounts[field] = (report.failedStockFieldCounts[field] || 0) + 1;

    }

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

    coreShellMinimumPassed: core.passed,

    stockMinimumPassed: stock.passed,

    modifierReady,

    failedCoreFields: core.failed,

    failedStockFields: stock.failed,

    optionalUnknownFields: optionalUnknown,

    needsResearch: d.needsResearch === true

  });

}

fs.writeFileSync(

  'data/snareAuditReports/snare-model-readiness-strict.json',

  JSON.stringify(report, null, 2)

);

console.log('Total docs:', report.totalDocs);

console.log('Core shell minimum passed:', report.summary.coreShellMinimumPassed);

console.log('Stock minimum passed:', report.summary.stockMinimumPassed);

console.log('Modifier ready:', report.summary.modifierReady);

console.log('Core shell minimum failed:', report.summary.coreShellMinimumFailed);

console.log('Stock minimum failed:', report.summary.stockMinimumFailed);

console.log('FAILED CORE FIELD COUNTS');

console.table(Object.entries(report.failedCoreFieldCounts).map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count));

console.log('FAILED STOCK FIELD COUNTS');

console.table(Object.entries(report.failedStockFieldCounts).map(([field, count]) => ({ field, count })).sort((a, b) => b.count - a.count));

console.log('BY COMPANY');

console.table(

  Object.entries(report.byCompany)

    .map(([company, v]) => ({ company, ...v }))

    .sort((a, b) => b.coreShellMinimumFailed - a.coreShellMinimumFailed || b.stockMinimumFailed - a.stockMinimumFailed)

);

