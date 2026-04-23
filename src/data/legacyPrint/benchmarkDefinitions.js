// src/data/legacyPrint/benchmarkDefinitions.js

const DEFAULT_SETUP = Object.freeze({

  hardwareType: 'Tube Lugs',

  hardwareFinish: 'Chrome',

  bearingEdge: '45 Inner / Strong Outer Roundover',

  snareBedDepth: 'Standard',

  finish: 'Neutral Satin',

  drumhead: 'Coated Single Ply',

  tension: 'Medium',

  snareSideHead: 'Standard 3mil',

  snareWireCount: 20,

  snareWireStyle: 'Standard',

  snareWireMaterial: 'Steel',

  reRings: 'None',

});

function buildImagePath(familyId, typeId, sizeId) {

  return `/legacyprint-benchmarks/${familyId}/${typeId}/${sizeId}.png`;

}

function createSizeDefinition({

  sizeId,

  label,

  width,

  depth,

  spec,

  familyId,

  typeId,

}) {

  return {

    sizeId,

    label,

    imagePath: buildImagePath(familyId, typeId, sizeId),

    spec: {

      width,

      depth,

      ...spec,

    },

  };

}

function withDefaultSetup(spec = {}) {

  return {

    ...DEFAULT_SETUP,

    ...spec,

  };

}

