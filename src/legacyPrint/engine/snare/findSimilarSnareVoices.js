
const { buildSnareVoicePacket } = require('./buildSnareVoicePacket');

const { DEFAULT_SNARE_CALIBRATION_OVERLAY } = require('./defaultSnareCalibrationOverlay');

const { SNARE_NODE_KEYS } = require('./snareEngineConstants');

const DEFAULT_NODE_WEIGHTS = {

  attack: 1,

  brightness: 0.95,

  projection: 0.9,

  sustain: 1,

  warmth: 1,

  sensitivity: 0.95,

  control: 1

};

const MODE_WEIGHTS = {

  overall: DEFAULT_NODE_WEIGHTS,

  firstListen: {

    attack: 1.15,

    brightness: 1.05,

    projection: 1,

    sustain: 1,

    warmth: 1,

    sensitivity: 0.85,

    control: 0.9

  },

  playerAnalysis: {

    attack: 1.05,

    brightness: 0.8,

    projection: 0.75,

    sustain: 0.9,

    warmth: 0.95,

    sensitivity: 1.15,

    control: 1.15

  },

  legacyPrintIdentity: {

    attack: 1,

    brightness: 0.9,

    projection: 0.9,

    sustain: 1.05,

    warmth: 1.05,

    sensitivity: 0.95,

    control: 1

  }

};

const clamp01 = value => Math.max(0, Math.min(1, Number(value.toFixed(4))));

const getNodeWeight = (mode, node, customWeights = {}) => {

  const modeWeights = MODE_WEIGHTS[mode] || MODE_WEIGHTS.overall;

  return Number(customWeights[node] ?? modeWeights[node] ?? 1);

};

const calculateVoiceDistance = (aProfile = {}, bProfile = {}, options = {}) => {

  const {

    mode = 'overall',

    nodeWeights = {}

  } = options;

  let weightedSquaredDistance = 0;

  let totalWeight = 0;

  for (const node of SNARE_NODE_KEYS) {

    const a = Number(aProfile[node] || 0);

    const b = Number(bProfile[node] || 0);

    const weight = getNodeWeight(mode, node, nodeWeights);

    const diff = a - b;

    weightedSquaredDistance += diff * diff * weight;

    totalWeight += weight;

  }

  if (!totalWeight) return 0;

  return Number(Math.sqrt(weightedSquaredDistance / totalWeight).toFixed(4));

};

const calculateVoiceSimilarity = (aProfile = {}, bProfile = {}, options = {}) => {

  const distance = calculateVoiceDistance(aProfile, bProfile, options);

  /*

    Voice scores live on a 1–10 range.

    A weighted distance around 0.00 is essentially identical.

    A weighted distance around 3.50+ is very different in practical snare-read terms.

  */

  const similarity = clamp01(1 - distance / 3.5);

  return {

    distance,

    similarity,

    similarityPercent: Number((similarity * 100).toFixed(1))

  };

};

const getSharedTopNodes = (aTopNodes = [], bTopNodes = []) => {

  const a = new Set(aTopNodes.map(node => node.key || node.node));

  return bTopNodes

    .map(node => node.key || node.node)

    .filter(node => a.has(node));

};

const getNodeDeltaSummary = (aProfile = {}, bProfile = {}) => {

  return SNARE_NODE_KEYS

    .map(node => ({

      node,

      delta: Number(((bProfile[node] || 0) - (aProfile[node] || 0)).toFixed(2)),

      absDelta: Math.abs(Number(((bProfile[node] || 0) - (aProfile[node] || 0)).toFixed(2)))

    }))

    .sort((a, b) => b.absDelta - a.absDelta);

};

