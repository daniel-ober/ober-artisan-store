
const {

  getTargetReadoutTabs,

  getRecommendedMatchSections,

  getContrastModeOptions

} = require('./snareDiscoveryService');

const formatPercent = value => {

  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;

  return `${Number(value).toFixed(1)}%`;

};

const formatNodeList = nodes => {

  if (!Array.isArray(nodes)) return [];

  return nodes.map(node => ({

    key: node.node || node.key,

    label: node.label || node.node || node.key,

    value: Number(node.value ?? node.score ?? 0),

    displayValue: Number(node.value ?? node.score ?? 0).toFixed(2)

  }));

};

const getSectionMatches = section => {

  if (!section) return [];

  if (Array.isArray(section.matches)) return section.matches;

  if (Array.isArray(section.items)) return section.items;

  if (Array.isArray(section.records)) return section.records;

  if (Array.isArray(section.results)) return section.results;

  return [];

};

const mapMatchForUi = match => ({

  id: match.id || match.referenceId || null,

  company: match.company || null,

  model: match.model || match.name || null,

  size: match.size || null,

  title: [match.company, match.model || match.name, match.size].filter(Boolean).join(' '),

  similarity: match.similarityPercent ?? match.similarity ?? null,

  similarityLabel: formatPercent(match.similarityPercent ?? match.similarity),

  contrast: match.contrastPercent ?? match.contrast ?? null,

  contrastLabel: formatPercent(match.contrastPercent ?? match.contrast),

  topNodes: formatNodeList(match.topNodes),

  sharedTopNodes: match.sharedTopNodes || [],

  why: match.why || match.groupReason || match.mainContrast || null,

  materialShift: match.materialShift || null,

  raw: match

});

const buildSnareDiscoveryViewModel = discoveryState => {

  const packet = discoveryState?.packet;

  if (!packet) {

    return {

      status: discoveryState?.status || 'idle',

      ready: false,

      error: discoveryState?.error || null,

      target: null,

      readoutTabs: [],

      recommendedSections: [],

      contrastModes: [],

      uiHints: null,

      raw: discoveryState || null

    };

  }

  const target = packet.target || {};

  const drum = target.drum || {};

  const readoutTabs = getTargetReadoutTabs(packet).map(tab => ({

    key: tab.key,

    label: tab.label,

    description: tab.description,

    summary: tab.summary || null,

    nodes: formatNodeList(tab.nodes)

  }));

  const recommendedSections = getRecommendedMatchSections(packet).map(section => ({

    key: section.key,

    label: section.label,

    description: section.description,

    matches: getSectionMatches(section).map(mapMatchForUi)

  }));

  const contrastModes = getContrastModeOptions(packet).map(mode => ({

    key: mode.key,

    label: mode.label,

    description: mode.description,

    matches: getSectionMatches(mode).map(mapMatchForUi)

  }));

  return {

    status: discoveryState.status,

    ready: true,

    error: null,

    target: {

      id: drum.id || discoveryState.snareReferenceId || null,

      company: drum.company || null,

      model: drum.model || null,

      size: drum.size || null,

      title: [drum.company, drum.model, drum.size].filter(Boolean).join(' '),

      summary: target.summary || null,

      description: target.description || null,

      confidence: target.confidence || null,

      topNodes: formatNodeList(target.topNodes)

    },

    readoutTabs,

    recommendedSections,

    contrastModes,

    uiHints: {

      defaultSimilarSection: packet.uiHints?.defaultSimilarSection || recommendedSections[0]?.key || null,

      defaultContrastMode: packet.uiHints?.defaultContrastMode || contrastModes[0]?.key || null

    },

    raw: packet

  };

};

module.exports = {

  buildSnareDiscoveryViewModel,

  getSectionMatches,

  mapMatchForUi,

  formatNodeList,

  formatPercent

};

