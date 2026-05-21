
const fs = require('fs');

const admin = require('firebase-admin');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-config-option-inventory.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-config-option-inventory.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const hasText = value => {

  if (value === null || value === undefined) return false;

  const text = String(value).trim();

  if (!text) return false;

  return !['unknown', 'n/a', 'na', 'not verified', 'notverified', 'tbd', 'null', 'undefined'].includes(text.toLowerCase());

};

const clean = value => {

  if (!hasText(value)) return 'UNKNOWN_OR_MISSING';

  return String(value).trim().replace(/\s+/g, ' ');

};

const first = (row, keys) => {

  for (const key of keys) {

    if (hasText(row[key]) || typeof row[key] === 'number') return row[key];

  }

  return undefined;

};

const asNumber = value => {

  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  if (typeof value === 'string') {

    const n = Number(value.replace(/[^0-9.]/g, ''));

    return Number.isFinite(n) ? n : null;

  }

  return null;

};

const increment = (bucket, value) => {

  const key = clean(value);

  bucket[key] = (bucket[key] || 0) + 1;

};

const incrementRange = (bucket, value, ranges) => {

  const n = asNumber(value);

  if (n === null) {

    bucket.UNKNOWN_OR_MISSING = (bucket.UNKNOWN_OR_MISSING || 0) + 1;

    return;

  }

  const found = ranges.find(range => n >= range.min && n < range.max);

  const key = found ? found.label : `${n}`;

  bucket[key] = (bucket[key] || 0) + 1;

};

const topObject = (obj, limit = 40) =>

  Object.fromEntries(

    Object.entries(obj)

      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

      .slice(0, limit)

  );

const buildEmptyInventory = () => ({

  count: 0,

  companies: {},

  drumTypes: {},

  lineSeries: {},

  shellConstructions: {},

  shellMaterials: {},

  shellMaterial2: {},

  shellMaterial3: {},

  shellThicknessRaw: {},

  shellThicknessRanges: {},

  diameters: {},

  depths: {},

  depthRanges: {},

  diameterDepthCombos: {},

  bearingEdges: {},

  hoopTypes: {},

  lugCounts: {},

  lugTypes: {},

  hardwareFinishes: {},

  snareBeds: {},

  throwOffs: {},

  stockSnareWires: {},

  stockBatterHeads: {},

  stockResoHeads: {},

  finishTypes: {},

  productionStatuses: {},

  promotedTiers: {},

  sourceConfidence: {}

});

const THICKNESS_RANGES = [

  { label: '0-1mm', min: 0, max: 1 },

  { label: '1-2mm', min: 1, max: 2 },

  { label: '2-3mm', min: 2, max: 3 },

  { label: '3-4mm', min: 3, max: 4 },

  { label: '4-5mm', min: 4, max: 5 },

  { label: '5-6mm', min: 5, max: 6 },

  { label: '6-8mm', min: 6, max: 8 },

  { label: '8-10mm', min: 8, max: 10 },

  { label: '10-12mm', min: 10, max: 12 },

  { label: '12-16mm', min: 12, max: 16 },

  { label: '16mm+', min: 16, max: Infinity }

];

const DEPTH_RANGES = [

  { label: '0-3.5in', min: 0, max: 3.5 },

  { label: '3.5-4.5in', min: 3.5, max: 4.5 },

  { label: '4.5-5.5in', min: 4.5, max: 5.5 },

  { label: '5.5-6.5in', min: 5.5, max: 6.5 },

  { label: '6.5-7.5in', min: 6.5, max: 7.5 },

  { label: '7.5-8.5in', min: 7.5, max: 8.5 },

  { label: '8.5in+', min: 8.5, max: Infinity }

];

const applyRecord = (inventory, row) => {

  inventory.count += 1;

  const company = first(row, ['companyName', 'company', 'brand']);

  const drumType = first(row, ['drumType', 'type']);

  const lineSeries = first(row, ['lineSeries', 'series', 'line']);

  const shellConstruction = first(row, ['shellConstruction', 'construction']);

  const shellMaterial = first(row, ['shellMaterial1', 'shellMaterial', 'material']);

  const shellMaterial2 = first(row, ['shellMaterial2']);

  const shellMaterial3 = first(row, ['shellMaterial3']);

  const shellThickness = first(row, ['shellThicknessMm', 'shellThickness', 'thicknessMm']);

  const diameter = first(row, ['diameter', 'diameterInches']);

  const depth = first(row, ['depth', 'depthInches']);

  const bearingEdge = first(row, ['bearingEdge', 'bearingEdgeType', 'bearingEdgeProfile', 'bearingEdgeDetail', 'bearingEdgeDescription']);

  const hoopType = first(row, ['hoopType', 'hoops', 'rimType']);

  const lugCount = first(row, ['lugCount', 'lugs']);

  const lugType = first(row, ['lugType']);

  const hardwareFinish = first(row, ['hardwareFinish']);

  const snareBed = first(row, ['snareBed', 'snareBedType']);

  const throwOff = first(row, ['snareThrowMakeModel', 'throwOff', 'throwOffModel']);

  const stockSnareWires = first(row, ['stockSnareWires', 'snareWires', 'wireType']);

  const stockBatterHead = first(row, ['stockBatterHead', 'batterHead', 'stockBatter']);

  const stockResoHead = first(row, ['stockResoHead', 'stockResonantHead', 'resoHead', 'snareSideHead']);

  const finishType = first(row, ['finishType', 'finish']);

  const productionStatus = first(row, ['currentlyInProduction', 'productionStatus', 'discontinued']);

  const promotedTier = first(row, ['legacyPrintEngineReadinessTier']);

  const sourceConfidence = first(row, ['sourceConfidence', 'primarySourceConfidence']);

  increment(inventory.companies, company);

  increment(inventory.drumTypes, drumType);

  increment(inventory.lineSeries, lineSeries);

  increment(inventory.shellConstructions, shellConstruction);

  increment(inventory.shellMaterials, shellMaterial);

  increment(inventory.shellMaterial2, shellMaterial2);

  increment(inventory.shellMaterial3, shellMaterial3);

  increment(inventory.shellThicknessRaw, shellThickness);

  incrementRange(inventory.shellThicknessRanges, shellThickness, THICKNESS_RANGES);

  increment(inventory.diameters, diameter);

  increment(inventory.depths, depth);

  incrementRange(inventory.depthRanges, depth, DEPTH_RANGES);

  increment(inventory.diameterDepthCombos, `${clean(diameter)}x${clean(depth)}`);

  increment(inventory.bearingEdges, bearingEdge);

  increment(inventory.hoopTypes, hoopType);

  increment(inventory.lugCounts, lugCount);

  increment(inventory.lugTypes, lugType);

  increment(inventory.hardwareFinishes, hardwareFinish);

  increment(inventory.snareBeds, snareBed);

  increment(inventory.throwOffs, throwOff);

  increment(inventory.stockSnareWires, stockSnareWires);

  increment(inventory.stockBatterHeads, stockBatterHead);

  increment(inventory.stockResoHeads, stockResoHead);

  increment(inventory.finishTypes, finishType);

  increment(inventory.productionStatuses, productionStatus);

  increment(inventory.promotedTiers, promotedTier);

  increment(inventory.sourceConfidence, sourceConfidence);

};

