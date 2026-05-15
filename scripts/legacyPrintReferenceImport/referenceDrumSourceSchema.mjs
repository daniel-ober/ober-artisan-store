// scripts/legacyPrintReferenceImport/referenceDrumSourceSchema.mjs

export const REQUIRED_NORMALIZED_REFERENCE_FIELDS = [

  'id',

  'companyType',

  'companyName',

  'lineName',

  'modelName',

  'drumType',

  'sizes',

  'shellConstruction',

  'shellMaterial',

  'shellThickness',

  'hoopType',

  'bearingEdge',

  'snareWires',

  'batterHead',

  'resoHead',

  'finishTreatment',

  'era',

  'sourceUrls',

  'confidence',

  'notes',

];

export const VALID_COMPANY_TYPES = [

  'Generic / Baseline Reference',

  'Major Manufacturer',

  'Boutique Builder',

  'Independent Builder',

];

export const VALID_DRUM_TYPES = [

  'Snare',

  'Rack Tom',

  'Floor Tom',

  'Bass Drum',

  'Overall Kit / Line Sound',

];

export const VALID_SHELL_CONSTRUCTIONS = [

  'Ply',

  'Stave',

  'Steam Bent',

  'Solid',

  'Metal',

  'Acrylic',

  'Hybrid',

  'Other',

];

export const VALID_CONFIDENCE_LEVELS = [

  'Confirmed Manufacturer Spec',

  'Confirmed Catalog Spec',

  'Known Common Spec',

  'Estimated / Modeled',

  'Needs Verification',

];

export const makeSlug = (value = '') => {

  return String(value || '')

    .toLowerCase()

    .replace(/[øØ]/g, 'o')

    .replace(/&/g, 'and')

    .replace(/[^a-z0-9]+/g, '-')

    .replace(/^-+|-+$/g, '');

};

export const buildReferenceId = ({

  companyName = '',

  lineName = '',

  modelName = '',

  drumType = '',

  shellConstruction = '',

  shellMaterial = '',

}) => {

  return [

    companyName || 'baseline',

    lineName,

    modelName,

    drumType,

    shellConstruction,

    shellMaterial,

  ]

    .map(makeSlug)

    .filter(Boolean)

    .join('-');

};