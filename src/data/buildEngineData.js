// src/data/buildEngineData.js

export const BUILD_ENGINE_VERSION = 'v2-foundation';

// ============================================================
// 1) CORE TARGET AXES
// These are the sonic / feel outcomes the engine is trying to hit.
// Score range convention:
// 1 = very low / very soft / very little
// 10 = very high / very strong / very much
// ============================================================

export const TARGET_AXES = [
  'attack',
  'body',
  'warmth',
  'brightness',
  'articulation',
  'projection',
  'sensitivity',
  'decayControl',
  'tuningRange',
  'crossStick',
  'rimshotAuthority',
  'versatility',
];

export const TARGET_AXIS_META = {
  attack: {
    label: 'Attack',
    description:
      'How quickly and sharply the drum speaks at the front of the note.',
  },
  body: {
    label: 'Body',
    description:
      'How much fullness, weight, and low-mid substance the drum carries.',
  },
  warmth: {
    label: 'Warmth',
    description:
      'How rich, rounded, and full the tone feels rather than sharp or brittle.',
  },
  brightness: {
    label: 'Brightness',
    description:
      'How much upper-frequency cut, edge, and sheen the note carries.',
  },
  articulation: {
    label: 'Articulation',
    description:
      'How clearly individual strokes, doubles, and note definition come through.',
  },
  projection: {
    label: 'Projection',
    description:
      'How strongly the drum throws sound outward in a room or live setting.',
  },
  sensitivity: {
    label: 'Sensitivity',
    description:
      'How easily the drum responds to lighter touch, ghost notes, and nuance.',
  },
  decayControl: {
    label: 'Decay Control',
    description:
      'How controlled and managed the note tail feels after the attack.',
  },
  tuningRange: {
    label: 'Tuning Range',
    description:
      'How comfortably the drum performs across low, medium, and high tensions.',
  },
  crossStick: {
    label: 'Cross-Stick',
    description:
      'How dependable, musical, and satisfying the cross-stick voice is.',
  },
  rimshotAuthority: {
    label: 'Rimshot Authority',
    description:
      'How strong, confident, and impactful the drum feels on rimshots.',
  },
  versatility: {
    label: 'Versatility',
    description:
      'How broadly useful the build is across multiple tunings and situations.',
  },
};

// ============================================================
// 2) OBER ARTISAN DEFAULTS
// House bias. Not neutral on purpose.
// ============================================================

export const ARTISAN_DEFAULTS = {
  primaryConstruction: 'stave',
  secondaryConstruction: 'feuzonHybrid',
  defaultDiameter: '14',
  defaultDepth: '6.0',
  defaultThicknessZone: 'medium',
  defaultHoopType: 'dieCast',
  defaultLugConfig: '10lug',
  defaultSnareBedDepth: 'medium',
  defaultTopBearingEdge: '45InnerSoftOuter',
  defaultBottomBearingEdge: 'snareSide45',
  defaultBatterHeadFamily: 'coatedSinglePly',
  defaultSnareSideHeadFamily: 'hazy300',
  defaultFinishSheen: 'satin',
  defaultHardwareFinish: 'chrome',
  defaultBuilderGuidanceLevel: 'yesFully',
  preferByDefault: [
    'stave',
    'dieCast',
    'vintageTubeLugs',
    'coatedSinglePly',
    'hazy300',
    '14',
    '6.0',
    'medium',
  ],
  avoidUnlessJustified: [
    'singleFlange',
    'woodHoops',
    'extremeThin',
    'extremeThick',
    'reRings',
    'overlyBrightBuilds',
    'overlyDryBuilds',
    'noveltyOnlyChoices',
  ],
  decisionPhilosophy: {
    prioritize: [
      'artistNeed',
      'hardNos',
      'musicalUseCase',
      'reliability',
      'cohesion',
      'craftsmanshipFit',
    ],
    dePrioritize: ['noveltyForItsOwnSake', 'specSheetShowboating'],
  },
};

// ============================================================
// 3) ENGINE OUTPUT SCHEMA
// This is what the build engine should return after evaluating
// intake inputs + house rules + builder bias.
// ============================================================

export const ENGINE_OUTPUT_SCHEMA = {
  buildSummary: {
    recommendedBuildName: 'string',
    confidence: 'number_0_to_100',
    buildIntent: 'string',
    whyThisBuild: 'string[]',
    cautionFlags: 'string[]',
    hardConstraintNotes: 'string[]',
  },

  recommendedSpecs: {
    constructionType: 'option_id',
    shellRecipe: [
      {
        woodId: 'option_id',
        role: 'primary|secondary|outerVeneer|accent',
        percentage: 'number_0_to_100',
      },
    ],
    diameter: 'option_id',
    depth: 'option_id',
    shellThicknessZone: 'option_id',
    reinforcementRings: 'boolean',
    lugConfig: 'option_id',
    lugStyle: 'option_id',
    hoopType: 'option_id',
    hardwareFinish: 'option_id',
    finishSystem: {
      exteriorStyle: 'option_id',
      sheen: 'option_id',
      veneerFigurePreference: 'option_id',
      accentColorDirection: 'string_or_null',
      accentStyle: 'option_id_or_null',
    },
    bearingEdges: {
      top: 'option_id',
      bottom: 'option_id',
    },
    snareBedDepth: 'option_id',
    heads: {
      batter: 'option_id',
      snareSide: 'option_id',
    },
    tuningIntent: 'option_id',
  },

  targetProfile: {
    desired: 'target_axis_score_map',
    predicted: 'target_axis_score_map',
    delta: 'target_axis_score_map',
  },

  intakeInterpretation: {
    artistNeedSummary: 'string',
    whatTheyAreReallyAskingFor: 'string[]',
    likelyTradeoffsToAccept: 'string[]',
    likelyTradeoffsToAvoid: 'string[]',
    builderInterpretation: 'string',
  },

  storySignals: {
    identityLine: 'string',
    emotionalTarget: 'string[]',
    sonicTargetLine: 'string',
    visualTargetLine: 'string',
    feelTargetLine: 'string',
  },
};

