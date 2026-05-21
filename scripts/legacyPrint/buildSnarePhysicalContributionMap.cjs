
const fs = require('fs');

const TAXONOMY_JSON = 'src/legacyPrint/reviewPlans/snare-taxonomy-preview.json';

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-physical-contribution-map.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-physical-contribution-map.md';

const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_JSON, 'utf8'));

const NODE_KEYS = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control'

];

const emptyNodes = () => Object.fromEntries(NODE_KEYS.map(key => [key, 0]));

const materialContributions = {

  bellBrass: {

    attack: 1.45,

    brightness: 1.2,

    projection: 1.65,

    sustain: 1.35,

    warmth: 0.85,

    sensitivity: -0.15,

    control: 0.55

  },

  brass: {

    attack: 1.05,

    brightness: 0.75,

    projection: 1.15,

    sustain: 0.95,

    warmth: 0.7,

    sensitivity: 0.05,

    control: 0.3

  },

  bronze: {

    attack: 0.9,

    brightness: 0.45,

    projection: 1.05,

    sustain: 1.05,

    warmth: 0.95,

    sensitivity: 0,

    control: 0.35

  },

  copper: {

    attack: 0.6,

    brightness: 0.15,

    projection: 0.7,

    sustain: 0.85,

    warmth: 1.25,

    sensitivity: 0.1,

    control: 0.25

  },

  steel: {

    attack: 1.25,

    brightness: 1.35,

    projection: 1.25,

    sustain: 0.6,

    warmth: -0.35,

    sensitivity: 0.15,

    control: 0.45

  },

  stainlessSteel: {

    attack: 1.3,

    brightness: 1.25,

    projection: 1.3,

    sustain: 0.75,

    warmth: -0.2,

    sensitivity: 0.1,

    control: 0.45

  },

  aluminum: {

    attack: 0.75,

    brightness: 0.35,

    projection: 0.45,

    sustain: -0.35,

    warmth: 0.15,

    sensitivity: 0.45,

    control: 0.85

  },

  titanium: {

    attack: 1.15,

    brightness: 0.9,

    projection: 1.25,

    sustain: 0.4,

    warmth: -0.1,

    sensitivity: 0.25,

    control: 0.65

  },

  maple: {

    attack: 0.65,

    brightness: 0.35,

    projection: 0.55,

    sustain: 0.45,

    warmth: 0.75,

    sensitivity: 0.45,

    control: 0.25

  },

  maplePoplar: {

    attack: 0.45,

    brightness: 0.15,

    projection: 0.35,

    sustain: 0.55,

    warmth: 0.9,

    sensitivity: 0.4,

    control: 0.2

  },

  mapleWalnut: {

    attack: 0.45,

    brightness: 0.1,

    projection: 0.45,

    sustain: 0.6,

    warmth: 1.05,

    sensitivity: 0.25,

    control: 0.35

  },

  birch: {

    attack: 0.85,

    brightness: 0.75,

    projection: 0.75,

    sustain: 0.2,

    warmth: 0.25,

    sensitivity: 0.35,

    control: 0.45

  },

  beech: {

    attack: 0.65,

    brightness: 0.45,

    projection: 0.75,

    sustain: 0.45,

    warmth: 0.55,

    sensitivity: 0.35,

    control: 0.35

  },

  mahogany: {

    attack: 0.25,

    brightness: -0.2,

    projection: 0.2,

    sustain: 0.55,

    warmth: 1.25,

    sensitivity: 0.35,

    control: 0.1

  },

  mahoganyPoplar: {

    attack: 0.2,

    brightness: -0.25,

    projection: 0.15,

    sustain: 0.65,

    warmth: 1.35,

    sensitivity: 0.35,

    control: 0.05

  },

  walnut: {

    attack: 0.45,

    brightness: 0.05,

    projection: 0.45,

    sustain: 0.6,

    warmth: 1.1,

    sensitivity: 0.25,

    control: 0.35

  },

  oak: {

    attack: 0.8,

    brightness: 0.45,

    projection: 0.9,

    sustain: 0.35,

    warmth: 0.55,

    sensitivity: 0.15,

    control: 0.45

  },

  cherry: {

    attack: 0.55,

    brightness: 0.25,

    projection: 0.45,

    sustain: 0.65,

    warmth: 0.85,

    sensitivity: 0.35,

    control: 0.25

  },

  bubinga: {

    attack: 0.75,

    brightness: 0.4,

    projection: 1.0,

    sustain: 0.65,

    warmth: 0.85,

    sensitivity: 0.15,

    control: 0.45

  },

  poplar: {

    attack: 0.25,

    brightness: -0.1,

    projection: 0.15,

    sustain: 0.5,

    warmth: 0.85,

    sensitivity: 0.35,

    control: 0.15

  },

  acrylic: {

    attack: 0.85,

    brightness: 0.65,

    projection: 0.95,

    sustain: 1.05,

    warmth: -0.35,

    sensitivity: 0.05,

    control: 0.15

  },

  genericWood: {

    attack: 0.4,

    brightness: 0.15,

    projection: 0.35,

    sustain: 0.45,

    warmth: 0.65,

    sensitivity: 0.35,

    control: 0.2

  },

  otherMaterial: emptyNodes(),

  unknownMaterial: emptyNodes()

};

