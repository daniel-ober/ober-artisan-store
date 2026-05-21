
const fs = require('fs');

const admin = require('firebase-admin');

const {

  buildSnareDiscoveryPacketForReference

} = require('../../src/legacyPrint/api');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-discovery-packet-api-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-discovery-packet-api-preview-v01.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const TARGETS = [

  {

    id: 'ludwig-acrolite',

    query: snap =>

      snap.find(record =>

        record.companyName === 'Ludwig' &&

        /acrolite/i.test(record.modelName || '')

      )

  },

  {

    id: 'ludwig-black-beauty',

    query: snap =>

      snap.find(record =>

        record.companyName === 'Ludwig' &&

        /black beauty/i.test(record.modelName || '') &&

        /5x14/i.test(record.modelName || '')

      )

  },

  {

    id: 'dw-true-cast-bronze',

    query: snap =>

      snap.find(record =>

        record.companyName === 'DW / PDP' &&

        /true-cast|bell bronze/i.test(record.modelName || '')

      )

  }

];

const renderNodes = nodes =>

  (nodes || [])

    .map(node => `${node.key || node.node} ${node.value}`)

    .join(', ');

async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const rawRecords = [];

  snap.forEach(doc => rawRecords.push({ id: doc.id, ...doc.data() }));

  const examples = [];

  for (const target of TARGETS) {

    const raw = target.query(rawRecords);

    if (!raw) continue;

    const result = await buildSnareDiscoveryPacketForReference(raw.id, {

      db,

      similarLimit: 40,

      contrastLimit: 5,

      contrastMinScore: 0.4

    });

    examples.push({

      targetId: target.id,

      snareReferenceId: raw.id,

      result

    });

  }

  const packet = {

    status: 'SNARE_DISCOVERY_PACKET_API_PREVIEW_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    examples

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Snare Discovery Packet API Preview v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Example API packets: ${examples.length}`,

    '',

    ...examples.flatMap(({ targetId, snareReferenceId, result }) => {

      const discoveryPacket = result.packet;

      const target = discoveryPacket?.target;

      const recommendedSections =

        discoveryPacket?.discovery?.recommendedSections?.map(section => section.label).join(', ') || 'none';

      return [

        `## ${targetId}`,

        '',

        `Reference ID: ${snareReferenceId}`,

        '',

        `Found: ${result.found ? 'yes' : 'no'}`,

        '',

        `Promotable: ${result.promotable ? 'yes' : 'no'}`,

        '',

        target

          ? `Target: ${target.drum.company} ${target.drum.model} ${target.drum.size}`

          : 'Target: none',

        '',

        target

          ? `Top nodes: ${renderNodes(target.topNodes)}`

          : '',

        '',

        `Recommended sections: ${recommendedSections}`,

        '',

        `Default similar section: ${discoveryPacket?.uiHints?.defaultSimilarSection || 'none'}`,

        '',

        `Default contrast mode: ${discoveryPacket?.uiHints?.defaultContrastMode || 'none'}`,

        '',

        `Corpus size: ${result.metadata?.corpusSize || 0}`,

        ''

      ];

    })

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    examples: examples.length

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

