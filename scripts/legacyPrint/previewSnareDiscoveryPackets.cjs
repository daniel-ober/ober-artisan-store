
const fs = require('fs');

const admin = require('firebase-admin');

const {

  buildSnareVoicePacket,

  buildSnareDiscoveryPacket,

  DEFAULT_SNARE_CALIBRATION_OVERLAY

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-discovery-packet-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-discovery-packet-preview-v01.md';

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

const renderNodes = nodes =>

  (nodes || [])

    .map(node => `${node.key || node.node} ${node.value}`)

    .join(', ');

const renderSimilarityRows = matches => {

  if (!matches?.length) return ['| — | — | — | — |'];

  return matches.slice(0, 5).map(match => {

    const drum = `${match.drum.company} ${match.drum.model} ${match.drum.size}`;

    return `| ${match.similarity?.similarityPercent || '—'}% | ${drum} | ${renderNodes(match.topNodes)} | ${match.matchReason || match.groupReason || '—'} |`;

  });

};

const renderContrastRows = matches => {

  if (!matches?.length) return ['| — | — | — | — |'];

  return matches.slice(0, 5).map(match => {

    const drum = `${match.drum.company} ${match.drum.model} ${match.drum.size}`;

    const contrastNodes = match.contrast?.contrastNodes

      ?.slice(0, 3)

      .map(item => `${item.direction} ${item.node} (${item.delta > 0 ? '+' : ''}${item.delta})`)

      .join(', ') || '—';

    return `| ${match.contrast?.contrastPercent || '—'}% | ${drum} | ${renderNodes(match.topNodes)} | ${contrastNodes} |`;

  });

};

async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const rawRecords = [];

  snap.forEach(doc => rawRecords.push({ id: doc.id, ...doc.data() }));

  const corpusPackets = rawRecords.map(record =>

    buildSnareVoicePacket(record, {

      overlay: DEFAULT_SNARE_CALIBRATION_OVERLAY,

      applyOverlay: true,

      includeBaseScore: false,

      includeRawRecord: false,

      mode: 'discoveryPreviewCorpus'

    })

  );

  const examples = TARGETS

    .map(target => {

      const targetPacket = corpusPackets.find(target.test);

      if (!targetPacket) return null;

      return {

        targetId: target.id,

        packet: buildSnareDiscoveryPacket(targetPacket, corpusPackets, {

          overlay: DEFAULT_SNARE_CALIBRATION_OVERLAY,

          applyOverlay: true,

          similarLimit: 40,

          contrastLimit: 5,

          contrastMinScore: 0.4

        })

      };

    })

    .filter(Boolean);

  const packet = {

    status: 'SNARE_DISCOVERY_PACKET_PREVIEW_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    corpusSize: corpusPackets.length,

    examples

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Snare Discovery Packet Preview v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Corpus size: ${packet.corpusSize}`,

    `- Example packets: ${examples.length}`,

    '',

    ...examples.flatMap(({ targetId, packet }) => {

      const grouped = packet.discovery.similar.grouped.groups;

      const contrastSections = packet.discovery.contrast.sections;

      return [

        `## ${targetId}`,

        '',

        `**${packet.target.drum.company} ${packet.target.drum.model} ${packet.target.drum.size}**`,

        '',

        `Summary: ${packet.target.summary.title}`,

        '',

        `Top nodes: ${renderNodes(packet.target.topNodes)}`,

        '',

        `Recommended sections: ${packet.discovery.recommendedSections.map(section => section.label).join(', ')}`,

        '',

        `UI default similar section: ${packet.uiHints.defaultSimilarSection}`,

        '',

        `UI default contrast mode: ${packet.uiHints.defaultContrastMode}`,

        '',

        '### Similar: Different Brand Alternatives',

        '',

        '| Similarity | Match | Top Nodes | Why |',

        '|---:|---|---|---|',

        ...renderSimilarityRows(grouped.differentBrandAlternatives),

        '',

        '### Similar: Same Material Alternatives',

        '',

        '| Similarity | Match | Top Nodes | Why |',

        '|---:|---|---|---|',

        ...renderSimilarityRows(grouped.sameMaterialAlternatives),

        '',

        '### Contrast: Overall',

        '',

        '| Contrast | Match | Top Nodes | Main Contrast |',

        '|---:|---|---|---|',

        ...renderContrastRows(contrastSections.find(section => section.mode === 'overallContrast')?.matches),

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

    corpusSize: packet.corpusSize,

    examples: examples.length

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