const constructionContributions = {

  metal: {

    attack: 0.65,

    brightness: 0.55,

    projection: 0.75,

    sustain: 0.45,

    warmth: -0.15,

    sensitivity: -0.05,

    control: 0.25

  },

  castMetal: {

    attack: 0.9,

    brightness: 0.6,

    projection: 1.1,

    sustain: 0.8,

    warmth: 0,

    sensitivity: -0.15,

    control: 0.4

  },

  seamlessMetal: {

    attack: 0.65,

    brightness: 0.45,

    projection: 0.8,

    sustain: 0.65,

    warmth: 0.05,

    sensitivity: 0.05,

    control: 0.25

  },

  beadedMetal: {

    attack: 0.7,

    brightness: 0.55,

    projection: 0.75,

    sustain: 0.35,

    warmth: -0.05,

    sensitivity: 0.0,

    control: 0.45

  },

  ply: {

    attack: 0.35,

    brightness: 0.15,

    projection: 0.35,

    sustain: 0.35,

    warmth: 0.35,

    sensitivity: 0.35,

    control: 0.25

  },

  plyWithReinforcementRings: {

    attack: 0.35,

    brightness: 0.05,

    projection: 0.45,

    sustain: 0.5,

    warmth: 0.65,

    sensitivity: 0.15,

    control: 0.35

  },

  solidShell: {

    attack: 0.35,

    brightness: 0.0,

    projection: 0.45,

    sustain: 0.75,

    warmth: 1.05,

    sensitivity: 0.45,

    control: 0.1

  },

  steamBent: {

    attack: 0.3,

    brightness: -0.05,

    projection: 0.4,

    sustain: 0.85,

    warmth: 1.1,

    sensitivity: 0.45,

    control: 0.05

  },

  stave: {

    attack: 0.8,

    brightness: 0.35,

    projection: 0.95,

    sustain: 0.55,

    warmth: 0.75,

    sensitivity: 0.25,

    control: 0.45

  },

  block: {

    attack: 0.65,

    brightness: 0.25,

    projection: 0.8,

    sustain: 0.65,

    warmth: 0.8,

    sensitivity: 0.2,

    control: 0.4

  },

  acrylic: {

    attack: 0.65,

    brightness: 0.55,

    projection: 0.7,

    sustain: 0.75,

    warmth: -0.25,

    sensitivity: 0.05,

    control: 0.15

  },

  hybrid: {

    attack: 0.45,

    brightness: 0.25,

    projection: 0.55,

    sustain: 0.45,

    warmth: 0.45,

    sensitivity: 0.25,

    control: 0.3

  },

  composite: {

    attack: 0.45,

    brightness: 0.3,

    projection: 0.55,

    sustain: 0.35,

    warmth: 0.15,

    sensitivity: 0.2,

    control: 0.35

  },

  otherConstruction: emptyNodes(),

  unknownConstruction: emptyNodes()

};