// ============================================================
// 4) INTAKE SCHEMA
// This is the normalized structure the intake form should save.
// ============================================================

export const INTAKE_SCHEMA = {
  meta: {
    intakeMethod: 'form|phone|chat',
    craftsmanName: 'string_or_null',
    consultationDate: 'date_string_or_null',
    version: BUILD_ENGINE_VERSION,
  },

  playerContext: {
    primaryGenre: 'single_select',
    secondaryGenres: 'multi_select',
    playingContext: 'multi_select',
    volumeEnvironment: 'single_select',
    studioVsLive: 'single_select',
    experienceLevel: 'single_select',
  },

  referenceContext: {
    currentFavoriteSnare: 'string',
    whatTheyLikeAboutIt: 'string',
    whatFeelsMissing: 'string',
    hardNos: 'string[]',
  },

  tonalGoals: {
    desiredTuningRange: 'single_select',
    desiredAttack: 'single_select',
    desiredBody: 'single_select',
    desiredWarmth: 'single_select',
    desiredBrightness: 'single_select',
    desiredDecay: 'single_select',
    responsePriorities: 'multi_select_max_5',
  },

  feelGoals: {
    reboundFeel: 'single_select',
    sensitivityNeed: 'single_select',
    crossStickPriority: 'single_select',
    rimshotPriority: 'single_select',
    tuningStabilityPriority: 'single_select',
  },

  aestheticGoals: {
    visualStyle: 'multi_select',
    hardwareFinish: 'single_select',
    finishDirection: 'single_select',
    veneerFigurePreference: 'single_select',
    accentInterest: 'single_select',
  },

  buildRelationship: {
    builderGuidanceLevel: 'single_select',
    budgetRange: 'single_select',
    mustHaveFeatures: 'string[]',
    mustAvoidFeatures: 'string[]',
  },
};

// ============================================================
// 5) INTAKE FIELD DEFINITIONS
// These are the exact normalized options the UI / form should use.
// ============================================================

export const INTAKE_FIELD_LIBRARY = {
  primaryGenre: [
    'rock',
    'pop',
    'country',
    'americana',
    'indie',
    'worship',
    'jazz',
    'fusion',
    'funk',
    'rnb',
    'neoSoul',
    'gospel',
    'hipHop',
    'latin',
    'regionalMexican',
    'metal',
    'progressive',
    'orchestral',
    'mixed',
  ],

  secondaryGenres: [
    'rock',
    'pop',
    'country',
    'americana',
    'indie',
    'worship',
    'jazz',
    'fusion',
    'funk',
    'rnb',
    'neoSoul',
    'gospel',
    'hipHop',
    'latin',
    'regionalMexican',
    'metal',
    'progressive',
    'orchestral',
  ],

  playingContext: [
    'studioTracking',
    'liveGigging',
    'touring',
    'church',
    'homePractice',
    'contentCreation',
    'sessionWork',
  ],

  volumeEnvironment: ['quiet', 'moderate', 'loud', 'veryLoud', 'mixed'],

  studioVsLive: ['mostlyStudio', 'balanced', 'mostlyLive'],

  experienceLevel: ['beginner', 'intermediate', 'advanced', 'professional'],

  desiredTuningRange: [
    'low',
    'medium',
    'tight',
    'extraTight',
    'versatile',
    'notSure',
  ],

  desiredAttack: ['soft', 'balanced', 'sharp', 'verySharp', 'notSure'],

  desiredBody: ['lean', 'balanced', 'full', 'veryFull', 'notSure'],

  desiredWarmth: ['dryFocused', 'balanced', 'warm', 'veryWarm', 'notSure'],

  desiredBrightness: ['dark', 'balanced', 'present', 'bright', 'notSure'],

  desiredDecay: ['open', 'balanced', 'controlled', 'veryControlled', 'notSure'],

  responsePriorities: [
    'rimResponse',
    'ghostNotes',
    'backbeatCrack',
    'crossStick',
    'sensitivity',
    'projection',
    'body',
    'sustain',
    'quickRebound',
    'controlledDecay',
    'tuningStability',
    'articulation',
    'versatility',
    'rimshotAuthority',
  ],

  reboundFeel: ['quickAgile', 'balanced', 'solidAnchored', 'notSure'],

  sensitivityNeed: ['low', 'medium', 'high', 'veryHigh'],

  crossStickPriority: ['low', 'medium', 'high', 'essential'],

  rimshotPriority: ['low', 'medium', 'high', 'essential'],

  tuningStabilityPriority: ['low', 'medium', 'high', 'essential'],

  visualStyle: [
    'elegant',
    'bold',
    'organic',
    'vintageInspired',
    'modern',
    'understated',
    'collectorGrade',
    'dramatic',
    'earthy',
    'luxury',
  ],

  hardwareFinish: [
    'chrome',
    'blackNickel',
    'brassGold',
    'agedNickel',
    'rawPatina',
    'notSure',
  ],

  finishDirection: [
    'naturalWoodForward',
    'richTransparent',
    'darkMoody',
    'highContrast',
    'resinAccent',
    'notSure',
  ],

  veneerFigurePreference: [
    'straightGrain',
    'lightFigure',
    'heavyFigure',
    'burl',
    'wildExotic',
    'notSure',
  ],

  accentInterest: ['none', 'subtle', 'moderate', 'bold', 'notSure'],

  builderGuidanceLevel: [
    'yesFully',
    'yesWithGuardrails',
    'somewhat',
    'noExactSpecs',
  ],

  budgetRange: [
    '1500to2000',
    '2000to2500',
    '2500to3000',
    '3000plus',
    'notSure',
  ],
};

// ============================================================
// 6) OPTION LIBRARY
// Expanded normalized building blocks the engine can pick from.
// ============================================================

