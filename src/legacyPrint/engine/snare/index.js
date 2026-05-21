
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

  buildLegacyPrintIdentityPreview

};