const bearingEdgeContributions = {

  sharper45Degree: {

    attack: 0.95,

    brightness: 0.5,

    projection: 0.25,

    sustain: 0.45,

    warmth: -0.2,

    sensitivity: 0.8,

    control: 0.2

  },

  rounder30Degree: {

    attack: 0.2,

    brightness: -0.15,

    projection: 0.15,

    sustain: 0.65,

    warmth: 0.75,

    sensitivity: 0.45,

    control: 0.15

  },

  roundedVintage: {

    attack: 0.05,

    brightness: -0.25,

    projection: 0.05,

    sustain: 0.75,

    warmth: 0.9,

    sensitivity: 0.35,

    control: 0.0

  },

  rolledOrFormedMetal: {

    attack: 0.55,

    brightness: 0.35,

    projection: 0.35,

    sustain: 0.35,

    warmth: -0.05,

    sensitivity: 0.25,

    control: 0.35

  },

  machinedMetal: {

    attack: 0.75,

    brightness: 0.45,

    projection: 0.5,

    sustain: 0.45,

    warmth: -0.05,

    sensitivity: 0.35,

    control: 0.4

  },

  machinedCastMetal: {

    attack: 0.85,

    brightness: 0.5,

    projection: 0.65,

    sustain: 0.6,

    warmth: 0.0,

    sensitivity: 0.25,

    control: 0.45

  },

  tamaWoodEdge: {

    attack: 0.65,

    brightness: 0.35,

    projection: 0.25,

    sustain: 0.35,

    warmth: 0.15,

    sensitivity: 0.55,

    control: 0.25

  },

  tamaStarclassicEdge: {

    attack: 0.8,

    brightness: 0.45,

    projection: 0.35,

    sustain: 0.25,

    warmth: 0.05,

    sensitivity: 0.55,

    control: 0.45

  },

  mapexSonicClear: {

    attack: 0.55,

    brightness: 0.25,

    projection: 0.2,

    sustain: 0.55,

    warmth: 0.25,

    sensitivity: 0.6,

    control: 0.25

  },

  canopusPrecisionEdge: {

    attack: 0.55,

    brightness: 0.25,

    projection: 0.15,

    sustain: 0.55,

    warmth: 0.25,

    sensitivity: 0.85,

    control: 0.15

  },

  ludwigFamilyEdge: {

    attack: 0.35,

    brightness: 0.05,

    projection: 0.2,

    sustain: 0.55,

    warmth: 0.55,

    sensitivity: 0.45,

    control: 0.15

  },

  acrylicEdge: {

    attack: 0.65,

    brightness: 0.45,

    projection: 0.3,

    sustain: 0.5,

    warmth: -0.15,

    sensitivity: 0.35,

    control: 0.2

  },

  objectBearingEdgeNeedsFlattening: {

    attack: 0.25,

    brightness: 0.1,

    projection: 0.15,

    sustain: 0.25,

    warmth: 0.1,

    sensitivity: 0.25,

    control: 0.15

  },

  otherBearingEdge: emptyNodes(),

  unknownBearingEdge: emptyNodes()

};

const hoopContributions = {

  dieCast: {

    attack: 0.85,

    brightness: 0.45,

    projection: 0.55,

    sustain: -0.25,

    warmth: -0.15,

    sensitivity: -0.1,

    control: 1.0

  },

  tripleFlanged: {

    attack: 0.35,

    brightness: 0.25,

    projection: 0.25,

    sustain: 0.45,

    warmth: 0.15,

    sensitivity: 0.25,

    control: 0.2

  },

  inwardFlangedControlHoop: {

    attack: 0.55,

    brightness: 0.25,

    projection: 0.35,

    sustain: 0.1,

    warmth: 0.0,

    sensitivity: 0.1,

    control: 0.75

  },

  gretsch302: {

    attack: 0.45,

    brightness: 0.2,

    projection: 0.3,

    sustain: 0.25,

    warmth: 0.2,

    sensitivity: 0.2,

    control: 0.5

  },

  tamaGroovedHoop: {

    attack: 0.55,

    brightness: 0.25,

    projection: 0.35,

    sustain: 0.15,

    warmth: 0.0,

    sensitivity: 0.1,

    control: 0.65

  },

  woodHoop: {

    attack: -0.05,

    brightness: -0.3,

    projection: 0.0,

    sustain: 0.55,

    warmth: 0.8,

    sensitivity: 0.15,

    control: 0.35

  },

  brassHoop: {

    attack: 0.45,

    brightness: 0.3,

    projection: 0.35,

    sustain: 0.35,

    warmth: 0.3,

    sensitivity: 0.1,

    control: 0.35

  },

  vintageFlangedHoop: {

    attack: 0.2,

    brightness: 0.1,

    projection: 0.15,

    sustain: 0.55,

    warmth: 0.25,

    sensitivity: 0.3,

    control: 0.05

  },

  otherHoop: emptyNodes(),

  unknownHoop: emptyNodes()

};