export const OPTION_LIBRARY = {
  constructionTypes: [
    {
      id: 'stave',
      label: 'Full Stave',
      allowedByDefault: true,
      profile: {
        attack: 8,
        body: 8,
        warmth: 6,
        brightness: 6,
        articulation: 8,
        projection: 9,
        sensitivity: 7,
        decayControl: 7,
        tuningRange: 7,
        crossStick: 7,
        rimshotAuthority: 9,
        versatility: 8,
      },
      notes: [
        'Primary Ober Artisan shell type',
        'Best default unless hybrid clearly improves the artistic goal',
      ],
    },
    {
      id: 'feuzonHybrid',
      label: 'Feuzon Hybrid',
      allowedByDefault: true,
      profile: {
        attack: 8,
        body: 7,
        warmth: 7,
        brightness: 6,
        articulation: 8,
        projection: 8,
        sensitivity: 7,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 8,
        versatility: 8,
      },
      notes: [
        'Use when the visual shell identity materially improves the build story',
        'Do not choose over full stave just for novelty',
      ],
    },
  ],

  diameters: [
    {
      id: '10',
      label: '10"',
      profile: {
        attack: 10,
        body: 4,
        warmth: 4,
        brightness: 9,
        articulation: 10,
        projection: 8,
        sensitivity: 8,
        decayControl: 9,
        tuningRange: 7,
        crossStick: 4,
        rimshotAuthority: 6,
        versatility: 3,
      },
    },
    {
      id: '12',
      label: '12"',
      profile: {
        attack: 9,
        body: 5,
        warmth: 5,
        brightness: 8,
        articulation: 9,
        projection: 8,
        sensitivity: 8,
        decayControl: 8,
        tuningRange: 8,
        crossStick: 6,
        rimshotAuthority: 7,
        versatility: 6,
      },
    },
    {
      id: '13',
      label: '13"',
      profile: {
        attack: 8,
        body: 6,
        warmth: 6,
        brightness: 7,
        articulation: 8,
        projection: 8,
        sensitivity: 8,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 8,
        versatility: 8,
      },
    },
    {
      id: '14',
      label: '14"',
      profile: {
        attack: 7,
        body: 8,
        warmth: 7,
        brightness: 6,
        articulation: 7,
        projection: 8,
        sensitivity: 7,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 9,
        rimshotAuthority: 9,
        versatility: 9,
      },
    },
    {
      id: '15',
      label: '15"',
      profile: {
        attack: 6,
        body: 9,
        warmth: 8,
        brightness: 5,
        articulation: 6,
        projection: 7,
        sensitivity: 6,
        decayControl: 6,
        tuningRange: 6,
        crossStick: 9,
        rimshotAuthority: 8,
        versatility: 5,
      },
    },
  ],

  depths: [
    {
      id: '4.5',
      label: '4.5"',
      profile: {
        attack: 10,
        body: 4,
        warmth: 4,
        brightness: 8,
        articulation: 10,
        projection: 8,
        sensitivity: 8,
        decayControl: 9,
        tuningRange: 8,
        crossStick: 6,
        rimshotAuthority: 7,
        versatility: 6,
      },
    },
    {
      id: '5.0',
      label: '5.0"',
      profile: {
        attack: 9,
        body: 5,
        warmth: 4,
        brightness: 8,
        articulation: 9,
        projection: 8,
        sensitivity: 8,
        decayControl: 8,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 8,
        versatility: 7,
      },
    },
    {
      id: '5.5',
      label: '5.5"',
      profile: {
        attack: 8,
        body: 6,
        warmth: 5,
        brightness: 7,
        articulation: 8,
        projection: 8,
        sensitivity: 8,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 8,
        versatility: 8,
      },
    },
    {
      id: '6.0',
      label: '6.0"',
      profile: {
        attack: 8,
        body: 7,
        warmth: 6,
        brightness: 6,
        articulation: 8,
        projection: 8,
        sensitivity: 7,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 8,
        rimshotAuthority: 8,
        versatility: 9,
      },
    },
    {
      id: '6.5',
      label: '6.5"',
      profile: {
        attack: 7,
        body: 8,
        warmth: 7,
        brightness: 5,
        articulation: 7,
        projection: 7,
        sensitivity: 7,
        decayControl: 7,
        tuningRange: 7,
        crossStick: 8,
        rimshotAuthority: 8,
        versatility: 8,
      },
    },
    {
      id: '7.0',
      label: '7.0"',
      profile: {
        attack: 7,
        body: 9,
        warmth: 8,
        brightness: 5,
        articulation: 6,
        projection: 7,
        sensitivity: 6,
        decayControl: 6,
        tuningRange: 6,
        crossStick: 8,
        rimshotAuthority: 9,
        versatility: 6,
      },
    },
    {
      id: '7.5',
      label: '7.5"',
      profile: {
        attack: 6,
        body: 9,
        warmth: 8,
        brightness: 4,
        articulation: 6,
        projection: 7,
        sensitivity: 5,
        decayControl: 6,
        tuningRange: 5,
        crossStick: 8,
        rimshotAuthority: 9,
        versatility: 5,
      },
    },
    {
      id: '8.0',
      label: '8.0"',
      profile: {
        attack: 6,
        body: 10,
        warmth: 8,
        brightness: 4,
        articulation: 5,
        projection: 6,
        sensitivity: 5,
        decayControl: 6,
        tuningRange: 5,
        crossStick: 8,
        rimshotAuthority: 9,
        versatility: 4,
      },
    },
  ],

  shellThicknessZones: [
    {
      id: 'veryThin',
      label: 'Very Thin',
      mmRange: '5.5–6.5',
      profile: {
        attack: 5,
        body: 7,
        warmth: 8,
        brightness: 6,
        articulation: 6,
        projection: 5,
        sensitivity: 10,
        decayControl: 4,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 5,
        versatility: 7,
      },
    },
    {
      id: 'thin',
      label: 'Thin',
      mmRange: '6.5–7.5',
      profile: {
        attack: 6,
        body: 7,
        warmth: 8,
        brightness: 6,
        articulation: 6,
        projection: 6,
        sensitivity: 9,
        decayControl: 5,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 6,
        versatility: 8,
      },
    },
    {
      id: 'medium',
      label: 'Medium',
      mmRange: '7.5–9.0',
      profile: {
        attack: 8,
        body: 8,
        warmth: 7,
        brightness: 6,
        articulation: 8,
        projection: 8,
        sensitivity: 7,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 8,
        rimshotAuthority: 8,
        versatility: 9,
      },
    },
    {
      id: 'thick',
      label: 'Thick',
      mmRange: '9.0–11.0',
      profile: {
        attack: 9,
        body: 8,
        warmth: 6,
        brightness: 5,
        articulation: 9,
        projection: 9,
        sensitivity: 5,
        decayControl: 8,
        tuningRange: 6,
        crossStick: 7,
        rimshotAuthority: 10,
        versatility: 5,
      },
    },
    {
      id: 'veryThick',
      label: 'Very Thick',
      mmRange: '11.0–13.0+',
      profile: {
        attack: 10,
        body: 8,
        warmth: 5,
        brightness: 4,
        articulation: 9,
        projection: 10,
        sensitivity: 4,
        decayControl: 9,
        tuningRange: 5,
        crossStick: 6,
        rimshotAuthority: 10,
        versatility: 3,
      },
    },
  ],

  hoopTypes: [
    {
      id: 'dieCast',
      label: 'Die-Cast',
      preferred: true,
      profile: {
        attack: 9,
        body: 7,
        warmth: 6,
        brightness: 7,
        articulation: 9,
        projection: 8,
        sensitivity: 7,
        decayControl: 8,
        tuningRange: 8,
        crossStick: 8,
        rimshotAuthority: 9,
        versatility: 8,
      },
    },
    {
      id: 'tripleFlange',
      label: 'Triple-Flanged',
      preferred: false,
      profile: {
        attack: 7,
        body: 7,
        warmth: 7,
        brightness: 6,
        articulation: 7,
        projection: 7,
        sensitivity: 8,
        decayControl: 6,
        tuningRange: 7,
        crossStick: 7,
        rimshotAuthority: 7,
        versatility: 8,
      },
    },
    {
      id: 'singleFlange',
      label: 'Single-Flanged',
      preferred: false,
      profile: {
        attack: 6,
        body: 7,
        warmth: 8,
        brightness: 5,
        articulation: 6,
        projection: 6,
        sensitivity: 7,
        decayControl: 5,
        tuningRange: 6,
        crossStick: 6,
        rimshotAuthority: 6,
        versatility: 5,
      },
    },
    {
      id: 'woodHoop',
      label: 'Wood Hoop',
      preferred: false,
      profile: {
        attack: 5,
        body: 8,
        warmth: 9,
        brightness: 3,
        articulation: 5,
        projection: 6,
        sensitivity: 7,
        decayControl: 6,
        tuningRange: 5,
        crossStick: 9,
        rimshotAuthority: 5,
        versatility: 4,
      },
    },
  ],

  lugConfigs: [
    {
      id: '6lug',
      label: '6 Lugs',
      profile: {
        attack: 7,
        body: 6,
        warmth: 7,
        brightness: 6,
        articulation: 6,
        projection: 6,
        sensitivity: 7,
        decayControl: 6,
        tuningRange: 5,
        crossStick: 6,
        rimshotAuthority: 6,
        versatility: 5,
      },
    },
    {
      id: '8lug',
      label: '8 Lugs',
      profile: {
        attack: 8,
        body: 7,
        warmth: 7,
        brightness: 6,
        articulation: 8,
        projection: 7,
        sensitivity: 8,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 8,
        versatility: 9,
      },
    },
    {
      id: '10lug',
      label: '10 Lugs',
      profile: {
        attack: 9,
        body: 8,
        warmth: 6,
        brightness: 6,
        articulation: 9,
        projection: 8,
        sensitivity: 7,
        decayControl: 8,
        tuningRange: 9,
        crossStick: 8,
        rimshotAuthority: 9,
        versatility: 8,
      },
    },
  ],

  lugStyles: [
    {
      id: 'vintageTubeLugs',
      label: 'Vintage Tube Lugs',
    },
    {
      id: 'singlePointLugs',
      label: 'Single Point Lugs',
    },
    {
      id: 'classicImperialStyle',
      label: 'Classic Imperial Style',
    },
  ],

  bearingEdges: [
    {
      id: 'fullRoundover',
      label: 'Full Roundover',
      profile: {
        attack: 4,
        body: 9,
        warmth: 10,
        brightness: 3,
        articulation: 4,
        projection: 5,
        sensitivity: 7,
        decayControl: 5,
        tuningRange: 5,
        crossStick: 8,
        rimshotAuthority: 6,
        versatility: 4,
      },
    },
    {
      id: 'baseballBat',
      label: 'Baseball Bat',
      profile: {
        attack: 5,
        body: 9,
        warmth: 9,
        brightness: 3,
        articulation: 5,
        projection: 6,
        sensitivity: 7,
        decayControl: 6,
        tuningRange: 6,
        crossStick: 8,
        rimshotAuthority: 7,
        versatility: 5,
      },
    },
    {
      id: '30InnerSoftOuter',
      label: '30° Inner / Soft Outer',
      profile: {
        attack: 6,
        body: 8,
        warmth: 8,
        brightness: 4,
        articulation: 6,
        projection: 7,
        sensitivity: 8,
        decayControl: 6,
        tuningRange: 7,
        crossStick: 8,
        rimshotAuthority: 7,
        versatility: 7,
      },
    },
    {
      id: '45InnerSoftOuter',
      label: '45° Inner / Soft Outer',
      profile: {
        attack: 8,
        body: 7,
        warmth: 7,
        brightness: 6,
        articulation: 8,
        projection: 8,
        sensitivity: 8,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 8,
        rimshotAuthority: 8,
        versatility: 9,
      },
    },
    {
      id: 'sharp45',
      label: 'Sharp 45°',
      profile: {
        attack: 9,
        body: 5,
        warmth: 5,
        brightness: 8,
        articulation: 9,
        projection: 8,
        sensitivity: 8,
        decayControl: 6,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 8,
        versatility: 8,
      },
    },
    {
      id: 'double45',
      label: 'Double 45°',
      profile: {
        attack: 9,
        body: 5,
        warmth: 4,
        brightness: 8,
        articulation: 9,
        projection: 8,
        sensitivity: 8,
        decayControl: 6,
        tuningRange: 8,
        crossStick: 6,
        rimshotAuthority: 8,
        versatility: 7,
      },
    },
    {
      id: 'rounded45',
      label: '45° with Rounded Outer',
      profile: {
        attack: 8,
        body: 7,
        warmth: 7,
        brightness: 6,
        articulation: 8,
        projection: 8,
        sensitivity: 8,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 8,
        rimshotAuthority: 8,
        versatility: 9,
      },
    },
    {
      id: '45Top30Bottom',
      label: '45° Top / 30° Bottom',
      profile: {
        attack: 8,
        body: 7,
        warmth: 7,
        brightness: 6,
        articulation: 8,
        projection: 8,
        sensitivity: 8,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 8,
        rimshotAuthority: 8,
        versatility: 8,
      },
    },
    {
      id: '45TopRoundBottom',
      label: '45° Top / Round Bottom',
      profile: {
        attack: 8,
        body: 8,
        warmth: 8,
        brightness: 5,
        articulation: 7,
        projection: 7,
        sensitivity: 8,
        decayControl: 7,
        tuningRange: 7,
        crossStick: 9,
        rimshotAuthority: 8,
        versatility: 8,
      },
    },
    {
      id: 'roundTop45Bottom',
      label: 'Round Top / 45° Bottom',
      profile: {
        attack: 6,
        body: 8,
        warmth: 8,
        brightness: 4,
        articulation: 6,
        projection: 7,
        sensitivity: 8,
        decayControl: 6,
        tuningRange: 7,
        crossStick: 8,
        rimshotAuthority: 7,
        versatility: 7,
      },
    },
    {
      id: 'snareSide45',
      label: 'Snare Side 45°',
      profile: {
        attack: 8,
        body: 6,
        warmth: 6,
        brightness: 6,
        articulation: 8,
        projection: 7,
        sensitivity: 9,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 7,
        versatility: 9,
      },
    },
    {
      id: 'snareSide30',
      label: 'Snare Side 30°',
      profile: {
        attack: 7,
        body: 6,
        warmth: 7,
        brightness: 5,
        articulation: 7,
        projection: 6,
        sensitivity: 9,
        decayControl: 7,
        tuningRange: 7,
        crossStick: 7,
        rimshotAuthority: 7,
        versatility: 8,
      },
    },
  ],

  snareBeds: [
    {
      id: 'minimal',
      label: 'Minimal',
      profile: {
        attack: 8,
        body: 7,
        warmth: 6,
        brightness: 6,
        articulation: 8,
        projection: 8,
        sensitivity: 6,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 8,
        versatility: 7,
      },
    },
    {
      id: 'medium',
      label: 'Medium',
      profile: {
        attack: 8,
        body: 7,
        warmth: 7,
        brightness: 6,
        articulation: 8,
        projection: 7,
        sensitivity: 8,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 8,
        rimshotAuthority: 8,
        versatility: 9,
      },
    },
    {
      id: 'deep',
      label: 'Deep',
      profile: {
        attack: 7,
        body: 6,
        warmth: 7,
        brightness: 5,
        articulation: 7,
        projection: 6,
        sensitivity: 9,
        decayControl: 7,
        tuningRange: 7,
        crossStick: 7,
        rimshotAuthority: 7,
        versatility: 6,
      },
    },
  ],

  headFamilies: [
    {
      id: 'coatedSinglePly',
      label: 'Coated Single Ply Batter',
      type: 'batter',
      profile: {
        attack: 8,
        body: 6,
        warmth: 8,
        brightness: 6,
        articulation: 8,
        projection: 7,
        sensitivity: 9,
        decayControl: 6,
        tuningRange: 9,
        crossStick: 8,
        rimshotAuthority: 7,
        versatility: 9,
      },
    },
    {
      id: 'controlledCoated',
      label: 'Controlled Coated Batter',
      type: 'batter',
      profile: {
        attack: 8,
        body: 7,
        warmth: 7,
        brightness: 6,
        articulation: 8,
        projection: 8,
        sensitivity: 7,
        decayControl: 8,
        tuningRange: 8,
        crossStick: 8,
        rimshotAuthority: 8,
        versatility: 8,
      },
    },
    {
      id: 'coatedDoublePly',
      label: 'Coated Double Ply Batter',
      type: 'batter',
      profile: {
        attack: 9,
        body: 8,
        warmth: 6,
        brightness: 5,
        articulation: 8,
        projection: 8,
        sensitivity: 6,
        decayControl: 8,
        tuningRange: 6,
        crossStick: 7,
        rimshotAuthority: 9,
        versatility: 6,
      },
    },
    {
      id: 'hazy300',
      label: 'Hazy 300 Snare Side',
      type: 'snareSide',
      profile: {
        attack: 7,
        body: 6,
        warmth: 6,
        brightness: 6,
        articulation: 8,
        projection: 7,
        sensitivity: 9,
        decayControl: 7,
        tuningRange: 8,
        crossStick: 7,
        rimshotAuthority: 7,
        versatility: 9,
      },
    },
  ],

  tuningIntents: [
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'tight', label: 'Tight' },
    { id: 'extraTight', label: 'Extra Tight' },
    { id: 'versatile', label: 'Versatile' },
  ],

  hardwareFinishes: [
    { id: 'chrome', label: 'Chrome' },
    { id: 'blackNickel', label: 'Black Nickel' },
    { id: 'brassGold', label: 'Brass / Gold' },
    { id: 'agedNickel', label: 'Aged Nickel' },
    { id: 'rawPatina', label: 'Raw / Patina' },
  ],

  finishSystems: [
    { id: 'naturalWoodForward', label: 'Natural / Wood Forward' },
    { id: 'richTransparent', label: 'Rich Transparent' },
    { id: 'darkMoody', label: 'Dark / Moody' },
    { id: 'highContrast', label: 'High Contrast' },
    { id: 'resinAccent', label: 'Resin Accent' },
  ],

  finishSheens: [
    { id: 'matte', label: 'Matte' },
    { id: 'satin', label: 'Satin' },
    { id: 'gloss', label: 'Gloss' },
    { id: 'highGloss', label: 'High Gloss' },
  ],

  veneerFigurePreferences: [
    { id: 'straightGrain', label: 'Straight Grain' },
    { id: 'lightFigure', label: 'Light Figure' },
    { id: 'heavyFigure', label: 'Heavy Figure' },
    { id: 'burl', label: 'Burl' },
    { id: 'wildExotic', label: 'Wild Exotic' },
  ],

  accentStyles: [
    { id: 'none', label: 'None' },
    { id: 'subtleResin', label: 'Subtle Resin' },
    { id: 'moderateResin', label: 'Moderate Resin' },
    { id: 'boldResin', label: 'Bold Resin' },
  ],
};

