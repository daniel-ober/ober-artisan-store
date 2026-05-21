
const fs = require('fs');

const PREVIEW_JSON = 'src/legacyPrint/reviewPlans/snare-voice-engine-preview.json';

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-voice-engine-calibration-audit.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-voice-engine-calibration-audit.md';

const preview = JSON.parse(fs.readFileSync(PREVIEW_JSON, 'utf8'));

const records = preview.records || [];

const NODE_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control'

];

const average = values => {

  if (!values.length) return 0;

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));

};

const avgProfile = groupRecords => {

  const out = {};

  for (const key of NODE_KEYS) {

    out[key] = average(groupRecords.map(record => record.voiceProfile[key]).filter(Number.isFinite));

  }

  return out;

};

const topNodesForProfile = profile =>

  Object.entries(profile)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 3)

    .map(([key, value]) => `${key} ${value}`)

    .join(', ');

const groupBy = fn => {

  const grouped = {};

  for (const record of records) {

    const key = fn(record) || 'unknown';

    grouped[key] = grouped[key] || [];

    grouped[key].push(record);

  }

  return grouped;

};

const summarizeGroup = (label, grouped, minCount = 1) =>

  Object.entries(grouped)

    .filter(([, list]) => list.length >= minCount)

    .map(([group, list]) => ({

      label,

      group,

      count: list.length,

      averageProfile: avgProfile(list),

      topNodes: topNodesForProfile(avgProfile(list)),

      sampleRecords: list.slice(0, 8).map(record => ({

        company: record.company,

        model: record.model,

        size: record.size,

        topNodes: record.topNodes.map(node => node.key).join(', ')

      }))

    }))

    .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));

const byMaterial = summarizeGroup(

  'material',

  groupBy(record => record.families.shellMaterial),

  2

);

const byConstruction = summarizeGroup(

  'construction',

  groupBy(record => record.families.shellConstruction),

  2

);

const byHoop = summarizeGroup(

  'hoop',

  groupBy(record => record.families.hoopType),

  2

);

const bySize = summarizeGroup(

  'size',

  groupBy(record => record.size),

  2

);

const nodeStats = {};

for (const node of NODE_KEYS) {

  const values = records.map(record => record.voiceProfile[node]).filter(Number.isFinite);

  nodeStats[node] = {

    min: Number(Math.min(...values).toFixed(2)),

    max: Number(Math.max(...values).toFixed(2)),

    avg: average(values)

  };

}

const dominanceFlags = [];

for (const [node, stats] of Object.entries(nodeStats)) {

  if (stats.avg >= 7.25) {

    dominanceFlags.push(`${node} average is high at ${stats.avg}`);

  }

  if (stats.max - stats.min < 1.25) {

    dominanceFlags.push(`${node} has narrow spread: ${stats.min}–${stats.max}`);

  }

}

const projectionTop3Count = records.filter(record =>

  record.topNodes.some(node => node.key === 'projection')

).length;

if (projectionTop3Count === records.length) {

  dominanceFlags.push('projection appears in top 3 for every promoted record');

}

const packet = {

  status: 'SNARE_VOICE_ENGINE_CALIBRATION_AUDIT_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  firestoreWrites: 0,

  promotedRecordsAudited: records.length,

  nodeStats,

  projectionTop3Count,

  dominanceFlags,

  byMaterial,

  byConstruction,

  byHoop,

  bySize

};

fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

const profileColumns = profile =>

  NODE_KEYS.map(key => profile[key]).join(' | ');

const table = (title, rows, limit = 30) => [

  `## ${title}`,

  '',

  '| Group | Count | Attack | Brightness | Projection | Sustain | Warmth | Sensitivity | Control | Top Nodes |',

  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---|',

  ...rows.slice(0, limit).map(row =>

    `| ${row.group} | ${row.count} | ${profileColumns(row.averageProfile)} | ${row.topNodes} |`

  ),

  ''

].join('\n');

const md = [

  '# LegacyPrint Snare Voice Engine Calibration Audit',

  '',

  `Generated: ${packet.generatedAt}`,

  '',

  '## Summary',

  '',

  `- Promoted records audited: ${packet.promotedRecordsAudited}`,

  `- Firestore writes: ${packet.firestoreWrites}`,

  `- Projection top-3 count: ${packet.projectionTop3Count} / ${packet.promotedRecordsAudited}`,

  '',

  '## Node Stats',

  '',

  '| Node | Min | Avg | Max |',

  '|---|---:|---:|---:|',

  ...Object.entries(nodeStats).map(([node, stats]) => `| ${node} | ${stats.min} | ${stats.avg} | ${stats.max} |`),

  '',

  '## Dominance / Spread Flags',

  '',

  ...dominanceFlags.map(flag => `- ${flag}`),

  '',

  table('By Shell Material Family', byMaterial),

  table('By Shell Construction Family', byConstruction),

  table('By Hoop Family', byHoop),

  table('By Size', bySize, 40)

].join('\n');

fs.writeFileSync(OUT_MD, md);

console.log(JSON.stringify({

  outJson: OUT_JSON,

  outMd: OUT_MD,

  status: packet.status,

  firestoreWrites: 0,

  promotedRecordsAudited: records.length,

  projectionTop3Count,

  dominanceFlags,

  nodeStats

}, null, 2));

