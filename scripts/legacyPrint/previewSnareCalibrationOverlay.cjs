
const fs = require('fs');

const {

  applySnareCalibrationOverlay,

  DEFAULT_SNARE_CALIBRATION_OVERLAY,

  resolveSnareReadoutMaps

} = require('../../src/legacyPrint/engine/snare');

const PREVIEW_JSON = 'src/legacyPrint/reviewPlans/snare-engine-preview-v01.json';

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-calibration-overlay-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-calibration-overlay-preview-v01.md';

const preview = JSON.parse(fs.readFileSync(PREVIEW_JSON, 'utf8'));

const records = preview.records || [];

const TARGETS = [

  { id: 'ludwig-acrolite', test: record => record.company === 'Ludwig' && /acrolite/i.test(record.model) },

  { id: 'ludwig-black-beauty', test: record => record.company === 'Ludwig' && /black beauty/i.test(record.model) },

  { id: 'ahead-bell-brass', test: record => record.company === 'AHEAD' && /bell brass/i.test(record.model) },

  { id: 'dw-true-cast-bronze', test: record => record.company === 'DW / PDP' && /true-cast|bell bronze/i.test(record.model) }

];

const diffProfiles = (before, after) => {

  const out = {};

  for (const node of Object.keys(before.voiceProfile || {})) {

    const delta = Number(((after.voiceProfile[node] || 0) - (before.voiceProfile[node] || 0)).toFixed(2));

    if (delta !== 0) out[node] = delta;

  }

  return out;

};

const examples = TARGETS

  .map(target => {

    const before = records.find(target.test);

    if (!before) return null;

    const after = applySnareCalibrationOverlay(before, DEFAULT_SNARE_CALIBRATION_OVERLAY);

    return {

      targetId: target.id,

      before,

      after,

      deltas: diffProfiles(before, after),

      readoutMaps: resolveSnareReadoutMaps(after)

    };

  })

  .filter(Boolean);

const packet = {

  status: 'SNARE_CALIBRATION_OVERLAY_PREVIEW_V01_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  firestoreWrites: 0,

  overlayVersion: DEFAULT_SNARE_CALIBRATION_OVERLAY.version,

  examples

};

fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

const renderProfile = profile =>

  Object.entries(profile)

    .map(([node, value]) => `${node} ${value}`)

    .join(', ');

const renderDeltas = deltas => {

  const entries = Object.entries(deltas);

  if (!entries.length) return 'none';

  return entries

    .map(([node, value]) => `${node} ${value > 0 ? '+' : ''}${value}`)

    .join(', ');

};

const md = [

  '# LegacyPrint Snare Calibration Overlay Preview v0.1',

  '',

  `Generated: ${packet.generatedAt}`,

  '',

  `- Firestore writes: ${packet.firestoreWrites}`,

  `- Overlay version: ${packet.overlayVersion}`,

  `- Example overlays: ${examples.length}`,

  '',

  ...examples.flatMap(example => [

    `## ${example.targetId}`,

    '',

    `**${example.before.company} ${example.before.model} ${example.before.size}**`,

    '',

    `Before: ${renderProfile(example.before.voiceProfile)}`,

    '',

    `After: ${renderProfile(example.after.voiceProfile)}`,

    '',

    `Deltas: ${renderDeltas(example.deltas)}`,

    '',

    `Applied: ${example.after.calibrationOverlay.applied ? 'yes' : 'no'}`,

    '',

    '| Overlay Type | Detail |',

    '|---|---|',

    ...example.after.calibrationOverlay.applied.map(item =>

      `| ${item.type} | ${item.family || item.id || JSON.stringify(item.deltas)} |`

    ),

    '',

    '### Readout After Overlay',

    '',

    `First Listen: ${example.readoutMaps.firstListen.nodes.map(node => `${node.node} ${node.value}`).join(', ')}`,

    '',

    `LegacyPrint Identity: ${example.readoutMaps.legacyPrintIdentity.nodes.map(node => `${node.node} ${node.value}`).join(', ')}`,

    ''

  ])

].join('\n');

fs.writeFileSync(OUT_MD, md);

console.log(JSON.stringify({

  outJson: OUT_JSON,

  outMd: OUT_MD,

  status: packet.status,

  firestoreWrites: 0,

  overlayVersion: packet.overlayVersion,

  examples: examples.length

}, null, 2));