const buildMatchReason = ({ targetPacket, candidatePacket, sharedTopNodes, nodeDeltas }) => {

  const strongestShared = sharedTopNodes.slice(0, 2);

  if (strongestShared.length >= 2) {

    return `Shares ${strongestShared.join(' and ')} as defining voice traits.`;

  }

  if (strongestShared.length === 1) {

    return `Shares ${strongestShared[0]} as a defining voice trait.`;

  }

  const closestNodes = nodeDeltas

    .slice()

    .sort((a, b) => a.absDelta - b.absDelta)

    .slice(0, 2)

    .map(item => item.node);

  if (closestNodes.length) {

    return `Closest match behavior appears around ${closestNodes.join(' and ')}.`;

  }

  return `Similar overall LegacyPrint voice shape.`;

};

const buildContrastReason = nodeDeltas => {

  const largest = nodeDeltas[0];

  if (!largest || largest.absDelta < 0.25) {

    return 'Very little practical contrast across the main voice nodes.';

  }

  const direction = largest.delta > 0 ? 'more' : 'less';

  return `Compared with the target, this match reads ${direction} ${largest.node}.`;

};

const normalizeCandidateRecord = (record, options) => {

  if (record?.packetVersion) return record;

  return buildSnareVoicePacket(record, {

    overlay: options.overlay || DEFAULT_SNARE_CALIBRATION_OVERLAY,

    applyOverlay: options.applyOverlay !== false,

    includeBaseScore: false,

    includeRawRecord: false,

    mode: options.packetMode || 'similarVoiceMatch'

  });

};

const findSimilarSnareVoices = (targetInput, candidateInputs = [], options = {}) => {

  const {

    overlay = DEFAULT_SNARE_CALIBRATION_OVERLAY,

    applyOverlay = true,

    mode = 'overall',

    nodeWeights = {},

    limit = 8,

    minSimilarity = 0,

    includeSelf = false

  } = options;

  const targetPacket = normalizeCandidateRecord(targetInput, {

    overlay,

    applyOverlay,

    packetMode: 'similarVoiceTarget'

  });

  const matches = candidateInputs

    .map(candidateInput => {

      const candidatePacket = normalizeCandidateRecord(candidateInput, {

        overlay,

        applyOverlay,

        packetMode: 'similarVoiceCandidate'

      });

      if (!includeSelf && targetPacket.drum?.id && candidatePacket.drum?.id === targetPacket.drum.id) {

        return null;

      }

      const similarity = calculateVoiceSimilarity(

        targetPacket.voiceProfile,

        candidatePacket.voiceProfile,

        { mode, nodeWeights }

      );

      const sharedTopNodes = getSharedTopNodes(targetPacket.topNodes, candidatePacket.topNodes);

      const nodeDeltas = getNodeDeltaSummary(targetPacket.voiceProfile, candidatePacket.voiceProfile);

      return {

        drum: candidatePacket.drum,

        confidence: candidatePacket.confidence,

        summary: candidatePacket.summary,

        voiceProfile: candidatePacket.voiceProfile,

        topNodes: candidatePacket.topNodes,

        similarity,

        sharedTopNodes,

        nodeDeltas,

        matchReason: buildMatchReason({

          targetPacket,

          candidatePacket,

          sharedTopNodes,

          nodeDeltas

        }),

        contrastReason: buildContrastReason(nodeDeltas),

        calibration: candidatePacket.calibration

      };

    })

    .filter(Boolean)

    .filter(match => match.similarity.similarity >= minSimilarity)

    .sort((a, b) => {

      if (b.similarity.similarity !== a.similarity.similarity) {

        return b.similarity.similarity - a.similarity.similarity;

      }

      return b.confidence.score - a.confidence.score;

    })

    .slice(0, limit);

  return {

    target: {

      drum: targetPacket.drum,

      summary: targetPacket.summary,

      voiceProfile: targetPacket.voiceProfile,

      topNodes: targetPacket.topNodes,

      confidence: targetPacket.confidence

    },

    mode,

    limit,

    minSimilarity,

    matches

  };

};

module.exports = {

  findSimilarSnareVoices,

  calculateVoiceDistance,

  calculateVoiceSimilarity,

  getNodeDeltaSummary,

  getSharedTopNodes

};

