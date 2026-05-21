
const { buildSnareVoicePacket } = require('./buildSnareVoicePacket');

const { DEFAULT_SNARE_CALIBRATION_OVERLAY } = require('./defaultSnareCalibrationOverlay');

const { SNARE_NODE_KEYS } = require('./snareEngineConstants');

const { calculateVoiceDistance, getNodeDeltaSummary } = require('./findSimilarSnareVoices');

const CONTRAST_MODES = {

  overallContrast: {

    attack: 1,

    brightness: 1,

    projection: 1,

    sustain: 1,

    warmth: 1,

    sensitivity: 1,

    control: 1

  },

  dryToOpen: {

    sustain: 1.35,

    warmth: 1.05,

    control: 1.25,

    sensitivity: 0.75,

    attack: 0.8,

    brightness: 0.7,

    projection: 0.8

  },

  warmToBright: {

    warmth: 1.35,

    brightness: 1.35,

    sustain: 0.85,

    attack: 0.85,

    projection: 0.75,

    sensitivity: 0.7,

    control: 0.7

  },

  controlledToExplosive: {

    control: 1.35,

    projection: 1.25,

    attack: 1.15,

    sustain: 0.9,

    brightness: 0.85,

    warmth: 0.7,

    sensitivity: 0.7

  },

  sensitiveToAuthoritative: {

    sensitivity: 1.35,

    projection: 1.2,

    attack: 1.1,

    control: 0.9,

    sustain: 0.8,

    brightness: 0.75,

    warmth: 0.75

  }

};

const normalizeCandidateRecord = (record, options) => {

  if (record?.packetVersion) return record;

  return buildSnareVoicePacket(record, {

    overlay: options.overlay || DEFAULT_SNARE_CALIBRATION_OVERLAY,

    applyOverlay: options.applyOverlay !== false,

    includeBaseScore: false,

    includeRawRecord: false,

    mode: options.packetMode || 'contrastVoiceCandidate'

  });

};

const getDominantContrastNodes = (targetProfile = {}, candidateProfile = {}, limit = 3) => {

  return getNodeDeltaSummary(targetProfile, candidateProfile)

    .filter(item => item.absDelta > 0)

    .slice(0, limit)

    .map(item => ({

      node: item.node,

      delta: item.delta,

      absDelta: item.absDelta,

      direction: item.delta > 0 ? 'more' : 'less'

    }));

};

const buildContrastTitle = contrastNodes => {

  const first = contrastNodes[0];

  if (!first) return 'Subtle alternate voice';

  const direction = first.direction === 'more' ? 'More' : 'Less';

  return `${direction} ${first.node}`;

};

const buildContrastReason = contrastNodes => {

  if (!contrastNodes.length) {

    return 'This match offers a subtle alternate voice without a major node shift.';

  }

  const readable = contrastNodes

    .slice(0, 3)

    .map(item => `${item.direction} ${item.node}`)

    .join(', ');

  return `This match creates contrast by reading ${readable} than the target.`;

};

const getMaterialContrast = (targetDrum, candidateDrum) => {

  const targetMaterial = targetDrum?.families?.shellMaterial || 'unknown';

  const candidateMaterial = candidateDrum?.families?.shellMaterial || 'unknown';

  return {

    changed: targetMaterial !== candidateMaterial,

    targetMaterial,

    candidateMaterial

  };

};

const getConstructionContrast = (targetDrum, candidateDrum) => {

  const targetConstruction = targetDrum?.families?.shellConstruction || 'unknown';

  const candidateConstruction = candidateDrum?.families?.shellConstruction || 'unknown';

  return {

    changed: targetConstruction !== candidateConstruction,

    targetConstruction,

    candidateConstruction

  };

};

const scoreContrastCandidate = ({ targetPacket, candidatePacket, mode }) => {

  const modeWeights = CONTRAST_MODES[mode] || CONTRAST_MODES.overallContrast;

  const distance = calculateVoiceDistance(

    targetPacket.voiceProfile,

    candidatePacket.voiceProfile,

    {

      mode: 'overall',

      nodeWeights: modeWeights

    }

  );

  const contrastNodes = getDominantContrastNodes(

    targetPacket.voiceProfile,

    candidatePacket.voiceProfile,

    4

  );

  const meaningfulNodeSpread = contrastNodes

    .slice(0, 3)

    .reduce((sum, item) => sum + item.absDelta, 0);

  const materialContrast = getMaterialContrast(targetPacket.drum, candidatePacket.drum);

  const constructionContrast = getConstructionContrast(targetPacket.drum, candidatePacket.drum);

  const materialBonus = materialContrast.changed ? 0.08 : 0;

  const constructionBonus = constructionContrast.changed ? 0.05 : 0;

  /*

    Contrast is intentionally scaled with more headroom than similarity.

    We want "meaningfully different" to rank clearly without flattening

    every strong contrast to 100%.

  */

  const rawContrast =

    distance / 4.2 +

    meaningfulNodeSpread / 28 +

    materialBonus +

    constructionBonus;

  const contrastScore = Number(

    Math.max(0, Math.min(0.985, rawContrast)).toFixed(4)

  );

  return {

    distance,

    contrastScore,

    contrastPercent: Number((contrastScore * 100).toFixed(1)),

    contrastNodes,

    materialContrast,

    constructionContrast

  };

};

const findContrastingSnareVoices = (targetInput, candidateInputs = [], options = {}) => {

  const {

    overlay = DEFAULT_SNARE_CALIBRATION_OVERLAY,

    applyOverlay = true,

    mode = 'overallContrast',

    limit = 8,

    minContrastScore = 0.35,

    includeSelf = false,

    requireMaterialChange = false,

    requireConstructionChange = false

  } = options;

  const targetPacket = normalizeCandidateRecord(targetInput, {

    overlay,

    applyOverlay,

    packetMode: 'contrastVoiceTarget'

  });

  const matches = candidateInputs

    .map(candidateInput => {

      const candidatePacket = normalizeCandidateRecord(candidateInput, {

        overlay,

        applyOverlay,

        packetMode: 'contrastVoiceCandidate'

      });

      if (!includeSelf && targetPacket.drum?.id && candidatePacket.drum?.id === targetPacket.drum.id) {

        return null;

      }

      const contrast = scoreContrastCandidate({

        targetPacket,

        candidatePacket,

        mode

      });

      if (requireMaterialChange && !contrast.materialContrast.changed) return null;

      if (requireConstructionChange && !contrast.constructionContrast.changed) return null;

      if (contrast.contrastScore < minContrastScore) return null;

      return {

        drum: candidatePacket.drum,

        confidence: candidatePacket.confidence,

        summary: candidatePacket.summary,

        voiceProfile: candidatePacket.voiceProfile,

        topNodes: candidatePacket.topNodes,

        contrast,

        contrastTitle: buildContrastTitle(contrast.contrastNodes),

        contrastReason: buildContrastReason(contrast.contrastNodes),

        calibration: candidatePacket.calibration

      };

    })

    .filter(Boolean)

    .sort((a, b) => {

      if (b.contrast.contrastScore !== a.contrast.contrastScore) {

        return b.contrast.contrastScore - a.contrast.contrastScore;

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

    minContrastScore,

    matches

  };

};

module.exports = {

  findContrastingSnareVoices,

  scoreContrastCandidate,

  getDominantContrastNodes,

  CONTRAST_MODES

};

