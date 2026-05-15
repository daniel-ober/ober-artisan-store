// src/data/legacyPrint/referenceDrums/referenceDrumSchema.js

export const REFERENCE_DRUM_COMPANY_TYPES = [

  'Generic / Baseline Reference',

  'Major Manufacturer',

  'Boutique Builder',

  'Independent Builder',

];

export const REFERENCE_DRUM_TYPES = [

  'Snare',

  'Rack Tom',

  'Floor Tom',

  'Bass Drum',

  'Overall Kit / Line Sound',

];

export const REFERENCE_SHELL_CONSTRUCTIONS = [

  'Ply',

  'Stave',

  'Steam Bent',

  'Solid',

  'Metal',

  'Acrylic',

  'Hybrid',

  'Other',

];

export const REFERENCE_CONFIDENCE_LEVELS = [

  'Confirmed Manufacturer Spec',

  'Confirmed Catalog Spec',

  'Known Common Spec',

  'Estimated / Modeled',

  'Needs Verification',

];

export const createReferenceDrumRecord = ({

  id,

  companyType,

  companyName = '',

  lineName = '',

  modelName = '',

  drumType = 'Snare',

  sizes = [],

  shellConstruction = '',

  shellMaterial = '',

  shellThickness = '',

  plyCount = '',

  reinforcementRings = '',

  hoopType = '',

  bearingEdge = '',

  snareWires = '',

  batterHead = '',

  resoHead = '',

  finishTreatment = '',

  era = '',

  sourceUrls = [],

  confidence = 'Needs Verification',

  notes = '',

}) => ({

  id,

  companyType,

  companyName,

  lineName,

  modelName,

  drumType,

  sizes,

  shellConstruction,

  shellMaterial,

  shellThickness,

  plyCount,

  reinforcementRings,

  hoopType,

  bearingEdge,

  snareWires,

  batterHead,

  resoHead,

  finishTreatment,

  era,

  sourceUrls,

  confidence,

  notes,

});