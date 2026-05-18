export const sampleDrumReference = {

  id: 'tama_starphonic_brass_14x6_metal-brass_sample',

  schemaVersion: '1.0.0',

  companyId: 'tama',

  companyName: 'Tama',

  lineSeries: 'Starphonic',

  modelName: 'Starphonic Brass',

  modelNumber: 'PBR146',

  drumType: 'snare',

  dimensions: {

    diameterInches: 14,

    depthInches: 6

  },

  shell: {

    construction: 'metalRolled',

    materialPrimary: 'brass',

    materialSecondary: 'unknown',

    materialTertiary: 'unknown',

    plyCount: null,

    staveCount: null,

    shellThicknessMm: 1.2,

    reinforcementRings: {

      hasReinforcementRings: false,

      material: 'unknown',

      thicknessMm: null

    },

    bearingEdge: 'rolledEdge',

    snareBeds: {

      hasSnareBeds: true,

      depth: 'medium'

    },

    finishType: 'naturalMetal'

  },

  stockHardware: {

    hoopType: 'dieCast',

    lugCount: 10,

    lugType: 'freedomLug',

    throwOff: 'linearDrive',

    hardwareMaterial: 'steel',

    hardwareFinish: 'chrome'

  },

  stockSetup: {

    batterHeadId: 'unknown',

    resoHeadId: 'unknown',

    snareWireId: 'unknown'

  },

  modifierIds: [],

  sourceIds: [

    'src_tama_sample'

  ],

  fieldSources: {

    'shell.construction': ['src_tama_sample'],

    'shell.materialPrimary': ['src_tama_sample'],

    'dimensions.diameterInches': ['src_tama_sample'],

    'dimensions.depthInches': ['src_tama_sample']

  },

  referenceLayer: {

    baseConfigSource: 'stock',

    sourceConfidence: 'medium',

    voiceScoreConfidence: 'medium'

  },

  engineReady: false,

  missingFields: [],

  notes: 'Sample LegacyPrint drum reference fixture for validator testing.',

  createdAt: null,

  updatedAt: null

};