// ============================================================
// 7) WOOD LIBRARY
// Expanded starting library.
// These are comparative directional engine values.
// ============================================================

export const WOOD_LIBRARY = [
  {
    id: 'maple',
    label: 'Maple',
    profile: {
      attack: 8,
      body: 6,
      warmth: 6,
      brightness: 7,
      articulation: 8,
      projection: 9,
      sensitivity: 7,
      decayControl: 6,
      tuningRange: 8,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 9,
    },
    tags: ['balanced', 'articulate', 'projecting', 'versatile'],
  },
  {
    id: 'birch',
    label: 'Birch',
    profile: {
      attack: 8,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 8,
      projection: 8,
      sensitivity: 7,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 8,
    },
    tags: ['focused', 'punchy', 'cutting', 'controlled'],
  },
  {
    id: 'mahogany',
    label: 'Mahogany',
    profile: {
      attack: 5,
      body: 9,
      warmth: 10,
      brightness: 3,
      articulation: 5,
      projection: 6,
      sensitivity: 7,
      decayControl: 7,
      tuningRange: 6,
      crossStick: 8,
      rimshotAuthority: 6,
      versatility: 5,
    },
    tags: ['deep', 'round', 'warm', 'vintage'],
  },
  {
    id: 'walnut',
    label: 'Walnut',
    profile: {
      attack: 7,
      body: 8,
      warmth: 8,
      brightness: 5,
      articulation: 7,
      projection: 7,
      sensitivity: 7,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 8,
      rimshotAuthority: 7,
      versatility: 8,
    },
    tags: ['warm', 'big', 'rich', 'balanced'],
  },
  {
    id: 'oak',
    label: 'Oak',
    profile: {
      attack: 7,
      body: 7,
      warmth: 7,
      brightness: 5,
      articulation: 7,
      projection: 8,
      sensitivity: 6,
      decayControl: 8,
      tuningRange: 6,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 6,
    },
    tags: ['solid', 'midForward', 'quickDecay', 'strong'],
  },
  {
    id: 'beech',
    label: 'Beech',
    profile: {
      attack: 8,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 8,
      projection: 8,
      sensitivity: 8,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 8,
    },
    tags: ['focused', 'sensitive', 'punchy', 'balanced'],
  },
  {
    id: 'cherry',
    label: 'Cherry',
    profile: {
      attack: 7,
      body: 7,
      warmth: 8,
      brightness: 5,
      articulation: 7,
      projection: 6,
      sensitivity: 7,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 7,
      versatility: 8,
    },
    tags: ['warm', 'smooth', 'musical', 'balanced'],
  },
  {
    id: 'bubinga',
    label: 'Bubinga',
    profile: {
      attack: 9,
      body: 8,
      warmth: 7,
      brightness: 5,
      articulation: 8,
      projection: 9,
      sensitivity: 6,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 9,
      versatility: 6,
    },
    tags: ['dense', 'authoritative', 'powerful', 'lowMidRich'],
  },
  {
    id: 'wenge',
    label: 'Wenge',
    profile: {
      attack: 9,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 9,
      projection: 8,
      sensitivity: 6,
      decayControl: 8,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 9,
      versatility: 6,
    },
    tags: ['aggressive', 'focused', 'hard', 'controlledHarmonics'],
  },
  {
    id: 'padauk',
    label: 'Padauk',
    profile: {
      attack: 7,
      body: 7,
      warmth: 8,
      brightness: 5,
      articulation: 7,
      projection: 8,
      sensitivity: 6,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 7,
    },
    tags: ['warm', 'lively', 'present', 'rich'],
  },
  {
    id: 'purpleheart',
    label: 'Purpleheart',
    profile: {
      attack: 9,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 9,
      projection: 9,
      sensitivity: 7,
      decayControl: 8,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 9,
      versatility: 6,
    },
    tags: ['dense', 'punchy', 'highEndCustom', 'powerful'],
  },
  {
    id: 'ash',
    label: 'Ash',
    profile: {
      attack: 8,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 8,
      projection: 8,
      sensitivity: 7,
      decayControl: 6,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 7,
    },
    tags: ['fast', 'present', 'balanced', 'lively'],
  },
  {
    id: 'jatoba',
    label: 'Jatoba',
    profile: {
      attack: 8,
      body: 7,
      warmth: 6,
      brightness: 6,
      articulation: 8,
      projection: 8,
      sensitivity: 6,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 6,
    },
    tags: ['hard', 'focused', 'present', 'dense'],
  },
  {
    id: 'sapele',
    label: 'Sapele',
    profile: {
      attack: 7,
      body: 7,
      warmth: 8,
      brightness: 5,
      articulation: 7,
      projection: 7,
      sensitivity: 7,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 7,
      versatility: 7,
    },
    tags: ['warm', 'balanced', 'mahoganyAdjacent', 'smooth'],
  },
  {
    id: 'acacia',
    label: 'Acacia',
    profile: {
      attack: 7,
      body: 7,
      warmth: 6,
      brightness: 6,
      articulation: 7,
      projection: 8,
      sensitivity: 6,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 7,
    },
    tags: ['balanced', 'strong', 'clear', 'projecting'],
  },
  {
    id: 'leopardwood',
    label: 'Leopardwood',
    profile: {
      attack: 8,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 8,
      projection: 8,
      sensitivity: 6,
      decayControl: 6,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 6,
    },
    tags: ['woody', 'complex', 'exotic', 'overtoneRich'],
  },
  {
    id: 'mango',
    label: 'Mango',
    profile: {
      attack: 7,
      body: 7,
      warmth: 7,
      brightness: 5,
      articulation: 7,
      projection: 6,
      sensitivity: 7,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 7,
      versatility: 7,
    },
    tags: ['balanced', 'warm', 'musical'],
  },
  {
    id: 'poplar',
    label: 'Poplar',
    profile: {
      attack: 6,
      body: 7,
      warmth: 7,
      brightness: 5,
      articulation: 6,
      projection: 6,
      sensitivity: 7,
      decayControl: 6,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 6,
      versatility: 7,
    },
    tags: ['soft', 'balanced', 'entryFriendly', 'smooth'],
  },
  {
    id: 'kapur',
    label: 'Kapur',
    profile: {
      attack: 7,
      body: 7,
      warmth: 7,
      brightness: 5,
      articulation: 7,
      projection: 8,
      sensitivity: 6,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 6,
    },
    tags: ['solid', 'warm', 'present', 'dense'],
  },
  {
    id: 'blackLimba',
    label: 'Black Limba',
    profile: {
      attack: 7,
      body: 7,
      warmth: 8,
      brightness: 5,
      articulation: 7,
      projection: 7,
      sensitivity: 7,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 7,
      versatility: 7,
    },
    tags: ['warm', 'organic', 'musical', 'exotic'],
  },
  {
    id: 'zebrawood',
    label: 'Zebrawood',
    profile: {
      attack: 8,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 8,
      projection: 8,
      sensitivity: 6,
      decayControl: 6,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 6,
    },
    tags: ['exotic', 'brightLean', 'articulate', 'showpiece'],
  },
  {
    id: 'bloodwood',
    label: 'Bloodwood',
    profile: {
      attack: 9,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 9,
      projection: 9,
      sensitivity: 6,
      decayControl: 8,
      tuningRange: 6,
      crossStick: 7,
      rimshotAuthority: 9,
      versatility: 5,
    },
    tags: ['veryDense', 'powerful', 'hard', 'direct'],
  },
  {
    id: 'canarywood',
    label: 'Canarywood',
    profile: {
      attack: 8,
      body: 7,
      warmth: 6,
      brightness: 7,
      articulation: 8,
      projection: 8,
      sensitivity: 6,
      decayControl: 6,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 6,
    },
    tags: ['lively', 'clear', 'exotic'],
  },
  {
    id: 'bocote',
    label: 'Bocote',
    profile: {
      attack: 8,
      body: 7,
      warmth: 7,
      brightness: 6,
      articulation: 8,
      projection: 8,
      sensitivity: 6,
      decayControl: 7,
      tuningRange: 7,
      crossStick: 7,
      rimshotAuthority: 8,
      versatility: 6,
    },
    tags: ['complex', 'exotic', 'rich', 'dense'],
  },
  {
    id: 'rosewood',
    label: 'Rosewood',
    profile: {
      attack: 7,
      body: 8,
      warmth: 8,
      brightness: 5,
      articulation: 7,
      projection: 8,
      sensitivity: 6,
      decayControl: 7,
      tuningRange: 6,
      crossStick: 8,
      rimshotAuthority: 8,
      versatility: 5,
    },
    tags: ['rich', 'dense', 'luxury', 'lowMidComplex'],
  },
];

