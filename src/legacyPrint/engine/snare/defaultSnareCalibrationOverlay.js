
const DEFAULT_SNARE_CALIBRATION_OVERLAY = {

  enabled: true,

  version: 'snare-calibration-overlay-v0.1-local-preview',

  confidence: 'adminPreview',

  firestoreWritesAllowed: false,

  globalNodeDeltas: {},

  materialFamilyDeltas: {

    aluminum: {

      reason:

        'Preview overlay: aluminum snares should preserve dry control and touch response compared with brass.',

      confidence: 'adminPreview',

      deltas: {

        control: 0.03,

        sensitivity: 0.02,

        sustain: -0.02

      }

    },

    brass: {

      reason:

        'Preview overlay: brass snares keep a touch more musical sustain after benchmark calibration.',

      confidence: 'adminPreview',

      deltas: {

        sustain: 0.01

      }

    }

  },

  constructionFamilyDeltas: {},

  hoopFamilyDeltas: {

    dieCast: {

      reason:

        'Preview overlay: die-cast hoops slightly emphasize focus/control and slightly reduce open ring.',

      confidence: 'adminPreview',

      deltas: {

        control: 0.03,

        sustain: -0.02

      }

    }

  },

  bearingEdgeFamilyDeltas: {},

  knownDrumDeltas: [

    {

      id: 'ludwig-acrolite-family-preview',

      enabled: true,

      company: 'Ludwig',

      modelRegex: 'acrolite',

      reason:

        'Preview known-drum overlay: Acrolite family retains dry controlled aluminum identity.',

      confidence: 'adminPreview',

      deltas: {

        control: 0.04,

        sustain: -0.03

      }

    }

  ],

  readoutMapWeights: {

    firstListen: {

      scoreStrength: 0.62,

      physicalDriverStrength: 0.28,

      rankWeight: 0.1

    },

    playerAnalysis: {

      scoreStrength: 0.58,

      physicalDriverStrength: 0.22,

      feelPriority: 0.2

    },

    legacyPrintIdentity: {

      scoreStrength: 0.5,

      physicalDriverStrength: 0.34,

      identityPriority: 0.16

    }

  }

};

module.exports = {

  DEFAULT_SNARE_CALIBRATION_OVERLAY

};