const summarizeInventory = inventory => ({

  count: inventory.count,

  companies: topObject(inventory.companies),

  drumTypes: topObject(inventory.drumTypes),

  shellConstructions: topObject(inventory.shellConstructions),

  shellMaterials: topObject(inventory.shellMaterials),

  shellThicknessRanges: topObject(inventory.shellThicknessRanges),

  diameters: topObject(inventory.diameters),

  depths: topObject(inventory.depths),

  depthRanges: topObject(inventory.depthRanges),

  diameterDepthCombos: topObject(inventory.diameterDepthCombos),

  bearingEdges: topObject(inventory.bearingEdges),

  hoopTypes: topObject(inventory.hoopTypes),

  lugCounts: topObject(inventory.lugCounts),

  snareBeds: topObject(inventory.snareBeds),

  stockSnareWires: topObject(inventory.stockSnareWires),

  stockBatterHeads: topObject(inventory.stockBatterHeads),

  stockResoHeads: topObject(inventory.stockResoHeads),

  finishTypes: topObject(inventory.finishTypes),

  promotedTiers: topObject(inventory.promotedTiers),

  sourceConfidence: topObject(inventory.sourceConfidence)

});

const mdSection = (title, obj) => [

  `## ${title}`,

  '',

  '| Value | Count |',

  '|---|---:|',

  ...Object.entries(obj).map(([value, count]) => `| ${String(value).replace(/\|/g, '/')} | ${count} |`),

  ''

].join('\n');

async function main() {

  const snap = await db.collection('snareReferenceDrums').get();

  const allInventory = buildEmptyInventory();

  const promotedInventory = buildEmptyInventory();

  snap.forEach(doc => {

    const row = { id: doc.id, ...doc.data() };

    applyRecord(allInventory, row);

    if (row.legacyPrintEnginePromotable === true) {

      applyRecord(promotedInventory, row);

    }

  });

  const packet = {

    status: 'SNARE_CONFIG_OPTION_INVENTORY_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    summary: {

      totalFirestoreRecords: allInventory.count,

      enginePromotedRecords: promotedInventory.count

    },

    allRecords: summarizeInventory(allInventory),

    promotedRecords: summarizeInventory(promotedInventory),

    rawAllRecordsInventory: allInventory,

    rawPromotedRecordsInventory: promotedInventory

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Snare Configuration Option Inventory',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    '## Summary',

    '',

    `- Total Firestore records: ${packet.summary.totalFirestoreRecords}`,

    `- Engine-promoted records: ${packet.summary.enginePromotedRecords}`,

    '',

    '# Promoted Records Option Universe',

    '',

    mdSection('Promoted Shell Constructions', packet.promotedRecords.shellConstructions),

    mdSection('Promoted Shell Materials', packet.promotedRecords.shellMaterials),

    mdSection('Promoted Shell Thickness Ranges', packet.promotedRecords.shellThicknessRanges),

    mdSection('Promoted Diameters', packet.promotedRecords.diameters),

    mdSection('Promoted Depths', packet.promotedRecords.depths),

    mdSection('Promoted Diameter x Depth Combos', packet.promotedRecords.diameterDepthCombos),

    mdSection('Promoted Bearing Edges', packet.promotedRecords.bearingEdges),

    mdSection('Promoted Hoop Types', packet.promotedRecords.hoopTypes),

    mdSection('Promoted Lug Counts', packet.promotedRecords.lugCounts),

    mdSection('Promoted Snare Beds', packet.promotedRecords.snareBeds),

    '',

    '# Full Collection Option Universe',

    '',

    mdSection('All Companies', packet.allRecords.companies),

    mdSection('All Shell Constructions', packet.allRecords.shellConstructions),

    mdSection('All Shell Materials', packet.allRecords.shellMaterials),

    mdSection('All Shell Thickness Ranges', packet.allRecords.shellThicknessRanges),

    mdSection('All Diameters', packet.allRecords.diameters),

    mdSection('All Depths', packet.allRecords.depths),

    mdSection('All Bearing Edges', packet.allRecords.bearingEdges),

    mdSection('All Hoop Types', packet.allRecords.hoopTypes)

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    summary: packet.summary

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

