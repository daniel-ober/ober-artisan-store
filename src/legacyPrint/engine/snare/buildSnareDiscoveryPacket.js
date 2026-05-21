
const { buildSnareVoicePacket } = require('./buildSnareVoicePacket');

const { findSimilarSnareVoices } = require('./findSimilarSnareVoices');

const { groupSimilarSnareVoiceMatches } = require('./groupSimilarSnareVoiceMatches');

const { findContrastingSnareVoices } = require('./findContrastingSnareVoices');

const { DEFAULT_SNARE_CALIBRATION_OVERLAY } = require('./defaultSnareCalibrationOverlay');

const { SNARE_ENGINE_VERSION } = require('./snareEngineConstants');

const DEFAULT_DISCOVERY_OPTIONS = {

  similarMode: 'legacyPrintIdentity',

  similarLimit: 40,

  similarMinSimilarity: 0.5,

  groupedSimilarLimits: {

    nearDuplicateLimit: 4,

    sameFamilyLimit: 4,

    sameMaterialLimit: 6,

    differentBrandLimit: 8,

    broadAlternativesLimit: 4

  },

  contrastModes: [

    'overallContrast',

    'dryToOpen',

    'warmToBright',

    'controlledToExplosive'

  ],

  contrastLimit: 5,

  contrastMinScore: 0.4

};

const compactMatch = match => ({

  drum: match.drum,

  confidence: match.confidence,

  summary: match.summary,

  voiceProfile: match.voiceProfile,

  topNodes: match.topNodes,

  similarity: match.similarity || null,

  contrast: match.contrast || null,

  sharedTopNodes: match.sharedTopNodes || [],

  matchReason: match.matchReason || null,

  contrastReason: match.contrastReason || null,

  groupReason: match.groupReason || null,

  matchGroup: match.matchGroup || null,

  calibration: match.calibration || null

});

const compactGroupedSimilar = grouped => ({

  target: grouped.target,

  mode: grouped.mode,

  counts: grouped.counts,

  groups: Object.fromEntries(

    Object.entries(grouped.groups || {}).map(([key, matches]) => [

      key,

      matches.map(compactMatch)

    ])

  )

});

const buildContrastSections = ({ targetPacket, corpusPackets, options }) => {

  return options.contrastModes.map(mode => {

    const result = findContrastingSnareVoices(targetPacket, corpusPackets, {

      mode,

      limit: options.contrastLimit,

      minContrastScore: options.contrastMinScore,

      requireMaterialChange: mode !== 'overallContrast',

      includeSelf: false

    });

    return {

      mode,

      target: result.target,

      matches: result.matches.map(compactMatch)

    };

  });

};

const buildRecommendedDiscoverySections = ({ groupedSimilar, contrastSections }) => {

  const sections = [];

  const differentBrandCount =

    groupedSimilar.groups?.differentBrandAlternatives?.length || 0;

  const sameMaterialCount =

    groupedSimilar.groups?.sameMaterialAlternatives?.length || 0;

  const nearDuplicateCount =

    groupedSimilar.groups?.nearDuplicates?.length || 0;

  if (differentBrandCount) {

    sections.push({

      key: 'differentBrandAlternatives',

      label: 'Other Brand Alternatives',

      priority: 1,

      reason: 'Show customers similar voice behavior outside the original brand family.'

    });

  }

  if (sameMaterialCount) {

    sections.push({

      key: 'sameMaterialAlternatives',

      label: 'Same Shell Material Alternatives',

      priority: 2,

      reason: 'Useful when a customer likes the core material voice but wants other versions.'

    });

  }

  if (nearDuplicateCount) {

    sections.push({

      key: 'nearDuplicates',

      label: 'Closest Relatives',

      priority: 3,

      reason: 'Useful for showing near-identical sizes or same-family variants.'

    });

  }

  const strongestContrast = contrastSections

    .flatMap(section =>

      section.matches.map(match => ({

        mode: section.mode,

        score: match.contrast?.contrastScore || 0

      }))

    )

    .sort((a, b) => b.score - a.score)[0];

  if (strongestContrast) {

    sections.push({

      key: 'voiceContrast',

      label: 'Explore a Different Flavor',

      priority: 4,

      reason: `Strongest contrast mode is ${strongestContrast.mode}.`

    });

  }

  return sections.sort((a, b) => a.priority - b.priority);

};

const buildSnareDiscoveryPacket = (targetInput, corpusInputs = [], options = {}) => {

  const mergedOptions = {

    ...DEFAULT_DISCOVERY_OPTIONS,

    ...options,

    groupedSimilarLimits: {

      ...DEFAULT_DISCOVERY_OPTIONS.groupedSimilarLimits,

      ...(options.groupedSimilarLimits || {})

    }

  };

  const {

    overlay = DEFAULT_SNARE_CALIBRATION_OVERLAY,

    applyOverlay = true,

    includeBaseScore = true,

    includeRawRecord = false

  } = mergedOptions;

  const targetPacket = targetInput?.packetVersion

    ? targetInput

    : buildSnareVoicePacket(targetInput, {

        overlay,

        applyOverlay,

        includeBaseScore,

        includeRawRecord,

        mode: 'customerDiscoveryTarget'

      });

  const corpusPackets = corpusInputs.map(input =>

    input?.packetVersion

      ? input

      : buildSnareVoicePacket(input, {

          overlay,

          applyOverlay,

          includeBaseScore: false,

          includeRawRecord: false,

          mode: 'customerDiscoveryCorpus'

        })

  );

  const similar = findSimilarSnareVoices(targetPacket, corpusPackets, {

    mode: mergedOptions.similarMode,

    limit: mergedOptions.similarLimit,

    minSimilarity: mergedOptions.similarMinSimilarity,

    includeSelf: false

  });

  const groupedSimilar = compactGroupedSimilar(

    groupSimilarSnareVoiceMatches(similar, mergedOptions.groupedSimilarLimits)

  );

  const contrastSections = buildContrastSections({

    targetPacket,

    corpusPackets,

    options: mergedOptions

  });

  const recommendedSections = buildRecommendedDiscoverySections({

    groupedSimilar,

    contrastSections

  });

  return {

    packetVersion: 'snare-discovery-packet-v0.1',

    engineVersion: SNARE_ENGINE_VERSION,

    generatedAt: new Date().toISOString(),

    target: targetPacket,

    discovery: {

      similar: {

        mode: similar.mode,

        limit: similar.limit,

        minSimilarity: similar.minSimilarity,

        grouped: groupedSimilar

      },

      contrast: {

        modes: mergedOptions.contrastModes,

        sections: contrastSections

      },

      recommendedSections

    },

    uiHints: {

      primaryTabs: [

        'firstListen',

        'playerAnalysis',

        'legacyPrintIdentity'

      ],

      matchSections: recommendedSections.map(section => section.key),

      defaultSimilarSection:

        groupedSimilar.groups.differentBrandAlternatives?.length

          ? 'differentBrandAlternatives'

          : 'sameMaterialAlternatives',

      defaultContrastMode: contrastSections[0]?.mode || 'overallContrast'

    }

  };

};

module.exports = {

  buildSnareDiscoveryPacket,

  DEFAULT_DISCOVERY_OPTIONS

};

