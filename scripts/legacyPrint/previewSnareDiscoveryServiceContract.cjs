
const fs = require('fs');

const {

  normalizeDiscoveryPacketResponse,

  getTargetReadoutTabs,

  getRecommendedMatchSections,

  getContrastModeOptions,

  createLocalDiscoveryPacketLoader

} = require('../../src/legacyPrint/services/snareDiscoveryService');

const IN_JSON = 'src/legacyPrint/reviewPlans/snare-discovery-packet-api-preview-v01.json';

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-discovery-service-contract-preview-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-discovery-service-contract-preview-v01.md';

const source = JSON.parse(fs.readFileSync(IN_JSON, 'utf8'));

const examples = source.examples || [];

const summarizeState = state => ({

  status: state.status,

  snareReferenceId: state.snareReferenceId,

  target:

    state.packet?.target

      ? {

          drum: state.packet.target.drum,

          topNodes: state.packet.target.topNodes,

          summary: state.packet.target.summary

        }

      : null,

  tabCount: getTargetReadoutTabs(state.packet).length,

  recommendedSectionCount: getRecommendedMatchSections(state.packet).length,

  contrastModeCount: getContrastModeOptions(state.packet).filter(mode => mode.matches.length).length,

  defaultSimilarSection: state.packet?.uiHints?.defaultSimilarSection || null,

  defaultContrastMode: state.packet?.uiHints?.defaultContrastMode || null

});

async function main() {

  const normalized = examples.map(example => {

    const state = normalizeDiscoveryPacketResponse(example.result);

    return {

      targetId: example.targetId,

      summary: summarizeState(state)

    };

  });

  const loader = createLocalDiscoveryPacketLoader(source);

  const localLoaderCheck = examples[0]

    ? await loader(examples[0].snareReferenceId)

    : null;

  const missingCheck = await loader('missing-test-reference-id');

  const packet = {

    status: 'SNARE_DISCOVERY_SERVICE_CONTRACT_PREVIEW_V01_NO_FIRESTORE_WRITES',

    generatedAt: new Date().toISOString(),

    firestoreWrites: 0,

    sourcePreview: IN_JSON,

    examples: normalized,

    localLoaderCheck: localLoaderCheck ? summarizeState(localLoaderCheck) : null,

    missingCheck: {

      status: missingCheck.status,

      snareReferenceId: missingCheck.snareReferenceId,

      error: missingCheck.error

    }

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

  const md = [

    '# LegacyPrint Snare Discovery Service Contract Preview v0.1',

    '',

    `Generated: ${packet.generatedAt}`,

    '',

    `- Firestore writes: ${packet.firestoreWrites}`,

    `- Source preview: ${packet.sourcePreview}`,

    `- Examples normalized: ${packet.examples.length}`,

    '',

    '## Normalized UI States',

    '',

    '| Target | Status | Tabs | Recommended Sections | Contrast Modes | Default Similar | Default Contrast |',

    '|---|---|---:|---:|---:|---|---|',

    ...packet.examples.map(example => {

      const s = example.summary;

      return `| ${example.targetId} | ${s.status} | ${s.tabCount} | ${s.recommendedSectionCount} | ${s.contrastModeCount} | ${s.defaultSimilarSection || '—'} | ${s.defaultContrastMode || '—'} |`;

    }),

    '',

    '## Local Loader Check',

    '',

    `Status: ${packet.localLoaderCheck?.status || 'none'}`,

    '',

    `Reference ID: ${packet.localLoaderCheck?.snareReferenceId || 'none'}`,

    '',

    '## Missing Reference Check',

    '',

    `Status: ${packet.missingCheck.status}`,

    '',

    `Error: ${packet.missingCheck.error}`,

    ''

  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(JSON.stringify({

    outJson: OUT_JSON,

    outMd: OUT_MD,

    status: packet.status,

    firestoreWrites: 0,

    examples: packet.examples.length

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

