
const fs = require('fs');

const path = require('path');

const admin = require('firebase-admin');

const OUT_JSON = 'src/legacyPrint/reviewPlans/legacyprint-engine-readiness-inventory.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/legacyprint-engine-readiness-inventory.md';

const COLLECTION = 'snareReferenceDrums';

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

const hasText = value => typeof value === 'string' && value.trim().length > 0;

const lower = value => String(value || '').trim().toLowerCase();

const readFirst = (row, keys) => {

  for (const key of keys) {

    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];

  }

  return '';

};

const toNumber = value => {

  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const match = String(value || '').match(/[\d.]+/);

  return match ? Number(match[0]) : null;

};

const hasMeaningfulBearingEdge = row => {

  const direct = readFirst(row, [

    'bearingEdge',

    'bearingEdgeProfile',

    'bearingEdgeShape',

    'bearingEdgeDetail',

    'bearingEdgeDescription'

  ]);

  const assumption = row.engineAssumptions || {};

  const fallbackApplied = assumption.bearingEdgeFallbackApplied === true;

  if (fallbackApplied) return true;

  const text = lower(typeof direct === 'object' ? JSON.stringify(direct) : direct);

  if (!text) return false;

  if (['unknown', 'not verified', 'notverified', 'n/a', 'na', 'placeholder'].some(term => text.includes(term))) return false;

  return true;

};

const hasMetalEdgeFallback = row => row?.engineAssumptions?.bearingEdgeFallbackApplied === true;

const hasStockHeads = row => {

  const batter = readFirst(row, ['stockBatterHead', 'batterHead', 'stockBatter']);

  const reso = readFirst(row, ['stockResoHead', 'stockResonantHead', 'resoHead', 'snareSideHead']);

  return hasText(batter) && hasText(reso);

};

const hasExactOrFallbackStockHeads = row => {

  if (!hasStockHeads(row)) return false;

  const assumptions = row.engineAssumptions || {};

  return (

    assumptions.stockHeadExactSourceBacked === true ||

    assumptions.stockHeadFallbackApplied === true ||

    row.stockHeadReviewStatus === 'exactSourceBacked' ||

    row.stockHeadReviewStatus === 'fallbackApplied'

  );

};

const getCoreFields = row => {

  const company = readFirst(row, ['companyName', 'company', 'brand']);

  const model = readFirst(row, ['modelName', 'model']);

  const diameter = toNumber(readFirst(row, ['diameter', 'diameterInches']));

  const depth = toNumber(readFirst(row, ['depth', 'depthInches']));

  const shellConstruction = readFirst(row, ['shellConstruction', 'construction']);

  const shellMaterial1 = readFirst(row, ['shellMaterial1', 'shellMaterial', 'material']);

  const shellThicknessMm = toNumber(readFirst(row, ['shellThicknessMm', 'shellThickness', 'thicknessMm']));

  const bearingEdgeReady = hasMeaningfulBearingEdge(row);

  const hoopType = readFirst(row, ['hoopType', 'rimType', 'hoops']);

  const snareWires = readFirst(row, ['stockSnareWires', 'snareWires']);

  const stockBatterHead = readFirst(row, ['stockBatterHead', 'batterHead', 'stockBatter']);

  const stockResoHead = readFirst(row, ['stockResoHead', 'stockResonantHead', 'resoHead', 'snareSideHead']);

  return {

    company,

    model,

    diameter,

    depth,

    shellConstruction,

    shellMaterial1,

    shellThicknessMm,

    bearingEdgeReady,

    hoopType,

    snareWires,

    stockBatterHead,

    stockResoHead

  };

};

const isCoreShellEngineReady = row => {

  const f = getCoreFields(row);

  return (

    hasText(f.company) &&

    hasText(f.model) &&

    Number.isFinite(f.diameter) &&

    Number.isFinite(f.depth) &&

    hasText(f.shellConstruction) &&

    hasText(f.shellMaterial1) &&

    Number.isFinite(f.shellThicknessMm) &&

    f.bearingEdgeReady

  );

};

const classifyEngineTier = row => {

  const coreReady = isCoreShellEngineReady(row);

  if (!coreReady) return 'NOT_ENGINE_READY';

  const hasHoops = hasText(getCoreFields(row).hoopType);

  const hasWires = hasText(getCoreFields(row).snareWires);

  const hasHeads = hasExactOrFallbackStockHeads(row);

  if (hasHoops && hasWires && hasHeads) return 'STOCK_ENGINE_READY';

  if (hasHoops || hasWires || hasHeads) return 'CORE_PLUS_PARTIAL_STOCK_READY';

  return 'CORE_SHELL_ENGINE_READY';

};

