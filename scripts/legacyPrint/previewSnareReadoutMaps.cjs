
const fs = require('fs');

const {

  resolveSnareReadoutMaps

} = require('../../src/legacyPrint/engine/snare');

const PREVIEW_JSON = 'src/legacyPrint/reviewPlans/snare-engine-preview-v01.json';

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-readout-map-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-readout-map-preview-v01.md';

const preview = JSON.parse(fs.readFileSync(PREVIEW_JSON, 'utf8'));

const records = preview.records || [];

const TARGETS = [

  { id: 'ludwig-acrolite', test: record => record.company === 'Ludwig' && /acrolite/i.test(record.model) },

  { id: 'ludwig-black-beauty', test: record => record.company === 'Ludwig' && /black beauty/i.test(record.model) },

  { id: 'ludwig-legacy-mahogany', test: record => record.company === 'Ludwig' && /legacy mahogany/i.test(record.model) },

  { id: 'ahead-bell-brass', test: record => record.company === 'AHEAD' && /bell brass/i.test(record.model) },

  { id: 'dw-true-cast-bronze', test: record => record.company === 'DW / PDP' && /true-cast|bell bronze/i.test(record.model) },

  { id: 'gretsch-brooklyn-maple', test: record => record.company === 'Gretsch' && /brooklyn snare/i.test(record.model) }

];

const examples = TARGETS

  .map(target => {

    const record = records.find(target.test);

    if (!record) return null;

    return {

      targetId: target.id,

      maps: resolveSnareReadoutMaps(record)

    };

  })

  .filter(Boolean);

const packet = {

  status: 'SNARE_READOUT_MAP_PREVIEW_V01_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  firestoreWrites: 0,

  examples

};

fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

const renderNodeList = nodes =>

  nodes.map(node =>

    `${node.node} ${node.value} / score ${

      node.firstListenScore ?? node.playerScore ?? node.identityScore

    }`

  ).join(', ');

const md = [

  '# LegacyPrint Snare Readout Map Preview v0.1',

  '',

  `Generated: ${packet.generatedAt}`,

  '',

  `- Firestore writes: ${packet.firestoreWrites}`,

  `- Example maps: ${examples.length}`,

  '',

  ...examples.flatMap(({ targetId, maps }) => [

    `## ${targetId}`,

    '',

    `**${maps.drum.company} ${maps.drum.model} ${maps.drum.size}**`,

    '',

    '| Readout | Nodes |',

    '|---|---|',

    `| First Listen | ${renderNodeList(maps.firstListen.nodes)} |`,

    `| Player Analysis | ${renderNodeList(maps.playerAnalysis.nodes.slice(0, 4))} |`,

    `| LegacyPrint Identity | ${renderNodeList(maps.legacyPrintIdentity.nodes)} |`,

    ''

  ])

].join('\n');

fs.writeFileSync(OUT_MD, md);

console.log(JSON.stringify({

  outJson: OUT_JSON,

  outMd: OUT_MD,

  status: packet.status,

  firestoreWrites: 0,

  examples: examples.length

}, null, 2));

