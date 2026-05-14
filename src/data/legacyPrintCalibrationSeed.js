// src/data/legacyPrintCalibrationSeed.js

export const LEGACYPRINT_NODE_ORDER = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

export const LEGACYPRINT_NODE_LABELS = {

  attack: 'Attack',

  brightness: 'Brightness',

  projection: 'Projection',

  sustain: 'Sustain',

  warmth: 'Warmth',

  sensitivity: 'Sensitivity',

  control: 'Control',

};

export const LEGACYPRINT_NODE_COLORS = {

  attack: '#ff7448',

  brightness: '#e7d98f',

  projection: '#ffb53a',

  sustain: '#4d86ff',

  warmth: '#c1682e',

  sensitivity: '#68d9df',

  control: '#9e8bff',

};

const optionRow = ({

  option,

  appliesTo = 'All',

  appliesToConstructions = 'All',

  allowedDiameters = 'All',

  allowedDepths = 'All',

  attack = 0,

  brightness = 0,

  projection = 0,

  sustain = 0,

  warmth = 0,

  sensitivity = 0,

  control = 0,

  notes = '',

  examples = '',

}) => ({

  option,

  appliesTo,

  appliesToConstructions,

  allowedDiameters,

  allowedDepths,

  attack,

  brightness,

  projection,

  sustain,

  warmth,

  sensitivity,

  control,

  notes,

  examples,

});

