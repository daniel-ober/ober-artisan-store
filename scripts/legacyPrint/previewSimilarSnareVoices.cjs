
const fs = require('fs');

const admin = require('firebase-admin');

const {

  buildSnareVoicePacket,

  findSimilarSnareVoices,

  DEFAULT_SNARE_CALIBRATION_OVERLAY

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-similar-voice-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-similar-voice-preview-v01.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const TARGETS = [

  {

    id: 'ludwig-acrolite',

    test: record =>

      record.companyName === 'Ludwig' &&

      /acrolite/i.test(record.modelName || '')

  },

  {

    id: 'ludwig-black-beauty',

    test: record =>

      record.companyName === 'Ludwig' &&

      /black beauty/i.test(record.modelName || '') &&

      /5x14/i.test(record.modelName || '')

  },

  {

    id: 'ludwig-legacy-mahogany',

    test: record =>

      record.companyName === 'Ludwig' &&

      /legacy mahogany/i.test(record.modelName || '')

  },

  {

    id: 'dw-true-cast-bronze',

    test: record =>

      record.companyName === 'DW / PDP' &&

      /true-cast|bell bronze/i.test(record.modelName || '')

  }

];

const renderTopNodes = nodes =>

  (nodes || [])

    .map(node => `${node.key || node.node} ${node.value}`)

    .join(', ');

const renderMatchRows = matches =>

  matches.map(match => {

    const drum = `${match.drum.company} ${match.drum.model} ${match.drum.size}`;

    const shared = match.sharedTopNodes.length ? match.sharedTopNodes.join(', ') : 'none';

    return `| ${match.similarity.similarityPercent}% | ${drum} | ${renderTopNodes(match.topNodes)} | ${shared} | ${match.matchReason} |`;

  });

async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const rawRecords = [];

  snap.forEach(doc => rawRecords.push({ id: doc.id, ...doc.data() }));

  const packets = rawRecords.map(record =>

    buildSnareVoicePacket(record, {

      overlay: DEFAULT_SNARE_CALIBRATION_OVERLAY,

      applyOverlay: true,

      includeBaseScore: false,

      includeRawRecord: false,

      mode: 'similarVoiceCorpus'

    })

  );

  const examples = TARGETS

    .map(target => {

      const targetPacket = packets.find(packet => target.test({

        companyName: packet.drum.company,

        modelName: packet.drum.model

      }));

      if (!targetPacket) return null;

      return {

        targetId: target.id,

        result: findSimilarSnareVoices(targetPacket, packets, {

          mode: 'legacyPrintIdentity',

          limit: 8,

          minSimilarity: 0.55,

          includeSelf: false

        })

      };

    })

    .filter(Boolean);

  const packet = {

    status: 'SNARE_SIMILAR_VOICE_PREVIEW_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    corpusSize: packets.length,

    examples

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Similar Snare Voice Preview v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Corpus size: ${packet.corpusSize}`,

    `- Example targets: ${examples.length}`,

    '',

    ...examples.flatMap(({ targetId, result }) => [

      `## ${targetId}`,

      '',

      `**Target: ${result.target.drum.company} ${result.target.drum.model} ${result.target.drum.size}**`,

      '',

      `Target summary: ${result.target.summary.title}`,

      '',

      `Target nodes: ${renderTopNodes(result.target.topNodes)}`,

      '',

      '| Similarity | Match | Top Nodes | Shared Top Nodes | Why |',

      '|---:|---|---|---|---|',

      ...renderMatchRows(result.matches),

      ''

    ])

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    corpusSize: packet.corpusSize,

    examples: examples.length

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

