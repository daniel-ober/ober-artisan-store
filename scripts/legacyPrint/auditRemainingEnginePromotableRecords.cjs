
const fs = require('fs');

const admin = require('firebase-admin');

const OUT_JSON = 'src/legacyPrint/reviewPlans/remaining-engine-promotable-audit-heads-wires-do-not-block.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/remaining-engine-promotable-audit-heads-wires-do-not-block.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const hasText = value => {

  if (value === null || value === undefined) return false;

  const text = String(value).trim();

  if (!text) return false;

  return !['unknown', 'n/a', 'na', 'not verified', 'notverified', 'tbd', 'null', 'undefined'].includes(text.toLowerCase());

};

const hasNumber = value => {

  if (typeof value === 'number') return Number.isFinite(value) && value > 0;

  if (typeof value === 'string') {

    const n = Number(value.replace(/[^0-9.]/g, ''));

    return Number.isFinite(n) && n > 0;

  }

  return false;

};

const first = (row, keys) => {

  for (const key of keys) {

    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];

  }

  return undefined;

};

const isBearingEdgeReady = row => {

  const assumptions = row.engineAssumptions || {};

  const legacyAssumptions = row.legacyPrintEngineAssumptions || {};

  if (row.bearingEdgeReady === true) return true;

  if (row.meaningfulBearingEdge === true) return true;

  if (row.bearingEdgeFallbackApplied === true) return true;

  if (assumptions.bearingEdgeFallbackApplied === true) return true;

  if (legacyAssumptions.bearingEdgeFallbackApplied === true) return true;

  const edge = first(row, [

    'bearingEdge',

    'bearingEdgeType',

    'bearingEdgeProfile',

    'bearingEdgeDetail',

    'bearingEdgeDescription'

  ]);

  if (!hasText(edge)) return false;

  const text = String(edge).toLowerCase();

  return ![

    'unknown',

    'not verified',

    'notverified',

    'placeholder',

    'needs verification',

    'needs-verification'

  ].some(term => text.includes(term));

};

const getCoreMissing = row => {

  const missing = [];

  const company = first(row, ['companyName', 'company', 'brand']);

  const model = first(row, ['modelName', 'model', 'name']);

  const diameter = first(row, ['diameter', 'diameterInches']);

  const depth = first(row, ['depth', 'depthInches']);

  const construction = first(row, ['shellConstruction', 'construction']);

  const material = first(row, ['shellMaterial1', 'shellMaterial', 'material']);

  const thickness = first(row, ['shellThicknessMm', 'shellThickness', 'thicknessMm']);

  const sourceUrl = first(row, ['primarySourceUrl', 'sourceUrl', 'url']);

  const sourceConfidence = first(row, ['sourceConfidence', 'primarySourceConfidence']);

  if (!hasText(company)) missing.push('company name');

  if (!hasText(model)) missing.push('model name');

  if (!hasNumber(diameter)) missing.push('diameter');

  if (!hasNumber(depth)) missing.push('depth');

  if (!hasText(construction)) missing.push('shell construction');

  if (!hasText(material)) missing.push('shell material');

  if (!hasNumber(thickness)) missing.push('shell thickness');

  if (!isBearingEdgeReady(row)) missing.push('bearing edge/fallback');

  if (!hasText(sourceUrl)) missing.push('source url');

  if (!hasText(sourceConfidence)) missing.push('source confidence');

  return missing;

};

const getNonBlockingMissing = row => {

  const missing = [];

  const batter = first(row, ['stockBatterHead', 'batterHead', 'stockBatter']);

  const reso = first(row, ['stockResoHead', 'stockResonantHead', 'resoHead', 'snareSideHead']);

  const wires = first(row, ['stockSnareWires', 'snareWires', 'wireType']);

  const productionStatus = first(row, ['currentlyInProduction', 'productionStatus', 'discontinued']);

  if (!hasText(batter)) missing.push('stock batter head');

  if (!hasText(reso)) missing.push('stock reso head');

  if (!hasText(wires)) missing.push('stock snare wires');

  if (!hasText(productionStatus)) missing.push('production status');

  return missing;

};

const normalizeCompany = row => first(row, ['companyName', 'company', 'brand']) || 'Unknown';

