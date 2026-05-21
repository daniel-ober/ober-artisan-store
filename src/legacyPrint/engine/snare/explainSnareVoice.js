
const { SNARE_NODE_DEFINITIONS } = require('./snareNodeDefinitions');

const NODE_TONE_COPY = {

  attack: {

    high: 'quick, articulate stick definition',

    medium: 'balanced stick definition',

    low: 'softer and rounder transient behavior'

  },

  brightness: {

    high: 'upper-frequency snap and cut',

    medium: 'balanced brightness',

    low: 'darker, rounder treble behavior'

  },

  projection: {

    high: 'strong room and mix carry',

    medium: 'moderate acoustic carry',

    low: 'more intimate projection'

  },

  sustain: {

    high: 'open ring and longer tonal bloom',

    medium: 'moderate ring and decay',

    low: 'shorter, drier decay'

  },

  warmth: {

    high: 'lower-mid body and roundness',

    medium: 'balanced body',

    low: 'leaner body with less low-mid emphasis'

  },

  sensitivity: {

    high: 'touch-responsive ghost-note behavior',

    medium: 'usable dynamic response',

    low: 'stiffer low-dynamic response'

  },

  control: {

    high: 'focused, contained response',

    medium: 'moderate focus',

    low: 'more open and less contained response'

  }

};

const getBand = value => {

  if (value >= 7.25) return 'high';

  if (value >= 6.15) return 'mediumHigh';

  if (value >= 5.65) return 'medium';

  if (value >= 4.85) return 'mediumLow';

  return 'low';

};

const getSimpleBand = value => {

  if (value >= 6.75) return 'high';

  if (value <= 5.35) return 'low';

  return 'medium';

};

const cleanSourceLabel = source => {

  if (!source) return 'unknown factor';

  return String(source)

    .replace(/^shellMaterial:/, 'shell material: ')

    .replace(/^shellConstruction:/, 'shell construction: ')

    .replace(/^bearingEdge:/, 'bearing edge: ')

    .replace(/^hoopType:/, 'hoop: ')

    .replace(/^snareBed:/, 'snare bed: ')

    .replace(/^shellThickness:/, 'shell thickness: ')

    .replace(/^diameter:/, 'diameter: ')

    .replace(/^depth:/, 'depth: ')

    .replace(/^lugCount:/, 'lug count: ')

    .replace(/([a-z])([A-Z])/g, '$1 $2')

    .replace(/:/g, ': ')

    .replace(/\s+/g, ' ')

    .trim();

};

const getTopDriversForNode = (scoredRecord, node, limit = 3) => {

  const drivers = scoredRecord?.drivers?.byNode?.[node] || [];

  return drivers.slice(0, limit).map(driver => ({

    ...driver,

    label: cleanSourceLabel(driver.source)

  }));

};

const buildVoiceTitle = scoredRecord => {

  const top = scoredRecord.topNodes || [];

  const topKeys = top.map(node => node.key);

  if (topKeys.includes('warmth') && topKeys.includes('sustain')) {

    return 'Warm, blooming snare voice';

  }

  if (topKeys.includes('attack') && topKeys.includes('brightness')) {

    return 'Fast, articulate cutting voice';

  }

  if (topKeys.includes('control') && topKeys.includes('attack')) {

    return 'Focused, controlled attack voice';

  }

  if (topKeys.includes('sensitivity') && topKeys.includes('warmth')) {

    return 'Responsive, warm player-focused voice';

  }

  if (topKeys.includes('projection') && topKeys.includes('sustain')) {

    return 'Carrying, open projection voice';

  }

  if (top[0]) {

    const label = SNARE_NODE_DEFINITIONS[top[0].key]?.label || top[0].key;

    return `${label}-led snare voice`;

  }

  return 'Balanced snare voice';

};

const buildDominantTraitSentence = scoredRecord => {

  const [first, second, third] = scoredRecord.topNodes || [];

  if (!first || !second || !third) {

    return 'This snare has a balanced voice with no single trait dominating the full read.';

  }

  const firstCopy = NODE_TONE_COPY[first.key]?.[getSimpleBand(first.value)] || first.key;

  const secondCopy = NODE_TONE_COPY[second.key]?.[getSimpleBand(second.value)] || second.key;

  const thirdCopy = NODE_TONE_COPY[third.key]?.[getSimpleBand(third.value)] || third.key;

  return `This snare is led by ${firstCopy}, followed by ${secondCopy} and ${thirdCopy}.`;

};

const explainNode = (scoredRecord, node) => {

  const value = scoredRecord.voiceProfile[node];

  const definition = SNARE_NODE_DEFINITIONS[node] || {};

  const band = getBand(value);

  return {

    node,

    label: definition.label || node,

    value,

    band,

    question: definition.snareQuestion || '',

    meaning: definition.snareMeaning || '',

    read:

      band === 'high'

        ? definition.highRead

        : band === 'low'

          ? definition.lowRead

          : `This sits in a ${band.replace(/([A-Z])/g, ' $1').toLowerCase()} range for snare drums.`,

    drivers: getTopDriversForNode(scoredRecord, node)

  };

};

const buildFirstListenPreview = scoredRecord => {

  const top = scoredRecord.topNodes || [];

  return {

    title: buildVoiceTitle(scoredRecord),

    primaryNodes: top.map(node => ({

      node: node.key,

      label: SNARE_NODE_DEFINITIONS[node.key]?.label || node.key,

      value: node.value,

      drivers: getTopDriversForNode(scoredRecord, node.key)

    })),

    summary: buildDominantTraitSentence(scoredRecord)

  };

};

const buildPlayerAnalysisPreview = scoredRecord => ({

  title: 'Player Analysis',

  summary:

    'This read focuses on how the drum is likely to feel under the sticks: transient response, touch range, control, and body.',

  nodes: Object.keys(scoredRecord.voiceProfile).map(node => explainNode(scoredRecord, node))

});

const buildLegacyPrintIdentityPreview = scoredRecord => {

  const strongestSources = scoredRecord?.drivers?.strongestSources || [];

  return {

    title: 'LegacyPrint Identity',

    summary:

      'This identity read combines the strongest physical drivers behind the voice profile without using price, prestige, rarity, collectibility, or brand hype.',

    strongestPhysicalDrivers: strongestSources.slice(0, 8).map(driver => ({

      ...driver,

      label: cleanSourceLabel(driver.source)

    }))

  };

};

const explainSnareVoice = scoredRecord => ({

  engineVersion: scoredRecord?.doctrine?.version || 'legacyprint-snare-engine-v0.1',

  drum: {

    id: scoredRecord.id,

    company: scoredRecord.company,

    model: scoredRecord.model,

    size: scoredRecord.size

  },

  voiceTitle: buildVoiceTitle(scoredRecord),

  voiceSummary: buildDominantTraitSentence(scoredRecord),

  confidence: scoredRecord.confidence,

  firstListen: buildFirstListenPreview(scoredRecord),

  playerAnalysis: buildPlayerAnalysisPreview(scoredRecord),

  legacyPrintIdentity: buildLegacyPrintIdentityPreview(scoredRecord)

});

module.exports = {

  explainSnareVoice,

  explainNode,

  buildFirstListenPreview,

  buildPlayerAnalysisPreview,

  buildLegacyPrintIdentityPreview

};

