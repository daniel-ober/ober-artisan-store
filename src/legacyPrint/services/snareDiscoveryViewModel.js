
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

  if (Array.isArray(section.results)) return section.results;

  if (Array.isArray(section.items)) return section.items;

  if (Array.isArray(section.records)) return section.records;

  if (Array.isArray(section.matches?.matches)) return section.matches.matches;

  if (Array.isArray(section.results?.matches)) return section.results.matches;

  if (Array.isArray(section.items?.matches)) return section.items.matches;

  if (Array.isArray(section.group?.matches)) return section.group.matches;

  if (Array.isArray(section.data?.matches)) return section.data.matches;

  return [];

};

const getSimilarSectionMatches = (packet, section) => {

  const key = section?.key;

  const groups = packet?.discovery?.similar?.grouped?.groups || {};

  if (key === 'voiceContrast') {

    const defaultMode = packet?.uiHints?.defaultContrastMode || 'overallContrast';

    const contrastSections = packet?.discovery?.contrast?.sections || [];

    const selectedSection =

      contrastSections.find(item => item.key === defaultMode || item.mode === defaultMode) ||

      contrastSections[0];

    return getSectionMatches(selectedSection);

  }

  return getSectionMatches(groups[key] || section);

};

const getMatchDrum = match =>

  match?.drum ||

  match?.reference ||

  match?.snare ||

  match ||

  {};

const getSimilarityValue = match =>

  match?.similarityPercent ??

  match?.similarity?.similarityPercent ??

  match?.similarity ??

  null;

const getContrastValue = match =>

  match?.contrastPercent ??

  match?.contrast?.contrastPercent ??

  match?.contrastScore ??

  match?.contrast?.contrastScore ??

  match?.contrast ??

  null;

const mapMatchForUi = match => {

  const drum = getMatchDrum(match);

  const similarity = getSimilarityValue(match);

  const contrast = getContrastValue(match);

  const topNodes = match?.topNodes || drum?.topNodes || [];

  return {

    id: match?.id || match?.referenceId || drum?.id || null,

    company: match?.company || drum?.company || null,

    model: match?.model || match?.name || drum?.model || drum?.name || null,

    size: match?.size || drum?.size || null,

    title: [

      match?.company || drum?.company,

      match?.model || match?.name || drum?.model || drum?.name,

      match?.size || drum?.size

    ].filter(Boolean).join(' '),

    similarity,

    similarityLabel: formatPercent(similarity),

    contrast,

    contrastLabel: formatPercent(contrast),

    topNodes: formatNodeList(topNodes),

    why:

      match?.why ||

      match?.matchReason ||

      match?.groupReason ||

      match?.contrastReason ||

      null,

    summary: match?.summary || drum?.summary || null,

    raw: match

  };

};

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

    matches: getSimilarSectionMatches(packet, section).map(mapMatchForUi)

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

  getSimilarSectionMatches,

  mapMatchForUi,

  formatNodeList,

  formatPercent

};

