// src/data/legacyPrint/snareReferenceDrums/bakedSchema.js

export const SNARE_REFERENCE_SCHEMA_VERSION = '2026-05-17-v1';

export const snareReferenceSchemaTemplate = {

  companyName: 'unknown',

  companyType: 'unknown',

  lineSeries: 'unknown',

  modelName: 'unknown',

  patchName: 'unknown',

  identification: {

    modelNumber: 'unknown',

    badgeStyle: 'unknown',

    productionStatus: 'unknown',

    currentlyInProduction: 'unknown',

    discontinued: 'unknown',

    artistSignature: 'unknown',

    rareCollectible: 'unknown',

  },

  shell: {

    drumType: 'snare',

    dimensions: {

      diameterInches: null,

      depthInches: null,

      metricDimensionsMm: 'unknown',

    },

    construction: {

      shellConstruction: 'unknown',

      shellMaterialPrimary: 'unknown',

      shellMaterialSecondary: 'none',

      shellMaterialTertiary: 'none',

      plyCount: null,

      layupDescription: 'unknown',

      shellThicknessMm: null,

      thicknessClass: 'unknown',

      reinforcementRings: 'unknown',

      reinforcementRingMaterial: 'unknown',

      reinforcementRingThicknessMm: null,

    },

    bearingEdges: {

      batterSideProfile: 'unknown',

      snareSideProfile: 'unknown',

      roundover: 'unknown',

      evidenceLevel: 'notVerified',

      confidence: 'low',

      notes: 'unknown',

    },

    snareBeds: {

      present: 'unknown',

      depthBucket: 'unknown',

      widthBucket: 'unknown',

      bedStyle: 'unknown',

      evidenceLevel: 'notVerified',

      confidence: 'low',

      notes: 'unknown',

    },

    finish: {

      finishName: 'unknown',

      finishType: 'unknown',

      exteriorTreatment: 'unknown',

      interiorTreatment: 'unknown',

      acousticImpact: 'unknown',

      notes: 'unknown',

    },

  },

  stockHardware: {

    hoops: {

      batterHoopType: 'unknown',

      resonantHoopType: 'unknown',

      hoopMaterial: 'unknown',

      hoopThicknessMm: null,

      hoopMassClass: 'unknown',

      hoopFinish: 'unknown',

    },

    lugs: {

      lugCount: null,

      lugCountNotes: 'unknown',

      lugType: 'unknown',

      lugMaterial: 'unknown',

      lugMassClass: 'unknown',

      lugMountingStyle: 'unknown',

      hardwareFinish: 'unknown',

    },

    throwOff: {

      make: 'unknown',

      model: 'unknown',

      style: 'unknown',

      notes: 'unknown',

    },

    buttPlate: {

      make: 'unknown',

      model: 'unknown',

      style: 'unknown',

    },

  },

  stockSnareSystem: {

    snareWires: {

      make: 'unknown',

      model: 'unknown',

      strandCount: null,

      material: 'unknown',

      lengthInches: null,

      stock: 'unknown',

    },

    heads: {

      batterHead: 'unknown',

      resonantHead: 'unknown',

      stockHeadsKnown: 'unknown',

    },

  },

  pricing: {

    originalMsrp: 'researchRequired',

    originalRetailPrice: 'researchRequired',

    currentNewPrice: 'researchRequired',

    currentUsedPriceRange: {

      low: 'researchRequired',

      high: 'researchRequired',

      currency: 'USD',

    },

    lastUpdated: 'researchRequired',

    pricingSources: [],

    priceNotes: 'unknown',

  },

  collectorMetadata: {

    limitedRun: 'unknown',

    limitedRunCount: 'unknown',

    yearIntroduced: 'unknown',

    yearDiscontinued: 'unknown',

    countryOfOrigin: 'unknown',

    productionNotes: 'unknown',

  },

  variants: [],

  snareFacts: ['unknown', 'unknown', 'unknown'],

  sources: {

    primarySourceUrl: 'unknown',

    secondarySourceUrls: [],

    imageUrls: [],

    sourceConfidence: 'unknown',

    notesOnMissingData: [],

    conflictingSourceNotes: [],

  },

  sourceAudit: {

    lastResearched: 'researchRequired',

    researchedBy: 'ChatGPT',

    needsReview: true,

  },

  summary: {

    shortDescription: 'unknown',

    drumSummaryNotes: 'unknown',

  },

};