const summarizeCounts = rows => {

  const counts = {

    totalRecords: rows.length,

    coreShellEngineReady: 0,

    stockEngineReady: 0,

    corePlusPartialStockReady: 0,

    notEngineReady: 0,

    metalEdgeFallbackReady: 0,

    exactOrFallbackStockHeadsReady: 0,

    withHoopType: 0,

    withSnareWires: 0,

    withValidThickness: 0,

    withMeaningfulBearingEdge: 0

  };

  for (const row of rows) {

    const tier = classifyEngineTier(row);

    if (tier === 'CORE_SHELL_ENGINE_READY') counts.coreShellEngineReady += 1;

    if (tier === 'STOCK_ENGINE_READY') counts.stockEngineReady += 1;

    if (tier === 'CORE_PLUS_PARTIAL_STOCK_READY') counts.corePlusPartialStockReady += 1;

    if (tier === 'NOT_ENGINE_READY') counts.notEngineReady += 1;

    const f = getCoreFields(row);

    if (hasMetalEdgeFallback(row)) counts.metalEdgeFallbackReady += 1;

    if (hasExactOrFallbackStockHeads(row)) counts.exactOrFallbackStockHeadsReady += 1;

    if (hasText(f.hoopType)) counts.withHoopType += 1;

    if (hasText(f.snareWires)) counts.withSnareWires += 1;

    if (Number.isFinite(f.shellThicknessMm)) counts.withValidThickness += 1;

    if (f.bearingEdgeReady) counts.withMeaningfulBearingEdge += 1;

  }

  counts.totalEngineReady =

    counts.coreShellEngineReady +

    counts.corePlusPartialStockReady +

    counts.stockEngineReady;

  return counts;

};

async function main() {

  const snap = await db.collection(COLLECTION).get();

  const rows = snap.docs.map(doc => ({

    id: doc.id,

    ...doc.data()

  }));

  const records = rows.map(row => {

    const fields = getCoreFields(row);

    const tier = classifyEngineTier(row);

    return {

      id: row.id,

      tier,

      company: fields.company,

      model: fields.model,

      diameter: fields.diameter,

      depth: fields.depth,

      shellConstruction: fields.shellConstruction,

      shellMaterial1: fields.shellMaterial1,

      shellThicknessMm: fields.shellThicknessMm,

      bearingEdgeReady: fields.bearingEdgeReady,

      bearingEdgeFallbackApplied: hasMetalEdgeFallback(row),

      hoopType: fields.hoopType,

      snareWires: fields.snareWires,

      stockBatterHead: fields.stockBatterHead,

      stockResoHead: fields.stockResoHead,

      stockHeadsEngineReady: hasExactOrFallbackStockHeads(row)

    };

  });

  const summary = summarizeCounts(rows);

  const byCompany = {};

  for (const record of records) {

    const company = record.company || 'Unknown';

    if (!byCompany[company]) {

      byCompany[company] = {

        total: 0,

        engineReady: 0,

        stockEngineReady: 0,

        corePlusPartialStockReady: 0,

        coreShellEngineReady: 0

      };

    }

    byCompany[company].total += 1;

    if (record.tier !== 'NOT_ENGINE_READY') byCompany[company].engineReady += 1;

    if (record.tier === 'STOCK_ENGINE_READY') byCompany[company].stockEngineReady += 1;

    if (record.tier === 'CORE_PLUS_PARTIAL_STOCK_READY') byCompany[company].corePlusPartialStockReady += 1;

    if (record.tier === 'CORE_SHELL_ENGINE_READY') byCompany[company].coreShellEngineReady += 1;

  }

  const topCompanies = Object.entries(byCompany)

    .map(([company, counts]) => ({ company, ...counts }))

    .sort((a, b) => b.engineReady - a.engineReady || b.total - a.total)

    .slice(0, 25);

  const engineReadySample = records

    .filter(record => record.tier !== 'NOT_ENGINE_READY')

    .slice(0, 50);

  const packet = {

    status: 'LEGACYPRINT_ENGINE_READINESS_INVENTORY_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    collectionName: COLLECTION,

    firestoreWrites: 0,

    summary,

    topCompanies,

    engineReadySample,

    records

  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Engine Readiness Inventory',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    '## Summary',

    '',

    `- Total records: ${summary.totalRecords}`,

    `- Total engine-ready records: ${summary.totalEngineReady}`,

    `- Stock engine ready: ${summary.stockEngineReady}`,

    `- Core + partial stock ready: ${summary.corePlusPartialStockReady}`,

    `- Core shell engine ready: ${summary.coreShellEngineReady}`,

    `- Not engine ready: ${summary.notEngineReady}`,

    `- Metal edge fallback ready: ${summary.metalEdgeFallbackReady}`,

    `- Exact/fallback stock heads ready: ${summary.exactOrFallbackStockHeadsReady}`,

    `- With hoop type: ${summary.withHoopType}`,

    `- With snare wires: ${summary.withSnareWires}`,

    `- With valid thickness: ${summary.withValidThickness}`,

    `- With meaningful bearing edge: ${summary.withMeaningfulBearingEdge}`,

    '',

    '## Top Engine-Ready Companies',

    '',

    '| Company | Total | Engine Ready | Stock Ready | Partial Stock | Core Shell |',

    '|---|---:|---:|---:|---:|---:|',

    ...topCompanies.map(c =>

      `| ${c.company} | ${c.total} | ${c.engineReady} | ${c.stockEngineReady} | ${c.corePlusPartialStockReady} | ${c.coreShellEngineReady} |`

    ),

    '',

    '## First 50 Engine-Ready Records',

    '',

    '| Tier | Company | Model | Size | Shell | Material | Thickness | Edge fallback | Hoops | Heads ready |',

    '|---|---|---|---|---|---|---:|---|---|---|',

    ...engineReadySample.map(r =>

      `| ${r.tier} | ${r.company || ''} | ${r.model || ''} | ${r.diameter || ''}x${r.depth || ''} | ${r.shellConstruction || ''} | ${r.shellMaterial1 || ''} | ${r.shellThicknessMm ?? ''} | ${r.bearingEdgeFallbackApplied ? 'yes' : 'no'} | ${r.hoopType || ''} | ${r.stockHeadsEngineReady ? 'yes' : 'no'} |`

    ),

    ''

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    summary

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