// ============================================================
// 8) INPUT -> TARGET MAPS
// This converts artist answers into a target sonic profile.
// These values are not the final engine — just the target shaping.
// ============================================================

export const INPUT_TO_TARGET_MAP = {
  desiredTuningRange: {
    low: {
      attack: 0.7,
      body: 1.0,
      warmth: 1.0,
      brightness: 0.4,
      articulation: 0.6,
      projection: 0.8,
      sensitivity: 0.7,
      decayControl: 0.8,
      tuningRange: 0.7,
      crossStick: 0.8,
      rimshotAuthority: 0.9,
      versatility: 0.6,
    },
    medium: {
      attack: 0.8,
      body: 0.8,
      warmth: 0.8,
      brightness: 0.6,
      articulation: 0.8,
      projection: 0.8,
      sensitivity: 0.8,
      decayControl: 0.8,
      tuningRange: 0.8,
      crossStick: 0.8,
      rimshotAuthority: 0.8,
      versatility: 0.9,
    },
    tight: {
      attack: 1.0,
      body: 0.6,
      warmth: 0.5,
      brightness: 0.8,
      articulation: 1.0,
      projection: 0.9,
      sensitivity: 0.8,
      decayControl: 0.8,
      tuningRange: 0.8,
      crossStick: 0.7,
      rimshotAuthority: 0.9,
      versatility: 0.7,
    },
    extraTight: {
      attack: 1.0,
      body: 0.5,
      warmth: 0.4,
      brightness: 0.9,
      articulation: 1.0,
      projection: 1.0,
      sensitivity: 0.7,
      decayControl: 0.9,
      tuningRange: 0.6,
      crossStick: 0.6,
      rimshotAuthority: 1.0,
      versatility: 0.5,
    },
    versatile: {
      attack: 0.8,
      body: 0.8,
      warmth: 0.8,
      brightness: 0.6,
      articulation: 0.8,
      projection: 0.8,
      sensitivity: 0.8,
      decayControl: 0.8,
      tuningRange: 1.0,
      crossStick: 0.8,
      rimshotAuthority: 0.8,
      versatility: 1.0,
    },
    notSure: {
      attack: 0.8,
      body: 0.8,
      warmth: 0.8,
      brightness: 0.6,
      articulation: 0.8,
      projection: 0.8,
      sensitivity: 0.8,
      decayControl: 0.8,
      tuningRange: 0.9,
      crossStick: 0.8,
      rimshotAuthority: 0.8,
      versatility: 0.9,
    },
  },
};