export const BENCHMARK_DEFINITIONS = Object.freeze({

  oberCustom: {

    familyId: 'ober-custom',

    familyLabel: 'Ober Custom',

    familyDescription:

      'Reference drums built around Ober Artisan voicing baselines.',

    defaultTypeId: 'heritage-oak-reference',

    types: {

      'heritage-oak-reference': {

        typeId: 'heritage-oak-reference',

        typeLabel: 'Heritage Oak Reference',

        shortLabel: 'Heritage Oak',

        shellFamily: 'wood',

        construction: 'stave',

        materialLabel: 'Northern Red Oak',

        benchmarkNotes:

          'The rooted Ober Heritage baseline: warm, seasoned, body-forward, and classic.',

        defaultSizeId: '14x5_5',

        sizes: [

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'heritage-oak-reference',

            sizeId: '12x5',

            label: '12" x 5"',

            width: 12,

            depth: 5.0,

            spec: withDefaultSetup({

              scoringIntent: 'shell_first',

              legacyPrintMode: 'shell_first',

              benchmarkMode: 'heritage_shell_first',

              shellFamily: 'wood',

              construction: 'stave',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Northern Red Oak',

              lugQuantity: 6,

              staveCount: 12,

              shellThicknessMm: 8,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Medium Torch',

            }),

          }),

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'heritage-oak-reference',

            sizeId: '13x5_5',

            label: '13" x 5.5"',

            width: 13,

            depth: 5.5,

            spec: withDefaultSetup({

              scoringIntent: 'shell_first',

              legacyPrintMode: 'shell_first',

              benchmarkMode: 'heritage_shell_first',

              shellFamily: 'wood',

              construction: 'stave',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Northern Red Oak',

              lugQuantity: 8,

              staveCount: 16,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Medium Torch',

            }),

          }),

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'heritage-oak-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              scoringIntent: 'shell_first',

              legacyPrintMode: 'shell_first',

              benchmarkMode: 'heritage_shell_first',

              shellFamily: 'wood',

              construction: 'stave',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Northern Red Oak',

              lugQuantity: 8,

              staveCount: 16,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Medium Torch',

            }),

          }),

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'heritage-oak-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              scoringIntent: 'shell_first',

              legacyPrintMode: 'shell_first',

              benchmarkMode: 'heritage_shell_first',

              shellFamily: 'wood',

              construction: 'stave',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Northern Red Oak',

              lugQuantity: 10,

              staveCount: 20,

              shellThicknessMm: 12,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Medium Torch',

            }),

          }),

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'heritage-oak-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              scoringIntent: 'shell_first',

              legacyPrintMode: 'shell_first',

              benchmarkMode: 'heritage_shell_first',

              shellFamily: 'wood',

              construction: 'stave',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Northern Red Oak',

              lugQuantity: 10,

              staveCount: 20,

              shellThicknessMm: 12,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Medium Torch',

            }),

          }),

        ],

      },

      'feuzon-hybrid-reference': {

        typeId: 'feuzon-hybrid-reference',

        typeLabel: 'Feuzon Hybrid Reference',

        shortLabel: 'Feuzon Hybrid',

        shellFamily: 'wood',

        construction: 'hybrid',

        materialLabel: 'Hybrid Hardwood Reference',

        benchmarkNotes:

          'The more modern Ober reference: articulate, balanced, and more forward than Heritage.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'feuzon-hybrid-reference',

            sizeId: '12x5',

            label: '12" x 5"',

            width: 12,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'hybrid',

              primarySpecies: 'maple',

              secondarySpecies: 'walnut',

              woodSpeciesLabel: 'Hybrid Hardwood Reference',

              lugQuantity: 6,

              shellThicknessMm: 8,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Neutral Satin',

            }),

          }),

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'feuzon-hybrid-reference',

            sizeId: '13x6',

            label: '13" x 6"',

            width: 13,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'hybrid',

              primarySpecies: 'maple',

              secondarySpecies: 'walnut',

              woodSpeciesLabel: 'Hybrid Hardwood Reference',

              lugQuantity: 8,

              shellThicknessMm: 9,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Neutral Satin',

            }),

          }),

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'feuzon-hybrid-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'hybrid',

              primarySpecies: 'maple',

              secondarySpecies: 'walnut',

              woodSpeciesLabel: 'Hybrid Hardwood Reference',

              lugQuantity: 10,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Die-Cast',

              finish: 'Neutral Satin',

            }),

          }),

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'feuzon-hybrid-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'hybrid',

              primarySpecies: 'maple',

              secondarySpecies: 'walnut',

              woodSpeciesLabel: 'Hybrid Hardwood Reference',

              lugQuantity: 10,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Die-Cast',

              finish: 'Neutral Satin',

            }),

          }),

          createSizeDefinition({

            familyId: 'ober-custom',

            typeId: 'feuzon-hybrid-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'hybrid',

              primarySpecies: 'maple',

              secondarySpecies: 'walnut',

              woodSpeciesLabel: 'Hybrid Hardwood Reference',

              lugQuantity: 10,

              shellThicknessMm: 11,

              shellThicknessBucket: 'medium',

              hoopType: 'Die-Cast',

              finish: 'Neutral Satin',

            }),

          }),

        ],

      },

    },

  },

  ply: {

    familyId: 'ply',

    familyLabel: 'Wood Ply',

    familyDescription:

      'Common professional wood-ply reference drums across balanced tonal families.',

    defaultTypeId: 'maple-ply-reference',

    types: {

      'maple-ply-reference': {

        typeId: 'maple-ply-reference',

        typeLabel: 'Maple Ply Reference',

        shortLabel: 'Maple Ply',

        shellFamily: 'wood',

        construction: 'ply',

        materialLabel: 'Maple',

        benchmarkNotes:

          'Balanced, familiar, professional wood-ply baseline.',

        defaultSizeId: '14x5_5',

        sizes: [

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'maple-ply-reference',

            sizeId: '13x5_5',

            label: '13" x 5.5"',

            width: 13,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 8,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'maple-ply-reference',

            sizeId: '14x5',

            label: '14" x 5"',

            width: 14,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'maple-ply-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'maple-ply-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'maple-ply-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 7,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

        ],

      },

      'birch-ply-reference': {

        typeId: 'birch-ply-reference',

        typeLabel: 'Birch Ply Reference',

        shortLabel: 'Birch Ply',

        shellFamily: 'wood',

        construction: 'ply',

        materialLabel: 'Birch',

        benchmarkNotes:

          'Focused, clearer, more recording-forward wood-ply reference.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'birch-ply-reference',

            sizeId: '13x5_5',

            label: '13" x 5.5"',

            width: 13,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'birch',

              woodSpeciesLabel: 'Birch',

              lugQuantity: 8,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'birch-ply-reference',

            sizeId: '14x5',

            label: '14" x 5"',

            width: 14,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'birch',

              woodSpeciesLabel: 'Birch',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Die-Cast',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'birch-ply-reference',

            sizeId: '14x6',

            label: '14" x 6"',

            width: 14,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'birch',

              woodSpeciesLabel: 'Birch',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Die-Cast',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'birch-ply-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'birch',

              woodSpeciesLabel: 'Birch',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Die-Cast',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'birch-ply-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'birch',

              woodSpeciesLabel: 'Birch',

              lugQuantity: 10,

              shellThicknessMm: 7,

              shellThicknessBucket: 'thin',

              hoopType: 'Die-Cast',

            }),

          }),

        ],

      },

      'oak-ply-reference': {

        typeId: 'oak-ply-reference',

        typeLabel: 'Oak Ply Reference',

        shortLabel: 'Oak Ply',

        shellFamily: 'wood',

        construction: 'ply',

        materialLabel: 'Oak',

        benchmarkNotes:

          'A firmer, rooted wood-ply reference with more low-mid backbone.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'oak-ply-reference',

            sizeId: '13x6',

            label: '13" x 6"',

            width: 13,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Oak',

              lugQuantity: 8,

              shellThicknessMm: 7,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'oak-ply-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Oak',

              lugQuantity: 10,

              shellThicknessMm: 7,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'oak-ply-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Oak',

              lugQuantity: 10,

              shellThicknessMm: 7,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'oak-ply-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Oak',

              lugQuantity: 10,

              shellThicknessMm: 7,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'oak-ply-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'oak',

              woodSpeciesLabel: 'Oak',

              lugQuantity: 10,

              shellThicknessMm: 8,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

        ],

      },

      'walnut-ply-reference': {

        typeId: 'walnut-ply-reference',

        typeLabel: 'Walnut Ply Reference',

        shortLabel: 'Walnut Ply',

        shellFamily: 'wood',

        construction: 'ply',

        materialLabel: 'Walnut',

        benchmarkNotes:

          'A darker, fuller wood-ply reference for body-forward comparison.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'walnut-ply-reference',

            sizeId: '13x6',

            label: '13" x 6"',

            width: 13,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'walnut',

              woodSpeciesLabel: 'Walnut',

              lugQuantity: 8,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'walnut-ply-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'walnut',

              woodSpeciesLabel: 'Walnut',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'walnut-ply-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'walnut',

              woodSpeciesLabel: 'Walnut',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'walnut-ply-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'walnut',

              woodSpeciesLabel: 'Walnut',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'walnut-ply-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'walnut',

              woodSpeciesLabel: 'Walnut',

              lugQuantity: 10,

              shellThicknessMm: 7,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

        ],

      },

      'mahogany-ply-reference': {

        typeId: 'mahogany-ply-reference',

        typeLabel: 'Mahogany Ply Reference',

        shortLabel: 'Mahogany Ply',

        shellFamily: 'wood',

        construction: 'ply',

        materialLabel: 'Mahogany',

        benchmarkNotes:

          'The softer, deeper, vintage-leaning side of wood-ply references.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'mahogany-ply-reference',

            sizeId: '13x6',

            label: '13" x 6"',

            width: 13,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 8,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'mahogany-ply-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'mahogany-ply-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'mahogany-ply-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

          createSizeDefinition({

            familyId: 'ply',

            typeId: 'mahogany-ply-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'ply',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 10,

              shellThicknessMm: 7,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

            }),

          }),

        ],

      },

    },

  },

  metal: {

    familyId: 'metal',

    familyLabel: 'Metal',

    familyDescription:

      'Professional metal-shell references spanning drier, brighter, and warmer metal families.',

    defaultTypeId: 'brass-reference',

    types: {

      'brass-reference': {

        typeId: 'brass-reference',

        typeLabel: 'Brass Reference',

        shortLabel: 'Brass',

        shellFamily: 'metal',

        construction: 'rolled',

        materialLabel: 'Brass',

        benchmarkNotes:

          'Balanced, premium metal baseline with body and authority.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'brass-reference',

            sizeId: '13x6',

            label: '13" x 6"',

            width: 13,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'brass',

              woodSpeciesLabel: 'Brass',

              lugQuantity: 8,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'brass-reference',

            sizeId: '14x5',

            label: '14" x 5"',

            width: 14,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'brass',

              woodSpeciesLabel: 'Brass',

              lugQuantity: 10,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'brass-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'brass',

              woodSpeciesLabel: 'Brass',

              lugQuantity: 10,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'brass-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'brass',

              woodSpeciesLabel: 'Brass',

              lugQuantity: 10,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'brass-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'brass',

              woodSpeciesLabel: 'Brass',

              lugQuantity: 10,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

        ],

      },

      'steel-reference': {

        typeId: 'steel-reference',

        typeLabel: 'Steel Reference',

        shortLabel: 'Steel',

        shellFamily: 'metal',

        construction: 'rolled',

        materialLabel: 'Steel',

        benchmarkNotes:

          'Brighter, harder-edged metal reference with stronger cut.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'steel-reference',

            sizeId: '13x6',

            label: '13" x 6"',

            width: 13,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'steel',

              woodSpeciesLabel: 'Steel',

              lugQuantity: 8,

              shellThicknessMm: 1.0,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'steel-reference',

            sizeId: '14x5',

            label: '14" x 5"',

            width: 14,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'steel',

              woodSpeciesLabel: 'Steel',

              lugQuantity: 10,

              shellThicknessMm: 1.0,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'steel-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'steel',

              woodSpeciesLabel: 'Steel',

              lugQuantity: 10,

              shellThicknessMm: 1.0,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'steel-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'steel',

              woodSpeciesLabel: 'Steel',

              lugQuantity: 10,

              shellThicknessMm: 1.0,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'steel-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'steel',

              woodSpeciesLabel: 'Steel',

              lugQuantity: 10,

              shellThicknessMm: 1.0,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Polished Metal',

            }),

          }),

        ],

      },

      'copper-reference': {

        typeId: 'copper-reference',

        typeLabel: 'Copper Reference',

        shortLabel: 'Copper',

        shellFamily: 'metal',

        construction: 'rolled',

        materialLabel: 'Copper',

        benchmarkNotes:

          'Warmer metal reference with more rounded top and broader body.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'copper-reference',

            sizeId: '13x6',

            label: '13" x 6"',

            width: 13,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'copper',

              woodSpeciesLabel: 'Copper',

              lugQuantity: 8,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Patina Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'copper-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'copper',

              woodSpeciesLabel: 'Copper',

              lugQuantity: 10,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Patina Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'copper-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'copper',

              woodSpeciesLabel: 'Copper',

              lugQuantity: 10,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Patina Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'copper-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'copper',

              woodSpeciesLabel: 'Copper',

              lugQuantity: 10,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Patina Metal',

            }),

          }),

          createSizeDefinition({

            familyId: 'metal',

            typeId: 'copper-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'metal',

              construction: 'rolled',

              metalMaterial: 'copper',

              woodSpeciesLabel: 'Copper',

              lugQuantity: 10,

              shellThicknessMm: 1.2,

              hoopType: 'Die-Cast',

              hardwareType: 'Metal Lugs',

              finish: 'Patina Metal',

            }),

          }),

        ],

      },

    },

  },

  acrylic: {

    familyId: 'acrylic',

    familyLabel: 'Acrylic',

    familyDescription:

      'Acrylic references organized by shell thickness and common professional size options.',

    defaultTypeId: 'medium-acrylic-reference',

    types: {

      'thin-acrylic-reference': {

        typeId: 'thin-acrylic-reference',

        typeLabel: 'Thin Acrylic Reference',

        shortLabel: 'Thin Acrylic',

        shellFamily: 'acrylic',

        construction: 'seamless',

        materialLabel: 'Thin Acrylic',

        benchmarkNotes:

          'A more open, slightly livelier acrylic reference.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thin-acrylic-reference',

            sizeId: '13x5_5',

            label: '13" x 5.5"',

            width: 13,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thin acrylic',

              woodSpeciesLabel: 'Thin Acrylic',

              lugQuantity: 8,

              shellThicknessMm: 5,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thin-acrylic-reference',

            sizeId: '14x5',

            label: '14" x 5"',

            width: 14,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thin acrylic',

              woodSpeciesLabel: 'Thin Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 5,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thin-acrylic-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thin acrylic',

              woodSpeciesLabel: 'Thin Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 5,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thin-acrylic-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thin acrylic',

              woodSpeciesLabel: 'Thin Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 5,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thin-acrylic-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thin acrylic',

              woodSpeciesLabel: 'Thin Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 5,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

        ],

      },

      'medium-acrylic-reference': {

        typeId: 'medium-acrylic-reference',

        typeLabel: 'Medium Acrylic Reference',

        shortLabel: 'Medium Acrylic',

        shellFamily: 'acrylic',

        construction: 'seamless',

        materialLabel: 'Medium Acrylic',

        benchmarkNotes:

          'The centered acrylic comparison point for modern acrylic builds.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'medium-acrylic-reference',

            sizeId: '13x5_5',

            label: '13" x 5.5"',

            width: 13,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'medium acrylic',

              woodSpeciesLabel: 'Medium Acrylic',

              lugQuantity: 8,

              shellThicknessMm: 7,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'medium-acrylic-reference',

            sizeId: '14x5',

            label: '14" x 5"',

            width: 14,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'medium acrylic',

              woodSpeciesLabel: 'Medium Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 7,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'medium-acrylic-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'medium acrylic',

              woodSpeciesLabel: 'Medium Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 7,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'medium-acrylic-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'medium acrylic',

              woodSpeciesLabel: 'Medium Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 7,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'medium-acrylic-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'medium acrylic',

              woodSpeciesLabel: 'Medium Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 7,

              hoopType: 'Triple Flange',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

        ],

      },

      'thick-acrylic-reference': {

        typeId: 'thick-acrylic-reference',

        typeLabel: 'Thick Acrylic Reference',

        shortLabel: 'Thick Acrylic',

        shellFamily: 'acrylic',

        construction: 'seamless',

        materialLabel: 'Thick Acrylic',

        benchmarkNotes:

          'A thicker, more forceful acrylic reference with stronger firmness.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thick-acrylic-reference',

            sizeId: '13x5_5',

            label: '13" x 5.5"',

            width: 13,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thick acrylic',

              woodSpeciesLabel: 'Thick Acrylic',

              lugQuantity: 8,

              shellThicknessMm: 10,

              hoopType: 'Die-Cast',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thick-acrylic-reference',

            sizeId: '14x5',

            label: '14" x 5"',

            width: 14,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thick acrylic',

              woodSpeciesLabel: 'Thick Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 10,

              hoopType: 'Die-Cast',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thick-acrylic-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thick acrylic',

              woodSpeciesLabel: 'Thick Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 10,

              hoopType: 'Die-Cast',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thick-acrylic-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thick acrylic',

              woodSpeciesLabel: 'Thick Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 10,

              hoopType: 'Die-Cast',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

          createSizeDefinition({

            familyId: 'acrylic',

            typeId: 'thick-acrylic-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'acrylic',

              construction: 'seamless',

              acrylicType: 'thick acrylic',

              woodSpeciesLabel: 'Thick Acrylic',

              lugQuantity: 10,

              shellThicknessMm: 10,

              hoopType: 'Die-Cast',

              hardwareType: 'Tube Lugs',

              finish: 'Clear Acrylic',

            }),

          }),

        ],

      },

    },

  },

  'solid-steambent': {

    familyId: 'solid-steambent',

    familyLabel: 'Solid / Steam-Bent',

    familyDescription:

      'Single-piece and steam-bent wood references for more open and organic comparison points.',

    defaultTypeId: 'steam-bent-maple-reference',

    types: {

      'steam-bent-maple-reference': {

        typeId: 'steam-bent-maple-reference',

        typeLabel: 'Steam-Bent Maple Reference',

        shortLabel: 'Steam-Bent Maple',

        shellFamily: 'wood',

        construction: 'steam bent',

        materialLabel: 'Maple',

        benchmarkNotes:

          'Open, flowing, and more resonant than centered ply or stave baselines.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-maple-reference',

            sizeId: '13x5_5',

            label: '13" x 5.5"',

            width: 13,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 8,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-maple-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-maple-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-maple-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-maple-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

        ],

      },

      'steam-bent-mahogany-reference': {

        typeId: 'steam-bent-mahogany-reference',

        typeLabel: 'Steam-Bent Mahogany Reference',

        shortLabel: 'Steam-Bent Mahogany',

        shellFamily: 'wood',

        construction: 'steam bent',

        materialLabel: 'Mahogany',

        benchmarkNotes:

          'Warmer and deeper steam-bent reference for fuller vintage-leaning comparisons.',

        defaultSizeId: '14x6_5',

        sizes: [

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-mahogany-reference',

            sizeId: '13x5_5',

            label: '13" x 5.5"',

            width: 13,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 8,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-mahogany-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-mahogany-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-mahogany-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'steam-bent-mahogany-reference',

            sizeId: '14x8',

            label: '14" x 8"',

            width: 14,

            depth: 8.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'steam bent',

              primarySpecies: 'mahogany',

              woodSpeciesLabel: 'Mahogany',

              lugQuantity: 10,

              shellThicknessMm: 6,

              shellThicknessBucket: 'thin',

              hoopType: 'Triple Flange',

              finish: 'Natural Oil',

            }),

          }),

        ],

      },

      'solid-maple-reference': {

        typeId: 'solid-maple-reference',

        typeLabel: 'Solid Maple Reference',

        shortLabel: 'Solid Maple',

        shellFamily: 'wood',

        construction: 'solid shell',

        materialLabel: 'Maple',

        benchmarkNotes:

          'A firmer, more direct solid-shell wood reference.',

        defaultSizeId: '14x6',

        sizes: [

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'solid-maple-reference',

            sizeId: '13x5',

            label: '13" x 5"',

            width: 13,

            depth: 5.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'solid shell',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 8,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Satin Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'solid-maple-reference',

            sizeId: '14x5_5',

            label: '14" x 5.5"',

            width: 14,

            depth: 5.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'solid shell',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Satin Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'solid-maple-reference',

            sizeId: '14x6',

            label: '14" x 6"',

            width: 14,

            depth: 6.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'solid shell',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Satin Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'solid-maple-reference',

            sizeId: '14x6_5',

            label: '14" x 6.5"',

            width: 14,

            depth: 6.5,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'solid shell',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Satin Oil',

            }),

          }),

          createSizeDefinition({

            familyId: 'solid-steambent',

            typeId: 'solid-maple-reference',

            sizeId: '14x7',

            label: '14" x 7"',

            width: 14,

            depth: 7.0,

            spec: withDefaultSetup({

              shellFamily: 'wood',

              construction: 'solid shell',

              primarySpecies: 'maple',

              woodSpeciesLabel: 'Maple',

              lugQuantity: 10,

              shellThicknessMm: 10,

              shellThicknessBucket: 'medium',

              hoopType: 'Triple Flange',

              finish: 'Satin Oil',

            }),

          }),

        ],

      },

    },

  },

});

