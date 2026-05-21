
const { scoreSnareVoice } = require('./scoreSnareVoice');

const {

  SNARE_NODE_KEYS,

  SNARE_BASELINE_PROFILE,

  SNARE_ENGINE_VERSION,

  SNARE_ENGINE_DOCTRINE

} = require('./snareEngineConstants');

const { SNARE_NODE_DEFINITIONS } = require('./snareNodeDefinitions');

const { adaptSnareReferenceRecord } = require('./snareInputAdapter');

const {

  explainSnareVoice,

  explainNode,

  buildFirstListenPreview,

  buildPlayerAnalysisPreview,

  buildLegacyPrintIdentityPreview

} = require('./explainSnareVoice');

const {

  resolveSnareReadoutMaps,

  resolveFirstListenMap,

  resolvePlayerAnalysisMap,

  resolveLegacyPrintIdentityMap

} = require('./resolveSnareReadoutMaps');

const {

  applySnareCalibrationOverlay

} = require('./applySnareCalibrationOverlay');

const {

  DEFAULT_SNARE_CALIBRATION_OVERLAY

} = require('./defaultSnareCalibrationOverlay');

const {

  validateSnareCalibrationOverlay

} = require('./validateSnareCalibrationOverlay');

const {

  buildSnareVoicePacket,

  diffVoiceProfiles

} = require('./buildSnareVoicePacket');

const {

  findSimilarSnareVoices,

  calculateVoiceDistance,

  calculateVoiceSimilarity,

  getNodeDeltaSummary,

  getSharedTopNodes

} = require('./findSimilarSnareVoices');

const {

  groupSimilarSnareVoiceMatches,

  getModelSimilarity,

  isSameFamily,

  isNearDuplicate,

  isSameMaterial,

  isSameConstruction

} = require('./groupSimilarSnareVoiceMatches');

const {

  findContrastingSnareVoices,

  scoreContrastCandidate,

  getDominantContrastNodes,

  CONTRAST_MODES

} = require('./findContrastingSnareVoices');

module.exports = {

  scoreSnareVoice,

  adaptSnareReferenceRecord,

  SNARE_NODE_KEYS,

  SNARE_BASELINE_PROFILE,

  SNARE_ENGINE_VERSION,

  SNARE_ENGINE_DOCTRINE,

  SNARE_NODE_DEFINITIONS,

  explainSnareVoice,

  explainNode,

  buildFirstListenPreview,

  buildPlayerAnalysisPreview,

  buildLegacyPrintIdentityPreview,

  resolveSnareReadoutMaps,

  resolveFirstListenMap,

  resolvePlayerAnalysisMap,

  resolveLegacyPrintIdentityMap,

  applySnareCalibrationOverlay,

  DEFAULT_SNARE_CALIBRATION_OVERLAY,

  validateSnareCalibrationOverlay,

  buildSnareVoicePacket,

  diffVoiceProfiles,

  findSimilarSnareVoices,

  calculateVoiceDistance,

  calculateVoiceSimilarity,

  getNodeDeltaSummary,

  getSharedTopNodes,

  groupSimilarSnareVoiceMatches,

  getModelSimilarity,

  isSameFamily,

  isNearDuplicate,

  isSameMaterial,

  isSameConstruction,

  findContrastingSnareVoices,

  scoreContrastCandidate,

  getDominantContrastNodes,

  CONTRAST_MODES

};