export const legacyPrintCalibrationSeed = {

  version: {

    id: 'workbook-import-v1',

    label: 'Workbook Import / Draft',

    status: 'draft',

    source: 'LegacyPrint calibration workbook',

    updatedAt: 'Local Seed',

    notes:

      'Initial admin calibration seed copied from the workbook model. Firestore versions come next.',

  },

  comparisonModes: [

    {

      option: 'Single Drum Type Benchmark',

      configDifferentialFactor: 1.28,

      description:

        'Expands differences within one drum type so configuration changes are easier to calibrate.',

    },

    {

      option: 'All Drum Type Comparison',

      configDifferentialFactor: 0.72,

      description:

        'Compresses configuration differences and preserves broad drum-type identity across snares, toms, and bass drums.',

    },

  ],

  masterWeights: [

    {

      node: 'attack',

      playerAnalysisMultiplier: 0.86,

      firstListenMultiplier: 0.83,

      movementMultiplier: 0.85,

      notes:

        'Softens over-dominant transient behavior while keeping shallow snares quick.',

    },

    {

      node: 'brightness',

      playerAnalysisMultiplier: 0.86,

      firstListenMultiplier: 0.83,

      movementMultiplier: 0.85,

      notes: 'Softens top-end dominance while preserving clarity.',

    },

    {

      node: 'projection',

      playerAnalysisMultiplier: 1,

      firstListenMultiplier: 1,

      movementMultiplier: 1,

      notes: 'Neutral carry. Prevents projection from surfacing too early.',

    },

    {

      node: 'sustain',

      playerAnalysisMultiplier: 1.06,

      firstListenMultiplier: 1.12,

      movementMultiplier: 1.12,

      notes: 'Allows body and bloom to surface as depth increases.',

    },

    {

      node: 'warmth',

      playerAnalysisMultiplier: 1.06,

      firstListenMultiplier: 1.12,

      movementMultiplier: 1.12,

      notes: 'Allows deeper body to surface as depth increases.',

    },

    {

      node: 'sensitivity',

      playerAnalysisMultiplier: 0.64,

      firstListenMultiplier: 0.66,

      movementMultiplier: 0.66,

      notes: 'Prevents sensitivity from dominating medium/deep snare reads.',

    },

    {

      node: 'control',

      playerAnalysisMultiplier: 1,

      firstListenMultiplier: 1.04,

      movementMultiplier: 1.04,

      notes: 'Allows focused shallow/medium builds to read as controlled.',

    },

  ],

  typeBenchmarks: [

    ['Snare', 'attack', 3.2, 5.5, 8.8, 1.04],

    ['Snare', 'brightness', 3, 5.4, 8.5, 0.96],

    ['Snare', 'projection', 3, 5.3, 8.3, 1.04],

    ['Snare', 'sustain', 2.5, 5, 8, 1.08],

    ['Snare', 'warmth', 2.8, 5, 8.2, 1.08],

    ['Snare', 'sensitivity', 3, 5.6, 9, 0.78],

    ['Snare', 'control', 3, 5.4, 8.8, 1.04],

    ['Rack Tom', 'attack', 3, 5.2, 8, 1],

    ['Rack Tom', 'brightness', 3, 5.2, 8, 1],

    ['Rack Tom', 'projection', 3, 5.3, 8.4, 1.05],

    ['Rack Tom', 'sustain', 3.2, 5.8, 9, 1.18],

    ['Rack Tom', 'warmth', 3, 5.4, 8.5, 1.08],

    ['Rack Tom', 'sensitivity', 2.8, 5, 7.8, 0.95],

    ['Rack Tom', 'control', 2.8, 5, 8, 1],

    ['Floor Tom', 'attack', 2.5, 4.8, 7.5, 0.9],

    ['Floor Tom', 'brightness', 2.2, 4.5, 7.2, 0.85],

    ['Floor Tom', 'projection', 3, 5.7, 8.8, 1.1],

    ['Floor Tom', 'sustain', 3.5, 6, 9.2, 1.2],

    ['Floor Tom', 'warmth', 3.8, 6.2, 9.4, 1.22],

    ['Floor Tom', 'sensitivity', 2.2, 4.6, 7.2, 0.9],

    ['Floor Tom', 'control', 2.8, 5.1, 8.3, 1.05],

    ['Bass Drum', 'attack', 2.5, 5, 8.2, 1.1],

    ['Bass Drum', 'brightness', 1.8, 3.8, 6.5, 0.7],

    ['Bass Drum', 'projection', 3.2, 6, 9.2, 1.18],

    ['Bass Drum', 'sustain', 2.8, 5.3, 8.5, 0.95],

    ['Bass Drum', 'warmth', 4, 6.5, 9.6, 1.22],

    ['Bass Drum', 'sensitivity', 1.5, 3.5, 6, 0.65],

    ['Bass Drum', 'control', 3, 5.5, 8.8, 1.1],

    ['Concert Tom', 'attack', 3, 5.2, 8, 1],

    ['Concert Tom', 'brightness', 3, 5.3, 8.2, 1],

    ['Concert Tom', 'projection', 3, 5.6, 8.8, 1.1],

    ['Concert Tom', 'sustain', 3.5, 6.1, 9.3, 1.22],

    ['Concert Tom', 'warmth', 2.8, 5.2, 8, 1],

    ['Concert Tom', 'sensitivity', 2.5, 4.8, 7.5, 0.9],

    ['Concert Tom', 'control', 2.2, 4.6, 7.2, 0.85],

  ].map(

    ([

      drumType,

      node,

      minExpected,

      neutral,

      maxExpected,

      firstListenMultiplier,

    ]) => ({

      drumType,

      node,

      minExpected,

      neutral,

      maxExpected,

      firstListenMultiplier,

      context: `${node} calibrated relative to ${drumType.toLowerCase()} expectations`,

    })

  ),

  configOptions: {

    drumType: [

      optionRow({

        option: 'Snare',

        attack: 0.85,

        brightness: 0.8,

        projection: 0.6,

        sensitivity: 0.9,

        control: 0.55,

        notes: 'Snare benchmark identity.',

      }),

      optionRow({

        option: 'Rack Tom',

        attack: 0.35,

        brightness: 0.35,

        projection: 0.45,

        sustain: 0.55,

        warmth: 0.35,

        sensitivity: 0.1,

        notes: 'Rack tom benchmark identity.',

      }),

      optionRow({

        option: 'Floor Tom',

        attack: -0.1,

        brightness: -0.2,

        projection: 0.55,

        sustain: 0.8,

        warmth: 0.9,

        sensitivity: -0.25,

        control: 0.05,

        notes: 'Floor tom benchmark identity.',

      }),

      optionRow({

        option: 'Bass Drum',

        attack: 0.25,

        brightness: -0.55,

        projection: 0.9,

        sustain: 0.35,

        warmth: 1.1,

        sensitivity: -0.65,

        control: 0.45,

        notes: 'Bass drum benchmark identity.',

      }),

      optionRow({

        option: 'Concert Tom',

        attack: 0.35,

        brightness: 0.35,

        projection: 0.65,

        sustain: 0.8,

        warmth: 0.25,

        control: -0.25,

        notes: 'Single-headed tom identity.',

      }),

    ],

    construction: [

      optionRow({

        option: 'Ober HERITAGE Stave',

        appliesTo: 'Snare,Rack Tom,Floor Tom',

        allowedDiameters: '12 in,13 in,14 in',

        attack: 0.35,

        brightness: 0.25,

        projection: 0.35,

        sustain: 0.2,

        warmth: 0.45,

        sensitivity: 0.35,

        control: 0.25,

        notes: 'Classic Ober stave voice.',

      }),

      optionRow({

        option: 'Ober FEUZØN Hybrid',

        appliesTo: 'Snare',

        allowedDiameters: '12 in,13 in,14 in,15 in',

        attack: 0.45,

        brightness: 0.4,

        projection: 0.55,

        sustain: 0.2,

        warmth: 0.35,

        sensitivity: 0.3,

        control: 0.35,

        notes: 'Steam-bent exterior with voiced stave interior.',

      }),

      optionRow({

        option: 'Ober SOUNDLEGEND Custom',

        appliesTo: 'Snare,Rack Tom,Floor Tom,Bass Drum',

        allowedDiameters: 'Custom by drum type',

        attack: 0.25,

        brightness: 0.25,

        projection: 0.35,

        sustain: 0.25,

        warmth: 0.35,

        sensitivity: 0.35,

        control: 0.25,

        notes: 'Fully custom artist-led shell design.',

      }),

      optionRow({

        option: 'Generic Ply Shell',

        appliesTo: 'All',

        allowedDiameters: 'By drum type',

        attack: 0.1,

        brightness: 0.15,

        projection: 0.1,

        sustain: 0.1,

        sensitivity: 0.05,

        control: 0.05,

        notes: 'General comparison baseline.',

      }),

      optionRow({

        option: 'Generic Metal Shell',

        appliesTo: 'Snare',

        allowedDiameters: '13 in,14 in',

        attack: 0.45,

        brightness: 0.85,

        projection: 0.65,

        sustain: 0.2,

        warmth: -0.35,

        sensitivity: 0.2,

        control: 0.05,

        notes: 'General metal snare comparison baseline.',

      }),

    ],

    diameter: [

      optionRow({

        option: '10 in',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: 0.55,

        brightness: 0.45,

        projection: -0.15,

        sustain: -0.3,

        warmth: -0.45,

        sensitivity: 0.25,

        control: 0.2,

        notes: 'Small, quick voice. Not available for Heritage or FEUZØN.',

      }),

      optionRow({

        option: '12 in',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: 0.35,

        brightness: 0.28,

        projection: 0,

        sustain: -0.15,

        warmth: -0.2,

        sensitivity: 0.12,

        control: 0.18,

        notes: 'Compact snare / rack tom response.',

      }),

      optionRow({

        option: '13 in',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0.18,

        brightness: 0.12,

        projection: 0.08,

        sustain: 0.02,

        warmth: 0.05,

        sensitivity: 0.02,

        control: 0.08,

        notes: 'Bridge size between quick and full.',

      }),

      optionRow({

        option: '14 in',

        appliesTo: 'Snare,Floor Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        projection: 0.15,

        sustain: 0.18,

        warmth: 0.22,

        notes: 'Standard full snare / small floor tom reference.',

      }),

      optionRow({

        option: '15 in',

        appliesTo: 'Snare,Floor Tom',

        appliesToConstructions:

          'Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.12,

        brightness: -0.12,

        projection: 0.24,

        sustain: 0.28,

        warmth: 0.34,

        sensitivity: -0.08,

        control: -0.04,

        notes: 'Available for FEUZØN and SoundLegend snares. Not Heritage.',

      }),

      optionRow({

        option: '16 in',

        appliesTo: 'Floor Tom,Bass Drum',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.18,

        brightness: -0.18,

        projection: 0.35,

        sustain: 0.45,

        warmth: 0.58,

        sensitivity: -0.18,

        notes: 'Floor/bass body.',

      }),

      optionRow({

        option: '18 in',

        appliesTo: 'Floor Tom,Bass Drum',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.22,

        brightness: -0.25,

        projection: 0.45,

        sustain: 0.55,

        warmth: 0.72,

        sensitivity: -0.24,

        control: 0.02,

        notes: 'Large tom / small bass body.',

      }),

      optionRow({

        option: '20 in',

        appliesTo: 'Bass Drum',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.08,

        brightness: -0.35,

        projection: 0.65,

        sustain: 0.42,

        warmth: 0.88,

        sensitivity: -0.35,

        control: 0.18,

        notes: 'Compact bass drum.',

      }),

      optionRow({

        option: '22 in',

        appliesTo: 'Bass Drum',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.05,

        brightness: -0.4,

        projection: 0.75,

        sustain: 0.38,

        warmth: 1,

        sensitivity: -0.42,

        control: 0.22,

        notes: 'Standard bass drum.',

      }),

      optionRow({

        option: '24 in',

        appliesTo: 'Bass Drum',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        brightness: -0.45,

        projection: 0.85,

        sustain: 0.32,

        warmth: 1.1,

        sensitivity: -0.5,

        control: 0.28,

        notes: 'Large bass drum authority.',

      }),

    ],

    depth: [

      optionRow({

        option: '4.0 in',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0.6,

        brightness: 0.38,

        projection: -0.18,

        sustain: -0.5,

        warmth: -0.5,

        sensitivity: 0.25,

        control: 0.22,

        notes: 'Shallow snare response. Not available for Heritage or FEUZØN.',

      }),

      optionRow({

        option: '4.5 in',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0.5,

        brightness: 0.32,

        projection: -0.12,

        sustain: -0.35,

        warmth: -0.35,

        sensitivity: 0.22,

        control: 0.2,

        notes: 'Shallow snare response. Not available for Heritage or FEUZØN.',

      }),

      optionRow({

        option: '5.0 in',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0.4,

        brightness: 0.28,

        projection: -0.02,

        sustain: -0.2,

        warmth: -0.2,

        sensitivity: 0.12,

        control: 0.18,

        notes: 'Fast / articulate snare response.',

      }),

      optionRow({

        option: '5.5 in',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0.3,

        brightness: 0.22,

        projection: 0,

        sustain: -0.05,

        warmth: -0.05,

        sensitivity: 0.08,

        control: 0.16,

        notes: 'Classic center snare depth.',

      }),

      optionRow({

        option: '6.0 in',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: 0.17,

        brightness: 0.13,

        projection: 0.05,

        sustain: 0.1,

        warmth: 0.1,

        control: 0.12,

        notes: 'Balanced body.',

      }),

      optionRow({

        option: '6.5 in',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: 0.06,

        brightness: 0.04,

        projection: 0.12,

        sustain: 0.24,

        warmth: 0.26,

        sensitivity: -0.04,

        control: 0.1,

        notes: 'Fuller main voice.',

      }),

      optionRow({

        option: '7.0 in',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.06,

        brightness: -0.06,

        projection: 0.2,

        sustain: 0.46,

        warmth: 0.52,

        sensitivity: -0.12,

        control: 0.04,

        notes: 'Deep / weighty response.',

      }),

      optionRow({

        option: '7.5 in',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.16,

        brightness: -0.12,

        projection: 0.22,

        sustain: 0.62,

        warmth: 0.72,

        sensitivity: -0.16,

        notes: 'Big room feel.',

      }),

      optionRow({

        option: '8.0 in',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.24,

        brightness: -0.18,

        projection: 0.26,

        sustain: 0.72,

        warmth: 0.88,

        sensitivity: -0.2,

        control: -0.04,

        notes: 'Maximum snare depth.',

      }),

      optionRow({

        option: '9.0 in',

        appliesTo: 'Rack Tom',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.2,

        brightness: -0.15,

        projection: 0.4,

        sustain: 0.55,

        warmth: 0.55,

        sensitivity: -0.1,

        notes: 'Rack tom depth response.',

      }),

      optionRow({

        option: '10.0 in',

        appliesTo: 'Rack Tom,Floor Tom',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.25,

        brightness: -0.2,

        projection: 0.45,

        sustain: 0.6,

        warmth: 0.65,

        sensitivity: -0.15,

        notes: 'Tom body response.',

      }),

      optionRow({

        option: '12.0 in',

        appliesTo: 'Floor Tom,Bass Drum',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.3,

        brightness: -0.25,

        projection: 0.5,

        sustain: 0.65,

        warmth: 0.75,

        sensitivity: -0.2,

        control: 0.05,

        notes: 'Floor/bass response.',

      }),

      optionRow({

        option: '14.0 in',

        appliesTo: 'Floor Tom,Bass Drum',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.35,

        brightness: -0.3,

        projection: 0.55,

        sustain: 0.7,

        warmth: 0.85,

        sensitivity: -0.2,

        control: 0.05,

        notes: 'Floor/bass response.',

      }),

      optionRow({

        option: '16.0 in',

        appliesTo: 'Bass Drum',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.25,

        brightness: -0.3,

        projection: 0.65,

        sustain: 0.5,

        warmth: 0.85,

        sensitivity: -0.25,

        control: 0.15,

        notes: 'Bass drum response.',

      }),

      optionRow({

        option: '18.0 in',

        appliesTo: 'Bass Drum',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.2,

        brightness: -0.35,

        projection: 0.7,

        sustain: 0.45,

        warmth: 0.9,

        sensitivity: -0.25,

        control: 0.2,

        notes: 'Bass drum response.',

      }),

    ],

    soundLegendDepthFine: [

      optionRow({

        option: '4.25 in',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom',

        attack: 0.55,

        brightness: 0.35,

        projection: -0.15,

        sustain: -0.42,

        warmth: -0.42,

        sensitivity: 0.24,

        control: 0.21,

        notes: 'SoundLegend fine-depth option only.',

      }),

      optionRow({

        option: '4.75 in',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom',

        attack: 0.45,

        brightness: 0.3,

        projection: -0.07,

        sustain: -0.28,

        warmth: -0.28,

        sensitivity: 0.17,

        control: 0.19,

        notes: 'SoundLegend fine-depth option only.',

      }),

      optionRow({

        option: '5.25 in',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom',

        attack: 0.35,

        brightness: 0.25,

        projection: -0.01,

        sustain: -0.12,

        warmth: -0.12,

        sensitivity: 0.1,

        control: 0.17,

        notes: 'SoundLegend fine-depth option only.',

      }),

      optionRow({

        option: '5.75 in',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom',

        attack: 0.24,

        brightness: 0.18,

        projection: 0.03,

        sustain: 0.03,

        warmth: 0.03,

        sensitivity: 0.04,

        control: 0.14,

        notes: 'SoundLegend fine-depth option only.',

      }),

      optionRow({

        option: '6.25 in',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom',

        attack: 0.12,

        brightness: 0.08,

        projection: 0.09,

        sustain: 0.13,

        warmth: 0.19,

        sensitivity: -0.02,

        control: 0.13,

        notes: 'SoundLegend fine-depth option only.',

      }),

      optionRow({

        option: '6.75 in',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom',

        attack: 0,

        brightness: -0.02,

        projection: 0.16,

        sustain: 0.29,

        warmth: 0.4,

        sensitivity: -0.08,

        control: 0.1,

        notes: 'SoundLegend fine-depth option only.',

      }),

      optionRow({

        option: '7.25 in',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom',

        attack: -0.11,

        brightness: -0.09,

        projection: 0.21,

        sustain: 0.5,

        warmth: 0.61,

        sensitivity: -0.14,

        control: 0.03,

        notes: 'SoundLegend fine-depth option only.',

      }),

      optionRow({

        option: '7.75 in',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom',

        attack: -0.2,

        brightness: -0.15,

        projection: 0.24,

        sustain: 0.65,

        warmth: 0.79,

        sensitivity: -0.18,

        control: -0.02,

        notes: 'SoundLegend fine-depth option only.',

      }),

    ],

    thickness: [

      optionRow({

        option: '6mm Thin',

        appliesTo: 'Snare,Rack Tom',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.05,

        brightness: 0.05,

        projection: -0.15,

        sustain: 0.45,

        warmth: 0.25,

        sensitivity: 0.45,

        control: -0.2,

        notes: 'Thin shell response and touch.',

      }),

      optionRow({

        option: '7mm Thin',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober HERITAGE Stave,Ober FEUZØN Hybrid',

        allowedDiameters: '12 in',

        attack: -0.02,

        brightness: 0.04,

        projection: -0.08,

        sustain: 0.34,

        warmth: 0.2,

        sensitivity: 0.35,

        control: -0.14,

        notes: 'Thin / expressive 12 inch shell option.',

      }),

      optionRow({

        option: '8mm Light',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober HERITAGE Stave,Ober FEUZØN Hybrid',

        allowedDiameters: '12 in,13 in',

        attack: 0.04,

        brightness: 0.06,

        projection: -0.02,

        sustain: 0.24,

        warmth: 0.16,

        sensitivity: 0.26,

        control: -0.06,

        notes: 'Open / responsive shell option.',

      }),

      optionRow({

        option: '10mm Medium',

        appliesTo: 'All',

        appliesToConstructions:

          'Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0.15,

        brightness: 0.1,

        projection: 0.15,

        sustain: 0,

        warmth: 0.05,

        sensitivity: 0.05,

        control: 0.12,

        notes:

          'Balanced medium shell for FEUZØN, generic, and SoundLegend comparison.',

      }),

      optionRow({

        option: '11mm Medium+',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober HERITAGE Stave,Ober FEUZØN Hybrid',

        allowedDiameters: '13 in,14 in',

        attack: 0.22,

        brightness: 0.12,

        projection: 0.22,

        sustain: -0.08,

        warmth: 0.02,

        sensitivity: -0.04,

        control: 0.24,

        notes: 'Balanced heritage core.',

      }),

      optionRow({

        option: '12mm Thick',

        appliesTo: 'Snare,Rack Tom,Floor Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell',

        allowedDiameters: '13 in,14 in',

        attack: 0.35,

        brightness: 0.18,

        projection: 0.35,

        sustain: -0.22,

        warmth: -0.08,

        sensitivity: -0.2,

        control: 0.45,

        notes: 'Focused, stiff, controlled shell.',

      }),

      optionRow({

        option: '13mm Heavy',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober HERITAGE Stave,Ober FEUZØN Hybrid',

        allowedDiameters: '14 in',

        attack: 0.4,

        brightness: 0.19,

        projection: 0.4,

        sustain: -0.28,

        warmth: -0.09,

        sensitivity: -0.24,

        control: 0.52,

        notes: 'Heavy focused 14 inch shell option.',

      }),

      optionRow({

        option: '15mm Heavy',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        allowedDiameters: '14 in',

        attack: 0.45,

        brightness: 0.2,

        projection: 0.45,

        sustain: -0.35,

        warmth: -0.1,

        sensitivity: -0.28,

        control: 0.58,

        notes: 'Heavy focused snare shell.',

      }),

    ],

    finish: [

      optionRow({

        option: 'Natural Oil',

        notes: 'Open natural finish.',

        sustain: 0.05,

        warmth: 0.05,

        sensitivity: 0.05,

      }),

      optionRow({

        option: 'Ober Light Torch',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        attack: 0.04,

        brightness: 0.08,

        projection: 0.02,

        sustain: 0.08,

        warmth: 0.08,

        sensitivity: 0.12,

        notes: 'Light scorch openness and tactile response.',

      }),

      optionRow({

        option: 'Ober Medium Torch',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        attack: 0.08,

        brightness: 0.1,

        projection: 0.05,

        sustain: 0.02,

        warmth: 0.1,

        sensitivity: 0.04,

        control: 0.1,

        notes: 'Balanced torch character.',

      }),

      optionRow({

        option: 'Ober Blackened',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        attack: 0.14,

        brightness: 0.14,

        projection: 0.04,

        sustain: -0.18,

        warmth: 0.08,

        sensitivity: -0.1,

        control: 0.34,

        notes: 'Dryer blackened shell response.',

      }),

      optionRow({

        option: 'Ober PolyGloss',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Ober FEUZØN Hybrid',

        attack: 0.08,

        brightness: 0.14,

        projection: 0.12,

        sustain: -0.04,

        warmth: -0.02,

        sensitivity: -0.04,

        control: 0.12,

        notes: 'Gloss finish with clearer shell edge.',

      }),

      optionRow({

        option: 'Wrap',

        appliesToConstructions: 'Generic Ply Shell,Ober SOUNDLEGEND Custom',

        attack: 0.08,

        brightness: 0.04,

        projection: 0.04,

        sustain: -0.12,

        warmth: -0.04,

        sensitivity: -0.08,

        control: 0.18,

        notes: 'Wrapped shell damping and control.',

      }),

    ],

    hoopType: [

      optionRow({

        option: 'Triple Flange',

        appliesTo: 'Snare,Rack Tom,Floor Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0.04,

        brightness: 0.08,

        sustain: 0.12,

        warmth: 0.02,

        sensitivity: 0.08,

        control: -0.04,

        notes: 'Open hoop response.',

      }),

      optionRow({

        option: 'Die Cast',

        appliesTo: 'Snare,Rack Tom,Floor Tom',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0.22,

        brightness: 0.1,

        projection: 0.08,

        sustain: -0.2,

        warmth: -0.04,

        sensitivity: -0.08,

        control: 0.34,

        notes: 'Focused hoop response.',

      }),

      optionRow({

        option: 'Wood Hoop',

        appliesTo: 'Snare,Rack Tom,Floor Tom',

        appliesToConstructions: 'Ober SOUNDLEGEND Custom,Generic Ply Shell',

        attack: -0.05,

        brightness: -0.12,

        projection: 0.08,

        sustain: 0.08,

        warmth: 0.28,

        sensitivity: 0.02,

        control: 0.08,

        notes:

          'Rounder woody rim response. Not available for Heritage or FEUZØN.',

      }),

    ],

    bearingEdge: [

      optionRow({

        option: 'Balanced Hybrid Edge',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        attack: 0.12,

        brightness: 0.08,

        projection: 0.08,

        sustain: 0.02,

        warmth: 0.04,

        sensitivity: 0.08,

        control: 0.1,

        notes:

          'Best all-around hybrid edge. Balanced attack, body, sensitivity, and control.',

      }),

      optionRow({

        option: 'Warm Hybrid Edge',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        attack: -0.08,

        brightness: -0.12,

        projection: -0.02,

        sustain: 0.14,

        warmth: 0.18,

        sensitivity: 0.06,

        control: -0.04,

        notes:

          'Warmer and woodier with broader shell bloom and a more rounded front edge.',

      }),

      optionRow({

        option: 'Modern Precision Edge',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        attack: 0.2,

        brightness: 0.18,

        projection: 0.1,

        sustain: -0.08,

        warmth: -0.1,

        sensitivity: 0.02,

        control: 0.16,

        notes:

          'Fastest, brightest, and most defined option. Stronger cut, articulation, and focus.',

      }),

      optionRow({

        option: '45° Inner / Soft Outer Roundover',

        appliesTo: 'Snare',

        appliesToConstructions: 'Ober HERITAGE Stave',

        attack: 0.04,

        brightness: 0.02,

        projection: 0.02,

        sustain: 0.08,

        warmth: 0.12,

        sensitivity: 0.06,

        control: 0.04,

        notes:

          'Classic Heritage edge profile with softened outer contact and organic shell response.',

      }),

    ],

    snareBed: [

      optionRow({

        option: 'Standard',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober HERITAGE Stave,Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom,Generic Ply Shell,Generic Metal Shell',

        attack: 0,

        brightness: 0,

        projection: 0,

        sustain: 0,

        warmth: 0,

        sensitivity: 0.08,

        control: 0.08,

        notes:

          'Most balanced and versatile overall. The easiest all-around snare response.',

      }),

      optionRow({

        option: 'Shallow',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        attack: 0.04,

        brightness: 0.04,

        projection: 0.02,

        sustain: -0.06,

        warmth: -0.03,

        sensitivity: -0.08,

        control: 0.16,

        notes:

          'Slightly drier and firmer with less wire spread and a tighter feel.',

      }),

      optionRow({

        option: 'Deep',

        appliesTo: 'Snare',

        appliesToConstructions:

          'Ober FEUZØN Hybrid,Ober SOUNDLEGEND Custom',

        attack: -0.02,

        brightness: -0.02,

        projection: 0,

        sustain: 0.04,

        warmth: 0.03,

        sensitivity: 0.22,

        control: 0.04,

        notes:

          'More snare engagement and lighter-touch sensitivity, especially at lower dynamics.',

      }),

    ],

    tension: [

      optionRow({

        option: 'Low',

        attack: -0.22,

        brightness: -0.28,

        projection: -0.1,

        sustain: 0.28,

        warmth: 0.35,

        sensitivity: -0.05,

        control: -0.12,

        notes: 'Lower tuning feel.',

      }),

      optionRow({

        option: 'Medium',

        notes: 'Balanced tuning reference.',

      }),

      optionRow({

        option: 'High',

        appliesTo: 'Snare,Rack Tom',

        attack: 0.28,

        brightness: 0.34,

        projection: 0.1,

        sustain: -0.15,

        warmth: -0.22,

        sensitivity: 0.12,

        control: 0.12,

        notes: 'Higher tuning response.',

      }),

    ],

    snareWires: [

      optionRow({

        option: '16-strand',

        appliesTo: 'Snare',

        attack: 0.08,

        brightness: 0.08,

        projection: 0.02,

        sustain: 0.04,

        warmth: 0.02,

        sensitivity: -0.02,

        control: 0.1,

        notes: 'More shell, less wire spread.',

      }),

      optionRow({

        option: '20-strand',

        appliesTo: 'Snare',

        attack: 0.08,

        brightness: 0.08,

        projection: 0.02,

        sensitivity: 0.08,

        control: 0.08,

        notes: 'Standard snare wire response.',

      }),

      optionRow({

        option: '24-strand',

        appliesTo: 'Snare',

        attack: 0.06,

        brightness: 0.1,

        projection: 0.02,

        sustain: -0.06,

        warmth: -0.02,

        sensitivity: 0.16,

        control: 0.14,

        notes: 'More wire coverage and response.',

      }),

      optionRow({

        option: '30-strand',

        appliesTo: 'Snare',

        attack: 0.02,

        brightness: 0.1,

        sustain: -0.12,

        warmth: -0.04,

        sensitivity: 0.22,

        control: 0.18,

        notes: 'Wide wire response and control.',

      }),

    ],

    batterHead: [

      optionRow({

        option: 'Coated 1-ply',

        appliesTo: 'Snare,Rack Tom,Floor Tom',

        attack: 0.08,

        brightness: 0.08,

        sustain: 0.08,

        warmth: 0.04,

        sensitivity: 0.1,

        examples:

          'Remo Coated Ambassador / Evans UV1 / Aquarian Texture Coated',

        notes: 'Open coated single-ply response.',

      }),

      optionRow({

        option: 'Coated 2-ply',

        appliesTo: 'Snare,Rack Tom,Floor Tom',

        attack: 0.05,

        brightness: -0.04,

        projection: 0.02,

        sustain: -0.16,

        warmth: 0.12,

        sensitivity: -0.08,

        control: 0.22,

        examples:

          'Remo Coated Emperor / Evans G2 Coated / Aquarian Response 2 Coated',

        notes: 'Fuller controlled coated response.',

      }),

      optionRow({

        option: 'Controlled 1-ply',

        appliesTo: 'Snare',

        attack: 0.12,

        brightness: 0.04,

        projection: 0.02,

        sustain: -0.18,

        sensitivity: 0.02,

        control: 0.26,

        examples:

          'Remo Controlled Sound Coated / Evans Power Center / Aquarian Hi-Energy',

        notes: 'Focused snare batter response.',

      }),

      optionRow({

        option: 'Clear 2-ply',

        appliesTo: 'Rack Tom,Floor Tom,Bass Drum',

        attack: 0.08,

        brightness: 0.06,

        projection: 0.08,

        sustain: -0.08,

        warmth: 0.1,

        sensitivity: -0.1,

        control: 0.14,

        examples:

          'Remo Emperor Clear / Evans G2 Clear / Aquarian Response 2 Clear',

        notes: 'Modern tom/bass control.',

      }),

    ],

    resoHead: [

      optionRow({

        option: 'Snare Side Clear',

        appliesTo: 'Snare',

        attack: 0.08,

        brightness: 0.1,

        sustain: 0.04,

        warmth: -0.02,

        sensitivity: 0.18,

        examples:

          'Remo Ambassador Hazy / Evans Snare Side 300 / Aquarian Classic Clear Snare Side',

        notes: 'Standard snare-side response.',

      }),

      optionRow({

        option: 'Clear 1-ply',

        appliesTo: 'Rack Tom,Floor Tom',

        brightness: 0.08,

        projection: 0.04,

        sustain: 0.16,

        sensitivity: 0.04,

        control: -0.04,

        examples:

          'Remo Ambassador Clear / Evans G1 Clear / Aquarian Classic Clear',

        notes: 'Open tom resonant response.',

      }),

      optionRow({

        option: 'Ported Bass Reso',

        appliesTo: 'Bass Drum',

        attack: 0.1,

        brightness: 0.02,

        projection: 0.12,

        sustain: -0.16,

        warmth: -0.02,

        sensitivity: -0.12,

        control: 0.22,

        examples:

          'Remo Powerstroke P3 Ported / Evans EQ3 Reso / Aquarian Regulator',

        notes: 'Controlled bass drum reso response.',

      }),

    ],

  },

  feuzonBuilder: {

    interiorCoreOptions: [

      'Walnut + Birch',

      'Oak + Cherry',

      'Birch + Maple',

      'Maple + Bubinga',

      'Mahogany + Cherry',

      'Walnut + Padauk',

      'Oak + Wenge',

      'Zebrawood + Mahogany',

      'Padauk + Ash',

    ],

    exteriorOptions: ['Maple', 'Walnut', 'Cherry'],

  },

soundLegendBuilder: {

  brands: {

    customMakers: [

      'Ober Artisan',

    ],

    corporations: [

      'Tama',

      'Pearl',

      'Mapex',

      'Gretsch',

      'DW',

      'Ludwig',

      'Yamaha',

      'Sonor',

      'Pork Pie',

      'Canopus',

      'Craviotto',

      'Noble & Cooley',

      'British Drum Co.',

      'Other',

    ],

  },

  oberLines: [

    'HERITAGE',

    'FEUZØN',

    'SOUNDLEGEND Custom',

  ],

  shellTypes: [

    'Stave',

    'Hybrid',

    'Steam Bent',

    'Solid',

    'Ply',

    'Metal',

    'Acrylic',

    'Other',

  ],

  hybridTypeOptions: [

    'Stave',

    'Steam Bent',

    'Solid',

    'Ply',

    'Metal',

    'Acrylic',

    'Other',

  ],

  drumTypes: [

    'Snare',

    'Rack Tom',

    'Floor Tom',

    'Bass Drum',

    'Concert Tom',

  ],

  oberLineRules: {

    HERITAGE: {

      allowedDrumTypes: ['Snare'],

      defaultShellType: 'Stave',

      allowedShellTypes: ['Stave'],

      notes: 'HERITAGE is currently modeled as Ober snare-only stave construction.',

    },

    FEUZØN: {

      allowedDrumTypes: ['Snare'],

      defaultShellType: 'Hybrid',

      allowedShellTypes: ['Hybrid'],

      defaultHybridTypes: ['Stave', 'Steam Bent'],

      notes:

        'FEUZØN is currently modeled as Ober snare-only hybrid construction: voiced stave interior with steam-bent exterior.',

    },

    'SOUNDLEGEND Custom': {

      allowedDrumTypes: [

        'Snare',

        'Rack Tom',

        'Floor Tom',

        'Bass Drum',

        'Concert Tom',

      ],

      defaultShellType: 'Stave',

      allowedShellTypes: [

        'Stave',

        'Hybrid',

        'Steam Bent',

        'Solid',

        'Ply',

        'Metal',

        'Acrylic',

        'Other',

      ],

      notes:

        'SoundLegend is the custom/open architecture tool. It can model Ober builds, non-Ober comparisons, metals, acrylics, ply, steam-bent, solid, stave, and hybrids.',

    },

  },

  woodSpecies: {

    standard: [

      'Maple',

      'Birch',

      'Walnut',

      'Cherry',

      'Oak',

      'Ash',

      'Mahogany',

      'Poplar',

      'Beech',

      'Hickory',

      'Sapele',

    ],

    denseAndFocused: [

      'Bubinga',

      'Wenge',

      'Purpleheart',

      'Padauk',

      'Zebrawood',

      'Jatoba',

      'Ipe',

      'Ebony',

    ],

    warmAndDark: [

      'Walnut',

      'Mahogany',

      'Sapele',

      'Cherry',

      'Limba',

      'Red Gum',

    ],

    brightAndArticulate: [

      'Birch',

      'Maple',

      'Ash',

      'Oak',

      'Beech',

      'Hickory',

    ],

  },

  metalShells: [

    'Steel',

    'Brass',

    'Copper',

    'Bronze',

    'Aluminum',

    'Titanium',

    'Stainless Steel',

    'Hammered Brass',

    'Hammered Copper',

    'Bell Brass',

  ],

  acrylicShells: [

    'Clear Acrylic',

    'Smoke Acrylic',

    'Amber Acrylic',

    'Colored Acrylic',

    'Frosted Acrylic',

    'Thick Acrylic',

    'Thin Acrylic',

  ],

  plyShells: [

    'Maple Ply',

    'Birch Ply',

    'Mahogany Ply',

    'Oak Ply',

    'Walnut Ply',

    'Maple / Gum Ply',

    'Maple / Poplar Ply',

    'Birch / Mahogany Ply',

  ],

  steamBentShells: [

    'Steam-Bent Maple',

    'Steam-Bent Walnut',

    'Steam-Bent Cherry',

    'Steam-Bent Mahogany',

    'Steam-Bent Oak',

    'Steam-Bent Ash',

  ],

  solidShells: [

    'Solid Maple',

    'Solid Walnut',

    'Solid Cherry',

    'Solid Oak',

    'Solid Mahogany',

    'Solid Ash',

  ],

  veneerExteriors: {

    standard: [

      'Maple',

      'Walnut',

      'Cherry',

      'Oak',

      'Ash',

      'Mahogany',

      'Sapele',

      'Birch',

    ],

    figured: [

      'Quilted Maple',

      'Flamed Maple',

      'Curly Maple',

      'Birdseye Maple',

      'Spalted Maple',

      'Walnut Burl',

      'Maple Burl',

      'Mappa Burl',

      'Olive Ash Burl',

    ],

    exotic: [

      'Waterfall Bubinga',

      'Ziricote',

      'Cocobolo',

      'Macassar Ebony',

      'Koa',

      'Bocote',

      'Padauk',

      'Purpleheart',

      'Wenge',

      'Zebrawood',

    ],

  },

  feuzonCorePairings: [

    'Walnut + Birch',

    'Oak + Cherry',

    'Birch + Maple',

    'Maple + Bubinga',

    'Mahogany + Cherry',

    'Walnut + Padauk',

    'Oak + Wenge',

    'Zebrawood + Mahogany',

    'Padauk + Ash',

  ],

  feuzonSteamBentExteriors: [

    'Maple',

    'Walnut',

    'Cherry',

  ],

},

  visibilityRules: [

    {

      feature: 'Voice Preview',

      public: false,

      soundLegendArtists: true,

      legacyPrintPartners: true,

      admin: true,

    },

    {

      feature: 'Calibration Tables',

      public: false,

      soundLegendArtists: false,

      legacyPrintPartners: false,

      admin: true,

    },

    {

      feature: 'Voice Finder',

      public: true,

      soundLegendArtists: true,

      legacyPrintPartners: true,

      admin: true,

    },

    {

      feature: 'Benchmark Comparisons',

      public: false,

      soundLegendArtists: true,

      legacyPrintPartners: true,

      admin: true,

    },

  ],

};

