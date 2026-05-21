
const fs = require('fs');

const admin = require('firebase-admin');

const {

  buildSnareVoicePacket,

  DEFAULT_SNARE_CALIBRATION_OVERLAY

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-voice-packet-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-voice-packet-preview-v01.md';

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

      !/super sensitive/i.test(record.modelName || '')

  },

  {

    id: 'ludwig-legacy-mahogany',

    test: record =>

      record.companyName === 'Ludwig' &&

      /legacy mahogany/i.test(record.modelName || '')

  },

  {

    id: 'ahead-bell-brass',

    test: record =>

      record.companyName === 'AHEAD' &&

      /bell brass/i.test(record.modelName || '')

  },

  {

    id: 'dw-true-cast-bronze',

    test: record =>

      record.companyName === 'DW / PDP' &&

      /true-cast|bell bronze/i.test(record.modelName || '')

  },

  {

    id: 'gretsch-brooklyn-maple',

    test: record =>

      record.companyName === 'Gretsch' &&

      /brooklyn snare/i.test(record.modelName || '')

  }

];

const renderNodes = nodes =>

  (nodes || [])

    .map(node => `${node.node || node.key} ${node.value}`)

    .join(', ');

async function main() {

  const snap = await db

    .collection('snareReferenceDrums')

    .where('legacyPrintEnginePromotable', '==', true)

    .get();

  const rawRecords = [];

  snap.forEach(doc => rawRecords.push({ id: doc.id, ...doc.data() }));

  const examples = TARGETS

    .map(target => {

      const rawRecord = rawRecords.find(target.test);

      if (!rawRecord) return null;

      const packet = buildSnareVoicePacket(rawRecord, {

        overlay: DEFAULT_SNARE_CALIBRATION_OVERLAY,

        applyOverlay: true,

        includeBaseScore: true,

        includeRawRecord: false,

        mode: 'customerPreview'

      });

      return {

        targetId: target.id,

        packet

      };

    })

    .filter(Boolean);

  const packet = {

    status: 'SNARE_VOICE_PACKET_PREVIEW_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    examples

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Snare Voice Packet Preview v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Example packets: ${examples.length}`,

    '',

    ...examples.flatMap(({ targetId, packet }) => [

      `## ${targetId}`,

      '',

      `**${packet.drum.company} ${packet.drum.model} ${packet.drum.size}**`,

      '',

      `Summary: ${packet.summary.title}`,

      '',

      packet.summary.text,

      '',

      `Confidence: ${packet.confidence.label} ${packet.confidence.score}`,

      '',

      `Calibration applied: ${packet.calibration.applied ? 'yes' : 'no'}`,

      '',

      `Calibration deltas: ${Object.keys(packet.calibration.deltas).length ? JSON.stringify(packet.calibration.deltas) : 'none'}`,

      '',

      '| Customer Tab | Nodes |',

      '|---|---|',

      `| First Listen | ${renderNodes(packet.readouts.firstListen.nodes)} |`,

      `| Player Analysis | ${renderNodes(packet.readouts.playerAnalysis.nodes.slice(0, 4))} |`,

      `| LegacyPrint Identity | ${renderNodes(packet.readouts.legacyPrintIdentity.nodes)} |`,

      '',

      '### Strongest Physical Drivers',

      '',

      '| Driver | Movement |',

      '|---|---:|',

      ...packet.physicalDrivers.strongest.slice(0, 8).map(driver =>

        `| ${driver.source} | ${driver.totalMovement} |`

      ),

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

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