const componentWeights = {

  shellMaterial: 1.0,

  shellConstruction: 0.9,

  diameter: 0.75,

  depth: 0.85,

  shellThickness: 0.9,

  bearingEdge: 0.65,

  hoopType: 0.45,

  lugCount: 0.2,

  snareBed: 0.35,

  stockHeads: 0.0,

  stockSnareWires: 0.0,

  productionStatus: 0.0,

  brand: 0.0

};

const packet = {

  status: 'SNARE_PHYSICAL_CONTRIBUTION_MAP_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  firestoreWrites: 0,

  summary: taxonomy.summary,

  nodes: NODE_KEYS,

  doctrine: {

    stockHeadsBlockPromotion: false,

    stockSnareWiresBlockPromotion: false,

    brandIsNotPrimaryScoringDriver: true,

    brandSpecificMultipliersAllowedOnlyForPhysicalBuildBehavior: true,

    scoringWritesAllowed: false

  },

  componentWeights,

  familyContributions: {

    shellMaterial: materialContributions,

    shellConstruction: constructionContributions,

    bearingEdge: bearingEdgeContributions,

    hoopType: hoopContributions

  },

  nextCalibrationTargets: [

    'Bell brass should read high projection, attack, brightness, and sustain.',

    'Aluminum should read faster/drier/more controlled than brass.',

    'Deep 14x8 records should gain warmth, projection, and sustain versus 14x5 records.',

    'Die-cast hoops should add attack/control and reduce openness/sustain slightly.',

    'Rounded/vintage bearing edges should add warmth/sustain and soften attack/brightness.',

    '45-degree edges should add attack, sensitivity, brightness, and articulation.',

    'Thin shells should generally gain sensitivity/resonance; thicker shells should gain projection/control.'

  ]

};

fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

const nodeTable = obj => [

  '| Family | Attack | Brightness | Projection | Sustain | Warmth | Sensitivity | Control |',

  '|---|---:|---:|---:|---:|---:|---:|---:|',

  ...Object.entries(obj).map(([family, scores]) => (

    `| ${family} | ${scores.attack || 0} | ${scores.brightness || 0} | ${scores.projection || 0} | ${scores.sustain || 0} | ${scores.warmth || 0} | ${scores.sensitivity || 0} | ${scores.control || 0} |`

  ))

].join('\n');

const md = [

  '# LegacyPrint Snare Physical Contribution Map',

  '',

  `Generated: ${packet.generatedAt}`,

  '',

  '## Summary',

  '',

  `- Total Firestore records: ${packet.summary.totalFirestoreRecords}`,

  `- Engine-promoted records: ${packet.summary.enginePromotedRecords}`,

  '- Firestore writes: 0',

  '',

  '## Component Weights',

  '',

  '| Component | Weight |',

  '|---|---:|',

  ...Object.entries(componentWeights).map(([component, weight]) => `| ${component} | ${weight} |`),

  '',

  '## Shell Material Contributions',

  '',

  nodeTable(materialContributions),

  '',

  '## Shell Construction Contributions',

  '',

  nodeTable(constructionContributions),

  '',

  '## Bearing Edge Contributions',

  '',

  nodeTable(bearingEdgeContributions),

  '',

  '## Hoop Type Contributions',

  '',

  nodeTable(hoopContributions),

  '',

  '## Calibration Targets',

  '',

  ...packet.nextCalibrationTargets.map(item => `- ${item}`)

].join('\n');

fs.writeFileSync(OUT_MD, md);

console.log(JSON.stringify({

  outJson: OUT_JSON,

  outMd: OUT_MD,

  status: packet.status,

  firestoreWrites: 0,

  summary: packet.summary

}, null, 2));

