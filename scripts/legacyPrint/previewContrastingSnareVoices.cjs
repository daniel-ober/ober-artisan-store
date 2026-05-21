
const fs = require('fs');

const admin = require('firebase-admin');

const {

  buildSnareVoicePacket,

  findContrastingSnareVoices,

  DEFAULT_SNARE_CALIBRATION_OVERLAY

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-contrast-voice-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-contrast-voice-preview-v01.md';

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

const MODES = [

  'overallContrast',

  'dryToOpen',

  'warmToBright',

  'controlledToExplosive'

];

const renderTopNodes = nodes =>

  (nodes || [])

    .map(node => `${node.key || node.node} ${node.value}`)

    .join(', ');

const renderContrastNodes = nodes =>

  (nodes || [])

    .slice(0, 3)

    .map(item => `${item.direction} ${item.node} (${item.delta > 0 ? '+' : ''}${item.delta})`)

    .join(', ');

const renderMatchRows = matches => {

  if (!matches.length) return ['| — | — | — | — | — |'];

  return matches.map(match => {

    const drum = `${match.drum.company} ${match.drum.model} ${match.drum.size}`;

    const material = match.contrast.materialContrast.changed

      ? `${match.contrast.materialContrast.targetMaterial} → ${match.contrast.materialContrast.candidateMaterial}`

      : match.contrast.materialContrast.targetMaterial;

    return `| ${match.contrast.contrastPercent}% | ${drum} | ${renderTopNodes(match.topNodes)} | ${renderContrastNodes(match.contrast.contrastNodes)} | ${material} |`;

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

      mode: 'contrastVoiceCorpus'

    })

  );

  const examples = TARGETS

    .map(target => {

      const targetPacket = packets.find(target.test);

      if (!targetPacket) return null;

      const modeResults = MODES.map(mode => ({

        mode,

        result: findContrastingSnareVoices(targetPacket, packets, {

          mode,

          limit: 6,

          minContrastScore: 0.4,

          requireMaterialChange: mode !== 'overallContrast',

          includeSelf: false

        })

      }));

      return {

        targetId: target.id,

        target: {

          drum: targetPacket.drum,

          summary: targetPacket.summary,

          topNodes: targetPacket.topNodes

        },

        modeResults

      };

    })

    .filter(Boolean);

  const packet = {

    status: 'SNARE_CONTRAST_VOICE_PREVIEW_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    corpusSize: packets.length,

    examples

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Contrasting Snare Voice Preview v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Corpus size: ${packet.corpusSize}`,

    `- Example targets: ${examples.length}`,

    '',

    ...examples.flatMap(example => [

      `## ${example.targetId}`,

      '',

      `**Target: ${example.target.drum.company} ${example.target.drum.model} ${example.target.drum.size}**`,

      '',

      `Target summary: ${example.target.summary.title}`,

      '',

      `Target nodes: ${renderTopNodes(example.target.topNodes)}`,

      '',

      ...example.modeResults.flatMap(({ mode, result }) => [

        `### ${mode}`,

        '',

        '| Contrast | Match | Top Nodes | Main Contrast | Material Shift |',

        '|---:|---|---|---|---|',

        ...renderMatchRows(result.matches),

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