// ============================================================
// 9) SIMPLE BUILD RULES
// Rules-based first. Smarter scoring comes after this foundation.
// ============================================================

export const BUILD_RULES = {
  defaults: {
    constructionType: 'stave',
    hoopType: 'dieCast',
    lugStyle: 'vintageTubeLugs',
    snareBedDepth: 'medium',
    snareSideHeadFamily: 'hazy300',
  },

  recommendationRules: [
    {
      id: 'defaultToStave',
      description: 'Default to stave unless hybrid is clearly justified.',
      when: () => true,
      result: { preferredConstruction: 'stave' },
    },
    {
      id: 'favor14ForVersatility',
      description:
        '14 is the most versatile default unless use case clearly points smaller or larger.',
      when: (input) => input?.tonalGoals?.desiredTuningRange !== 'extraTight',
      result: { preferredDiameter: '14' },
    },
    {
      id: 'favor13or12ForTightArticulateUse',
      description:
        'Smaller diameters rise when tight tuning and articulation dominate.',
      when: (input) =>
        ['tight', 'extraTight'].includes(
          input?.tonalGoals?.desiredTuningRange
        ) &&
        Array.isArray(input?.tonalGoals?.responsePriorities) &&
        input.tonalGoals.responsePriorities.some((x) =>
          ['articulation', 'ghostNotes', 'quickRebound'].includes(x)
        ),
      result: { boostDiameters: ['12', '13'] },
    },
    {
      id: 'favorDeeperShellForBody',
      description:
        'Deeper shells rise when body and rimshot authority are emphasized.',
      when: (input) =>
        Array.isArray(input?.tonalGoals?.responsePriorities) &&
        input.tonalGoals.responsePriorities.some((x) =>
          ['body', 'rimshotAuthority', 'backbeatCrack'].includes(x)
        ),
      result: { boostDepths: ['6.5', '7.0', '8.0'] },
    },
    {
      id: 'avoidReringsByDefault',
      description:
        'Do not recommend reinforcement rings unless structure or tonal target truly calls for them.',
      when: () => true,
      result: { avoidByDefault: ['reRings'] },
    },
  ],
};

