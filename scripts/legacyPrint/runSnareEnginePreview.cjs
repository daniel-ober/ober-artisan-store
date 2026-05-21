
const fs = require('fs');

const admin = require('firebase-admin');

const {

  scoreSnareVoice,

  SNARE_NODE_KEYS,

  SNARE_ENGINE_DOCTRINE,

  SNARE_ENGINE_VERSION

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-engine-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-engine-preview-v01.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const average = values => {

  if (!values.length) return 0;

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));

};

const averageProfile = records => {

  const profile = {};

  for (const node of SNARE_NODE_KEYS) {

    profile[node] = average(records.map(record => record.voiceProfile[node]).filter(Number.isFinite));

  }

  return profile;

};

const topNodesForProfile = profile =>

  Object.entries(profile)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 3)

    .map(([node, value]) => `${node} ${value}`)

    .join(', ');

const groupBy = (records, getKey) => {

  const groups = {};

  for (const record of records) {

    const key = getKey(record) || 'unknown';

    groups[key] = groups[key] || [];

    groups[key].push(record);

  }

  return groups;

};

const summarizeGroups = (records, getKey, minCount = 1) =>

  Object.entries(groupBy(records, getKey))

    .filter(([, groupRecords]) => groupRecords.length >= minCount)

    .map(([group, groupRecords]) => {

      const profile = averageProfile(groupRecords);

      return {

        group,

        count: groupRecords.length,

        averageProfile: profile,

        topNodes: topNodesForProfile(profile)

      };

    })

    .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));

const getNodeStats = records => {

  const stats = {};

  for (const node of SNARE_NODE_KEYS) {

    const values = records.map(record => record.voiceProfile[node]).filter(Number.isFinite);

    stats[node] = {

      min: Number(Math.min(...values).toFixed(2)),

      avg: average(values),

      max: Number(Math.max(...values).toFixed(2))

    };

  }

  return stats;

};

const getTopNodeCounts = records => {

  const counts = {};

  for (const record of records) {

    for (const topNode of record.topNodes) {

      counts[topNode.key] = (counts[topNode.key] || 0) + 1;

    }

  }

  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));

};

const groupTable = (title, groups, limit = 40) => [

  `## ${title}`,

  '',

  '| Group | Count | Attack | Brightness | Projection | Sustain | Warmth | Sensitivity | Control | Top Nodes |',

  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---|',

  ...groups.slice(0, limit).map(item => {

    const p = item.averageProfile;

    return `| ${item.group} | ${item.count} | ${p.attack} | ${p.brightness} | ${p.projection} | ${p.sustain} | ${p.warmth} | ${p.sensitivity} | ${p.control} | ${item.topNodes} |`;

  }),

  ''

].join('\n');

const recordRow = record => {

  const p = record.voiceProfile;

  return `| ${record.company} | ${record.model} | ${record.size} | ${record.families.shellMaterial} | ${record.families.shellConstruction} | ${record.families.hoopType} | ${p.attack} | ${p.brightness} | ${p.projection} | ${p.sustain} | ${p.warmth} | ${p.sensitivity} | ${p.control} | ${record.topNodes.map(node => node.key).join(', ')} | ${record.confidence.label} ${record.confidence.score} |`;

};

async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const records = [];

  snap.forEach(doc => {

    records.push(scoreSnareVoice({ id: doc.id, ...doc.data() }));

  });

  records.sort((a, b) =>

    a.company.localeCompare(b.company) ||

    a.model.localeCompare(b.model) ||

    a.size.localeCompare(b.size)

  );

  const nodeStats = getNodeStats(records);

  const topNodeCounts = getTopNodeCounts(records);

  const projectionTop3Count = records.filter(record =>

    record.topNodes.some(node => node.key === 'projection')

  ).length;

  const packet = {

    status: 'SNARE_ENGINE_PREVIEW_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    engineVersion: SNARE_ENGINE_VERSION,

    doctrine: SNARE_ENGINE_DOCTRINE,

    promotedRecordsScored: records.length,

    projectionTop3Count,

    nodeStats,

    topNodeCounts,

    byMaterial: summarizeGroups(records, record => record.families.shellMaterial, 2),

    byConstruction: summarizeGroups(records, record => record.families.shellConstruction, 2),

    byHoop: summarizeGroups(records, record => record.families.hoopType, 2),

    bySize: summarizeGroups(records, record => record.size, 2),

    records

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Snare Engine Preview v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    '## Summary',

    '',

    `- Engine version: ${packet.engineVersion}`,

    `- Promoted records scored: ${packet.promotedRecordsScored}`,

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Projection top-3 count: ${packet.projectionTop3Count} / ${packet.promotedRecordsScored}`,

    '- Stock heads and snare wires are not passability blockers.',

    '- Brand, price, prestige, rarity, collectibility, and hype are not scoring inputs.',

    '',

    '## Node Stats',

    '',

    '| Node | Min | Avg | Max |',

    '|---|---:|---:|---:|',

    ...Object.entries(packet.nodeStats).map(([node, stats]) => `| ${node} | ${stats.min} | ${stats.avg} | ${stats.max} |`),

    '',

    '## Top Node Frequency',

    '',

    '| Node | Top-3 Appearances |',

    '|---|---:|',

    ...Object.entries(packet.topNodeCounts).map(([node, count]) => `| ${node} | ${count} |`),

    '',

    groupTable('By Shell Material Family', packet.byMaterial),

    groupTable('By Shell Construction Family', packet.byConstruction),

    groupTable('By Hoop Family', packet.byHoop),

    groupTable('By Size', packet.bySize, 50),

    '## First 100 Scored Records',

    '',

    '| Company | Model | Size | Material | Construction | Hoop | Attack | Brightness | Projection | Sustain | Warmth | Sensitivity | Control | Top Nodes | Confidence |',

    '|---|---|---:|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|',

    ...records.slice(0, 100).map(recordRow)

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    engineVersion: packet.engineVersion,

    promotedRecordsScored: packet.promotedRecordsScored,

    projectionTop3Count: packet.projectionTop3Count,

    topNodeCounts: packet.topNodeCounts,

    nodeStats: packet.nodeStats

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