export const BENCHMARK_FAMILY_OPTIONS = Object.freeze(

  Object.values(BENCHMARK_DEFINITIONS).map((family) => ({

    familyId: family.familyId,

    familyLabel: family.familyLabel,

    familyDescription: family.familyDescription,

    defaultTypeId: family.defaultTypeId,

  }))

);

export function getBenchmarkFamily(familyId) {

  return BENCHMARK_DEFINITIONS[familyId] || null;

}

export function getBenchmarkType(familyId, typeId) {

  const family = getBenchmarkFamily(familyId);

  if (!family) return null;

  return family.types?.[typeId] || null;

}

export function getBenchmarkSize(familyId, typeId, sizeId) {

  const type = getBenchmarkType(familyId, typeId);

  if (!type) return null;

  return type.sizes.find((size) => size.sizeId === sizeId) || null;

}

export function getDefaultBenchmarkSelection() {

  const familyId = 'oberCustom';

  const family = getBenchmarkFamily(familyId);

  const typeId = family?.defaultTypeId || 'heritage-oak-reference';

  const type = getBenchmarkType(familyId, typeId);

  const sizeId = type?.defaultSizeId || '14x5_5';

  return {

    familyId,

    typeId,

    sizeId,

  };

}

export function buildBenchmarkSpec(selection = {}) {

  const familyId = selection.familyId || 'oberCustom';

  const family = getBenchmarkFamily(familyId);

  const typeId = selection.typeId || family?.defaultTypeId;

  const type = getBenchmarkType(familyId, typeId);

  const sizeId = selection.sizeId || type?.defaultSizeId;

  const size = getBenchmarkSize(familyId, typeId, sizeId);

  if (!family || !type || !size) return null;

  return {

    benchmarkId: `${family.familyId}:${type.typeId}:${size.sizeId}`,

    familyId: family.familyId,

    familyLabel: family.familyLabel,

    typeId: type.typeId,

    typeLabel: type.typeLabel,

    shortLabel: type.shortLabel,

    sizeId: size.sizeId,

    sizeLabel: size.label,

    imagePath: size.imagePath,

    notes: type.benchmarkNotes,

    spec: { ...size.spec },

  };

}

export default BENCHMARK_DEFINITIONS;