const normalizeValue = (value = '') => {

  return String(value || '')

    .toLowerCase()

    .replace(/[øØ]/g, 'o')

    .replace(/[^a-z0-9]+/g, ' ')

    .trim();

};

const splitRuleList = (value = '') => {

  const raw = String(value || '').trim();

  if (!raw || normalizeValue(raw) === 'all') return ['all'];

  return raw

    .split(',')

    .map((item) => normalizeValue(item))

    .filter(Boolean);

};

const ruleIncludes = (ruleValue, targetValue) => {

  const rules = splitRuleList(ruleValue);

  const target = normalizeValue(targetValue);

  if (rules.includes('all')) return true;

  if (!target) return true;

  return rules.some((rule) => rule === target);

};

const optionAllowedForDrumType = (row, drumType) => {

  return ruleIncludes(row.appliesTo, drumType);

};

const optionAllowedForConstruction = (row, construction) => {

  return ruleIncludes(row.appliesToConstructions, construction);

};

const optionAllowedForDiameter = (row, diameter) => {

  return ruleIncludes(row.allowedDiameters, diameter);

};

const optionAllowedForDepth = (row, depth) => {

  return ruleIncludes(row.allowedDepths, depth);

};

export const getRowsForCategory = (categoryKey) => {

  return legacyPrintCalibrationSeed.configOptions[categoryKey] || [];

};

export const getTypeBenchmark = (drumType, node) => {

  return legacyPrintCalibrationSeed.typeBenchmarks.find(

    (row) => row.drumType === drumType && row.node === node

  );

};

export const getMasterWeight = (node) => {

  return legacyPrintCalibrationSeed.masterWeights.find(

    (row) => row.node === node

  );

};

export const getConfigOption = (categoryKey, option) => {

  const rows = getRowsForCategory(categoryKey);

  return rows.find((row) => row.option === option);

};

export const getAvailableOptions = ({

  categoryKey,

  drumType,

  construction,

  diameter,

  depth,

}) => {

  const rows = getRowsForCategory(categoryKey);

  return rows.filter((row) => {

    if (!optionAllowedForDrumType(row, drumType)) return false;

    if (!optionAllowedForConstruction(row, construction)) return false;

    if (!optionAllowedForDiameter(row, diameter)) return false;

    if (!optionAllowedForDepth(row, depth)) return false;

    return true;

  });

};