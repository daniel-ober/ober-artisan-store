
const SNARE_NODE_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control'

];

const SNARE_BASELINE_PROFILE = {

  attack: 5,

  brightness: 5,

  projection: 5,

  sustain: 5,

  warmth: 5,

  sensitivity: 5,

  control: 5

};

const SNARE_ENGINE_VERSION = 'legacyprint-snare-engine-v0.1';

const SNARE_ENGINE_DOCTRINE = {

  version: SNARE_ENGINE_VERSION,

  scoreMode: 'snareRelativePhysicalModel',

  universalDrumCalibration: 'planned',

  brandPrestigeScoring: false,

  pricePrestigeScoring: false,

  collectibilityScoring: false,

  stockHeadsBlockPromotion: false,

  stockSnareWiresBlockPromotion: false,

  productionStatusBlocksPromotion: false,

  brandMultiplierPolicy:

    'Brand multipliers are allowed only when they represent documented physical build behavior: shell layup, construction method, edge geometry, hardware mass, or other measurable acoustic factors.',

  firestoreScoringWritesAllowed: false

};

module.exports = {

  SNARE_NODE_KEYS,

  SNARE_BASELINE_PROFILE,

  SNARE_ENGINE_VERSION,

  SNARE_ENGINE_DOCTRINE

};

