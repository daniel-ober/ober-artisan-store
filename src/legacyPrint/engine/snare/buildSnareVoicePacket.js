
const { scoreSnareVoice } = require('./scoreSnareVoice');

const { applySnareCalibrationOverlay } = require('./applySnareCalibrationOverlay');

const { DEFAULT_SNARE_CALIBRATION_OVERLAY } = require('./defaultSnareCalibrationOverlay');

const { explainSnareVoice } = require('./explainSnareVoice');

const { resolveSnareReadoutMaps } = require('./resolveSnareReadoutMaps');

const { SNARE_ENGINE_VERSION } = require('./snareEngineConstants');

const diffVoiceProfiles = (baseProfile = {}, calibratedProfile = {}) => {

  const deltas = {};

  for (const node of Object.keys(baseProfile)) {

    const base = Number(baseProfile[node] || 0);

    const calibrated = Number(calibratedProfile[node] || 0);

    const delta = Number((calibrated - base).toFixed(2));

    if (delta !== 0) {

      deltas[node] = delta;

    }

  }

  return deltas;

};

const buildCalibrationSummary = ({ baseScore, calibratedScore }) => {

  const deltas = diffVoiceProfiles(baseScore.voiceProfile, calibratedScore.voiceProfile);

  const changedNodes = Object.keys(deltas);

  return {

    applied: calibratedScore.calibrationOverlay?.applied || false,

    overlayVersion: calibratedScore.calibrationOverlay?.overlayVersion || null,

    appliedChanges: calibratedScore.calibrationOverlay?.appliedChanges || [],

    changedNodes,

    deltas

  };

};

const buildSnareVoicePacket = (rawRecord, options = {}) => {

  const {

    overlay = DEFAULT_SNARE_CALIBRATION_OVERLAY,

    applyOverlay = true,

    includeBaseScore = true,

    includeRawRecord = false,

    mode = 'customer'

  } = options;

  const baseScore = scoreSnareVoice(rawRecord);

  const calibratedScore = applyOverlay

    ? applySnareCalibrationOverlay(baseScore, overlay)

    : baseScore;

  const scoredRecordForReadouts = {

    ...calibratedScore,

    drivers: calibratedScore.drivers || baseScore.drivers || {

      strongestSources: [],

      byNode: {}

    }

  };

  const explanation = explainSnareVoice(scoredRecordForReadouts);

  const readoutMaps = resolveSnareReadoutMaps(scoredRecordForReadouts);

  const calibration = buildCalibrationSummary({ baseScore, calibratedScore });

  return {

    packetVersion: 'snare-voice-packet-v0.1',

    engineVersion: SNARE_ENGINE_VERSION,

    mode,

    drum: {

      id: calibratedScore.id,

      company: calibratedScore.company,

      model: calibratedScore.model,

      lineSeries: calibratedScore.lineSeries,

      size: calibratedScore.size,

      families: calibratedScore.families

    },

    confidence: calibratedScore.confidence,

    voiceProfile: calibratedScore.voiceProfile,

    topNodes: calibratedScore.topNodes,

    readouts: {

      firstListen: {

        ...readoutMaps.firstListen,

        explanation: explanation.firstListen

      },

      playerAnalysis: {

        ...readoutMaps.playerAnalysis,

        explanation: explanation.playerAnalysis

      },

      legacyPrintIdentity: {

        ...readoutMaps.legacyPrintIdentity,

        explanation: explanation.legacyPrintIdentity

      }

    },

    summary: {

      title: explanation.voiceTitle,

      text: explanation.voiceSummary

    },

    physicalDrivers: {

      strongest: scoredRecordForReadouts.drivers?.strongestSources || [],

      byNode: scoredRecordForReadouts.drivers?.byNode || {}

    },

    fallbackAssumptions: scoredRecordForReadouts.fallbackAssumptions || {},

    calibration,

    doctrine: calibratedScore.doctrine,

    ...(includeBaseScore ? {

      baseScore: {

        voiceProfile: baseScore.voiceProfile,

        topNodes: baseScore.topNodes,

        confidence: baseScore.confidence,

        fallbackAssumptions: baseScore.fallbackAssumptions || {}

      }

    } : {}),

    ...(includeRawRecord ? { rawRecord } : {})

  };

};

module.exports = {

  buildSnareVoicePacket,

  diffVoiceProfiles

};

