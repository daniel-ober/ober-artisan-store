
const fs = require('fs');

const {

  normalizeDiscoveryPacketResponse

} = require('../../src/legacyPrint/services/snareDiscoveryService');

const {

  buildSnareDiscoveryViewModel

} = require('../../src/legacyPrint/services/snareDiscoveryViewModel');

const IN_JSON = 'src/legacyPrint/reviewPlans/snare-discovery-packet-api-preview-v01.json';

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-discovery-view-model-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-discovery-view-model-preview-v01.md';

const source = JSON.parse(fs.readFileSync(IN_JSON, 'utf8'));

const examples = source.examples || [];

const viewModels = examples.map(example => {

  const state = normalizeDiscoveryPacketResponse(example.result);

  const vm = buildSnareDiscoveryViewModel(state);

  return {

    targetId: example.targetId,

    status: vm.status,

    ready: vm.ready,

    target: vm.target,

    readoutTabs: vm.readoutTabs.map(tab => ({

      key: tab.key,

      label: tab.label,

      nodes: tab.nodes

    })),

    recommendedSections: vm.recommendedSections.map(section => ({

      key: section.key,

      label: section.label,

      matchCount: section.matches.length,

      firstMatch: section.matches[0] || null

    })),

    contrastModes: vm.contrastModes.map(mode => ({

      key: mode.key,

      label: mode.label,

      matchCount: mode.matches.length,

      firstMatch: mode.matches[0] || null

    })),

    uiHints: vm.uiHints

  };

});

const packet = {

  status: 'SNARE_DISCOVERY_VIEW_MODEL_PREVIEW_V01_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  firestoreWrites: 0,

  sourcePreview: IN_JSON,

  examples: viewModels

};

fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

const md = [

  '# LegacyPrint Snare Discovery View Model Preview v0.1',

  '',

  `Generated: ${packet.generatedAt}`,

  '',

  `- Firestore writes: ${packet.firestoreWrites}`,

  `- Source preview: ${packet.sourcePreview}`,

  `- Examples: ${packet.examples.length}`,

  '',

  '## UI View Models',

  '',

  '| Target | Status | Title | Top Nodes | Tabs | Sections | Contrast Modes | Default Similar | Default Contrast |',

  '|---|---|---|---|---:|---:|---:|---|---|',

  ...packet.examples.map(example => {

    const topNodes = (example.target?.topNodes || [])

      .map(node => `${node.key} ${node.displayValue}`)

      .join(', ');

    return `| ${example.targetId} | ${example.status} | ${example.target?.title || '—'} | ${topNodes || '—'} | ${example.readoutTabs.length} | ${example.recommendedSections.length} | ${example.contrastModes.length} | ${example.uiHints?.defaultSimilarSection || '—'} | ${example.uiHints?.defaultContrastMode || '—'} |`;

  }),

  '',

  '## First Recommended Match Per Target',

  '',

  ...packet.examples.flatMap(example => {

    const firstSection = example.recommendedSections.find(section => section.matchCount > 0);

    const firstMatch = firstSection?.firstMatch;

    return [

      `### ${example.targetId}`,

      '',

      `Section: ${firstSection?.label || 'none'}`,

      '',

      `Match: ${firstMatch?.title || 'none'}`,

      '',

      `Score: ${firstMatch?.similarityLabel || firstMatch?.contrastLabel || 'none'}`,

      '',

      `Why: ${firstMatch?.why || 'none'}`,

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

  examples: packet.examples.length

}, null, 2));

