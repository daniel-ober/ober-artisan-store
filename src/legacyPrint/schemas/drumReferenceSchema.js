export const drumReferenceSchema = {

  id: 'string',

  schemaVersion: 'string',

  companyId: 'string',

  companyName: 'string',

  lineSeries: 'string',

  modelName: 'string',

  modelNumber: 'string',

  drumType: 'string',

  dimensions: {

    diameterInches: 'number',

    depthInches: 'number'

  },

  shell: {

    construction: 'string',

    materialPrimary: 'string',

    materialSecondary: 'string',

    materialTertiary: 'string',

    plyCount: 'number',

    staveCount: 'number',

    shellThicknessMm: 'number',

    reinforcementRings: {

      hasReinforcementRings: 'boolean',

      material: 'string',

      thicknessMm: 'number'

    },

    bearingEdge: 'string',

    snareBeds: {

      hasSnareBeds: 'boolean',

      depth: 'string'

    },

    finishType: 'string'

  },

  stockHardware: {

    hoopType: 'string',

    lugCount: 'number',

    lugType: 'string',

    throwOff: 'string',

    hardwareMaterial: 'string',

    hardwareFinish: 'string'

  },

  stockSetup: {

    batterHeadId: 'string',

    resoHeadId: 'string',

    snareWireId: 'string'

  },

  modifierIds: ['string'],

  sourceIds: ['string'],

  fieldSources: {

    type: 'map'

  },

  referenceLayer: {

    baseConfigSource: 'string',

    sourceConfidence: 'string',

    voiceScoreConfidence: 'string'

  },

  engineReady: 'boolean',

  missingFields: ['string'],

  notes: 'string',

  createdAt: 'timestamp',

  updatedAt: 'timestamp'

};