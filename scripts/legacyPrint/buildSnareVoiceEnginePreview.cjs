
const fs = require('fs');

const admin = require('firebase-admin');

const { scoreSnareVoice } = require('../../src/legacyPrint/engine/snare/scoreSnareVoice');

const CONTRIBUTION_JSON = 'src/legacyPrint/reviewPlans/snare-physical-contribution-map.json';


const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-voice-engine-preview.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-voice-engine-preview.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const contributionMap = JSON.parse(fs.readFileSync(CONTRIBUTION_JSON, 'utf8'));

const PREVIEW_EMPTY_VALUES = new Set([

  '',

  'unknown',

  'unknown_or_missing',

  'n/a',

  'na',

  'not verified',

  'notverified',

  'tbd',

  'null',

  'undefined',

  'none'

]);

const hasPreviewValue = value => {

  if (value === null || value === undefined) return false;

  if (typeof value === 'number') return Number.isFinite(value);

  const text = String(value).trim().toLowerCase();

  return !PREVIEW_EMPTY_VALUES.has(text);

};

const first = (row, keys) => {

  for (const key of keys) {

    if (hasPreviewValue(row[key])) return row[key];

  }

  return undefined;

};

const topNodes = score =>

  Object.entries(score)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 3)

    .map(([key, value]) => ({ key, value }));

const SECONDARY_CORE_DRIVER_PREFIXES = [

  'shellLayup:',

  'reinforcementRings:',

  'plyCount:',

  'finishTreatment:'

];

const secondaryCoreDrivers = scored =>

  (scored.drivers?.strongestSources || [])

    .filter(item => SECONDARY_CORE_DRIVER_PREFIXES.some(prefix => item.source.startsWith(prefix)))

    .map(item => ({

      source: item.source,

      totalMovement: item.totalMovement

    }));

const scoreRecord = row => {

  const scored = scoreSnareVoice(row);

  const diameter = first(row, ['diameter', 'diameterInches']);

  const depth = first(row, ['depth', 'depthInches']);

  return {

    id: row.id,

    company: first(row, ['companyName', 'company', 'brand']) || 'Unknown',

    model: first(row, ['modelName', 'model', 'name']) || 'Unknown model',

    lineSeries: first(row, ['lineSeries', 'series', 'line']) || '',

    size: `${diameter || '?'}x${depth || '?'}`,

    shellMaterialRaw: scored.raw?.shellMaterial || '',

    shellConstructionRaw: scored.raw?.shellConstruction || '',

    shellLayupRaw: scored.raw?.shellLayup || '',

    reinforcementRingsRaw: scored.raw?.reinforcementRings || '',

    finishTreatmentRaw: scored.raw?.finishTreatment || '',

    plyCountRaw: scored.raw?.plyCount || '',

    bearingEdgeRaw: scored.raw?.bearingEdge || '',

    hoopRaw: scored.raw?.hoopType || '',

    shellThicknessMm: scored.numeric?.shellThicknessMm || '',

    lugCount: scored.numeric?.lugCount || '',

    families: scored.families,

    secondaryCoreDrivers: secondaryCoreDrivers(scored),

    voiceProfile: scored.voiceProfile,

    topNodes: topNodes(scored.voiceProfile),

    readinessTier: row.legacyPrintEngineReadinessTier || ''

  };

};


async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const records = [];

  snap.forEach(doc => {

    records.push(scoreRecord({ id: doc.id, ...doc.data() }));

  });

  records.sort((a, b) =>

    a.company.localeCompare(b.company) ||

    a.model.localeCompare(b.model) ||

    a.size.localeCompare(b.size)

  );

  const familyCounts = {};

  const topNodeCounts = {};

  for (const record of records) {

    for (const [familyType, family] of Object.entries(record.families)) {

      const key = `${familyType}:${family}`;

      familyCounts[key] = (familyCounts[key] || 0) + 1;

    }

    for (const top of record.topNodes) {

      topNodeCounts[top.key] = (topNodeCounts[top.key] || 0) + 1;

    }

  }

  const packet = {

    status: 'SNARE_VOICE_ENGINE_PREVIEW_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    promotedRecordsScored: records.length,

    doctrine: contributionMap.doctrine,

    componentWeights: contributionMap.componentWeights,

    topNodeCounts: Object.fromEntries(Object.entries(topNodeCounts).sort((a, b) => b[1] - a[1])),

    familyCounts: Object.fromEntries(Object.entries(familyCounts).sort((a, b) => b[1] - a[1])),

    records

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const row = r => `| ${r.company} | ${r.model} | ${r.size} | ${r.families.shellMaterial} | ${r.families.shellConstruction} | ${r.families.shellLayup || ''} | ${r.families.reinforcementRings || ''} | ${r.families.plyCount || ''} | ${r.families.finishTreatment || ''} | ${r.secondaryCoreDrivers.map(d => `${d.source} (${d.totalMovement})`).join(', ')} | ${r.voiceProfile.attack} | ${r.voiceProfile.brightness} | ${r.voiceProfile.projection} | ${r.voiceProfile.sustain} | ${r.voiceProfile.warmth} | ${r.voiceProfile.sensitivity} | ${r.voiceProfile.control} | ${r.topNodes.map(n => n.key).join(', ')} |`;

  const md = [

    '# LegacyPrint Snare Voice Engine Preview',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    '## Summary',

    '',

    `- Promoted records scored: ${packet.promotedRecordsScored}`,

    '- Firestore writes: 0',

    '- Stock heads and snare wires are not scoring blockers in this preview.',

    '- Brand is not used as a primary scoring driver.',

    '',

    '## Top Node Frequency',

    '',

    '| Node | Top-3 Appearances |',

    '|---|---:|',

    ...Object.entries(packet.topNodeCounts).map(([node, count]) => `| ${node} | ${count} |`),

    '',

    '## First 80 Scored Records',

    '',

    '| Company | Model | Size | Material Family | Construction Family | Shell Layup | Rings | Ply Count | Finish/Treatment | Secondary Core Drivers | Attack | Brightness | Projection | Sustain | Warmth | Sensitivity | Control | Top Nodes |',

    '|---|---|---:|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|',

    ...records.slice(0, 80).map(row)

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    promotedRecordsScored: records.length,

    topNodeCounts: packet.topNodeCounts

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

