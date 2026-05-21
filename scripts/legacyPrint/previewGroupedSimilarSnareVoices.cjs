
const fs = require('fs');

const admin = require('firebase-admin');

const {

  buildSnareVoicePacket,

  findSimilarSnareVoices,

  groupSimilarSnareVoiceMatches,

  DEFAULT_SNARE_CALIBRATION_OVERLAY

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-grouped-similar-voice-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-grouped-similar-voice-preview-v01.md';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();

const TARGETS = [

  {

    id: 'ludwig-acrolite',

    test: packet =>

      packet.drum.company === 'Ludwig' &&

      /acrolite/i.test(packet.drum.model || '')

  },

  {

    id: 'ludwig-black-beauty',

    test: packet =>

      packet.drum.company === 'Ludwig' &&

      /black beauty/i.test(packet.drum.model || '') &&

      /5x14/i.test(packet.drum.model || '')

  },

  {

    id: 'ludwig-legacy-mahogany',

    test: packet =>

      packet.drum.company === 'Ludwig' &&

      /legacy mahogany/i.test(packet.drum.model || '')

  },

  {

    id: 'dw-true-cast-bronze',

    test: packet =>

      packet.drum.company === 'DW / PDP' &&

      /true-cast|bell bronze/i.test(packet.drum.model || '')

  }

];

const GROUP_LABELS = {

  nearDuplicates: 'Near Duplicates / Same Model Family',

  sameFamily: 'Same Brand Family',

  sameMaterialAlternatives: 'Same Material Alternatives',

  differentBrandAlternatives: 'Different Brand Alternatives',

  broadAlternatives: 'Broad Alternatives'

};

const renderTopNodes = nodes =>

  (nodes || [])

    .map(node => `${node.key || node.node} ${node.value}`)

    .join(', ');

const renderGroupRows = matches => {

  if (!matches.length) return ['| — | — | — | — | — |'];

  return matches.map(match => {

    const drum = `${match.drum.company} ${match.drum.model} ${match.drum.size}`;

    const shared = match.sharedTopNodes.length ? match.sharedTopNodes.join(', ') : 'none';

    return `| ${match.similarity.similarityPercent}% | ${drum} | ${renderTopNodes(match.topNodes)} | ${shared} | ${match.groupReason} |`;

  });

};

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

      mode: 'groupedSimilarVoiceCorpus'

    })

  );

  const examples = TARGETS

    .map(target => {

      const targetPacket = packets.find(target.test);

      if (!targetPacket) return null;

      const similar = findSimilarSnareVoices(targetPacket, packets, {

        mode: 'legacyPrintIdentity',

        limit: 40,

        minSimilarity: 0.5,

        includeSelf: false

      });

      return {

        targetId: target.id,

        grouped: groupSimilarSnareVoiceMatches(similar, {

          nearDuplicateLimit: 5,

          sameFamilyLimit: 5,

          sameMaterialLimit: 6,

          differentBrandLimit: 8,

          broadAlternativesLimit: 5

        })

      };

    })

    .filter(Boolean);

  const packet = {

    status: 'SNARE_GROUPED_SIMILAR_VOICE_PREVIEW_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    corpusSize: packets.length,

    examples

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Grouped Similar Snare Voice Preview v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Corpus size: ${packet.corpusSize}`,

    `- Example targets: ${examples.length}`,

    '',

    ...examples.flatMap(({ targetId, grouped }) => [

      `## ${targetId}`,

      '',

      `**Target: ${grouped.target.drum.company} ${grouped.target.drum.model} ${grouped.target.drum.size}**`,

      '',

      `Target summary: ${grouped.target.summary.title}`,

      '',

      `Counts: ${JSON.stringify(grouped.counts)}`,

      '',

      ...Object.entries(grouped.groups).flatMap(([groupKey, matches]) => [

        `### ${GROUP_LABELS[groupKey] || groupKey}`,

        '',

        '| Similarity | Match | Top Nodes | Shared Top Nodes | Group Reason |',

        '|---:|---|---|---|---|',

        ...renderGroupRows(matches),

        ''

      ])

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