// ============================================================
// 10) HELPER FUNCTIONS
// ============================================================

export function emptyTargetProfile() {
  return TARGET_AXES.reduce((acc, axis) => {
    acc[axis] = 0;
    return acc;
  }, {});
}

export function cloneTargetProfile(profile = {}) {
  return TARGET_AXES.reduce((acc, axis) => {
    acc[axis] = Number(profile?.[axis] || 0);
    return acc;
  }, {});
}

export function getOptionById(collection = [], id = '') {
  return collection.find((item) => item.id === id) || null;
}

export function getWoodById(id = '') {
  return getOptionById(WOOD_LIBRARY, id);
}

export function getConstructionById(id = '') {
  return getOptionById(OPTION_LIBRARY.constructionTypes, id);
}

export function getDiameterById(id = '') {
  return getOptionById(OPTION_LIBRARY.diameters, id);
}

export function getDepthById(id = '') {
  return getOptionById(OPTION_LIBRARY.depths, id);
}

export function getThicknessZoneById(id = '') {
  return getOptionById(OPTION_LIBRARY.shellThicknessZones, id);
}

export function getHoopTypeById(id = '') {
  return getOptionById(OPTION_LIBRARY.hoopTypes, id);
}

export function getLugConfigById(id = '') {
  return getOptionById(OPTION_LIBRARY.lugConfigs, id);
}

export function getLugStyleById(id = '') {
  return getOptionById(OPTION_LIBRARY.lugStyles, id);
}

export function getBearingEdgeById(id = '') {
  return getOptionById(OPTION_LIBRARY.bearingEdges, id);
}

export function getSnareBedById(id = '') {
  return getOptionById(OPTION_LIBRARY.snareBeds, id);
}

export function getHeadFamilyById(id = '') {
  return getOptionById(OPTION_LIBRARY.headFamilies, id);
}

export function getHardwareFinishById(id = '') {
  return getOptionById(OPTION_LIBRARY.hardwareFinishes, id);
}

export function getFinishSystemById(id = '') {
  return getOptionById(OPTION_LIBRARY.finishSystems, id);
}

export function getFinishSheenById(id = '') {
  return getOptionById(OPTION_LIBRARY.finishSheens, id);
}

export function getVeneerFigurePreferenceById(id = '') {
  return getOptionById(OPTION_LIBRARY.veneerFigurePreferences, id);
}

export function getAccentStyleById(id = '') {
  return getOptionById(OPTION_LIBRARY.accentStyles, id);
}

export function getTuningIntentById(id = '') {
  return getOptionById(OPTION_LIBRARY.tuningIntents, id);
}