const normalizeModel = row => first(row, ['modelName', 'model', 'name']) || 'Unknown model';

async function main() {

  const snap = await db.collection('snareReferenceDrums').get();

  const records = [];

  const alreadyPromoted = [];

  const promoteNow = [];

  const doNotPromote = [];

  snap.forEach(doc => {

    const row = doc.data();

    const coreMissing = getCoreMissing(row);

    const nonBlockingMissing = getNonBlockingMissing(row);

    const promoted = row.legacyPrintEnginePromotable === true;

    const record = {

      id: doc.id,

      company: normalizeCompany(row),

      model: normalizeModel(row),

      diameter: first(row, ['diameter', 'diameterInches']) || '',

      depth: first(row, ['depth', 'depthInches']) || '',

      shellConstruction: first(row, ['shellConstruction', 'construction']) || '',

      shellMaterial: first(row, ['shellMaterial1', 'shellMaterial', 'material']) || '',

      shellThicknessMm: first(row, ['shellThicknessMm', 'shellThickness', 'thicknessMm']) || '',

      bearingEdgeReady: isBearingEdgeReady(row),

      legacyPrintEnginePromotable: promoted,

      coreMissing,

      nonBlockingMissing,

      promotionRule: 'stockHeadsAndSnareWiresDoNotBlockEnginePromotion'

    };

    records.push(record);

    if (promoted) {

      alreadyPromoted.push(record);

    } else if (coreMissing.length === 0) {

      promoteNow.push({

        ...record,

        classification: nonBlockingMissing.length

          ? 'PROMOTE_NOW_ONLY_NON_BLOCKING_ENRICHMENT_MISSING'

          : 'PROMOTE_NOW_FULL_CORE_READY'

      });

    } else {

      doNotPromote.push({

        ...record,

        classification: 'DO_NOT_PROMOTE_CORE_BLOCKER'

      });

    }

  });

  const byCompany = {};

  for (const record of promoteNow) {

    byCompany[record.company] = (byCompany[record.company] || 0) + 1;

  }

  const blockerSummary = {};

  for (const record of doNotPromote) {

    for (const field of record.coreMissing) {

      blockerSummary[field] = (blockerSummary[field] || 0) + 1;

    }

  }

  const summary = {

    totalFirestoreRecords: records.length,

    alreadyPromotedCount: alreadyPromoted.length,

    additionalPromotableCount: promoteNow.length,

    finalPromotableIfApplied: alreadyPromoted.length + promoteNow.length,

    doNotPromoteCoreBlockerCount: doNotPromote.length,

    additionalPromotableByCompany: Object.fromEntries(Object.entries(byCompany).sort((a, b) => b[1] - a[1])),

    remainingCoreBlockers: Object.fromEntries(Object.entries(blockerSummary).sort((a, b) => b[1] - a[1]))

  };

  const packet = {

    status: 'REMAINING_ENGINE_PROMOTABLE_AUDIT_HEADS_WIRES_DO_NOT_BLOCK_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    summary,

    promotionRule: 'Missing stock heads, stock snare wires, and production status do not block engine promotion. Core shell fields still block promotion.',

    alreadyPromoted,

    additionalPromotableRecords: promoteNow,

    doNotPromoteRecords: doNotPromote

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# Remaining Engine-Promotable Audit',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    '## Summary',

    '',

    `- Total Firestore records: ${summary.totalFirestoreRecords}`,

    `- Already promoted: ${summary.alreadyPromotedCount}`,

    `- Additional promotable now: ${summary.additionalPromotableCount}`,

    `- Final promotable if applied: ${summary.finalPromotableIfApplied}`,

    `- Remaining core-blocked records: ${summary.doNotPromoteCoreBlockerCount}`,

    '',

    '## Additional Promotable By Company',

    '',

    '| Company | Count |',

    '|---|---:|',

    ...Object.entries(summary.additionalPromotableByCompany).map(([company, count]) => `| ${company} | ${count} |`),

    '',

    '## Remaining Core Blockers',

    '',

    '| Blocker | Count |',

    '|---|---:|',

    ...Object.entries(summary.remainingCoreBlockers).map(([field, count]) => `| ${field} | ${count} |`)

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

